import { useMemo, useState, useEffect } from 'react';
import { Truck, AlertTriangle, Flame, Activity, Sun, CloudRain, Thermometer, Compass, RotateCcw, MapPin, Sparkles, ShieldAlert, Droplet } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useDimension } from '../../context/DimensionContext';
import { logisticsAPI } from '../../utils/api';
import { useRiskAlerts } from '../../hooks/useRiskAlerts';
import RiskMap from './components/RiskMap';

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block ml-2 align-middle select-none z-30">
      <button 
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="w-4 h-4 rounded-full bg-cyan-500/10 border border-cyan-500/35 text-cyan-400 text-[10px] font-extrabold flex items-center justify-center cursor-help transition-all hover:bg-cyan-500/20 active:scale-95 shadow-sm"
        type="button"
      >
        !
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-950/95 border border-slate-800 rounded-lg text-[10px] text-slate-350 font-sans shadow-2xl z-50 leading-relaxed pointer-events-none block whitespace-normal normal-case font-normal text-left">
          <span className="font-extrabold text-cyan-455 uppercase tracking-widest block mb-1 text-[9px] border-b border-slate-900 pb-0.5 font-mono">Soporte Técnico de Operación:</span>
          {text}
        </span>
      )}
    </span>
  );
}

export function MandoRiesgos() {
  const { dimension, setDimension } = useDimension();

  // Simulation states
  const [landslideSimulated, setLandslideSimulated] = useState(false);
  const [recalculatingLogistics, setRecalculatingLogistics] = useState(false);
  const [activePoint, setActivePoint] = useState<string | null>(null);

  // Golang integration states
  const [goRouterConnected, setGoRouterConnected] = useState(false);
  const [solverTimeMs, setSolverTimeMs] = useState<number>(12);
  const [reroutedPaths, setReroutedPaths] = useState<number>(3);

  // Load and sync landslide simulation state from local storage
  const loadLandslideState = () => {
    const savedLandslide = localStorage.getItem('landslide_simulated') === 'true';
    setLandslideSimulated(savedLandslide);
  };

  useEffect(() => {
    // Set default active dimension to desastres on mount
    setDimension('desastres');
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

  // Periodic Go connection check
  useEffect(() => {
    const checkGo = async () => {
      const connected = await logisticsAPI.checkConnection();
      setGoRouterConnected(connected);
    };
    checkGo();
    const checkInterval = setInterval(checkGo, 5000);
    return () => clearInterval(checkInterval);
  }, []);

  // Handle landslide simulation trigger and local storage sync
  const triggerLandslideSimulation = async () => {
    if (landslideSimulated) {
      setLandslideSimulated(false);
      localStorage.setItem('landslide_simulated', 'false');
      window.dispatchEvent(new Event('storage'));
      setSolverTimeMs(12);
      setReroutedPaths(3);
    } else {
      setRecalculatingLogistics(true);
      try {
        const result = await logisticsAPI.triggerReroute({
          event_id: "HUAICO_CASMA_KM_385",
          event_type: "HUAICO",
          severity: 4,
          latitude: -9.47,
          longitude: -78.31
        });
        setSolverTimeMs(result.solver_time_ms || 12);
        setReroutedPaths(result.rerouted_paths || 3);
      } catch (err) {
        console.warn("Falla en la llamada de ruteo de Golang, usando fallback simulado:", err);
        setSolverTimeMs(12);
        setReroutedPaths(3);
      } finally {
        setRecalculatingLogistics(false);
        setLandslideSimulated(true);
        localStorage.setItem('landslide_simulated', 'true');
        window.dispatchEvent(new Event('storage'));
      }
    }
  };

  // Geographic Point Data for SVG Vector Map of Peru depending on active Dimension
  const mapPoints = useMemo(() => {
    if (dimension === 'alimentaria') {
      // Modality: Seguridad Alimentaria - Route planning & shipping hubs
      return [
        {
          id: 'piura_agro',
          name: 'Fundo Piura (Origen)',
          x: 80,
          y: 70,
          type: 'origen',
          status: 'Cosecha Lista',
          details: 'Algodón Pima y Arroz. 45 Tn listas para embarque hacia Lima.',
          temp: '29.2°C',
          rain: '0.2 mm/d',
          humidity: '62%'
        },
        {
          id: 'chiclayo_agro',
          name: 'Fundo Chancay (Origen)',
          x: 140,
          y: 130,
          type: 'origen',
          status: 'Transporte en Carga',
          details: 'Maíz Amarillo Duro. 30 Tn cargadas en camión TRUCK-PE-01.',
          temp: '26.1°C',
          rain: '0.5 mm/d',
          humidity: '68%'
        },
        {
          id: 'trujillo_hub',
          name: 'Trujillo Logística (Hub)',
          x: 200,
          y: 190,
          type: 'hub',
          status: landslideSimulated ? 'Bypass pgRouting Activado' : 'Tránsito Normal',
          details: landslideSimulated 
            ? 'Cierre de Panamericana en Casma. Redireccionamiento de flota por la sierra.'
            : 'Puerto logístico. Despacho directo por la Panamericana Norte.',
          temp: '24.2°C',
          rain: '0.1 mm/d',
          humidity: '72%'
        },
        {
          id: 'casma_choke',
          name: 'Casma KM 385 (Quebrada)',
          x: 230,
          y: 230,
          type: 'choke_point',
          status: landslideSimulated ? 'BLOQUEADO' : 'Libre',
          details: landslideSimulated 
            ? '¡HUAICO DETECTADO! Vía bloqueada. Arista vial Panamericana = costo infinito.' 
            : 'Inclinómetros estables. Panamericana transitable.',
          temp: '23.5°C',
          rain: landslideSimulated ? '48.5 mm/d' : '12.4 mm/d',
          humidity: '85%'
        },
        {
          id: 'huaraz_bypass',
          name: 'Huaraz (Sierra Bypass)',
          x: 280,
          y: 200,
          type: 'bypass_point',
          status: landslideSimulated ? 'Flujo de Desvío Activo' : 'Standby',
          details: 'Paso por el Callejón de Huaylas a 3,050 msnm. Conservación térmica de carga a 3,050 msnm.',
          temp: '14.2°C',
          rain: '2.4 mm/d',
          humidity: '58%'
        },
        {
          id: 'canta_bypass',
          name: 'Canta (Sierra Bypass)',
          x: 340,
          y: 310,
          type: 'bypass_point',
          status: landslideSimulated ? 'Flujo de Desvío Activo' : 'Standby',
          details: 'Carretera Canta-Huallay. Punto de control logístico y cadena de frío.',
          temp: '11.8°C',
          rain: '1.2 mm/d',
          humidity: '60%'
        },
        {
          id: 'lima_mayorista',
          name: 'Mercado Mayorista (Destino)',
          x: 380,
          y: 380,
          type: 'destino',
          status: 'Recepción Lista',
          details: 'Punto de venta y abastecimiento de la megaciudad. Stock resguardado.',
          temp: '21.0°C',
          rain: '0.0 mm/d',
          humidity: '78%'
        }
      ];
    } else if (dimension === 'recursos') {
      // Modality: Hidrología & Reservas - Basins, Poechos reservoir, water resources
      return [
        {
          id: 'poechos',
          name: 'Represa Poechos (Piura)',
          x: 80,
          y: 70,
          type: 'reservorio',
          status: 'Carga: 68% Capacidad',
          details: 'Volumen: 320 Hm³. Caudal de salida regulado para riego de Bajo Piura.',
          temp: '30.1°C',
          rain: '0.0 mm/d',
          humidity: '55%'
        },
        {
          id: 'chancay_basin',
          name: 'Cuenca Río Chancay',
          x: 140,
          y: 130,
          type: 'cuenca',
          status: 'Evapotranspiración Crítica',
          details: 'Caudal de ingreso: 28.5 m³/s. NDWI satelital < 0.1 indica alto estrés foliar.',
          temp: '26.1°C',
          rain: '0.5 mm/d',
          humidity: '68%'
        },
        {
          id: 'amazon_river',
          name: 'Río Amazonas (Iquitos)',
          x: 480,
          y: 80,
          type: 'rio',
          status: 'Alerta de Crecida pluvial',
          details: 'Nivel del agua: +3.2m sobre cota de desborde. Ingesta de datos de ANA en curso.',
          temp: '31.2°C',
          rain: '65.2 mm/d',
          humidity: '94%'
        },
        {
          id: 'titicaca_lake',
          name: 'Lago Titicaca (Puno)',
          x: 460,
          y: 440,
          type: 'lago',
          status: 'Estable',
          details: 'Temperatura superficial: 12.4°C. Monitor de recarga hídrica del Altiplano.',
          temp: '-2.0°C',
          rain: '0.0 mm/d',
          humidity: '35%'
        },
        {
          id: 'chili_aquifer',
          name: 'Acuífero Chili (Arequipa)',
          x: 420,
          y: 420,
          type: 'acuifero',
          status: 'Déficit de Infiltración',
          details: 'Richards PDE calcula recarga en subsuelo. Evapotranspiración excede infiltración.',
          temp: '22.8°C',
          rain: '0.0 mm/d',
          humidity: '40%'
        }
      ];
    } else {
      // Modality: Gestión de Desastres - Seismic threats, landslides, forest fires
      return [
        {
          id: 'tambopata',
          name: 'Reserva Tambopata (Alerta)',
          x: 480,
          y: 340,
          type: 'desastre_fuego',
          status: 'INCENDIO FORESTAL ACTIVO',
          details: 'Foco térmico TH-PYRO-402 detectado de 98°C. NDVI espectral bajo alerta.',
          temp: '38.4°C',
          rain: '0.0 mm/d',
          humidity: '28%'
        },
        {
          id: 'casma',
          name: 'Casma KM 385 (Quebrada)',
          x: 230,
          y: 230,
          type: 'desastre',
          status: landslideSimulated ? 'BLOQUEADO por Huaico' : 'Alerta de Deslizamiento',
          details: landslideSimulated 
            ? '¡Huaico detectado en Panamericana! Bloqueo total de vía. Bypass pgRouting en uso.' 
            : 'Inclinómetro SL-INCL-301 registra 2.8 mm/h de corrimiento de ladera.',
          temp: '23.5°C',
          rain: landslideSimulated ? '48.5 mm/d' : '12.4 mm/d',
          humidity: '85%'
        },
        {
          id: 'lima',
          name: 'Lima (Costa Central)',
          x: 380,
          y: 380,
          type: 'desastre_sismo',
          status: 'ALERTA SÍSMICA CRÍTICA',
          details: 'Aceleración sísmica detectada por IGP. Plan de contingencia y evacuación activo.',
          temp: '21.0°C',
          rain: '0.0 mm/d',
          humidity: '78%'
        },
        {
          id: 'iquitos',
          name: 'Iquitos (Amazonía Norte)',
          x: 480,
          y: 80,
          type: 'desastre_inundacion',
          status: 'DESBORDE DE RÍO ACTIVO',
          details: 'Crecida pluvial extrema del río Amazonas. Saneamiento y accesos rurales comprometidos.',
          temp: '31.2°C',
          rain: '65.2 mm/d',
          humidity: '94%'
        },
        {
          id: 'puno',
          name: 'Puno (Altiplano)',
          x: 460,
          y: 440,
          type: 'desastre_helada',
          status: 'HELADA AGRÍCOLA EXTREMA',
          details: 'Temperatura desciende a -12°C. Estrés por congelación en parcelas de quinua.',
          temp: '-12.0°C',
          rain: '0.0 mm/d',
          humidity: '35%'
        },
        {
          id: 'arequipa',
          name: 'Arequipa (Cuenca Sur)',
          x: 420,
          y: 420,
          type: 'desastre_sequia',
          status: 'ESTRÉS HÍDRICO CRÓNICO',
          details: 'Déficit severo y prolongado. Descenso de reservas de agua y sobreexplotación de pozos.',
          temp: '22.8°C',
          rain: '0.0 mm/d',
          humidity: '40%'
        }
      ];
    }
  }, [dimension, landslideSimulated]);

  // Consumir alertas de riesgos en tiempo real
  const { alerts, loading: alertsLoading, error: alertsError, lastUpdated, backendMode } = useRiskAlerts();

  // Selected point details helper
  const selectedPoint = useMemo(() => {
    return mapPoints.find(p => p.id === activePoint) || null;
  }, [mapPoints, activePoint]);

  const selectedAlert = useMemo(() => {
    return alerts.find(a => a.id.toString() === activePoint) || null;
  }, [alerts, activePoint]);

  const activeDetail = useMemo(() => {
    if (selectedPoint) {
      return {
        name: selectedPoint.name,
        status: selectedPoint.status,
        tempLabel: dimension === 'recursos' ? "Caudal/Temp" : "Temp. Local",
        tempVal: selectedPoint.temp,
        humLabel: dimension === 'recursos' ? "Capacidad" : "Humedad H.",
        humVal: selectedPoint.humidity,
        details: selectedPoint.details
      };
    } else if (selectedAlert) {
      const detalles = selectedAlert.detalles || {};
      let fechaFormatted = 'Reciente';
      if (detalles.fecha_evento) {
        try {
          const d = new Date(detalles.fecha_evento);
          fechaFormatted = d.toLocaleDateString('es-PE', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (e) {}
      }
      return {
        name: `${selectedAlert.tipo_evento} - Sev ${selectedAlert.severidad}`,
        status: selectedAlert.estado,
        tempLabel: "Fuente",
        tempVal: detalles.fuente || "Reporte",
        humLabel: "Fecha",
        humVal: fechaFormatted,
        details: detalles.descripcion || `${selectedAlert.tipo_evento} activo.`
      };
    }
    return null;
  }, [selectedPoint, selectedAlert, dimension]);

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Title Header and segment controller tab switcher */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center">
            {dimension === 'alimentaria' ? (
              <>
                <Compass className="w-8 h-8 text-emerald-400 mr-3 animate-pulse" />
                Mando de Riesgos Logísticos
              </>
            ) : dimension === 'recursos' ? (
              <>
                <Droplet className="w-8 h-8 text-cyan-400 mr-3 animate-pulse" />
                Mando de Riesgos: Recursos Hidrológicos
              </>
            ) : (
              <>
                <ShieldAlert className="w-8 h-8 text-rose-500 mr-3 animate-pulse" />
                Mando de Riesgos y Desastres Naturales
              </>
            )}
          </h1>
          <p className="text-slate-400 mt-1">
            {dimension === 'alimentaria' 
              ? 'Optimización proactiva de la red vial y rutas de abastecimiento en milisegundos con motor Golang (nexus_router) sobre red PostGIS.'
              : dimension === 'recursos'
              ? 'Monitoreo dinámico de cuencas, represas y balances de infiltración edafológica Richards PDE.'
              : 'Monitoreo geoespacial en tiempo real de sismos, huaicos, heladas e incendios en todo el territorio nacional.'
            }
          </p>
        </div>

        {/* Floating segment controller tab switcher to change dimension */}
        <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-800 self-start shrink-0">
          <button 
            onClick={() => { setDimension('alimentaria'); setActivePoint(null); }}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center",
              dimension === 'alimentaria' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-450 hover:text-slate-200"
            )}
          >
            <Compass className="w-3.5 h-3.5 mr-1.5" />
            Ruta del Agricultor
          </button>
          <button 
            onClick={() => { setDimension('desastres'); setActivePoint(null); }}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center",
              dimension === 'desastres' ? "bg-rose-500/10 text-rose-450 border border-rose-500/20" : "text-slate-450 hover:text-slate-200"
            )}
          >
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
            Mapa de Desastres
          </button>
          <button 
            onClick={() => { setDimension('recursos'); setActivePoint(null); }}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center",
              dimension === 'recursos' ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-450 hover:text-slate-200"
            )}
          >
            <Droplet className="w-3.5 h-3.5 mr-1.5" />
            Hidrología & Reservas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-[600px]">
        
        {/* Left Column: Alerts list, Routing status or Aquifers summary */}
        <div className="xl:col-span-1 space-y-4 flex flex-col justify-between max-h-[620px]">
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            
            {dimension === 'alimentaria' ? (
              <div className="glass-panel border border-slate-700/50 rounded-xl p-4 bg-[#0b0f19]/70 flex flex-col min-h-0 flex-1 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center shrink-0">
                  <Compass className="w-4 h-4 mr-2 text-emerald-450 animate-pulse" />
                  Buscador de Ruta Óptima (SAT-Agro Pro)
                </h3>
                
                <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 text-xs">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 leading-relaxed space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <span>PUNTO DE SALIDA:</span>
                      <span className="font-bold text-emerald-400">PIURA / CHANCAY</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <span>PUNTO DE DESTINO:</span>
                      <span className="font-bold text-cyan-400">LIMA MAYORISTA</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg space-y-1.5">
                    <div className="font-bold text-emerald-400 flex items-center justify-between">
                      <span className="flex items-center"><Truck className="w-3.5 h-3.5 mr-1.5 animate-pulse" /> Estado de Canal Logístico</span>
                      <InfoTooltip text="El módulo SAT-Agro Pro emplea sensores telemétricos LoRa integrados en contenedores refrigerados para registrar temperatura, vibración de talud y humedad foliar en tiempo real, garantizando la preservación de la carga." />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Monitoreo activo de la cadena de frío en flotas.
                    </p>
                  </div>

                  <div className={cn(
                    "p-3 rounded-lg space-y-1.5 border transition-all",
                    landslideSimulated 
                      ? "bg-rose-500/10 border-rose-500/25 text-rose-455"
                      : "bg-cyan-500/5 border-cyan-500/10 text-cyan-400"
                  )}>
                    <div className="font-bold flex items-center justify-between">
                      <span className="flex items-center"><AlertTriangle className="w-3.5 h-3.5 mr-1.5 animate-pulse" /> Ruta Panamericana</span>
                      <InfoTooltip text="Monitoreo satelital y de radar Sentinel-2 fusionado con inclinómetros a pie de talud. La ocurrencia de huaicos o deslizamientos de tierra actualiza dinámicamente el peso de coste de aristas en pgRouting a infinito." />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {landslideSimulated 
                        ? "Panamericana Norte cortada en Casma. Desvío activo." 
                        : "Carretera libre. Tránsito fluido directo para el transporte."}
                    </p>
                  </div>
                </div>
              </div>
            ) : dimension === 'recursos' ? (
              <div className="glass-panel border border-slate-700/50 rounded-xl p-4 bg-[#0b0f19]/70 flex flex-col min-h-0 flex-1 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center shrink-0">
                  <Droplet className="w-4 h-4 mr-2 text-cyan-400" />
                  Balances Hidrológicos (O.M.N.I. TERRA)
                </h3>
                
                <div className="space-y-3 overflow-y-auto pr-1 flex-1 text-xs">
                  <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-lg space-y-1">
                    <span className="text-[9px] bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-400 font-bold tracking-wider flex items-center justify-between">
                      <span>RICHARDS PDE SOLVER</span>
                      <InfoTooltip text="Fusión de reflectancia de Sentinel-2 con ecuaciones diferenciales parciales de Richards para predecir la pluma de salinidad y evapotranspiración foliar en subsuelo (20/40/60 cm) sin instrumentación física costosa." />
                    </span>
                    <p className="text-[10px] text-slate-450 mt-1.5 leading-normal">
                      Red neuronal PINN calcula infiltración de humedad.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 space-y-2 text-[10px] font-mono text-slate-455">
                    <div className="flex justify-between border-b border-slate-900 pb-1.5">
                      <span>Carga Poechos:</span>
                      <span className="font-bold text-cyan-400">68% (Caudal controlado)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1.5">
                      <span>Riego Bajo Piura:</span>
                      <span className="font-bold text-emerald-450">Optimizado por Richards</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1.5">
                      <span>Conductividad Rizósfera:</span>
                      <span className="font-bold text-amber-500">1.8 dS/m (Sano)</span>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-lg space-y-1.5">
                    <div className="font-bold text-rose-400 flex items-center justify-between">
                      <span className="flex items-center"><AlertTriangle className="w-3.5 h-3.5 mr-1.5 animate-pulse" /> Estrés Hídrico Crónico</span>
                      <InfoTooltip text="Evaluación hidrológica a escala de cuencas de la costa norte y altiplano. Combina datos históricos e in-situ del ANA y reflectancias multiespectrales para predecir déficits de riego." />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Zonas agrícolas del sur presentan recarga de acuíferos negativa.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel border border-slate-700/50 rounded-xl p-4 bg-[#0b0f19]/70 flex flex-col min-h-0 flex-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center shrink-0">
                  <ShieldAlert className="w-4 h-4 mr-2 text-rose-500 animate-pulse" />
                  Alertas en Tiempo Real (N.E.X.U.S. 4D)
                </h3>
                
                <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                  {alerts.map((alert) => {
                    const detalles = alert.detalles || {};
                    const desc = detalles.descripcion || `${alert.tipo_evento} activo...`;
                    
                    const colorClass = alert.severidad >= 5 
                      ? "text-rose-450" 
                      : alert.severidad >= 3 
                        ? "text-amber-400" 
                        : "text-cyan-400";
                    const bgClass = alert.severidad >= 5 
                      ? "bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10" 
                      : alert.severidad >= 3 
                        ? "bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10" 
                        : "bg-cyan-500/5 border-cyan-500/10 hover:bg-cyan-500/10";
                    const badgeClass = alert.severidad >= 5 
                      ? "bg-rose-500/20" 
                      : alert.severidad >= 3 
                        ? "bg-amber-500/20" 
                        : "bg-cyan-500/20";
                    const badgeText = alert.severidad >= 5 
                      ? "CRÍTICO" 
                      : alert.severidad >= 3 
                        ? "ALERTA" 
                        : "INFO";

                    // Map standard icons
                    let IconComponent = ShieldAlert;
                    const typeUpper = alert.tipo_evento.toUpperCase();
                    if (typeUpper.includes("SISMO") || typeUpper.includes("TERREMOTO")) {
                      IconComponent = Activity;
                    } else if (typeUpper.includes("INCENDIO") || typeUpper.includes("FUEGO")) {
                      IconComponent = Flame;
                    } else if (typeUpper.includes("HUAICO") || typeUpper.includes("DESLIZAMIENTO")) {
                      IconComponent = AlertTriangle;
                    } else if (typeUpper.includes("INUNDACION") || typeUpper.includes("RIO") || typeUpper.includes("CRECIDA")) {
                      IconComponent = CloudRain;
                    } else if (typeUpper.includes("HELADA") || typeUpper.includes("FRIO") || typeUpper.includes("TEMPERATURA")) {
                      IconComponent = Thermometer;
                    } else if (typeUpper.includes("SEQUIA") || typeUpper.includes("CALOR") || typeUpper.includes("ESTRES")) {
                      IconComponent = Sun;
                    }

                    return (
                      <div 
                        key={alert.id}
                        onClick={() => setActivePoint(alert.id.toString())}
                        className={cn(
                          "p-3 border rounded-lg text-xs cursor-pointer transition-colors",
                          bgClass,
                          activePoint === alert.id.toString() ? "border-slate-500 bg-slate-900/40" : "border-transparent"
                        )}
                      >
                        <div className={cn("flex justify-between items-center font-bold", colorClass)}>
                          <span className="flex items-center">
                            <IconComponent className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
                            {alert.tipo_evento}
                          </span>
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-extrabold", badgeClass)}>
                            {badgeText}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                          {desc}
                        </p>
                      </div>
                    );
                  })}

                  {alerts.length === 0 && !alertsLoading && (
                    <div className="text-center py-6 text-slate-500 text-[10px] font-mono">
                      No hay alertas activas en el territorio.
                    </div>
                  )}

                  {alertsLoading && (
                    <div className="text-center py-6 text-slate-500 text-[10px] font-mono animate-pulse">
                      Sincronizando alertas PostGIS...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* pgRouting Solver Info Panel */}
            <div className="glass-panel border border-slate-700/50 rounded-xl p-4 bg-[#0b0f19]/70 space-y-3 shrink-0">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <Activity className="w-4 h-4 mr-2 text-cyan-400" />
                Estado del Motor Lógico
              </h3>
              <div className="space-y-2 text-[11px] text-slate-400 leading-relaxed">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span>Motor Logístico:</span>
                  <span className={cn("font-bold", goRouterConnected ? "text-emerald-405" : "text-slate-200")}>
                    {goRouterConnected ? "Golang (CONECTADO EN VIVO)" : "Golang (SIMULADO LOCAL)"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span>Red Georreferenciada:</span>
                  <span className="font-bold text-slate-200">PostGIS (1,420,542 Aristas)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span>Tiempo de Cómputo:</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {solverTimeMs} milisegundos
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span>Bypass Logístico:</span>
                  <span className={cn("font-bold", landslideSimulated ? "text-cyan-400 animate-pulse" : "text-slate-500")}>
                    {landslideSimulated ? `ACTIVO (${reroutedPaths} flotas desviadas)` : "Standby"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Simulating action buttons */}
          <div className="glass-panel border border-slate-700/50 rounded-xl p-4 bg-[#0b0f19]/70 space-y-3 shrink-0">
            <p className="text-[10px] text-slate-500 font-bold leading-normal flex items-center justify-between">
              <span>Resiliencia ante desastres geológicos en vivo:</span>
              <InfoTooltip text="La simulación de huaicos introduce obstrucciones geológicas aleatorias en la red vial nacional de 1.4 millones de aristas. El motor nexus_router recalcula el bypass en la base de datos relacional en milisegundos." />
            </p>
            <button
              onClick={triggerLandslideSimulation}
              disabled={recalculatingLogistics}
              className="w-full flex items-center justify-center px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-455 border border-rose-500/30 rounded-lg transition-all text-xs font-bold disabled:opacity-50"
            >
              {recalculatingLogistics ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 mr-2 animate-spin" />
                  pgRouting Solver recalculando...
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

        {/* Center Column (Span 2): Leaflet Interactive Map Workspace */}
        <div className="xl:col-span-2 relative min-h-[500px] flex flex-col">
          <RiskMap 
            alerts={alerts}
            loading={alertsLoading}
            error={alertsError}
            backendMode={backendMode}
            lastUpdated={lastUpdated}
          />
        </div>

        {/* Right Column: Dynamic details side panel */}
        <div className="xl:col-span-1 space-y-4 flex flex-col justify-between max-h-[620px] overflow-y-auto">
          <div className="space-y-4 flex-1">
            <div className="glass-panel border border-slate-700/50 rounded-xl p-5 bg-[#0b0f19]/70 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
              
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                {activeDetail 
                  ? (dimension === 'alimentaria' ? "Logística e Itinerario de Carga" : dimension === 'recursos' ? "Balances de Cuenca Hídrica" : "Detalles de Alerta y Telemetría")
                  : "Análisis Territorial Integrado"
                }
              </h3>

              {activeDetail ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm flex items-center space-x-1.5">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{activeDetail.name}</span>
                    </h4>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-slate-800 text-rose-455 text-[9px] font-mono rounded font-bold">
                      Estado: {activeDetail.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
                    <div className="bg-slate-950 p-2 rounded border border-slate-850">
                      <span className="text-slate-500 block uppercase text-[8px]">{activeDetail.tempLabel}</span>
                      <span className="text-slate-200 font-bold block mt-1 flex items-center justify-center">
                        <Thermometer className="w-3 h-3 text-rose-400 mr-1" />
                        {activeDetail.tempVal}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-850">
                      <span className="text-slate-500 block uppercase text-[8px]">{activeDetail.humLabel}</span>
                      <span className="text-slate-200 font-bold block mt-1 flex items-center justify-center">
                        <CloudRain className="w-3 h-3 text-blue-400 mr-1" />
                        {activeDetail.humVal}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-[10px] text-slate-450 leading-relaxed font-mono">
                    <span className="font-bold text-slate-300 block mb-1">Métricas de Control:</span>
                    {activeDetail.details}
                  </div>

                  <button 
                    onClick={() => setActivePoint(null)}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] rounded font-bold text-slate-300 transition-colors"
                  >
                    Cerrar Detalles
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5 text-xs text-slate-400 leading-relaxed">
                  {dimension === 'alimentaria' ? (
                    <>
                      <div className="flex justify-between items-center font-bold text-slate-200">
                        <span>Canal de Ruta SAT-Agro Pro</span>
                        <InfoTooltip text="El planificador logístico de GeoTERRA está diseñado para predecir colapsos y desviar de forma proactiva la carga hacia la sierra. Las bajas temperaturas del Callejón de Huaylas actúan como refrigeración natural pasiva." />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Optimización de itinerarios fríos ante bloqueos geológicos.
                      </p>
                      
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-850 text-[9px] text-slate-500 leading-normal flex items-start justify-between">
                        <span className="flex items-start space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-450 shrink-0 mt-0.5" />
                          <span>
                            <strong>Ruteo Inteligente</strong> pgRouting en desvío Huaraz/Canta.
                          </span>
                        </span>
                        <InfoTooltip text="Algoritmo Dijkstra multihilo en Go calcula la ruta alternativa por Canta/Huaraz en menos de 50ms, mitigando el 96% de la pérdida por descomposición térmica de los cultivos." />
                      </div>
                    </>
                  ) : dimension === 'recursos' ? (
                    <>
                      <div className="flex justify-between items-center font-bold text-slate-200">
                        <span>Soporte O.M.N.I. TERRA</span>
                        <InfoTooltip text="O.M.N.I. TERRA calcula en milisegundos las tasas de infiltración edafológica (Green-Ampt) y transporte de humedad (Richards) a nivel nacional." />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Infiltración edafológica y balance hídrico continuo.
                      </p>

                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-850 text-[9px] text-slate-500 leading-normal flex items-start justify-between">
                        <span className="flex items-start space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Inteligencia Hídrica</strong> Fusión Sentinel-2 y Richards PDE.
                          </span>
                        </span>
                        <InfoTooltip text="Fusión de datos de reflectancia satelital Sentinel-2 (bandas infrarrojas de onda corta) con resolvedores Richards PDE para estimar salinidad, conductividad eléctrica y tasas de lixiviación óptimas." />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center font-bold text-slate-200">
                        <span>Motor N.E.X.U.S. 4D</span>
                        <InfoTooltip text="Sincronización directa en milisegundos con streams de aceleración sísmica del IGP y micro-climas del SENAMHI, mapeando vectores de evacuación en 3D." />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Unificación PostGIS relacional de amenazas multiescala.
                      </p>

                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-850 text-[9px] text-slate-500 leading-normal flex items-start justify-between">
                        <span className="flex items-start space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                          <span>
                            <strong>Garantía de Resiliencia</strong> Alertas tempranas automatizadas.
                          </span>
                        </span>
                        <InfoTooltip text="Modelos predictivos de deslizamiento y heladas gatillan notificaciones de Defensa Civil con hasta 48 horas de antelación vía SMS y LoRa a caseríos incomunicados." />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Rerouting Active Alert Banner */}
            {landslideSimulated && (
              <div className="glass-panel border border-rose-500/20 p-4 rounded-xl bg-rose-500/5 text-xs text-rose-455 space-y-2 animate-pulse">
                <div className="flex items-center font-bold text-rose-455">
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  <span>ALERTA: pgRouting Activo</span>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-300">
                  Desvío logístico rural activado en el servidor Go. Tránsito redirigido de forma automática por la vía Canta-Huaraz.
                </p>
                <div className="p-1.5 bg-cyan-950/20 border border-cyan-500/20 text-[10px] text-cyan-400 font-mono rounded font-bold">
                  Bypass exitoso (Mermas alimentarias mitigadas significativamente)
                </div>
              </div>
            )}
          </div>

          {/* Tracking panel */}
          <div className="glass-panel border border-slate-700/50 rounded-xl p-4 bg-[#0b0f19]/70 shrink-0">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center">
              <Truck className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              {dimension === 'alimentaria' ? "Flota en Desvío de Sierra" : dimension === 'recursos' ? "Estado de Riego Agrícola" : "Flota en Tránsito Regional"}
            </h4>
            
            {dimension === 'recursos' ? (
              <div className="space-y-1.5 font-mono text-[9px] text-slate-400">
                <div className="flex justify-between bg-slate-950/60 p-1.5 rounded border border-slate-900">
                  <span className="text-slate-300 font-bold">ZONA A (Piura)</span>
                  <span>Yeso Variable: 2.4 Tn/Ha</span>
                  <span className="text-emerald-450 font-bold">PROGRAMADO</span>
                </div>
                <div className="flex justify-between bg-slate-950/60 p-1.5 rounded border border-slate-900">
                  <span className="text-slate-300 font-bold">ZONA B (Chancay)</span>
                  <span>Riego: 45 min de compuerta</span>
                  <span className="text-cyan-400 font-bold">ACTIVO</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 font-mono text-[9px] text-slate-400">
                <div className="flex justify-between bg-slate-950/60 p-1.5 rounded border border-slate-900">
                  <span className="text-slate-300 font-bold">TRUCK-PE-01</span>
                  <span>Piura ──► Chiclayo</span>
                  <span className="text-emerald-450">75 km/h</span>
                </div>
                <div className="flex justify-between bg-slate-950/60 p-1.5 rounded border border-slate-900">
                  <span className="text-slate-300 font-bold">TRUCK-PE-02</span>
                  <span className={cn("transition-colors", landslideSimulated ? "text-cyan-400 animate-pulse" : "text-slate-450")}>
                    {landslideSimulated ? "Huaraz (Bypass)" : "Casma (Panam)"}
                  </span>
                  <span>{landslideSimulated ? "54 km/h" : "80 km/h"}</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
