import { Obra, Domain, AuditLog, OverrideRecord, GateDetail } from "../types/obra";
import { validateTransition, checkIntegrity } from "./gatesService";
import { createAuditEvent } from "./auditService";

// Manual config validation (replaces zod since zod v4 has install issues)
function validateConfig(config: any): { success: boolean; error?: { message: string } } {
  if (typeof config !== 'object' || config === null) {
    return { success: false, error: { message: 'Config must be an object' } };
  }
  const requiredBoolFields = ['requiereAlmacen', 'requiereFirmaCliente', 'requiereFotosPrevia', 'requiereFotosPosterior'];
  const keys = Object.keys(config);
  
  // Strict: no extra keys allowed
  for (const key of keys) {
    if (!requiredBoolFields.includes(key)) {
      return { success: false, error: { message: `Unexpected key: ${key}` } };
    }
  }
  for (const field of requiredBoolFields) {
    if (typeof config[field] !== 'boolean') {
      return { success: false, error: { message: `${field} must be a boolean` } };
    }
  }
  return { success: true };
}

export interface User {
  id: string;
  name: string;
  role: string;
  tenantId: string;
}

export interface TransitionRequest {
  obra: Obra;
  domain: Domain;
  to: any;
  reason?: string;
  override?: boolean;
  version: number;
  user: User;
  prevHash: string; // Requerido para la cadena de integridad
  seq: number;      // Secuencial incremental
}

export interface TransitionResponse {
  success: boolean;
  newState?: any;
  newVersion?: number;
  auditLog?: AuditLog; // Devolvemos el log completo para que el server lo guarde
  gatesTriggered?: GateDetail[];
  anomalies?: string[];
  error?: {
    code: 'FORBIDDEN' | 'CONFLICT' | 'SOFT_GATE_REQUIRED' | 'HARD_GATE_BLOCKED' | 'INTERNAL_ERROR';
    message: string;
    gates?: GateDetail[];
    currentVersion?: number;
    requiredRoles?: string[];
  };
}

export interface ConfigChangeRequest {
  obra: Obra;
  newConfig: any;
  reason: string;
  version: number;
  user: User;
  prevHash: string;
  seq: number;
}

