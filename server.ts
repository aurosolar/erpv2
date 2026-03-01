import express from "express";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';
import { createServer as createViteServer } from "vite";
import { mockObras } from "./src/components/FichaObra";
import { Obra, Domain, AuditLog, OverrideRecord } from "./src/types/obra";
import { processStateTransition, processConfigChange, User } from "./src/services/transitionService";
import { verifyAccessToken, rotateRefreshToken, generateTokens, revokeSession, TokenPayload } from "./src/services/authService";
import { verifyChain, getGenesisHash, createAuditEvent } from "./src/services/auditService";
import db, { initDb } from "./src/db";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  // Socket.io: authenticate via JWT in handshake middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('AUTHENTICATION_REQUIRED'));
    }
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return next(new Error('INVALID_TOKEN'));
    }
    // Attach verified user data to socket — tenantId comes from server, not client
    (socket as any).user = decoded;
    next();
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user as TokenPayload;
    // Auto-join tenant room from verified JWT — no client input needed
    socket.join(`tenant:${user.tenantId}`);
    console.log(`Socket authenticated: user=${user.id} tenant=${user.tenantId}`);

    // Explicitly ignore any client attempt to join a tenant room
    socket.on("join-tenant", () => {
      console.warn(`[SECURITY] Client ${user.id} attempted manual join-tenant. Ignored.`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: user=${user.id}`);
    });
  });

  // Helper to emit notifications
  const notifyTenant = (tenantId: string, event: string, data: any) => {
    io.to(`tenant:${tenantId}`).emit(event, data);
  };

  app.use(express.json());

  // Initialize DB
  initDb();

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Multer configuration
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });

  // RBAC: roles allowed per document operation
  const DOC_UPLOAD_ROLES = ['ADMIN', 'BACKOFFICE', 'JEFE_OBRA', 'INSTALADOR', 'COMERCIAL'];
  const DOC_DELETE_ROLES = ['ADMIN', 'BACKOFFICE', 'JEFE_OBRA'];

  // Path traversal protection: resolve and verify path stays within uploads dir
  const safeResolvePath = (filename: string): string | null => {
    const resolved = path.resolve(uploadsDir, path.basename(filename));
    if (!resolved.startsWith(uploadsDir)) return null;
    return resolved;
  };

  // Serve static files from public/uploads
  app.use('/uploads', express.static(uploadsDir));

  // Seed Obras if empty
  const obraCount = db.prepare('SELECT COUNT(*) as count FROM obras').get() as any;
  if (obraCount.count === 0) {
    const insertObra = db.prepare(`
      INSERT INTO obras (
        id, tenant_id, version, cliente, direccion, potencia_kw, requiere_legalizacion, tipo_obra,
        config, estado_global, estado_crm, estado_operativo, estado_financiero, estado_validacion,
        estado_legalizacion, estado_incidencias, num_placas, potencia_placa_wp, num_strings,
        modelo_inversor, equipo_principal, is_climatizacion, tiene_backup, tiene_optimizadores,
        presupuesto_total, cobrado_hasta_ahora, gate_data, documentos, comentarios, planificacion,
        comercial, enlace_carpeta_cliente
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const o of mockObras) {
      insertObra.run(
        o.id, o.tenantId, o.version, o.cliente, o.direccion, o.potenciaKw, o.requiereLegalizacion ? 1 : 0, o.tipoObra,
        JSON.stringify(o.config), o.estadoGlobal, o.estadoCrm, o.estadoOperativo, o.estadoFinanciero, o.estadoValidacion,
        o.estadoLegalizacion, o.estadoIncidencias, o.numPlacas, o.potenciaPlacaWp, o.numStrings,
        o.modeloInversor, o.equipoPrincipal, o.isClimatizacion ? 1 : 0, o.tieneBackup ? 1 : 0, o.tieneOptimizadores ? 1 : 0,
        o.presupuestoTotal, o.cobradoHastaAhora, JSON.stringify(o.gateData || {}), JSON.stringify(o.documentos || []),
        JSON.stringify(o.comentarios || []), JSON.stringify(o.planificacion || {}), o.comercial, o.enlaceCarpetaCliente
      );
    }
  }

  // Helpers for mapping
  function mapObraFromDb(row: any): Obra {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      version: row.version,
      cliente: row.cliente,
      direccion: row.direccion,
      potenciaKw: row.potencia_kw,
      requiereLegalizacion: !!row.requiere_legalizacion,
      tipoObra: row.tipo_obra as any,
      config: JSON.parse(row.config),
      estadoGlobal: row.estado_global as any,
      estadoCrm: row.estado_crm as any,
      estadoOperativo: row.estado_operativo as any,
      estadoFinanciero: row.estado_financiero as any,
      estadoValidacion: row.estado_validacion as any,
      estadoLegalizacion: row.estado_legalizacion as any,
      estadoIncidencias: row.estado_incidencias as any,
      numPlacas: row.num_placas,
      potenciaPlacaWp: row.potencia_placa_wp,
      numStrings: row.num_strings,
      modeloInversor: row.modelo_inversor,
      equipoPrincipal: row.equipo_principal,
      isClimatizacion: !!row.is_climatizacion,
      tieneBackup: !!row.tiene_backup,
      tieneOptimizadores: !!row.tiene_optimizadores,
      presupuestoTotal: row.presupuesto_total,
      cobradoHastaAhora: row.cobrado_hasta_ahora,
      gateData: JSON.parse(row.gate_data),
      documentos: JSON.parse(row.documentos),
      comentarios: JSON.parse(row.comentarios),
      planificacion: JSON.parse(row.planificacion),
      comercial: row.comercial,
      enlaceCarpetaCliente: row.enlace_carpeta_cliente
    };
  }

  function mapAuditLogFromDb(row: any): AuditLog {
    return {
      id: row.id,
      obraId: row.obra_id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      userNameSnapshot: row.user_name_snapshot,
      action: row.action as any,
      domain: row.domain as any,
      fromState: row.from_state,
      toState: row.to_state,
      seq: row.seq,
      prevHash: row.prev_hash,
      hash: row.hash,
      metadata: JSON.parse(row.metadata),
      timestamp: row.timestamp
    };
  }

  // Enhanced Rate Limiting (Anti-DoS & Anti-Spam)
  const rateLimitStore = new Map<string, { count: number; lastReset: number }>();
  const RATE_LIMIT_WINDOW = 60000; // 1 min

  const checkRateLimit = (key: string, limit: number) => {
    const now = Date.now();
    const record = rateLimitStore.get(key) || { count: 0, lastReset: now };

    if (now - record.lastReset > RATE_LIMIT_WINDOW) {
      record.count = 1;
      record.lastReset = now;
    } else {
      record.count++;
    }

    rateLimitStore.set(key, record);
    return record.count <= limit;
  };

  const rateLimitMiddleware = (req: any, res: any, next: any) => {
    // 1. Por IP (Global)
    if (!checkRateLimit(`ip:${req.ip}`, 50)) {
      return res.status(429).json({ error: "Demasiadas peticiones desde esta IP." });
    }

    // 2. Por Usuario (si está autenticado)
    if (req.user && !checkRateLimit(`user:${req.user.id}`, 30)) {
      return res.status(429).json({ error: "Has excedido el límite de peticiones por minuto." });
    }

    next();
  };

  // Auth Middleware (Access Token Verification)
  const authMiddleware = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'Token de autenticación faltante o inválido.' } 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'Token inválido o expirado.' } 
      });
    }

    req.user = decoded;
    next();
  };

  // Auth Endpoints
  app.post("/api/auth/login", rateLimitMiddleware, (req, res) => {
    const { email, password } = req.body;
    
    // En un sistema real, verificaríamos el password_hash
    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    
    if (!userRow) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    const user: User = {
      id: userRow.id,
      name: userRow.full_name,
      role: userRow.role,
      tenantId: userRow.tenant_id
    };

    const tokens = generateTokens(user);
    res.json({ success: true, ...tokens, user });
  });

  app.post("/api/auth/refresh", rateLimitMiddleware, (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "Refresh token requerido." });

    const tokens = rotateRefreshToken(refreshToken);
    if (!tokens) return res.status(401).json({ error: "Refresh token inválido, expirado o ya utilizado." });

    res.json({ success: true, ...tokens });
  });

  app.post("/api/auth/logout", authMiddleware, (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "Refresh token requerido." });
    
    try {
      const decoded = jwt.decode(refreshToken) as any;
      if (decoded && decoded.familyId) {
        revokeSession(decoded.familyId);
      }
    } catch (e) {
      // Ignore
    }
    res.json({ success: true, message: "Sesión cerrada correctamente." });
  });

  // API routes
  app.get("/api/obras", authMiddleware, rateLimitMiddleware, (req, res) => {
    const tenantId = (req as any).user.tenantId;
    const rows = db.prepare('SELECT * FROM obras WHERE tenant_id = ?').all(tenantId);
    res.json(rows.map(mapObraFromDb));
  });

  app.get("/api/obras/:id", authMiddleware, rateLimitMiddleware, (req, res) => {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;
    const row = db.prepare('SELECT * FROM obras WHERE id = ?').get(id) as any;
    
    if (!row) return res.status(404).json({ error: "Obra no encontrada" });
    
    if (row.tenant_id !== tenantId) {
      return res.status(403).json({ 
        success: false, 
        error: { code: 'FORBIDDEN', message: 'No tienes permiso para acceder a esta obra.' } 
      });
    }
    
    res.json(mapObraFromDb(row));
  });

  app.post("/api/obras/:id/transition", authMiddleware, rateLimitMiddleware, (req, res) => {
    const { id } = req.params;
    const { domain, newState, reason, override, version } = req.body;
    const user = (req as any).user;

    // Rate Limit por Obra
    if (!checkRateLimit(`obra:${id}:transition`, 10)) {
      return res.status(429).json({ error: "Demasiados intentos de cambio de estado para esta obra. Espera un momento." });
    }

    const row = db.prepare('SELECT * FROM obras WHERE id = ?').get(id) as any;
    if (!row) return res.status(404).json({ 
      success: false, 
      error: { code: 'NOT_FOUND', message: "Obra no encontrada" } 
    });
    
    const obra = mapObraFromDb(row);

    // Obtener el último hash y seq para esta obra
    const lastLog = db.prepare('SELECT hash, seq FROM audit_logs WHERE obra_id = ? ORDER BY seq DESC LIMIT 1').get(id) as any;
    const prevHash = lastLog ? lastLog.hash : getGenesisHash(id);
    const nextSeq = lastLog ? lastLog.seq + 1 : 1;

    const result = processStateTransition({
      obra,
      domain: domain as Domain,
      to: newState,
      reason,
      override,
      version,
      user,
      prevHash,
      seq: nextSeq
    });

    if (result.success && result.auditLog) {
      // Transacción atómica con optimistic locking real
      const transaction = db.transaction(() => {
        // 1. UPDATE primero — si version no coincide, changes será 0
        const stateKey = domain === 'global' ? 'estado_global' : `estado_${domain}`;
        const updateResult = db.prepare(`
          UPDATE obras SET 
            ${stateKey} = ?, 
            version = version + 1,
            updated_at = datetime('now')
          WHERE id = ? AND version = ?
        `).run(newState, id, version);

        // Si no se actualizó ninguna fila, otro proceso cambió la version → conflicto real
        if (updateResult.changes === 0) {
          throw new Error('VERSION_CONFLICT');
        }

        // 2. Solo insertar audit log si el UPDATE tuvo éxito
        db.prepare(`
          INSERT INTO audit_logs (
            id, obra_id, tenant_id, user_id, user_name_snapshot, action, domain, from_state, to_state, seq, prev_hash, hash, metadata, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          result.auditLog!.id, result.auditLog!.obraId, result.auditLog!.tenantId, result.auditLog!.userId,
          result.auditLog!.userNameSnapshot, result.auditLog!.action, result.auditLog!.domain,
          result.auditLog!.fromState, result.auditLog!.toState, result.auditLog!.seq,
          result.auditLog!.prevHash, result.auditLog!.hash, JSON.stringify(result.auditLog!.metadata),
          result.auditLog!.timestamp
        );
      });

      try {
        transaction();
        // Obtener obra actualizada
        const updatedObra = mapObraFromDb(db.prepare('SELECT * FROM obras WHERE id = ?').get(id));
        
        // Notificar cambio de estado
        notifyTenant(user.tenantId, "obra:transition", {
          obraId: id,
          domain,
          to: newState,
          user: user.name,
          obra: updatedObra
        });

        return res.json({ ...result, obra: updatedObra });
      } catch (err: any) {
        if (err.message === 'VERSION_CONFLICT') {
          return res.status(409).json({
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'Conflicto de versión: La obra fue modificada por otro usuario durante la operación.'
            }
          });
        }
        return res.status(500).json({ error: "Error al persistir la transición: " + err.message });
      }
    } else {
      const errorCode = result.error?.code || 'INTERNAL_ERROR';
      let status = 500;
      switch (errorCode) {
        case 'FORBIDDEN': status = 403; break;
        case 'CONFLICT': status = 409; break;
        case 'SOFT_GATE_REQUIRED':
        case 'HARD_GATE_BLOCKED': status = 422; break;
      }
      return res.status(status).json(result);
    }
  });

  app.post("/api/obras/:id/config", authMiddleware, rateLimitMiddleware, (req, res) => {
    const { id } = req.params;
    const { config, reason, version } = req.body;
    const user = (req as any).user;

    const row = db.prepare('SELECT * FROM obras WHERE id = ?').get(id) as any;
    if (!row) return res.status(404).json({ error: "Obra no encontrada" });
    
    const obra = mapObraFromDb(row);
    const lastLog = db.prepare('SELECT hash, seq FROM audit_logs WHERE obra_id = ? ORDER BY seq DESC LIMIT 1').get(id) as any;
    const prevHash = lastLog ? lastLog.hash : getGenesisHash(id);
    const nextSeq = lastLog ? lastLog.seq + 1 : 1;

    const result = processConfigChange({
      obra,
      newConfig: config,
      reason,
      version,
      user,
      prevHash,
      seq: nextSeq
    });

    if (result.success && result.auditLog) {
      const transaction = db.transaction(() => {
        // UPDATE first — if version doesn't match, changes will be 0
        const updateResult = db.prepare(`
          UPDATE obras SET 
            config = ?, 
            version = version + 1,
            updated_at = datetime('now')
          WHERE id = ? AND version = ?
        `).run(JSON.stringify(config), id, version);

        if (updateResult.changes === 0) {
          throw new Error('VERSION_CONFLICT');
        }

        db.prepare(`
          INSERT INTO audit_logs (
            id, obra_id, tenant_id, user_id, user_name_snapshot, action, domain, from_state, to_state, seq, prev_hash, hash, metadata, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          result.auditLog!.id, result.auditLog!.obraId, result.auditLog!.tenantId, result.auditLog!.userId,
          result.auditLog!.userNameSnapshot, result.auditLog!.action, result.auditLog!.domain,
          result.auditLog!.fromState, result.auditLog!.toState, result.auditLog!.seq,
          result.auditLog!.prevHash, result.auditLog!.hash, JSON.stringify(result.auditLog!.metadata),
          result.auditLog!.timestamp
        );
      });

      try {
        transaction();
        const updatedRow = db.prepare('SELECT * FROM obras WHERE id = ?').get(id);
        return res.json({ ...result, obra: mapObraFromDb(updatedRow) });
      } catch (err: any) {
        if (err.message === 'VERSION_CONFLICT') {
          return res.status(409).json({
            success: false,
            error: { code: 'CONFLICT', message: 'Conflicto de versión: La obra fue modificada por otro usuario.' }
          });
        }
        return res.status(500).json({ error: "Error al persistir la configuración: " + err.message });
      }
    } else {
      const status = result.error?.code === 'FORBIDDEN' ? 403 : (result.error?.code === 'CONFLICT' ? 409 : 500);
      return res.status(status).json(result);
    }
  });

  app.get("/api/obras/:id/audit/verify", authMiddleware, (req, res) => {
    const { id } = req.params;
    const rows = db.prepare('SELECT * FROM audit_logs WHERE obra_id = ? ORDER BY seq ASC').all(id);
    const obraLogs = rows.map(mapAuditLogFromDb);
    const verification = verifyChain(obraLogs);
    res.json({
      obraId: id,
      ...verification,
      eventCount: obraLogs.length
    });
  });

  app.get("/api/obras/:id/audit", authMiddleware, (req, res) => {
    const rows = db.prepare('SELECT * FROM audit_logs WHERE obra_id = ? ORDER BY seq DESC').all(req.params.id);
    res.json(rows.map(mapAuditLogFromDb));
  });

  // Document Upload Endpoint — with RBAC, tenant isolation, and audit trail
  app.post("/api/obras/:id/documents", authMiddleware, upload.single('file'), (req, res) => {
    const { id } = req.params;
    const { tipo } = req.body;
    const user = (req as any).user;
    const file = req.file;

    // RBAC check
    if (!DOC_UPLOAD_ROLES.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Tu rol no tiene permiso para subir documentos.' }
      });
    }

    if (!file) {
      return res.status(400).json({ error: "No se ha subido ningún archivo." });
    }

    const row = db.prepare('SELECT * FROM obras WHERE id = ?').get(id) as any;
    if (!row) return res.status(404).json({ error: "Obra no encontrada" });

    // Tenant isolation
    if (row.tenant_id !== user.tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'No tienes permiso para acceder a esta obra.' }
      });
    }

    const documentos = JSON.parse(row.documentos || '[]');
    const newDoc = {
      id: uuidv4(),
      tipo: tipo || 'OTROS',
      nombre: file.originalname,
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.id,
      userName: user.name
    };

    documentos.push(newDoc);

    // Compute audit chain params
    const lastLog = db.prepare('SELECT hash, seq FROM audit_logs WHERE obra_id = ? ORDER BY seq DESC LIMIT 1').get(id) as any;
    const prevHash = lastLog ? lastLog.hash : getGenesisHash(id);
    const nextSeq = lastLog ? lastLog.seq + 1 : 1;

    const auditEntry = createAuditEvent({
      obraId: id,
      tenantId: user.tenantId,
      userId: user.id,
      userNameSnapshot: user.name,
      action: 'DOCUMENT_ADDED' as any,
      domain: 'global',
      fromState: '',
      toState: newDoc.tipo,
      prevHash,
      seq: nextSeq,
      metadata: {
        reason: `Documento subido: ${newDoc.nombre}`,
        version: row.version,
        appVersion: '1.0.0-mvp',
        deviceId: 'web-browser-client',
        documentId: newDoc.id,
        documentName: newDoc.nombre,
        documentType: newDoc.tipo
      }
    });

    const transaction = db.transaction(() => {
      // Insert audit log
      db.prepare(`
        INSERT INTO audit_logs (
          id, obra_id, tenant_id, user_id, user_name_snapshot, action, domain,
          from_state, to_state, seq, prev_hash, hash, metadata, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        auditEntry.id, auditEntry.obraId, auditEntry.tenantId, auditEntry.userId,
        auditEntry.userNameSnapshot, auditEntry.action, auditEntry.domain,
        auditEntry.fromState, auditEntry.toState, auditEntry.seq,
        auditEntry.prevHash, auditEntry.hash, JSON.stringify(auditEntry.metadata),
        auditEntry.timestamp
      );

      // Update documents array
      db.prepare('UPDATE obras SET documentos = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run(JSON.stringify(documentos), id);
    });

    try {
      transaction();
    } catch (err: any) {
      return res.status(500).json({ error: "Error al persistir el documento: " + err.message });
    }

    notifyTenant(user.tenantId, "obra:document:added", {
      obraId: id,
      document: newDoc,
      user: user.name
    });

    res.json({ success: true, document: newDoc });
  });

  // Document Delete Endpoint — soft-delete with RBAC, tenant check, path safety, and audit
  app.delete("/api/obras/:id/documents/:docId", authMiddleware, (req, res) => {
    const { id, docId } = req.params;
    const { reason } = req.body || {};
    const user = (req as any).user;

    // RBAC check
    if (!DOC_DELETE_ROLES.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Tu rol no tiene permiso para eliminar documentos.' }
      });
    }

    const row = db.prepare('SELECT * FROM obras WHERE id = ?').get(id) as any;
    if (!row) return res.status(404).json({ error: "Obra no encontrada" });

    // Tenant isolation
    if (row.tenant_id !== user.tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'No tienes permiso para acceder a esta obra.' }
      });
    }

    let documentos = JSON.parse(row.documentos || '[]');
    const docIndex = documentos.findIndex((d: any) => d.id === docId);
    
    if (docIndex === -1) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }

    const docToDelete = documentos[docIndex];

    // Require reason for soft-delete audit trail
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return res.status(400).json({ error: "Se requiere un motivo (reason) para eliminar un documento." });
    }

    // Soft-delete: mark as deleted, keep record for audit
    documentos[docIndex] = {
      ...docToDelete,
      deleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: user.id,
      deletedByName: user.name,
      deleteReason: reason.trim()
    };

    // Optionally remove the physical file safely (only if within uploads dir)
    if (docToDelete.url) {
      // Extract just the filename, strip any leading path components — prevents path traversal
      const filename = path.basename(docToDelete.url);
      const safePath = safeResolvePath(filename);
      if (safePath && fs.existsSync(safePath)) {
        try {
          fs.unlinkSync(safePath);
        } catch (e) {
          console.error(`[WARN] Could not delete file ${safePath}:`, e);
        }
      }
    }

    // Compute audit chain params
    const lastLog = db.prepare('SELECT hash, seq FROM audit_logs WHERE obra_id = ? ORDER BY seq DESC LIMIT 1').get(id) as any;
    const prevHash = lastLog ? lastLog.hash : getGenesisHash(id);
    const nextSeq = lastLog ? lastLog.seq + 1 : 1;

    const auditEntry = createAuditEvent({
      obraId: id,
      tenantId: user.tenantId,
      userId: user.id,
      userNameSnapshot: user.name,
      action: 'DOCUMENT_SOFT_DELETED' as any,
      domain: 'global',
      fromState: docToDelete.tipo,
      toState: 'DELETED',
      prevHash,
      seq: nextSeq,
      metadata: {
        reason: reason.trim(),
        version: row.version,
        appVersion: '1.0.0-mvp',
        deviceId: 'web-browser-client',
        documentId: docToDelete.id,
        documentName: docToDelete.nombre,
        documentType: docToDelete.tipo
      }
    });

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO audit_logs (
          id, obra_id, tenant_id, user_id, user_name_snapshot, action, domain,
          from_state, to_state, seq, prev_hash, hash, metadata, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        auditEntry.id, auditEntry.obraId, auditEntry.tenantId, auditEntry.userId,
        auditEntry.userNameSnapshot, auditEntry.action, auditEntry.domain,
        auditEntry.fromState, auditEntry.toState, auditEntry.seq,
        auditEntry.prevHash, auditEntry.hash, JSON.stringify(auditEntry.metadata),
        auditEntry.timestamp
      );

      db.prepare('UPDATE obras SET documentos = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run(JSON.stringify(documentos), id);
    });

    try {
      transaction();
    } catch (err: any) {
      return res.status(500).json({ error: "Error al persistir la eliminación: " + err.message });
    }

    notifyTenant(user.tenantId, "obra:document:removed", {
      obraId: id,
      docId,
      user: user.name,
      reason: reason.trim()
    });

    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
