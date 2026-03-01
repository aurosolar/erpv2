import React, { useState, useRef } from 'react';
import { Camera, X, Loader2, Check, AlertCircle, Upload } from 'lucide-react';
import { ocrService, OcrResult } from '../services/ocrService';
import { Gasto, CategoriaGasto } from '../types/obra';

interface GastoOcrProps {
  onClose: () => void;
  onSave: (gasto: Partial<Gasto>) => void;
}

export function GastoOcr({ onClose, onSave }: GastoOcrProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImage(base64String);
        processImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const data = await ocrService.processReceipt(base64);
      setResult(data);
    } catch (err) {
      setError("No se pudo leer el ticket. Asegúrate de que la foto sea legible.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (result) {
      onSave({
        proveedor: result.proveedor,
        numeroDocumento: result.numeroDocumento,
        tipoDocumento: result.tipoDocumento,
        concepto: result.concepto,
        importe: result.importe,
        categoria: result.categoria,
        fecha: new Date().toISOString(),
        estado: 'PENDIENTE',
        comprobanteUrl: image || undefined
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-50 flex flex-col p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-white text-xl font-bold">Nuevo Gasto con OCR</h2>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      {!image ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-xs aspect-square bg-slate-800 rounded-3xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-700 transition-colors"
          >
            <div className="bg-slate-700 p-4 rounded-full">
              <Camera className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium">Hacer foto al ticket</p>
          </div>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-blue-400 font-medium"
          >
            <Upload className="w-4 h-4" />
            O subir desde galería
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            capture="environment"
            className="hidden" 
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-black aspect-[3/4] max-h-[40vh] mx-auto">
            <img src={image} alt="Ticket" className="w-full h-full object-contain" />
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white">
                <Loader2 className="w-10 h-10 animate-spin mb-2" />
                <p className="font-medium">Analizando con AI...</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-rose-200 text-sm">
                <p className="font-bold">Error de lectura</p>
                <p>{error}</p>
                <button 
                  onClick={() => setImage(null)}
                  className="mt-2 text-white underline font-bold"
                >
                  Intentar otra foto
                </button>
              </div>
            </div>
          )}

          {result && !isProcessing && (
            <div className="bg-white rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <Check className="w-5 h-5" />
                <span className="font-bold text-sm uppercase tracking-wider">Datos Extraídos</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Proveedor</label>
                  <p className="font-bold text-slate-800 border-b border-slate-100 pb-1">{result.proveedor}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Nº Documento</label>
                  <p className="font-bold text-slate-800 border-b border-slate-100 pb-1">{result.numeroDocumento}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Tipo Documento</label>
                  <span className={`block mt-1 text-[10px] font-bold px-2 py-1 rounded-full w-fit ${
                    result.tipoDocumento === 'FACTURA' ? 'bg-emerald-100 text-emerald-700' :
                    (result.tipoDocumento === 'FACTURA_SIMPLIFICADA' || result.tipoDocumento === 'ALBARAN') ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {result.tipoDocumento.replace(/_/g, ' ')}
                    {(result.tipoDocumento === 'FACTURA_SIMPLIFICADA' || result.tipoDocumento === 'ALBARAN') && ' ⚠️'}
                  </span>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Concepto / Descripción</label>
                  <p className="font-bold text-slate-800 border-b border-slate-100 pb-1">{result.concepto}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Importe Total</label>
                  <p className="text-xl font-black text-slate-900">{result.importe.toFixed(2)} €</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Categoría</label>
                  <span className="block mt-1 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full w-fit">
                    {result.categoria}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setImage(null)}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm"
                >
                  Repetir
                </button>
                <button 
                  onClick={handleConfirm}
                  className="flex-[2] bg-slate-900 text-white py-3 rounded-xl font-bold text-sm shadow-lg"
                >
                  Confirmar Gasto
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
