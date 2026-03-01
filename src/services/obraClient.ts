import api from './api';
import { Obra, TransitionRequest, TransitionResponse, ConfigChangeRequest, ConfigChangeResponse, AuditLog } from '../types/obra';

export const obraClient = {
  getObras: async (): Promise<Obra[]> => {
    const response = await api.get<Obra[]>('/obras');
    return response.data;
  },

  getObraById: async (id: string): Promise<Obra> => {
    const response = await api.get<Obra>(`/obras/${id}`);
    return response.data;
  },

  transition: async (id: string, request: TransitionRequest): Promise<TransitionResponse> => {
    const response = await api.post<TransitionResponse>(`/obras/${id}/transition`, request);
    return response.data;
  },

  updateConfig: async (id: string, request: ConfigChangeRequest): Promise<ConfigChangeResponse> => {
    const response = await api.post<ConfigChangeResponse>(`/obras/${id}/config`, request);
    return response.data;
  },

  getAuditLogs: async (id: string): Promise<AuditLog[]> => {
    const response = await api.get<AuditLog[]>(`/obras/${id}/audit`);
    return response.data;
  },

  verifyAuditChain: async (id: string): Promise<{ valid: boolean; message?: string }> => {
    const response = await api.get<{ valid: boolean; message?: string }>(`/obras/${id}/audit/verify`);
    return response.data;
  },

  uploadDocument: async (id: string, file: File, tipo: string): Promise<{ success: boolean; document: any }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);
    const response = await api.post<{ success: boolean; document: any }>(`/obras/${id}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deleteDocument: async (id: string, docId: string, reason: string): Promise<{ success: boolean }> => {
    const response = await api.delete<{ success: boolean }>(`/obras/${id}/documents/${docId}`, {
      data: { reason }
    });
    return response.data;
  }
};
