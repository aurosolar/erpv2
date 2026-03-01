export enum EstadoCRM {
  LEAD = 'LEAD',
  CONTACTADO = 'CONTACTADO',
  VISITA_AGENDADA = 'VISITA_AGENDADA',
  PRESUPUESTO_ENVIADO = 'PRESUPUESTO_ENVIADO',
  NEGOCIACION = 'NEGOCIACION',
  GANADO = 'GANADO',
  PERDIDO = 'PERDIDO'
}

export enum EstadoOperativo {
  PENDIENTE_VISITA = 'PENDIENTE_VISITA',
  DISENO_INGENIERIA = 'DISENO_INGENIERIA',
  MATERIALES_PEDIDOS = 'MATERIALES_PEDIDOS',
  MATERIALES_RECIBIDOS = 'MATERIALES_RECIBIDOS',
  EN_INSTALACION = 'EN_INSTALACION',
  FINALIZADA = 'FINALIZADA'
}

export enum EstadoFinanciero {
  PENDIENTE_ANTICIPO = 'PENDIENTE_ANTICIPO',
  ANTICIPO_PAGADO = 'ANTICIPO_PAGADO',
  PENDIENTE_HITO = 'PENDIENTE_HITO',
  HITO_PAGADO = 'HITO_PAGADO',
  PENDIENTE_FINAL = 'PENDIENTE_FINAL',
  PAGADO_TOTAL = 'PAGADO_TOTAL',
  IMPAGADO = 'IMPAGADO'
}

export enum EstadoValidacion {
  PENDIENTE_REVISION = 'PENDIENTE_REVISION',
  APROBADO_TECNICAMENTE = 'APROBADO_TECNICAMENTE',
  RECHAZADO = 'RECHAZADO',
  MODIFICACION_REQUERIDA = 'MODIFICACION_REQUERIDA'
}

export enum EstadoLegalizacion {
  NO_INICIADA = 'NO_INICIADA',
  RECOPILANDO_DOCS = 'RECOPILANDO_DOCS',
  PRESENTADO_INDUSTRIA = 'PRESENTADO_INDUSTRIA',
  SUBSANACION = 'SUBSANACION',
  LEGALIZADA = 'LEGALIZADA',
  RECHAZADA = 'RECHAZADA'
}

export enum EstadoIncidencias {
  SIN_INCIDENCIAS = 'SIN_INCIDENCIAS',
  INCIDENCIA_MENOR = 'INCIDENCIA_MENOR',
  BLOQUEO_CRITICO = 'BLOQUEO_CRITICO',
  RESOLVIENDO = 'RESOLVIENDO',
  RESUELTA = 'RESUELTA'
}

// Macro-estado global para rollbacks
export enum EstadoGlobal {
  ACTIVA = 'ACTIVA',
  CANCELADA = 'CANCELADA' // Fuerza detención de dominios paralelos
}

export enum TipoObra {
  FV_ESTANDAR = 'FV_ESTANDAR',
  FV_BATERIA = 'FV_BATERIA',
  SAT_BATERIA = 'SAT_BATERIA',
  CLIMATIZACION = 'CLIMATIZACION',
  AMPLIACION = 'AMPLIACION',
  ALQUILER_CUBIERTA = 'ALQUILER_CUBIERTA',
  MANO_DE_OBRA = 'MANO_DE_OBRA'
}

export interface Trabajador {
  id: string;
  nombre: string;
  rol: 'JEFE_OBRA' | 'INSTALADOR' | 'ELECTRICISTA';
  avatarUrl?: string;
}

export interface Planificacion {
  fechaInicio: string;
  fechaFin: string;
  equipo: Trabajador[];
  notas?: string;
}

