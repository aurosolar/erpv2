import CryptoJS from 'crypto-js';
import { AuditLog, Domain, GateDetail } from '../types/obra';

const AUDIT_SECRET = process.env.AUDIT_SECRET || 'instala-pro-audit-integrity-secret-2024';

export function calculateEventHash(prevHash: string, eventData: any): string {
  // Canonicalize data for consistent hashing
  const canonicalData = JSON.stringify(eventData);
  return CryptoJS.HmacSHA256(prevHash + canonicalData, AUDIT_SECRET).toString();
}

export function getGenesisHash(obraId: string): string {
  return `GENESIS-${obraId}`;
}

export function verifyChain(logs: AuditLog[]): { isValid: boolean; brokenAt?: string } {
  if (logs.length === 0) return { isValid: true };

  // Sort by seq to ensure absolute order
  const sortedLogs = [...logs].sort((a, b) => a.seq - b.seq);

  for (let i = 0; i < sortedLogs.length; i++) {
    const current = sortedLogs[i];
    
    // 1. Verificar secuencia incremental
    if (i > 0 && current.seq !== sortedLogs[i - 1].seq + 1) {
      return { isValid: false, brokenAt: `SEQ_GAP_${current.id}` };
    }

    // 2. Verificar prevHash
    const expectedPrevHash = i === 0 ? getGenesisHash(current.obraId) : sortedLogs[i - 1].hash;
    if (current.prevHash !== expectedPrevHash) {
      return { isValid: false, brokenAt: `HASH_CHAIN_${current.id}` };
    }

    // 3. Recalcular y comparar hash
    const eventToHash = {
      id: current.id,
      obraId: current.obraId,
      action: current.action,
      domain: current.domain,
      fromState: current.fromState,
      toState: current.toState,
      timestamp: current.timestamp,
      seq: current.seq,
      metadata: current.metadata
    };

    const recalculatedHash = calculateEventHash(current.prevHash, eventToHash);
    if (current.hash !== recalculatedHash) {
      return { isValid: false, brokenAt: `HASH_MISMATCH_${current.id}` };
    }
  }

  return { isValid: true };
}

export interface AuditEventParams {
  obraId: string;
  tenantId: string;
  userId: string;
  userNameSnapshot: string;
  action: 'STATE_CHANGE' | 'OVERRIDE' | 'ANOMALY_DETECTED' | 'REJECTED_TRANSITION' | 'CONFIG_CHANGE' | 'DOCUMENT_ADDED' | 'DOCUMENT_SOFT_DELETED';
  domain: Domain;
  fromState: string;
  toState: string;
  prevHash: string;
  seq: number;
  metadata: {
    reason?: string;
    overrideRole?: string;
    gatesTriggered?: GateDetail[];
    version: number;
    appVersion: string;
    deviceId: string;
    installerPinUsed?: boolean;
    configSnapshot?: any;
    documentId?: string;
    documentName?: string;
    documentType?: string;
  };
}

export function createAuditEvent(params: AuditEventParams): AuditLog {
  const timestamp = new Date().toISOString();
  const id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const eventToHash = {
    id,
    obraId: params.obraId,
    action: params.action,
    domain: params.domain,
    fromState: params.fromState,
    toState: params.toState,
    timestamp,
    seq: params.seq,
    metadata: params.metadata
  };

  const hash = calculateEventHash(params.prevHash, eventToHash);

  return {
    ...params,
    id,
    timestamp,
    hash
  };
}
