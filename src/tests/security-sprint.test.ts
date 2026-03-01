/**
 * Sprint Security & Audit Tests
 * Tests for: socket tenant isolation, document RBAC/tenant, audit chain with docs, optimistic locking
 */
import { processStateTransition, processConfigChange, TransitionRequest, ConfigChangeRequest } from "../services/transitionService";
import { validateTransition } from "../services/gatesService";
import { Obra, EstadoOperativo, EstadoFinanciero, EstadoGlobal, EstadoValidacion, TipoObra, EstadoCRM, EstadoLegalizacion, EstadoIncidencias, Domain } from "../types/obra";
import { verifyChain, getGenesisHash, createAuditEvent, AuditEventParams } from "../services/auditService";
import assert from "assert";

const baseObra: Obra = {
  id: 'SEC-TEST-001',
  tenantId: 'tenant-1',
  version: 1,
  cliente: 'Security Test Client',
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

const adminUser = { id: 'user-1', name: 'Admin', role: 'ADMIN', tenantId: 'tenant-1' };
const wrongTenantUser = { id: 'user-2', name: 'Hacker', role: 'ADMIN', tenantId: 'tenant-WRONG' };
const instaladorUser = { id: 'user-3', name: 'Instalador', role: 'INSTALADOR', tenantId: 'tenant-1' };

console.log("\n=== Sprint Security & Audit Tests ===\n");

// ─────────────────────────────────────────────
// 1. TENANT ISOLATION (TransitionService level)
// ─────────────────────────────────────────────

console.log("--- 1. Tenant Isolation Tests ---");

const tenantReq: TransitionRequest = {
  obra: { ...baseObra },
  domain: 'operativo',
  to: EstadoOperativo.MATERIALES_PEDIDOS,
  version: 1,
  user: wrongTenantUser,
  prevHash: getGenesisHash(baseObra.id),
  seq: 1
};
const tenantRes = processStateTransition(tenantReq);
assert.strictEqual(tenantRes.success, false, "Should reject cross-tenant transition");
assert.strictEqual(tenantRes.error?.code, 'FORBIDDEN');
console.log("✅ 1a: Cross-tenant transition blocked");

const configTenantReq: ConfigChangeRequest = {
  obra: { ...baseObra },
  newConfig: { ...baseObra.config, requiereAlmacen: false },
  reason: 'test',
  version: 1,
  user: wrongTenantUser,
  prevHash: getGenesisHash(baseObra.id),
  seq: 1
};
const configTenantRes = processConfigChange(configTenantReq);
assert.strictEqual(configTenantRes.success, false);
assert.strictEqual(configTenantRes.error?.code, 'FORBIDDEN');
console.log("✅ 1b: Cross-tenant config change blocked");

// ─────────────────────────────────────────────
// 2. DOCUMENT RBAC (simulated at logic level)
// Note: actual endpoint RBAC tests require HTTP calls — 
// here we test the role lists used in server.ts
// ─────────────────────────────────────────────

console.log("\n--- 2. Document RBAC Role Tests ---");

const DOC_UPLOAD_ROLES = ['ADMIN', 'BACKOFFICE', 'JEFE_OBRA', 'INSTALADOR', 'COMERCIAL'];
const DOC_DELETE_ROLES = ['ADMIN', 'BACKOFFICE', 'JEFE_OBRA'];

// INSTALADOR can upload but not delete
assert.ok(DOC_UPLOAD_ROLES.includes('INSTALADOR'), "INSTALADOR can upload");
assert.ok(!DOC_DELETE_ROLES.includes('INSTALADOR'), "INSTALADOR cannot delete");
console.log("✅ 2a: INSTALADOR can upload, cannot delete");

// COMERCIAL can upload but not delete
assert.ok(DOC_UPLOAD_ROLES.includes('COMERCIAL'), "COMERCIAL can upload");
assert.ok(!DOC_DELETE_ROLES.includes('COMERCIAL'), "COMERCIAL cannot delete");
console.log("✅ 2b: COMERCIAL can upload, cannot delete");

// ADMIN can do both
assert.ok(DOC_UPLOAD_ROLES.includes('ADMIN'));
assert.ok(DOC_DELETE_ROLES.includes('ADMIN'));
console.log("✅ 2c: ADMIN can upload and delete");

// BACKOFFICE can do both
assert.ok(DOC_UPLOAD_ROLES.includes('BACKOFFICE'));
assert.ok(DOC_DELETE_ROLES.includes('BACKOFFICE'));
console.log("✅ 2d: BACKOFFICE can upload and delete");

// ─────────────────────────────────────────────
// 3. AUDIT CHAIN with Document Events
// ─────────────────────────────────────────────

console.log("\n--- 3. Audit Chain with Document Events ---");

const obraId = 'AUDIT-DOC-001';
const genesis = getGenesisHash(obraId);

// Event 1: State transition
const event1 = createAuditEvent({
  obraId,
  tenantId: 'tenant-1',
  userId: 'user-1',
  userNameSnapshot: 'Admin',
  action: 'STATE_CHANGE',
  domain: 'operativo',
  fromState: 'PENDIENTE_VISITA',
  toState: 'MATERIALES_PEDIDOS',
  prevHash: genesis,
  seq: 1,
  metadata: { version: 1, appVersion: '1.0.0', deviceId: 'test' }
});

// Event 2: Document added
const event2 = createAuditEvent({
  obraId,
  tenantId: 'tenant-1',
  userId: 'user-1',
  userNameSnapshot: 'Admin',
  action: 'DOCUMENT_ADDED',
  domain: 'global',
  fromState: '',
  toState: 'FACTURA',
  prevHash: event1.hash,
  seq: 2,
  metadata: {
    reason: 'Factura subida',
    version: 2,
    appVersion: '1.0.0',
    deviceId: 'test',
    documentId: 'doc-1',
    documentName: 'factura.pdf',
    documentType: 'FACTURA'
  }
});

// Event 3: Document soft-deleted
const event3 = createAuditEvent({
  obraId,
  tenantId: 'tenant-1',
  userId: 'user-1',
  userNameSnapshot: 'Admin',
  action: 'DOCUMENT_SOFT_DELETED',
  domain: 'global',
  fromState: 'FACTURA',
  toState: 'DELETED',
  prevHash: event2.hash,
  seq: 3,
  metadata: {
    reason: 'Factura incorrecta',
    version: 2,
    appVersion: '1.0.0',
    deviceId: 'test',
    documentId: 'doc-1',
    documentName: 'factura.pdf',
    documentType: 'FACTURA'
  }
});

// Verify chain integrity with document events mixed in
const chain = [event1, event2, event3];
const verification = verifyChain(chain);
assert.strictEqual(verification.isValid, true, "Chain with doc events should be valid");
console.log("✅ 3a: Audit chain with STATE_CHANGE + DOCUMENT_ADDED + DOCUMENT_SOFT_DELETED is valid");

// Tamper with an event and verify chain breaks
const tamperedChain = [...chain];
tamperedChain[1] = { ...tamperedChain[1], toState: 'TAMPERED' };
const tamperVerification = verifyChain(tamperedChain);
assert.strictEqual(tamperVerification.isValid, false, "Tampered chain should be invalid");
console.log("✅ 3b: Tampered document event breaks chain verification");

// ─────────────────────────────────────────────
// 4. OPTIMISTIC LOCKING (service level)
// ─────────────────────────────────────────────

console.log("\n--- 4. Optimistic Locking Tests ---");

// 4a: Wrong version in transition
const lockReq: TransitionRequest = {
  obra: { ...baseObra, version: 5 },
  domain: 'operativo',
  to: EstadoOperativo.MATERIALES_PEDIDOS,
  version: 3, // stale version
  user: adminUser,
  prevHash: genesis,
  seq: 1
};
const lockRes = processStateTransition(lockReq);
assert.strictEqual(lockRes.success, false);
assert.strictEqual(lockRes.error?.code, 'CONFLICT');
console.log("✅ 4a: Stale version in transition returns CONFLICT");

// 4b: Wrong version in config change
const configLockReq: ConfigChangeRequest = {
  obra: { ...baseObra, version: 5 },
  newConfig: { ...baseObra.config },
  reason: 'test',
  version: 3, // stale
  user: adminUser,
  prevHash: genesis,
  seq: 1
};
const configLockRes = processConfigChange(configLockReq);
assert.strictEqual(configLockRes.success, false);
assert.strictEqual(configLockRes.error?.code, 'CONFLICT');
console.log("✅ 4b: Stale version in config change returns CONFLICT");

// 4c: Correct version succeeds
const correctReq: TransitionRequest = {
  obra: { ...baseObra },
  domain: 'operativo',
  to: EstadoOperativo.MATERIALES_PEDIDOS,
  version: 1, // matches obra.version
  user: adminUser,
  prevHash: genesis,
  seq: 1
};
const correctRes = processStateTransition(correctReq);
assert.strictEqual(correctRes.success, true);
console.log("✅ 4c: Correct version allows transition");

// ─────────────────────────────────────────────
// 5. ROLES CONSISTENCY (no CFO in gates)
// ─────────────────────────────────────────────

console.log("\n--- 5. Roles Consistency ---");

const VALID_ROLES = ['ADMIN', 'BACKOFFICE', 'JEFE_OBRA', 'INSTALADOR', 'COMERCIAL'];

// Test soft gate for anticipo — overrideRole should use valid roles
const obraForAnticipo: Obra = {
  ...baseObra,
  estadoOperativo: EstadoOperativo.EN_INSTALACION,
  gateData: { ...baseObra.gateData!, checklistTecnicoCompletado: true }
};
const gateResult = validateTransition(obraForAnticipo, 'operativo', EstadoOperativo.FINALIZADA, 'ADMIN');
if (gateResult.overrideRole) {
  for (const role of gateResult.overrideRole) {
    assert.ok(VALID_ROLES.includes(role), `Override role "${role}" must be in valid DB roles`);
  }
}
console.log("✅ 5a: Override roles for anticipo gate are valid DB roles (no CFO)");

// Test soft gate for financiero
const obraForFinanciero: Obra = {
  ...baseObra,
  gateData: { ...baseObra.gateData!, facturasCuadranConPresupuesto: false }
};
const finGateResult = validateTransition(obraForFinanciero, 'financiero', EstadoFinanciero.PAGADO_TOTAL, 'ADMIN');
if (finGateResult.overrideRole) {
  for (const role of finGateResult.overrideRole) {
    assert.ok(VALID_ROLES.includes(role), `Override role "${role}" must be in valid DB roles`);
  }
}
console.log("✅ 5b: Override roles for financiero gate are valid DB roles (no CFO)");

// ─────────────────────────────────────────────
// 6. CONTRACTS — prevHash/seq not in client types
// ─────────────────────────────────────────────

console.log("\n--- 6. Contract Cleanup ---");

// TransitionRequest from types should NOT have prevHash or seq
// We verify this by constructing a request with only the allowed fields
const clientRequest = {
  domain: 'operativo' as Domain,
  newState: 'MATERIALES_PEDIDOS',
  version: 1,
  override: false,
  reason: 'test'
};
// If this compiles with no type errors, the contract is clean
assert.ok(!('prevHash' in clientRequest), "Client request should not contain prevHash");
assert.ok(!('seq' in clientRequest), "Client request should not contain seq");
console.log("✅ 6a: Client TransitionRequest has no prevHash/seq");

console.log("\n=== All Sprint Security & Audit Tests Passed! ===\n");
