import { useMemo, useState, useEffect } from 'react';
import { ClipboardList, Download, MapPin, Calculator, AlertCircle, DollarSign, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  generateMockSensors, 
  calculateGypsumRequirement, 
  classifyDegradation, 
  generateGeoJSON,
  type TelemetryData 
} from '../utils/engine';

export function Prescriptions() {
  const [sensors, setSensors] = useState<TelemetryData[]>([]);
  const [carbonPrice, setCarbonPrice] = useState(25); // Default USD per tCO2e credit
  const [targetESP, setTargetESP] = useState(5);
  const [defaultCEC, setDefaultCEC] = useState(25);

  const loadSettingsAndSensors = () => {
    const climate = localStorage.getItem('soil_climate') as any || 'normal';
    const base = generateMockSensors(climate);
    const customStr = localStorage.getItem('custom_sensors');
    const allSensors = customStr ? [...base, ...JSON.parse(customStr)] : base;
    setSensors(allSensors);

    const savedESP = localStorage.getItem('soil_target_esp');
    if (savedESP) setTargetESP(Number(savedESP));

    const savedCEC = localStorage.getItem('soil_default_cec');
    if (savedCEC) setDefaultCEC(Number(savedCEC));
  };

  useEffect(() => {
    loadSettingsAndSensors();
    window.addEventListener('storage', loadSettingsAndSensors);
    return () => window.removeEventListener('storage', loadSettingsAndSensors);
  }, []);

  // Compute VRA prescriptions for affected parcels
  const prescriptions = useMemo(() => {
    return sensors.filter(s => classifyDegradation(s) === 'Crítica' || classifyDegradation(s) === 'Severa' || classifyDegradation(s) === 'Moderada').map(s => {
      // Current ESP correlated with EC for gypsum calculation in this MVP
      const currentESP = s.ec * 2.4; 
      
      const gypsum = calculateGypsumRequirement(defaultCEC, currentESP, targetESP);

      // Leaching Fraction (LR) calculations
      // LR = EC_w / (5 * EC_e - EC_w)  where EC_w is irrigation water salinity (~1.1 dS/m), EC_e is crop tolerance (~3.0 dS/m)
      const ecWater = 1.1;
      const ecCropThreshold = 3.0; // Rice standard
      let lf = 0;
      if (s.ec > ecCropThreshold) {
        lf = ecWater / ((5 * s.ec) - ecWater);
        lf = parseFloat(Math.min(Math.max(lf, 0.05), 0.35).toFixed(3));
      }

      // Recomended water volume: Base 500 m3/ha + Leaching fraction increase
      const waterVolume = Math.round(500 * (1 + lf));

      return {
        ...s,
        gypsum,
        class: classifyDegradation(s),
        leachingFraction: lf,
        waterVolume
      };
    });
  }, [sensors, defaultCEC, targetESP]);

  // Download GeoJSON Prescriptions file
  const handleDownloadGeoJSON = (p: any) => {
    const geojsonObject = generateGeoJSON(p, p.gypsum);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geojsonObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `prescripcion_vra_${p.id}.geojson`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Carbon Credit Estimations
  // Restoring one hectare of degraded saline soil can sequester approx 2.4 tCO2e/year in organic matter
  const carbonMetrics = useMemo(() => {
    const activeDegradedHectares = prescriptions.length * 4.5; // assume ~4.5 Ha average per parcel
    const annualSequestration = activeDegradedHectares * 2.4; // 2.4 tCO2e / Ha / Yr
    const annualRevenue = annualSequestration * carbonPrice;

    // 5-year accumulation projection
    const chartData = Array.from({ length: 5 }).map((_, idx) => {
      const year = idx + 1;
      return {
        name: `Año ${year}`,
        CO2: parseFloat((annualSequestration * year).toFixed(1)),
        Ingresos: Math.round(annualRevenue * year)
      };
    });

    return {
      hectares: parseFloat(activeDegradedHectares.toFixed(1)),
      sequestration: parseFloat(annualSequestration.toFixed(1)),
      revenue: Math.round(annualRevenue),
      chartData
    };
  }, [prescriptions, carbonPrice]);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Recetas VRA & Créditos de Carbono</h1>
        <p className="text-slate-400">Prescripciones algorítmicas de enmiendas químicas, dosis hídricas de lavado y valorización MRV</p>
      </div>

      {prescriptions.length === 0 ? (
        <div className="glass-panel border border-slate-700/50 rounded-xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-200">Suelos Óptimos</h2>
          <p className="text-slate-400 mt-2">No se han detectado parcelas con salinización moderada o severa en el Bajo Piura.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Prescriptions List */}
          <div className="xl:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {prescriptions.map((p) => (
                <div key={p.id} className="glass-panel border border-slate-700/50 rounded-xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${
                    p.class === 'Crítica' ? 'bg-rose-500' : p.class === 'Severa' ? 'bg-amber-500' : 'bg-yellow-500'
                  }`}></div>
                  
                  <div className="flex justify-between items-start mb-4 pl-1">
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-emerald-400 mr-2" />
                      <h3 className="font-semibold text-lg text-slate-200">Parcela {p.id}</h3>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${
                      p.class === 'Crítica' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {p.class}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                    <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
                      <p className="text-[10px] text-slate-400 uppercase">CE Suelo</p>
                      <p className="text-sm font-bold text-slate-200 mt-0.5">{p.ec} <span className="text-[9px] text-slate-500">dS/m</span></p>
                    </div>
                    <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
                      <p className="text-[10px] text-slate-400 uppercase">pH</p>
                      <p className="text-sm font-bold text-slate-200 mt-0.5">{p.pH}</p>
                    </div>
                    <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
                      <p className="text-[10px] text-slate-400 uppercase">Humedad</p>
                      <p className="text-sm font-bold text-blue-400 mt-0.5">{p.soilMoisture}%</p>
                    </div>
                  </div>

                  {/* Gypsum Prescription Card */}
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-lg mb-4">
                    <div className="flex items-start">
                      <Calculator className="w-5 h-5 text-emerald-400 mr-3 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-emerald-400 mb-0.5">Yeso Agrícola (VRA)</h4>
                        <p className="text-xl font-bold text-slate-100">
                          {p.gypsum} <span className="text-xs font-normal text-emerald-500">t/ha</span>
                        </p>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          Remoción de Sodio: GR = (ESP_diff / 100) * CIC * 1.72
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Leaching Fraction Card */}
                  {p.leachingFraction > 0 && (
                    <div className="bg-blue-500/5 border border-blue-500/10 p-3.5 rounded-lg mb-4">
                      <div className="flex items-start">
                        <TrendingUp className="w-5 h-5 text-blue-400 mr-3 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-semibold text-blue-400 mb-0.5">Fracción de Lavado (LF)</h4>
                          <p className="text-sm font-bold text-slate-200">
                            {Math.round(p.leachingFraction * 100)}% <span className="text-xs font-normal text-slate-400">({p.waterVolume} m³/ha prescrito)</span>
                          </p>
                          <p className="text-[9px] text-slate-500 mt-0.5">
                            Fórmula: LF = EC_w / (5 * EC_e - EC_w) (Calibrado agua Piura)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3.5 border-t border-slate-700/50">
                    <p className="text-[10px] text-slate-500 flex items-center">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> Tractor VRA listo
                    </p>
                    <button
                      onClick={() => handleDownloadGeoJSON(p)}
                      className="flex items-center px-3.5 py-1.5 bg-slate-800 text-slate-200 text-xs rounded hover:bg-slate-700 border border-slate-600 transition-colors font-semibold"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Descargar GeoJSON
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column - Carbon Credits MRV */}
          <div className="space-y-6">
            <div className="glass-panel border border-slate-700/50 rounded-xl p-6 space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <h3 className="text-lg font-semibold text-slate-200 flex items-center">
                  <DollarSign className="w-5 h-5 text-emerald-400 mr-2" />
                  Sumidero de Carbono (MRV)
                </h3>
                <p className="text-xs text-slate-400 mt-1">Valorización de captura de carbono orgánico por restauración de suelos</p>
              </div>

              {/* Price Control */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Precio de Crédito Voluntario</span>
                  <span className="font-bold text-slate-200">${carbonPrice} USD / tCO2e</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  step="1"
                  value={carbonPrice}
                  onChange={(e) => setCarbonPrice(Number(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Carbon metrics block */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 text-center">
                  <p className="text-slate-500 uppercase text-[9px]">Captura Anual</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">{carbonMetrics.sequestration} <span className="text-[10px] font-normal text-slate-400">tCO₂e</span></p>
                </div>
                <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 text-center">
                  <p className="text-slate-500 uppercase text-[9px]">Retorno Estimado</p>
                  <p className="text-xl font-bold text-cyan-400 mt-1">${carbonMetrics.revenue} <span className="text-[10px] font-normal text-slate-400">USD/a</span></p>
                </div>
              </div>

              {/* 5-year Recharts projection chart */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">Proyección de Captura y Retorno (5 Años)</h4>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={carbonMetrics.chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCarbon" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                        itemStyle={{ fontSize: 11 }}
                      />
                      <Area type="monotone" dataKey="Ingresos" stroke="#10b981" fillOpacity={1} fill="url(#colorCarbon)" name="Ingresos (USD)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-4 bg-slate-850 border border-slate-800 rounded-lg text-[10px] text-slate-500 leading-relaxed">
                <span className="font-bold text-slate-400 block mb-1">Mecanismo MRV Certificado:</span>
                Al neutralizar la salinidad, la actividad biológica de raíces e incorporación de rastrojos acumula carbono húmico estable. Estimado de acuerdo a estándares Verra / Gold Standard.
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
