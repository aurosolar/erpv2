-- InstalaPRO: Esquema de Base de Datos (PostgreSQL)
-- Arquitectura Senior: Dominios Separados, Auditoría Inmutable y Multi-tenant

-- 1. Usuarios y Autenticación
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'BACKOFFICE', 'JEFE_OBRA', 'INSTALADOR', 'COMERCIAL')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rotación de Refresh Tokens (Familias de tokens para detección de reuso)
CREATE TABLE refresh_token_families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    hashed_token TEXT NOT NULL, -- Solo el hash del token actual
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Obras y Configuración
CREATE TABLE obras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    version INTEGER DEFAULT 1,
    cliente TEXT NOT NULL,
    direccion TEXT NOT NULL,
    potencia_kw NUMERIC(10, 2) NOT NULL,
    requiere_legalizacion BOOLEAN DEFAULT true,
    tipo_obra TEXT NOT NULL CHECK (tipo_obra IN ('FV_ESTANDAR', 'FV_BATERIA', 'SAT_BATERIA', 'CLIMATIZACION', 'AMPLIACION', 'ALQUILER_CUBIERTA', 'MANO_DE_OBRA')),
    
    -- Configuración dinámica (Validada por Zod en Backend)
    config JSONB NOT NULL DEFAULT '{
        "requiereAlmacen": true, 
        "requiereFirmaCliente": true, 
        "requiereFotosPrevia": true, 
        "requiereFotosPosterior": true
    }',

    -- Estados (Máquina de estados paralelos)
    estado_global TEXT DEFAULT 'ACTIVA' CHECK (estado_global IN ('ACTIVA', 'CANCELADA')),
    estado_crm TEXT DEFAULT 'LEAD' CHECK (estado_crm IN ('LEAD', 'CONTACTADO', 'VISITA_AGENDADA', 'PRESUPUESTO_ENVIADO', 'NEGOCIACION', 'GANADO', 'PERDIDO')),
    estado_operativo TEXT DEFAULT 'PENDIENTE_VISITA' CHECK (estado_operativo IN ('PENDIENTE_VISITA', 'DISENO_INGENIERIA', 'MATERIALES_PEDIDOS', 'MATERIALES_RECIBIDOS', 'EN_INSTALACION', 'FINALIZADA')),
    estado_financiero TEXT DEFAULT 'PENDIENTE_ANTICIPO' CHECK (estado_financiero IN ('PENDIENTE_ANTICIPO', 'ANTICIPO_PAGADO', 'PENDIENTE_HITO', 'HITO_PAGADO', 'PENDIENTE_FINAL', 'PAGADO_TOTAL', 'IMPAGADO')),
    estado_validacion TEXT DEFAULT 'PENDIENTE_REVISION' CHECK (estado_validacion IN ('PENDIENTE_REVISION', 'APROBADO_TECNICAMENTE', 'RECHAZADO', 'MODIFICACION_REQUERIDA')),
    estado_legalizacion TEXT DEFAULT 'NO_INICIADA' CHECK (estado_legalizacion IN ('NO_INICIADA', 'RECOPILANDO_DOCS', 'PRESENTADO_INDUSTRIA', 'SUBSANACION', 'LEGALIZADA', 'RECHAZADA')),
    estado_incidencias TEXT DEFAULT 'SIN_INCIDENCIAS' CHECK (estado_incidencias IN ('SIN_INCIDENCIAS', 'INCIDENCIA_MENOR', 'BLOQUEO_CRITICO', 'RESOLVIENDO', 'RESUELTA')),

    -- Datos técnicos detallados
    num_placas INTEGER,
    potencia_placa_wp INTEGER,
    num_strings INTEGER,
    modelo_inversor TEXT,
    equipo_principal TEXT,
    is_climatizacion BOOLEAN DEFAULT false,
    tiene_backup BOOLEAN DEFAULT false,
    tiene_optimizadores BOOLEAN DEFAULT false,

    -- Datos financieros
    presupuesto_total NUMERIC(15, 2) DEFAULT 0,
    cobrado_hasta_ahora NUMERIC(15, 2) DEFAULT 0,
    gate_data JSONB DEFAULT '{}', -- Snapshot de validaciones de gates
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Equipo de Obra (Relación Muchos a Muchos)
CREATE TABLE obra_equipo (
    obra_id UUID REFERENCES obras(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rol_en_obra TEXT NOT NULL, -- Ej: 'RESPONSABLE', 'AYUDANTE'
    PRIMARY KEY (obra_id, user_id)
);

-- 4. Documentación y Evidencias
CREATE TABLE documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID REFERENCES obras(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('VALIDACION_FOTO', 'REPRESENTACION_VOLUNTARIA', 'CIE', 'MEMORIA', 'FOTO_INSTALACION', 'PRESUPUESTO', 'FACTURA', 'PEDIDO', 'FOTO_PREVIA', 'FOTO_POSTERIOR', 'OTROS')),
    subtipo TEXT, -- Ej: 'INVERSOR', 'CUADRO_AC'
    nombre TEXT NOT NULL,
    url_storage TEXT NOT NULL, -- Path en el bucket (S3/Drive)
    latitud NUMERIC(10, 7),
    longitud NUMERIC(10, 7),
    ocr_data JSONB DEFAULT '{}', -- Datos extraídos automáticamente
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Validaciones Estructuradas (Checklists Técnicos)
CREATE TABLE validaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID REFERENCES obras(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    template_version TEXT NOT NULL,
    items_json JSONB NOT NULL, -- Detalle de cada ítem del checklist
    resultado TEXT CHECK (resultado IN ('OK', 'OBSERVACIONES', 'BLOQUEO', 'PENDIENTE')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Auditoría Inmutable (Cadena de Hashes)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID REFERENCES obras(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES users(id),
    user_name_snapshot TEXT, 
    action TEXT NOT NULL,
    domain TEXT NOT NULL,
    from_state TEXT,
    to_state TEXT,
    seq BIGINT NOT NULL, -- Orden absoluto por obra
    prev_hash TEXT NOT NULL,
    hash TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (obra_id, seq)
);

-- 7. Índices Críticos
CREATE INDEX idx_obras_tenant ON obras(tenant_id);
CREATE INDEX idx_audit_obra_seq ON audit_logs(obra_id, seq DESC);
CREATE INDEX idx_audit_tenant_timestamp ON audit_logs(tenant_id, timestamp DESC);
CREATE INDEX idx_docs_obra ON documentos(obra_id);
CREATE INDEX idx_validaciones_obra ON validaciones(obra_id);

-- 8. Políticas de Retención y RGPD
-- Audit Logs: 5 años (Responsabilidad Civil). Pseudonimización tras 2 años.
-- Refresh Tokens: Purga de expirados cada 24h.

-- 9. Triggers para UpdatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_obras_updated_at BEFORE UPDATE ON obras FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_refresh_families_updated_at BEFORE UPDATE ON refresh_token_families FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
