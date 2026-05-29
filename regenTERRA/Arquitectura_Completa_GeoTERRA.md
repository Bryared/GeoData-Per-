# 🗺️ Mapa de Arquitectura y Documentación Técnica de GeoTERRA Perú
### *Guía de Navegación de Ingeniería para la Geotón Perú 2026*

¡Bienvenido al centro de documentación técnica y de infraestructura de **GeoTERRA Perú**! 

Para ofrecer la máxima claridad metodológica tanto a nuestro equipo de desarrollo como al **Comité Evaluador de la Geotón 2026** y a inversores de tecnología profunda (Deep Tech), hemos estructurado y dividido la visión de nuestra plataforma en **cuatro pilares fundamentales de ingeniería e interacción**:

---

## 🏗️ 1. [Arquitectura Actual e Integración Inmediata (MVP)](file:///c:/Users/bryan/GeoData%20Perú/regenTERRA/Arquitectura_Actual_GeoTERRA.md)
*   **Propósito:** Este documento plasma el funcionamiento real del repositorio ciberfísico actual.
*   **Contenidos Clave:**
    *   El **árbol físico políglota del repositorio** (React modular, FastAPI server, schema SQL, y los motores de Go y Rust).
    *   El **esquema SQL maestro de producción `agrodefense_prod`** optimizado con series temporales dinámicas e históricas (`telemetria_iot`).
    *   El **trigger reactivo PL/pgSQL** que calcula en microsegundos el colapso vial por desastres y **libera las vías de forma dinámica** al mitigarse, optimizado mediante el operador de caja delimitadora (`&&`) sobre índices espaciales GIST.
    *   Los **pipelines de integración de datos** (puentes de interoperabilidad) frontend-backend-base de datos.
    *   La **matriz de validación y ciencia de datos** (calibración de weights de Richards, XGBoost y ROI de valor público).
    *   La **delegación estratégica de roles** entre los perfiles de Ciencia de Datos y el de Ingeniería de Software (MLOps).
*   *Explora el manual aquí:* **[Arquitectura_Actual_GeoTERRA.md](file:///c:/Users/bryan/GeoData%20Perú/regenTERRA/Arquitectura_Actual_GeoTERRA.md)**

---

## 🚀 2. [Arquitectura de Escalabilidad e Infraestructura Continental](file:///c:/Users/bryan/GeoData%20Perú/regenTERRA/Arquitectura_Escalabilidad_GeoTERRA.md)
*   **Propósito:** Este documento detalla la hoja de ruta y visión de crecimiento masivo a largo plazo a escala nacional y continental.
*   **Contenidos Clave:**
    *   El mapa de la **Arquitectura Corporativa Multicapa** distribuida para procesar petabytes de datos territoriales.
    *   La especificación técnica de componentes de alta escala: **CesiumJS** (visualización LiDAR 3D), **WebGPU** (cómputo en paralelo), **EMQX** (broker MQTT distribuido), **Apache Kafka** (streaming de eventos), **CockroachDB** (SQL distribuido) y **ClickHouse** (OLAP analítico masivo).
    *   La **hoja de ruta de escalabilidad de 3 Horizontes** (Fase I: MVP Integrado, Fase II: Optimización Wasm/WebGPU/Kafka, Fase III: Escala Continental Kubernetes).
    *   La **guía de funcionalidad escalable** con los grandes casos de uso estatales (Planificación Macro-Hídrica de la ANA, Resiliencia Logística del MTC/INDECI y Auditoría de Bonos de Carbono del MINAM/SERFOR).
*   *Explora el manual aquí:* **[Arquitectura_Escalabilidad_GeoTERRA.md](file:///c:/Users/bryan/GeoData%20Perú/regenTERRA/Arquitectura_Escalabilidad_GeoTERRA.md)**

---

## 🌊 3. [Manual de Flujo de Datos y Diagnóstico de Madurez Tecnológica (TRL)](file:///c:/Users/bryan/GeoData%20Perú/regenTERRA/Flujo_Datos_GeoTERRA.md)
*   **Propósito:** Este documento detalla el viaje institucional de los datos y el nivel de madurez técnica del repositorio actual.
*   **Contenidos Clave:**
    *   El **ciclo completo de flujo de datos** desglosado en 5 etapas secuenciales (Adquisición, Transmisión, Almacenamiento, Procesamiento y Visualización).
    *   El **cuadro de diagnóstico y Madurez Tecnológica (TRL - Technology Readiness Level)**, que detalla con total transparencia qué componentes del sistema son 100% reales en el código del repositorio actual, frente a los sistemas de simulación y calibración local desarrollados para la demostración del MVP.
*   *Explora el manual aquí:* **[Flujo_Datos_GeoTERRA.md](file:///c:/Users/bryan/GeoData%20Perú/regenTERRA/Flujo_Datos_GeoTERRA.md)**

---

## 📖 4. [Manual de Operación y Guía de Usuario Completa](file:///c:/Users/bryan/GeoData%20Perú/regenTERRA/Manual_Usuario_GeoTERRA.md)
*   **Propósito:** Este documento detalla de forma sumamente realista el funcionamiento de la app de inicio a fin.
*   **Contenidos Clave:**
    *   La **estructura lógica y modular** de la interfaz por dimensiones territoriales.
    *   El análisis de **dolores y problemáticas territoriales reales** que resuelve cada apartado (salinización de suelos, huaicos, incendios, catastro e informalidad legal).
    *   Las **guías de uso paso a paso en vivo** para operar de forma práctica cada módulo (Dashboard, Telemetría, Mapa 3D Kriging, Recetas VRA/XGBoost, Mando de Riesgos/Bypass pgRouting, SAT-Agro Pro, Pitch Geotón).
*   *Explora el manual aquí:* **[Manual_Usuario_GeoTERRA.md](file:///c:/Users/bryan/GeoData%20Perú/regenTERRA/Manual_Usuario_GeoTERRA.md)**

---

### 📂 Estructura Física de la Documentación en el Repositorio

```text
c:/Users/bryan/GeoData Perú/regenTERRA/
├── Arquitectura_Completa_GeoTERRA.md       <─── 🗺️ (Este Enrutador Maestro)
├── Arquitectura_Actual_GeoTERRA.md         <─── 🏗️ Capa del MVP e Integración Inmediata
├── Arquitectura_Escalabilidad_GeoTERRA.md   <─── 🚀 Capa de Escalabilidad y Arquitectura Multicapa
├── Flujo_Datos_GeoTERRA.md                 <─── 🌊 Flujo de Datos y Diagnóstico de Madurez (TRL)
└── Manual_Usuario_GeoTERRA.md               <─── 📖 Guía Operacional y Funciones de la App
```
