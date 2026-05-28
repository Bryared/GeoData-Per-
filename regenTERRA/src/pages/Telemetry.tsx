import { useState, useEffect, useRef } from 'react';
import { Activity, Wifi, Battery, Play, Pause, RefreshCw, Globe, Database, Cpu } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { generateMockSensors, type TelemetryData } from '../utils/engine';

export function Telemetry() {
  const [sensors, setSensors] = useState<TelemetryData[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<TelemetryData | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [loraLogs, setLoraLogs] = useState<string[]>([]);
  const [satelliteSyncing, setSatelliteSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'iot' | 'satellite'>('iot');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = generateMockSensors();
    setSensors(data);
    setSelectedSensor(data[0]);
    
    // Initial logs
    setLoraLogs([
      `[${new Date().toLocaleTimeString()}] [INFO] Edafo-OS LoRaWAN Gateway initialized on 915.2 MHz.`,
      `[${new Date().toLocaleTimeString()}] [INFO] SF7 (Spreading Factor) active. Redundancy active.`,
      `[${new Date().toLocaleTimeString()}] [INFO] Connection established with GEO Perú PCM endpoints.`,
      `[${new Date().toLocaleTimeString()}] [DATA] Loaded 12 AirMind soil telemetry nodes.`
    ]);
  }, []);

  // Simulate real-time LoRa packets coming in
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setSensors(prev => {
        const updated = prev.map(s => {
          if (Math.random() > 0.6) {
            const randomVal = parseFloat((Math.random() * 0.4 - 0.2).toFixed(1));
            const newEC = parseFloat(Math.max(0.5, Math.min(16.0, s.ec + randomVal)).toFixed(1));
            const newMoisture = parseFloat(Math.max(4.0, Math.min(45.0, s.soilMoisture + parseFloat((Math.random() * 2 - 1).toFixed(1)))).toFixed(1));
            
            // Generate telemetry log entry
            const rssiDelta = Math.floor(Math.random() * 5 - 2);
            const newRssi = Math.min(-60, Math.max(-110, s.rssi + rssiDelta));

            setLoraLogs(logs => [
              ...logs,
              `[${new Date().toLocaleTimeString()}] [LoRaWAN] RX Packet DevAddr[${s.id}] RSSI[${newRssi}dBm] CE[${newEC}dS/m] Hum[${newMoisture}%] pH[${s.pH}]`
            ].slice(-100)); // limit logs size

            // Update sub-surface layers
            const d20 = { ...s.depths.depth20cm, ec: parseFloat(Math.max(0.5, newEC * 0.9).toFixed(1)), moisture: parseFloat(Math.max(5.0, newMoisture * 0.85).toFixed(1)) };
            const d40 = { ...s.depths.depth40cm, ec: parseFloat(Math.max(0.5, newEC * 1.05).toFixed(1)), moisture: parseFloat(Math.max(5.0, newMoisture * 1.0).toFixed(1)) };
            const d60 = { ...s.depths.depth60cm, ec: parseFloat(Math.max(0.5, newEC * 1.2).toFixed(1)), moisture: parseFloat(Math.max(5.0, newMoisture * 1.15).toFixed(1)) };

            return { 
              ...s, 
              ec: newEC, 
              soilMoisture: newMoisture, 
              rssi: newRssi,
              depths: { depth20cm: d20, depth40cm: d40, depth60cm: d60 }
            };
          }
          return s;
        });

        // Keep selected sensor in sync
        if (selectedSensor) {
          const match = updated.find(x => x.id === selectedSensor.id);
          if (match) setSelectedSensor(match);
        }

        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive, selectedSensor]);

  // Scroll terminal logs to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loraLogs]);

  const handleSatelliteSync = () => {
    setSatelliteSyncing(true);
    setLoraLogs(logs => [
      ...logs,
      `[${new Date().toLocaleTimeString()}] [SATELLITE] Requesting Sentinel-2 API query for bounding box...`,
      `[${new Date().toLocaleTimeString()}] [SATELLITE] Syncing Tile T17MQT, cloud cover 1.8%`,
      `[${new Date().toLocaleTimeString()}] [SATELLITE] Calculating indices NDSI, NDVI, NDWI...`
    ]);
    setTimeout(() => {
      setSatelliteSyncing(false);
      setLoraLogs(logs => [
        ...logs,
        `[${new Date().toLocaleTimeString()}] [SATELLITE] Sync complete! Spectral costra index calibrated with ground IoT nodes.`
      ]);
    }, 2500);
  };

  // Soil profile bar chart data
  const profileChartData = selectedSensor ? [
    { name: '20 cm', CE: selectedSensor.depths.depth20cm.ec, Humedad: selectedSensor.depths.depth20cm.moisture },
    { name: '40 cm', CE: selectedSensor.depths.depth40cm.ec, Humedad: selectedSensor.depths.depth40cm.moisture },
    { name: '60 cm', CE: selectedSensor.depths.depth60cm.ec, Humedad: selectedSensor.depths.depth60cm.moisture }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center">
            <Activity className="w-8 h-8 text-emerald-400 mr-3 animate-pulse" />
            Telemetría Avanzada Edafo-OS
          </h1>
          <p className="text-slate-400 mt-1">
            Ingesta en tiempo real e índices satelitales calibrados - Valle del Bajo Piura
          </p>
        </div>
        <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('iot')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
              activeTab === 'iot' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Nodos IoT (LoRaWAN)
          </button>
          <button
            onClick={() => setActiveTab('satellite')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
              activeTab === 'satellite' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sentinel-2 Satelital
          </button>
        </div>
      </div>

      {activeTab === 'iot' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Main Nodes list */}
          <div className="xl:col-span-2 space-y-6">
            <div className="glass-panel border border-slate-700/50 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-200 flex items-center">
                  <Database className="w-5 h-5 text-emerald-400 mr-2" />
                  Módulos Físicos AirMind ({sensors.length} Activos)
                </h2>
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                  <span className="text-xs text-slate-400 uppercase tracking-wider">{isLive ? 'Stream Vivo' : 'Pausado'}</span>
                </div>
              </div>

              {/* Sensor list grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[460px] overflow-y-auto pr-2 scrollbar-thin">
                {sensors.map(s => {
                  const isSelected = selectedSensor?.id === s.id;
                  let signalColor = 'text-emerald-400';
                  if (s.rssi < -95) signalColor = 'text-rose-400';
                  else if (s.rssi < -80) signalColor = 'text-amber-400';

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSensor(s)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer hover:border-emerald-500/30 ${
                        isSelected 
                          ? 'bg-emerald-500/5 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                          : 'bg-slate-800/40 border-slate-700/50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <Cpu className={`w-4 h-4 mr-2 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <span className="font-bold text-sm text-slate-200">{s.id}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                          <Battery className="w-3.5 h-3.5" />
                          <span>{s.batteryLevel}%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs mb-3 text-slate-300">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase">Salinidad</p>
                          <p className="font-semibold text-emerald-400">{s.ec} dS/m</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase">Humedad</p>
                          <p className="font-semibold text-blue-400">{s.soilMoisture}%</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] pt-2 border-t border-slate-700/30">
                        <span className="text-slate-500">Piura: {s.lat.toFixed(4)}, {s.lng.toFixed(4)}</span>
                        <div className="flex items-center space-x-1">
                          <Wifi className={`w-3.5 h-3.5 ${signalColor}`} />
                          <span className={signalColor}>{s.rssi}dBm</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Retro Terminal Logs console */}
            <div className="glass-panel border border-slate-700/50 rounded-xl p-5 bg-[#070b13] flex flex-col h-[280px]">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full mr-2 animate-ping"></span>
                  Terminal Ingesta LoRaWAN (Bajo Piura Gateway)
                </span>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setIsLive(!isLive)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
                    title={isLive ? 'Pausar Stream' : 'Activar Stream'}
                  >
                    {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button 
                    onClick={() => setLoraLogs([])} 
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-400 transition-colors"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              {/* Terminal lines */}
              <div className="flex-1 overflow-y-auto font-mono text-[11px] text-emerald-400/90 space-y-1 bg-[#03050a] p-3 rounded-lg border border-slate-900 shadow-inner select-text">
                {loraLogs.map((log, index) => (
                  <div key={index} className="leading-5 hover:bg-emerald-500/5 px-1 py-0.5 rounded transition-colors">{log}</div>
                ))}
                <div ref={terminalEndRef} />
              </div>
            </div>
          </div>

          {/* Sidebar - Selected sensor details & vertical soil profile */}
          <div className="space-y-6">
            {selectedSensor ? (
              <div className="glass-panel border border-slate-700/50 rounded-xl p-6 flex flex-col h-full">
                <div className="pb-4 border-b border-slate-700/50 mb-6">
                  <h3 className="text-lg font-semibold text-slate-200">Perfil de Suelo: {selectedSensor.id}</h3>
                  <p className="text-xs text-slate-400 mt-1">Estructura subsuperficial a 20, 40 y 60cm de profundidad</p>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6 text-center text-xs">
                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/40">
                    <p className="text-slate-400 text-[10px]">pH General</p>
                    <p className="text-base font-bold text-slate-200 mt-1">{selectedSensor.pH}</p>
                  </div>
                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/40">
                    <p className="text-slate-400 text-[10px]">Nitrógeno (N)</p>
                    <p className="text-base font-bold text-emerald-400 mt-1">{selectedSensor.nitrogen} <span className="text-[9px] text-slate-500 font-normal">mg/kg</span></p>
                  </div>
                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/40">
                    <p className="text-slate-400 text-[10px]">Fósforo (P)</p>
                    <p className="text-base font-bold text-amber-500 mt-1">{selectedSensor.phosphorus} <span className="text-[9px] text-slate-500 font-normal">mg/kg</span></p>
                  </div>
                </div>

                {/* Subsurface chart */}
                <div className="h-60 w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profileChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                        itemStyle={{ fontSize: 12 }}
                      />
                      <Bar dataKey="CE" fill="#10b981" radius={[4, 4, 0, 0]} name="CE (dS/m)" />
                      <Bar dataKey="Humedad" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Humedad (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Deep physics explanation */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 space-y-3 text-xs text-slate-400 flex-1">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-semibold">Capa</span>
                    <span>Salinidad (CE)</span>
                    <span>Humedad (%)</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-t border-slate-800">
                    <span className="text-slate-300 font-medium">20cm (Superior)</span>
                    <span className="text-emerald-400 font-semibold">{selectedSensor.depths.depth20cm.ec} dS/m</span>
                    <span className="text-blue-400 font-semibold">{selectedSensor.depths.depth20cm.moisture}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-t border-slate-800">
                    <span className="text-slate-300 font-medium">40cm (Raíces)</span>
                    <span className="text-emerald-400 font-semibold">{selectedSensor.depths.depth40cm.ec} dS/m</span>
                    <span className="text-blue-400 font-semibold">{selectedSensor.depths.depth40cm.moisture}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-t border-slate-800">
                    <span className="text-slate-300 font-medium">60cm (Subsuelo)</span>
                    <span className="text-emerald-400 font-semibold">{selectedSensor.depths.depth60cm.ec} dS/m</span>
                    <span className="text-blue-400 font-semibold">{selectedSensor.depths.depth60cm.moisture}%</span>
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-2 leading-relaxed">
                    *El gradiente salino ascendente indica capilaridad activa desde el nivel freático. Se aconseja lixiviación hídrica (fracción de lavado).
                  </p>
                </div>
              </div>
            ) : (
              <div className="glass-panel border border-slate-700/50 rounded-xl p-12 text-center text-slate-500 italic">
                Seleccione un sensor para ver su perfil.
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Sentinel-2 Satellite view tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel border border-slate-700/50 rounded-xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-200 flex items-center">
                <Globe className="w-5 h-5 text-emerald-400 mr-2" />
                Copernicus Sentinel-2 - Ingesta Geoespacial
              </h2>
              <button
                onClick={handleSatelliteSync}
                disabled={satelliteSyncing}
                className="flex items-center px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 disabled:opacity-50 transition-colors text-sm font-semibold"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${satelliteSyncing ? 'animate-spin' : ''}`} />
                {satelliteSyncing ? 'Sincronizando...' : 'Consultar Sentinel-2'}
              </button>
            </div>

            {/* Simulated Satellite Multispectral Tile Card */}
            <div className="relative rounded-xl overflow-hidden border border-slate-700/50 h-[360px] bg-[#070b13] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent z-10" />
              
              {/* Animated Map grid representing scanning */}
              <div className="absolute inset-0 opacity-20 grid grid-cols-10 grid-rows-6 border border-emerald-500/10">
                {Array.from({ length: 60 }).map((_, i) => (
                  <div key={i} className="border-r border-b border-emerald-500/20 relative">
                    {Math.random() > 0.85 && <div className="absolute inset-0 bg-emerald-500/10 animate-ping"></div>}
                  </div>
                ))}
              </div>

              {/* Scanning visual effect */}
              {satelliteSyncing && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent top-0 animate-[bounce_2.5s_infinite] shadow-[0_0_15px_rgba(34,211,238,0.8)] z-20" />
              )}

              {/* Tile data overlay */}
              <div className="relative z-20 text-center space-y-4 max-w-md p-6">
                <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto text-cyan-400 mb-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                  <Globe className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-slate-100">Cuadrante Tile: T17MQT</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Pasada de órbita descendente Sentinel-2A. Resolución de bandas SWIR, NIR y RedEdge a 10m y 20m, calibradas con reflectancia del suelo.
                </p>
                <div className="grid grid-cols-3 gap-4 text-xs font-semibold pt-4">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <p className="text-slate-500 uppercase text-[9px]">Nubosidad</p>
                    <p className="text-emerald-400 font-bold mt-1">1.8%</p>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <p className="text-slate-500 uppercase text-[9px]">Último Paso</p>
                    <p className="text-slate-300 font-bold mt-1">Hoy 11:20 AM</p>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <p className="text-slate-500 uppercase text-[9px]">Calidad</p>
                    <p className="text-cyan-400 font-bold mt-1">Óptima (98%)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Satellite Math Equations explainers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                <h4 className="font-semibold text-slate-200 text-sm mb-1.5 text-emerald-400">NDVI (Vigor Foliar)</h4>
                <p className="text-xs text-slate-400 mb-3">Índice de Diferencia Normalizada de Vegetación para medir salud y clorofila.</p>
                <code className="text-[10px] bg-slate-950 p-2 rounded block text-slate-400 text-center font-mono">
                  NDVI = (B8 - B4) / (B8 + B4)
                </code>
              </div>
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                <h4 className="font-semibold text-slate-200 text-sm mb-1.5 text-blue-400">NDWI (Humedad Foliar)</h4>
                <p className="text-xs text-slate-400 mb-3">Índice de Diferencia Normalizada de Agua para medir estrés hídrico de raíces.</p>
                <code className="text-[10px] bg-slate-950 p-2 rounded block text-slate-400 text-center font-mono">
                  NDWI = (B8 - B11) / (B8 + B11)
                </code>
              </div>
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                <h4 className="font-semibold text-slate-200 text-sm mb-1.5 text-rose-400">NDSI (Índice de Salinidad)</h4>
                <p className="text-xs text-slate-400 mb-3">Permite detectar la reflectancia de sales blancas depositadas en superficie.</p>
                <code className="text-[10px] bg-slate-950 p-2 rounded block text-slate-400 text-center font-mono">
                  NDSI = sqrt(B4 * B8)
                </code>
              </div>
            </div>
          </div>

          {/* Right column - Satellite Ground calibration status */}
          <div className="space-y-6">
            <div className="glass-panel border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                <Database className="w-5 h-5 text-emerald-400 mr-2" />
                Calibración de Banda Terrestre
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Los datos satelitales a menudo sufren distorsión atmosférica. Edafo-OS aplica una correlación matemática con los sensores terrestres para ajustar las curvas espectrales en tiempo real.
              </p>

              <div className="space-y-4">
                <CalibrationItem name="Ajuste Atmosférico" value="Aerosol (Sen2Cor) Activo" status="success" />
                <CalibrationItem name="Correlación Ground-Truth" value="R² = 0.941 (Excelente)" status="success" />
                <CalibrationItem name="Calibración NDSI" value="Desviación de Canal: -0.012" status="warning" />
                <CalibrationItem name="Resolución Espacial" value="Remuestreo 10m Bicúbico" status="success" />
              </div>

              <div className="mt-8 p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg text-xs text-slate-400">
                <p className="font-bold text-slate-300 mb-1">Nota de Calibración:</p>
                <p className="leading-relaxed">
                  La correlación entre el índice de salinidad satelital (NDSI) y la conductividad eléctrica de suelo medida a 20cm (CE_20) está optimizada para suelos tipo Franco-Arcilloso en Piura.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalibrationItem({ name, value, status }: { name: string; value: string; status: 'success' | 'warning' | 'error' }) {
  const dotColor = status === 'success' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs">
      <div>
        <p className="font-medium text-slate-300">{name}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{value}</p>
      </div>
      <span className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`}></span>
    </div>
  );
}