export type DocumentoSubtipo = 
  | 'INVERSOR' 
  | 'CUADRO_AC' 
  | 'CUADRO_DC' 
  | 'ESTRUCTURA' 
  | 'PUESTA_TIERRA' 
  | 'BATERIA' 
  | 'APP_PRODUCCION' 
  | 'GENERAL' 
  | 'BACKUP' 
  | 'OPTIMIZADORES' 
  | 'PLACAS'
  | 'FV_ESTANDAR'
  | 'OTROS';

export interface Documento {
  id: string;
  tipo: 'VALIDACION_FOTO' | 'REPRESENTACION_VOLUNTARIA' | 'CIE' | 'MEMORIA' | 'FOTO_INSTALACION' | 'PRESUPUESTO' | 'FACTURA' | 'PEDIDO' | 'FOTO_PREVIA' | 'FOTO_POSTERIOR' | 'OTROS';
  subtipo?: DocumentoSubtipo;
  nombre: string;
  url: string; // Path en Drive/Storage
  uploadedAt: string;
  uploadedBy: string; // userId
  latLng?: { lat: number; lng: number }; // Anti-trampa light
}

export interface Comentario {
  id: string;
  autor: string;
  rol: string;
  texto: string;
  fecha: string;
}

export interface ValidationItemTemplate {
  id: string;
  label: string;
  description?: string;
  required: boolean;
  subtipo: DocumentoSubtipo;
  requiresOCR?: boolean;
  ocrType?: 'INVERSOR' | 'PLACAS' | 'BATERIA' | 'GASTO'; // Tipo de OCR específico
  type: 'PHOTO' | 'CHECKLIST' | 'TEXT'; // Tipo de entrada
  checklistItems?: string[]; // Para ítems de tipo CHECKLIST
}

export interface ValidationItem {
  templateId: string;
  status: 'PENDING' | 'OK' | 'NA';
  naReason?: string;
  note?: string;
  photos: Documento[];
  timestamp?: string;
  extractedData?: Record<string, string>; // Datos extraídos por OCR (S/N, Potencia, etc.)
  checklistResults?: Record<string, boolean>; // Resultados de los checks
  textValue?: string; // Para entradas de texto
}

export interface Validacion {
  obraId: string;
  templateVersion: string;
  items: ValidationItem[];
  submittedByUserId: string;
  submittedAt: string;
  result: 'OK' | 'OBSERVACIONES' | 'BLOQUEO' | 'PENDIENTE';
}

export type CategoriaGasto = 'COMBUSTIBLE' | 'MATERIAL' | 'DIETAS' | 'PEAJE' | 'OTROS';
export type TipoDocumentoGasto = 'FACTURA' | 'FACTURA_SIMPLIFICADA' | 'ALBARAN' | 'OTRO';

export interface Gasto {
  id: string;
  proveedor?: string;
  numeroDocumento?: string;
  tipoDocumento?: TipoDocumentoGasto;
  concepto: string;
  importe: number;
  fecha: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  comprobanteUrl?: string;
  categoria: CategoriaGasto;
}

export interface RegistroHorario {
  id: string;
  entrada: string;
  salida?: string;
  tipo: 'VIAJE' | 'TRABAJO' | 'DESCANSO';
}

export interface GateData {
  presupuestoAceptado: boolean;
  datosFiscalesCompletos: boolean;
  materialClaveEstado: 'PENDIENTE' | 'PEDIDO' | 'DISPONIBLE';
  licenciasPendientes: boolean;
  overrideAnticipo: boolean;
  documentacionTecnicaPreviaCompleta: boolean;
  parteFinalCompletado: boolean;
  evidenciasMinimas: boolean;
  firmaCliente: boolean;
  serialesCompletos: boolean;
  checklistTecnicoCompletado: boolean;
  defectosCriticos: boolean;
  overridePagoFinal: boolean;
  facturasCuadranConPresupuesto: boolean;
  materialesRecibidosConfirmados: boolean;
}

export type Domain = 'operativo' | 'financiero' | 'legalizacion' | 'validacion' | 'incidencias' | 'crm' | 'global';

