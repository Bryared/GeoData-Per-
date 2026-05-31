import { useState, useEffect, useRef, useMemo } from 'react';
import { Activity, Wifi, Battery, Play, Pause, RefreshCw, Globe, Database, Cpu, AlertTriangle, Flame, AlertCircle, Droplets } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { type TelemetryData } from '../../utils/engine';
import { soilAPI } from '../../utils/api';
import { useDimension } from '../../context/DimensionContext';
import { cn } from '../../utils/cn';

const getNodeIcon = (id: string) => {
  if (id.startsWith('TH-PYRO')) return <Flame className="w-4 h-4 mr-2 text-orange-400" />;
  if (id.startsWith('SL-INCL')) return <AlertTriangle className="w-4 h-4 mr-2 text-rose-455 animate-pulse" />;
  if (id.startsWith('WQ-WELL')) return <Droplets className="w-4 h-4 mr-2 text-cyan-400" />;
  if (id.startsWith('HM-FLOW')) return <Activity className="w-4 h-4 mr-2 text-blue-400 animate-pulse" />;
  if (id.startsWith('ANP-ALRT')) return <AlertCircle className="w-4 h-4 mr-2 text-emerald-400 animate-pulse" />;
  return <Cpu className="w-4 h-4 mr-2 text-slate-400" />;
};

