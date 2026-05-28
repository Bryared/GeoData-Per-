# 📖 MANUAL DE OPERACIÓN Y GUÍA DE USUARIO  
## **GeoTERRA Perú – Sistema Operativo de Gobernanza Territorial**  
*(Propuesta para Geotón Perú 2026)*

Este documento describe el funcionamiento de la aplicación GeoTERRA Perú de inicio a fin, con énfasis en su uso práctico por parte de entidades públicas, equipo técnico y jurado evaluador. Se detalla la lógica de navegación, los módulos y submódulos, las problemáticas territoriales que aborda en el Perú y los pasos para operar cada componente durante una demostración.

---

## 1. Estructura lógica de la aplicación

La interfaz de GeoTERRA Perú se organiza en módulos temáticos, alineados a tres dimensiones de gobernanza territorial. Cada dimensión se representa con una paleta de color diferenciada en la barra lateral:

- **Seguridad alimentaria** (tema verde): Módulo de **Edafología (Edafo‑OS)**.
- **Gestión del riesgo de desastres** (tema rojo): Módulo de **Riesgos (N.E.X.U.S. 4D)**.
- **Hidrología y reservas** (tema azul): Módulo de **Catastro y agua (SAT‑Agro Pro)**.

```text
┌──────────────────────────────────────────────┐
│           VISOR PRINCIPAL (DASHBOARD)       │
│     Consola de indicadores y modelos        │
└──────────────────────┬──────────────────────┘
                       │
      ┌────────────────┼─────────────────────┐
      │                │                     │
      ▼                ▼                     ▼
┌──────────────┐ ┌──────────────┐     ┌──────────────┐
│  EDAFOLOGÍA  │ │   RIESGOS    │     │   CATASTRO   │
│ (Edafo-OS)   │ │ (N.E.X.U.S.) │     │ (SAT-Agro)   │
└──────┬───────┘ └──────┬───────┘     └──────┬───────┘
       ├─ Telemetría          └─ Mando de Riesgos     └─ Visor Catastral
       ├─ Mapa 3D                                     (Valle Chancay)
       └─ Recetas VRA
```

---

## 2. Dashboard principal

### 2.1. Problema que aborda

- **Fragmentación de información**: Datos georreferenciados relevantes (MINAM, ANA, SENAMHI, CENEPRED, MTC, etc.) se analizan de forma aislada.  
- **Poca trazabilidad de modelos**: Las decisiones se basan en reportes estáticos, con poca visibilidad del comportamiento de modelos de predicción.

### 2.2. Funcionalidades

- **Indicadores clave integrados**:
  - Estado de la vegetación (NDVI promedio por valle).
  - Parámetros de suelo (salinidad, humedad).
  - Estado hídrico (embalses, cuencas).
  - Estado operativo de rutas críticas (vías bloqueadas u operativas).

- **Sincronización satelital**:
  - Botón para disparar la sincronización con índices Sentinel‑2 simulados (NDVI, NDWI, NDSI), que actualizan mapas y métricas.

- **Monitor de modelos de IA**:
  - Panel que muestra residuales de modelos físicos informados por ecuaciones (PINN) y desempeño de modelos tabulares (p. ej. XGBoost).

### 2.3. Uso paso a paso

1. Acceder a la ruta principal `/` o menú **“Dashboard”**.
2. Pulsar **“Sincronizar Sentinel‑2”** para actualizar los índices satelitales de la vista de demo (se muestra un indicador de sincronización y valores actualizados).
3. Revisar la tarjeta de **“Modelo de IA del suelo”**:
   - Alternar entre pestañas de **modelo físico (PINN)** y **modelo tabular (XGBoost)** para mostrar que el sistema combina física e IA estadística.

---

## 3. Módulo de Edafología (Edafo‑OS / seguridad alimentaria)

Este módulo se orienta a suelos agrícolas y cultivos, especialmente en valles costeros afectados por salinización y estrés hídrico.

### 3.1. Submódulo: Telemetría

#### Problema que aborda

- Falta de información subsuperficial en tiempo casi real.  
- La salinización y el estrés hídrico se manifiestan primero en la zona radicular (20–60 cm) y no son visibles a simple vista.

#### Funcionalidades

- **Consola de telemetría IoT**:
  - Simulación de tramas de sensores de suelo (CE, humedad, pH, nitrógeno) recibidas vía LoRaWAN/MQTT.

- **Selector de índices satelitales**:
  - Conmutación entre NDVI (vigor), NDWI (humedad) y un índice de salinidad derivado (NDSI) para el área de interés.

#### Uso paso a paso

1. Abrir el menú **“Edafología” → “Telemetría”**.
2. Observar la consola de telemetría, que muestra mensajes entrantes de nodos simulados (con tiempo, ID de nodo y valores).
3. En la parte de índices, seleccionar:
   - **NDVI** para vigor de la vegetación.
   - **NDWI** para humedad asociada a estrés hídrico.
   - **NDSI** para identificar zonas con posible salinización superficial.
4. Explicar brevemente que estos índices se alimentan de datos satelitales (Sentinel‑2) combinados con sensores de campo.

---

### 3.2. Submódulo: Mapa 3D (Kriging)

#### Problema que aborda

- Costos altos y baja densidad de muestreo de suelo.  
- Dificultad para visualizar la distribución espacial de salinidad y humedad.

#### Funcionalidades

- **Visualización 3D interactiva**:
  - Terreno renderizado con Three.js, con elevación y una superficie que refleja la interpolación de variables (CE, humedad, pH, etc.).
- **Interpolación Kriging (lado cliente o servidor)**:
  - Cálculo y representación de una superficie continua a partir de puntos de muestreo (sensores o muestreos puntuales).

