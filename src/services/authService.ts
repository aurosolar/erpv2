import jwt from 'jsonwebtoken';
import { User } from './transitionService';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import db from '../db';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'instala-pro-access-secret-2024';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'instala-pro-refresh-secret-2024';
const ISSUER = 'instala-pro-api';
const AUDIENCE = 'instala-pro-client';

const ACCESS_EXPIRY = '30m';
const REFRESH_EXPIRY = '7d';

export interface TokenPayload {
  id: string;
  name: string;
  role: string;
  tenantId: string;
  jti: string;
}

function hashToken(token: string): string {
  return CryptoJS.SHA256(token).toString();
}

export function generateTokens(user: User, existingFamilyId?: string): { accessToken: string; refreshToken: string } {
  const jti = uuidv4();
  const familyId = existingFamilyId || uuidv4();
  
  const payload: TokenPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    jti
  };

  const accessToken = jwt.sign(payload, ACCESS_SECRET, { 
    expiresIn: ACCESS_EXPIRY,
    issuer: ISSUER,
    audience: AUDIENCE
  });

  const refreshToken = jwt.sign({ id: user.id, jti, familyId }, REFRESH_SECRET, { 
    expiresIn: REFRESH_EXPIRY,
    issuer: ISSUER,
    audience: AUDIENCE
  });

  const hashedToken = hashToken(refreshToken);
  const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);

  // Guardar en DB (Upsert para rotación)
  db.prepare(`
    INSERT INTO refresh_token_families (id, user_id, hashed_token, expires_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET 
      hashed_token = excluded.hashed_token,
      expires_at = excluded.expires_at,
      updated_at = datetime('now')
  `).run(familyId, user.id, hashedToken, expiresAt);

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE
    }) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function rotateRefreshToken(token: string): { accessToken: string; refreshToken: string } | null {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE
    }) as { id: string; jti: string; familyId: string };

    const family = db.prepare('SELECT * FROM refresh_token_families WHERE id = ?').get(decoded.familyId) as any;
    
    // 1. Detección de Reuso (Compromiso)
    if (!family || family.hashed_token !== hashToken(token)) {
      if (family) {
        console.warn(`[SECURITY] Refresh token reuse detected for family ${decoded.familyId}. Revoking family.`);
        db.prepare('DELETE FROM refresh_token_families WHERE id = ?').run(decoded.familyId);
      }
      return null;
    }

    // 2. Expiración
    if (family.expires_at < Date.now()) {
      db.prepare('DELETE FROM refresh_token_families WHERE id = ?').run(decoded.familyId);
      return null;
    }

    // 3. Obtener Usuario de DB
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(family.user_id) as any;
    if (!userRow || !userRow.is_active) {
      db.prepare('DELETE FROM refresh_token_families WHERE id = ?').run(decoded.familyId);
      return null;
    }

    const user: User = {
      id: userRow.id,
      name: userRow.full_name,
      role: userRow.role,
      tenantId: userRow.tenant_id
    };

    return generateTokens(user, decoded.familyId);
  } catch (error) {
    return null;
  }
}

export function revokeSession(familyId: string): void {
  db.prepare('DELETE FROM refresh_token_families WHERE id = ?').run(familyId);
}
