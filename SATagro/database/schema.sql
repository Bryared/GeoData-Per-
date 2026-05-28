-- Sat-Agro Database Schema
-- Compatible con PostgreSQL 13+ y PostGIS 3+
-- Infraestructura Espacial-Temporal para la Seguridad Alimentaria y Mitigación de Salinidad

-- Habilitar la extensión PostGIS para almacenamiento y consultas espaciales
CREATE EXTENSION IF NOT EXISTS postgis;

-- =========================================================================
-- 1. ESTRUCTURA GEOGRÁFICA Y ADMINISTRATIVA
-- =========================================================================

-- Valles agrícolas costeros (ej. Valle Chancay-Lambayeque, Valle de Ica)
CREATE TABLE valles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    departamento VARCHAR(50) NOT NULL, -- Lambayeque, Piura, Ica, La Libertad, etc.
    cuenca_hidrografica VARCHAR(100),
    geom GEOMETRY(MultiPolygon, 4326), -- Geometría del límite del valle en coordenadas WGS84
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sectores hidráulicos dentro de los valles
CREATE TABLE sectores (
    id SERIAL PRIMARY KEY,
    valle_id INT REFERENCES valles(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    codigo_sector VARCHAR(20) UNIQUE, -- Ej. LH-04-B
    tasa_evaporacion_anual DECIMAL(6,2), -- en mm/año
    geom GEOMETRY(Polygon, 4326),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cultivos soportados y parámetros biofísicos de tolerancia a salinidad
CREATE TABLE cultivos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE, -- Arroz, Caña de azúcar, Uva de mesa, Espárrago, Quinua
    tolerancia_ec_max DECIMAL(4,2) NOT NULL, -- Umbral de Conductividad Eléctrica (EC_e) sin pérdida de rendimiento (dS/m)
    pendiente_perdida_rendimiento DECIMAL(4,1) NOT NULL, -- % de pérdida de rendimiento por cada dS/m por encima del umbral
    profundidad_radicular_efectiva INT NOT NULL, -- en centímetros (profundidad de raíces)
    demanda_hidrica_optima_m3_ha INT NOT NULL -- m3/hectárea al año
);

-- Parcelas agrícolas individuales
CREATE TABLE parcelas (
    id SERIAL PRIMARY KEY,
    sector_id INT REFERENCES sectores(id) ON DELETE CASCADE,
    cultivo_id INT REFERENCES cultivos(id) ON DELETE SET NULL,
    codigo_catastral VARCHAR(50) UNIQUE,
    propietario VARCHAR(100) NOT NULL,
    area_hectareas DECIMAL(10,4) NOT NULL,
    geom GEOMETRY(Polygon, 4326), -- Polígono catastral de la parcela
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 2. INFRAESTRUCTURA DE PERCEPCIÓN EN CAMPO (IoT)
-- =========================================================================

-- Nodos de sensores IoT de campo
CREATE TABLE nodos_sensores (
    id SERIAL PRIMARY KEY,
    parcela_id INT REFERENCES parcelas(id) ON DELETE SET NULL,
    mac_address VARCHAR(17) UNIQUE NOT NULL,
    codigo_nodo VARCHAR(20) UNIQUE NOT NULL, -- Ej. SN-LMB-001
    latitud DECIMAL(9,6) NOT NULL,
    longitud DECIMAL(9,6) NOT NULL,
    geom GEOMETRY(Point, 4326), -- Punto geográfico exacto
    estado VARCHAR(20) DEFAULT 'ACTIVO', -- ACTIVO, MANTENIMIENTO, INACTIVO
    bateria_porcentaje INT CHECK (bateria_porcentaje BETWEEN 0 AND 100),
    ultima_conexion TIMESTAMP,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lecturas de sensores de suelo multi-profundidad (Serie temporal)
CREATE TABLE lecturas_suelo (
    id BIGSERIAL PRIMARY KEY,
    nodo_id INT REFERENCES nodos_sensores(id) ON DELETE CASCADE,
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Sensores a 20 cm (Zona radicular superior)
    humedad_20cm DECIMAL(5,2), -- Contenido Volumétrico de Agua (VWC %)
    conductividad_20cm DECIMAL(5,2), -- Conductividad Eléctrica (EC_a en dS/m)
    temperatura_20cm DECIMAL(4,1), -- en °C
    
    -- Sensores a 40 cm (Zona radicular media)
    humedad_40cm DECIMAL(5,2),
    conductividad_40cm DECIMAL(5,2),
    temperatura_40cm DECIMAL(4,1),
    
    -- Sensores a 60 cm (Límite radicular y lixiviación)
    humedad_60cm DECIMAL(5,2),
    conductividad_60cm DECIMAL(5,2),
    temperatura_60cm DECIMAL(4,1),
    
    -- Nivel Freático (distancia al agua en cm, valor crítico para Lambayeque)
    nivel_freatico_cm DECIMAL(6,2), 
    
    CONSTRAINT unique_nodo_lectura UNIQUE (nodo_id, fecha_hora)
);

-- =========================================================================
-- 3. PERCEPCIÓN SATELITAL (Sentinel-2 & GEE)
-- =========================================================================

-- Escenas satelitales procesadas
CREATE TABLE escenas_satelite (
    id SERIAL PRIMARY KEY,
    sentinel_tile_id VARCHAR(20) NOT NULL, -- Ej. T17MQT
    fecha_adquisicion DATE NOT NULL,
    nubosidad_porcentaje DECIMAL(4,2) NOT NULL,
    ruta_almacenamiento_gee VARCHAR(255), -- ID de Google Earth Engine Asset
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices geoespaciales agregados a nivel de parcela
CREATE TABLE indices_parcela (
    id BIGSERIAL PRIMARY KEY,
    parcela_id INT REFERENCES parcelas(id) ON DELETE CASCADE,
    escena_id INT REFERENCES escenas_satelite(id) ON DELETE CASCADE,
    
    -- Índices calculados promedio dentro del polígono de la parcela
    ndvi_promedio DECIMAL(4,3), -- Vigor vegetal (-1 a 1)
    ndwi_promedio DECIMAL(4,3), -- Estrés hídrico (-1 a 1)
    salinidad_si_promedio DECIMAL(5,3), -- Índice de salinidad (SI)
    
    -- Área de la parcela con costra salina visible (estimado en %)
    cobertura_salina_porcentaje DECIMAL(5,2),
    
    CONSTRAINT unique_parcela_escena UNIQUE (parcela_id, escena_id)
);

-- =========================================================================
-- 4. CAPA DE ACCIÓN Y PRESCRIPCIÓN
-- =========================================================================

-- Prescripciones agronómicas generadas por el Cerebro Predictivo (PINN/IA)
CREATE TABLE prescripciones (
    id SERIAL PRIMARY KEY,
    parcela_id INT REFERENCES parcelas(id) ON DELETE CASCADE,
    fecha_prescripcion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Diagnóstico
    salinidad_actual_ds_m DECIMAL(4,2) NOT NULL,
    humedad_actual_porcentaje DECIMAL(5,2) NOT NULL,
    nivel_riesgo VARCHAR(20) CHECK (nivel_riesgo IN ('BAJO', 'MODERADO', 'ALTO', 'CRÍTICO')),
    
    -- Prescripción Riego y Lavado
    riego_prescrito_m3_ha INT NOT NULL, -- Volumen de riego recomendado
    requerimiento_lavado_porcentaje DECIMAL(5,2) DEFAULT 0.00, -- LR necesario para drenar sales (0-100%)
    
    -- Prescripción Química (Enmiendas)
    yeso_agricola_ton_ha DECIMAL(4,2) DEFAULT 0.00, -- Toneladas de yeso requeridas por hectárea
    corrector_salinidad_aplicar VARCHAR(100), -- Nombre del aditivo químico o lavado
    
    -- Acción Estratégica
    alerta_rotacion_cultivo BOOLEAN DEFAULT FALSE,
    cultivo_sugerido_rotacion VARCHAR(50),
    
    -- Estado de Ejecución
    ejecutado BOOLEAN DEFAULT FALSE,
    fecha_ejecucion TIMESTAMP WITH TIME ZONE,
    operador_responsable VARCHAR(100)
);

-- =========================================================================
-- 5. ÍNDICES Y OPTIMIZACIÓN GEOESPACIAL Y TEMPORAL
-- =========================================================================

-- Índices espaciales GIST (clave para consultas geográficas ultra rápidas)
CREATE INDEX idx_valles_geom ON valles USING GIST(geom);
CREATE INDEX idx_sectores_geom ON sectores USING GIST(geom);
CREATE INDEX idx_parcelas_geom ON parcelas USING GIST(geom);
CREATE INDEX idx_nodos_sensores_geom ON nodos_sensores USING GIST(geom);

-- Índices B-Tree para optimización de series temporales y búsquedas
CREATE INDEX idx_lecturas_suelo_fecha ON lecturas_suelo(fecha_hora DESC);
CREATE INDEX idx_lecturas_suelo_nodo ON lecturas_suelo(nodo_id);
CREATE INDEX idx_indices_parcela_parcela ON indices_parcela(parcela_id);
CREATE INDEX idx_prescripciones_parcela ON prescripciones(parcela_id);
CREATE INDEX idx_prescripciones_riesgo ON prescripciones(nivel_riesgo);
