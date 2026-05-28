-- ============================================================================
-- 🌌 GEOTERRA PERÚ: SCRIPT SQL MAESTRO DE PRODUCCIÓN (geoterra_core)
-- Compatible con PostgreSQL 13+ y PostGIS 3+
-- Infraestructura Espacial-Temporal para la Seguridad Alimentaria y Mitigación de Salinidad
-- ============================================================================

-- 🚀 1. HABILITACIÓN DE EXTENSIONES ESPACIALES DE ALTO RENDIMIENTO
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 🌿 SECCIÓN A: MÓDULO O.M.N.I. TERRA (BIOSFERA Y SEGURIDAD ALIMENTARIA)
-- ============================================================================

-- Tabla: Ecorregiones y Áreas Naturales (Zonificación MINAM / SERFOR)
CREATE TABLE ecoregiones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL UNIQUE,
    clasificacion_riesgo VARCHAR(50), -- Ej: 'Vulnerable', 'Protegida'
    geom GEOMETRY(Polygon, 4326) NOT NULL,
    metadata JSONB, -- Ingesta dinámica de variables de cobertura vegetal de SERFOR
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_ecoregiones_geom ON ecoregiones USING GIST (geom);

-- Tabla: Cuencas Hidrográficas y Acuíferos (Monitoreo ANA)
CREATE TABLE cuencas_agua (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_cuenca VARCHAR(150) NOT NULL UNIQUE,
    nivel_estres_hidrico DECIMAL(4,2), -- Calculado dinámicamente por la IA LSTM
    concentracion_plomo_ppm DECIMAL(6,4), -- Telemetría de pozos mineros
    geom GEOMETRY(Polygon, 4326) NOT NULL
);
CREATE INDEX idx_cuencas_geom ON cuencas_agua USING GIST (geom);

-- Cultivos soportados y parámetros biofísicos de tolerancia
CREATE TABLE cultivos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE, -- Arroz, Caña de azúcar, Uva de mesa, Espárrago, Quinua
    tolerancia_ec_max DECIMAL(4,2) NOT NULL, -- Umbral de Conductividad Eléctrica (EC_e) sin pérdida (dS/m)
    pendiente_perdida_rendimiento DECIMAL(4,1) NOT NULL, -- % pérdida por cada dS/m encima de umbral
    profundidad_radicular_efectiva INT NOT NULL, -- en centímetros
    demanda_hidrica_optima_m3_ha INT NOT NULL -- m3/hectárea al año
);

-- Tabla: Parcelas Catastrales Edafo-OS (Gemelo Digital SAT-Agro Pro)
CREATE TABLE parcelas_agricolas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_catastral VARCHAR(50) UNIQUE NOT NULL,
    propietario VARCHAR(100) NOT NULL,
    area_hectareas DECIMAL(10,4) NOT NULL,
    tipo_suelo VARCHAR(100),
    cultivo_id INT REFERENCES cultivos(id) ON DELETE SET NULL,
    geom GEOMETRY(Polygon, 4326) NOT NULL, -- Polígono catastral de la parcela
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_parcelas_geom ON parcelas_agricolas USING GIST (geom);

-- Tabla para telemetría histórica IoT (El alimento temporal de la IA LSTM / Richards PINN)
CREATE TABLE telemetria_iot (
    id BIGSERIAL PRIMARY KEY,
    parcela_id UUID REFERENCES parcelas_agricolas(id) ON DELETE CASCADE,
    humedad_volumetrica_pct DECIMAL(5,2) NOT NULL, -- Contenido Volumétrico de Agua (VWC %)
    salinidad_ce_ds_m DECIMAL(5,2) NOT NULL,       -- Conductividad Eléctrica (EC_a)
    temperatura_c DECIMAL(4,2),
    vigor_ndvi DECIMAL(4,3),                       -- Sentinel-2
    estres_ndwi DECIMAL(4,3),                      -- Sentinel-2
    fecha_medicion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_telemetria_tiempo ON telemetria_iot (fecha_medicion DESC);
CREATE INDEX idx_telemetria_parcela ON telemetria_iot (parcela_id);

-- ============================================================================
-- 🏙️ SECCIÓN B: MÓDULO N.E.X.U.S. 4D (TECNOSFERA E INFRAESTRUCTURA)
-- ============================================================================

-- Tabla: Alertas de Desastres en Vivo (Huaicos, Incendios, Sismos)
CREATE TABLE alertas_desastres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_evento VARCHAR(50) NOT NULL, -- 'HUAICO', 'INCENDIO', 'SISMO'
    severidad INTEGER CHECK (severidad BETWEEN 1 AND 5),
    geom GEOMETRY(Polygon, 4326) NOT NULL, -- Polígono de afectación geoespacial
    detalles_tensor JSONB, -- Residuales e inferencia física (reología)
    fecha_deteccion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR(20) DEFAULT 'ACTIVO' -- 'ACTIVO', 'MITIGADO'
);
CREATE INDEX idx_alertas_geom ON alertas_desastres USING GIST (geom);

