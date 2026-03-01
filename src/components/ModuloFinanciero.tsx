import React, { useState, useEffect } from 'react';
import { Obra, EstadoFinanciero, TipoObra } from '../types/obra';
import { obraClient } from '../services/obraClient';
import { 
  Banknote, 
  Search, 
  Filter, 
  TrendingUp, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Receipt,
  CreditCard,
  Wallet,
  Loader2
} from 'lucide-react';

export function ModuloFinanciero() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<EstadoFinanciero | 'ALL'>('ALL');
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

  const filteredObras = obras.filter(obra => {
    const matchesSearch = obra.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          obra.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'ALL' || obra.estadoFinanciero === filterEstado;
    return matchesSearch && matchesEstado;
  });

  const totalPresupuestado = obras.reduce((acc, o) => acc + o.presupuestoTotal, 0);
  const totalCobrado = obras.reduce((acc, o) => acc + o.cobradoHastaAhora, 0);
  const totalPendiente = totalPresupuestado - totalCobrado;
  const obrasImpagadas = obras.filter(o => o.estadoFinanciero === EstadoFinanciero.IMPAGADO).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const getEstadoColor = (estado: EstadoFinanciero) => {
    switch (estado) {
      case EstadoFinanciero.PAGADO_TOTAL: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case EstadoFinanciero.ANTICIPO_PAGADO:
      case EstadoFinanciero.HITO_PAGADO: return 'bg-blue-100 text-blue-700 border-blue-200';
      case EstadoFinanciero.PENDIENTE_ANTICIPO:
      case EstadoFinanciero.PENDIENTE_HITO:
      case EstadoFinanciero.PENDIENTE_FINAL: return 'bg-amber-100 text-amber-700 border-amber-200';
      case EstadoFinanciero.IMPAGADO: return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Banknote className="w-6 h-6 text-emerald-600" />
              Módulo Financiero y Facturación
            </h1>
            <p className="text-sm text-slate-500">Control de cobros, pagos y rentabilidad</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar cliente o factura..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-lg text-sm w-64 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Nueva Factura
            </button>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">Total Presupuestado</p>
                <div className="bg-slate-100 p-2 rounded-lg"><TrendingUp className="w-4 h-4 text-slate-600" /></div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalPresupuestado)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">Total Cobrado</p>
                <div className="bg-emerald-100 p-2 rounded-lg"><Wallet className="w-4 h-4 text-emerald-600" /></div>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalCobrado)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">Pendiente de Cobro</p>
                <div className="bg-amber-100 p-2 rounded-lg"><Clock className="w-4 h-4 text-amber-600" /></div>
              </div>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalPendiente)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">Impagos Críticos</p>
                <div className="bg-rose-100 p-2 rounded-lg"><AlertOctagon className="w-4 h-4 text-rose-600" /></div>
              </div>
              <p className="text-2xl font-bold text-rose-600">{obrasImpagadas}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main List */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="font-bold text-slate-800">Estado de Cobros por Obra</h2>
                <div className="flex gap-2">
                  <select 
                    className="text-sm border-slate-200 rounded-lg bg-white p-2 outline-none shadow-sm"
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value as any)}
                  >
                    <option value="ALL">Todos los estados</option>
                    {Object.values(EstadoFinanciero).map(e => (
                      <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-200">
                      <th className="px-6 py-4">Obra / Cliente</th>
                      <th className="px-6 py-4">Estado Financiero</th>
                      <th className="px-6 py-4 text-right">Presupuesto</th>
                      <th className="px-6 py-4 text-right">Cobrado</th>
                      <th className="px-6 py-4 text-right">Progreso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredObras.map(obra => {
                      const porcentajeCobrado = Math.round((obra.cobradoHastaAhora / obra.presupuestoTotal) * 100) || 0;
                      return (
                        <tr key={obra.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{obra.cliente}</span>
                              <span className="text-xs text-slate-500 font-mono mt-0.5">{obra.id}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${getEstadoColor(obra.estadoFinanciero)}`}>
                              {obra.estadoFinanciero.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-700">
                            {formatCurrency(obra.presupuestoTotal)}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-emerald-600">
                            {formatCurrency(obra.cobradoHastaAhora)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs font-bold text-slate-600">{porcentajeCobrado}%</span>
                              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${porcentajeCobrado === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                  style={{ width: `${porcentajeCobrado}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredObras.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          No se encontraron obras con los filtros actuales.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sidebar: Facturas y Alertas */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <AlertOctagon className="w-5 h-5 text-rose-500" />
                  Alertas de Impago
                </h2>
                
                <div className="space-y-3">
                  {obras.filter(o => o.estadoFinanciero === EstadoFinanciero.IMPAGADO).map(o => (
                    <div key={o.id} className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-bold text-rose-900">{o.cliente}</p>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">Bloqueante</span>
                      </div>
                      <p className="text-[10px] text-rose-700 mt-1">Falta pago del 50% previo a instalación.</p>
                      <div className="flex justify-between items-end mt-2">
                        <p className="text-sm font-bold text-rose-600">{formatCurrency(o.presupuestoTotal - o.cobradoHastaAhora)}</p>
                        <button className="text-[10px] font-bold text-rose-600 underline">Reclamar</button>
                      </div>
                    </div>
                  ))}
                  {obras.filter(o => o.estadoFinanciero === EstadoFinanciero.IMPAGADO).length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4 italic">No hay impagos bloqueantes activos.</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Receipt className="w-5 h-5 text-blue-500" />
                  Próximos Hitos de Facturación
                </h2>
                
                <div className="space-y-3">
                  {obras.filter(o => o.estadoFinanciero === EstadoFinanciero.PENDIENTE_FINAL || o.estadoFinanciero === EstadoFinanciero.PENDIENTE_HITO).slice(0, 4).map(o => (
                    <div key={o.id} className="flex gap-3 items-center p-2 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100">
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800">{o.cliente}</p>
                        <p className="text-[10px] text-slate-500">{o.estadoFinanciero === EstadoFinanciero.PENDIENTE_FINAL ? 'Pago Final (Fin de Obra)' : 'Pago Intermedio'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-700">{formatCurrency(o.presupuestoTotal - o.cobradoHastaAhora)}</p>
                        <button className="text-[10px] font-bold text-blue-600 hover:underline">Emitir Fra.</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
