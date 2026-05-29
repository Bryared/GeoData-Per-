import { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, Cpu, Gauge, BarChart2, Dna, Settings 
} from 'lucide-react';

// Mock sequence of PINN model residual training (epochs)
const pinnTrainingData = [
  { epoch: 10, richardsLoss: 0.04523, soluteLoss: 0.06821, dataLoss: 0.05214 },
  { epoch: 50, richardsLoss: 0.01241, soluteLoss: 0.02452, dataLoss: 0.01954 },
  { epoch: 100, richardsLoss: 0.00512, soluteLoss: 0.00845, dataLoss: 0.00762 },
  { epoch: 200, richardsLoss: 0.00124, soluteLoss: 0.00312, dataLoss: 0.00245 },
  { epoch: 300, richardsLoss: 0.00034, soluteLoss: 0.00108, dataLoss: 0.00084 },
  { epoch: 400, richardsLoss: 0.00008, soluteLoss: 0.00034, dataLoss: 0.00021 },
  { epoch: 500, richardsLoss: 0.000018, soluteLoss: 0.000085, dataLoss: 0.000054 },
  { epoch: 600, richardsLoss: 0.00000142, soluteLoss: 0.00000089, dataLoss: 0.00000045 }
];

export function DataHub() {

  
  // Interactive Semivariogram calibration parameters
  const [nugget, setNugget] = useState<number>(0.15);
  const [sill, setSill] = useState<number>(1.85);
  const [range, setRange] = useState<number>(120);

  // Model selection states
  const [activeModelTab, setActiveModelTab] = useState<'pinn' | 'kriging' | 'roi'>('pinn');
  const [soilBulkDensity, setSoilBulkDensity] = useState<number>(1.35); // g/cm³
  const [ecActual, setEcActual] = useState<number>(5.6); // dS/m
  const [cropUmbral, setCropUmbral] = useState<number>(1.7); // dS/m (e.g. Arroz)

  // Generate semivariogram plot points dynamically
  const semivariogramPoints = useMemo(() => {
    const points = [];
    // Generate distances from 0 to 250 meters
    for (let h = 0; h <= 250; h += 10) {
      // Exponential Model Formula: Nugget + (Sill - Nugget) * (1 - exp(-3 * h / Range))
      const semivariance = h === 0 
        ? 0 
        : nugget + (sill - nugget) * (1 - Math.exp((-3 * h) / range));
      
      points.push({
        distance: h,
        semivariance: parseFloat(semivariance.toFixed(3)),
        sillLine: sill
      });
    }
    return points;
  }, [nugget, sill, range]);



  // Mathematical outputs based on user sliders
  const leachingRequirement = useMemo(() => {
    // LR = EC_w / (5 * EC_e - EC_w)
    const EC_w = 1.2; // dS/m (standard water quality)
    const denominator = (5 * cropUmbral) - EC_w;
    if (denominator <= 0) return 0.05;
    const lr = EC_w / denominator;
    return Math.min(Math.max(lr, 0.0), 0.35); // capped at 35%
  }, [cropUmbral]);

  const gypsumRequirement = useMemo(() => {
    // GR = (EC_actual - 3.0) * 0.45 * rho_b * (depth/10)
    // assuming root zone depth of 40 cm
    if (ecActual <= 3.0) return 0;
    const gr = (ecActual - 3.0) * 0.45 * soilBulkDensity * 4;
    return Math.min(Math.max(gr, 0.0), 8.5); // ton/ha
  }, [ecActual, soilBulkDensity]);



  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            Centro de Mando Analítico & Validación de Modelos
          </h1>
          <p className="text-slate-400 text-xs">
            Rigor matemático y geoestadístico del Gemelo Digital GeoTERRA en tiempo real
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-700/40 rounded-xl px-4 py-2 text-xs">
          <span className="w-2 h-2 bg-emerald-450 rounded-full animate-ping"></span>
          <span className="text-slate-300 font-medium">Validación Activa: R² = 0.941</span>
        </div>
      </div>

      {/* Model Selection Tabs */}
      <div className="flex space-x-1 p-1 bg-slate-900/80 border border-slate-800/80 rounded-xl max-w-lg">
        <button
          onClick={() => setActiveModelTab('pinn')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
            activeModelTab === 'pinn'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Dna className="w-3.5 h-3.5" />
          <span>Física PINN (Richards)</span>
        </button>
        <button
          onClick={() => setActiveModelTab('kriging')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
            activeModelTab === 'kriging'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Geoestadística (Kriging)</span>
        </button>
        <button
          onClick={() => setActiveModelTab('roi')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
            activeModelTab === 'roi'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Simulador & Prescripciones</span>
        </button>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Interactive Sidebar / Physics Calibration */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Scientific Calibration Parameters */}
          <div className="glass-panel border border-slate-850 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-700/5 rounded-full blur-xl pointer-events-none" />
            <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center space-x-2">
              <Settings className="w-4 h-4 text-slate-400 animate-spin-slow" />
              <span>Parámetros de Calibración</span>
            </h2>

            {activeModelTab === 'kriging' && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Nugget (Efecto Pepita - C₀)</span>
                    <span className="font-mono text-emerald-400 font-bold">{nugget.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={nugget}
                    onChange={(e) => setNugget(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 italic">Varianza de error local a distancia cero.</p>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Sill (Meseta - C)</span>
                    <span className="font-mono text-cyan-400 font-bold">{sill.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.05"
                    value={sill}
                    onChange={(e) => setSill(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 italic">Varianza máxima teórica de la muestra.</p>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Range (Alcance - a)</span>
                    <span className="font-mono text-blue-400 font-bold">{range} m</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="200"
                    step="5"
                    value={range}
                    onChange={(e) => setRange(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 italic">Distancia máxima de autocorrelación espacial.</p>
                </div>
              </div>
            )}

            {activeModelTab === 'pinn' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Física de Richards</span>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">dz (Espaciamiento)</span>
                    <span className="font-mono text-slate-200">20.0 cm</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">dt (Discretización)</span>
                    <span className="font-mono text-slate-200">86400 s (1 día)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">K_sat (Conductividad)</span>
                    <span className="font-mono text-slate-200">1.0 x 10⁻⁵ m/s</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-slate-400 block font-bold">Pérdida por Constricciones</span>
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Richards Residual</span>
                      <span className="font-mono text-emerald-400 font-bold">1.42 x 10⁻⁶</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">CDE Solute Residual</span>
                      <span className="font-mono text-emerald-400 font-bold">8.91 x 10⁻⁷</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeModelTab === 'roi' && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Salinidad del Suelo (CE)</span>
                    <span className="font-mono text-yellow-500 font-bold">{ecActual.toFixed(1)} dS/m</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.1"
                    value={ecActual}
                    onChange={(e) => setEcActual(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Densidad Aparente Soil (ρ_b)</span>
                    <span className="font-mono text-slate-200 font-bold">{soilBulkDensity.toFixed(2)} g/cm³</span>
                  </div>
                  <input
                    type="range"
                    min="1.1"
                    max="1.6"
                    step="0.05"
                    value={soilBulkDensity}
                    onChange={(e) => setSoilBulkDensity(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-slate-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Umbral Tolerancia Cultivo</span>
                    <span className="font-mono text-emerald-400 font-bold">{cropUmbral.toFixed(1)} dS/m</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => setCropUmbral(1.7)} 
                      className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all ${
                        cropUmbral === 1.7 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                          : "bg-slate-900 border-slate-800 text-slate-500"
                      }`}
                    >
                      Arroz (1.7)
                    </button>
                    <button 
                      onClick={() => setCropUmbral(4.0)} 
                      className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all ${
                        cropUmbral === 4.0 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                          : "bg-slate-900 border-slate-800 text-slate-500"
                      }`}
                    >
                      Quinua (4.0)
                    </button>
                    <button 
                      onClick={() => setCropUmbral(3.0)} 
                      className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all ${
                        cropUmbral === 3.0 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                          : "bg-slate-900 border-slate-800 text-slate-500"
                      }`}
                    >
                      Espárrago (3.0)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="glass-panel border border-slate-850 p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Métricas Estadísticas del Modelo</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-500 font-bold block">RMSE Kriging</span>
                <span className="text-sm font-black font-mono text-slate-200">0.124 dS/m</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-500 font-bold block">R² Edafológico</span>
                <span className="text-sm font-black font-mono text-slate-200">0.941</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-500 font-bold block">Gradiente dΨ/dz</span>
                <span className="text-sm font-black font-mono text-slate-200">-1.84 m/m</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-500 font-bold block">Anisotropía Ratio</span>
                <span className="text-sm font-black font-mono text-slate-200">1.00 (Isótropo)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right Charts and Analytics */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Chart Card */}
          <div className="glass-panel border border-slate-850 p-5 rounded-2xl flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">
                  {activeModelTab === 'pinn' && "Curva de Convergencia del Residuo PINN (Richards & CDE)"}
                  {activeModelTab === 'kriging' && "Variograma Espacial Exponencial vs. Datos Empíricos"}
                  {activeModelTab === 'roi' && "Requerimiento Hidro-Químico del Suelo vs. Salinidad (FAO)"}
                </h3>
                <p className="text-[10px] text-slate-500">
                  {activeModelTab === 'pinn' && "Minimización de pérdida física de fluidos del suelo por épocas"}
                  {activeModelTab === 'kriging' && "Ajuste teórico de semivarianza lineal por distancia euclidiana"}
                  {activeModelTab === 'roi' && "Cálculo matemático de Fracción de Lavado (LR) y Enmienda (Yeso)"}
                </p>
              </div>
              <Gauge className="w-5 h-5 text-slate-500" />
            </div>

            {/* Recharts Container */}
            <div className="flex-1 w-full min-h-[250px]">
              {activeModelTab === 'pinn' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pinnTrainingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="epoch" label={{ value: 'Épocas', position: 'insideBottomRight', offset: -5 }} stroke="#475569" style={{ fontSize: 10 }} />
                    <YAxis scale="log" domain={[1e-7, 0.1]} stroke="#475569" style={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="richardsLoss" name="Residuo Richards" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="soluteLoss" name="Residuo CDE Solutos" stroke="#06b6d4" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="dataLoss" name="Pérdida de Datos (MAE)" stroke="#64748b" strokeWidth={1.5} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {activeModelTab === 'kriging' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={semivariogramPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="distance" label={{ value: 'Distancia (m)', position: 'insideBottomRight', offset: -5 }} stroke="#475569" style={{ fontSize: 10 }} />
                    <YAxis stroke="#475569" style={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="semivariance" name="Variograma Exponencial" stroke="#10b981" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="sillLine" name="Sill (Varianza Máx)" stroke="#f43f5e" strokeWidth={1} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {activeModelTab === 'roi' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  <div className="flex flex-col justify-center space-y-4 p-4 bg-slate-900/40 rounded-2xl border border-slate-850">
                    <div className="text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Requerimiento de Lavado (LR)</span>
                      <span className="text-3xl font-black text-cyan-400 font-mono">{(leachingRequirement * 100).toFixed(1)}%</span>
                      <p className="text-[10px] text-slate-400 mt-2 px-4">
                        Porcentaje extra de agua sobre el volumen de riego requerido para arrastrar sales del bulbo húmedo.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl text-[10px] font-mono text-slate-500 leading-relaxed text-center">
                      {"LR = EC_w / (5 * EC_e - EC_w)"} <br />
                      {"EC_w = 1.2 | EC_e = "}{cropUmbral.toFixed(1)}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center space-y-4 p-4 bg-slate-900/40 rounded-2xl border border-slate-850">
                    <div className="text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Enmienda Cálcica (Yeso)</span>
                      <span className="text-3xl font-black text-emerald-450 font-mono">{gypsumRequirement.toFixed(2)} ton/ha</span>
                      <p className="text-[10px] text-slate-400 mt-2 px-4">
                        Cantidad de Yeso Agrícola necesaria para sustituir el Sodio intercambiable por Calcio en arcillas.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl text-[10px] font-mono text-slate-500 leading-relaxed text-center">
                      {"GR = (EC - 3.0) * 0.45 * ρ_b * (depth/10)"} <br />
                      {"ρ_b = "}{soilBulkDensity.toFixed(2)}{" | EC = "}{ecActual.toFixed(1)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 🔬 SECCIÓN MAESTRA: PIPELINE DE INGENIERÍA ESTADÍSTICA E IA */}
      <div className="glass-panel border border-slate-850 p-6 rounded-2xl space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <span>Cerebro Estadístico: Flujo del Modelo & Datos Cruzados</span>
            </h3>
            <p className="text-slate-400 text-xs">
              Mapeo de los 4 conjuntos de datos nacionales y el pipeline del Jupyter Notebook integrado en la App.
            </p>
          </div>
          <div className="text-xs bg-slate-900 border border-slate-800 text-slate-400 rounded-lg px-3 py-1.5 font-semibold">
            Arquitectura: SciML (Scientific Machine Learning)
          </div>
        </div>

        {/* 📋 1. MAPPING OF THE 4 SCIENTIFIC DATASETS */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            1. Mapeo de los 4 Conjuntos de Datos Activos
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-850 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">IoT-01</span>
                <span className="text-[9px] text-slate-500 font-mono">Series Temporales</span>
              </div>
              <span className="font-bold text-slate-200 text-xs block">Telemetría Subterránea</span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Lecturas continuas de conductividad ($EC_a$), temperatura y humedad ($VWC$) a 20, 40 y 60 cm.
              </p>
              <div className="text-[9px] font-mono text-slate-500 bg-slate-950 p-1.5 rounded">
                Técnica: Richards PINN (PyTorch)
              </div>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-850 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">SAT-02</span>
                <span className="text-[9px] text-slate-500 font-mono">Georreferenciado</span>
              </div>
              <span className="font-bold text-slate-200 text-xs block">Catastro Base GEO Perú</span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Polígonos catastrales del MIDAGRI, red vial del MTC y ecorregiones base del SERFOR (Shapefiles/WFS).
              </p>
              <div className="text-[9px] font-mono text-slate-500 bg-slate-950 p-1.5 rounded">
                Técnica: Triggers PL/pgSQL GIST
              </div>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-850 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">CLIM-03</span>
                <span className="text-[9px] text-slate-500 font-mono">Series de Tiempo</span>
              </div>
              <span className="font-bold text-slate-200 text-xs block">Historial Meteorológico</span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Historial de precipitaciones diarias extremas del SENAMHI y avisos sísmicos oficiales del IGP.
              </p>
              <div className="text-[9px] font-mono text-slate-500 bg-slate-950 p-1.5 rounded">
                Técnica: LSTM Deep Recurrent
              </div>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-850 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">GEO-04</span>
                <span className="text-[9px] text-slate-500 font-mono">Píxeles Raster</span>
              </div>
              <span className="font-bold text-slate-200 text-xs block">Espectrometría Sentinel-2</span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Firmas espectrales y reflectancias multiespectrales ópticas (bandas SWIR/NIR) del Copérnicus ESA.
              </p>
              <div className="text-[9px] font-mono text-slate-500 bg-slate-950 p-1.5 rounded">
                Técnica: Kriging Ordinario & GEE
              </div>
            </div>

          </div>
        </div>

        {/* 📋 2. CONSOLA DE VALIDACIÓN Y DEPURACIÓN DE INGESTA (CAMINITO DEL DATO) */}
        <DataValidationSandbox />

        {/* 💻 3. INTERACTIVE PIPELINE CODE STEPPER */}
        <InteractiveCodeViewer />

      </div>

    </div>
  );
}

// 🔬 Interactive Code Viewer Helper Component for the Statistical Notebook Steps
function InteractiveCodeViewer() {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      id: 1,
      title: "Ingesta & Descriptiva (EDA)",
      desc: "Lectura del JSON y visualización descriptiva del terreno con Histogramas y diagramas de caja (Boxplots) para detectar outliers espectrales.",
      code: `import pandas as pd
import json
import seaborn as sns
import matplotlib.pyplot as plt

# 1. Ingesta de datos base del valle Chancay-Lambayeque
with open('data/simulated_data.json', 'r') as f:
    raw_data = json.load(f)

# Convertir series temporales de la parcela a DataFrame
df = pd.DataFrame(raw_data['series_temporales']['1'])

# 2. Estadística Descriptiva Básica
print("--- Medias y Cuantiles Generales ---")
print(df[['humedad_20cm', 'conductividad_20cm', 'nivel_freatico_cm']].describe())

# 3. Graficar diagramas de caja (Outlier Detection)
plt.figure(figsize=(10, 4))
sns.boxplot(data=df[['humedad_20cm', 'conductividad_20cm']])
plt.title("Detección de Valores Atípicos en Suelo Insaturado")
plt.show()

# 4. Matriz de Correlación de Pearson
corr = df.corr()
sns.heatmap(corr, annot=True, cmap="coolwarm")
plt.title("Matriz de Correlación Lineal")
plt.show()`
    },
    {
      id: 2,
      title: "Preprocesamiento",
      desc: "Imputación de fallos de sensores, normalización de tensores por escala y segmentación train/test (80/20).",
      code: `import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler

# 1. Tratamiento e imputación de nulos (interpolación lineal por series temporales)
df = df.interpolate(method='linear')

# 2. Selección de features independientes y variables dependientes
X = df[['humedad_20cm', 'humedad_40cm', 'nivel_freatico_cm']].values
y = df['conductividad_20cm'].values # Target: Salinidad

# 3. Escalado MinMax (Escala 0-1 para convergencia rápida del gradiente)
scaler_X = MinMaxScaler()
scaler_y = MinMaxScaler()

X_scaled = scaler_X.fit_transform(X)
y_scaled = scaler_y.fit_transform(y.reshape(-1, 1))

# 4. División Estratégica (80% Entrenamiento, 20% Validación)
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y_scaled, test_size=0.20, random_state=42, shuffle=True
)

print(f"Set de Entrenamiento: {X_train.shape[0]} registros")
print(f"Set de Prueba/Test: {X_test.shape[0]} registros")`
    },
    {
      id: 3,
      title: "Cálculo de Física (PINN)",
      desc: "Resolvedor de la ecuación diferencial parcial de Richards mediante física informada en PyTorch.",
      code: `import torch
import torch.nn as nn

# 1. Definición de la Red Neuronal Informada por la Física (PINN)
class SoilPINN(nn.Module):
    def __init__(self):
        super(SoilPINN, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(2, 64), # Inputs: (z, t)
            nn.Tanh(),
            nn.Linear(64, 64),
            nn.Tanh(),
            nn.Linear(64, 1)  # Output: Humedad volumétrica (Theta)
        )
        
    def forward(self, z, t):
        inputs = torch.cat([z, t], dim=1)
        return self.net(inputs)

# 2. Ecuación Diferencial Parcial (Residual de Richards)
def richards_residual(model, z, t, K_sat=1e-5):
    z.requires_grad = True
    t.requires_grad = True
    
    # Forward Pass
    theta = model(z, t)
    
    # Primeras derivadas con autograd
    dtheta_dt = torch.autograd.grad(theta, t, grad_outputs=torch.ones_like(theta), create_graph=True)[0]
    dtheta_dz = torch.autograd.grad(theta, z, grad_outputs=torch.ones_like(theta), create_graph=True)[0]
    
    # Conductividad insaturada modelada: K = K_sat * theta^3
    K = K_sat * (theta ** 3)
    
    # Flujo de agua de Darcy
    flux = -K * (dtheta_dz + 1.0)
    
    # Segunda derivada espacial (gradiente del flujo)
    dflux_dz = torch.autograd.grad(flux, z, grad_outputs=torch.ones_like(flux), create_graph=True)[0]
    
    # Residuo de la Ecuación de Richards (debe converger a 0)
    residual = dtheta_dt - dflux_dz
    return residual

# Loss = Loss_Datos + Loss_Física (Regulación Matemática)
# optimizer.step() sobre el gradiente descendente`
    },
    {
      id: 4,
      title: "Modelado Predictivo",
      desc: "Calibración del ensamble XGBoost para clasificar aptitudes de suelo y dosificación exacta de enmienda.",
      code: `import xgboost as xgb
from sklearn.metrics import mean_squared_error, r2_score

# 1. Instanciar el regresor XGBoost para prescripciones tabulares
model_xgb = xgb.XGBRegressor(
    n_estimators=150,
    max_depth=5,
    learning_rate=0.08,
    subsample=0.8,
    random_state=42
)

# 2. Entrenamiento del modelo predictivo
model_xgb.fit(X_train, y_train)

# 3. Predicción e Inferencia sobre el conjunto de test
y_pred = model_xgb.predict(X_test)

# 4. Cálculo de Métricas Estadísticas Críticas
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print(f"Error Cuadrático Medio (RMSE): {rmse:.4f} dS/m")
print(f"Coeficiente de Determinación (R²): {r2:.4f}") # Esperado R² = 0.941`
    },
    {
      id: 5,
      title: "Kriging Geoestadístico",
      desc: "Implementación matemática del interpolador Kriging exponencial en Python análogo al motor Rust/WASM.",
      code: `import numpy as np

def exponential_variogram(h, nugget=0.15, sill=1.85, range_a=120.0):
    """
    Modelo de semivariograma teórico exponencial
    """
    if h == 0:
        return 0
    return nugget + (sill - nugget) * (1 - np.exp(-3 * h / range_a))

# Calcular distancias euclidianas y construir matriz Kriging
def solve_kriging_weights(coordinates, target_coord, nugget=0.15, sill=1.85, range_a=120.0):
    n = len(coordinates)
    
    # 1. Construir matriz de covarianza espacial G
    G = np.zeros((n + 1, n + 1))
    for i in range(n):
        for j in range(n):
            dist = np.linalg.norm(coordinates[i] - coordinates[j])
            G[i, j] = exponential_variogram(dist, nugget, sill, range_a)
    
    # Restricción de insesgadez (Lagrange)
    G[n, :n] = 1.0
    G[:n, n] = 1.0
    G[n, n] = 0.0
    
    # 2. Construir vector del punto objetivo d
    d = np.zeros(n + 1)
    for i in range(n):
        dist = np.linalg.norm(coordinates[i] - target_coord)
        d[i] = exponential_variogram(dist, nugget, sill, range_a)
    d[n] = 1.0
    
    # 3. Resolver sistema lineal G * w = d
    weights = np.linalg.solve(G, d)
    return weights[:n] # Retornar los primeros n pesos estadísticos`
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span>2. Pipeline del Jupyter Notebook: Del Dato Crudo al Modelo</span>
        </h4>
        <div className="text-[10px] text-slate-500 italic">
          *Haz clic en cada paso del flujo para visualizar el código en Python y PyTorch
        </div>
      </div>

      {/* Steps indicators */}
      <div className="grid grid-cols-5 gap-2">
        {steps.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveStep(s.id)}
            className={`py-2.5 px-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
              activeStep === s.id
                ? "bg-slate-800 text-slate-100 border-slate-700 shadow-md ring-1 ring-emerald-500/20"
                : "bg-slate-900 border-slate-850 text-slate-500 hover:text-slate-300"
            }`}
          >
            <span className="text-[9px] font-black font-mono">Paso {s.id}</span>
            <span className="text-[10px] font-extrabold truncate w-full px-1">{s.title}</span>
          </button>
        ))}
      </div>

      {/* Description & Code Display Box */}
      <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-5 space-y-3 relative">
        <div className="absolute top-4 right-4 text-[9px] text-slate-600 font-mono flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span>Editor Jupyter Python PEP-8</span>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-extrabold text-slate-200">
            {steps[activeStep - 1].title} - Secuencia Operativa
          </span>
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-4xl">
            {steps[activeStep - 1].desc}
          </p>
        </div>

        {/* Code Block Container */}
        <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl max-h-72 overflow-y-auto scrollbar-hide">
          <pre className="text-[10px] font-mono text-emerald-400 leading-relaxed whitespace-pre overflow-x-auto selection:bg-slate-800/80 selection:text-white">
            {steps[activeStep - 1].code}
          </pre>
        </div>
      </div>
    </div>
  );
}

// 🔬 Data Ingestion & Pipeline Debugger Sandbox (Caminito del Dato)
function DataValidationSandbox() {
  const [activeSource, setActiveSource] = useState<'catastro' | 'vias' | 'sismos' | 'clima' | 'satelite' | 'sensores'>('sensores');
  const [activeStage, setActiveStage] = useState<'raw' | 'clean' | 'matrix' | 'destination'>('raw');
  const [simulateNoise, setSimulateNoise] = useState<boolean>(false);

  // Mock data definitions for each source
  const sourceInfo = {
    catastro: {
      name: "Catastro Rústico MIDAGRI",
      format: "GeoJSON (Polígonos)",
      sourceUrl: "visor.geoperu.gob.pe",
      raw: {
        type: "FeatureCollection",
        crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        features: [
          {
            type: "Feature",
            properties: { PARCELA_ID: 1045, DEPARTAMENTO: "Lambayeque", PROVINCIA: "Lambayeque", AREA_HA: 12.4, CULTIVO: "Arroz", ESTADO_GEOM: "VALID" },
            geometry: { type: "Polygon", coordinates: [[[-80.612, -5.221], [-80.608, -5.221], [-80.608, -5.225], [-80.612, -5.225], [-80.612, -5.221]]] }
          },
          {
            type: "Feature",
            properties: { PARCELA_ID: 9999, DEPARTAMENTO: "Lima", PROVINCIA: "Cañete", AREA_HA: 8.2, CULTIVO: "Desconocido", ESTADO_GEOM: "INVALID_SELF_INTERSECTION" },
            geometry: { type: "Polygon", coordinates: [[[-76.382, -13.075], [-76.380, -13.075], [-76.381, -13.078], [-76.382, -13.075]]] }
          }
        ]
      },
      preprocesar: [
        "Filtro Espacial Bounding Box: Se evalúan límites espaciales. Si el polígono cae fuera del Valle Chancay-Lambayeque (ej. Lima/Cañete), se descarta de la memoria activa.",
        "Verificación de Topología Estructural: Se ejecuta el resolvedor espacial ST_IsValid. Si hay auto-intersecciones de bordes (Self-Intersections), el registro es marcado como corrupto y enviado a logs de auditoría.",
        "Alineación Geo-Referencial: Reproyección del CRS local a coordenadas geodésicas globales SRID 4326."
      ],
      cleanOutput: [
        { id: 1045, depto: "Lambayeque", provincia: "Lambayeque", area: "12.4 Ha", cultivo: "Arroz", lat: -5.223, lng: -80.610, status: "Aprobado (Ingestado)" }
      ],
      destination: "Se proyecta directamente en el mapa 3D como una malla poligonal translúcida, sirviendo de límite espacial para el Kriging tridimensional y el catastro preventivo."
    },
    vias: {
      name: "Red Vial Logística MTC",
      format: "GeoJSON (LineStrings)",
      sourceUrl: "geocatmin.ingemmet.gob.pe",
      raw: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { RUTA_COD: "PE-1N", SEGMENTO: "Jayanca-Tinajones", ANCHO_M: 7.2, ESTADO: "OPERATIVO" },
            geometry: { type: "LineString", coordinates: [[-80.61, -5.22], [-80.57, -5.26], [-80.51, -5.24]] }
          }
        ]
      },
      preprocesar: [
        "Indexación en Grafo Espacial: Se extraen las líneas y se indexan como aristas (edges) y vértices (nodes) para el solucionador Dijkstra.",
        "Cruces de Colisión de Huaicos: Operadores Bounding Box (&&) en PostGIS intersectan el trazado vial con las ecorregiones de riesgo.",
        "Si hay colisión con huaico activo, el segmento cambia automáticamente su estado interno de 'OPERATIVO' a 'BLOQUEADO' en microsegundos."
      ],
      cleanOutput: [
        { ruta: "PE-1N", tramo: "Jayanca-Tinajones", nodos: 3, estado: "OPERATIVO", riesgo_huaico: "0.0%" }
      ],
      destination: "Alimenta en tiempo real al microservicio de ruteo preventivo escrito en Golang (nexus_router), permitiendo calcular desvíos dinámicos en la red vial nacional."
    },
    sismos: {
      name: "Avisos Sísmicos IGP",
      format: "JSON (Puntos / APIs)",
      sourceUrl: "ultimossismos.igp.gob.pe",
      raw: [
        { fecha: "2026-05-28", hora: "19:15:30", latitud: -5.235, longitud: -80.605, magnitud: 5.4, profundidad_km: 35, epicentro: "Lambayeque" },
        { fecha: "2026-05-28", hora: "19:22:11", latitud: -12.045, longitud: -77.030, magnitud: 3.1, profundidad_km: 48, epicentro: "Lima" }
      ],
      preprocesar: [
        "Filtro de Amortiguación Magnitud: Ignora cualquier evento sísmico con magnitud menor a 4.0 en la escala de Richter, puesto que no representan riesgo estructural.",
        "Cálculo del Radio de Impacto: El radio sísmico se estima matemáticamente multiplicando la magnitud por un factor de dispersión geológica ($R = M^2 \\cdot 1.5$ km).",
        "Detonante de Emergencia: Se empaqueta un objeto de coordenadas atómico y se envía una señal de interrupción al sistema vial."
      ],
      cleanOutput: [
        { fecha: "2026-05-28", epicentro: "Lambayeque", mag: 5.4, lat: -5.235, lng: -80.605, radio_afectacion: "43.7 km", status: "Alerta Activada" }
      ],
      destination: "Detona el sistema visual de sirenas y balizas concéntricas parpadeantes en React UI y fuerza al motor en Go a re-rutear de inmediato los camiones logísticos."
    },
    clima: {
      name: "Estaciones Meteorológicas SENAMHI",
      format: "JSON (Series Climatológicas)",
      sourceUrl: "idesep.senamhi.gob.pe",
      raw: [
        { timestamp: "19:00:00", temp: 24.5, humedad_rel: 78, lluvia_mm: 0.0 },
        { timestamp: "19:10:00", temp: 24.3, humedad_rel: 79, lluvia_mm: 0.0 },
        { timestamp: "19:20:00", temp: 23.8, humedad_rel: 81, lluvia_mm: 12.5 }
      ],
      preprocesar: [
        "Suavizado de Datos de Temperatura: Aplicación de un filtro de media móvil (Moving Average) con una ventana deslizante de 3 lecturas consecutivas para descartar fluctuaciones bruscas de ruido.",
        "Estandarización Temporal: Homologación de fechas en formato ISO-8601 UTC.",
        "Derivación de Evapotranspiración Diaria ($ET_{diaria}$): Algoritmo Penman-Monteith simplificado para estimar la tasa diaria de pérdida de agua en el suelo."
      ],
      cleanOutput: [
        { timestamp: "19:20:00", temp_media: "24.2 °C", humedad_media: "79.3%", lluvia_acumulada: "12.5 mm", evapotranspiracion: "5.0 mm/d" }
      ],
      destination: "Se inyecta en el motor físico de la parcela en Python (server.py) para actualizar el balance hídrico del subsuelo (Ecuación de Richards) y se muestra en el menú lateral."
    },
    satelite: {
      name: "Imágenes Multiespectrales Sentinel-2",
      format: "Raster / GeoTIFF (COGs)",
      sourceUrl: "browser.dataspace.copernicus.eu",
      raw: {
        dimensions: "100x100 pixels",
        bands: { B4_red: [1124, 1145, 1198], B8_nir: [2845, 2912, 2980], QA60_mask: [0, 0, 1] }
      },
      preprocesar: [
        "Máscara de Nubes (Cloud-Masking): Se evalúa la banda espectral de control de calidad QA60. Si un píxel tiene valor > 0 (presencia de nubes), el píxel se descarta y se marca como nulo.",
        "Álgebra Espectral Multibanda: Cálculo del vigor vegetal foliar (NDVI) a partir de las reflectancias del Rojo e Infrarrojo Cercano: $(B8 - B4) / (B8 + B4)$.",
        "Normalización del Contraste Espectral: Corrección atmosférica y re-escalado de valores al rango real [-1.0, 1.0]."
      ],
      cleanOutput: [
        { coord_local: "Píxel [0,1]", reflectancia_red: 1145, reflectancia_nir: 2912, ndvi: 0.435, estado_vigor: "Normal/Saludable" },
        { coord_local: "Píxel [0,2]", reflectancia_red: 1198, reflectancia_nir: 2980, ndvi: 0.426, estado_vigor: "Normal/Saludable" }
      ],
      destination: "Se proyecta como un mapa de calor bidimensional translúcido (BitmapLayer) superpuesto sobre el relieve catastral en React, mostrando visualmente el estrés hídrico macro."
    },
    sensores: {
      name: "Nodos de Telemetría IoT (Subsuelo)",
      format: "Arrays JSON (Telemetría)",
      sourceUrl: "sensor_simulator.py",
      raw: [
        { sensor_id: "SN-1001", humedad_20cm: 22.4, conductividad_20cm: 1.5, temp_suelo: 18.4 },
        { sensor_id: "SN-1001", humedad_20cm: 22.2, conductividad_20cm: 1.6, temp_suelo: 18.5 }
      ],
      preprocesar: [
        "Filtro de Desviación Sódica (Outliers): Si la conductividad eléctrica ($EC_a$) reporta un valor físico absurdo e imposible (ej. < 0 o > 50.0 dS/m debido a fallas eléctricas o sensor fuera del suelo), el valor se descarta.",
        "Imputación por Serie Temporal: El dato erróneo se reemplaza instantáneamente por el promedio de las últimas 3 lecturas estables del mismo nodo.",
        "Formateado para el Solver Kriging: Conversión de las lecturas discretas a un vector estructurado JSON consumible por el binario de WebAssembly."
      ],
      cleanOutput: [
        { sensor: "SN-1001", humedad: "22.3 %", salinidad: "1.55 dS/m", temp: "18.45 °C", calidad_señal: "100%" }
      ],
      destination: "Alimenta de forma local el solucionador geoestadístico Kriging en Rust (wasm_core) para elevar las columnas 3D y prescribe la dosificación de yeso agrícola."
    }
  };

  // Get raw data based on noise simulation state
  const getRawDataDisplay = () => {
    const data = sourceInfo[activeSource].raw;
    if (simulateNoise) {
      if (activeSource === 'sensores') {
        return [
          { sensor_id: "SN-1001", humedad_20cm: -999.0, conductividad_20cm: 98.4, temp_suelo: -120.0, ERROR: "FATAL_SENSOR_DEGRADATION" },
          ...data as any
        ];
      }
      if (activeSource === 'sismos') {
        return [
          { fecha: "2026-05-28", hora: "19:30:00", latitud: 0.0, longitud: 0.0, magnitud: -1.0, profundidad_km: -5, epicentro: "DOWNTIME_SERVICE_IGP" },
          ...data as any
        ];
      }
      if (activeSource === 'satelite') {
        return {
          dimensions: "100x100 pixels",
          bands: { B4_red: [9999, 9999, 9999], B8_nir: [9999, 9999, 9999], QA60_mask: [1, 1, 1], ERROR: "TOTAL_CLOUD_COVERAGE_99_PERCENT" }
        };
      }
    }
    return data;
  };

  // Get preprocessed logs based on noise simulation state
  const getPreprocessingLogs = () => {
    const defaultLogs = sourceInfo[activeSource].preprocesar;
    if (simulateNoise) {
      if (activeSource === 'sensores') {
        return [
          "⚠️ ALERTA: Outlier detectado en SN-1001 (humedad_20cm = -999.0, conductividad_20cm = 98.4 dS/m).",
          "🛑 ACCIÓN: Filtro de Desviación Sódica activado. Valor descartado por ser físicamente imposible.",
          "💡 IMPUTACIÓN: Reemplazando valor corrupto por interpolación de media móvil móvil estable: conductividad = 1.55 dS/m, humedad = 22.3%.",
          ...defaultLogs
        ];
      }
      if (activeSource === 'sismos') {
        return [
          "⚠️ ALERTA: Caída de API o reporte de sismo corrupto detectado (Magnitud = -1.0, Latitud = 0.0).",
          "🛑 ACCIÓN: Filtro de magnitud y epicentro activados. El registro sismológico ha sido ignorado.",
          "💡 IMPUTACIÓN: Manteniendo el historial de sismos previos intacto y activando ping de reconexión al IGP.",
          ...defaultLogs
        ];
      }
      if (activeSource === 'satelite') {
        return [
          "⚠️ ALERTA: Píxeles completamente obstruidos en Sentinel-2 (QA60 Cloud-Mask = 1).",
          "🛑 ACCIÓN: Filtro de máscara de nubes activado. Se eliminan los píxeles con brillo refractario saturado.",
          "💡 IMPUTACIÓN: Marcando píxeles nublados como nulos y solicitando el histórico raster de la semana previa.",
          ...defaultLogs
        ];
      }
    }
    return defaultLogs;
  };

  return (
    <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl space-y-6">
      
      {/* Sandbox Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
        <div className="space-y-1">
          <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Consola de Ingesta y Validación (Caminito del Dato)</span>
          </h3>
          <p className="text-[11px] text-slate-450">
            Simula, audita y valida la recepción y limpieza de datos antes de entrar a los motores de IA y mapas 3D.
          </p>
        </div>

        {/* Interactive Noise Switcher */}
        <button
          onClick={() => setSimulateNoise(!simulateNoise)}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all flex items-center gap-1.5 ${
            simulateNoise
              ? "bg-rose-500/10 border-rose-500/30 text-rose-450 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse"
              : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${simulateNoise ? "bg-rose-500 animate-ping" : "bg-slate-600"}`}></span>
          <span>{simulateNoise ? "Simulando Fallo / Ruido Activo" : "Simular Ruido / Sensor Degradado"}</span>
        </button>
      </div>

      {/* Grid: Source Selectors & Content tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Col 1: 6 Source buttons */}
        <div className="lg:col-span-1 space-y-1.5">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block pl-1">
            Seleccionar Fuente de Ingesta
          </span>
          <div className="flex flex-col space-y-1">
            {(Object.keys(sourceInfo) as Array<keyof typeof sourceInfo>).map(key => (
              <button
                key={key}
                onClick={() => {
                  setActiveSource(key);
                  setActiveStage('raw');
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-between ${
                  activeSource === key
                    ? "bg-slate-800 text-slate-100 border-slate-700 shadow-sm"
                    : "bg-slate-950/20 border-slate-850/40 text-slate-500 hover:text-slate-300 hover:bg-slate-800/20"
                }`}
              >
                <span>{sourceInfo[key].name}</span>
                <span className="text-[9px] font-mono text-slate-500">{sourceInfo[key].format.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Col 2-4: Stages & Interactive Sandbox Viewer */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Stage Tab Selectors */}
          <div className="flex space-x-1 p-1 bg-slate-950/80 border border-slate-850 rounded-xl">
            <button
              onClick={() => setActiveStage('raw')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center ${
                activeStage === 'raw'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700/50'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              📥 1. Ingesta Bruta (Raw Data)
            </button>
            <button
              onClick={() => setActiveStage('clean')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center ${
                activeStage === 'clean'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700/50'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              ⚙️ 2. Filtros y Limpieza
            </button>
            <button
              onClick={() => setActiveStage('matrix')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center ${
                activeStage === 'matrix'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700/50'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              🗃️ 3. Matriz de Datos Planos
            </button>
            <button
              onClick={() => setActiveStage('destination')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center ${
                activeStage === 'destination'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700/50'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              🚀 4. Destino (Modelo/Mapa)
            </button>
          </div>

          {/* Sandbox Stage Content Area */}
          <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 min-h-[220px] flex flex-col justify-between relative overflow-hidden">
            
            {/* Background branding logo watermark */}
            <div className="absolute top-2 right-4 text-[9px] text-slate-700 font-mono">
              GeoTERRA Data Ingestion v1.0
            </div>

            {/* STAGE 1: RAW DATA VIEW */}
            {activeStage === 'raw' && (
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Payload Bruto Recibido en Endpoint (API)</span>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Servicio de Origen: <span className="font-mono text-cyan-400 underline">{sourceInfo[activeSource].sourceUrl}</span> | Formato de transmisión: <span className="font-mono text-slate-300">{sourceInfo[activeSource].format}</span>
                  </div>
                </div>
                
                {/* Simulated Terminal code block */}
                <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl max-h-40 overflow-y-auto scrollbar-hide flex-1">
                  <pre className="text-[10px] font-mono text-cyan-400 whitespace-pre overflow-x-auto">
                    {JSON.stringify(getRawDataDisplay(), null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* STAGE 2: PREPROCESSING LOGS */}
            {activeStage === 'clean' && (
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Limpieza Estadística & Filtros Edafológicos</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Transformación del payload crudo. Se descartan outliers físicos, se re-proyectan geometrías y se eliminan píxeles nulos por obstrucción.
                  </p>
                </div>

                {/* Preprocessing console list */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-2 flex-1 max-h-40 overflow-y-auto scrollbar-hide">
                  {getPreprocessingLogs().map((log, idx) => (
                    <div 
                      key={idx} 
                      className={`text-[10px] font-mono leading-relaxed ${
                        log.startsWith("⚠️") 
                          ? "text-yellow-500 font-bold" 
                          : log.startsWith("🛑") 
                            ? "text-rose-400" 
                            : log.startsWith("💡") 
                              ? "text-emerald-400 font-bold" 
                              : "text-slate-400"
                      }`}
                    >
                      {log.startsWith("⚠️") || log.startsWith("🛑") || log.startsWith("💡") ? log : `➔ ${log}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STAGE 3: DATA MATRIX */}
            {activeStage === 'matrix' && (
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Matriz Plana Aplanada en Memoria (DataFrame)</span>
                  <p className="text-[10px] text-slate-500">
                    Estructura de datos optimizada y sanitizada en columnas lista para el cómputo algebraico o indexación SQL.
                  </p>
                </div>

                {/* Clean Ingested Grid table */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-x-auto flex-1 max-h-40">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-500 font-bold uppercase tracking-wider">
                        {Object.keys(sourceInfo[activeSource].cleanOutput[0]).map(key => (
                          <th key={key} className="p-2.5 font-mono">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/40 text-slate-300">
                      {sourceInfo[activeSource].cleanOutput.map((row: any, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-900/40 transition-colors">
                          {Object.values(row).map((val: any, cIdx) => (
                            <td key={cIdx} className="p-2.5 font-mono font-medium">
                              {val === "Aprobado (Ingestado)" || val === "Alerta Activada" 
                                ? <span className="text-emerald-450 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">{val}</span> 
                                : val
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* STAGE 4: MODEL DESTINATION */}
            {activeStage === 'destination' && (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Integración en Motores & Destino del Flujo</span>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-850">
                    {sourceInfo[activeSource].destination}
                  </p>
                </div>

                <div className="flex items-center justify-between bg-slate-950 border border-slate-850 p-3 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-[10px] text-slate-400 font-bold">Estado de Sincronización:</span>
                  </div>
                  <span className="text-[10px] font-bold font-mono text-emerald-450 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                    100% OPERATIVO (TRL-5)
                  </span>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
