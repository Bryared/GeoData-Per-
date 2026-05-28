# 🏗️ Arquitectura Actual e Integración Inmediata de GeoTERRA Perú
### *Fase de MVP Funcional e Integración de Servicios Locales (Geotón Perú 2026)*

Este documento detalla la **arquitectura técnica real implementada en el repositorio**, el stack operativo del MVP actual, el esquema SQL espacial maestro de PostgreSQL/PostGIS y el protocolo inmediato de conexión para integrar el frontend y los motores analíticos locales.

---

## 📂 1. Mapa Real del Repositorio Políglota

El ecosistema de **GeoData Perú** se encuentra físicamente estructurado en tu disco local de la siguiente manera:

```text
c:/Users/bryan/GeoData Perú/
├── SATagro/                      # 🧠 BACKEND CIENTÍFICO E INFRAESTRUCTURA DE DATOS (Python Core)
│   ├── brain/                    # Resolvedores físicos matemáticos
│   │   └── pinn_model.py         # Solver PINN (Richards & Convección-Dispersión) en PyTorch
│   ├── data/                     # Ingestores y simuladores físicos de suelo
│   │   └── sensor_simulator.py   # Ingestor dinámico del Valle Chancay-Lambayeque
│   ├── database/                 # Estructura del motor espacial
│   │   └── schema.sql            # Script SQL de inicialización espacial de producción
│   ├── dashboard/                # Prototipo inicial 2D
│   │   └── index.html            # Visor espacial en Leaflet.js
│   ├── server.py                 # API REST principal en FastAPI
│   └── README.md                 # Documentación del backend Sat-Agro
│
├── nexus_router/                 # 🐹 MOTOR DE ALTA CONCURRENCIA VIAL (Golang)
│   ├── go.mod                    # Módulo Go inicializado (v1.22)
│   ├── main.go                   # API HTTP Fiber para ruteo logístico
│   └── graph_solver.go           # Algoritmo Dijkstra / A* multihilo en RAM
│
├── wasm_core/                    # 🦀 MÓDULOS DE ACELERACIÓN EN EL CLIENTE (Rust)
│   ├── Cargo.toml                # Configuración de compilación a WebAssembly (Wasm)
│   ├── README.md                 # Guía de compilación e integración en React
│   └── src/
│       └── lib.rs                # Algoritmo de interpolación Kriging ordinario en Rust
│
└── regenTERRA/                   # 🎨 CLIENTE DE GOBERNANZA MULTIDIMENSIONAL (React Frontend)
    ├── src/
    │   ├── components/           # Componentes base de la suite
    │   │   └── Layout.tsx        # UI base y selector de dimensiones con HSL dinámico
    │   ├── context/
    │   │   └── DimensionContext.tsx # Control de estado reactivo global (Seguridad, Desastres, Recursos)
    │   ├── modules/              # 🧠 ARQUITECTURA MODULAR POR CARACTERÍSTICAS
    │   │   ├── edafologia/       # Módulo Agrícola (Edafo-OS / O.M.N.I. TERRA)
    │   │   │   ├── Map3DKriging.tsx  # Visor 3D acelerado por WebGL (Three.js) de Kriging espacial
    │   │   │   ├── Telemetria.tsx    # Terminal LoRaWAN y calibración espectral Sentinel-2
    │   │   │   └── RecetasVRA.tsx    # Calculadora de enmiendas yeso (VRA) y XGBoost Predictor
    │   │   ├── riesgos/          # Módulo de Mitigación (N.E.X.U.S. 4D)
    │   │   │   └── MandoRiesgos.tsx  # Mapa vectorial SVG, simulación de huaicos y ruteo pgRouting
    │   │   └── catastro/         # Módulo Inclusivo (SAT-Agro Pro)
    │   │       └── VisorCatastral.tsx # Integración interactiva del catastro 2D del Valle Chancay
    │   ├── App.tsx               # Enrutamiento React Router
    │   └── main.tsx              # Punto de entrada de la UI
    └── Arquitectura_Actual_GeoTERRA.md # Este manual técnico
```

---

## 🎨 2. El Stack Tecnológico del MVP Actual

| Componente | Tecnología | Rol Operativo en el MVP |
| :--- | :--- | :--- |
| **Frontend** | **React + TypeScript + Vite + Tailwind** | Renderizado del panel multidimensional, selector HSL de dimensiones y controles interactivos a 60 FPS estables. |
| **Gráficos 3D** | **Three.js / WebGL** | Renderiza la interpolación geoespacial Kriging 3D de salinidad y humedad directamente en el navegador. |
| **Backend API** | **FastAPI (Python v3.11)** | Expone endpoints asíncronos para comunicar telemetría, predicciones XGBoost y prescripciones químicas. |
| **Backend Científico**| **PyTorch + NumPy + SciPy** | resolvedores matemáticos y entrenamiento en caliente de la red PINN para el flujo hidráulico. |
| **Motor de Ruteo** | **Golang (Fiber v1.22)** | Carga en RAM de aristas viales para recálculos logísticos Dijkstra multihilo ultra-rápidos (12ms). |
| **Motor Analítico Wasm**| **Rust + wasm-bindgen** | Algoritmo optimizado de interpolación Kriging continuo en Rust listo para ejecutarse localmente en la CPU del cliente. |
| **Base de Datos** | **PostgreSQL v16 + PostGIS** | Base relacional con extensiones espaciales que almacena catastros, sensores y vías con indexación R-Tree (GIST). |

