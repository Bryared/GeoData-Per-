# 🌌 Catálogo Maestro de Datasets Oficiales de GEO Perú (PCM)
### *Infraestructura de Datos Espaciales (IDEP) para el Ecosistema GeoTERRA*

Este documento consolida y sistematiza el **universo completo de fuentes de datos de la administración pública** integradas en el geoportal **GEO Perú** (Secretaría de Gobierno y Transformación Digital de la PCM) y su catálogo en **GeoIDEP**. Detalla la utilidad técnica de cada capa, su origen y su rol en la toma de decisiones relacionales de GeoTERRA.

---

## 🧭 ¿Qué es GEO Perú y cómo consume datos GeoTERRA?
GEO Perú actúa como un **agregador e integrador federado** de la **Infraestructura de Datos Espaciales del Perú (IDEP)**. No crea información; en su lugar, centraliza más de **1,000 capas de información interoperables** provenientes de más de **317 entidades públicas**.

GeoTERRA consume estas capas mediante estándares del **OGC (Open Geospatial Consortium)**:
*   **WMS (Web Map Service):** Renders de mapas ráster (imágenes planas). Ideales para fondos visuales ligeros en el mapa de React.
*   **WFS (Web Feature Service):** Geometrías vectoriales puras (**Puntos, Líneas y Polígonos**) con sus tablas de atributos correspondientes. Este es el estándar que GeoTERRA descarga, procesa y almacena en **PostGIS** para ejecutar cruces espaciales y cálculos matemáticos.

---

## 📦 Matriz de Fuentes de Datos por Categoría Temática

### 1. Clima y Medio Ambiente
Permite monitorear la salud ecológica del territorio y anticipar anomalías climáticas críticas.

| Entidad Emisora | Capas y Datasets Clave Disponibles | Estándar Común | Rol y Aplicabilidad en GeoTERRA |
| :--- | :--- | :--- | :--- |
| **SENAMHI** | • Precipitación anual acumulada.<br>• Temperatura mínima y máxima anual.<br>• Proyecciones climáticas al 2030 (Escenarios de Cambio Climático).<br>• Ubicación de estaciones meteorológicas e hidrométricas automáticas. | WMS / WFS | Cruza el historial de lluvias con la salinidad del suelo para predecir tasas de lavado natural. |
| **SERNANP** | • Límites oficiales de Áreas Naturales Protegidas (ANP) nacionales.<br>• Zonas de Amortiguamiento (Buffer). | WFS (Polígono) | Bloquea el trazo de nuevas parcelas agrícolas en zonas protegidas (Filtro Ecológico). |
| **MINAM / SERFOR** | • Capa de cobertura vegetal y uso de suelo.<br>• Mapas de deforestación y pérdida de bosques.<br>• Zonificación forestal oficial. | WMS / WFS | Identifica el tipo de bioma circundante y asegura el cumplimiento ambiental contra la deforestación. |

---

### 2. Recursos Hídricos
El elemento vital para la programación de riego y la dosificación edafológica.

| Entidad Emisora | Capas y Datasets Clave Disponibles | Estándar Común | Rol y Aplicabilidad en GeoTERRA |
| :--- | :--- | :--- | :--- |
| **ANA (Autoridad Nacional del Agua)** | • Delimitación de Cuencas y Subcuencas hidrográficas.<br>• Red hidrográfica nacional (Ríos, lagunas y quebradas).<br>• Pozos de agua subterránea monitoreados.<br>• Fajas marginales de cauces de ríos. | WFS (Línea / Polígono) | Determina la disponibilidad hídrica por cuenca para regular la recomendación de riego del Richards PINN. |

---

### 3. Gestión del Riesgo de Desastres (GRD)
El escudo ciberfísico para evitar el colapso logístico y proteger predios.

| Entidad Emisora | Capas y Datasets Clave Disponibles | Estándar Común | Rol y Aplicabilidad en GeoTERRA |
| :--- | :--- | :--- | :--- |
| **CENEPRED** *(vía SIGRID)* | • Susceptibilidad a movimientos en masa (Huaicos, aludes).<br>• Susceptibilidad a inundaciones fluviales y pluviales.<br>• Mapas de peligro por bajas temperaturas (Heladas y friajes).<br>• Escenarios de riesgos ante el Fenómeno de El Niño. | WFS (Polígono) | **Gatillador de Triggers:** Delimita las zonas críticas donde el trigger espacial PostGIS evalúa colisiones con carreteras. |
| **IGP (Instituto Geofísico del Perú)** | • Red de monitoreo sísmico nacional.<br>• Epicentros de eventos sísmicos históricos.<br>• Mapa de aceleración sísmica del suelo. | WFS (Punto) / API | Proporciona datos sísmicos en tiempo real para disparar alertas preventivas en la cadena de transporte. |
| **INDECI** | • Historial de emergencias registradas (SINPAD).<br>• Ubicación de almacenes de ayuda y albergues temporales.<br>• Rutas de evacuación recomendadas. | WFS | Permite mapear puntos de refugio logístico seguros durante un bloqueo prolongado de carreteras. |

---

### 4. Demografía, Población y Límites Políticos
Establece el tejido social y los límites administrativos de acción.