-- Tabla: Red Vial Nacional (Grafo de Transporte MTC para pgRouting/Golang)
CREATE TABLE red_vial_logistica (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_via VARCHAR(150),
    tipo_via VARCHAR(50), -- 'Nacional', 'Departamental'
    geom GEOMETRY(LineString, 4326) NOT NULL,
    estado_operativo VARCHAR(30) DEFAULT 'OPERATIVO', -- 'OPERATIVO', 'BLOQUEADA'
    velocidad_base_kmh INTEGER NOT NULL,
    riesgo_colapso_pct DECIMAL(5,2) DEFAULT 0.00
);
CREATE INDEX idx_vias_geom ON red_vial_logistica USING GIST (geom);

-- ============================================================================
-- ⚡ SECCIÓN C: AUTOMATIZACIÓN DE MITIGACIÓN VIAL EN PL/pgSQL
-- ============================================================================

-- Función de interrupción vial automática y liberación dinámica
CREATE OR REPLACE FUNCTION auditar_colapso_vial()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Si el desastre entra en estado ACTIVO, se bloquea la red vial afectada
    IF NEW.estado = 'ACTIVO' THEN
        UPDATE red_vial_logistica
        SET estado_operativo = 'BLOQUEADA',
            riesgo_colapso_pct = 100.00
        WHERE geom && NEW.geom AND ST_Intersects(geom, NEW.geom);
        
    -- 2. Si el desastre se marca como MITIGADO, la vía se libera automáticamente
    ELSIF NEW.estado = 'MITIGADO' AND OLD.estado = 'ACTIVO' THEN
        UPDATE red_vial_logistica
        SET estado_operativo = 'OPERATIVO',
            riesgo_colapso_pct = 0.00
        WHERE geom && NEW.geom AND ST_Intersects(geom, NEW.geom);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Disparador geoespacial asociado a las alertas de desastre
CREATE OR REPLACE TRIGGER trg_bloqueo_vial_inmediato
AFTER INSERT OR UPDATE ON alertas_desastres
FOR EACH ROW EXECUTE FUNCTION auditar_colapso_vial();

-- ============================================================================
-- 💧 SECCIÓN D: CAPA DE PRESCRIPCIÓN QUÍMICA Y LIXIVIACIÓN
-- ============================================================================

-- Prescripciones agronómicas generadas por el motor de inferencia
CREATE TABLE prescripciones (
    id SERIAL PRIMARY KEY,
    parcela_id UUID REFERENCES parcelas_agricolas(id) ON DELETE CASCADE,
    fecha_prescripcion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Diagnóstico
    salinidad_actual_ds_m DECIMAL(4,2) NOT NULL,
    humedad_actual_porcentaje DECIMAL(5,2) NOT NULL,
    nivel_riesgo VARCHAR(20) CHECK (nivel_riesgo IN ('BAJO', 'MODERADO', 'ALTO', 'CRÍTICO')),
    
    -- Prescripción Riego y Lavado
    riego_prescrito_m3_ha INT NOT NULL, -- Volumen recomendado
    requerimiento_lavado_porcentaje DECIMAL(5,2) DEFAULT 0.00, -- LR necesario (0-100%)
    
    -- Prescripción Química (Enmiendas)
    yeso_agricola_ton_ha DECIMAL(4,2) DEFAULT 0.00, -- Toneladas de yeso
    corrector_salinidad_aplicar VARCHAR(100),
    
    -- Acción Estratégica de Rotación
    alerta_rotacion_cultivo BOOLEAN DEFAULT FALSE,
    cultivo_sugerido_rotacion VARCHAR(50),
    
    -- Estado de ejecución
    ejecutado BOOLEAN DEFAULT FALSE,
    fecha_ejecucion TIMESTAMP WITH TIME ZONE,
    operador_responsable VARCHAR(100)
);
CREATE INDEX idx_prescripciones_parcela ON prescripciones (parcela_id);
CREATE INDEX idx_prescripciones_riesgo ON prescripciones (nivel_riesgo);
