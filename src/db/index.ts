import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'instalapro.db');
const db = new Database(dbPath);

// Habilitar claves foráneas
db.pragma('foreign_keys = ON');

export function initDb() {
  // 1. Usuarios y Autenticación
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('ADMIN', 'BACKOFFICE', 'JEFE_OBRA', 'INSTALADOR', 'COMERCIAL')),
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 2. Rotación de Refresh Tokens
  db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_token_families (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      hashed_token TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 3. Obras
  db.exec(`
    CREATE TABLE IF NOT EXISTS obras (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      cliente TEXT NOT NULL,
      direccion TEXT NOT NULL,
      potencia_kw REAL NOT NULL,
      requiere_legalizacion INTEGER DEFAULT 1,
      tipo_obra TEXT NOT NULL,
      
      -- Configuración dinámica (JSON como TEXT)
      config TEXT NOT NULL,

      -- Estados
      estado_global TEXT DEFAULT 'ACTIVA',
      estado_crm TEXT DEFAULT 'LEAD',
      estado_operativo TEXT DEFAULT 'PENDIENTE_VISITA',
      estado_financiero TEXT DEFAULT 'PENDIENTE_ANTICIPO',
      estado_validacion TEXT DEFAULT 'PENDIENTE_REVISION',
      estado_legalizacion TEXT DEFAULT 'NO_INICIADA',
      estado_incidencias TEXT DEFAULT 'SIN_INCIDENCIAS',

      -- Datos técnicos
      num_placas INTEGER,
      potencia_placa_wp INTEGER,
      num_strings INTEGER,
      modelo_inversor TEXT,
      equipo_principal TEXT,
      is_climatizacion INTEGER DEFAULT 0,
      tiene_backup INTEGER DEFAULT 0,
      tiene_optimizadores INTEGER DEFAULT 0,

      -- Datos financieros
      presupuesto_total REAL DEFAULT 0,
      cobrado_hasta_ahora REAL DEFAULT 0,
      gate_data TEXT DEFAULT '{}',
      
      -- Campos anidados como JSON
      documentos TEXT DEFAULT '[]',
      comentarios TEXT DEFAULT '[]',
      planificacion TEXT DEFAULT '{}',
      comercial TEXT,
      enlace_carpeta_cliente TEXT,

      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 4. Auditoría
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      obra_id TEXT REFERENCES obras(id) ON DELETE CASCADE,
      tenant_id TEXT NOT NULL,
      user_id TEXT REFERENCES users(id),
      user_name_snapshot TEXT, 
      action TEXT NOT NULL,
      domain TEXT NOT NULL,
      from_state TEXT,
      to_state TEXT,
      seq INTEGER NOT NULL,
      prev_hash TEXT NOT NULL,
      hash TEXT NOT NULL,
      metadata TEXT DEFAULT '{}',
      timestamp TEXT DEFAULT (datetime('now')),
      
      UNIQUE (obra_id, seq)
    )
  `);

  // 5. Índices
  db.exec(`CREATE INDEX IF NOT EXISTS idx_obras_tenant ON obras(tenant_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_obra_seq ON audit_logs(obra_id, seq DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_tenant_timestamp ON audit_logs(tenant_id, timestamp DESC)`);

  // 6. Seed Admin User (Solo si no existe)
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@instala.pro');
  if (!adminExists) {
    db.prepare(`
      INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'user-admin-1',
      'tenant-123',
      'admin@instala.pro',
      '$2b$10$YourHashedPasswordHere', // En un sistema real usaríamos bcrypt
      'Admin InstalaPRO',
      'ADMIN'
    );
  }
}

export default db;
