# 🌌 Guía Maestra: Ciclo de Vida e Integración de los Datasets de GEO Perú
### *GeoTERRA: El Sistema Edafo-Logístico de Inferencia Territorial para la Geotón Perú 2026*

Este documento detalla el ciclo completo de los datos geoespaciales desde su recolección en los portales gubernamentales de **GEO Perú** (PCM) hasta su consumo y procesamiento en los motores de inferencia analítica de **GeoTERRA** (PostGIS, Python PINN y Golang Nexus Router).

---

## 🗺️ Mapa de Flujo de Datos General (Life Cycle)

```mermaid
graph TD
    %% Recolección
    subgraph 1. RECOLECCIÓN (GEO Perú)
        MIDAGRI[Predios Rurales MIDAGRI] -->|Shapefile / GeoJSON| ETL[Pipelines de Ingesta]
        MTC[Red Vial Nacional MTC] -->|Shapefile / Shape| ETL
        CENEPRED[Zonas de Riesgo CENEPRED] -->|Shapefile / KML| ETL
    end

    %% Procesamiento
    subgraph 2. PROCESAMIENTO (ETL & GIS)
        ETL -->|Reproyección EPSG:4326 ogr2ogr| DB[(Supabase PostGIS)]
    end

    %% Almacenamiento Relacional
    subgraph 3. BASE DE DATOS GEOSPECIAL
        DB -->|Tabla: parcelas_agricolas| PARCELAS[Polígonos de Predios]
        DB -->|Tabla: red_vial_logistica| VIAL[Grafo Vial LineStrings]
        DB -->|Tabla: alertas_desastres| RIESGO[Polígonos de Huaicos/Lluvias]
        
        RIESGO -->|Trigger PL/pgSQL: ST_Intersects| VIAL
    end

    %% Consumo y Motores de Inferencia
    subgraph 4. MOTORES DE INFERENCIA
        PARCELAS -->|Física de Suelos + IoT| PY[FastAPI / Richards Solver PINN]
        VIAL -->|Ruteo Multihilo Dijkstra| GO[nexus_router Golang]
    end

    %% Salidas UI
    subgraph 5. CAPA DE PRESENTACIÓN (React UI)
        PY -->|Output| UI1[Prescripciones VRA de Yeso y Lavado]
        GO -->|Output| UI2[Mapa 2D/3D con Bypass de Evacuación]
    end
```

---

## 🌿 1. Catastro Rural y Suelo (MIDAGRI)

### A. Recolección e Ingesta
*   **Nombre Oficial en GEO Perú:** *Límites de Predios Rurales / Capacidad de Uso Mayor del Suelo (MIDAGRI - SERFOR)*.
*   **Formato de Descarga:** Archivo comprimido `.zip` conteniendo los Shapefiles de límites prediales del valle (Chancay o Bajo Piura) en coordenadas proyectadas (típicamente UTM WGS84 Zona 17S u 18S).
*   **Procesamiento:** Los datos se extraen y se re-proyectan al estándar espacial geográfico global **WGS84 (SRID 4326)** utilizando la herramienta de línea de comandos `ogr2ogr`:
    ```bash
    ogr2ogr -f "PostgreSQL" PG:"host=db.ppcdttdynesnajqtjwfw.supabase.co user=postgres dbname=postgres password=GeoTerra12345$" "predios_rurales.shp" -nln parcelas_agricolas -t_srs EPSG:4326 -lco GEOMETRY_NAME=geom
    ```

### B. Mapeo en Base de Datos (Supabase)
Se inyecta en la tabla `parcelas_agricolas`, la cual cuenta con el índice espacial **GIST** para acelerar búsquedas y cálculos geométricos:
```sql
CREATE TABLE parcelas_agricolas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_catastral VARCHAR(50) UNIQUE NOT NULL,
    propietario VARCHAR(100),
    area_hectareas DECIMAL(10,4),
    tipo_suelo VARCHAR(100),
    cultivo_id INT REFERENCES cultivos(id),
    geom GEOMETRY(Polygon, 4326) NOT NULL
);
CREATE INDEX idx_parcelas_geom ON parcelas_agricolas USING GIST (geom);
```

### C. Uso en el Sistema (El "Cerebro")
1.  **Ingesta IoT**: Los sensores físicos instalados en el campo reportan la Conductividad Eléctrica (CE) y humedad volumétrica del suelo para coordenadas específicas `(lat, lng)`.
2.  **Kriging Universal**: El motor calcula la interpolación Kriging sobre toda la extensión del polígono geométrico para mapear gradientes de salinidad subsuperficiales.
3.  **Inferencia Física (Richards Solver PINN)**: El backend en Python consume estas lecturas y ejecuta las ecuaciones de balance de masa y transporte de solutos:
    $$q = -K(\theta) \left( \frac{\partial \psi}{\partial z} + 1 \right)$$
4.  **Prescripción de Dosificación VRA**: Calcula la cantidad exacta de Yeso Agrícola necesaria para desplazar el Sodio intercambiable ($Na^+$) mediante el Calcio ($Ca^{2+}$) aplicando la fórmula sobre el volumen de suelo delimitado por el área de la parcela:
    $$\text{Requerimiento de Yeso (t/ha)} = \frac{\text{ESP}_{\text{actual}} - \text{ESP}_{\text{objetivo}}}{100} \times \text{CIC} \times 1.72 \times \text{Densidad Aparente}$$

---

## 🚗 2. Red Vial Nacional, Departamental y Vecinal (MTC)

