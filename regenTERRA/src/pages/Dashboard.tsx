import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, Droplets, Wind, Zap, RefreshCw, Layers } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { cn } from '../utils/cn';
import { generateMockSensors, classifyDegradation, type TelemetryData } from '../utils/engine';

export function Dashboard() {
  const navigate = useNavigate();
  const [climate, setClimate] = useState<'normal' | 'nino' | 'sequia'>('normal');
  const [sensors, setSensors] = useState<TelemetryData[]>([]);
  const [satelliteSyncing, setSatelliteSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const loadData = () => {
    const savedClimate = (localStorage.getItem('soil_climate') as any) || 'normal';
    setClimate(savedClimate);

    // Generate simulated ground truth sensors modulated by climate
    const base = generateMockSensors(savedClimate);
    
    // Merge with any custom registered sensors
    const customStr = localStorage.getItem('custom_sensors');
    if (customStr) {
      const custom = JSON.parse(customStr);
      setSensors([...base, ...custom]);
    } else {
      setSensors(base);
    }
  };

  useEffect(() => {
    loadData();
    // Listen to changes in localStorage from other tabs/pages
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleClimateChange = (newClimate: 'normal' | 'nino' | 'sequia') => {
    setClimate(newClimate);
    localStorage.setItem('soil_climate', newClimate);
    
    // Regenerate data in-place
    const base = generateMockSensors(newClimate);
    const customStr = localStorage.getItem('custom_sensors');
    if (customStr) {
      const custom = JSON.parse(customStr);
      setSensors([...base, ...custom]);
    } else {
      setSensors(base);
    }

    // Trigger storage event for other pages
    window.dispatchEvent(new Event('storage'));
  };

  const handleSatelliteSync = () => {
    setSatelliteSyncing(true);
    setSyncMessage('');
    setTimeout(() => {
      setSatelliteSyncing(false);
      setSyncMessage('Sentinel-2 Calibrado (Ground-Truth R²=0.94)');
      setTimeout(() => setSyncMessage(''), 4000);
    }, 2000);
  };

  const criticalParcels = sensors.filter(
    s => classifyDegradation(s) === 'Crítica' || classifyDegradation(s) === 'Severa'
  );
  
  // Calculate average moisture dynamically based on climate
  const averageMoisture = useMemo(() => {
    if (sensors.length === 0) return '0%';
    const sum = sensors.reduce((acc, curr) => acc + curr.soilMoisture, 0);
    return (sum / sensors.length).toFixed(1) + '%';
  }, [sensors]);

  // Chart data simulation
  const chartData = sensors.map(s => ({
    name: s.id.replace('SN-', 'N-'),
    ec: s.ec,
    moisture: s.soilMoisture
  }));

  return (
    <div className="space-y-6">
      
      {/* Title Header Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center">
            <Layers className="w-8 h-8 text-emerald-400 mr-3 animate-pulse" />
            Vista Edafológica Global
          </h1>
          <p className="text-slate-400 mt-1">Monitoreo y Prescripción Híbrida - Sector Bajo Piura</p>
        </div>

        {/* Action Panel */}
        <div className="flex flex-wrap gap-3 items-center">
          
          {/* Global Climate Simulator dropdown */}
          <div className="flex items-center space-x-2 bg-slate-800/60 border border-slate-700/80 rounded-lg px-3 py-1.5">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Clima:</span>
            <select
              value={climate}
              onChange={(e) => handleClimateChange(e.target.value as any)}
              className="bg-transparent border-none outline-none text-xs text-emerald-400 font-bold cursor-pointer"
            >
              <option value="normal">Normal (Estable)</option>
              <option value="nino">Fenómeno El Niño (Lluvia)</option>
              <option value="sequia">Sequía Extrema (Evap)</option>
            </select>
          </div>

          <button
            onClick={handleSatelliteSync}
            disabled={satelliteSyncing}
            className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors text-xs font-semibold disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${satelliteSyncing ? 'animate-spin' : ''}`} />
            {satelliteSyncing ? 'Sincronizando...' : 'Calibrar Satélite'}
          </button>

          <button
            onClick={() => navigate('/prescriptions')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-xs font-semibold shadow-lg shadow-emerald-500/20"
          >
            Generar Recetas VRA
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg animate-fade-in flex items-center">
          <Zap className="w-4 h-4 mr-2" />
          {syncMessage}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Sensores IoT Activos"
          value={sensors.length.toString()}
          trend={`${sensors.filter(s => s.batteryLevel > 90).length} óptimos`}
          icon={Activity}
          color="text-emerald-400"
          bg="bg-emerald-400/10"
        />
        <KPICard 
          title="Nodos en Riesgo Salino"
          value={criticalParcels.length.toString()}
          trend={criticalParcels.length > 0 ? "Acción requerida" : "Suelos estables"}
          icon={AlertTriangle}
          color={criticalParcels.length > 0 ? "text-rose-450 animate-pulse" : "text-emerald-400"}
          bg={criticalParcels.length > 0 ? "bg-rose-500/10" : "bg-emerald-500/10"}
          critical={criticalParcels.length > 0}
        />
        <KPICard 
          title="Humedad Vol. Promedio"
          value={averageMoisture}
          trend={climate === 'nino' ? "+14.4% (Exceso)" : climate === 'sequia' ? "-12.2% (Déficit)" : "Nivel óptimo"}
          icon={Droplets}
          color={climate === 'sequia' ? "text-rose-400" : "text-blue-400"}
          bg={climate === 'sequia' ? "bg-rose-400/10" : "bg-blue-400/10"}
        />
        <KPICard 
          title="Vulnerabilidad Eólica"
          value={climate === 'sequia' ? "Alta" : "Baja"}
          trend="Vel. Viento 14km/h"
          icon={Wind}
          color="text-amber-400"
          bg="bg-amber-400/10"
        />
      </div>

      {/* Main Charts & Spatial Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Telemetry Chart */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-6 border border-slate-700/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-200">Dinámica de Salinidad (CE) vs Humedad</h2>
              <p className="text-xs text-slate-500 mt-0.5">Valores correspondientes a la capa arable (0 - 20cm)</p>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-1.5"></span> CE (dS/m)</span>
              <span className="flex items-center text-blue-400"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 mr-1.5"></span> Humedad (%)</span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20, right: 10 }}>
                <defs>
                  <linearGradient id="colorEc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                  itemStyle={{ color: '#e2e8f0', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="ec" stroke="#10b981" fillOpacity={1} fill="url(#colorEc)" name="CE (dS/m)" />
                <Area type="monotone" dataKey="moisture" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMoisture)" name="Humedad (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* XGBoost Ensemble Alerts list */}
        <div className="glass-panel rounded-xl p-6 border border-slate-700/50 flex flex-col h-[380px]">
          <div className="pb-3 border-b border-slate-800 mb-4">
            <h2 className="text-lg font-semibold text-slate-200 flex items-center">
              <Zap className="w-5 h-5 text-amber-400 mr-2" />
              Alertas XGBoost & RF
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Vulnerabilidad de degradación clasificada por IA</p>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
            {criticalParcels.map((parcel, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-rose-500/5 border border-rose-500/20">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-rose-400 text-sm">{parcel.id}</span>
                  <span className="text-[9px] px-2 py-0.5 bg-rose-500/10 text-rose-300 rounded uppercase font-bold tracking-wider border border-rose-500/20">
                    {classifyDegradation(parcel)}
                  </span>
                </div>
                <p className="text-xs text-slate-400">CE: {parcel.ec} dS/m | pH: {parcel.pH} | N: {parcel.nitrogen} mg/kg</p>
                <p className="text-[10px] text-slate-500 mt-2 font-medium">
                  {parcel.ec > 4.5 ? 'Recomendación VRA: Yeso Agrícola y lavado LF.' : 'Recomendación: Aplicar drenaje secundario.'}
                </p>
              </div>
            ))}
            {criticalParcels.length === 0 && (
              <div className="text-slate-500 text-xs italic text-center py-12">No hay alertas críticas en este escenario.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, trend, icon: Icon, color, bg, critical = false }: any) {
  return (
    <div className={cn(
      "glass-panel rounded-xl p-5 border relative overflow-hidden transition-all hover:scale-[1.02]",
      critical ? "border-rose-500/30" : "border-slate-700/50"
    )}>
      {critical && <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-full blur-xl pointer-events-none" />}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-slate-100 mt-2">{value}</p>
        </div>
        <div className={cn("p-2 rounded-lg", bg)}>
          <Icon className={cn("w-6 h-6", color)} />
        </div>
      </div>
      <div className="mt-4 flex items-center text-xs">
        <span className={cn("font-semibold", critical ? "text-rose-400" : "text-emerald-400")}>{trend}</span>
      </div>
    </div>
  );
}
