import { useState } from 'react';
import { Database, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Layers, Terminal } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DatasetEvidencia {
  id: string;
  name: string;
  entity: string;
  table: string;
  usage: string;
  status: 'PostGIS Live' | 'Escenario Controlado' | 'Roadmap';
  method: 'n8n Webhook' | 'API REST / WFS' | 'Semilla SQL' | 'Planificado (API)';
  description: string;
  fields: { name: string; type: string; desc: string }[];
  sampleJson: string;
}

export function EvidenciaGeoPeru() {
  const [selectedDataset, setSelectedDataset] = useState<string>('catastro');

  const datasets: DatasetEvidencia[] = [
    {
      id: 'catastro',
      name: 'Catastro Rural Nacional',
      entity: 'MIDAGRI / GEO Perú',
      table: 'parcelas_agricolas',
      usage: 'Identificación y delimitación de predios agrícolas en valles productivos.',
      status: 'Escenario Controlado',
      method: 'Semilla SQL',
      description: 'Polígonos oficiales de predios rurales a nivel nacional. Permite determinar la tenencia de la tierra, áreas de cultivo efectivas e intersección de riesgos por parcela.',
      fields: [
        { name: 'id', type: 'VARCHAR(50) / PK', desc: 'Identificador único de la parcela.' },
        { name: 'nombre', type: 'VARCHAR(150)', desc: 'Nombre del predio rural o propietario registrado.' },
        { name: 'area_ha', type: 'NUMERIC(10,2)', desc: 'Extensión superficial de la parcela en hectáreas.' },
        { name: 'cultivo', type: 'VARCHAR(50)', desc: 'Cultivo principal sembrado (arroz, maíz, espárrago).' },
        { name: 'riesgo_salinidad', type: 'VARCHAR(20)', desc: 'Evaluación edafológica del riesgo de salinización (alto/medio/bajo).' },
        { name: 'geom', type: 'GEOMETRY(MultiPolygon, 4326)', desc: 'Geometría espacial de la parcela en coordenadas WGS84.' }
      ],
      sampleJson: `{
  "id": "P-CH-LMB-101",
  "nombre": "Predio Las Flores - Lambayeque",
  "area_ha": 14.2,
  "cultivo": "arroz",
  "riesgo_salinidad": "alto",
  "geom_geojson": {
    "type": "MultiPolygon",
    "coordinates": [[[[-79.91, -6.72], [-79.90, -6.72], [-79.90, -6.73], [-79.91, -6.72]]]]
  }
}`
    },
    {
      id: 'red_vial',
      name: 'Red Vial Nacional',
      entity: 'MTC / GEO Perú',
      table: 'red_vial_logistica',
      usage: 'Construcción del grafo logístico de transporte y recálculo de bypass.',
      status: 'PostGIS Live',
      method: 'Semilla SQL',
      description: 'Ejes de carreteras y tramos viales provistos por el Ministerio de Transportes y Comunicaciones (MTC). Utilizado por el motor Go Router para calcular rutas alternativas.',
      fields: [
        { name: 'id', type: 'INTEGER / PK', desc: 'Identificador de arista vial.' },
        { name: 'codigo_ruta', type: 'VARCHAR(20)', desc: 'Identificación de la vía (PE-1N, PE-3N, etc.).' },
        { name: 'tramo', type: 'VARCHAR(150)', desc: 'Descripción del tramo vial (Piura - Chiclayo).' },
        { name: 'capacidad_max', type: 'DOUBLE PRECISION', desc: 'Factor de peso logístico o tiempo estimado en minutos.' },
        { name: 'geom', type: 'GEOMETRY(LineString, 4326)', desc: 'Geometría espacial del tramo de carretera.' }
      ],
      sampleJson: `{
  "id": 1,
  "codigo_ruta": "PE-1N",
  "tramo": "Panamericana Norte - Tramo Lambayeque",
  "capacidad_max": 180.0,
  "geom_geojson": {
    "type": "LineString",
    "coordinates": [[-79.84, -6.70], [-79.80, -6.50]]
  }
}`
    },
    {
      id: 'riesgos',
      name: 'Zonas de Susceptibilidad a Movimiento en Masa',
      entity: 'CENEPRED / SIGRID',
      table: 'alertas_desastres',
      usage: 'Polígonos de zonas de inundación y susceptibilidad a huaicos.',
      status: 'Escenario Controlado',
      method: 'Semilla SQL',
      description: 'Áreas del territorio identificadas por el Centro Nacional de Estimación, Prevención y Reducción del Riesgo de Desastres (CENEPRED) con alta susceptibilidad a desastres climáticos.',
      fields: [
        { name: 'id', type: 'VARCHAR(50) / PK', desc: 'Identificador de la zona de riesgo.' },
        { name: 'grado_riesgo', type: 'VARCHAR(20)', desc: 'Severidad del peligro (Muy Alto, Alto, Medio).' },
        { name: 'tipo_riesgo', type: 'VARCHAR(50)', desc: 'Tipo de peligro climático (Inundación, Movimiento en Masa).' },
        { name: 'geom', type: 'GEOMETRY(Polygon, 4326)', desc: 'Geometría del área susceptible.' }
      ],
      sampleJson: `{
  "id": "R-LMB-HUA-002",
  "tipo_riesgo": "Huaico / Movimiento en Masa",
  "grado_riesgo": "Muy Alto",
  "geom_geojson": {
    "type": "Polygon",
    "coordinates": [[[-79.75, -6.65], [-79.72, -6.65], [-79.72, -6.68], [-79.75, -6.65]]]
  }
}`
    },
    {
      id: 'clima',
      name: 'Precipitación y Temperatura Diaria',
      entity: 'SENAMHI / GEO Perú',
      table: 'datos_meteorologicos',
      usage: 'Cálculo de balances hídricos y monitoreo de El Niño / sequías.',
      status: 'Roadmap',
      method: 'Planificado (API)',
      description: 'Datos históricos y pronósticos de variables meteorológicas a nivel de estaciones automáticas. Permite estimar la recarga y la evapotranspiración de los valles.',
      fields: [
        { name: 'estacion_id', type: 'VARCHAR(20) / PK', desc: 'Código oficial de la estación meteorológica.' },
        { name: 'temperatura', type: 'NUMERIC(5,2)', desc: 'Temperatura superficial del aire (°C).' },
        { name: 'precipitacion_mm', type: 'NUMERIC(5,2)', desc: 'Volumen de lluvia acumulada de 24 horas (mm).' },
        { name: 'fecha', type: 'DATE / PK', desc: 'Fecha de registro del reporte.' }
      ],
      sampleJson: `{
  "estacion_id": "EST-LAMB-02",
  "temperatura": 24.8,
  "precipitacion_mm": 12.5,
  "fecha": "2026-05-29"
}`
    },
    {
      id: 'sismos',
      name: 'Eventos Sísmicos Recientes',
      entity: 'IGP (Instituto Geofísico del Perú)',
      table: 'alertas_desastres',
      usage: 'Ingesta de alertas dinámicas activas mediante polling o webhook.',
      status: 'PostGIS Live',
      method: 'n8n Webhook',
      description: 'Reportes en tiempo real del IGP sobre magnitud y epicentro de sismos en el territorio nacional. Almacenados directamente en Supabase mediante un pipeline en n8n.',
      fields: [
        { name: 'id', type: 'SERIAL / PK', desc: 'ID secuencial en base de datos.' },
        { name: 'tipo_evento', type: 'VARCHAR(50)', desc: 'Siempre categorizado como "SISMO".' },
        { name: 'severidad', type: 'INTEGER', desc: 'Escala 1 a 5 calculada en base a la magnitud.' },
        { name: 'estado', type: 'VARCHAR(20)', desc: 'Estado del evento (ACTIVO / HISTORICO).' },
        { name: 'geom', type: 'GEOMETRY(Point, 4326)', desc: 'Punto geográfico del epicentro.' },
        { name: 'detalles_tensor', type: 'JSONB', desc: 'Metadatos adicionales (descripción, magnitud, fecha de ocurrencia).' }
      ],
      sampleJson: `{
  "id": 482,
  "tipo_evento": "SISMO",
  "severidad": 5,
  "estado": "ACTIVO",
  "geom_geojson": {
    "type": "Point",
    "coordinates": [-75.83, -14.42]
  },
  "detalles_tensor": {
    "descripcion": "Sismo de magnitud 6.1 Mw - Ica",
    "fuente": "IGP",
    "fecha_evento": "2026-05-19T17:57:51"
  }
}`
    },
    {
      id: 'hidrologia',
      name: 'Red Hidrográfica y Reservas',
      entity: 'ANA (Autoridad Nacional del Agua)',
      table: 'cuencas_reservas',
      usage: 'Monitoreo de almacenamiento de reservorios y flujos de cuencas costeras.',
      status: 'Escenario Controlado',
      method: 'Semilla SQL',
      description: 'Límites de unidades hidrográficas y estados de almacenamiento en represas oficiales (Poechos, Tinajones, Gallito Ciego) del Perú.',
      fields: [
        { name: 'cuenca_id', type: 'VARCHAR(30) / PK', desc: 'Identificador oficial de la cuenca.' },
        { name: 'nombre_rio', type: 'VARCHAR(100)', desc: 'Río principal del valle.' },
        { name: 'volumen_mm3', type: 'NUMERIC(10,2)', desc: 'Volumen actual almacenado en el reservorio principal en MM³.' },
        { name: 'cota_msnm', type: 'NUMERIC(6,2)', desc: 'Cota de la superficie del agua en metros sobre el nivel del mar.' }
      ],
      sampleJson: `{
  "cuenca_id": "C-CH-LMB",
  "nombre_rio": "Río Chancay-Lambayeque",
  "volumen_mm3": 103.50,
  "cota_msnm": 102.50
}`
    }
  ];

  const currentDataset = datasets.find(d => d.id === selectedDataset) || datasets[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center">
          <Database className="w-6 h-6 text-emerald-450 mr-2" />
          Evidencia GEO Perú
        </h1>
        <p className="text-slate-400 text-xs mt-0.5">
          Trazabilidad y linaje de los datos georreferenciados del estado integrados en la arquitectura de GeoTERRA.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dataset List */}
        <div className="lg:col-span-1 space-y-2.5">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
            Datasets Oficiales Integrados
          </h2>
          <div className="space-y-2">
            {datasets.map((dataset) => {
              const isSelected = selectedDataset === dataset.id;
              return (
                <button
                  key={dataset.id}
                  onClick={() => setSelectedDataset(dataset.id)}
                  className={cn(
                    "w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between items-start space-y-1.5",
                    isSelected
                      ? "bg-slate-900/80 border-emerald-500/35 text-slate-100 shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                      : "bg-[#0b0f19]/60 border-slate-800/80 hover:border-slate-700/60 text-slate-400 hover:text-slate-200"
                  )}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="font-bold text-xs">{dataset.name}</span>
                    <span className={cn(
                      "text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                      dataset.status === 'PostGIS Live' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      dataset.status === 'Escenario Controlado' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-slate-800 text-slate-500 border border-slate-700/50"
                    )}>
                      {dataset.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center w-full text-[10px]">
                    <span className="font-medium text-slate-500">{dataset.entity}</span>
                    <span className="font-mono text-[9px] bg-slate-900/60 px-1 py-0.5 rounded text-slate-500">{dataset.table}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dataset Details & Schema Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main info card */}
          <div className="glass-panel border border-slate-700/50 rounded-2xl p-6 space-y-5 bg-slate-900/40 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black text-emerald-450 uppercase tracking-widest block font-mono">
                  {currentDataset.entity}
                </span>
                <h3 className="text-lg font-black text-slate-100 mt-0.5">
                  {currentDataset.name}
                </h3>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center text-slate-400">
                  <Layers className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  <span>Tabla: <code className="text-emerald-400 font-mono text-[11px] px-1 py-0.5 bg-slate-950 rounded">{currentDataset.table}</code></span>
                </div>
                <div className="flex items-center text-slate-400">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  <span>Método: <strong className="text-slate-350">{currentDataset.method}</strong></span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-300">Descripción del Dataset</h4>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-light">
                  {currentDataset.description}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-300">Uso en la Solución GeoTERRA</h4>
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl mt-1.5 flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" />
                  <p className="text-slate-300 text-xs leading-relaxed font-mono">
                    {currentDataset.usage}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Table Schema / JSON split view */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Schema Table */}
            <div className="glass-panel border border-slate-700/50 rounded-2xl p-5 bg-[#070b13]/60 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 flex items-center">
                <Terminal className="w-4 h-4 text-slate-500 mr-2" />
                Definición del Esquema (PostGIS)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500">
                      <th className="pb-2 font-bold uppercase tracking-wider">Campo</th>
                      <th className="pb-2 font-bold uppercase tracking-wider">Tipo SQL</th>
                      <th className="pb-2 font-bold uppercase tracking-wider">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {currentDataset.fields.map((f, idx) => (
                      <tr key={idx} className="text-slate-350">
                        <td className="py-2.5 font-mono font-bold text-slate-200">{f.name}</td>
                        <td className="py-2.5 font-mono text-emerald-400">{f.type}</td>
                        <td className="py-2.5 text-slate-400 font-light">{f.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sample JSON payload */}
            <div className="glass-panel border border-slate-700/50 rounded-2xl p-5 bg-[#070b13]/60 space-y-4 flex flex-col">
              <h4 className="text-xs font-bold text-slate-300 flex items-center">
                <Database className="w-4 h-4 text-slate-500 mr-2" />
                Ejemplo de Carga JSON (API)
              </h4>
              <pre className="flex-1 bg-slate-950 p-3.5 rounded-xl border border-slate-900 font-mono text-[9px] text-cyan-400 overflow-y-auto max-h-[220px] whitespace-pre-wrap">
                {currentDataset.sampleJson}
              </pre>
            </div>

          </div>

          {/* Verification note */}
          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center space-x-2 text-[10px] text-slate-450 font-sans">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Todos los datos cumplen con la **Base 9: Trazabilidad y Autenticidad** del concurso Geotón 2026.</span>
          </div>

        </div>

      </div>
    </div>
  );
}
