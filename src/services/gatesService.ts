import { 
  Obra, 
  Domain,
  EstadoOperativo, 
  EstadoFinanciero, 
  EstadoLegalizacion,
  EstadoValidacion,
  EstadoIncidencias,
  EstadoGlobal,
  EstadoCRM,
  GateDetail
} from '../types/obra';

export interface GateResult {
  allowed: boolean;
  hardErrors: GateDetail[];
  softWarnings: GateDetail[];
  requiresOverride?: boolean;
  overrideRole?: string[];
  overrideReason?: string;
}


export const validateTransition = (
  obra: Obra, 
  domain: Domain, 
  nextState: any,
  userRole: string = 'ADMIN'
): GateResult => {
  const result: GateResult = {
    allowed: true,
    hardErrors: [],
    softWarnings: []
  };

  // Macro-estado CANCELADA bloquea todo
  if (obra.estadoGlobal === EstadoGlobal.CANCELADA && domain !== 'global') {
    result.hardErrors.push({
      id: 'G_GLOBAL_CANCEL',
      type: 'HARD',
      message: 'La obra está CANCELADA. No se permiten cambios de estado.'
    });
    result.allowed = false;
    return result;
  }

  // R03: Bloqueo Operativo por Incidencia
  if (obra.estadoIncidencias === EstadoIncidencias.BLOQUEO_CRITICO && 
      (domain === 'operativo' || domain === 'legalizacion')) {
    result.hardErrors.push({
      id: 'G_OP_INCIDENCIA',
      type: 'HARD',
      message: 'Hay un BLOQUEO CRÍTICO activo. No se puede avanzar.',
      field: 'estadoIncidencias'
    });
    result.allowed = false;
    return result;
  }

  const g = obra.gateData;

  if (domain === 'operativo') {
    switch (nextState as EstadoOperativo) {
      case EstadoOperativo.EN_INSTALACION:
        // R04: Integridad de Materiales (Dos capas + Configurable)
        if (obra.config.requiereAlmacen && !g.materialesRecibidosConfirmados) {
          result.hardErrors.push({
            id: 'G_OP_MAT_ALMACEN',
            type: 'HARD',
            message: 'Almacén no ha confirmado la salida de materiales.',
            field: 'materialesRecibidosConfirmados'
          });
        }
        break;

      case EstadoOperativo.FINALIZADA:
        // R02: Garantía de Flujo de Caja
        if (obra.estadoFinanciero === EstadoFinanciero.PENDIENTE_ANTICIPO) {
          result.softWarnings.push({
            id: 'S_OP_ANTICIPO',
            type: 'SOFT',
            message: 'Instalación finalizada sin anticipo cobrado (0%).',
            field: 'estadoFinanciero'
          });
          result.requiresOverride = true;
          result.overrideRole = ['BACKOFFICE', 'ADMIN'];
        }
        // R_CHECKLIST: Checklist técnico
        if (!g.checklistTecnicoCompletado) {
          result.hardErrors.push({
            id: 'G_OP_CHECKLIST',
            type: 'HARD',
            message: 'El checklist técnico no ha sido completado.',
            field: 'checklistTecnicoCompletado'
          });
        }
        // R_FIRMA: Firma del cliente (HARD por defecto, con override restringido)
        if (obra.config.requiereFirmaCliente && !g.firmaCliente) {
          if (['ADMIN', 'JEFE_OBRA'].includes(userRole)) {
            result.softWarnings.push({
              id: 'S_OP_FIRMA_OVERRIDE',
              type: 'SOFT',
              message: 'Falta firma del cliente. Como responsable, puedes forzar el cierre indicando el motivo (ej. acta en papel).',
              field: 'firmaCliente'
            });
            result.requiresOverride = true;
            result.overrideRole = ['ADMIN', 'JEFE_OBRA'];
          } else {
            result.hardErrors.push({
              id: 'G_OP_FIRMA',
              type: 'HARD',
              message: 'Se requiere la firma del cliente para finalizar la obra.',
              field: 'firmaCliente'
            });
          }
        }
        break;
    }
  }

  if (domain === 'legalizacion') {
    switch (nextState as EstadoLegalizacion) {
      case EstadoLegalizacion.PRESENTADO_INDUSTRIA:
        if (obra.estadoValidacion !== EstadoValidacion.APROBADO_TECNICAMENTE) {
          result.softWarnings.push({
            id: 'S_LEG_VALIDACION',
            type: 'SOFT',
            message: 'Intento de legalización sin validación técnica previa.',
            field: 'estadoValidacion'
          });
          result.requiresOverride = true;
          result.overrideRole = ['ADMIN'];
        }
        break;
    }
  }

  if (domain === 'financiero') {
    switch (nextState as EstadoFinanciero) {
      case EstadoFinanciero.PAGADO_TOTAL:
        if (!g.facturasCuadranConPresupuesto) {
          result.softWarnings.push({
            id: 'S_FIN_CUADRE',
            type: 'SOFT',
            message: 'La suma de facturas pagadas es menor al total del presupuesto.',
            field: 'facturasCuadranConPresupuesto'
          });
          result.requiresOverride = true;
          result.overrideRole = ['BACKOFFICE', 'ADMIN'];
        }
        break;
    }
  }

  if (result.hardErrors.length > 0) {
    result.allowed = false;
  }

  return result;
};

export const checkIntegrity = (obra: Obra): string[] => {
  const anomalies: string[] = [];

  // CRM vs Financiero
  if (obra.estadoCrm === EstadoCRM.PERDIDO && obra.estadoFinanciero !== EstadoFinanciero.PENDIENTE_ANTICIPO) {
    anomalies.push('Obra PERDIDA en CRM pero tiene estados financieros avanzados.');
  }

  // Operativo vs Legalizacion
  if (obra.estadoOperativo === EstadoOperativo.FINALIZADA && obra.requiereLegalizacion && obra.estadoLegalizacion === EstadoLegalizacion.NO_INICIADA) {
    anomalies.push('Obra FINALIZADA operativamente pero la legalización ni siquiera ha comenzado.');
  }

  // Global vs Otros
  if (obra.estadoGlobal === EstadoGlobal.CANCELADA && obra.estadoOperativo !== EstadoOperativo.PENDIENTE_VISITA) {
    anomalies.push('Obra CANCELADA globalmente pero el estado operativo muestra progreso.');
  }

  // Validacion vs Operativo
  if (obra.estadoValidacion === EstadoValidacion.APROBADO_TECNICAMENTE && obra.estadoOperativo !== EstadoOperativo.FINALIZADA) {
    anomalies.push('Obra APROBADA TÉCNICAMENTE pero la instalación física no está FINALIZADA.');
  }

  return anomalies;
};