export interface AuditLog {
  id: string;
  obraId: string;
  tenantId: string;
  userId: string;
  userNameSnapshot: string; // Changed from userName to match backend snapshot
  action: 'STATE_CHANGE' | 'OVERRIDE' | 'ANOMALY_DETECTED' | 'REJECTED_TRANSITION' | 'CONFIG_CHANGE' | 'DOCUMENT_ADDED' | 'DOCUMENT_SOFT_DELETED';
  domain: Domain;
  fromState: string;
  toState: string;
  timestamp: string;
  seq: number;       // Secuencial incremental por obra_id para ordenación absoluta
  prevHash: string; // Hash del evento anterior para integridad en cadena
  hash: string;     // HMAC(secret, prevHash + canonicalData)
  metadata: {
    reason?: string;
    overrideRole?: string;
    gatesTriggered?: GateDetail[];
    version: number;
    appVersion?: string;
    deviceId?: string;
    installerPinUsed?: boolean;
  };
}

export interface TransitionRequest {
  domain: Domain;
  newState: string;
  version: number;
  override?: boolean;
  reason?: string;
  // prevHash and seq are computed server-side — client must NOT send them
}

export interface TransitionResponse {
  success: boolean;
  obra?: Obra;
  auditLog?: AuditLog;
  error?: {
    code: string;
    message: string;
    hardErrors?: GateDetail[];
    softWarnings?: GateDetail[];
  };
}

export interface ConfigChangeRequest {
  config: Obra['config'];
  version: number;
  // prevHash and seq are computed server-side — client must NOT send them
}

export interface ConfigChangeResponse {
  success: boolean;
  obra?: Obra;
  auditLog?: AuditLog;
  error?: {
    code: string;
    message: string;
  };
}

export interface GateDetail {
  id: string;
  type: 'HARD' | 'SOFT';
  message: string;
  field?: string;
}

export interface OverrideRecord {
  id: string;
  auditLogId: string;
  approverId: string;
  reason: string;
  timestamp: string;
}

export interface Obra {
  id: string;
  tenantId: string; // Para escalabilidad multiempresa
  version: number;
  cliente: string;
  direccion: string;
  potenciaKw: number;
  requiereLegalizacion: boolean;
  tipoObra: TipoObra;
  tieneBackup: boolean;
  tieneOptimizadores: boolean;
  
  // Configuración dinámica de validaciones (MVP Flexible)
  config: {
    requiereAlmacen: boolean;
    requiereFirmaCliente: boolean;
    requiereFotosPrevia: boolean;
    requiereFotosPosterior: boolean;
  };

  // Máquina de estados paralelos
  estadoGlobal: EstadoGlobal;
  estadoCrm: EstadoCRM;
  estadoOperativo: EstadoOperativo;
  estadoFinanciero: EstadoFinanciero;
  estadoValidacion: EstadoValidacion;
  estadoLegalizacion: EstadoLegalizacion;
  estadoIncidencias: EstadoIncidencias;
  
  // Datos técnicos detallados
  numPlacas?: number;
  potenciaPlacaWp?: number;
  numStrings?: number;
  modeloInversor?: string;
  equipoPrincipal?: string; // Para climatización o si no hay inversor
  isClimatizacion?: boolean;

  // Campos específicos por tipo
  empresaContratante?: string; // Para MANO_DE_OBRA
  superficieM2?: number; // Para ALQUILER_CUBIERTA
  canonAnual?: number; // Para ALQUILER_CUBIERTA
  obraOriginalId?: string; // Para AMPLIACION
  descripcionAmpliacion?: string;

  // Datos de dominio
  planificacion?: Planificacion;
  documentos: Documento[];
  validacion?: Validacion;
  presupuestoTotal: number;
  cobradoHastaAhora: number;
  
  // Comercial y Cliente
  comercial?: string;
  comentarios?: Comentario[];
  enlaceCarpetaCliente?: string;

  // Datos para validación de Gates
  gateData?: GateData;
}