| Entidad Emisora | Capas y Datasets Clave Disponibles | Estándar Común | Rol y Aplicabilidad en GeoTERRA |
| :--- | :--- | :--- | :--- |
| **IGN (Instituto Geográfico Nacional)** | • Límites político-administrativos departamentales, provinciales y distritales (oficiales). | WFS (Polígono) | Segmenta la analítica y reportes a nivel distrital/provincial para la toma de decisiones municipales. |
| **INEI** | • Ubicación de centros poblados (puntos).<br>• Población censada y proyectada a nivel provincial y distrital.<br>• Indicadores de pobreza monetaria (extrema y no extrema).<br>• Acceso a servicios básicos (agua, saneamiento, electricidad).<br>• Tasas de anemia y desnutrición crónica infantil por distrito. | WFS (Punto / Polígono) | Mapea la vulnerabilidad social. Permite dar prioridad de bypass logístico a las rutas que abastecen zonas de alta anemia. |

---

### 5. Infraestructura, Transporte y Energía
El esqueleto conectivo y físico del país.

| Entidad Emisora | Capas y Datasets Clave Disponibles | Estándar Común | Rol y Aplicabilidad en GeoTERRA |
| :--- | :--- | :--- | :--- |
| **MTC** | • Red Vial Nacional, Departamental y Vecinal (Carreteras).<br>• Puentes, túneles, peajes e hitos kilométricos.<br>• Corredores logísticos prioritarios de carga nacional. | WFS (Línea) | **Grafo de Ruteo:** Define los aristas y nodos que el Dijkstra multihilo en Golang navega para el bypass. |
| **OSINERGMIN / COES** | • Ubicación de subestaciones eléctricas de alta tensión.<br>• Centrales térmicas, hidroeléctricas, solares y eólicas.<br>• Red de líneas de transmisión eléctrica a nivel nacional. | WFS (Punto / Línea) | Monitorea la continuidad de energía eléctrica de la cual dependen los sensores e infraestructura de bombeo del agro. |

---

### 6. Educación y Salud
Infraestructura de soporte a la población y capital humano.

| Entidad Emisora | Capas y Datasets Clave Disponibles | Estándar Común | Rol y Aplicabilidad en GeoTERRA |
| :--- | :--- | :--- | :--- |
| **MINEDU** *(ESCALE)* | • Georreferenciación de locales escolares de nivel inicial, primaria, secundaria y superior.<br>• Locales de servicios educativos no escolarizados (PRONOEI). | WFS (Punto) | Mapea centros educativos como zonas de refugio comunitario prioritario en emergencias climáticas. |
| **MINSA** | • Ubicación e inventario de establecimientos de salud (Hospitales, postas, centros de salud categorizados I, II, III). | WFS (Punto) | Define puntos críticos de auxilio y derivación médica rápida en caso de accidentes de la flota logística en ruta. |

---

### 7. Economía, Inversiones y Actividades Productivas
La dimensión financiera y de ordenamiento de los recursos del país.

| Entidad Emisora | Capas y Datasets Clave Disponibles | Estándar Común | Rol y Aplicabilidad en GeoTERRA |
| :--- | :--- | :--- | :--- |
| **INGEMMET / MINEM** | • Concesiones mineras vigentes e históricas.<br>• Lotes petroleros y concesiones de hidrocarburos. | WFS (Polígono) | Evita el conflicto territorial alertando si un predio agrícola de MIDAGRI se traslapa con una concesión minera. |
| **DEVIDA** | • Densidad y monitoreo de cultivos de hoja de coca a nivel de cuencas cocaleras. | WFS / Ráster | Proporciona datos de control territorial y reconversión de cultivos hacia cultivos lícitos de alto valor. |
| **MINCETUR** | • Inventario nacional de recursos turísticos (atractivos arqueológicos, ecológicos y culturales categorizados). | WFS (Punto) | Planifica rutas logísticas que respeten e impidan la alteración visual o física de zonas turísticas de alto valor. |
| **MEF (Ministerio de Economía y Finanzas)** | • Proyectos de Inversión Pública (PIP) distritales y provinciales.<br>• Presupuesto Institucional Modificado (PIM).<br>• Niveles de avance financiero y ejecución por fuente de financiamiento. | API / WFS | Ayuda a justificar el retorno de inversión (ROI) cruzando las pérdidas logísticas con los presupuestos locales. |

---

### 8. Aspectos Sociales y Culturales
La base de derechos colectivos y comunidades campesinas y nativas.

| Entidad Emisora | Capas y Datasets Clave Disponibles | Estándar Común | Rol y Aplicabilidad en GeoTERRA |
| :--- | :--- | :--- | :--- |
| **MINCUL** *(Ministerio de Cultura)* | • Catastro arqueológico de zonas intangibles y monumentos.<br>• Delimitación territorial de Comunidades Campesinas y Nativas.<br>• Reservas territoriales e indígenas para Pueblos en Aislamiento y Contacto Inicial (PIACI). | WFS (Polígono) | Respeto a los derechos colectivos indígenas; evita el traslape de la producción agrícola en territorios ancestrales. |

---

## 🛡️ Síntesis del Valor para el Jurado
En el pitch de defensa, puedes resumir el uso de esta data de la siguiente manera:

> *"GeoTERRA no trabaja sobre un vacío de datos simulados. Se conecta de forma interoperable a la IDE de **GEO Perú** para adquirir en caliente las geometrías de predios rurales de **MIDAGRI**, el grafo vial nacional de **MTC** y las quebradas activas de **CENEPRED**. Al combinarlas en **PostGIS**, creamos un trigger reactivo que intercepta y desvía la cadena alimentaria peruana por rutas seguras andinas antes de que ocurra una catástrofe en la costa."*
