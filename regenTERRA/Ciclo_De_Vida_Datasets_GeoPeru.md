# 🌌 Ciclo de Vida e Integración de Datos: Los 3 Datasets Oficiales de GEO Perú en GeoTERRA

Este documento detalla el ciclo técnico de datos de **GeoTERRA Perú** (desde la recolección estatal en el portal **GEO Perú** hasta la toma de decisiones y visualización final en el panel React). Explica con rigor técnico cómo interactúan el **Catastro Rural (MIDAGRI)**, la **Red Vial Nacional (MTC)** y las **Zonas de Susceptibilidad (CENEPRED)** dentro del ecosistema relacional espacial de la plataforma.

---

## 🗺️ Flujo General del Dato: Del Portal de GEO Perú al Dashboard de React

El viaje que realiza la información desde que se extrae del portal oficial hasta que genera alertas y recetas en el frontend de GeoTERRA se estructura en las siguientes 5 fases operativas:

```mermaid
flowchart TD
    %% Portal Oficial
    subgraph F1 [1. RECOLECCIÓN (GEO Perú)]
        A1["Catastro Rural (MIDAGRI) <br> Shapefile / GeoJSON"]
        A2["Red Vial Nacional (MTC) <br> Shapefile / LineStrings"]
        A3["Susceptibilidad a Huaicos (CENEPRED) <br> Shapefile / Polygons"]
    end

    %% Proceso ETL
    subgraph F2 [2. PIPELINE ETL & HOMOLOGACIÓN]
        B1["ogr2ogr / Python scripts <br> Reproyección a EPSG:4326 (WGS 84)"]
    end

    %% Base de Datos PostGIS
    subgraph F3 [3. BASE DE DATOS GEOSPECIAL (Supabase)]
        C1[("PostgreSQL + PostGIS")]
        C2["Tabla: parcelas_agricolas <br> (Índice GIST - Polígonos)"]
        C3["Tabla: red_vial_logistica <br> (Índice GIST - LineStrings)"]
        C4["Tabla: alertas_desastres <br> (Índice GIST - Polígonos)"]
        
        C1 --> C2
        C1 --> C3
        C1 --> C4
        
        C4 -->|"Trigger Espacial: ST_Intersects"| C3
    end

    %% Motores de Inferencia
    subgraph F4 [4. MOTORES DE CÓMPUTO CIENTÍFICO]
        D1["Backend Python (FastAPI)<br>Richards Solver PINN (PyTorch) + XGBoost"]
        D2["Backend Go (nexus_router)<br>Grafo en RAM & Dijkstra Concurrente"]
    end

    %% Salida Frontend
    subgraph F5 [5. CAPA DE PRESENTACIÓN (React UI)]
        E1["Edafo-OS: Recetas VRA de Yeso <br> y Riego (Modelado Kriging 3D)"]
        E2["Mando de Riesgos: Bypass <br> Logístico y Alerta 'Vía Bloqueada'"]
    end

    %% Conexiones
    A1 & A2 & A3 --> B1
    B1 --> C1
    
    C2 -->|"Geometrías de Parcelas"| D1
    C3 -->|"Grafo Vial"| D2
    
    D1 -->|"Payload Prescripciones"| E1
    D2 -->|"Ruta Evacuación"| E2
```

---

## 🌿 1. Catastro Rural (MIDAGRI)
* **Nombre Oficial en GEO Perú:** *Límites de Predios Rurales / Capacidad de Uso Mayor del Suelo (MIDAGRI - SERFOR)*

### 📥 A. Recolección (Cómo se Obtiene)
Se descarga del visor de GEO Perú o del nodo del **MIDAGRI** como capa georreferenciada. Típicamente, el formato de origen es un **Shapefile (.shp)** o un **GeoJSON** proyectado en coordenadas planas de proyectos locales (ej. **UTM WGS84 Zona 17S** o **18S**).

### ⚙️ B. Ingesta y ETL (La Transformación)
Dado que las coordenadas planas varían por zona del país, GeoTERRA las convierte a coordenadas geográficas globales en formato decimal usando la herramienta espacial **`ogr2ogr`** para estandarizarlas bajo el código **EPSG:4326 (WGS 84)**. Esto permite acoplar mapas globales y telemetría satelital (Sentinel-2) sin desalineaciones geométricas:
```bash
ogr2ogr -f "PostgreSQL" PG:"host=db.ppcdttdynesnajqtjwfw.supabase.co user=postgres dbname=postgres password=GeoTerra12345$" "predios_rurales.shp" -nln parcelas_agricolas -t_srs EPSG:4326 -lco GEOMETRY_NAME=geom
```

