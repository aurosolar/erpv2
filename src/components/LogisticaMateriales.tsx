import React, { useState } from 'react';
import { Obra, EstadoOperativo, TipoObra } from '../types/obra';
import { mockObras } from './FichaObra';
import { 
  Package, 
  Search, 
  Filter, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Box,
  ShoppingCart,
  ClipboardList
} from 'lucide-react';

export function LogisticaMateriales() {
  const [searchTerm, setSearchTerm] = useState('');

  // Obras que están en fase de pedido de material o recibidos
  const obrasLogistica = mockObras.filter(o => 
    o.estadoOperativo === EstadoOperativo.MATERIALES_PEDIDOS || 
    o.estadoOperativo === EstadoOperativo.MATERIALES_RECIBIDOS ||
    o.estadoOperativo === EstadoOperativo.EN_INSTALACION
  );

  const filteredObras = obrasLogistica.filter(obra => 
    obra.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || 
    obra.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    pendientesPedido: obrasLogistica.filter(o => o.estadoOperativo === EstadoOperativo.MATERIALES_PEDIDOS).length,
    enTransito: 3, // Mock data
    listasParaInstalar: obrasLogistica.filter(o => o.estadoOperativo === EstadoOperativo.MATERIALES_RECIBIDOS).length,
    alertasStock: 2 // Mock data
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-6 h-6 text-indigo-600" />
              Logística y Materiales
            </h1>
            <p className="text-sm text-slate-500">Gestión de compras, almacén y envíos a obra</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar pedido u obra..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-lg text-sm w-64 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Nuevo Pedido
            </button>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">Pendientes de Pedido</p>
                <div className="bg-amber-100 p-2 rounded-lg"><ClipboardList className="w-4 h-4 text-amber-600" /></div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stats.pendientesPedido}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">Material en Tránsito</p>
                <div className="bg-blue-100 p-2 rounded-lg"><Truck className="w-4 h-4 text-blue-600" /></div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stats.enTransito}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">Listas para Instalar</p>
                <div className="bg-emerald-100 p-2 rounded-lg"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stats.listasParaInstalar}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">Alertas de Stock</p>
                <div className="bg-rose-100 p-2 rounded-lg"><AlertTriangle className="w-4 h-4 text-rose-600" /></div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stats.alertasStock}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main List */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="font-bold text-slate-800">Seguimiento de Materiales por Obra</h2>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-200">
                      <th className="px-6 py-4">Obra / Cliente</th>
                      <th className="px-6 py-4">Material Principal</th>
                      <th className="px-6 py-4">Estado Logístico</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredObras.map(obra => (
                      <tr key={obra.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{obra.cliente}</span>
                            <span className="text-xs text-slate-500 font-mono mt-0.5">{obra.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {obra.tipoObra === TipoObra.FV_ESTANDAR || obra.tipoObra === TipoObra.FV_BATERIA ? (
                              <>
                                <span className="text-xs font-medium text-slate-700">{obra.numPlacas}x {obra.potenciaPlacaWp}W</span>
                                <span className="text-[10px] text-slate-500 truncate max-w-[200px]">{obra.modeloInversor}</span>
                              </>
                            ) : (
                              <span className="text-xs font-medium text-slate-700">{obra.equipoPrincipal || 'Material Vario'}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {obra.estadoOperativo === EstadoOperativo.MATERIALES_PEDIDOS ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-amber-50 text-amber-700 border-amber-200">
                              <ShoppingCart className="w-3 h-3" /> Pendiente Pedido
                            </span>
                          ) : obra.estadoOperativo === EstadoOperativo.MATERIALES_RECIBIDOS ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                              <Box className="w-3 h-3" /> Material en Almacén
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200">
                              <Truck className="w-3 h-3" /> Enviado a Obra
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredObras.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                          No hay obras en fase logística actualmente.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sidebar: Inventario Rápido */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Box className="w-5 h-5 text-indigo-500" />
                  Stock Crítico
                </h2>
                
                <div className="space-y-4">
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-slate-800">Estructura Coplanar (Tramos 2.1m)</p>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">Bajo</span>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <p className="text-sm font-mono text-slate-600">12 uds</p>
                      <button className="text-[10px] font-bold text-indigo-600 hover:underline">Pedir más</button>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-slate-800">Optimizadores Huawei 450W</p>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">Alerta</span>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <p className="text-sm font-mono text-slate-600">45 uds</p>
                      <button className="text-[10px] font-bold text-indigo-600 hover:underline">Pedir más</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Truck className="w-5 h-5 text-blue-500" />
                  Entregas Previstas Hoy
                </h2>
                
                <div className="space-y-3">
                  <div className="flex gap-3 items-center p-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <div className="bg-slate-100 p-2 rounded-lg">
                      <Package className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">Palet Paneles Jinko 550W</p>
                      <p className="text-[10px] text-slate-500">Proveedor: Amara NZero</p>
                    </div>
                    <span className="text-xs font-mono text-slate-400">12:30</span>
                  </div>
                  <div className="flex gap-3 items-center p-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <div className="bg-slate-100 p-2 rounded-lg">
                      <Package className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">Inversores Huawei (x5)</p>
                      <p className="text-[10px] text-slate-500">Proveedor: Krannich</p>
                    </div>
                    <span className="text-xs font-mono text-slate-400">16:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