export function Telemetria() {
  const { dimension, setDimension } = useDimension();
  const [baseSensors, setBaseSensors] = useState<TelemetryData[]>([]);
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [loraLogs, setLoraLogs] = useState<string[]>([]);
  const [satelliteSyncing, setSatelliteSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'iot' | 'satellite'>('iot');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const theme = useMemo(() => {
    if (dimension === 'desastres') {
      return {
        primary: 'text-rose-405',
        accent: 'rose',
        border: 'border-rose-500/20',
        bg: 'bg-rose-500/5',
        glow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]',
        accentColor: '#f43f5e',
        secondaryColor: '#f97316'
      };
    } else if (dimension === 'recursos') {
      return {
        primary: 'text-cyan-400',
        accent: 'cyan',
        border: 'border-cyan-500/20',
        bg: 'bg-cyan-500/5',
        glow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
        accentColor: '#06b6d4',
        secondaryColor: '#3b82f6'
      };
    } else {
      return {
        primary: 'text-emerald-400',
        accent: 'emerald',
        border: 'border-emerald-500/20',
        bg: 'bg-emerald-500/5',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
        accentColor: '#10b981',
        secondaryColor: '#3b82f6'
      };
    }
  }, [dimension]);

  useEffect(() => {
    const initTelemetry = async () => {
      const connected = await soilAPI.checkConnection();
      const data = await soilAPI.getTelemetryData();
      setBaseSensors(data);

      setLoraLogs([
        `[${new Date().toLocaleTimeString()}] [SYSTEM] GeoTERRA Perú Core initialized.`,
        `[${new Date().toLocaleTimeString()}] [LoRaWAN] Gateway active on 915.2 MHz (AS923). SF7 Spreading Factor.`,
        `[${new Date().toLocaleTimeString()}] [SOLVER PINN] ${connected ? 'Python PINN Solver activo en puerto 8000' : 'Modo Autónomo Activo (Mocks locales)'}`,
        `[${new Date().toLocaleTimeString()}] [INFO] Ingesting multi-dimensional sensor streams...`
      ]);
    };
    initTelemetry();
  }, []);

  const sensors = useMemo(() => {
    if (baseSensors.length === 0) return [];

    if (dimension === 'alimentaria') {
      return baseSensors;
    }

    if (dimension === 'desastres') {
      return baseSensors.slice(0, 8).map((s, idx) => {
        const ids = [
          'SL-INCL-301', 'TH-PYRO-402', 'SEIS-IGP-105', 'SL-INCL-302',
          'TH-PYRO-403', 'SEIS-IGP-106', 'SL-INCL-303', 'TH-PYRO-404'
        ];
        const locations = [
          { lat: -11.942, lng: -76.701, name: 'Chosica (Talud)' },
          { lat: -12.754, lng: -69.182, name: 'Tambopata (Incendios)' },
          { lat: -16.401, lng: -71.535, name: 'Arequipa - Volcán Misti' },
          { lat: -11.981, lng: -76.804, name: 'Huaycoloro (Talud)' },
          { lat: -4.502, lng: -75.301, name: 'Pacaya Samiria' },
          { lat: -12.043, lng: -77.028, name: 'Lima - IGP Central' },
          { lat: -13.161, lng: -74.223, name: 'Ayacucho - Talud' },
          { lat: -3.749, lng: -73.251, name: 'Iquitos (Incendios)' }
        ];

        const pos = locations[idx] || { lat: s.lat, lng: s.lng, name: 'Estación de Emergencia' };
        const id = ids[idx];

        let ec = 0;
        let soilMoisture = 0;
        let pH = 0;

        if (id.startsWith('SL-INCL')) {
          ec = parseFloat((1.2 + (idx % 3) * 2.1 + Math.random() * 0.8).toFixed(1));
          soilMoisture = parseFloat((42.0 + (idx % 2) * 15.0 + Math.random() * 3.0).toFixed(1));
          pH = parseFloat((7.4 - (idx % 2) * 0.6 + Math.random() * 0.2).toFixed(1));
        } else if (id.startsWith('TH-PYRO')) {
          ec = parseFloat((35.0 + (idx % 3) * 45.0 + Math.random() * 12.0).toFixed(1));
          soilMoisture = parseFloat((72.0 + (idx % 2) * 12.0 + Math.random() * 4.0).toFixed(1));
          pH = parseFloat((3.5 + (idx % 2) * 1.5 + Math.random() * 0.5).toFixed(1));
        } else {
          ec = parseFloat((0.02 + (idx % 3) * 0.12 + Math.random() * 0.04).toFixed(3));
          soilMoisture = parseFloat((1.2 + (idx % 2) * 3.1 + Math.random() * 0.6).toFixed(1));
          pH = parseFloat((3.8 + (idx % 2) * 1.6 + Math.random() * 0.4).toFixed(1));
        }

        const d20 = { ec: parseFloat((ec * 0.85).toFixed(2)), moisture: parseFloat((soilMoisture * 0.9).toFixed(1)) };
        const d40 = { ec: parseFloat((ec * 1.05).toFixed(2)), moisture: parseFloat((soilMoisture * 1.0).toFixed(1)) };
        const d60 = { ec: parseFloat((ec * 1.25).toFixed(2)), moisture: parseFloat((soilMoisture * 1.1).toFixed(1)) };

        return {
          ...s,
          id,
          lat: pos.lat,
          lng: pos.lng,
          ec,
          soilMoisture,
          pH,
          nitrogen: Math.floor(10 + Math.random() * 40),
          depths: { depth20cm: d20, depth40cm: d40, depth60cm: d60 }
        };
      });
    }

    return baseSensors.slice(0, 8).map((s, idx) => {
      const ids = [
        'WQ-WELL-501', 'WQ-WELL-502', 'HM-FLOW-601', 'HM-FLOW-602',
        'ANP-ALRT-701', 'ANP-ALRT-702', 'WQ-WELL-503', 'HM-FLOW-603'
      ];
      const locations = [
        { lat: -12.025, lng: -76.921, name: 'Pozo Acuífero Rímac' },
        { lat: -12.064, lng: -75.212, name: 'Pozo Acuífero Mantaro' },
        { lat: -11.503, lng: -77.201, name: 'Estación Chancay' },
        { lat: -5.195, lng: -80.628, name: 'Estación Piura Central' },
        { lat: -12.802, lng: -69.204, name: 'Reserva Tambopata ANP' },
        { lat: -9.102, lng: -77.603, name: 'P.N. Huascarán ANP' },
        { lat: -13.522, lng: -71.971, name: 'Pozo Vilcanota' },
        { lat: -12.122, lng: -77.021, name: 'Cuenca Lurín' }
      ];

      const pos = locations[idx] || { lat: s.lat, lng: s.lng, name: 'Estación de Recursos' };
      const id = ids[idx];

      let ec = 0;
      let soilMoisture = 0;
      let pH = 0;

      if (id.startsWith('WQ-WELL')) {
        ec = parseFloat((0.005 + (idx % 3) * 0.012 + Math.random() * 0.004).toFixed(4));
        soilMoisture = parseFloat((0.001 + (idx % 2) * 0.004 + Math.random() * 0.001).toFixed(4));
        pH = parseFloat((6.7 + (idx % 2) * 0.4 + Math.random() * 0.1).toFixed(1));
      } else if (id.startsWith('HM-FLOW')) {
        ec = parseFloat((8.5 + (idx % 3) * 11.2 + Math.random() * 2.5).toFixed(1));
        soilMoisture = parseFloat((2.5 + (idx % 2) * 2.2 + Math.random() * 0.5).toFixed(1));
        pH = parseFloat((45 + (idx % 2) * 20 + Math.random() * 5).toFixed(1));
      } else {
        ec = parseFloat((0.5 + (idx % 3) * 2.4 + Math.random() * 0.5).toFixed(1));
        soilMoisture = parseFloat((14.0 + (idx % 2) * 8.0 + Math.random() * 2.0).toFixed(1));
        pH = parseFloat(((idx % 2) * 2 + 1).toFixed(1));
      }

      const d20 = { ec: parseFloat((ec * 0.9).toFixed(3)), moisture: parseFloat((soilMoisture * 0.85).toFixed(3)) };
      const d40 = { ec: parseFloat((ec * 1.0).toFixed(3)), moisture: parseFloat((soilMoisture * 1.0).toFixed(3)) };
      const d60 = { ec: parseFloat((ec * 1.15).toFixed(3)), moisture: parseFloat((soilMoisture * 1.15).toFixed(3)) };

      return {
        ...s,
        id,
        lat: pos.lat,
        lng: pos.lng,
        ec,
        soilMoisture,
        pH,
        nitrogen: Math.floor(10 + Math.random() * 40),
        depths: { depth20cm: d20, depth40cm: d40, depth60cm: d60 }
      };
    });
  }, [baseSensors, dimension]);

  const selectedSensor = useMemo(() => {
    if (sensors.length === 0) return null;
    const match = sensors.find(s => s.id === selectedSensorId);
    return match || sensors[0];
  }, [sensors, selectedSensorId]);

  useEffect(() => {
    if (selectedSensor) {
      setSelectedSensorId(selectedSensor.id);
    }
  }, [selectedSensor]);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(async () => {
      await soilAPI.checkConnection();

      setBaseSensors(prev => {
        return prev.map(s => {
          if (Math.random() > 0.7) {
            const ecDelta = parseFloat((Math.random() * 0.2 - 0.1).toFixed(1));
            const newEC = parseFloat(Math.max(0.5, Math.min(16.0, s.ec + ecDelta)).toFixed(1));
            const moistDelta = parseFloat((Math.random() * 1.2 - 0.6).toFixed(1));
            const newMoist = parseFloat(Math.max(4.0, Math.min(45.0, s.soilMoisture + moistDelta)).toFixed(1));

            return {
              ...s,
              ec: newEC,
              soilMoisture: newMoist,
              rssi: Math.min(-60, Math.max(-110, s.rssi + Math.floor(Math.random() * 5 - 2)))
            };
          }
          return s;
        });
      });

      if (sensors.length > 0) {
        const randNode = sensors[Math.floor(Math.random() * sensors.length)];
        let packetLog = '';

        if (dimension === 'alimentaria') {
          packetLog = `[${new Date().toLocaleTimeString()}] [LoRaWAN] RX DevAddr[${randNode.id}] RSSI[${randNode.rssi}dBm] CE[${randNode.ec}dS/m] Hum[${randNode.soilMoisture}%] pH[${randNode.pH}]`;
        } else if (dimension === 'desastres') {
          if (randNode.id.startsWith('SL-INCL')) {
            packetLog = `[${new Date().toLocaleTimeString()}] [INCLINOMETER] DevAddr[${randNode.id}] RSSI[${randNode.rssi}dBm] Displacement: ${randNode.ec}mm/h | Soil Sat: ${randNode.soilMoisture}% | SF: ${randNode.pH}`;
            if (randNode.ec > 4.5) {
              packetLog += ` -- ⚠️ HIGH ALARM (STEEP SHIFT)`;
            }
          } else if (randNode.id.startsWith('TH-PYRO')) {
            packetLog = `[${new Date().toLocaleTimeString()}] [PYROMETER] DevAddr[${randNode.id}] RSSI[${randNode.rssi}dBm] Temp: ${randNode.ec}°C | Dry Index: ${randNode.soilMoisture}% | Threat: ${randNode.pH}`;
            if (randNode.ec > 80.0) {
              packetLog += ` -- 🔥 FLAME DETECTED (MADRE DE DIOS)`;
            }
          } else {
            packetLog = `[${new Date().toLocaleTimeString()}] [SEISMIC] DevAddr[${randNode.id}] Accel: ${randNode.ec}g | Freq: ${randNode.soilMoisture}Hz | Local Mw: ${randNode.pH}`;
          }
        } else {
          if (randNode.id.startsWith('WQ-WELL')) {
            packetLog = `[${new Date().toLocaleTimeString()}] [AQUIFER-WQ] DevAddr[${randNode.id}] Lead: ${randNode.ec}ppm | Arsenic: ${randNode.soilMoisture}ppm | pH: ${randNode.pH}`;
            if (randNode.ec > 0.03) {
              packetLog += ` -- ☠️ HEAVY METALS WARNING`;
            }
          } else if (randNode.id.startsWith('HM-FLOW')) {
            packetLog = `[${new Date().toLocaleTimeString()}] [HYDROMETRIC] DevAddr[${randNode.id}] Stream: ${randNode.ec}m³/s | Infiltration: ${randNode.soilMoisture}m/d | Gate: ${randNode.pH}%`;
          } else {
            packetLog = `[${new Date().toLocaleTimeString()}] [ANP-RADAR] DevAddr[${randNode.id}] Intrusion detected: ${randNode.ec}Ha | Canopy Loss: ${randNode.soilMoisture}% | Alert Tier: ${randNode.pH}`;
          }
        }

        setLoraLogs(logs => [...logs, packetLog].slice(-100));
      }

    }, 3500);

    return () => clearInterval(interval);
  }, [isLive, sensors, dimension]);

  useEffect(() => {
    // Scroll solo dentro del contenedor del terminal, sin afectar la barra lateral de la página
    const terminalEl = terminalEndRef.current?.parentElement;
    if (terminalEl) {
      terminalEl.scrollTop = terminalEl.scrollHeight;
    }
  }, [loraLogs]);

  const handleSatelliteSync = () => {
    setSatelliteSyncing(true);
    setLoraLogs(logs => [
      ...logs,
      `[${new Date().toLocaleTimeString()}] [SATELLITE] Requesting Copernicus Sentinel-2 Level-2A Ortho-rectified Tile...`,
      `[${new Date().toLocaleTimeString()}] [SATELLITE] Ortho-rectifying Bounding Box coordinate quadrant.`,
      `[${new Date().toLocaleTimeString()}] [SATELLITE] Atmospheric correction Sen2Cor actively mapping...`
    ]);
    setTimeout(() => {
      setSatelliteSyncing(false);
      setLoraLogs(logs => [
        ...logs,
        `[${new Date().toLocaleTimeString()}] [SATELLITE] Copernicus Sync Complete! Calibrated indexes (Holdout Validation R²=0.941).`
      ]);
    }, 2500);
  };

  const profileChartData = useMemo(() => {
    if (!selectedSensor) return [];

    if (dimension === 'alimentaria') {
      return [
        { name: '20 cm (Arable)', CE: selectedSensor.depths.depth20cm.ec, Humedad: selectedSensor.depths.depth20cm.moisture },
        { name: '40 cm (Raíces)', CE: selectedSensor.depths.depth40cm.ec, Humedad: selectedSensor.depths.depth40cm.moisture },
        { name: '60 cm (Subsuelo)', CE: selectedSensor.depths.depth60cm.ec, Humedad: selectedSensor.depths.depth60cm.moisture }
      ];
    } else if (dimension === 'desastres') {
      if (selectedSensor.id.startsWith('SL-INCL')) {
        return [
          { name: 'Superficie', Desplazamiento: selectedSensor.depths.depth20cm.ec, Humedad: selectedSensor.depths.depth20cm.moisture },
          { name: 'Falla (15m)', Desplazamiento: selectedSensor.depths.depth40cm.ec, Humedad: selectedSensor.depths.depth40cm.moisture },
          { name: 'Anclaje (30m)', Desplazamiento: selectedSensor.depths.depth60cm.ec, Humedad: selectedSensor.depths.depth60cm.moisture }
        ];
      } else if (selectedSensor.id.startsWith('TH-PYRO')) {
        return [
          { name: 'Dorsal Izq', Temperatura: selectedSensor.depths.depth20cm.ec, Propagacion: selectedSensor.depths.depth20cm.moisture },
          { name: 'Frente Fuego', Temperatura: selectedSensor.depths.depth40cm.ec, Propagacion: selectedSensor.depths.depth40cm.moisture },
          { name: 'Dorsal Der', Temperatura: selectedSensor.depths.depth60cm.ec, Propagacion: selectedSensor.depths.depth60cm.moisture }
        ];
      } else {
        return [
          { name: 'Canal X (E-W)', Aceleracion: selectedSensor.depths.depth20cm.ec, Frecuencia: selectedSensor.depths.depth20cm.moisture },
          { name: 'Canal Y (N-S)', Aceleracion: selectedSensor.depths.depth40cm.ec, Frecuencia: selectedSensor.depths.depth40cm.moisture },
          { name: 'Canal Z (Vert)', Aceleracion: selectedSensor.depths.depth60cm.ec, Frecuencia: selectedSensor.depths.depth60cm.moisture }
        ];
      }
    } else {
      if (selectedSensor.id.startsWith('WQ-WELL')) {
        return [
          { name: 'Freatímetro (5m)', Plomo: selectedSensor.depths.depth20cm.ec * 1000, Arsenico: selectedSensor.depths.depth20cm.moisture * 1000 },
          { name: 'Acuífero (20m)', Plomo: selectedSensor.depths.depth40cm.ec * 1000, Arsenico: selectedSensor.depths.depth40cm.moisture * 1000 },
          { name: 'Filtro (40m)', Plomo: selectedSensor.depths.depth60cm.ec * 1000, Arsenico: selectedSensor.depths.depth60cm.moisture * 1000 }
        ];
      } else if (selectedSensor.id.startsWith('HM-FLOW')) {
        return [
          { name: 'Canal Entrada', Caudal: selectedSensor.depths.depth20cm.ec, Compuerta: selectedSensor.depths.depth20cm.moisture },
          { name: 'Umbral Central', Caudal: selectedSensor.depths.depth40cm.ec, Compuerta: selectedSensor.depths.depth40cm.moisture },
          { name: 'Desvío Recarga', Caudal: selectedSensor.depths.depth60cm.ec, Compuerta: selectedSensor.depths.depth60cm.moisture }
        ];
      } else {
        return [
          { name: 'Banda Radial', Intrusion: selectedSensor.depths.depth20cm.ec, PerdidaDosel: selectedSensor.depths.depth20cm.moisture },
          { name: 'Núcleo ANP', Intrusion: selectedSensor.depths.depth40cm.ec, PerdidaDosel: selectedSensor.depths.depth40cm.moisture },
          { name: 'Zona de Amortiguamiento', Intrusion: selectedSensor.depths.depth60cm.ec, PerdidaDosel: selectedSensor.depths.depth60cm.moisture }
        ];
      }
    }
  }, [selectedSensor, dimension]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center">
            <Activity className={cn("w-8 h-8 mr-3 animate-pulse", theme.primary)} />
            {dimension === 'alimentaria' && "Telemetría Avanzada GeoTERRA"}
            {dimension === 'desastres' && "Telemetría de Catástrofes — Módulo Riesgos"}
            {dimension === 'recursos' && "Telemetría Hidrológica — Agua y Recursos"}
          </h1>
          <p className="text-slate-400 mt-1">
            {dimension === 'alimentaria' && "Ingesta en tiempo real e índices satelitales calibrados - Valle del Bajo Piura"}
            {dimension === 'desastres' && "Inclinómetros de talud, pirómetros de incendios y acelerómetros sísmicos en vivo"}
            {dimension === 'recursos' && "Pozo electroquímico de metales pesados y cuencas de recarga acuífera"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-800/60 border border-slate-700/80 rounded-lg px-3 py-1.5 shadow-md">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Módulo Core:</span>
            <select
              value={dimension}
              onChange={(e) => setDimension(e.target.value as any)}
              className={cn("bg-transparent border-none outline-none text-xs font-black cursor-pointer", theme.primary)}
            >
              <option value="alimentaria">Seguridad Alimentaria (Edafo-OS)</option>
              <option value="desastres">Gestión de Desastres (Módulo Riesgos)</option>
              <option value="recursos">Hidrología &amp; Reservas (Módulo Hídrico)</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('iot')}
              className={cn(
                "px-4 py-1.5 text-sm font-semibold rounded-md transition-all",
                activeTab === 'iot'
                  ? `bg-slate-700/50 ${theme.primary} border border-slate-650/40`
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Nodos IoT
            </button>
            <button
              onClick={() => setActiveTab('satellite')}
              className={cn(
                "px-4 py-1.5 text-sm font-semibold rounded-md transition-all",
                activeTab === 'satellite'
                  ? `bg-slate-700/50 ${theme.primary} border border-slate-650/40`
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Sentinel Satelital
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'iot' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          <div className="xl:col-span-2 space-y-6">
            <div className="glass-panel border border-slate-700/50 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-200 flex items-center">
                  <Database className={cn("w-5 h-5 mr-2", theme.primary)} />
                  {dimension === 'alimentaria' && `Módulos GDT360 Arables (${sensors.length} Activos)`}
                  {dimension === 'desastres' && `Estaciones Mecatrónicas de Emergencia (${sensors.length} Activos)`}
                  {dimension === 'recursos' && `Freatímetros & Sensores de Intrusión (${sensors.length} Activos)`}
                </h2>
                <div className="flex items-center space-x-2">
                  <span className={cn("w-2 h-2 rounded-full animate-pulse", isLive ? 'bg-emerald-400' : 'bg-slate-500')}></span>
                  <span className="text-xs text-slate-400 uppercase tracking-wider">{isLive ? 'Stream Vivo' : 'Pausado'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[460px] overflow-y-auto pr-2 scrollbar-thin">
                {sensors.map(s => {
                  const isSelected = selectedSensor?.id === s.id;
                  let signalColor = 'text-emerald-400';
                  if (s.rssi < -95) signalColor = 'text-rose-455';
                  else if (s.rssi < -80) signalColor = 'text-amber-400';

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSensorId(s.id)}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer hover:border-slate-500/40",
                        isSelected
                          ? `${theme.bg} border-2 ${theme.border} ${theme.glow}`
                          : 'bg-slate-800/40 border-slate-700/50'
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          {getNodeIcon(s.id)}
                          <span className="font-bold text-sm text-slate-200">{s.id}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                          <Battery className="w-3.5 h-3.5" />
                          <span>{s.batteryLevel}%</span>
                        </div>
                      </div>

                      {dimension === 'alimentaria' && (
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3 text-slate-300">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Salinidad</p>
                            <p className="font-semibold text-emerald-400">{s.ec} dS/m</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Humedad</p>
                            <p className="font-semibold text-blue-400">{s.soilMoisture}%</p>
                          </div>
                        </div>
                      )}

                      {dimension === 'desastres' && (
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3 text-slate-300">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">
                              {s.id.startsWith('SL-INCL') ? 'Desplazam.' : s.id.startsWith('TH-PYRO') ? 'Foco Calor' : 'Aceleración'}
                            </p>
                            <p className={cn("font-semibold", theme.primary)}>
                              {s.id.startsWith('SL-INCL') ? `${s.ec} mm/h` : s.id.startsWith('TH-PYRO') ? `${s.ec} °C` : `${s.ec} g`}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">
                              {s.id.startsWith('SL-INCL') ? 'Humedad Talud' : s.id.startsWith('TH-PYRO') ? 'Riesgo Propag.' : 'Frecuencia'}
                            </p>
                            <p className="font-semibold text-slate-300">
                              {s.id.startsWith('SL-INCL') ? `${s.soilMoisture}%` : s.id.startsWith('TH-PYRO') ? `${s.soilMoisture}%` : `${s.soilMoisture} Hz`}
                            </p>
                          </div>
                        </div>
                      )}

                      {dimension === 'recursos' && (
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3 text-slate-300">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">
                              {s.id.startsWith('WQ-WELL') ? 'Plomo (Pb)' : s.id.startsWith('HM-FLOW') ? 'Caudal' : 'Intrusión'}
                            </p>
                            <p className={cn("font-semibold", theme.primary)}>
                              {s.id.startsWith('WQ-WELL') ? `${s.ec} ppm` : s.id.startsWith('HM-FLOW') ? `${s.ec} m³/s` : `${s.ec} Ha`}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">
                              {s.id.startsWith('WQ-WELL') ? 'Arsénico (As)' : s.id.startsWith('HM-FLOW') ? 'Infiltración' : 'Pérdida Dosel'}
                            </p>
                            <p className="font-semibold text-slate-300">
                              {s.id.startsWith('WQ-WELL') ? `${s.soilMoisture} ppm` : s.id.startsWith('HM-FLOW') ? `${s.soilMoisture} m/d` : `${s.soilMoisture}%`}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[10px] pt-2 border-t border-slate-700/30">
                        <span className="text-slate-500">Coord: {s.lat.toFixed(3)}, {s.lng.toFixed(3)}</span>
                        <div className="flex items-center space-x-1">
                          <Wifi className={cn("w-3.5 h-3.5", signalColor)} />
                          <span className={signalColor}>{s.rssi}dBm</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-panel border border-slate-700/50 rounded-xl p-5 bg-[#070b13] flex flex-col h-[280px]">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full mr-2 animate-ping"></span>
                  Terminal Ingesta LoRaWAN GeoTERRA (Valle del Bajo Piura & Andes)
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsLive(!isLive)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
                  >
                    {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto font-mono text-[11px] text-emerald-400/90 space-y-1 bg-[#03050a] p-3 rounded-lg border border-slate-900 shadow-inner select-text">
                {loraLogs.map((log, index) => {
                  let logColor = 'text-emerald-400/90';
                  if (log.includes('WARNING') || log.includes('ALARM') || log.includes('FLAME') || log.includes('⚠️') || log.includes('🔥')) {
                    logColor = 'text-rose-455 font-black animate-pulse';
                  } else if (log.includes('SYSTEM') || log.includes('SATELLITE')) {
                    logColor = 'text-cyan-400';
                  }
                  return (
                    <div key={index} className={cn("leading-5 hover:bg-slate-850 px-1 py-0.5 rounded transition-colors", logColor)}>{log}</div>
                  );
                })}
                <div ref={terminalEndRef} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {selectedSensor ? (
              <div className="glass-panel border border-slate-700/50 rounded-xl p-6 flex flex-col h-full">
                <div className="pb-4 border-b border-slate-700/50 mb-6">
                  <h3 className="text-lg font-semibold text-slate-200">
                    {dimension === 'alimentaria' && `Perfil de Suelo: ${selectedSensor.id}`}
                    {dimension === 'desastres' && `Monitoreo Físico: ${selectedSensor.id}`}
                    {dimension === 'recursos' && `Rastreo Hidrológico: ${selectedSensor.id}`}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {dimension === 'alimentaria' && "Estructura subsuperficial a 20, 40 y 60cm de profundidad"}
                    {dimension === 'desastres' && "Componente físico y propagación de onda o temperatura"}
                    {dimension === 'recursos' && "Gradientes de metales, caudales de compuerta e intrusiones"}
                  </p>
                </div>

                {dimension === 'alimentaria' && (
                  <div className="grid grid-cols-3 gap-3 mb-6 text-center text-xs">
                    <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/40">
                      <p className="text-slate-400 text-[10px]">pH Suelo</p>
                      <p className="text-base font-bold text-slate-200 mt-1">{selectedSensor.pH}</p>
                    </div>
                    <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/40">
                      <p className="text-slate-400 text-[10px]">Nitrógeno (N)</p>
                      <p className="text-base font-bold text-emerald-400 mt-1">{selectedSensor.nitrogen} <span className="text-[9px] text-slate-500 font-normal">mg/kg</span></p>
                    </div>
                    <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/40">
                      <p className="text-slate-400 text-[10px]">Fósforo (P)</p>
                      <p className="text-base font-bold text-amber-500 mt-1">{selectedSensor.nitrogen - 15} <span className="text-[9px] text-slate-500 font-normal">mg/kg</span></p>
                    </div>
                  </div>
                )}

                {dimension === 'desastres' && (
                  <div className="grid grid-cols-3 gap-3 mb-6 text-center text-xs">
                    <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/40">
                      <p className="text-slate-400 text-[10px]">
                        {selectedSensor.id.startsWith('SL-INCL') ? 'Ángulo Talud' : selectedSensor.id.startsWith('TH-PYRO') ? 'Threat Lvl' : 'Aceleración'}
                      </p>
                      <p className="text-base font-bold text-rose-455 mt-1">
                        {selectedSensor.id.startsWith('SL-INCL') ? '24.2°' : selectedSensor.id.startsWith('TH-PYRO') ? `${selectedSensor.pH}/10` : `${selectedSensor.ec}g`}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/40">
                      <p className="text-slate-400 text-[10px]">
                        {selectedSensor.id.startsWith('SL-INCL') ? 'Desplazam.' : selectedSensor.id.startsWith('TH-PYRO') ? 'Frente Temp' : 'Magnitud'}
                      </p>
                      <p className="text-base font-bold text-amber-400 mt-1">
                        {selectedSensor.id.startsWith('SL-INCL') ? `${selectedSensor.ec} mm/h` : selectedSensor.id.startsWith('TH-PYRO') ? `${selectedSensor.ec}°C` : `${selectedSensor.pH} Mw`}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/40">
                      <p className="text-slate-400 text-[10px]">Humedad/Riesgo</p>
                      <p className="text-base font-bold text-blue-450 mt-1">{selectedSensor.soilMoisture}%</p>
                    </div>
                  </div>
                )}

                {dimension === 'recursos' && (
                  <div className="grid grid-cols-3 gap-3 mb-6 text-center text-xs">
                    <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/40">
                      <p className="text-slate-400 text-[10px]">
                        {selectedSensor.id.startsWith('WQ-WELL') ? 'Agua pH' : selectedSensor.id.startsWith('HM-FLOW') ? 'Gate Open' : 'Alerta Tier'}
                      </p>
                      <p className="text-base font-bold text-slate-200 mt-1">
                        {selectedSensor.id.startsWith('WQ-WELL') ? selectedSensor.pH : selectedSensor.id.startsWith('HM-FLOW') ? `${Math.round(selectedSensor.pH)}%` : `Tier ${selectedSensor.pH}`}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/40">
                      <p className="text-slate-400 text-[10px]">
                        {selectedSensor.id.startsWith('WQ-WELL') ? 'Lead (Pb)' : selectedSensor.id.startsWith('HM-FLOW') ? 'Caudal' : 'Intrusión'}
                      </p>
                      <p className="text-base font-bold text-cyan-400 mt-1">
                        {selectedSensor.id.startsWith('WQ-WELL') ? `${selectedSensor.ec} ppm` : selectedSensor.id.startsWith('HM-FLOW') ? `${selectedSensor.ec} m³/s` : `${selectedSensor.ec} Ha`}
                      </p>
                    </div>
                    <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-700/40">
                      <p className="text-slate-400 text-[10px]">
                        {selectedSensor.id.startsWith('WQ-WELL') ? 'Arsenic (As)' : selectedSensor.id.startsWith('HM-FLOW') ? 'Infiltración' : 'Perd. Dosel'}
                      </p>
                      <p className="text-base font-bold text-blue-400 mt-1">
                        {selectedSensor.id.startsWith('WQ-WELL') ? `${selectedSensor.soilMoisture} ppm` : selectedSensor.id.startsWith('HM-FLOW') ? `${selectedSensor.soilMoisture} m/d` : `${selectedSensor.soilMoisture}%`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="h-60 w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profileChartData as any[]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                        itemStyle={{ fontSize: 11 }}
                      />
                      {dimension === 'alimentaria' && (
                        <>
                          <Bar dataKey="CE" fill="#10b981" radius={[4, 4, 0, 0]} name="CE (dS/m)" />
                          <Bar dataKey="Humedad" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Humedad (%)" />
                        </>
                      )}
                      {dimension === 'desastres' && (
                        <>
                          {selectedSensor.id.startsWith('SL-INCL') && (
                            <>
                              <Bar dataKey="Desplazamiento" fill="#ef4444" radius={[4, 4, 0, 0]} name="Desplazamiento (mm/h)" />
                              <Bar dataKey="Humedad" fill="#f97316" radius={[4, 4, 0, 0]} name="Humedad Talud (%)" />
                            </>
                          )}
                          {selectedSensor.id.startsWith('TH-PYRO') && (
                            <>
                              <Bar dataKey="Temperatura" fill="#f97316" radius={[4, 4, 0, 0]} name="Temperatura (°C)" />
                              <Bar dataKey="Propagacion" fill="#ef4444" radius={[4, 4, 0, 0]} name="Spread Risk (%)" />
                            </>
                          )}
                          {!selectedSensor.id.startsWith('SL-INCL') && !selectedSensor.id.startsWith('TH-PYRO') && (
                            <>
                              <Bar dataKey="Aceleracion" fill="#ef4444" radius={[4, 4, 0, 0]} name="Aceleración (g)" />
                              <Bar dataKey="Frecuencia" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Frecuencia (Hz)" />
                            </>
                          )}
                        </>
                      )}
                      {dimension === 'recursos' && (
                        <>
                          {selectedSensor.id.startsWith('WQ-WELL') && (
                            <>
                              <Bar dataKey="Plomo" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Plomo (ppb)" />
                              <Bar dataKey="Arsenico" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Arsénico (ppb)" />
                            </>
                          )}
                          {selectedSensor.id.startsWith('HM-FLOW') && (
                            <>
                              <Bar dataKey="Caudal" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Caudal (m³/s)" />
                              <Bar dataKey="Compuerta" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Apertura Compuerta (%)" />
                            </>
                          )}
                          {selectedSensor.id.startsWith('ANP-ALRT') && (
                            <>
                              <Bar dataKey="Intrusion" fill="#10b981" radius={[4, 4, 0, 0]} name="Área Intrusión (Ha)" />
                              <Bar dataKey="PerdidaDosel" fill="#ef4444" radius={[4, 4, 0, 0]} name="Pérdida Dosel (%)" />
                            </>
                          )}
                        </>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 space-y-3 text-xs text-slate-400 flex-1">
                  {dimension === 'alimentaria' && (
                    <>
                      <div className="flex justify-between items-center text-slate-300 font-bold border-b border-slate-800 pb-2">
                        <span>Capa Suelo</span>
                        <span>CE (dS/m)</span>
                        <span>Humedad (%)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 font-medium">20cm (Superior)</span>
                        <span className="text-emerald-400 font-semibold">{selectedSensor.depths.depth20cm.ec} dS/m</span>
                        <span className="text-blue-400 font-semibold">{selectedSensor.depths.depth20cm.moisture}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 font-medium">40cm (Raíces)</span>
                        <span className="text-emerald-400 font-semibold">{selectedSensor.depths.depth40cm.ec} dS/m</span>
                        <span className="text-blue-400 font-semibold">{selectedSensor.depths.depth40cm.moisture}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 font-medium">60cm (Subsuelo)</span>
                        <span className="text-emerald-400 font-semibold">{selectedSensor.depths.depth60cm.ec} dS/m</span>
                        <span className="text-blue-400 font-semibold">{selectedSensor.depths.depth60cm.moisture}%</span>
                      </div>
                      <p className="text-[10px] text-slate-500 italic mt-2 leading-relaxed">
                        *El gradiente salino ascendente indica capilaridad activa desde el nivel freático. Se aconseja lixiviación hídrica (fracción de lavado).
                      </p>
                    </>
                  )}

                  {dimension === 'desastres' && (
                    <>
                      <div className="flex justify-between items-center text-slate-300 font-bold border-b border-slate-800 pb-2">
                        <span>Profundidad</span>
                        <span>Métrica Inferencia</span>
                        <span>Variación</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 font-medium">Superficial</span>
                        <span className="text-rose-455 font-semibold">{selectedSensor.depths.depth20cm.ec}</span>
                        <span className="text-slate-300 font-semibold">{selectedSensor.depths.depth20cm.moisture}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 font-medium">Intermedia</span>
                        <span className="text-rose-455 font-semibold">{selectedSensor.depths.depth40cm.ec}</span>
                        <span className="text-slate-300 font-semibold">{selectedSensor.depths.depth40cm.moisture}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 font-medium">Basamento</span>
                        <span className="text-rose-455 font-semibold">{selectedSensor.depths.depth60cm.ec}</span>
                        <span className="text-slate-300 font-semibold">{selectedSensor.depths.depth60cm.moisture}%</span>
                      </div>
                      <p className="text-[10px] text-slate-500 italic mt-2 leading-relaxed">
                        *Inferencia basada en la Ley de Herschel-Bulkley para deslizamientos e Invarianza Sísmica IGP para aceleración de ondas mecánicas.
                      </p>
                    </>
                  )}

                  {dimension === 'recursos' && (
                    <>
                      <div className="flex justify-between items-center text-slate-300 font-bold border-b border-slate-800 pb-2">
                        <span>Acuífero Perfil</span>
                        <span>Elemento Pb/Flujo</span>
                        <span>As/Gate</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 font-medium">Espejo Agua (5m)</span>
                        <span className="text-cyan-400 font-semibold">{selectedSensor.depths.depth20cm.ec}</span>
                        <span className="text-blue-400 font-semibold">{selectedSensor.depths.depth20cm.moisture}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 font-medium">Filtro Medio (20m)</span>
                        <span className="text-cyan-400 font-semibold">{selectedSensor.depths.depth40cm.ec}</span>
                        <span className="text-blue-400 font-semibold">{selectedSensor.depths.depth40cm.moisture}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 font-medium">Fondo Roca (40m)</span>
                        <span className="text-cyan-400 font-semibold">{selectedSensor.depths.depth60cm.ec}</span>
                        <span className="text-blue-400 font-semibold">{selectedSensor.depths.depth60cm.moisture}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 italic mt-2 leading-relaxed">
                        *Modelo acoplado con Ley de Green-Ampt para flujos de infiltración rápida y Convección-Dispersión para plumas de contaminación por metales.
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-panel border border-slate-700/50 rounded-xl p-6 text-center text-slate-400">
                Selecciona un nodo sensor para graficar perfiles físicos.
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel border border-slate-700/50 rounded-xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-200 flex items-center">
                <Globe className="w-5 h-5 text-cyan-400 mr-2" />
                Copernicus Sentinel-2 - Ingesta Geoespacial
              </h2>
              <button
                onClick={handleSatelliteSync}
                disabled={satelliteSyncing}
                className={cn(
                  "flex items-center px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm font-semibold",
                  theme.primary
                )}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", satelliteSyncing ? 'animate-spin' : '')} />
                {satelliteSyncing ? 'Sincronizando...' : 'Consultar Sentinel-2'}
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-700/50 h-[360px] bg-[#070b13] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent z-10" />

              <div className="absolute inset-0 opacity-20 grid grid-cols-10 grid-rows-6 border border-emerald-500/10">
                {Array.from({ length: 60 }).map((_, i) => (
                  <div key={i} className="border-r border-b border-slate-700/20 relative">
                    {Math.random() > 0.85 && <div className="absolute inset-0 bg-cyan-500/5 animate-ping"></div>}
                  </div>
                ))}
              </div>

              {satelliteSyncing && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent top-0 animate-[bounce_2.5s_infinite] shadow-[0_0_15px_rgba(6,182,212,0.8)] z-20" />
              )}

              <div className="relative z-20 text-center space-y-4 max-w-md p-6">
                <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto text-cyan-400 mb-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                  <Globe className="w-8 h-8 animate-pulse" />
                </div>

                {dimension === 'alimentaria' && (
                  <>
                    <h3 className="text-xl font-bold text-slate-100">Cuadrante Tile: T17MQT</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Pasada de órbita descendente Sentinel-2A. Resolución de bandas SWIR, NIR y RedEdge a 10m y 20m, calibradas con conductividad del suelo.
                    </p>
                  </>
                )}
                {dimension === 'desastres' && (
                  <>
                    <h3 className="text-xl font-bold text-slate-100">Cuadrante Emergencias: T18LQT</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Órbita polar activa. Captura de firma infrarroja de onda corta (SWIR) para detección de incendios y coherencia de fase SAR (Sentinel-1) para deslizamientos.
                    </p>
                  </>
                )}
                {dimension === 'recursos' && (
                  <>
                    <h3 className="text-xl font-bold text-slate-100">Cuadrante Acuífero: T17MRT</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Remuestreo dinámico de cuencas de agua dulce superficial y delimitación de biomasa forestal en Áreas Naturales Protegidas (ANP).
                    </p>
                  </>
                )}

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {dimension === 'alimentaria' && (
                <>
                  <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                    <h4 className="font-semibold text-slate-200 text-sm mb-1.5 text-emerald-400">NDVI (Vigor Foliar)</h4>
                    <p className="text-xs text-slate-400 mb-3">Medición de vigor vegetativo, clorofila y fotosíntesis activa en arroz y maíz.</p>
                    <code className="text-[10px] bg-slate-950 p-2 rounded block text-slate-400 text-center font-mono font-bold">
                      NDVI = (B8 - B4) / (B8 + B4)
                    </code>
                  </div>
                  <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                    <h4 className="font-semibold text-slate-200 text-sm mb-1.5 text-blue-450">NDWI (Humedad Foliar)</h4>
                    <p className="text-xs text-slate-400 mb-3">Mide el estrés hídrico foliar absorbiendo las reflectancias del canal NIR y SWIR.</p>
                    <code className="text-[10px] bg-slate-950 p-2 rounded block text-slate-400 text-center font-mono font-bold">
                      NDWI = (B8 - B11) / (B8 + B11)
                    </code>
                  </div>
                  <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                    <h4 className="font-semibold text-slate-200 text-sm mb-1.5 text-amber-500">NDSI (Índice de Salinidad)</h4>
                    <p className="text-xs text-slate-400 mb-3">Detecta la reflectancia de costras salinas depositadas en suelos áridos costeros.</p>
                    <code className="text-[10px] bg-slate-950 p-2 rounded block text-slate-400 text-center font-mono font-bold">
                      NDSI = sqrt(B4 * B8)
                    </code>
                  </div>
                </>
              )}

              {dimension === 'desastres' && (
                <>
                  <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                    <h4 className="font-semibold text-slate-200 text-sm mb-1.5 text-rose-455">NBR (Fuego Activo)</h4>
                    <p className="text-xs text-slate-400 mb-3">Índice de severidad de quemaduras forestales en Amazonía por banda NIR/SWIR.</p>
                    <code className="text-[10px] bg-slate-950 p-2 rounded block text-slate-400 text-center font-mono font-bold">
                      NBR = (B8 - B12) / (B8 + B12)
                    </code>
                  </div>
                  <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                    <h4 className="font-semibold text-slate-200 text-sm mb-1.5 text-orange-455">NDFI (Tala Selectiva)</h4>
                    <p className="text-xs text-slate-400 mb-3">Monitoreo fraccionario de cobertura verde para alertar sobre degradación forestal.</p>
                    <code className="text-[10px] bg-slate-950 p-2 rounded block text-slate-400 text-center font-mono font-bold">
                      NDFI = (Green - SWIR) / (Green + SWIR)
                    </code>
                  </div>
                  <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                    <h4 className="font-semibold text-slate-200 text-sm mb-1.5 text-slate-200">Coherencia SAR 3D</h4>
                    <p className="text-xs text-slate-400 mb-3">Mide desfases en microondas de radar para registrar asentamientos de taludes de cerros.</p>
                    <code className="text-[10px] bg-slate-950 p-2 rounded block text-slate-400 text-center font-mono font-bold">
                      SAR_Δφ = φ_2 - φ_1
                    </code>
                  </div>
                </>
              )}

              {dimension === 'recursos' && (
                <>
                  <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                    <h4 className="font-semibold text-slate-200 text-sm mb-1.5 text-cyan-400">NDWI_Water (Acuático)</h4>
                    <p className="text-xs text-slate-400 mb-3">Identificación de cuerpos de agua dulce superficial y humedales de recarga.</p>
                    <code className="text-[10px] bg-slate-950 p-2 rounded block text-slate-400 text-center font-mono font-bold">
                      NDWI = (B3 - B8) / (B3 + B8)
                    </code>
                  </div>
                  <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                    <h4 className="font-semibold text-slate-200 text-sm mb-1.5 text-blue-450">AWEI (Agua Subterránea)</h4>
                    <p className="text-xs text-slate-400 mb-3">Filtro de extracción automática de agua para modelar canales de recarga profunda.</p>
                    <code className="text-[9px] bg-slate-950 p-2 rounded block text-slate-400 text-center font-mono font-bold">
                      AWEI = 4*(B3-B11) - (0.25*B8 + 2.75*B12)
                    </code>
                  </div>
                  <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                    <h4 className="font-semibold text-slate-200 text-sm mb-1.5 text-emerald-400">Firma ANP Sentinel</h4>
                    <p className="text-xs text-slate-400 mb-3">Curva espectral multicanal de reflectancia para clasificar vegetación virgen.</p>
                    <code className="text-[10px] bg-slate-950 p-2 rounded block text-slate-400 text-center font-mono font-bold">
                      ANP_σ = ∑(R_band_i - R_virgen_i)²
                    </code>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                <Database className={cn("w-5 h-5 mr-2", theme.primary)} />
                Calibración de Banda Terrestre
              </h3>
              <p className="text-xs text-slate-450 leading-relaxed mb-6">
                Los datos satelitales a menudo sufren distorsión atmosférica. GeoTERRA aplica una correlación matemática con los sensores terrestres para ajustar las curvas espectrales en tiempo real.
              </p>

              <div className="space-y-4">
                <CalibrationItem name="Ajuste Atmosférico" value="Aerosol (Sen2Cor) Activo" status="success" />
                <CalibrationItem name="Correlación (Holdout Validation)" value="R² = 0.941 (5-Fold CV)" status="success" />
                <CalibrationItem name="Calibración NDSI / NBR" value="Desviación de Canal: -0.012" status="warning" />
                <CalibrationItem name="Resolución Espacial" value="Remuestreo 10m Bicúbico" status="success" />
              </div>

              <div className="mt-8 p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg text-xs text-slate-400">
                <p className="font-bold text-slate-300 mb-1">Nota de Calibración:</p>
                <p className="leading-relaxed">
                  {dimension === 'alimentaria' && "La correlación entre el índice de salinidad satelital (NDSI) y la conductividad eléctrica de suelo medida a 20cm (CE_20) está optimizada para suelos tipo Franco-Arcilloso en Piura."}
                  {dimension === 'desastres' && "La correlación de severidad de incendios forestales mediante el cociente NBR está acoplada al sistema de teledetección de SERFOR y el IGP para alertas tempranas."}
                  {dimension === 'recursos' && "El mapeo hídrico superficial mediante el índice NDWI_Water y AWEI está calibrado con los caudales de los freatímetros instalados en la cuenca Chancay y Rímac."}
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
  const dotColor = status === 'success' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-400' : 'bg-rose-455';
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
