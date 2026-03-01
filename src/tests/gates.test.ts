import { validateTransition, checkIntegrity } from "../services/gatesService";
import { Obra, EstadoOperativo, EstadoFinanciero, EstadoGlobal, EstadoValidacion, TipoObra, EstadoCRM, EstadoLegalizacion, EstadoIncidencias } from "../types/obra";
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

console.log("Running Unit Tests for Gates...");

// Test 1: Bloqueo por Obra CANCELADA
const obraCancelada = { ...baseObra, estadoGlobal: EstadoGlobal.CANCELADA };
const res1 = validateTransition(obraCancelada, 'operativo', EstadoOperativo.EN_INSTALACION);
assert.strictEqual(res1.allowed, false, "Should block transition if global state is CANCELADA");
assert.ok(res1.hardErrors.some(e => e.id === 'G_GLOBAL_CANCEL'));
console.log("✅ Test 1: Global Cancelada Block passed");

// Test 2: SOFT Gate - Instalación sin anticipo
const obraSinAnticipo = { 
  ...baseObra, 
  estadoOperativo: EstadoOperativo.EN_INSTALACION,
  gateData: { ...baseObra.gateData, checklistTecnicoCompletado: true } 
};
const res2 = validateTransition(obraSinAnticipo, 'operativo', EstadoOperativo.FINALIZADA);
// En la nueva lógica, allowed es true si no hay hard errors, pero hay soft warnings
assert.strictEqual(res2.allowed, true, "Should allow transition with warning (SOFT GATE)");
assert.ok(res2.softWarnings.some(e => e.id === 'S_OP_ANTICIPO'));
console.log("✅ Test 2: Soft Gate - Anticipo passed");

// Test 3: Integrity Check - CRM Perdido vs Pagado
const obraAnomala = { ...baseObra, estadoCrm: EstadoCRM.PERDIDO, estadoFinanciero: EstadoFinanciero.PAGADO_TOTAL };
const anomalies = checkIntegrity(obraAnomala);
assert.ok(anomalies.includes('Obra PERDIDA en CRM pero tiene estados financieros avanzados.'));
console.log("✅ Test 3: Integrity Check - Anomaly detected passed");

console.log("All Unit Tests Passed!");
