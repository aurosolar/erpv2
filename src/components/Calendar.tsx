import React from 'react';
import { Obra, EstadoOperativo } from '../types/obra';
import { Calendar as CalendarIcon, MapPin, Clock, ChevronRight } from 'lucide-react';

interface CalendarProps {
  obras: Obra[];
  onSelectObra: (obraId: string) => void;
}

export function Calendar({ obras, onSelectObra }: CalendarProps) {
  const today = new Date();
  
  // En un caso real, filtraríamos por fecha. Aquí usamos todas las mockeadas como si fueran de hoy.
  const obrasHoy = obras;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 p-2 rounded-xl">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Calendario de Instalaciones</h3>
              <p className="text-xs text-slate-500">{today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
            {obrasHoy.length} HOY
          </span>
        </div>

        <div className="space-y-3">
          {obrasHoy.map((obra, index) => {
            // Simulamos horas para la vista de calendario
            const startHour = 8 + (index * 4);
            const endHour = startHour + 3;
            
            return (
              <div 
                key={obra.id}
                onClick={() => onSelectObra(obra.id)}
                className="flex gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer group"
              >
                <div className="flex flex-col items-center justify-center w-16 shrink-0 border-r border-slate-200 pr-3">
                  <span className="text-sm font-bold text-slate-700">{startHour}:00</span>
                  <span className="text-[10px] text-slate-400">{endHour}:00</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-sm text-slate-800 truncate">{obra.cliente}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                      obra.estadoOperativo === EstadoOperativo.EN_INSTALACION ? 'bg-amber-100 text-amber-700' :
                      obra.estadoOperativo === EstadoOperativo.FINALIZADA ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {obra.estadoOperativo.replace(/_/g, ' ')}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-2 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {obra.direccion}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-mono text-slate-400">{obra.id}</span>
                    <span className="text-[10px] font-bold text-blue-600 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver detalles <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