#### Uso paso a paso

1. Ir a **“Edafología” → “Mapa 3D”**.
2. Utilizar el ratón para rotar, acercar y alejar la escena.
3. Cambiar la variable visualizada (por ejemplo, **salinidad** → rojo más intenso; **humedad** → tonos azules).
4. Explicar cómo esta vista ayuda a identificar zonas problemáticas (acumulación de sales, zonas secas) sin necesidad de muestrear cada punto del campo.

---

### 3.3. Submódulo: Recetas VRA (prescripciones)

#### Problema que aborda

- Aplicación de agua y enmiendas de manera empírica.  
- Elección de cultivos sin criterio edafológico y climático, lo que aumenta el riesgo financiero y la degradación del suelo.

#### Funcionalidades

- **Calculadora de enmiendas (yeso) y fracción de lavado**:
  - Cálculo de dosis recomendadas de yeso agrícola y volumen de riego de lavado a partir de parámetros del suelo (p. ej. salinidad, PSI).
- **Recomendaciones de cultivos**:
  - Módulo que estima la aptitud relativa de distintos cultivos en función de propiedades del suelo y condiciones climáticas.

#### Uso paso a paso

1. Abrir **“Edafología” → “Recetas VRA”**.
2. Ajustar los controles de entrada (por ejemplo, salinidad del suelo, porcentaje de sodio intercambiable).
3. Observar:
   - La dosis sugerida de yeso por hectárea.
   - El volumen de agua de lavado recomendado.
4. Seleccionar un cultivo en el selector de cultivos y mostrar la recomendación de aptitud (alto/medio/bajo) con base en los parámetros actuales.

---

## 4. Módulo de Riesgos (N.E.X.U.S. 4D)

Este módulo integra información de amenazas como movimientos en masa, incendios y sismos con la infraestructura vial y logística.

### 4.1. Problema que aborda

- Cortes de vías (huaicos, inundaciones) que aíslan territorios y afectan la distribución de alimentos e insumos.  
- Respuesta reactiva a desastres, con poco apoyo en simulaciones y routing geoespacial.

### 4.2. Funcionalidades

- **Mapa de riesgos y red vial**:
  - Visualización de la red vial principal (MTC) y zonas de riesgo según datos de GEO Perú / CENEPRED.
- **Simulación de bloqueo de tramos**:
  - Activación de eventos de “desastre” que afectan un tramo de la red.
- **Cálculo de rutas alternativas**:
  - Uso de algoritmos tipo Dijkstra/A* sobre red vial (apoyado en pgRouting y PostGIS) para encontrar rutas de desvío.

### 4.3. Uso paso a paso

1. Abrir **“Riesgos” → “Mando de riesgos”**.
2. Identificar en el mapa un tramo crítico (por ejemplo, un segmento de la Panamericana o Carretera Central).
3. Activar una simulación de evento (ejemplo: **“Simular huaico”** en un punto determinado).
4. Observar:
   - Cambio visual del estado de la vía afectada (de “operativa” a “bloqueada”).
   - Trazado de una ruta alternativa en el mapa.
5. Explicar que, en producción, esta lógica puede conectarse con telemetría y sistemas de respuesta para soportar decisiones de desvío y priorización logística.

---

## 5. Módulo de Catastro (SAT‑Agro Pro)

Este módulo vincula parcelas agrícolas, su condición física y la dimensión legal/catastral.

### 5.1. Problema que aborda

- Falta de catastro digital integrado.
- Dificultad para relacionar derechos de uso de tierra, dotación de agua y condición física del suelo.

### 5.2. Funcionalidades

- **Visor catastral 2D**:
  - Visualización de parcelas con geometrías y atributos (código catastral, cultivo actual, tipo de suelo).
- **Integración con datos físicos**:
  - Acceso a variables de salinidad, humedad y vigor para cada parcela registrada.

### 5.3. Uso paso a paso

1. Ir a **“Catastro” → “Visor catastral”**.
2. Navegar por el mapa (zoom/pan) hasta una zona de interés (por ejemplo, Valle Chancay–Lambayeque).
3. Hacer clic sobre una parcela para ver:
   - Código catastral.
   - Cultivo actual.
   - Parámetros físicos relevantes (salinidad, humedad, NDVI).
4. Explicar cómo esta información puede ser usada por juntas de regantes, aseguradoras o programas de crédito rural.

---

## 6. Módulo de Pitch (Presentación del proyecto)

Este módulo sirve de apoyo para explicar de forma estructurada la propuesta a tomadores de decisión y jurado.

### 6.1. Funcionalidades

- **Presentación integrada**:
  - Diapositivas que resumen problema, solución, uso de GEO Perú, arquitectura técnica, impacto esperado y hoja de ruta.

### 6.2. Uso paso a paso

1. Abrir **“Pitch”** en el menú.
2. Navegar con los controles **“Anterior”** y **“Siguiente”**.
3. Utilizar las diapositivas para:
   - Presentar el contexto territorial.
   - Explicar brevemente el funcionamiento de los módulos.
   - Mostrar el alineamiento con la Política Nacional de Transformación Digital y el uso de GEO Perú.

---

## 7. Recomendaciones para la demostración ante el jurado

- Iniciar en el **Dashboard**, para mostrar integración de datos e IA.  
- Pasar a **Edafología → Telemetría y Mapa 3D**, para ilustrar seguridad alimentaria y suelos.  
- Mostrar **Riesgos → Mando de riesgos**, activando una simulación de cierre de vías y ruta alternativa.  
- Cerrar con **Catastro** y una breve pasada por **Pitch**, enfocando en el valor público y la reutilización de datos de GEO Perú.