export function processConfigChange(req: ConfigChangeRequest): TransitionResponse {
  const { obra, newConfig, reason, version, user, prevHash, seq } = req;

  // 1. Validar Tenant
  if (obra.tenantId !== user.tenantId) {
    return { 
      success: false, 
      error: { code: 'FORBIDDEN', message: "Acceso denegado: Tenant incorrecto." }
    };
  }

  // 2. Validar Rol (Solo ADMIN o BACKOFFICE pueden cambiar config)
  if (!['ADMIN', 'BACKOFFICE'].includes(user.role)) {
    return { 
      success: false, 
      error: { code: 'FORBIDDEN', message: "Solo personal de Administración puede modificar la configuración de la obra." }
    };
  }

  // 3. Validar Esquema de Configuración
  const validation = validateConfig(newConfig);
  if (!validation.success) {
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: `Configuración inválida: ${validation.error?.message}` }
    };
  }

  // 4. Optimistic Locking
  if (obra.version !== version) {
    return { 
      success: false, 
      error: { code: 'CONFLICT', message: "Conflicto de versión.", currentVersion: obra.version }
    };
  }

  // 5. Aplicar cambio y auditar
  const updatedObra = { ...obra, config: { ...newConfig }, version: obra.version + 1 };
  
  const auditEntry = createAuditEvent({
    obraId: obra.id,
    tenantId: obra.tenantId,
    userId: user.id,
    userNameSnapshot: user.name,
    action: 'CONFIG_CHANGE',
    domain: 'global',
    fromState: JSON.stringify(obra.config),
    toState: JSON.stringify(newConfig),
    prevHash,
    seq,
    metadata: {
      reason,
      version: updatedObra.version,
      appVersion: '1.0.0-mvp',
      deviceId: 'web-browser-client',
      configSnapshot: newConfig
    }
  });

  return {
    success: true,
    newState: newConfig,
    newVersion: updatedObra.version,
    auditLog: auditEntry
  };
}
export function processStateTransition(req: TransitionRequest): TransitionResponse {
  const { obra, domain, to, reason, override, version, user, prevHash, seq } = req;

  // 1. Validar Tenant
  if (obra.tenantId !== user.tenantId) {
    return { 
      success: false, 
      error: {
        code: 'FORBIDDEN',
        message: "Acceso denegado: El usuario no pertenece al tenant de la obra."
      }
    };
  }

  // 2. Optimistic Locking (Versionado)
  if (obra.version !== version) {
    return { 
      success: false, 
      error: {
        code: 'CONFLICT',
        message: "Conflicto de versión: La obra ha sido modificada por otro usuario.",
        currentVersion: obra.version
      }
    };
  }

  // 3. Evaluar Gates
  const gateResult = validateTransition(obra, domain, to, user.role);

  let canProceed = gateResult.allowed;
  let isOverride = false;
  const gatesTriggered = [...gateResult.hardErrors, ...gateResult.softWarnings];

  if (!gateResult.allowed || gateResult.softWarnings.length > 0) {
    if (override && reason) {
      // Verificar si el rol tiene permiso para override
      const hasPermission = !gateResult.overrideRole || gateResult.overrideRole.includes(user.role);
      
      if (hasPermission) {
        canProceed = true;
        isOverride = true;
      } else {
        return { 
          success: false, 
          error: {
            code: 'FORBIDDEN',
            message: "No tienes permisos suficientes para realizar este override.",
            requiredRoles: gateResult.overrideRole,
            gates: gatesTriggered
          }
        };
      }
    } else if (gateResult.hardErrors.length > 0) {
      return { 
        success: false, 
        error: {
          code: 'HARD_GATE_BLOCKED',
          message: "Transición bloqueada por reglas de negocio críticas.",
          gates: gateResult.hardErrors
        }
      };
    } else if (gateResult.softWarnings.length > 0 && !override) {
      return { 
        success: false, 
        error: {
          code: 'SOFT_GATE_REQUIRED',
          message: "Se requiere confirmación y motivo para avanzar con advertencias.",
          gates: gateResult.softWarnings
        }
      };
    }
  }

  if (canProceed) {
    const fromState = (obra as any)[`estado${domain.charAt(0).toUpperCase() + domain.slice(1)}`] || obra.estadoGlobal;
    
    // Actualizar estado
    const updatedObra = { ...obra };
    const stateKey = domain === 'global' ? 'estadoGlobal' : `estado${domain.charAt(0).toUpperCase() + domain.slice(1)}`;
    (updatedObra as any)[stateKey] = to;
    updatedObra.version += 1;
    
    // 4. Escribir Event Log (Audit Trail con Integridad)
    const auditEntry = createAuditEvent({
      obraId: obra.id,
      tenantId: obra.tenantId,
      userId: user.id,
      userNameSnapshot: user.name,
      action: isOverride ? 'OVERRIDE' : 'STATE_CHANGE',
      domain: domain,
      fromState: String(fromState),
      toState: String(to),
      prevHash: req.prevHash,
      seq,
      metadata: {
        reason,
        overrideRole: isOverride ? user.role : undefined,
        gatesTriggered: gatesTriggered,
        version: updatedObra.version,
        appVersion: '1.0.0-mvp',
        deviceId: 'web-browser-client'
      }
    });

    // 5. Devolver nuevo estado y anomalías
    const anomalies = checkIntegrity(updatedObra);

    return {
      success: true,
      newState: to,
      newVersion: updatedObra.version,
      auditLog: auditEntry,
      gatesTriggered,
      anomalies
    };
  }

  return { 
    success: false, 
    error: {
      code: 'INTERNAL_ERROR',
      message: "Error inesperado al procesar la transición."
    }
  };
}
