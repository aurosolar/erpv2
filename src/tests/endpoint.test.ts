import { processStateTransition, processConfigChange, TransitionRequest, ConfigChangeRequest } from "../services/transitionService";
import { Obra, EstadoOperativo, EstadoFinanciero, EstadoGlobal, EstadoValidacion, TipoObra, EstadoCRM, EstadoLegalizacion, EstadoIncidencias } from "../types/obra";
import { verifyChain, getGenesisHash } from "../services/auditService";
import assert from "assert";

const baseObra: Obra = {
  id: 'TEST-001',
  tenantId: 'tenant-1',
  version: 1,
  cliente: 'Test Client',
  direccion: 'Test Address',
  potenciaKw: 5,
  requiereLegalizacion: true,
  tipoObra: TipoObra.FV_ESTANDAR,
  tieneBackup: false,
  tieneOptimizadores: false,
  estadoGlobal: EstadoGlobal.ACTIVA,
  estadoCrm: EstadoCRM.PRESUPUESTO_ENVIADO,
  estadoOperativo: EstadoOperativo.PENDIENTE_VISITA,
  estadoFinanciero: EstadoFinanciero.PENDIENTE_ANTICIPO,
  estadoLegalizacion: EstadoLegalizacion.NO_INICIADA,
  estadoValidacion: EstadoValidacion.PENDIENTE_REVISION,
  estadoIncidencias: EstadoIncidencias.SIN_INCIDENCIAS,
  presupuestoTotal: 5000,
  cobradoHastaAhora: 0,
  documentos: [],
  gateData: {
    presupuestoAceptado: true,
    datosFiscalesCompletos: true,
    materialClaveEstado: 'DISPONIBLE',
    licenciasPendientes: false,
    overrideAnticipo: false,
    documentacionTecnicaPreviaCompleta: true,
    parteFinalCompletado: false,
    evidenciasMinimas: false,
    firmaCliente: false,
    serialesCompletos: false,
    checklistTecnicoCompletado: false,
    defectosCriticos: false,
    overridePagoFinal: false,
    facturasCuadranConPresupuesto: true,
    materialesRecibidosConfirmados: true,
  },
  config: {
    requiereAlmacen: true,
    requiereFirmaCliente: true,
    requiereFotosPrevia: true,
    requiereFotosPosterior: true,
  }
};

console.log("Running Integration Tests for Endpoint Logic...");

// Test 1: Success Transition
const req1: TransitionRequest = {
  obra: { ...baseObra },
  domain: 'operativo',
  to: EstadoOperativo.MATERIALES_PEDIDOS,
  version: 1,
  user: {
    id: 'user-1',
    name: 'Admin User',
    role: 'ADMIN',
    tenantId: 'tenant-1'
  },
  prevHash: 'GENESIS',
  seq: 1
};
const res1 = processStateTransition(req1);
assert.strictEqual(res1.success, true);
assert.strictEqual(res1.newState, EstadoOperativo.MATERIALES_PEDIDOS);
assert.strictEqual(res1.newVersion, 2);
assert.ok(res1.auditLog);
console.log("✅ Test 1: Success Transition passed");

// Test 2: Version Conflict (Optimistic Locking)
const req2: TransitionRequest = {
  ...req1,
  version: 0 // Wrong version
};
const res2 = processStateTransition(req2);
assert.strictEqual(res2.success, false);
assert.strictEqual(res2.error?.code, 'CONFLICT');
console.log("✅ Test 2: Version Conflict passed");

// Test 3: Tenant Mismatch
const req3: TransitionRequest = {
  ...req1,
  user: { ...req1.user, tenantId: 'tenant-wrong' }
};
const res3 = processStateTransition(req3);
assert.strictEqual(res3.success, false);
assert.strictEqual(res3.error?.code, 'FORBIDDEN');
console.log("✅ Test 3: Tenant Mismatch passed");

// Test 4: Soft Gate with Override
const req4: TransitionRequest = {
  obra: { 
    ...baseObra, 
    estadoOperativo: EstadoOperativo.EN_INSTALACION,
    gateData: { ...baseObra.gateData, checklistTecnicoCompletado: true }
  },
  domain: 'operativo',
  to: EstadoOperativo.FINALIZADA,
  version: 1,
  user: {
    id: 'user-1',
    name: 'Admin User',
    role: 'ADMIN',
    tenantId: 'tenant-1'
  },
  override: true,
  reason: 'Urgencia del cliente',
  prevHash: 'GENESIS',
  seq: 1
};
const res4 = processStateTransition(req4);
assert.strictEqual(res4.success, true, "Should allow with override and reason");
assert.ok(res4.auditLog);
console.log("✅ Test 4: Soft Gate with Override passed");

// Test 5: Soft Gate without Override (Should fail with requiresOverride)
const req5: TransitionRequest = {
  ...req4,
  override: false
};
const res5 = processStateTransition(req5);
assert.strictEqual(res5.success, false);
assert.strictEqual(res5.error?.code, 'SOFT_GATE_REQUIRED');
console.log("✅ Test 5: Soft Gate without Override passed");

// Test 6: Config Change (Authorized)
const req6: ConfigChangeRequest = {
  obra: { ...baseObra },
  newConfig: { ...baseObra.config, requiereAlmacen: false },
  reason: 'Obra pequeña sin almacén central',
  version: 1,
  user: { id: 'admin-1', name: 'Admin', role: 'ADMIN', tenantId: 'tenant-1' },
  prevHash: getGenesisHash(baseObra.id),
  seq: 1
};
const res6 = processConfigChange(req6);
assert.strictEqual(res6.success, true);
assert.strictEqual(res6.auditLog?.action, 'CONFIG_CHANGE');
console.log("✅ Test 6: Config Change Authorized passed");

// Test 7: Config Change (Unauthorized Role)
const req7: ConfigChangeRequest = {
  ...req6,
  user: { ...req6.user, role: 'INSTALADOR' }
};
const res7 = processConfigChange(req7);
assert.strictEqual(res7.success, false);
assert.strictEqual(res7.error?.code, 'FORBIDDEN');
console.log("✅ Test 7: Config Change Unauthorized Role passed");

// Test 8: Audit Chain Verification
const logs = [res6.auditLog!];
const verification = verifyChain(logs);
assert.strictEqual(verification.isValid, true);
console.log("✅ Test 8: Audit Chain Verification passed");

console.log("All Integration Tests Passed!");
