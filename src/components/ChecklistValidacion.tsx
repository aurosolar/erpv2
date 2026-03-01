import React, { useState, useRef } from 'react';
import { Camera, CheckCircle2, XCircle, Upload, ArrowLeft, Image as ImageIcon, AlertTriangle, ScanLine, MessageSquare, Loader2, CheckSquare, Square, Type as TypeIcon } from 'lucide-react';
import { Obra, Validacion, ValidationItem, Documento, TipoObra, ValidationItemTemplate } from '../types/obra';
import { getTemplateForObra } from '../data/validationTemplates';
import { extractDataFromImage } from '../services/geminiService';

interface ChecklistValidacionProps {
  obra: Obra;
  onClose: () => void;
  onSubmit: (validacion: Validacion) => void;
}

export function ChecklistValidacion({ obra, onClose, onSubmit }: ChecklistValidacionProps) {
  const template = getTemplateForObra(obra);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentTemplateId, setCurrentTemplateId] = useState<{id: string, subtipo: string, ocrType?: 'INVERSOR' | 'PLACAS' | 'BATERIA'} | null>(null);
  
  const [items, setItems] = useState<ValidationItem[]>(
    template.map(t => ({
      templateId: t.id,
      status: 'PENDING',
      photos: [],
      note: '',
      checklistResults: t.type === 'CHECKLIST' ? t.checklistItems?.reduce((acc, curr) => ({ ...acc, [curr]: false }), {}) : undefined,
      textValue: t.type === 'TEXT' ? '' : undefined
    }))
  );

  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [naReason, setNaReason] = useState('');
  const [isScanning, setIsScanning] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const simulateUpload = async (templateId: string): Promise<void> => {
    setIsUploading(templateId);
    for (let i = 0; i <= 100; i += 20) {
      setUploadProgress(prev => ({ ...prev, [templateId]: i }));
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    setIsUploading(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentTemplateId) return;

    const tplId = currentTemplateId.id;
    const subtipo = currentTemplateId.subtipo;
    const ocrType = currentTemplateId.ocrType;

    // 1. Simular subida
    await simulateUpload(tplId);

    const base64 = await fileToBase64(file);
    
    if (ocrType) {
      setIsScanning(tplId);
      try {
        const extracted = await extractDataFromImage(base64, ocrType);
        processPhoto(tplId, subtipo, base64, extracted);
        setSuccessMessage(`¡Datos de ${ocrType.toLowerCase()} extraídos con éxito!`);
      } catch (error) {
        console.error("OCR Error:", error);
        processPhoto(tplId, subtipo, base64);
        setSuccessMessage("Foto subida correctamente");
      } finally {
        setIsScanning(null);
      }
    } else {
      processPhoto(tplId, subtipo, base64);
      setSuccessMessage("Foto subida correctamente");
    }

    setTimeout(() => setSuccessMessage(null), 3000);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    setCurrentTemplateId(null);
  };

  const triggerFileInput = (tpl: ValidationItemTemplate) => {
    setCurrentTemplateId({ id: tpl.id, subtipo: tpl.subtipo, ocrType: tpl.ocrType });
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processPhoto = (templateId: string, subtipo: string, base64: string, extractedData?: Record<string, string> | null) => {
    const newDoc: Documento = {
      id: `doc-${Date.now()}`,
      tipo: 'VALIDACION_FOTO',
      subtipo: subtipo as any,
      nombre: `foto_${templateId}_${Date.now()}.jpg`,
      url: base64,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'user-123',
      latLng: { lat: 40.4168, lng: -3.7038 }
    };

    setItems(prev => prev.map(item => {
      if (item.templateId === templateId) {
        return {
          ...item,
          status: 'OK',
          photos: [...item.photos, newDoc],
          timestamp: new Date().toISOString(),
          extractedData: extractedData ? { ...(item.extractedData || {}), ...extractedData } : item.extractedData
        };
      }
      return item;
    }));
  };

  const toggleChecklistItem = (templateId: string, checkLabel: string) => {
    setItems(prev => prev.map(item => {
      if (item.templateId === templateId) {
        const newChecks = { ...item.checklistResults, [checkLabel]: !item.checklistResults?.[checkLabel] };
        const allChecked = Object.values(newChecks).every(v => v === true);
        return {
          ...item,
          checklistResults: newChecks,
          status: allChecked ? 'OK' : 'PENDING'
        };
      }
      return item;
    }));
  };

  const handleTextChange = (templateId: string, textValue: string) => {
    setItems(prev => prev.map(item => {
      if (item.templateId === templateId) {
        return {
          ...item,
          textValue,
          status: textValue.trim() ? 'OK' : 'PENDING'
        };
      }
      return item;
    }));
  };

  const handleUpdateNote = (templateId: string, note: string) => {
    setItems(prev => prev.map(item => 
      item.templateId === templateId ? { ...item, note } : item
    ));
  };

  const handleMarkNA = (templateId: string) => {
    if (!naReason.trim()) {
      alert('Debes indicar un motivo para marcar como No Aplica.');
      return;
    }
    
    setItems(prev => prev.map(item => {
      if (item.templateId === templateId) {
        return {
          ...item,
          status: 'NA',
          naReason: naReason,
          timestamp: new Date().toISOString()
        };
      }
      return item;
    }));
    setNaReason('');
    setExpandedItemId(null);
  };

  const canSubmit = items.every(item => {
    const tpl = template.find(t => t.id === item.templateId);
    if (!tpl?.required) return true;
    return item.status === 'OK' || item.status === 'NA';
  });

  const handleSubmit = () => {
    const validacion: Validacion = {
      obraId: obra.id,
      templateVersion: '1.2',
      items: items,
      submittedByUserId: 'user-123',
      submittedAt: new Date().toISOString(),
      result: 'PENDIENTE'
    };
    onSubmit(validacion);
  };

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col font-sans">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        capture="environment"
        onChange={handleFileChange}
      />

      <div className="bg-slate-900 text-white p-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onClose} className="p-2 -ml-2 hover:bg-slate-800 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="font-bold text-lg leading-tight">Checklist de Validación</h2>
          <p className="text-xs text-slate-400">{obra.id} • {obra.tipoObra.replace(/_/g, ' ')}</p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-500 text-white p-3 text-sm font-bold flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-4 h-4" />
          {successMessage}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-3">
        {template.map(tpl => {
          const itemState = items.find(i => i.templateId === tpl.id)!;
          const isExpanded = expandedItemId === tpl.id;

          return (
            <div key={tpl.id} className={`bg-white rounded-xl border transition-colors ${itemState.status === 'OK' ? 'border-emerald-200 bg-emerald-50/30' : itemState.status === 'NA' ? 'border-slate-200 bg-slate-50' : 'border-slate-200 shadow-sm'}`}>
              
              <div 
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedItemId(isExpanded ? null : tpl.id)}
              >
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-800">{tpl.label}</h3>
                    {tpl.required && <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold uppercase">Req</span>}
                    {tpl.requiresOCR && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1"><ScanLine className="w-3 h-3"/> OCR</span>}
                  </div>
                  {tpl.description && <p className="text-xs text-slate-500">{tpl.description}</p>}
                  
                  {itemState.extractedData && (
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      {Object.entries(itemState.extractedData).map(([key, value]) => (
                        <div key={key} className="text-[10px] font-mono bg-white border border-emerald-200 text-emerald-700 px-2 py-1 rounded">
                          <span className="opacity-60 uppercase">{key}:</span> {value}
                        </div>
                      ))}
                    </div>
                  )}

                  {itemState.textValue && (
                    <p className="mt-2 text-sm font-medium text-slate-700">{itemState.textValue}</p>
                  )}

                  {itemState.note && (
                    <div className="mt-2 flex items-start gap-1 text-[10px] text-slate-500 italic">
                      <MessageSquare className="w-3 h-3 mt-0.5" />
                      {itemState.note}
                    </div>
                  )}
                </div>
                
                <div>
                  {itemState.status === 'OK' && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                  {itemState.status === 'NA' && <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">N/A</span>}
                  {itemState.status === 'PENDING' && <div className="w-6 h-6 rounded-full border-2 border-slate-300" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                  
                  {tpl.type === 'PHOTO' && (
                    <>
                      {itemState.photos.length > 0 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                          {itemState.photos.map(photo => (
                            <div key={photo.id} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-slate-200">
                              <img src={photo.url} alt="Evidencia" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => triggerFileInput(tpl)}
                          disabled={isScanning === tpl.id || isUploading === tpl.id}
                          className="bg-slate-900 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70 relative overflow-hidden"
                        >
                          {isUploading === tpl.id ? (
                            <>
                              <div className="absolute inset-0 bg-slate-700 origin-left transition-transform duration-150" style={{ transform: `scaleX(${uploadProgress[tpl.id] / 100})` }} />
                              <span className="relative z-10 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> {uploadProgress[tpl.id]}%
                              </span>
                            </>
                          ) : isScanning === tpl.id ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Escaneando...</>
                          ) : (
                            <><Camera className="w-4 h-4" /> Tomar Foto</>
                          )}
                        </button>
                        <button 
                          onClick={() => triggerFileInput(tpl)}
                          disabled={isScanning === tpl.id || isUploading === tpl.id}
                          className="bg-white text-slate-700 border border-slate-300 py-3 rounded-lg font-medium flex items-center justify-center gap-2 active:bg-slate-50 transition-colors disabled:opacity-70"
                        >
                          <Upload className="w-4 h-4" /> Subir
                        </button>
                      </div>
                    </>
                  )}

                  {tpl.type === 'CHECKLIST' && (
                    <div className="space-y-2">
                      {tpl.checklistItems?.map(check => (
                        <div 
                          key={check} 
                          onClick={() => toggleChecklistItem(tpl.id, check)}
                          className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer active:bg-slate-50"
                        >
                          {itemState.checklistResults?.[check] ? (
                            <CheckSquare className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300" />
                          )}
                          <span className="text-sm text-slate-700">{check}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {tpl.type === 'TEXT' && (
                    <div className="relative">
                      <TypeIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-slate-500"
                        placeholder="Introduce el valor..."
                        value={itemState.textValue || ''}
                        onChange={(e) => handleTextChange(tpl.id, e.target.value)}
                      />
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Nota opcional</label>
                    <textarea 
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:border-slate-500"
                      rows={2}
                      placeholder="Añade algún detalle relevante..."
                      value={itemState.note}
                      onChange={(e) => handleUpdateNote(tpl.id, e.target.value)}
                    />
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">¿No aplica a esta obra?</p>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Motivo (ej. No hay cuadro DC)" 
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                        value={naReason}
                        onChange={(e) => setNaReason(e.target.value)}
                      />
                      <button 
                        onClick={() => handleMarkNA(tpl.id)}
                        className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-300"
                      >
                        Marcar N/A
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0">
        <button 
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          <CheckCircle2 className="w-5 h-5" />
          Enviar Validación
        </button>
        {!canSubmit && (
          <p className="text-center text-xs text-rose-500 mt-2 font-medium">
            Faltan ítems obligatorios por completar
          </p>
        )}
      </div>
    </div>
  );
}
