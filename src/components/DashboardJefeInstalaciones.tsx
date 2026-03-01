import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  HardHat, 
  ClipboardCheck, 
  AlertOctagon, 
  Users, 
  Calendar, 
  Search, 
  Filter,
  ChevronRight,
  MoreVertical,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  List,
  KanbanSquare,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { obraClient } from '../services/obraClient';
import { Obra, EstadoOperativo, EstadoValidacion, EstadoIncidencias, TipoObra } from '../types/obra';

export function DashboardJefeInstalaciones() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TipoObra | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [technicianFilter, setTechnicianFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'lista' | 'kanban'>('kanban');
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchObras = async () => {
      try {
        const data = await obraClient.getObras();
        setObras(data);
      } catch (e) {
        console.error('Error fetching obras', e);
      } finally {
        setLoading(false);
      }
    };
    fetchObras();
  }, []);

  // Estadísticas rápidas
  const stats = {
    activas: obras.filter(o => o.estadoOperativo === EstadoOperativo.EN_INSTALACION).length,
    pendientesValidar: obras.filter(o => o.estadoValidacion === EstadoValidacion.PENDIENTE_REVISION).length,
    bloqueadas: obras.filter(o => o.estadoIncidencias === EstadoIncidencias.BLOQUEO_CRITICO).length,
    totalMes: obras.length
  };

  const filteredObras = obras.filter(o => {
    const matchesSearch = o.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.includes(searchTerm);
    const matchesFilter = filterType === 'ALL' || o.tipoObra === filterType;
    
    // Filtro por fecha (created_at)
    const obraDate = new Date(o.createdAt);
    const matchesStartDate = !startDate || obraDate >= new Date(startDate);
    const matchesEndDate = !endDate || obraDate <= new Date(endDate);
    
    // Filtro por técnico (si existe en planificacion.equipo)
    const matchesTechnician = technicianFilter === 'ALL' || 
      (o.planificacion?.equipo?.some(m => m.nombre === technicianFilter));

    return matchesSearch && matchesFilter && matchesStartDate && matchesEndDate && matchesTechnician;
  });

  // Obtener lista única de técnicos para el filtro
  const allTechnicians = Array.from(new Set(
    obras.flatMap(o => o.planificacion?.equipo?.map(m => m.nombre) || [])
  )).filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden lg:flex">
        <div className="p-6">
          <div className="flex items-center gap-3 text-white mb-8">
            <div className="bg-blue-600 p-2 rounded-lg">
              <HardHat className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight">AURO PM</span>
          </div>
          
          <nav className="space-y-1">
            <NavItem icon={LayoutDashboard} label="Dashboard" active />
            <NavItem icon={HardHat} label="Obras en Curso" />
            <NavItem icon={ClipboardCheck} label="Validaciones" badge={stats.pendientesValidar} />
            <NavItem icon={AlertOctagon} label="Incidencias" badge={stats.bloqueadas} />
            <NavItem icon={Users} label="Gestión de Equipos" />
            <NavItem icon={Calendar} label="Planificación" />
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <img src="https://i.pravatar.cc/150?u=jefe" className="w-10 h-10 rounded-full border border-slate-700" alt="Jefe" />
            <div>
              <p className="text-sm font-bold text-white">Ricardo Jefe</p>
              <p className="text-xs text-slate-500">Director de Instalaciones</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">Panel de Control de Instalaciones</h1>
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('lista')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'lista' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <KanbanSquare className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar obra o cliente..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg text-sm w-64 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
              Nueva Obra
            </button>
          </div>
        </header>

        {/* Dashboard Scroll Area */}
        <div className="flex-1 overflow-auto p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              label="Obras en Instalación" 
              value={stats.activas} 
              icon={HardHat} 
              color="blue" 
              trend="+2 hoy"
            />
            <StatCard 
              label="Pendientes de Validar" 
              value={stats.pendientesValidar} 
              icon={ClipboardCheck} 
              color="amber" 
              trend="Urgente"
            />
            <StatCard 
              label="Bloqueos Operativos" 
              value={stats.bloqueadas} 
              icon={AlertOctagon} 
              color="rose" 
              trend="Requiere acción"
            />
            <StatCard 
              label="Total Obras Mes" 
              value={stats.totalMes} 
              icon={Calendar} 
              color="slate" 
              trend="Meta: 40"
            />
          </div>

          {viewMode === 'lista' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Project List Table */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-800">Seguimiento de Obras</h2>
                    <div className="flex gap-2 flex-wrap">
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <input 
                          type="date" 
                          className="text-[10px] outline-none" 
                          value={startDate} 
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span className="text-[10px] text-slate-300">-</span>
                        <input 
                          type="date" 
                          className="text-[10px] outline-none" 
                          value={endDate} 
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                      <select 
                        className="text-[10px] border-slate-200 rounded-lg bg-white p-1 px-2 outline-none shadow-sm"
                        value={technicianFilter}
                        onChange={(e) => setTechnicianFilter(e.target.value)}
                      >
                        <option value="ALL">Todos los técnicos</option>
                        {allTechnicians.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <select 
                        className="text-[10px] border-slate-200 rounded-lg bg-white p-1 px-2 outline-none shadow-sm"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                      >
                        <option value="ALL">Todos los tipos</option>
                        {Object.values(TipoObra).map(t => (
                          <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => {
                          setStartDate('');
                          setEndDate('');
                          setTechnicianFilter('ALL');
                          setFilterType('ALL');
                          setSearchTerm('');
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
                        title="Limpiar filtros"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          <th className="px-6 py-3">Obra / Cliente</th>
                          <th className="px-6 py-3">Tipo</th>
                          <th className="px-6 py-3">Estado Operativo</th>
                          <th className="px-6 py-3">Validación</th>
                          <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredObras.map(obra => (
                          <tr key={obra.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-sm">{obra.cliente}</span>
                                <span className="text-xs text-slate-400 font-mono">{obra.id}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full uppercase">
                                {obra.tipoObra.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  obra.estadoOperativo === EstadoOperativo.EN_INSTALACION ? 'bg-blue-500 animate-pulse' :
                                  obra.estadoOperativo === EstadoOperativo.FINALIZADA ? 'bg-emerald-500' :
                                  'bg-slate-300'
                                }`} />
                                <span className="text-xs font-medium text-slate-600">
                                  {obra.estadoOperativo.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                obra.estadoValidacion === EstadoValidacion.PENDIENTE_REVISION ? 'bg-amber-100 text-amber-700' :
                                obra.estadoValidacion === EstadoValidacion.APROBADO_TECNICAMENTE ? 'bg-emerald-100 text-emerald-700' :
                                'bg-slate-100 text-slate-500'
                              }`}>
                                {obra.estadoValidacion.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 group-hover:text-blue-600 transition-all">
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Sidebar Widgets */}
              <div className="space-y-6">
                {/* Validaciones Pendientes Feed */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-amber-500" />
                      Revisiones Pendientes
                    </h2>
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {stats.pendientesValidar}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {obras.filter(o => o.estadoValidacion === EstadoValidacion.PENDIENTE_REVISION).map(o => (
                      <div key={o.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{o.cliente}</p>
                            <p className="text-[10px] text-slate-500">Enviado hace 2h por Carlos R.</p>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button className="flex-1 bg-white border border-slate-200 text-slate-600 py-1.5 rounded-lg text-[10px] font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors">
                            Rechazar
                          </button>
                          <button className="flex-1 bg-slate-900 text-white py-1.5 rounded-lg text-[10px] font-bold hover:bg-emerald-600 transition-colors">
                            Validar OK
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Incidencias Activas */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <AlertOctagon className="w-5 h-5 text-rose-500" />
                    Alertas de Campo
                  </h2>
                  
                  <div className="space-y-3">
                    {obras.filter(o => o.estadoIncidencias === EstadoIncidencias.BLOQUEO_CRITICO).map(o => (
                      <div key={o.id} className="flex gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                        <div className="bg-rose-100 p-2 rounded-lg h-fit">
                          <AlertOctagon className="w-4 h-4 text-rose-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-rose-900">{o.cliente}</p>
                          <p className="text-[10px] text-rose-700 mt-1">Bloqueo: Falta material en cubierta. El equipo está parado.</p>
                          <button className="mt-2 text-[10px] font-bold text-rose-600 underline">
                            Contactar con equipo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-280px)]">
              {Object.values(EstadoOperativo).map(estado => (
                <div key={estado} className="flex-shrink-0 w-80 bg-slate-100/50 rounded-xl flex flex-col border border-slate-200">
                  <div className="p-3 border-b border-slate-200 bg-slate-100 rounded-t-xl flex justify-between items-center">
                    <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">{estado.replace(/_/g, ' ')}</h3>
                    <span className="bg-white text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      {filteredObras.filter(o => o.estadoOperativo === estado).length}
                    </span>
                  </div>
                  <div className="p-3 flex-1 overflow-y-auto space-y-3">
                    {filteredObras.filter(o => o.estadoOperativo === estado).map(obra => (
                      <div key={obra.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-mono text-slate-400">{obra.id}</span>
                          <span className={`w-2 h-2 rounded-full ${
                            obra.estadoOperativo === EstadoOperativo.EN_INSTALACION ? 'bg-blue-500 animate-pulse' :
                            obra.estadoOperativo === EstadoOperativo.FINALIZADA ? 'bg-emerald-500' :
                            'bg-slate-300'
                          }`} />
                        </div>
                        <p className="font-bold text-sm text-slate-800 mb-1 leading-tight">{obra.cliente}</p>
                        <p className="text-xs text-slate-500 truncate mb-3">{obra.direccion}</p>
                        
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full uppercase">
                            {obra.tipoObra.replace(/_/g, ' ')}
                          </span>
                          <div className="flex -space-x-2">
                            {obra.planificacion?.equipo?.slice(0, 3).map((miembro, i) => (
                              <img key={i} src={miembro.avatarUrl} className="w-6 h-6 rounded-full border-2 border-white" title={miembro.nombre} alt={miembro.nombre} />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false, badge }: { icon: any, label: string, active?: boolean, badge?: number }) {
  return (
    <a 
      href="#" 
      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
        active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {badge && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-white text-blue-600' : 'bg-slate-800 text-slate-400'}`}>
          {badge}
        </span>
      )}
    </a>
  );
}

function StatCard({ label, value, icon: Icon, color, trend, trendUp = true }: { label: string, value: number, icon: any, color: string, trend: string, trendUp?: boolean }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-50 text-slate-600'
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <div className={`${colorMap[color]} p-3 rounded-xl`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
          color === 'rose' ? 'bg-rose-100 text-rose-700' : 
          color === 'amber' ? 'bg-amber-100 text-amber-700' : 
          'bg-emerald-100 text-emerald-700'
        }`}>
          {trend}
        </span>
      </div>
      <p className="text-3xl font-black text-slate-900 mb-1">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}