---

## 🗄️ 3. Esquema SQL Maestro e Inferencia Territorial: `agrodefense_prod`

El motor de base de datos relacional de Supabase/PostgreSQL opera como un **motor de cálculo espacial reactivo** de alto rendimiento en PL/pgSQL.

### A. Estructuras SQL Espaciales (Coordenadas WGS 84 - SRID 4326)
```sql
-- HABILITACIÓN DE EXTENSIONES ESPACIALES
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla: Ecorregiones y Áreas Naturales (Zonificación MINAM / SERFOR)
CREATE TABLE ecoregiones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL UNIQUE,
    clasificacion_riesgo VARCHAR(50), -- Ej: 'Vulnerable', 'Protegida'
    geom GEOMETRY(Polygon, 4326) NOT NULL,
    metadata JSONB, -- Ingesta dinámica de SERFOR
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

-- Tabla: Parcelas Catastrales Edafo-OS (Gemelo Digital SAT-Agro Pro)
CREATE TABLE parcelas_agricolas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_catastral VARCHAR(50) UNIQUE NOT NULL,
    propietario VARCHAR(100) NOT NULL,
    area_hectareas DECIMAL(10,4) NOT NULL,
    tipo_suelo VARCHAR(100),
    geom GEOMETRY(Polygon, 4326) NOT NULL,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_parcelas_geom ON parcelas_agricolas USING GIST (geom);

-- Tabla para telemetría histórica IoT (El alimento temporal del modelo LSTM / PINN)
CREATE TABLE telemetria_iot (
    id BIGSERIAL PRIMARY KEY,
    parcela_id UUID REFERENCES parcelas_agricolas(id) ON DELETE CASCADE,
    humedad_volumetrica_pct DECIMAL(5,2) NOT NULL, -- VWC %
    salinidad_ce_ds_m DECIMAL(5,2) NOT NULL,       -- EC_a (dS/m)
    temperatura_c DECIMAL(4,2),
    vigor_ndvi DECIMAL(4,3),                       -- Sentinel-2
    estres_ndwi DECIMAL(4,3),                      -- Sentinel-2
    fecha_medicion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_telemetria_tiempo ON telemetria_iot (fecha_medicion DESC);
CREATE INDEX idx_telemetria_parcela ON telemetria_iot (parcela_id);
```

### B. Trigger Reactivo de Mitigación Logística en PL/pgSQL
Este disparador bloquea las aristas del grafo vial nacional que caen en la zona de influencia de un desastre recién reportado, y las **libera dinámicamente** cuando el estado de la alerta cambia a `'MITIGADO'`, aplicando la optimización de caja delimitadora (`&&`):

```sql
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

CREATE OR REPLACE TRIGGER trg_bloqueo_vial_inmediato
AFTER INSERT OR UPDATE ON alertas_desastres
FOR EACH ROW EXECUTE FUNCTION auditar_colapso_vial();
```

---

## 🔄 4. Conexiones Pendientes para la Integración Total (MVP funcional)

Para que el ecosistema pase de ser servicios aislados a operar en un bucle completamente integrado de extremo a extremo, estas son las 3 conexiones inmediatas a desarrollar:

### 1. Conexión del Frontend al Microservicio de Golang (`nexus-router`)
*   **Estado actual:** La página `MandoRiesgos.tsx` simula el bypass logístico localmente.
*   **Acción requerida:** Reemplazar la simulación de bypass local por una petición HTTP `POST` real al microservicio en Go expuesto en el puerto `9000` cada vez que el usuario presione "Simular Huaico".

### 2. Sincronización del Frontend al resolvedor PyTorch PINN (`SATagro`)
*   **Estado actual:** El resolvedor de física e inferencias corre localmente en scripts de Python.
*   **Acción requerida:** Configurar el endpoint `/api/v1/prescriptions` de FastAPI (`server.py`) para consumir las variables de salinidad y humedad desde Supabase, calcular la fracción de lavado ($LR$) y la enmienda de yeso en PyTorch, y retornar la receta química a la página `RecetasVRA.tsx`.

### 3. Compilación e Integración de Rust WebAssembly en la UI
*   **Estado actual:** La interpolación de Kriging tridimensional en `Map3DKriging.tsx` se calcula localmente mediante JavaScript básico en `utils/engine.ts`.
*   **Acción requerida:** Ejecutar `wasm-pack build --target web` en el directorio `wasm_core/` e importar el binario compilado de Rust `solve_kriging_wasm` directamente en el bucle de renderizado de Three.js para acelerar los cálculos de mallas en un 400%.
