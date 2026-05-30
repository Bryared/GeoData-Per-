# Estrategia de Pivote: GeoTERRA Perú
**Resiliencia Agroalimentaria y Logística Territorial ante Riesgos Climáticos**

Este documento detalla la reorientación estratégica de **GeoTERRA Perú** para la **Geotón 2026**. El objetivo es consolidar las capacidades tecnológicas del sistema bajo una sola narrativa conductora, defendible frente al jurado y vinculada al ámbito de la **UNALM** (Universidad Nacional Agraria La Molina).

---

## 1. Definición del Producto

> **GeoTERRA Perú es una plataforma de soporte a decisiones territoriales que integra datos georreferenciados oficiales para priorizar riesgos hídricos, proteger la producción agrícola y optimizar la conectividad logística ante eventos climáticos y desastres.**

---

## 2. El Problema Madre

Los valles agrícolas de la costa norte del Perú producen alimentos estratégicos para el país y la agroexportación, pero su continuidad está constantemente amenazada por el estrés hídrico, la salinización de suelos, y la vulnerabilidad de las rutas de distribución ante huaicos e inundaciones. 

Aunque el Estado Peruano genera abundantes datos territoriales (a través de CENEPRED, IGP, ANA, SENAMHI, MTC y MIDAGRI), esta información se encuentra dispersa en silos ministeriales. GeoTERRA unifica estos datos oficiales con sensores locales y constelaciones satelitales en una única cadena de valor de gobernanza.

---

## 3. Caso Piloto Conductor (Demo Ganadora)

**Ámbito:** Corredor Agroalimentario Costa Norte (Piura – Lambayeque – La Libertad – Áncash) hacia Lima / Puerto de Chancay.

### Secuencia del Caso de Uso:
1. **Detección Satelital / Telemetría**: El satélite Sentinel-2 monitorea el vigor vegetal y la humedad de los arrozales en Lambayeque. Se detecta una anomalía de estrés.
2. **Calibración UNALM**: Se prioriza una inspección con drones y mediciones en campo para calibrar los modelos predictivos de rendimiento y estrés de agua.
3. **Alerta de Evento Climático**: n8n recibe una alerta sísmica del IGP o reporte de huaico de CENEPRED.
4. **Colisión Espacial (PostGIS)**: El motor de base de datos calcula la intersección y bloquea el tramo de la Panamericana Norte afectado.
5. **Recálculo de Ruta (Go/Router)**: El resolvedor lógico re-rutea el camión con carga agrícola hacia un bypass seguro (Canta - Huaraz) en 12 milisegundos para evitar mermas.
6. **Dashboard de Decisiones**: El usuario visualiza la alerta, el bloqueo, la ruta alternativa y las parcelas expuestas para proteger la cadena agroalimentaria.

---

## 4. Metodología de Calibración Agro-Satelital (UNALM)

No dependemos únicamente de vuelos de dron individuales (inviables a gran escala) ni de estimaciones indirectas del satélite. Usamos un modelo híbrido por capas:

```text
       Satélite Sentinel-2 / Sentinel-1
       (Monitoreo regional y continuo)
                   │
                   ▼
        Drones Multiespectrales / RGB
      (Resolución centimétrica en zonas críticas)
                   │
                   ▼
        Campo / Laboratorio de Suelos UNALM
           (Verdad-terreno de salinidad y pH)
                   │
                   ▼
         Modelo Predictivo (XGBoost/RF)
             (Inferencia y Decisiones)
```

---

## 5. Arquitectura del Frontend en 6 Pilares

Para evitar la confusión y saturación visual del usuario, el sistema se divide en **seis ventanillas claras**:

1. **Resumen Territorial**: ¿Qué está pasando a nivel general en el corredor agroalimentario?
2. **Riesgos y Logística**: ¿Qué amenaza existe y qué ruta se propone ante el bloqueo?
3. **Suelos y Cultivos**: ¿Qué parcelas y cultivos requieren atención o recetas de remediación?
4. **Catastro Agrícola**: ¿Dónde están delimitados los predios de los agricultores?
5. **Agua y Recursos Hídricos**: ¿Cuál es el estado de la disponibilidad hídrica en las cuencas costeras?
6. **Evidencia GEO Perú**: ¿Qué bases de datos oficiales del Estado respaldan técnicamente esta solución?

---

## 6. Estado del MVP (Trazabilidad para el Jurado)

| Componente | Estado en la Demo | Tipo de Datos | Destino / Defensa |
| :--- | :--- | :--- | :--- |
| **Frontend (React)** | Funcional | Real UI | Panel de control integrado de los 6 pilares. |
| **Visor de Mapas (Leaflet)** | Funcional | Interactivos | Renderiza capas base, GeoJSON de PostGIS y marcadores. |
| **Backend de Rutas (Go)** | Funcional | Grafo vial | pgRouting adaptado y recalculado en milisegundos. |
| **Ingesta de Alertas (n8n)** | Integrado / Activo | Sismos IGP | Captura de eventos del IGP y almacenamiento. |
| **Base de Datos (PostGIS)** | Conectado | Espaciales | Triggers de colisión espacial y consulta de centroides. |
| **Reservas Hídricas** | Visualización | Escenario Controlado | Datos de represas del ANA (Poechos, Tinajones). |
| **Monitoreo Satelital** | Modelos | Escenario Controlado | Curvas temporales de NDVI/NDWI calibradas por UNALM. |
| **Sensores IoT Físicos** | Planificación | Roadmap | Red LoRaWAN futura para monitoreo in-situ. |

---

## 7. Matriz de Valor Público

* **MIDAGRI / Juntas de Riego**: Permite optimizar el riego y anticipar la salinización de suelos.
* **MTC / Transportistas**: Evita la pérdida de alimentos reduciendo el tiempo de desvío de camiones cargados de 6 horas a 12 milisegundos de planificación.
* **INDECI / CENEPRED / Gobiernos Regionales**: Permite priorizar la ayuda humanitaria y el despliegue preventivo de maquinaria en las parcelas de mayor vulnerabilidad.