### 💾 C. Almacenamiento en PostGIS
El polígono de cada parcela se almacena en la tabla [`parcelas_agricolas`](file:///c:/Users/bryan/GeoData%20Per%C3%BA/SATagro/database/schema.sql) con la columna tipo `GEOMETRY(Polygon, 4326)`. Para acelerar los cálculos de intersección espacial, se crea un índice espacial **GIST** (basado en árboles R-Tree):
```sql
CREATE TABLE parcelas_agricolas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_catastral VARCHAR(50) UNIQUE NOT NULL,
    propietario VARCHAR(100),
    area_hectareas DECIMAL(10,4),
    geom GEOMETRY(Polygon, 4326) NOT NULL
);
CREATE INDEX idx_parcelas_geom ON parcelas_agricolas USING GIST (geom);
```

### 🧠 D. Para qué se usa y cómo funciona (El Algoritmo Agronómico)
1. **Delimitación Física:** El polígono importado define el límite exacto del predio del agricultor.
2. **Fusión de Datos (IoT + Satélite):** El backend cruza las coordenadas de los sensores LoRaWAN en campo (humedad, conductividad eléctrica) y el NDVI satelital de Sentinel-2 dentro de este polígono.
3. **Física del Suelo y Redes PINN (Ecuación de Richards):** El modelo en PyTorch [`pinn_model.py`](file:///c:/Users/bryan/GeoData%20Per%C3%BA/SATagro/brain/pinn_model.py) resuelve el transporte de agua y sales en el perfil tridimensional del suelo:
   $$q = -K(\theta) \left( \frac{\partial \psi}{\partial z} + 1 \right)$$
4. **Receta VRA de Yeso:** Multiplicando el área en hectáreas de la parcela catastral por los datos químicos recopilados (Porcentaje de Sodio Intercambiable - PSI), el resolvedor calcula la enmienda de **yeso agrícola** necesaria para recuperar la fertilidad del suelo:
   $$\text{Yeso (t/ha)} = \frac{\text{PSI}_{\text{actual}} - \text{PSI}_{\text{objetivo}}}{100} \times \text{CIC} \times 1.72 \times \text{Densidad Aparente}$$
5. **Salida UI:** En la sección **"Recetas VRA"** del frontend React, el usuario visualiza la receta química exacta recomendada específicamente para la geometría de su parcela.

---

## 🚗 2. Red Vial Nacional, Departamental y Vecinal (MTC)
* **Nombre Oficial en GEO Perú:** *Red Vial del Ministerio de Transportes y Comunicaciones (MTC)*

### 📥 A. Recolección (Cómo se Obtiene)
Se descarga del portal de GEO Perú como la capa lineal oficial que contiene las carreteras del país clasificadas por jerarquía (Nacional, Departamental, Vecinal) y tipo de superficie de rodadura (asfaltado, afirmado, trocha).

### ⚙️ B. Ingesta y ETL (La Transformación)
Se filtran las líneas vectoriales correspondientes a los corredores logísticos del norte peruano (Chancay, Huacho, Barranca, Chimbote, Trujillo) y se exportan en formato de coordenadas WGS84 para cargarse en Supabase en la tabla `red_vial_logistica`.

### 💾 C. Almacenamiento en PostGIS
Los tramos de carretera se guardan como objetos tipo **`LineString`** en la base de datos geoespacial:
```sql
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
```

### 🧠 D. Para qué se usa y cómo funciona (El Algoritmo de Ruteo)
1. **Construcción del Grafo Vial:** Al iniciar el servidor en Golang (`nexus_router` en [`main.go`](file:///c:/Users/bryan/GeoData%20Per%C3%BA/nexus_router/main.go)), éste consulta la tabla `red_vial_logistica` y reconstruye las líneas vectoriales (`LineString`) en memoria RAM como un **grafo matemático de aristas y nodos**.
2. **Cálculo Dinámico del Costo de Tránsito:** La resistencia de cada tramo se define según su estado:
   $$\text{Costo (Tiempo en Minutos)} = \frac{\text{Longitud (km)}}{\text{Velocidad Base (km/h)} \times (1 - \text{Riesgo de Colapso})}$$
3. **Algoritmo Dijkstra Concurrente:** Cuando un camión agrícola sale de una parcela hacia el Puerto de Chancay, el microservicio en Go ejecuta el resolvedor Dijkstra en paralelo (usando **Goroutines** de alta concurrencia) para trazar la ruta de menor costo.
4. **Salida UI:** Retorna la ruta óptima como un GeoJSON LineString que React dibuja en el mapa de desvío logístico, permitiendo al operador seguir la ruta en tiempo real.

---

## ⚠️ 3. Zonas de Susceptibilidad y Riesgos (CENEPRED)
* **Nombre Oficial en GEO Perú:** *Áreas de susceptibilidad a movimientos en masa (huaicos) e inundaciones (CENEPRED)*

### 📥 A. Recolección (Cómo se Obtiene)
Se descarga de la plataforma **SIGRID (CENEPRED)** como capas de polígonos que delimitan áreas históricas y predictivas de inundación, fajas marginales de ríos y quebradas activas propensas a deslizarse ante precipitaciones intensas.

### ⚙️ B. Ingesta y ETL (La Transformación)
Las geometrías complejas (Multipolígonos) se importan en la base de datos PostgreSQL en la tabla `alertas_desastres`. Esta tabla recibe también eventos activos de sensores meteorológicos en caliente o reportes de Defensa Civil (INDECI) en tiempo real.

### 💾 C. Almacenamiento en PostGIS
Se almacenan en la tabla `alertas_desastres` en formato `GEOMETRY(Polygon, 4326)` o `GEOMETRY(MultiPolygon, 4326)`:
```sql
CREATE TABLE alertas_desastres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_evento VARCHAR(50) NOT NULL, -- 'HUAICO', 'INUNDACIÓN'
    geom GEOMETRY(Polygon, 4326) NOT NULL,
    estado VARCHAR(20) DEFAULT 'ACTIVO' -- 'ACTIVO', 'MITIGADO'
);
```

### 🧠 D. Para qué se usa y cómo funciona (El Cruce Espacial y Alerta)
1. **Trigger de Colisión Geoespacial:** Para automatizar las alertas, se implementa un **Trigger espacial** reactivo en PL/pgSQL. Cada vez que ingresa una alerta de desastre (ej. se simula un Huaico en la quebrada Casma en el mapa de React), la base de datos intersecta en milisegundos el polígono de desastre con las carreteras del MTC utilizando la función espacial **`ST_Intersects`**:
   ```sql
   CREATE OR REPLACE FUNCTION auditar_colapso_vial()
   RETURNS TRIGGER AS $$
   BEGIN
       IF NEW.estado = 'ACTIVO' THEN
           -- Modifica el estado de la vía que intersecta físicamente con el huaico
           UPDATE red_vial_logistica
           SET estado_operativo = 'BLOQUEADA',
               riesgo_colapso_pct = 100.00
           WHERE geom && NEW.geom AND ST_Intersects(geom, NEW.geom);
       ELSIF NEW.estado = 'MITIGADO' AND OLD.estado = 'ACTIVO' THEN
           -- Restablece la vía una vez que se declara como mitigado
           UPDATE red_vial_logistica
           SET estado_operativo = 'OPERATIVO',
               riesgo_colapso_pct = 0.00
           WHERE geom && NEW.geom AND ST_Intersects(geom, NEW.geom);
       END IF;
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```
2. **Disparo de Alerta "Vía Bloqueada":** Al ejecutarse la intersección, el estado del tramo de la carretera en la base de datos cambia automáticamente a `'BLOQUEADA'`.
3. **Bypass Automático en Go:** El resolvedor en Golang detecta que el costo del tramo bloqueado ahora es **infinito**, invalida el camino actual del transporte y traza una ruta andina segura de bypass (ej. **Trujillo ──► Huaraz ──► Canta ──► Lima**).
4. **Salida UI:** La interfaz React muestra inmediatamente el ícono de peligro sobre la carretera, emite una notificación de advertencia en el panel superior, colorea el tramo afectado de rojo e ilustra la nueva ruta segura calculada para el vehículo.

---

## 🏆 Resumen del Valor Estratégico en la Geotón 2026
La integración ciberfísica de estos tres datasets demuestra un **alto nivel de madurez técnica (TRL 5/6)** y es el diferenciador que valora la **SGTD / PCM**:
* **Catastro MIDAGRI:** Garantiza la precisión agronómica, aplicando modelos matemáticos y de IA directamente sobre perímetros reales de propiedad agrícola de forma individualizada.
* **Red Vial MTC:** Convierte las capas vectoriales en una infraestructura de grafos navegable, simulando la logística del transporte nacional de alimentos.
* **Riesgos CENEPRED:** Permite una resiliencia automatizada, cruzando espacialmente desastres naturales con infraestructura de transporte para tomar decisiones preventivas al instante.
