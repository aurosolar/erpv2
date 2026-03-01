import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Banknote, 
  HardHat, 
  Users, 
  Clock,
  Download,
  Mail,
  Lock,
  Upload,
  MessageSquare,
  FolderOpen,
  Image as ImageIcon,
  Paperclip,
  Send,
  Trash2,
  AlertOctagon,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { 
  Obra, 
  EstadoOperativo, 
  EstadoFinanciero, 
  EstadoValidacion, 
  EstadoLegalizacion, 
  EstadoIncidencias,
  EstadoCRM,
  EstadoGlobal,
  TipoObra,
  Documento,
  Domain,
  AuditLog
} from '../types/obra';
import { BentoCard } from './BentoCard';
import { validateTransition, GateResult, checkIntegrity } from '../services/gatesService';
import { obraClient } from '../services/obraClient';
import { useAuth } from '../context/AuthContext';
import { processStateTransition } from '../services/transitionService';

// Obra Mockup
export const mockObra: Obra = {
  id: 'OBR-2024-089',
  tenantId: 'tenant-123',
  version: 1,
  cliente: 'Logística Solar S.L.',
  direccion: 'Polígono Industrial Sur, Nave 4, Madrid',
  potenciaKw: 15.5,
  requiereLegalizacion: true,
  tipoObra: TipoObra.FV_ESTANDAR,
  tieneBackup: true, // Para probar el template dinámico
  tieneOptimizadores: false,
  
  estadoGlobal: EstadoGlobal.ACTIVA,
  estadoCrm: EstadoCRM.GANADO,
  estadoOperativo: EstadoOperativo.MATERIALES_RECIBIDOS,
  estadoFinanciero: EstadoFinanciero.ANTICIPO_PAGADO,
  estadoValidacion: EstadoValidacion.PENDIENTE_REVISION,
  estadoLegalizacion: EstadoLegalizacion.RECOPILANDO_DOCS,
  estadoIncidencias: EstadoIncidencias.SIN_INCIDENCIAS,

  // Detalles técnicos
  numPlacas: 28,
  potenciaPlacaWp: 550,
  numStrings: 2,
  modeloInversor: 'Huawei SUN2000-15KTL-M2',
  isClimatizacion: false,

  planificacion: {
    fechaInicio: '2024-10-15T08:00:00Z',
    fechaFin: '2024-10-17T18:00:00Z',
    equipo: [
      { id: '1', nombre: 'Carlos Ruiz', rol: 'JEFE_OBRA', avatarUrl: 'https://i.pravatar.cc/150?u=carlos' },
      { id: '2', nombre: 'Ana Gómez', rol: 'ELECTRICISTA', avatarUrl: 'https://i.pravatar.cc/150?u=ana' },
      { id: '3', nombre: 'Luis Pérez', rol: 'INSTALADOR', avatarUrl: 'https://i.pravatar.cc/150?u=luis' }
    ],
    notas: 'Instalación en cubierta plana. Requiere grúa el primer día.'
  },
  documentos: [
    {
      id: 'doc-1',
      tipo: 'REPRESENTACION_VOLUNTARIA',
      nombre: 'representacion_firmada.pdf',
      url: '#',
      uploadedAt: '2024-10-10T10:00:00Z',
      uploadedBy: 'admin-1'
    },
    {
      id: 'doc-2',
      tipo: 'PRESUPUESTO',
      nombre: 'PRE-2024-089_v2.pdf',
      url: '#',
      uploadedAt: '2024-10-05T12:30:00Z',
      uploadedBy: 'comercial-1'
    },
    {
      id: 'doc-3',
      tipo: 'FOTO_PREVIA',
      nombre: 'cubierta_estado_actual.jpg',
      url: 'https://picsum.photos/seed/tejado/400/300',
      uploadedAt: '2024-10-01T09:15:00Z',
      uploadedBy: 'comercial-1'
    }
  ],
  presupuestoTotal: 18500,
  cobradoHastaAhora: 9250,
  comercial: 'Laura Ventas',
  enlaceCarpetaCliente: 'https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j',
  comentarios: [
    {
      id: 'com-1',
      autor: 'Laura Ventas',
      rol: 'Comercial',
      texto: 'El cliente es muy exigente con la estética. Quiere que los cables bajen por la fachada trasera, no por la principal.',
      fecha: '2024-10-01T10:00:00Z'
    },
    {
      id: 'com-2',
      autor: 'Carlos Ruiz',
      rol: 'Jefe de Obra',
      texto: 'Visto. Llevaremos canaleta negra para que se disimule mejor con el ladrillo visto.',
      fecha: '2024-10-02T08:30:00Z'
    }
  ],
  // Datos para validación de Gates
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

export const mockObras: Obra[] = [
  mockObra,
  {
    id: 'OBR-2024-090',
    tenantId: 'tenant-123',
    version: 1,
    cliente: 'Residencial Los Olivos',
    direccion: 'Calle de la Luna 12, Majadahonda',
    potenciaKw: 5.4,
    requiereLegalizacion: true,
    tipoObra: TipoObra.FV_ESTANDAR,
    tieneBackup: false,
    tieneOptimizadores: true,
    config: {
      requiereAlmacen: false,
      requiereFirmaCliente: true,
      requiereFotosPrevia: true,
      requiereFotosPosterior: true,
    },
    estadoGlobal: EstadoGlobal.ACTIVA,
    estadoCrm: EstadoCRM.GANADO,
    estadoOperativo: EstadoOperativo.FINALIZADA,
    estadoFinanciero: EstadoFinanciero.PENDIENTE_FINAL,
    estadoValidacion: EstadoValidacion.APROBADO_TECNICAMENTE,
    estadoLegalizacion: EstadoLegalizacion.PRESENTADO_INDUSTRIA,
    estadoIncidencias: EstadoIncidencias.SIN_INCIDENCIAS,
    numPlacas: 10,
    potenciaPlacaWp: 540,
    numStrings: 1,
    modeloInversor: 'Fronius Primo 5.0-1',
    isClimatizacion: false,
    planificacion: {
      fechaInicio: '2024-10-15T10:00:00Z',
      fechaFin: '2024-10-15T18:00:00Z',
      equipo: [
        { id: '1', nombre: 'Carlos Ruiz', rol: 'JEFE_OBRA', avatarUrl: 'https://i.pravatar.cc/150?u=carlos' }
      ],
    },
    documentos: [],
    presupuestoTotal: 6200,
    cobradoHastaAhora: 3100
  },
  {
    id: 'OBR-2024-091',
    tenantId: 'tenant-123',
    version: 1,
    cliente: 'Supermercado Ahorro',
    direccion: 'Av. de la Constitución 45, Getafe',
    potenciaKw: 45.0,
    requiereLegalizacion: true,
    tipoObra: TipoObra.FV_ESTANDAR,
    tieneBackup: false,
    tieneOptimizadores: false,
    config: {
      requiereAlmacen: true,
      requiereFirmaCliente: true,
      requiereFotosPrevia: true,
      requiereFotosPosterior: true,
    },
    estadoGlobal: EstadoGlobal.ACTIVA,
    estadoCrm: EstadoCRM.GANADO,
    estadoOperativo: EstadoOperativo.MATERIALES_PEDIDOS,
    estadoFinanciero: EstadoFinanciero.IMPAGADO,
    estadoValidacion: EstadoValidacion.PENDIENTE_REVISION,
    estadoLegalizacion: EstadoLegalizacion.SUBSANACION,
    estadoIncidencias: EstadoIncidencias.SIN_INCIDENCIAS,
    numPlacas: 82,
    potenciaPlacaWp: 550,
    numStrings: 4,
    modeloInversor: 'Huawei SUN2000-40KTL-M3',
    isClimatizacion: false,
    planificacion: {
      fechaInicio: '2024-10-16T08:00:00Z',
      fechaFin: '2024-10-18T18:00:00Z',
      equipo: [
        { id: '1', nombre: 'Carlos Ruiz', rol: 'JEFE_OBRA', avatarUrl: 'https://i.pravatar.cc/150?u=carlos' }
      ],
    },
    documentos: [],
    presupuestoTotal: 42000,
    cobradoHastaAhora: 21000
  },
  {
    id: 'OBR-2024-092',
    tenantId: 'tenant-123',
    version: 1,
    cliente: 'Hotel Costa Azul',
    direccion: 'Paseo Marítimo 10, Alicante',
    potenciaKw: 0,
    requiereLegalizacion: false,
    tipoObra: TipoObra.CLIMATIZACION,
    tieneBackup: false,
    tieneOptimizadores: false,
    estadoGlobal: EstadoGlobal.ACTIVA,
    estadoCrm: EstadoCRM.GANADO,
    estadoOperativo: EstadoOperativo.MATERIALES_RECIBIDOS,
    estadoFinanciero: EstadoFinanciero.ANTICIPO_PAGADO,
    estadoValidacion: EstadoValidacion.PENDIENTE_REVISION,
    estadoLegalizacion: EstadoLegalizacion.NO_INICIADA,
    estadoIncidencias: EstadoIncidencias.SIN_INCIDENCIAS,
    isClimatizacion: true,
    equipoPrincipal: 'Sistema Aerotermia Daikin Altherma 3',
    planificacion: {
      fechaInicio: '2024-10-17T09:00:00Z',
      fechaFin: '2024-10-19T18:00:00Z',
      equipo: [
        { id: '1', nombre: 'Carlos Ruiz', rol: 'JEFE_OBRA', avatarUrl: 'https://i.pravatar.cc/150?u=carlos' }
      ],
    },
    documentos: [],
    presupuestoTotal: 12500,
    cobradoHastaAhora: 6250,
    config: {
      requiereAlmacen: true,
      requiereFirmaCliente: true,
      requiereFotosPrevia: true,
      requiereFotosPosterior: true,
    }
  },
  {
    id: 'OBR-2024-093',
    tenantId: 'tenant-123',
    version: 1,
    cliente: 'Juan Martínez',
    direccion: 'Calle Mayor 5, Valencia',
    potenciaKw: 3.3,
    requiereLegalizacion: true,
    tipoObra: TipoObra.AMPLIACION,
    tieneBackup: false,
    tieneOptimizadores: false,
    estadoGlobal: EstadoGlobal.ACTIVA,
    estadoCrm: EstadoCRM.GANADO,
    estadoOperativo: EstadoOperativo.MATERIALES_RECIBIDOS,
    estadoFinanciero: EstadoFinanciero.ANTICIPO_PAGADO,
    estadoValidacion: EstadoValidacion.PENDIENTE_REVISION,
    estadoLegalizacion: EstadoLegalizacion.NO_INICIADA,
    estadoIncidencias: EstadoIncidencias.SIN_INCIDENCIAS,
    numPlacas: 6,
    potenciaPlacaWp: 550,
    obraOriginalId: 'OBR-2022-045',
    descripcionAmpliacion: 'Añadir 6 placas a la instalación existente en el tejado sur.',
    planificacion: {
      fechaInicio: '2024-10-20T08:00:00Z',
      fechaFin: '2024-10-20T14:00:00Z',
      equipo: [
        { id: '3', nombre: 'Luis Pérez', rol: 'INSTALADOR', avatarUrl: 'https://i.pravatar.cc/150?u=luis' }
      ],
    },
    documentos: [],
    presupuestoTotal: 2800,
    cobradoHastaAhora: 1400,
    config: {
      requiereAlmacen: true,
      requiereFirmaCliente: true,
      requiereFotosPrevia: true,
      requiereFotosPosterior: true,
    }
  },
  {
    id: 'OBR-2024-094',
    tenantId: 'tenant-123',
    version: 1,
    cliente: 'Nave Industrial Zeta',
    direccion: 'Polígono Ind. Norte, Parcela 12, Sevilla',
    potenciaKw: 100.0,
    requiereLegalizacion: false,
    tipoObra: TipoObra.ALQUILER_CUBIERTA,
    tieneBackup: false,
    tieneOptimizadores: false,
    estadoGlobal: EstadoGlobal.ACTIVA,
    estadoCrm: EstadoCRM.GANADO,
    estadoOperativo: EstadoOperativo.MATERIALES_RECIBIDOS,
    estadoFinanciero: EstadoFinanciero.ANTICIPO_PAGADO,
    estadoValidacion: EstadoValidacion.PENDIENTE_REVISION,
    estadoLegalizacion: EstadoLegalizacion.NO_INICIADA,
    estadoIncidencias: EstadoIncidencias.SIN_INCIDENCIAS,
    superficieM2: 600,
    canonAnual: 1200,
    planificacion: {
      fechaInicio: '2024-10-21T09:00:00Z',
      fechaFin: '2024-10-21T18:00:00Z',
      equipo: [
        { id: '1', nombre: 'Carlos Ruiz', rol: 'JEFE_OBRA', avatarUrl: 'https://i.pravatar.cc/150?u=carlos' }
      ],
    },
    documentos: [],
    presupuestoTotal: 0,
    cobradoHastaAhora: 0,
    config: {
      requiereAlmacen: true,
      requiereFirmaCliente: true,
      requiereFotosPrevia: true,
      requiereFotosPosterior: true,
    }
  },
  {
    id: 'OBR-2024-095',
    tenantId: 'tenant-123',
    version: 1,
    cliente: 'Instalaciones Pro S.A.',
    direccion: 'Calle Industria 8, Barcelona',
    potenciaKw: 20.0,
    requiereLegalizacion: false,
    tipoObra: TipoObra.MANO_DE_OBRA,
    tieneBackup: false,
    tieneOptimizadores: false,
    estadoGlobal: EstadoGlobal.ACTIVA,
    estadoCrm: EstadoCRM.GANADO,
    estadoOperativo: EstadoOperativo.MATERIALES_RECIBIDOS,
    estadoFinanciero: EstadoFinanciero.ANTICIPO_PAGADO,
    estadoValidacion: EstadoValidacion.PENDIENTE_REVISION,
    estadoLegalizacion: EstadoLegalizacion.NO_INICIADA,
    estadoIncidencias: EstadoIncidencias.SIN_INCIDENCIAS,
    empresaContratante: 'SolarCorp S.L.',
    planificacion: {
      fechaInicio: '2024-10-22T08:00:00Z',
      fechaFin: '2024-10-24T18:00:00Z',
      equipo: [
        { id: '2', nombre: 'Ana Gómez', rol: 'ELECTRICISTA', avatarUrl: 'https://i.pravatar.cc/150?u=ana' },
        { id: '3', nombre: 'Luis Pérez', rol: 'INSTALADOR', avatarUrl: 'https://i.pravatar.cc/150?u=luis' }
      ],
    },
    documentos: [],
    presupuestoTotal: 4500,
    cobradoHastaAhora: 2250,
    config: {
      requiereAlmacen: true,
      requiereFirmaCliente: true,
      requiereFotosPrevia: true,
      requiereFotosPosterior: true,
    }
  },
  {
    id: 'OBR-ANOMALA-1',
    tenantId: 'tenant-123',
    version: 1,
    cliente: 'Cliente Conflictivo 1 (CRM Perdido vs Pagado)',
    direccion: 'Calle del Error 1',
    potenciaKw: 5,
    requiereLegalizacion: true,
    tipoObra: TipoObra.FV_ESTANDAR,
    tieneBackup: false,
    tieneOptimizadores: false,
    estadoGlobal: EstadoGlobal.ACTIVA,
    estadoCrm: EstadoCRM.PERDIDO,
    estadoOperativo: EstadoOperativo.PENDIENTE_VISITA,
    estadoFinanciero: EstadoFinanciero.PAGADO_TOTAL,
    estadoValidacion: EstadoValidacion.PENDIENTE_REVISION,
    estadoLegalizacion: EstadoLegalizacion.NO_INICIADA,
    estadoIncidencias: EstadoIncidencias.SIN_INCIDENCIAS,
    documentos: [],
    presupuestoTotal: 5000,
    cobradoHastaAhora: 5000,
    config: {
      requiereAlmacen: true,
      requiereFirmaCliente: true,
      requiereFotosPrevia: true,
      requiereFotosPosterior: true,
    }
  },
  {
    id: 'OBR-ANOMALA-2',
    tenantId: 'tenant-123',
    version: 1,
    cliente: 'Cliente Conflictivo 2 (Cancelada vs Finalizada)',
    direccion: 'Calle del Error 2',
    potenciaKw: 10,
    requiereLegalizacion: true,
    tipoObra: TipoObra.FV_ESTANDAR,
    tieneBackup: false,
    tieneOptimizadores: false,
    config: {
      requiereAlmacen: true,
      requiereFirmaCliente: true,
      requiereFotosPrevia: true,
      requiereFotosPosterior: true,
    },
    estadoGlobal: EstadoGlobal.CANCELADA,
    estadoCrm: EstadoCRM.GANADO,
    estadoOperativo: EstadoOperativo.FINALIZADA,
    estadoFinanciero: EstadoFinanciero.ANTICIPO_PAGADO,
    estadoValidacion: EstadoValidacion.APROBADO_TECNICAMENTE,
    estadoLegalizacion: EstadoLegalizacion.LEGALIZADA,
    estadoIncidencias: EstadoIncidencias.SIN_INCIDENCIAS,
    documentos: [],
    presupuestoTotal: 10000,
    cobradoHastaAhora: 5000
  }
];

const StatusDropdown = ({ 
  value, 
  options, 
  onChange, 
  baseColorClass 
}: { 
  value: string, 
  options: string[], 
  onChange: (val: string) => void,
  baseColorClass: 'emerald' | 'amber' | 'slate'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const colorStyles = {
    emerald: {
      trigger: 'bg-[#a7f3d0] text-[#065f46] hover:bg-[#6ee7b7]',
      menu: 'bg-[#a7f3d0] border-[#059669]',
      optionText: 'text-[#065f46]',
      selectedBg: 'bg-[#2563eb] text-white',
      hoverBg: 'hover:bg-[#6ee7b7] hover:text-[#065f46]'
    },
    amber: {
      trigger: 'bg-[#fde68a] text-[#92400e] hover:bg-[#fcd34d]',
      menu: 'bg-[#fde68a] border-[#d97706]',
      optionText: 'text-[#92400e]',
      selectedBg: 'bg-[#2563eb] text-white',
      hoverBg: 'hover:bg-[#fcd34d] hover:text-[#92400e]'
    },
    slate: {
      trigger: 'bg-slate-200 text-slate-700 hover:bg-slate-300',
      menu: 'bg-slate-200 border-slate-400',
      optionText: 'text-slate-800',
      selectedBg: 'bg-[#2563eb] text-white',
      hoverBg: 'hover:bg-slate-300 hover:text-slate-900'
    }
  };

  const styles = colorStyles[baseColorClass];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-1.5 rounded-full text-sm font-semibold outline-none cursor-pointer transition-colors text-right flex items-center justify-end gap-1 w-full sm:w-auto ${styles.trigger}`}
      >
        {value.replace(/_/g, ' ')}
      </button>
      
      {isOpen && (
        <div className={`absolute right-0 mt-1 w-64 rounded shadow-xl border z-50 overflow-hidden ${styles.menu}`}>
          <div className="py-0">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full text-right px-4 py-2 text-sm font-medium transition-colors border-b last:border-b-0 border-black/5 ${
                  value === option 
                    ? styles.selectedBg 
                    : `${styles.optionText} ${styles.hoverBg}`
                }`}
              >
                {option.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export function FichaObra() {
  const { user } = useAuth();
  const [obras, setObras] = useState<Obra[]>([]);
  const [obra, setObra] = useState<Obra | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [chainValid, setChainValid] = useState<boolean | null>(null);
  
  // Referencia y estado para la subida real de archivos
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDocType, setUploadingDocType] = useState<Documento['tipo'] | null>(null);

  const [gateModal, setGateModal] = useState<{
    isOpen: boolean;
    domain: 'operativo' | 'financiero' | 'legalizacion' | 'validacion' | 'incidencias' | 'crm' | 'global' | null;
    nextState: string | null;
    result: GateResult | null;
  }>({ isOpen: false, domain: null, nextState: null, result: null });

  useEffect(() => {
    fetchObras();
  }, []);

  const fetchObras = async () => {
    setLoading(true);
    try {
      const data = await obraClient.getObras();
      setObras(data);
      if (data.length > 0) {
        setObra(data[0]);
        fetchAuditData(data[0].id);
      }
    } catch (err: any) {
      setError('Error al cargar las obras. ' + (err.response?.data?.error || ''));
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditData = async (obraId: string) => {
    try {
      const logs = await obraClient.getAuditLogs(obraId);
      setAuditLogs(logs);
      const verify = await obraClient.verifyAuditChain(obraId);
      setChainValid(verify.valid);
    } catch (e) {
      console.error('Error fetching audit data', e);
    }
  };

  const handleObraChange = (obraId: string) => {
    const selected = obras.find(o => o.id === obraId);
    if (selected) {
      setObra(selected);
      fetchAuditData(selected.id);
    }
  };

  // Formateador de fechas
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('es-ES', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    });
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-ES', { 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  const handleAddComentario = () => {
    if (!nuevoComentario.trim() || !obra) return;
    
    const newComentario = {
      id: `com-${Date.now()}`,
      autor: user?.name || 'Usuario',
      rol: user?.role || 'Personal',
      texto: nuevoComentario,
      fecha: new Date().toISOString()
    };

    setObra(prev => prev ? ({
      ...prev,
      comentarios: [...(prev.comentarios || []), newComentario]
    }) : null);
    setNuevoComentario('');
  };

  const handleEstadoChange = async (domain: 'operativo' | 'financiero' | 'legalizacion' | 'validacion' | 'incidencias' | 'crm' | 'global', val: string) => {
    if (!obra) return;
    
    const result = validateTransition(obra, domain, val);
    
    if (!result.allowed || result.softWarnings.length > 0) {
      setGateModal({ isOpen: true, domain, nextState: val, result });
    } else {
      try {
        const response = await obraClient.transition(obra.id, {
          domain: domain as Domain,
          newState: val,
          version: obra.version
        });
        
        if (response.success && response.obra) {
          setObra(response.obra);
          fetchAuditData(obra.id);
        }
      } catch (err: any) {
        alert('Error en la transición: ' + (err.response?.data?.error || 'Error desconocido'));
      }
    }
  };

  const confirmGateOverride = async () => {
    if (gateModal.nextState && gateModal.domain && obra) {
      const { domain, nextState } = gateModal;
      
      try {
        const response = await obraClient.transition(obra.id, {
          domain: domain as Domain,
          newState: nextState,
          version: obra.version,
          override: true,
          reason: `Override manual por ${user?.name}. Advertencias ignoradas: ${gateModal.result?.softWarnings.map(w => w.message).join(', ')}`
        });
        
        if (response.success && response.obra) {
          setObra(response.obra);
          fetchAuditData(obra.id);
          setGateModal({ isOpen: false, domain: null, nextState: null, result: null });
        }
      } catch (err: any) {
        alert('Error en el override: ' + (err.response?.data?.error || 'Error desconocido'));
      }
    }
  };

  // Acción de generar PDF y enviar al cliente (Simulación)
  const handleGenerarPdfValidacion = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      setObra(prev => ({
        ...prev,
        estadoValidacion: EstadoValidacion.APROBADO_TECNICAMENTE
      }));
      setIsGeneratingPdf(false);
      alert('PDF generado y enviado al cliente para su firma.');
    }, 1500);
  };

  // Iniciar el proceso de subida
  const triggerFileUpload = (tipo: Documento['tipo']) => {
    setUploadingDocType(tipo);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Manejar el archivo seleccionado
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadingDocType || !obra) return;

    try {
      const response = await obraClient.uploadDocument(obra.id, file, uploadingDocType);
      if (response.success) {
        setObra(prev => {
          if (!prev) return null;
          return {
            ...prev,
            documentos: [...prev.documentos, response.document]
          };
        });
        alert('Documento subido correctamente.');
      }
    } catch (err: any) {
      console.error('Error uploading document', err);
      alert('Error al subir el documento: ' + (err.response?.data?.error || err.message));
    } finally {
      // Resetear el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setUploadingDocType(null);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!obra) return;
    
    const reason = window.prompt('Motivo de la eliminación del documento (obligatorio):');
    if (!reason || reason.trim().length === 0) {
      alert('Debes indicar un motivo para eliminar el documento.');
      return;
    }

    if (!window.confirm('¿Estás seguro de que deseas eliminar este documento?')) return;

    try {
      const response = await obraClient.deleteDocument(obra.id, docId, reason.trim());
      if (response.success) {
        // Soft-delete: mark as deleted locally instead of removing
        setObra(prev => {
          if (!prev) return null;
          return {
            ...prev,
            documentos: prev.documentos.filter(d => d.id !== docId)
          };
        });
      }
    } catch (err: any) {
      console.error('Error deleting document', err);
      alert('Error al eliminar el documento: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium">Cargando ficha de obra...</p>
        </div>
      </div>
    );
  }

  if (error || !obra) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Error de Carga</h2>
          <p className="text-slate-600 mb-6">{error || 'No se ha encontrado la obra seleccionada.'}</p>
          <button 
            onClick={fetchObras}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Cálculo de progreso financiero
  const progresoFinanciero = (obra.cobradoHastaAhora / obra.presupuestoTotal) * 100;

  // Lógica de Legalización
  const tieneRepresentacionVoluntaria = obra.documentos.some(d => d.tipo === 'REPRESENTACION_VOLUNTARIA');
  const tieneMemoriaTecnica = obra.documentos.some(d => d.tipo === 'MEMORIA');
  const tieneCIE = obra.documentos.some(d => d.tipo === 'CIE');
  const puedePresentarIndustria = !obra.requiereLegalizacion || tieneRepresentacionVoluntaria;

  const anomalies = checkIntegrity(obra);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans text-slate-900">
      
      {/* Input oculto para subida de archivos */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
        accept={uploadingDocType?.includes('FOTO') ? "image/*" : ".pdf,.doc,.docx,.jpg,.png"}
      />

      {/* Header Ficha de Obra */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">{obra.cliente}</h1>
            <span className="bg-slate-800 text-white text-xs px-2.5 py-1 rounded-full font-mono">
              {obra.id}
            </span>
            <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">
              {obra.tipoObra.replace(/_/g, ' ')}
            </span>
            <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${obra.estadoGlobal === EstadoGlobal.ACTIVA ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {obra.estadoGlobal}
            </span>
          </div>
          <p className="text-slate-500 flex items-center gap-2">
            <HardHat className="w-4 h-4" />
            {obra.direccion} {obra.potenciaKw > 0 && `• ${obra.potenciaKw} kWp`}
          </p>
        </div>
        
        {/* Acciones Globales */}
        <div className="flex gap-3 items-center">
          <select 
            value={obra.estadoGlobal}
            onChange={(e) => handleEstadoChange('global', e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
          >
            {Object.values(EstadoGlobal).map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
          <select 
            onChange={(e) => handleObraChange(e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium outline-none focus:ring-2 focus:ring-slate-200"
            value={obra.id}
          >
            {obras.map(o => (
              <option key={o.id} value={o.id}>{o.id} - {o.cliente}</option>
            ))}
          </select>
          <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Ver Timeline
          </button>
        </div>
      </div>

      {anomalies.length > 0 && (
        <div className="max-w-7xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-800 font-bold mb-2">
            <AlertTriangle className="w-5 h-5" />
            Anomalías de Integridad Detectadas
          </div>
          <ul className="list-disc pl-6 text-sm text-red-700 space-y-1">
            {anomalies.map((anomaly, idx) => (
              <li key={idx}>{anomaly}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Grid Bento UI */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 0. Detalles del Proyecto (Específico por tipo) */}
        <BentoCard 
          title="Detalles del Proyecto" 
          icon={FileText} 
          className="lg:col-span-1"
        >
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Tipo de Intervención</p>
              <p className="font-bold text-slate-800">{obra.tipoObra.replace(/_/g, ' ')}</p>
            </div>

            {obra.tipoObra === TipoObra.AMPLIACION && (
              <>
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <p className="text-[10px] text-blue-400 uppercase font-bold mb-1">Obra Original</p>
                  <p className="font-bold text-blue-800">{obra.obraOriginalId}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Descripción Ampliación</p>
                  <p className="text-sm text-slate-700">{obra.descripcionAmpliacion}</p>
                </div>
              </>
            )}

            {obra.tipoObra === TipoObra.ALQUILER_CUBIERTA && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Superficie</p>
                  <p className="font-bold text-slate-800">{obra.superficieM2} m²</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  <p className="text-[10px] text-emerald-400 uppercase font-bold mb-1">Canon Anual</p>
                  <p className="font-bold text-emerald-800">{obra.canonAnual} €</p>
                </div>
              </div>
            )}

            {obra.tipoObra === TipoObra.MANO_DE_OBRA && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Empresa Contratante</p>
                <p className="font-bold text-slate-800">{obra.empresaContratante}</p>
              </div>
            )}

            {(obra.tipoObra === TipoObra.FV_ESTANDAR || obra.tipoObra === TipoObra.FV_BATERIA || obra.tipoObra === TipoObra.AMPLIACION) && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Módulos</p>
                  <p className="font-bold text-slate-800">{obra.numPlacas} x {obra.potenciaPlacaWp}W</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Inversor</p>
                  <p className="font-bold text-slate-800 truncate" title={obra.modeloInversor}>{obra.modeloInversor}</p>
                </div>
              </div>
            )}
          </div>
        </BentoCard>

        {/* 1. Dominio Operativo */}
        <BentoCard 
          title="Ejecución Física" 
          icon={HardHat} 
          statusColor={obra.estadoOperativo === EstadoOperativo.MATERIALES_RECIBIDOS ? 'yellow' : 'gray'}
          className="lg:col-span-2"
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Estado Actual</span>
                <StatusDropdown 
                  value={obra.estadoOperativo}
                  options={Object.values(EstadoOperativo)}
                  onChange={(val) => handleEstadoChange('operativo', val)}
                  baseColorClass="amber"
                />
              </div>

              {obra.planificacion && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Planificación (Multidía)
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Inicio</p>
                      <p className="font-medium">{formatDate(obra.planificacion.fechaInicio)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Fin Previsto</p>
                      <p className="font-medium">{formatDate(obra.planificacion.fechaFin)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Equipo Asignado
                    </p>
                    <div className="flex -space-x-2">
                      {obra.planificacion.equipo.map(trabajador => (
                        <img 
                          key={trabajador.id}
                          src={trabajador.avatarUrl} 
                          alt={trabajador.nombre}
                          title={`${trabajador.nombre} (${trabajador.rol})`}
                          className="w-8 h-8 rounded-full border-2 border-white"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Gate / Action */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
              <button 
                className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={obra.estadoFinanciero === EstadoFinanciero.PENDIENTE_ANTICIPO}
              >
                {obra.estadoFinanciero === EstadoFinanciero.PENDIENTE_ANTICIPO ? (
                  <><Lock className="w-4 h-4" /> Bloqueado por Impago</>
                ) : (
                  'Iniciar Instalación'
                )}
              </button>
            </div>
          </div>
        </BentoCard>

        {/* 2. Dominio Validación */}
        <BentoCard 
          title="Validación y QA" 
          icon={CheckCircle2} 
          statusColor={obra.estadoValidacion === EstadoValidacion.APROBADO_TECNICAMENTE ? 'green' : 'yellow'}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Estado</span>
              <StatusDropdown 
                value={obra.estadoValidacion}
                options={Object.values(EstadoValidacion)}
                onChange={(val) => handleEstadoChange('validacion', val)}
                baseColorClass="emerald"
              />
            </div>

            <div className="flex-1 flex flex-col justify-center items-center text-center p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
              {obra.estadoValidacion === EstadoValidacion.APROBADO_TECNICAMENTE ? (
                <>
                  <FileText className="w-8 h-8 text-emerald-500 mb-2" />
                  <p className="text-sm text-slate-600 mb-4">
                    La instalación ha sido validada por el Jefe de Obra. Lista para enviar al cliente.
                  </p>
                  <button 
                    onClick={handleGenerarPdfValidacion}
                    disabled={isGeneratingPdf}
                    className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isGeneratingPdf ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                    {isGeneratingPdf ? 'Generando PDF...' : 'Enviar PDF al Cliente'}
                  </button>
                </>
              ) : obra.estadoValidacion === EstadoValidacion.PENDIENTE_REVISION ? (
                <>
                  <Clock className="w-8 h-8 text-amber-500 mb-2" />
                  <p className="text-sm text-slate-600">
                    Esperando revisión por parte de la Oficina Técnica.
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500">Esperando finalización de la instalación física.</p>
              )}
            </div>
          </div>
        </BentoCard>

        {/* 3. Dominio Financiero */}
        <BentoCard 
          title="Financiero" 
          icon={Banknote} 
          statusColor="green"
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Estado</span>
              <StatusDropdown 
                value={obra.estadoFinanciero}
                options={Object.values(EstadoFinanciero)}
                onChange={(val) => handleEstadoChange('financiero', val)}
                baseColorClass="emerald"
              />
            </div>

            <div className="mb-2 flex justify-between items-end">
              <div>
                <p className="text-xs text-slate-500 mb-1">Cobrado</p>
                <p className="text-2xl font-bold text-slate-900">{obra.cobradoHastaAhora.toLocaleString('es-ES')} €</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-1">Total</p>
                <p className="text-lg font-medium text-slate-700">{obra.presupuestoTotal.toLocaleString('es-ES')} €</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2">
              <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${progresoFinanciero}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 text-right">{progresoFinanciero.toFixed(0)}% completado</p>
          </div>
        </BentoCard>

        {/* 4. Dominio Legalización */}
        <BentoCard 
          title="Legalización" 
          icon={FileText} 
          statusColor={obra.estadoLegalizacion === EstadoLegalizacion.NO_INICIADA ? 'gray' : 'yellow'}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Estado</span>
              <StatusDropdown 
                value={obra.estadoLegalizacion}
                options={Object.values(EstadoLegalizacion)}
                onChange={(val) => handleEstadoChange('legalizacion', val)}
                baseColorClass={obra.estadoLegalizacion === EstadoLegalizacion.NO_INICIADA ? 'slate' : 'amber'}
              />
            </div>
            
            {obra.requiereLegalizacion ? (
              <>
                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <div className="flex items-center gap-3">
                      {tieneRepresentacionVoluntaria ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      Representación Voluntaria
                    </div>
                    {!tieneRepresentacionVoluntaria && (
                      <button 
                        onClick={() => triggerFileUpload('REPRESENTACION_VOLUNTARIA')}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" /> Subir
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <div className="flex items-center gap-3">
                      {tieneMemoriaTecnica ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      Memoria Técnica
                    </div>
                    {!tieneMemoriaTecnica && (
                      <button 
                        onClick={() => triggerFileUpload('MEMORIA')}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" /> Subir
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <div className="flex items-center gap-3">
                      {tieneCIE ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      CIE (Boletín)
                    </div>
                    {!tieneCIE && (
                      <button 
                        onClick={() => triggerFileUpload('CIE')}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" /> Subir
                      </button>
                    )}
                  </div>
                </div>

                {/* Gate / Action */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button 
                    className="w-full bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!puedePresentarIndustria}
                  >
                    {!puedePresentarIndustria ? (
                      <><Lock className="w-4 h-4" /> Falta Representación</>
                    ) : (
                      'Presentar a Industria'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                Esta obra no requiere trámites de legalización.
              </div>
            )}
          </div>
        </BentoCard>

        {/* 5. Dominio Incidencias */}
        <BentoCard 
          title="Incidencias" 
          icon={AlertTriangle} 
          statusColor={obra.estadoIncidencias === EstadoIncidencias.SIN_INCIDENCIAS ? 'green' : 'red'}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Estado</span>
              <StatusDropdown 
                value={obra.estadoIncidencias}
                options={Object.values(EstadoIncidencias)}
                onChange={(val) => handleEstadoChange('incidencias', val)}
                baseColorClass={obra.estadoIncidencias === EstadoIncidencias.SIN_INCIDENCIAS ? 'emerald' : 'amber'}
              />
            </div>
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              {obra.estadoIncidencias === EstadoIncidencias.SIN_INCIDENCIAS ? (
                <>
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-slate-600 font-medium">Todo en orden</p>
                  <p className="text-sm text-slate-500">No hay bloqueos activos</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-3">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <p className="text-rose-700 font-medium">{obra.estadoIncidencias.replace(/_/g, ' ')}</p>
                </>
              )}
            </div>
          </div>
        </BentoCard>

        {/* 6. Documentación Administrativa */}
        <BentoCard 
          title="Documentos y Facturación" 
          icon={Paperclip} 
          className="lg:col-span-1"
        >
          <div className="flex flex-col h-full">
            <div className="space-y-3 flex-1 overflow-y-auto max-h-48 pr-2 mb-4">
              {obra.documentos.filter(d => ['PRESUPUESTO', 'FACTURA', 'PEDIDO'].includes(d.tipo)).length === 0 ? (
                <p className="text-sm text-slate-500 italic text-center py-4">No hay documentos subidos.</p>
              ) : (
                obra.documentos.filter(d => ['PRESUPUESTO', 'FACTURA', 'PEDIDO'].includes(d.tipo)).map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-2 rounded-lg ${
                        doc.tipo === 'PRESUPUESTO' ? 'bg-blue-100 text-blue-600' :
                        doc.tipo === 'FACTURA' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-bold text-slate-700 truncate">{doc.nombre}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{doc.tipo}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                        <Download className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-slate-100">
              <button onClick={() => triggerFileUpload('PRESUPUESTO')} className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Ppto</span>
              </button>
              <button onClick={() => triggerFileUpload('FACTURA')} className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Factura</span>
              </button>
              <button onClick={() => triggerFileUpload('PEDIDO')} className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Pedido</span>
              </button>
            </div>
          </div>
        </BentoCard>

        {/* 7. Carpeta del Cliente */}
        <BentoCard 
          title="Carpeta del Cliente" 
          icon={FolderOpen} 
          className="lg:col-span-1"
        >
          <div className="flex flex-col h-full">
            <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 mb-1">Repositorio Drive</p>
                <p className="text-[10px] text-slate-500">Fotos previas, posteriores y docs.</p>
              </div>
              <a 
                href={obra.enlaceCarpetaCliente || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <FolderOpen className="w-5 h-5" />
              </a>
            </div>

            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Fotos Recientes</h4>
            <div className="grid grid-cols-2 gap-3 mb-4 overflow-y-auto max-h-48 pr-2">
              {obra.documentos.filter(d => ['FOTO_PREVIA', 'FOTO_POSTERIOR'].includes(d.tipo)).map(foto => (
                <div key={foto.id} className="relative aspect-video bg-slate-200 rounded-lg overflow-hidden group">
                  <img src={foto.url} alt={foto.nombre} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-[8px] text-white font-bold uppercase">{foto.tipo.replace('_', ' ')}</p>
                  </div>
                </div>
              ))}
              {obra.documentos.filter(d => ['FOTO_PREVIA', 'FOTO_POSTERIOR'].includes(d.tipo)).length === 0 && (
                <div className="col-span-2 text-center py-6 text-slate-400 text-sm italic">
                  No hay fotos en la carpeta.
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-slate-100">
              <button onClick={() => triggerFileUpload('FOTO_PREVIA')} className="flex items-center justify-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors text-xs font-bold">
                <Upload className="w-3 h-3" /> Previa
              </button>
              <button onClick={() => triggerFileUpload('FOTO_POSTERIOR')} className="flex items-center justify-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors text-xs font-bold">
                <Upload className="w-3 h-3" /> Posterior
              </button>
            </div>
          </div>
        </BentoCard>

        {/* 8. Timeline de Auditoría (Inmutable) */}
        <BentoCard 
          title="Timeline de Auditoría" 
          icon={ShieldCheck} 
          className="lg:col-span-1"
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${chainValid ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${chainValid ? 'text-emerald-600' : 'text-red-600'}`}>
                  {chainValid ? 'Cadena Íntegra' : 'Cadena Comprometida'}
                </span>
              </div>
              <button 
                onClick={() => fetchAuditData(obra.id)}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
                title="Verificar cadena"
              >
                <RefreshCw className="w-3 h-3 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 max-h-64 custom-scrollbar">
              {auditLogs && auditLogs.length > 0 ? (
                auditLogs.map((log, index) => (
                  <div key={log.id} className="relative pl-4 border-l border-slate-200 pb-4 last:pb-0">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-slate-300 border border-white" />
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">#{log.seq}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {log.fromState && log.toState ? (
                          <>
                            Cambio en <span className="font-bold text-slate-700">{log.domain}</span>: 
                            <span className="mx-1 px-1 bg-slate-100 rounded text-slate-500">{log.fromState}</span> 
                            → 
                            <span className="mx-1 px-1 bg-blue-50 text-blue-600 font-medium rounded">{log.toState}</span>
                          </>
                        ) : log.action === 'CONFIG_CHANGE' ? (
                          'Cambio en la configuración de la obra'
                        ) : (
                          log.metadata?.reason || 'Evento registrado'
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-slate-400">{log.userNameSnapshot}</span>
                        <span className="text-[9px] text-slate-400">• {formatTime(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 italic text-center py-4">No hay eventos registrados.</p>
              )}
            </div>

            <div className="mt-auto pt-3 border-t border-slate-100 flex gap-2">
              <input 
                type="text" 
                placeholder="Añadir nota al timeline..." 
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComentario()}
              />
              <button 
                onClick={handleAddComentario}
                disabled={!nuevoComentario.trim()}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </BentoCard>

        {/* 9. Debug Gates (Solo para desarrollo) */}
        <BentoCard 
          title="Debug Gates (Desarrollo)" 
          icon={AlertTriangle} 
          className="lg:col-span-3 bg-slate-50 border-dashed"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {obra.gateData && Object.entries(obra.gateData).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between bg-white p-2 rounded border">
                <span className="text-xs text-slate-600 truncate mr-2" title={key}>{key}</span>
                {typeof value === 'boolean' ? (
                  <button 
                    onClick={() => setObra(prev => ({
                      ...prev, 
                      gateData: { ...prev.gateData!, [key]: !value }
                    }))}
                    className={`px-2 py-1 rounded text-xs font-bold ${value ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {value ? 'TRUE' : 'FALSE'}
                  </button>
                ) : (
                  <select 
                    value={value as string}
                    onChange={(e) => setObra(prev => ({
                      ...prev, 
                      gateData: { ...prev.gateData!, [key]: e.target.value }
                    }))}
                    className="text-xs border rounded p-1 outline-none"
                  >
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="PEDIDO">PEDIDO</option>
                    <option value="DISPONIBLE">DISPONIBLE</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        </BentoCard>

      </div>

      {/* Modal de Validación de Gates */}
      {gateModal.isOpen && gateModal.result && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className={`p-6 border-b ${!gateModal.result.allowed ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-6 h-6 ${!gateModal.result.allowed ? 'text-red-600' : 'text-amber-600'}`} />
                <h3 className={`text-lg font-semibold ${!gateModal.result.allowed ? 'text-red-900' : 'text-amber-900'}`}>
                  {!gateModal.result.allowed ? 'Transición Bloqueada (HARD Gate)' : 'Advertencia (SOFT Gate)'}
                </h3>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Intentando cambiar estado <span className="font-bold text-slate-900 uppercase">{gateModal.domain}</span> a <span className="font-bold text-slate-900">{gateModal.nextState}</span>.
              </p>

              {!gateModal.result.allowed && gateModal.result.hardErrors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-red-800 uppercase tracking-wider">Errores Críticos:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
                    {gateModal.result.hardErrors.map((err, idx) => (
                      <li key={idx}>{err.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {gateModal.result.softWarnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-amber-800 uppercase tracking-wider">Advertencias:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-amber-700">
                    {gateModal.result.softWarnings.map((warn, idx) => (
                      <li key={idx}>{warn.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
              <button
                onClick={() => setGateModal({ isOpen: false, domain: null, nextState: null, result: null })}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {!gateModal.result.allowed ? 'Entendido' : 'Cancelar'}
              </button>
              
              {gateModal.result.allowed && (
                <button
                  onClick={confirmGateOverride}
                  className="px-4 py-2 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 rounded-lg transition-colors"
                >
                  Forzar y Continuar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input de archivo oculto para subidas */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
    </div>
  );
}

