import React, { useState } from 'react';
import { Obra, EstadoLegalizacion, TipoObra } from '../types/obra';
import { mockObras } from './FichaObra';
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  Upload,
  Download,
  Building2,
  FileSignature
} from 'lucide-react';

export function CentroLegalizaciones() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<EstadoLegalizacion | 'ALL'>('ALL');

  // Filtrar solo obras que requieren legalización
  const obrasLegalizacion = mockObras.filter(o => o.requiereLegalizacion);

  const filteredObras = obrasLegalizacion.filter(obra => {
    const matchesSearch = obra.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          obra.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'ALL' || obra.estadoLegalizacion === filterEstado;
    return matchesSearch && matchesEstado;
  });

  const stats = {
    total: obrasLegalizacion.length,
    completadas: obrasLegalizacion.filter(o => o.estadoLegalizacion === EstadoLegalizacion.LEGALIZADA).length,
    enTramite: obrasLegalizacion.filter(o => o.estadoLegalizacion === EstadoLegalizacion.PRESENTADO_INDUSTRIA).length,
    requiereAccion: obrasLegalizacion.filter(o => o.estadoLegalizacion === EstadoLegalizacion.RECOPILANDO_DOCS || o.estadoLegalizacion === EstadoLegalizacion.NO_INICIADA).length,
  };

  const getEstadoColor = (estado: EstadoLegalizacion) => {
    switch (estado) {
      case EstadoLegalizacion.LEGALIZADA: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case EstadoLegalizacion.PRESENTADO_INDUSTRIA: return 'bg-blue-100 text-blue-700 border-blue-200';
      case EstadoLegalizacion.RECOPILANDO_DOCS: return 'bg-amber-100 text-amber-700 border-amber-200';
      case EstadoLegalizacion.NO_INICIADA: return 'bg-rose-100 text-rose-700 border-rose-200';
      case EstadoLegalizacion.SUBSANACION: return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getEstadoIcon = (estado: EstadoLegalizacion) => {
    switch (estado) {
      case EstadoLegalizacion.LEGALIZADA: return <CheckCircle2 className="w-4 h-4" />;
      case EstadoLegalizacion.PRESENTADO_INDUSTRIA: return <Clock className="w-4 h-4" />;
      case EstadoLegalizacion.RECOPILANDO_DOCS: return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              Centro de Legalizaciones
            </h1>
            <p className="text-sm text-slate-500">Gestión de expedientes con Industria y Distribuidoras</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar expediente..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg text-sm w-64 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2">
              <FileSignature className="w-4 h-4" />
              Nuevo Expediente
            </button>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">Total Expedientes</p>
                <div className="bg-slate-100 p-2 rounded-lg"><FileText className="w-4 h-4 text-slate-600" /></div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">En Trámite</p>
                <div className="bg-blue-100 p-2 rounded-lg"><Clock className="w-4 h-4 text-blue-600" /></div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stats.enTramite}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">Requieren Acción</p>
                <div className="bg-amber-100 p-2 rounded-lg"><AlertCircle className="w-4 h-4 text-amber-600" /></div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stats.requiereAccion}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">Legalizadas</p>
                <div className="bg-emerald-100 p-2 rounded-lg"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stats.completadas}</p>
            </div>
          </div>

          {/* Main List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-bold text-slate-800">Expedientes Activos</h2>
              <div className="flex gap-2">
                <select 
                  className="text-sm border-slate-200 rounded-lg bg-white p-2 outline-none shadow-sm"
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value as any)}
                >
                  <option value="ALL">Todos los estados</option>
                  {Object.values(EstadoLegalizacion).map(e => (
                    <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">Expediente / Cliente</th>
                    <th className="px-6 py-4">Instalación</th>
                    <th className="px-6 py-4">Estado Legalización</th>
                    <th className="px-6 py-4">Documentos Clave</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredObras.map(obra => (
                    <tr key={obra.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{obra.cliente}</span>
                          <span className="text-xs text-slate-500 font-mono mt-0.5">EXP-{obra.id.split('-')[1]}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-slate-700">{obra.potenciaKw} kWp</span>
                          <span className="text-[10px] text-slate-500 truncate max-w-[200px]">{obra.direccion}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getEstadoColor(obra.estadoLegalizacion)}`}>
                          {getEstadoIcon(obra.estadoLegalizacion)}
                          {obra.estadoLegalizacion.replace(/_/g, ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <DocBadge label="CIE" status={obra.documentos.some(d => d.tipo === 'CIE') ? 'ok' : 'missing'} />
                          <DocBadge label="Memoria" status={obra.documentos.some(d => d.tipo === 'MEMORIA') ? 'ok' : 'missing'} />
                          <DocBadge label="Rep. Vol." status={obra.documentos.some(d => d.tipo === 'REPRESENTACION_VOLUNTARIA') ? 'ok' : 'missing'} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredObras.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        No se encontraron expedientes con los filtros actuales.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DocBadge({ label, status }: { label: string, status: 'ok' | 'missing' | 'pending' }) {
  const colors = {
    ok: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    missing: 'bg-slate-50 text-slate-400 border-slate-200 border-dashed',
    pending: 'bg-amber-50 text-amber-600 border-amber-200'
  };

  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${colors[status]}`}>
      {label}
    </span>
  );
}
