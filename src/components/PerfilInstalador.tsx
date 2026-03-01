import React, { useState, useEffect } from 'react';
import { 
  HardHat, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  Receipt, 
  Play, 
  Square,
  ChevronRight,
  Plus,
  Bell,
  BellOff,
  Calendar as CalendarIcon,
  UserCheck
} from 'lucide-react';
import { Obra, EstadoOperativo, EstadoValidacion, EstadoLegalizacion, EstadoIncidencias, Validacion, Gasto, TipoObra } from '../types/obra';
import { mockObras } from './FichaObra';
import { ChecklistValidacion } from './ChecklistValidacion';
import { notificationService } from '../services/notificationService';
import { Calendar } from './Calendar';
import { GastoOcr } from './GastoOcr';

export function PerfilInstalador() {
  const [activeTab, setActiveTab] = useState<'calendario' | 'obra' | 'fichaje' | 'gastos'>('calendario');
  const [obras, setObras] = useState<Obra[]>(mockObras);
  const [currentObraId, setCurrentObraId] = useState<string>(mockObras[0].id);
  const [isWorking, setIsWorking] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showGastoOcr, setShowGastoOcr] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [gastos, setGastos] = useState<Gasto[]>([
    {
      id: 'g-1',
      proveedor: 'Gasolinera Repsol',
      concepto: 'Gasolina furgoneta',
      importe: 65.40,
      fecha: '2024-10-15T08:00:00Z',
      estado: 'PENDIENTE',
      categoria: 'COMBUSTIBLE'
    },
    {
      id: 'g-2',
      proveedor: 'Ferretería Industrial',
      concepto: 'Tornillería y tacos',
      importe: 12.50,
      fecha: '2024-10-14T10:00:00Z',
      estado: 'APROBADO',
      categoria: 'MATERIAL'
    }
  ]);

  const obra = obras.find(o => o.id === currentObraId) || obras[0];

  // Efecto para monitorizar cambios de estado críticos y notificar
  useEffect(() => {
    if (obra.estadoValidacion === EstadoValidacion.RECHAZADO) {
      notificationService.notifyStatusChange('VALIDACION', obra.estadoValidacion, obra.id);
    }
    if (obra.estadoLegalizacion === EstadoLegalizacion.SUBSANACION) {
      notificationService.notifyStatusChange('LEGALIZACION', obra.estadoLegalizacion, obra.id);
    }
  }, [obra.estadoValidacion, obra.estadoLegalizacion, obra.id]);

  const handleRequestNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      notificationService.notify('¡Notificaciones activadas!', {
        body: 'Recibirás avisos sobre cambios en tus validaciones y legalizaciones.'
      });
    }
  };

  const updateObra = (updatedObra: Obra) => {
    setObras(prev => prev.map(o => o.id === updatedObra.id ? updatedObra : o));
  };

  // Simular avance operativo
  const handleAvanzarOperativo = () => {
    if (obra.estadoOperativo === EstadoOperativo.MATERIALES_RECIBIDOS) {
      // Verificar si ya hay una obra en curso
      const obraEnCurso = obras.find(o => o.estadoOperativo === EstadoOperativo.EN_INSTALACION);
      if (obraEnCurso) {
        alert(`No puedes iniciar esta obra. Ya tienes la obra ${obraEnCurso.id} en curso.`);
        return;
      }
      updateObra({ ...obra, estadoOperativo: EstadoOperativo.EN_INSTALACION });
    } else if (obra.estadoOperativo === EstadoOperativo.EN_INSTALACION) {
      updateObra({ ...obra, estadoOperativo: EstadoOperativo.FINALIZADA });
    }
  };

  // Enviar validación desde el Checklist
  const handleSubmitValidacion = (validacion: Validacion) => {
    updateObra({ 
      ...obra, 
      estadoValidacion: EstadoValidacion.PENDIENTE_REVISION,
      validacion: validacion
    });
    setShowChecklist(false);
  };

  // Simular rechazo (Para testing)
  const simulateRejection = () => {
    updateObra({
      ...obra,
      estadoValidacion: EstadoValidacion.RECHAZADO
    });
  };

  // Simular requerimiento de subsanación (Para testing)
  const simulateSubsanacion = () => {
    updateObra({
      ...obra,
      estadoLegalizacion: EstadoLegalizacion.SUBSANACION
    });
  };

  // Simular bloqueo
  const handleBloqueo = () => {
    updateObra({ ...obra, estadoIncidencias: EstadoIncidencias.BLOQUEO_CRITICO });
  };

  const handleNotifyDirector = (obraId: string) => {
    alert(`Aviso enviado al Director de Instaladores: El instalador está disponible para la obra ${obraId}.`);
  };

  const handleSaveGasto = (nuevoGasto: Partial<Gasto>) => {
    // Validación de duplicados: mismo proveedor y mismo número de documento
    if (nuevoGasto.proveedor && nuevoGasto.numeroDocumento && nuevoGasto.numeroDocumento !== 'Desconocido') {
      const isDuplicate = gastos.some(g => 
        g.proveedor?.toLowerCase() === nuevoGasto.proveedor?.toLowerCase() && 
        g.numeroDocumento === nuevoGasto.numeroDocumento
      );

      if (isDuplicate) {
        alert(`Ya existe un gasto registrado para el proveedor "${nuevoGasto.proveedor}" con el número de documento "${nuevoGasto.numeroDocumento}".`);
        return;
      }
    }

    const gastoCompleto: Gasto = {
      id: `g-${Date.now()}`,
      proveedor: nuevoGasto.proveedor || 'Desconocido',
      numeroDocumento: nuevoGasto.numeroDocumento,
      tipoDocumento: nuevoGasto.tipoDocumento,
      concepto: nuevoGasto.concepto || 'Sin concepto',
      importe: nuevoGasto.importe || 0,
      fecha: nuevoGasto.fecha || new Date().toISOString(),
      estado: 'PENDIENTE',
      categoria: nuevoGasto.categoria || 'OTROS',
      comprobanteUrl: nuevoGasto.comprobanteUrl
    };
    setGastos(prev => [gastoCompleto, ...prev]);
    setShowGastoOcr(false);
  };

  const handleSelectObraFromCalendar = (obraId: string) => {
    setCurrentObraId(obraId);
    setActiveTab('obra');
  };

  if (showChecklist) {
    return (
      <ChecklistValidacion 
        obra={obra} 
        onClose={() => setShowChecklist(false)} 
        onSubmit={handleSubmitValidacion} 
      />
    );
  }

  if (showGastoOcr) {
    return (
      <GastoOcr 
        onClose={() => setShowGastoOcr(false)} 
        onSave={handleSaveGasto} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 max-w-md mx-auto shadow-2xl relative">
      
      {/* Header App */}
      <div className="bg-slate-900 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
              <HardHat className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Hola, Carlos</p>
              <p className="font-semibold">Jefe de Obra</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRequestNotifications}
              className={`p-2 rounded-full transition-colors ${notificationsEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}
              title={notificationsEnabled ? 'Notificaciones activadas' : 'Activar notificaciones'}
            >
              {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </button>
            <div className="text-right">
              <p className="text-xs text-slate-400">{new Date().toLocaleDateString('es-ES')}</p>
              <p className="font-mono font-bold text-emerald-400 text-[10px]">
                {isWorking ? 'EN TURNO' : 'FUERA'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        
        {/* TAB: CALENDARIO */}
        {activeTab === 'calendario' && (
          <Calendar obras={obras} onSelectObra={handleSelectObraFromCalendar} />
        )}

        {/* TAB: OBRA ACTIVA */}
        {activeTab === 'obra' && (
          <div className="space-y-4">
            
            {/* Tarjeta de Obra Seleccionada */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-3">
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-mono">
                  {obra.id}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                  obra.estadoOperativo === EstadoOperativo.EN_INSTALACION ? 'bg-amber-100 text-amber-700' :
                  obra.estadoOperativo === EstadoOperativo.FINALIZADA ? 'bg-emerald-100 text-emerald-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {obra.estadoOperativo.replace(/_/g, ' ')}
                </span>
              </div>
              
              <h2 className="text-xl font-bold mb-1">{obra.cliente}</h2>
              <p className="text-slate-500 text-sm flex items-start gap-1 mb-4">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                {obra.direccion}
              </p>

              {/* Estados Críticos de Validación/Legalización */}
              {obra.estadoValidacion === EstadoValidacion.RECHAZADO && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4 flex gap-3">
                  <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
                  <div>
                    <p className="font-bold text-rose-700">VALIDACIÓN RECHAZADA</p>
                    <p className="text-xs text-rose-600">Se han detectado defectos en el checklist fotográfico. Por favor, corrígelos y vuelve a enviar.</p>
                  </div>
                </div>
              )}

              {obra.estadoLegalizacion === EstadoLegalizacion.SUBSANACION && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                  <div>
                    <p className="font-bold text-amber-700">SUBSANACIÓN REQUERIDA</p>
                    <p className="text-xs text-amber-600">Industria requiere subsanación documental. Contacta con oficina técnica.</p>
                  </div>
                </div>
              )}

              {/* Acciones Operativas Principales */}
              <div className="space-y-3">
                {obra.estadoOperativo === EstadoOperativo.MATERIALES_RECIBIDOS && (
                  <button 
                    onClick={handleAvanzarOperativo}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <Play className="w-5 h-5" fill="currentColor" />
                    Iniciar Instalación
                  </button>
                )}

                {obra.estadoOperativo === EstadoOperativo.EN_INSTALACION && (
                  <button 
                    onClick={handleAvanzarOperativo}
                    className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Finalizar Instalación
                  </button>
                )}

                {obra.estadoOperativo === EstadoOperativo.FINALIZADA && 
                 obra.estadoValidacion !== EstadoValidacion.APROBADO_TECNICAMENTE && 
                 obra.estadoValidacion !== EstadoValidacion.PENDIENTE_REVISION && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Validación Pendiente
                    </h3>
                    <p className="text-sm text-amber-700 mb-4">
                      Debes completar el checklist fotográfico para validar la instalación.
                    </p>
                    <button 
                      onClick={() => setShowChecklist(true)}
                      className="w-full bg-amber-500 text-white py-3 rounded-lg font-bold shadow-sm active:scale-95 transition-transform"
                    >
                      Abrir Checklist de Validación
                    </button>
                  </div>
                )}

                {obra.estadoValidacion === EstadoValidacion.PENDIENTE_REVISION && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center text-emerald-700">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-bold">Checklist Enviado</p>
                    <p className="text-sm">Esperando revisión por parte de la Oficina Técnica.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Nueva Sección: Estado de Incidencias */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${obra.estadoIncidencias === EstadoIncidencias.SIN_INCIDENCIAS ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    <AlertTriangle className={`w-5 h-5 ${obra.estadoIncidencias === EstadoIncidencias.SIN_INCIDENCIAS ? 'text-emerald-600' : 'text-rose-600'}`} />
                  </div>
                  <h3 className="font-bold text-slate-800">Estado de Incidencias</h3>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                  obra.estadoIncidencias === EstadoIncidencias.SIN_INCIDENCIAS ? 'bg-emerald-100 text-emerald-700' :
                  obra.estadoIncidencias === EstadoIncidencias.INCIDENCIA_MENOR ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  {obra.estadoIncidencias.replace(/_/g, ' ')}
                </span>
              </div>

              {obra.estadoIncidencias !== EstadoIncidencias.SIN_INCIDENCIAS ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Hay una incidencia activa que requiere atención. Si el problema ha sido solucionado, pulsa el botón inferior.
                  </p>
                  <button 
                    onClick={() => updateObra({...obra, estadoIncidencias: EstadoIncidencias.SIN_INCIDENCIAS})}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Resolver Incidencia
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    No hay incidencias reportadas en esta obra actualmente.
                  </p>
                  <button 
                    onClick={handleBloqueo}
                    className="w-full bg-white text-rose-600 border border-rose-200 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:bg-rose-50 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Reportar Bloqueo / Problema
                  </button>
                </div>
              )}
            </div>

            {/* Tarjeta de Dirección (Bento Style) */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-blue-50 p-2 rounded-xl">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-800">Ubicación de la Obra</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                {obra.direccion}
              </p>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(obra.direccion)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm"
              >
                <MapPin className="w-4 h-4" />
                Cómo llegar (Google Maps)
              </a>
            </div>

            {/* Botones de simulación para el usuario (Solo para demo) */}
            <div className="p-4 bg-slate-200 rounded-2xl border border-dashed border-slate-400">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Simulación de Oficina Técnica</p>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={simulateRejection}
                  className="bg-rose-100 text-rose-700 text-[10px] font-bold py-2 rounded border border-rose-200"
                >
                  Rechazar Validación
                </button>
                <button 
                  onClick={simulateSubsanacion}
                  className="bg-amber-100 text-amber-700 text-[10px] font-bold py-2 rounded border border-amber-200"
                >
                  Pedir Subsanación
                </button>
              </div>
            </div>

            {/* Detalles Técnicos */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-3">Detalles Técnicos</h3>
              <div className="grid grid-cols-2 gap-3">
                {obra.tipoObra === TipoObra.CLIMATIZACION ? (
                  <div className="bg-slate-50 p-3 rounded-lg col-span-2">
                    <p className="text-xs text-slate-500">Equipo Principal</p>
                    <p className="font-bold">{obra.equipoPrincipal || 'No especificado'}</p>
                  </div>
                ) : obra.tipoObra === TipoObra.AMPLIACION ? (
                  <>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-500">Ampliación</p>
                      <p className="font-bold">{obra.numPlacas} Placas</p>
                      <p className="text-[10px] text-slate-400">+{obra.potenciaKw} kWp</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-500">Obra Original</p>
                      <p className="font-bold text-blue-600">{obra.obraOriginalId}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg col-span-2">
                      <p className="text-xs text-slate-500">Descripción</p>
                      <p className="text-sm font-medium">{obra.descripcionAmpliacion}</p>
                    </div>
                  </>
                ) : obra.tipoObra === TipoObra.ALQUILER_CUBIERTA ? (
                  <>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-500">Superficie</p>
                      <p className="font-bold">{obra.superficieM2} m²</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-500">Canon Anual</p>
                      <p className="font-bold text-emerald-600">{obra.canonAnual} €/año</p>
                    </div>
                  </>
                ) : obra.tipoObra === TipoObra.MANO_DE_OBRA ? (
                  <div className="bg-slate-50 p-3 rounded-lg col-span-2">
                    <p className="text-xs text-slate-500">Empresa Contratante</p>
                    <p className="font-bold">{obra.empresaContratante}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Solo instalación (Mano de obra)</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-500">Placas</p>
                      <p className="font-bold">{obra.numPlacas} x {obra.potenciaPlacaWp}Wp</p>
                      <p className="text-[10px] text-slate-400">Total: {obra.potenciaKw} kWp</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-500">Strings</p>
                      <p className="font-bold">{obra.numStrings || 0} Strings</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg col-span-2">
                      <p className="text-xs text-slate-500">Inversor</p>
                      <p className="font-bold">{obra.modeloInversor || obra.equipoPrincipal || 'No especificado'}</p>
                    </div>
                  </>
                )}
                <div className="bg-slate-50 p-3 rounded-lg col-span-2">
                  <p className="text-xs text-slate-500">Estructura / Notas</p>
                  <p className="font-bold">Coplanar</p>
                  {obra.planificacion?.notas && (
                    <p className="text-[10px] text-slate-500 mt-1 italic">"{obra.planificacion.notas}"</p>
                  )}
                </div>
              </div>
              <button className="w-full mt-3 text-slate-600 text-sm font-medium py-2 flex items-center justify-between border-t border-slate-100">
                Ver todas las características <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB: FICHAJE */}
        {activeTab === 'fichaje' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold mb-1">Control Horario</h2>
              <p className="text-slate-500 mb-8">Registra tu jornada laboral</p>

              {isWorking ? (
                <button 
                  onClick={() => setIsWorking(false)}
                  className="w-full bg-rose-500 text-white py-4 rounded-xl font-bold text-lg shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Square className="w-5 h-5" fill="currentColor" />
                  Finalizar Jornada
                </button>
              ) : (
                <button 
                  onClick={() => setIsWorking(true)}
                  className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Play className="w-5 h-5" fill="currentColor" />
                  Iniciar Jornada
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-3">Registros de hoy</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <div>
                    <p className="font-medium">Entrada</p>
                    <p className="text-xs text-slate-500">Ubicación: Nave Central</p>
                  </div>
                  <p className="font-mono font-bold">07:45</p>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <div>
                    <p className="font-medium">Inicio Viaje</p>
                    <p className="text-xs text-slate-500">Hacia: {obra.cliente}</p>
                  </div>
                  <p className="font-mono font-bold">08:10</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: GASTOS */}
        {activeTab === 'gastos' && (
          <div className="space-y-4">
            <button 
              onClick={() => setShowGastoOcr(true)}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5" />
              Nuevo Gasto / Ticket
            </button>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-3">Mis Gastos (Octubre)</h3>
              
              <div className="space-y-3">
                {gastos.map(g => (
                  <div key={g.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        g.categoria === 'COMBUSTIBLE' ? 'bg-amber-100 text-amber-600' :
                        g.categoria === 'MATERIAL' ? 'bg-emerald-100 text-emerald-600' :
                        g.categoria === 'DIETAS' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm flex items-center gap-1">
                          {g.proveedor}
                          {(g.tipoDocumento === 'FACTURA_SIMPLIFICADA' || g.tipoDocumento === 'ALBARAN') && (
                            <AlertTriangle className="w-3 h-3 text-amber-500" title="Requiere revisión de administración" />
                          )}
                        </p>
                        <p className="text-[10px] text-slate-500">{g.concepto}</p>
                        {g.numeroDocumento && g.numeroDocumento !== 'Desconocido' && (
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">Ref: {g.numeroDocumento}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-slate-400 uppercase">
                            {g.categoria}
                          </span>
                          <span className={`text-[9px] font-bold uppercase ${
                            g.estado === 'APROBADO' ? 'text-emerald-500' : 
                            g.estado === 'RECHAZADO' ? 'text-rose-500' : 
                            'text-amber-500'
                          }`}>
                            • {g.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900">{g.importe.toFixed(2)} €</p>
                      <p className="text-[9px] text-slate-400">{new Date(g.fecha).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Navigation Bar */}
      <div className="bg-white border-t border-slate-200 fixed bottom-0 w-full max-w-md pb-safe">
        <div className="flex justify-around p-2">
          <button 
            onClick={() => setActiveTab('calendario')}
            className={`flex flex-col items-center p-2 w-20 rounded-xl transition-colors ${activeTab === 'calendario' ? 'text-slate-900 bg-slate-100' : 'text-slate-400'}`}
          >
            <CalendarIcon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Agenda</span>
          </button>

          <button 
            onClick={() => setActiveTab('obra')}
            className={`flex flex-col items-center p-2 w-20 rounded-xl transition-colors ${activeTab === 'obra' ? 'text-slate-900 bg-slate-100' : 'text-slate-400'}`}
          >
            <HardHat className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Obra</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('fichaje')}
            className={`flex flex-col items-center p-2 w-20 rounded-xl transition-colors ${activeTab === 'fichaje' ? 'text-slate-900 bg-slate-100' : 'text-slate-400'}`}
          >
            <Clock className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Fichaje</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('gastos')}
            className={`flex flex-col items-center p-2 w-20 rounded-xl transition-colors ${activeTab === 'gastos' ? 'text-slate-900 bg-slate-100' : 'text-slate-400'}`}
          >
            <Receipt className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Gastos</span>
          </button>
        </div>
      </div>

    </div>
  );
}