### A. Recolección e Ingesta
*   **Nombre Oficial en GEO Perú:** *Red Vial del Ministerio de Transportes y Comunicaciones (MTC)*.
*   **Formato de Descarga:** Capas vectoriales de tipo `LineString` conteniendo todas las carreteras asfaltadas, afirmadas y trochas del Perú, categorizadas por su estado operativo.
*   **Procesamiento:** Se filtran únicamente los corredores logísticos del norte (Panamericana Norte y accesos a la sierra de Huaraz/Cajamarca) y se cargan a la base de datos Supabase:
    ```bash
    ogr2ogr -f "PostgreSQL" PG:"host=db.ppcdttdynesnajqtjwfw.supabase.co user=postgres dbname=postgres password=GeoTerra12345$" "red_vial_nacional.shp" -nln red_vial_logistica -t_srs EPSG:4326 -lco GEOMETRY_NAME=geom
    ```

### B. Mapeo en Base de Datos (Supabase)
Se guarda en la tabla `red_vial_logistica`:
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

### C. Uso en el Sistema (El "Cerebro")
1.  **Carga del Grafo**: Al arrancar el microservicio en Golang (`nexus_router`), este carga las líneas vectoriales (`LineString`) desde la base de datos a su memoria RAM como un grafo matemático indexado de aristas y nodos.
2.  **Cálculo de Costo**: Cada arista tiene un costo asociado calculado como:
    $$\text{Costo (Minutos)} = \frac{\text{Longitud de la Vía (km)}}{\text{Velocidad Base (km/h)} \times (1 - \text{Riesgo de Colapso})}$$
3.  **Algoritmo Dijkstra Concurrente**: Cuando el usuario solicita una ruta logística segura, Golang ejecuta el resolvedor Dijkstra de forma paralela en hilos independientes (Goroutines) para encontrar el camino más rápido entre las parcelas y los puertos de exportación (ej. Chancay, Paita).

---

## ⚠️ 3. Zonas de Susceptibilidad y Riesgos (CENEPRED)

### A. Recolección e Ingesta
*   **Nombre Oficial en GEO Perú:** *Áreas de susceptibilidad a movimientos en masa (huaicos) e inundaciones (CENEPRED)*.
*   **Formato de Descarga:** Capas vectoriales de tipo `Polygon` e `MultiPolygon` que delimitan las quebradas activas, cuencas de desborde y fajas marginales.
*   **Procesamiento:** Se cargan a la base de datos de Supabase en la tabla `alertas_desastres` cada vez que ingresa una alerta satelital en tiempo real (GEOS/GOES) o reporte de Defensa Civil (INDECI).

### B. Mapeo en Base de Datos (Supabase)
Se inyecta en la tabla `alertas_desastres`:
```sql
CREATE TABLE alertas_desastres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_evento VARCHAR(50) NOT NULL, -- 'HUAICO', 'INCENDIO', 'SISMO'
    severidad INTEGER CHECK (severidad BETWEEN 1 AND 5),
    geom GEOMETRY(Polygon, 4326) NOT NULL,
    detalles_tensor JSONB,
    fecha_deteccion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR(20) DEFAULT 'ACTIVO' -- 'ACTIVO', 'MITIGADO'
);
```

### C. Uso en el Sistema (El "Cerebro")
Este es el pilar de automatización de GeoTERRA. Implementa un **Trigger espacial reactivo** en PL/pgSQL que detecta colisiones geográficas en microsegundos:

1.  **Ingreso del Desastre**: Un huaico o inundación es registrado en `alertas_desastres`.
2.  **Disparador Geoespacial (`ST_Intersects`)**: El trigger se dispara inmediatamente:
    ```sql
    CREATE OR REPLACE FUNCTION auditar_colapso_vial()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Si el huaico entra en estado ACTIVO, se intersectan las vías afectadas
        IF NEW.estado = 'ACTIVO' THEN
            UPDATE red_vial_logistica
            SET estado_operativo = 'BLOQUEADA',
                riesgo_colapso_pct = 100.00
            WHERE geom && NEW.geom AND ST_Intersects(geom, NEW.geom);
            
        -- Si el desastre se mitiga, las vías vuelven a la normalidad
        ELSIF NEW.estado = 'MITIGADO' AND OLD.estado = 'ACTIVO' THEN
            UPDATE red_vial_logistica
            SET estado_operativo = 'OPERATIVO',
                riesgo_colapso_pct = 0.00
            WHERE geom && NEW.geom AND ST_Intersects(geom, NEW.geom);
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    ```
3.  **Bypass Automático**: Al marcar la vía afectada como `BLOQUEADA`, el microservicio de Golang recibe el evento, invalida su grafo vial en RAM, establece el costo de la carretera afectada a `infinito` y desvía la flota agrícola por una ruta andina alternativa segura (ej. de Trujillo a Lima a través del bypass del Callejón de Huaylas y Canta), reflejándose instantáneamente en el mapa de React.

---

## 🏆 Resumen del Valor GEO Perú en la Evaluación
Esta integración de los tres datasets oficiales en un bucle relacional activo es la **ventaja competitiva (foso tecnológico)** que el jurado técnico valorará más:
*   ** MIDAGRI**: Asegura que las recetas no son simulaciones teóricas, sino que se aplican sobre polígonos catastrales reales inscritos en el Estado.
*   ** MTC**: Convierte la red vial en un grafo matemático navegable por microservicios en Golang.
*   ** CENEPRED**: Automatiza la gestión de riesgos en tiempo real cruzando desastres y carreteras mediante queries espaciales SQL puras.
