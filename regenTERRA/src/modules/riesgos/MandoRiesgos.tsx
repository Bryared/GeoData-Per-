import { useMemo, useState, useEffect } from 'react';
import { Map, Truck, AlertTriangle, Flame, Activity, Sun, CloudRain, Thermometer, Compass, RotateCcw, MapPin, Sparkles, ShieldAlert } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useDimension } from '../../context/DimensionContext';

export function MandoRiesgos() {
  const { setDimension } = useDimension();

  // Logistics & Disasters simulation states
  const [landslideSimulated, setLandslideSimulated] = useState(false);
  const [recalculatingLogistics, setRecalculatingLogistics] = useState(false);
  const [activePoint, setActivePoint] = useState<string | null>(null);

  // Automatically sync dimension on page enter
  useEffect(() => {
    setDimension('desastres');
  }, [setDimension]);

  // Load and sync landslide simulation state from local storage
  const loadLandslideState = () => {
    const savedLandslide = localStorage.getItem('landslide_simulated') === 'true';
    setLandslideSimulated(savedLandslide);
  };

  useEffect(() => {
    loadLandslideState();
    window.addEventListener('storage', loadLandslideState);
    
    // Periodically sync landslide simulated state
    const interval = setInterval(() => {
      const savedLandslide = localStorage.getItem('landslide_simulated') === 'true';
      setLandslideSimulated(savedLandslide);
    }, 1000);

    return () => {
      window.removeEventListener('storage', loadLandslideState);
      clearInterval(interval);
    };
  }, []);

  // Handle landslide simulation trigger and local storage sync
  const triggerLandslideSimulation = () => {
    if (landslideSimulated) {
      setLandslideSimulated(false);
      localStorage.setItem('landslide_simulated', 'false');
      window.dispatchEvent(new Event('storage'));
    } else {
      setRecalculatingLogistics(true);
      setTimeout(() => {
        setRecalculatingLogistics(false);
        setLandslideSimulated(true);
        localStorage.setItem('landslide_simulated', 'true');
        window.dispatchEvent(new Event('storage'));
      }, 1200);
    }
  };

  // Geographic Point Data for SVG Vector Map
  const mapPoints = useMemo(() => [
    {
      id: 'piura',
      name: 'Bajo Piura (Cultivo)',
      x: 120,
      y: 70,
      type: 'cultivo',
      status: 'Óptimo',
      details: 'Conductividad: 1.8 dS/m | pH: 7.2 | Cultivo: Espárrago Verde',
      temp: '28.5°C',
      rain: '0.2 mm/d',
      humidity: '62%'
    },
    {
      id: 'chiclayo',
      name: 'Valle Chancay (Canales)',
      x: 160,
      y: 130,
      type: 'hidrologia',
      status: 'Monitor Infiltración',
      details: 'Caudal: 28.5 m³/s | Infiltración: 4.2 m/d | Compuertas: 80% Abiertas',
      temp: '26.1°C',
      rain: '0.5 mm/d',
      humidity: '68%'
    },
    {
      id: 'trujillo',
      name: 'Trujillo Hub',
      x: 210,
      y: 200,
      type: 'logistica',
      status: 'Flujo Normal',
      details: 'Puerto logístico de transbordo. 12 camiones despachados.',
      temp: '24.2°C',
      rain: '0.1 mm/d',
      humidity: '72%'
    },
    {
      id: 'casma',
      name: 'Casma KM 385 (Quebrada)',
      x: 260,
      y: 280,
      type: 'desastre',
      status: landslideSimulated ? 'BLOQUEADO por Huaico' : 'Alerta Geológica Moderada',
      details: landslideSimulated 
        ? 'Derrumbe de talud registrado. Arista vial Panamericana = ∞.' 
        : 'Inclinómetro SL-INCL-301 registra 2.8 mm/h de corrimiento de ladera.',
      temp: '23.5°C',
      rain: landslideSimulated ? '48.5 mm/d (Lluvia Severa)' : '12.4 mm/d',
      humidity: '85%'
    },
    {
      id: 'huaraz',
      name: 'Huaraz (Bypass Andino)',
      x: 330,
      y: 250,
      type: 'desvío',
      status: landslideSimulated ? 'Vía de Emergencia Activa' : 'Standby',
      details: 'Desvío de camiones hacia el Callejón de Huaylas a 3,050 msnm.',
      temp: '14.2°C',
      rain: '2.4 mm/d',
      humidity: '58%'
    },
    {
      id: 'canta',
      name: 'Canta Hub (Cruce de Sierra)',
      x: 380,
      y: 340,
      type: 'desvío',
      status: landslideSimulated ? 'Tránsito Fluido (Bypass)' : 'Standby',
      details: 'Carretera Canta-Huallay. Punto de control logístico de cadena de frío.',
      temp: '11.8°C',
      rain: '1.2 mm/d',
      humidity: '60%'
    },
    {
      id: 'lima',
      name: 'Mercado Mayorista Lima',
      x: 410,
      y: 410,
      type: 'ventas',
      status: 'Punto de Venta Activo',
      details: 'Destino final de comercialización. Capacidad de almacenamiento: 450 Tn.',
      temp: '21.0°C',
      rain: '0.0 mm/d',
      humidity: '78%'
    },
    {
      id: 'tambopata',
      name: 'Reserva Tambopata (Alerta)',
      x: 520,
      y: 310,
      type: 'desastre_fuego',
      status: 'INCENDIO FORESTAL ACTIVO',
      details: 'Pirómetro térmico TH-PYRO-402 registra foco de calor de 98°C. NDVI satelital NBR = 0.12.',
      temp: '38.4°C (Foco Térmico)',
      rain: '0.0 mm/d',
      humidity: '28%'
    }
  ], [landslideSimulated]);

  // Selected point details helper
  const selectedPoint = useMemo(() => {
    return mapPoints.find(p => p.id === activePoint) || null;
  }, [mapPoints, activePoint]);

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Title Header with global Navigation Tabs */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center">
            <Map className="w-8 h-8 text-rose-455 mr-3 animate-pulse" />
            Mando de Riesgos Territoriales & Desastres (N.E.X.U.S. 4D)
          </h1>
          <p className="text-slate-400 mt-1">
            Monitoreo geoespacial en tiempo real de huaicos, incendios, microclimas y ruteo logístico ACO/pgRouting desvío de emergencia.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-[600px]">
        
        {/* Left Column: List of alerts and system status */}
        <div className="xl:col-span-1 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="glass-panel border border-slate-700/50 rounded-xl p-4 bg-[#0b0f19]/70">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                <ShieldAlert className="w-4 h-4 mr-2 text-rose-455 animate-pulse" />
                Alertas en Tiempo Real (N.E.X.U.S. 4D)
              </h3>
              <div className="space-y-2.5">
                <div 
                  onClick={() => setActivePoint('tambopata')}
                  className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-lg text-xs cursor-pointer hover:bg-rose-500/10 transition-colors"
                >
                  <div className="flex justify-between items-center font-bold text-rose-400">
                    <span className="flex items-center"><Flame className="w-3.5 h-3.5 mr-1.5 animate-pulse" /> Incendio Forestal</span>
                    <span className="text-[9px] bg-rose-500/20 px-1.5 py-0.5 rounded">CRÍTICO</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                    Reserva Tambopata: Pirómetro registra foco térmico activo de 98°C. NDVI espectral bajo alerta.
                  </p>
                </div>

                <div 
                  onClick={() => setActivePoint('casma')}
                  className={cn(
                    "p-3 rounded-lg text-xs cursor-pointer transition-colors",
                    landslideSimulated 
                      ? "bg-rose-500/10 border border-rose-500/25"
                      : "bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10"
                  )}
                >
                  <div className={cn("flex justify-between items-center font-bold", landslideSimulated ? "text-rose-400" : "text-amber-400")}>
                    <span className="flex items-center"><AlertTriangle className="w-3.5 h-3.5 mr-1.5 animate-pulse" /> Falla Talud / Huaico</span>
                    <span className="text-[9px] bg-amber-500/20 px-1.5 py-0.5 rounded">{landslideSimulated ? 'BLOQUEADO' : 'ALERTA'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                    {landslideSimulated 
                      ? "Casma KM 385: ¡HUAICO DETECTADO! Vía bloqueada. Arista de red configurada a costo infinito."
                      : "Casma KM 385: Inclinómetros registran desplazamiento acelerado de talud por lluvia."}
                  </p>
                </div>
              </div>
            </div>

            {/* pgRouting Solver Info Panel */}
            <div className="glass-panel border border-slate-700/50 rounded-xl p-4 bg-[#0b0f19]/70 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <Activity className="w-4 h-4 mr-2 text-cyan-400" />
                Estado de Ruteo (pgRouting)
              </h3>
              <div className="space-y-2 text-[11px] text-slate-400 leading-relaxed">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span>Motor Lógico:</span>
                  <span className="font-bold text-slate-300">ACO (Ant Colony) C++</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span>Grafo Nacional:</span>
                  <span className="font-bold text-slate-300">1,420,542 Aristas MTC</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span>Tiempo de Respuesta:</span>
                  <span className="font-mono font-bold text-cyan-400">12 ms (Ultrarrápido)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span>Estado del Desvío:</span>
                  <span className={cn("font-bold", landslideSimulated ? "text-cyan-400 animate-pulse" : "text-slate-500")}>
                    {landslideSimulated ? "ACTIVO (Canta/Huaraz)" : "Inactivo"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Simulating action buttons */}
          <div className="glass-panel border border-slate-700/50 rounded-xl p-4 bg-[#0b0f19]/70 space-y-3">
            <p className="text-[10px] text-slate-500 font-bold leading-normal">
              Prueba la resistencia algorítmica de la cadena de suministro ante desastres geológicos en vivo:
            </p>
            <button
              onClick={triggerLandslideSimulation}
              disabled={recalculatingLogistics}
              className="w-full flex items-center justify-center px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/30 rounded-lg transition-all text-xs font-bold disabled:opacity-50"
            >
              {recalculatingLogistics ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 mr-2 animate-spin" />
                  ACO Solver recalculando...
                </>
              ) : landslideSimulated ? (
                "Restaurar Vía Panamericana"
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 mr-2 animate-pulse" />
                  Simular Huaico (KM 385)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Center Column (Span 2): SVG Interactive Map Workspace */}
        <div className="xl:col-span-2 glass-panel border border-slate-700/50 rounded-xl p-4 bg-[#070b13] flex flex-col justify-between relative overflow-hidden min-h-[500px]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.03),transparent_65%)] pointer-events-none" />
          
          {/* Top Toolbar of the Map */}
          <div className="flex justify-between items-center z-10 bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg mb-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center">
              <Compass className="w-4 h-4 mr-1.5 text-rose-450" />
              Control de Vectores Cartográficos - GEO Perú
            </span>
            <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-400 font-bold">
              Resolución: Sentinel-2 Espectral Activo
            </span>
          </div>

          {/* Vector Map Canvas (SVG) */}
          <div className="flex-1 flex items-center justify-center relative bg-slate-950/40 rounded-xl border border-slate-850 overflow-hidden">
            <svg viewBox="0 0 600 500" className="w-full h-full max-h-[460px] select-none text-slate-200">
              {/* Defs for glow filters and gradients */}
              <defs>
                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Ocean and Grid Lines backgrounds */}
              <rect x="0" y="0" width="600" height="500" fill="transparent" />
              <path d="M 0,100 L 600,100 M 0,200 L 600,200 M 0,300 L 600,300 M 0,400 L 600,400 M 100,0 L 100,500 M 200,0 L 200,500 M 300,0 L 300,500 M 400,0 L 400,500" stroke="#334155" strokeWidth="0.5" strokeDasharray="3,8" opacity="0.25" />

              {/* Draw Peru's Coastline vector silhouette (Schematic grid reference) */}
              <path d="M 60,30 Q 110,60 140,110 T 180,180 T 230,240 T 320,310 T 400,390 T 450,480" fill="none" stroke="#334155" strokeWidth="2.5" strokeDasharray="4,4" opacity="0.3" />

              {/* 1. Normal Panamericana Highway vector path */}
              <path 
                d="M 120,70 L 160,130 L 210,200 L 260,280 L 410,410" 
                fill="none" 
                stroke={landslideSimulated ? "#f43f5e" : "#06b6d4"} 
                strokeWidth="3" 
                strokeDasharray={landslideSimulated ? "4,6" : "none"} 
                opacity={landslideSimulated ? "0.4" : "0.85"}
                className="transition-all duration-500"
                filter="url(#glow-cyan)"
              />

              {/* 2. C++ pgRouting Bypass Route (Sierra bypass) */}
              <path 
                d="M 210,200 L 330,250 L 380,340 L 410,410" 
                fill="none" 
                stroke="#22d3ee" 
                strokeWidth={landslideSimulated ? "3.5" : "1.5"} 
                strokeDasharray={landslideSimulated ? "none" : "3,6"} 
                opacity={landslideSimulated ? "0.9" : "0.2"}
                className="transition-all duration-500"
                filter={landslideSimulated ? "url(#glow-cyan)" : "none"}
              />

              {/* Route label badges */}
              <text x="210" y="275" fill="#f43f5e" fontSize="9" fontWeight="bold" opacity={landslideSimulated ? 0.9 : 0.3} className="font-mono">
                Panamericana (Cortada)
              </text>
              <text x="325" y="295" fill="#22d3ee" fontSize="9" fontWeight="bold" opacity={landslideSimulated ? 0.95 : 0.15} className="font-mono animate-pulse">
                Desvío pgRouting (Huaraz/Canta)
              </text>

              {/* 3. Render vector nodes */}
              {mapPoints.map((pt) => {
                let isSelected = activePoint === pt.id;
                let color = '#94a3b8'; // gray

                if (pt.type === 'cultivo') color = '#10b981'; // emerald
                else if (pt.type === 'hidrologia') color = '#06b6d4'; // cyan
                else if (pt.type === 'logistica') color = '#3b82f6'; // blue
                else if (pt.type === 'ventas') color = '#06b6d4';
                else if (pt.type === 'desastre') color = landslideSimulated ? '#ef4444' : '#f59e0b';
                else if (pt.type === 'desastre_fuego') color = '#ef4444';
                else if (pt.type === 'desvío') color = landslideSimulated ? '#22d3ee' : '#475569';

                return (
                  <g 
                    key={pt.id} 
                    className="cursor-pointer" 
                    onClick={() => setActivePoint(pt.id === activePoint ? null : pt.id)}
                  >
                    {/* Pulse rings for alerts/active routes */}
                    {((pt.type.startsWith('desastre')) || (landslideSimulated && pt.type === 'desvío') || isSelected) && (
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r={isSelected ? 16 : 10} 
                        fill="none" 
                        stroke={color} 
                        strokeWidth="2" 
                        opacity="0.6"
                        className="animate-ping origin-center"
                      />
                    )}
                    
                    {/* Node core dot */}
                    <circle 
                      cx={pt.x} 
                      cy={pt.y} 
                      r={isSelected ? 8 : 6} 
                      fill={color} 
                      className="transition-all duration-300 hover:scale-125" 
                    />

                    {/* Small white dot inside */}
                    <circle cx={pt.x} cy={pt.y} r="2" fill="#ffffff" />

                    {/* Text Label */}
                    <text 
                      x={pt.x + 10} 
                      y={pt.y + 4} 
                      fill={isSelected ? '#f1f5f9' : '#94a3b8'} 
                      fontSize={isSelected ? '10' : '8'}
                      fontWeight={isSelected ? 'extrabold' : 'bold'}
                      className="font-mono bg-slate-900"
                      opacity={isSelected ? 1.0 : 0.75}
                    >
                      {pt.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Map floating prompt */}
            {!activePoint && (
              <div className="absolute bottom-4 left-4 right-4 text-center p-2.5 bg-slate-900/95 border border-slate-800 rounded-lg text-[10px] text-slate-400 font-mono shadow-xl animate-fade-in pointer-events-none">
                🖱️ Haz clic sobre cualquier nodo o alerta del mapa para consultar telemetría y microclimas en vivo.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic microclimate data, alerts and routes details */}
        <div className="xl:col-span-1 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="glass-panel border border-slate-700/50 rounded-xl p-5 bg-[#0b0f19]/70 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
              
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                {selectedPoint ? "Telemetría del Nodo Seleccionado" : "Microclimas & Climatología"}
              </h3>

              {selectedPoint ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm flex items-center space-x-1.5">
                      <MapPin className="w-4 h-4 text-rose-455 shrink-0" />
                      <span>{selectedPoint.name}</span>
                    </h4>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-slate-800 text-slate-300 text-[9px] font-mono rounded">
                      Estado: {selectedPoint.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
                    <div className="bg-slate-950 p-2 rounded border border-slate-850">
                      <span className="text-slate-500 block uppercase text-[8px]">Temp. Parcela</span>
                      <span className="text-slate-200 font-bold block mt-1 flex items-center justify-center">
                        <Thermometer className="w-3 h-3 text-rose-400 mr-1" />
                        {selectedPoint.temp}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-850">
                      <span className="text-slate-500 block uppercase text-[8px]">Humedad</span>
                      <span className="text-slate-200 font-bold block mt-1 flex items-center justify-center">
                        <CloudRain className="w-3 h-3 text-blue-400 mr-1" />
                        {selectedPoint.humidity}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
                    <span className="font-bold text-slate-300 block mb-1">Métricas de Campo:</span>
                    {selectedPoint.details}
                  </div>

                  <button 
                    onClick={() => setActivePoint(null)}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] rounded font-bold text-slate-300 transition-colors"
                  >
                    Cerrar Detalles del Nodo
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5 text-xs text-slate-400 leading-relaxed">
                  <p>
                    El sensor de teledetección asume las capas de microclimas locales a lo largo del corredor de exportación <strong>Bajo Piura ──► Lima</strong>.
                  </p>

                  <div className="space-y-2 font-mono text-[10px]">
                    <div className="flex justify-between border-b border-slate-850 pb-1">
                      <span className="text-slate-500">Heladas en Sierra (Canta)</span>
                      <span className="text-emerald-450 font-bold flex items-center"><Sun className="w-3.5 h-3.5 mr-1 text-amber-500" /> Ninguna (11.8°C)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-850 pb-1">
                      <span className="text-slate-500">Humedad Valle (Chiclayo)</span>
                      <span className="text-cyan-400 font-bold">68% R.H.</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-850 pb-1">
                      <span className="text-slate-500">Precipitación Casma</span>
                      <span className={cn("font-bold", landslideSimulated ? "text-rose-400 animate-pulse" : "text-slate-350")}>
                        {landslideSimulated ? "48.5 mm/d (Huaico)" : "12.4 mm/d"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-850 text-[9px] text-slate-500 leading-normal flex items-start space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Análisis Microclimas:</strong> Flujo térmico normal sobre valles costeros. La sierra central presenta temperaturas estables sin riesgos de heladas.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Rerouting Active Alert Banner */}
            {landslideSimulated && (
              <div className="glass-panel border border-rose-500/20 p-4 rounded-xl bg-rose-500/5 text-xs text-rose-455 space-y-2 animate-pulse">
                <div className="flex items-center font-bold text-rose-455">
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  <span>ALERTA: pgRouting Desvío</span>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-300">
                  Evacuación de 15 camiones agroalimentarios iniciada. Ruta Panamericana bloqueada en el KM 385. Desvío Canta-Huaraz activo.
                </p>
                <div className="p-1.5 bg-cyan-950/20 border border-cyan-500/20 text-[10px] text-cyan-400 font-mono rounded font-bold">
                  Ruta Original Bloqueada ──► Costa Verde / Evitamiento Desvío Activado en 12ms (Merma resguardada en 98.4%)
                </div>
              </div>
            )}
          </div>

          {/* Tracking panel */}
          <div className="glass-panel border border-slate-700/50 rounded-xl p-4 bg-[#0b0f19]/70">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center">
              <Truck className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              Monitoreo de Flota (Piura-Lima)
            </h4>
            <div className="space-y-1.5 font-mono text-[9px] text-slate-400">
              <div className="flex justify-between bg-slate-950/60 p-1.5 rounded border border-slate-900">
                <span className="text-slate-300 font-bold">TRUCK-PE-01</span>
                <span>Piura ──► Trujillo</span>
                <span className="text-emerald-450">75 km/h</span>
              </div>
              <div className="flex justify-between bg-slate-950/60 p-1.5 rounded border border-slate-900">
                <span className="text-slate-300 font-bold">TRUCK-PE-02</span>
                <span className={cn("transition-colors", landslideSimulated ? "text-cyan-400" : "text-slate-400")}>
                  {landslideSimulated ? "Huaraz (Desvío)" : "Casma (Panam)"}
                </span>
                <span>{landslideSimulated ? "54 km/h" : "80 km/h"}</span>
              </div>
              <div className="flex justify-between bg-slate-950/60 p-1.5 rounded border border-slate-900">
                <span className="text-slate-300 font-bold">TRUCK-PE-03</span>
                <span className="text-cyan-400 font-bold">Lima (Llegada)</span>
                <span className="text-slate-500">Detenido</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
