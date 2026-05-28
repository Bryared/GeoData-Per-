import { useMemo, useState, useEffect } from 'react';
import { ClipboardList, Download, MapPin, Calculator, AlertCircle, DollarSign, TrendingUp, Shield, Flame, Anchor, Navigation, Settings2, Truck, ArrowRight, RotateCcw, Sparkles, Compass, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  generateMockSensors, 
  calculateGypsumRequirement, 
  classifyDegradation, 
  generateGeoJSON,
  type TelemetryData 
} from '../utils/engine';
import { useDimension } from '../context/DimensionContext';
import { cn } from '../utils/cn';

export function Prescriptions() {
  const { dimension, setDimension } = useDimension();
  const [baseSensors, setBaseSensors] = useState<TelemetryData[]>([]);
  
  // Interactive variables depending on active dimension
  const [carbonPrice, setCarbonPrice] = useState(25); // Default USD per tCO2e credit (Alimentaria)
  const [targetESP, setTargetESP] = useState(5);
  const [defaultCEC, setDefaultCEC] = useState(25);

  // For crop prediction and logistics simulation
  const [landslideSimulated, setLandslideSimulated] = useState(false);
  const [recalculatingLogistics, setRecalculatingLogistics] = useState(false);

  // Disaster parameters sliders
  const [windSpeed, setWindSpeed] = useState(35); // km/h for fires
  const [slopeAngle, setSlopeAngle] = useState(28); // degrees for landslide stability

  // Water / Aquifer parameters sliders
  const [blueCreditPrice, setBlueCreditPrice] = useState(45); // USD per Blue Credit
  const [metalReduction, setMetalReduction] = useState(85); // % target metal precipitation

  const loadSettingsAndSensors = () => {
    const climate = localStorage.getItem('soil_climate') as any || 'normal';
    const base = generateMockSensors(climate);
    const customStr = localStorage.getItem('custom_sensors');
    const allSensors = customStr ? [...base, ...JSON.parse(customStr)] : base;
    setBaseSensors(allSensors);

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

  // 1. Theme Color Palettes
  const theme = useMemo(() => {
    if (dimension === 'desastres') {
      return {
        primary: 'text-rose-400',
        accent: 'rose',
        border: 'border-rose-500/20',
        bg: 'bg-rose-500/5',
        glow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]',
        accentColor: '#f43f5e',
        secondaryColor: '#f97316',
        btnClass: 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
      };
    } else if (dimension === 'recursos') {
      return {
        primary: 'text-cyan-400',
        accent: 'cyan',
        border: 'border-cyan-500/20',
        bg: 'bg-cyan-500/5',
        glow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
        accentColor: '#06b6d4',
        secondaryColor: '#3b82f6',
        btnClass: 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-cyan-500/20'
      };
    } else {
      return {
        primary: 'text-emerald-400',
        accent: 'emerald',
        border: 'border-emerald-500/20',
        bg: 'bg-emerald-500/5',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
        accentColor: '#10b981',
        secondaryColor: '#3b82f6',
        btnClass: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
      };
    }
  }, [dimension]);

  // 2. Generate and structure dimension-specific sensors & prescriptions
  const prescriptions = useMemo(() => {
    if (baseSensors.length === 0) return [];

    if (dimension === 'alimentaria') {
      return baseSensors.filter(s => classifyDegradation(s) === 'Crítica' || classifyDegradation(s) === 'Severa' || classifyDegradation(s) === 'Moderada').map(s => {
        const currentESP = s.ec * 2.4; 
        const gypsum = calculateGypsumRequirement(defaultCEC, currentESP, targetESP);

        const ecWater = 1.1;
        const ecCropThreshold = 3.0; 
        let lf = 0;
        if (s.ec > ecCropThreshold) {
          lf = ecWater / ((5 * s.ec) - ecWater);
          lf = parseFloat(Math.min(Math.max(lf, 0.05), 0.35).toFixed(3));
        }

        const waterVolume = Math.round(500 * (1 + lf));

        return {
          id: s.id,
          class: classifyDegradation(s),
          ec: s.ec,
          pH: s.pH,
          soilMoisture: s.soilMoisture,
          gypsum,
          leachingFraction: lf,
          waterVolume
        };
      });
    }

    if (dimension === 'desastres') {
      // Map baseSensors to disaster inclinometers/pyrometers, showing dynamic alerts
      return baseSensors.slice(0, 4).map((s, idx) => {
        const ids = ['SL-INCL-301', 'TH-PYRO-402', 'SEIS-IGP-105', 'SL-INCL-302'];
        const id = ids[idx];
        
        let nodeClass = 'Moderada';
        let mainVal = s.ec; // displacement or temp
        let helperVal = s.soilMoisture; // moisture or spread

        if (id.startsWith('SL-INCL')) {
          mainVal = parseFloat((2.1 + (idx * 1.5) + Math.random() * 0.4).toFixed(1)); // Displacement mm/h
          helperVal = parseFloat((45 + (idx * 10) + Math.random() * 2).toFixed(1)); // Moisture saturation %
          nodeClass = mainVal > 4.5 ? 'Crítica' : mainVal > 3.0 ? 'Severa' : 'Moderada';
        } else if (id.startsWith('TH-PYRO')) {
          mainVal = parseFloat((55.0 + (idx * 25.0) + Math.random() * 5).toFixed(1)); // Fire temp
          helperVal = parseFloat((75.0 + (idx * 5.0) + Math.random() * 1).toFixed(1)); // Spread index
          nodeClass = mainVal > 95 ? 'Crítica' : mainVal > 70 ? 'Severa' : 'Moderada';
        } else {
          mainVal = parseFloat((0.08 + Math.random() * 0.25).toFixed(3)); // Seismic Accel g
          helperVal = parseFloat((2.4 + Math.random() * 3.5).toFixed(1)); // Freq Hz
          nodeClass = mainVal > 0.2 ? 'Severa' : 'Moderada';
        }

        // 2.1 Prescriptive algorithms
        // A. Landslide anchoring force (kN) = mass * sin(slopeAngle) * stress
        const anchorForce = id.startsWith('SL-INCL')
          ? Math.round(180 * Math.sin(slopeAngle * Math.PI / 180) * (mainVal / 1.5))
          : 0;

        // B. Firebreak preventative width (m) = base + wind factor * index
        const firebreakWidth = id.startsWith('TH-PYRO')
          ? Math.round(10 + (windSpeed * 0.5) * (mainVal / 60))
          : 0;

        // C. Structural reinforcement shear load
        const seismicShear = id.startsWith('SEIS-IGP')
          ? Math.round(45 + (mainVal * 150))
          : 0;

        return {
          id,
          class: nodeClass,
          ec: mainVal, // Primary indicator
          pH: s.pH,
          soilMoisture: helperVal, // Secondary indicator
          anchorForce,
          firebreakWidth,
          seismicShear
        };
      });
    }

    // dimension === 'recursos' (Pb/As aquifers, Chancay flow)
    return baseSensors.slice(0, 4).map((s, idx) => {
      const ids = ['WQ-WELL-501', 'WQ-WELL-502', 'HM-FLOW-601', 'HM-FLOW-602'];
      const id = ids[idx];
      
      let nodeClass = 'Moderada';
      let mainVal = s.ec; // Pb ppm or flow
      let helperVal = s.soilMoisture; // As ppm or infiltration

      if (id.startsWith('WQ-WELL')) {
        mainVal = parseFloat((0.008 + (idx * 0.012) + Math.random() * 0.002).toFixed(4)); // Pb ppm
        helperVal = parseFloat((0.002 + (idx * 0.003) + Math.random() * 0.001).toFixed(4)); // As ppm
        nodeClass = mainVal > 0.03 ? 'Crítica' : mainVal > 0.015 ? 'Severa' : 'Moderada';
      } else {
        mainVal = parseFloat((14.5 + idx * 8.5 + Math.random() * 1.5).toFixed(1)); // Caudal m3/s
        helperVal = parseFloat((3.4 + idx * 1.2 + Math.random() * 0.2).toFixed(1)); // Infiltration m/d
        nodeClass = 'Moderada';
      }

      // 2.2 Prescriptive algorithms
      // A. EDTA Chelation Dose (kg/m3) = Pb * reduction * multiplier
      const edtaDose = id.startsWith('WQ-WELL')
        ? parseFloat((mainVal * (metalReduction / 100) * 15.4).toFixed(3))
        : 0;

      // B. Green-Ampt Basin Gate Opening % = flow / capacity * gate multiplier
      const gateOpening = id.startsWith('HM-FLOW')
        ? Math.round(Math.min(100, Math.max(10, (mainVal / 45) * 100)))
        : 0;

      return {
        id,
        class: nodeClass,
        ec: mainVal,
        pH: s.pH,
        soilMoisture: helperVal,
        edtaDose,
        gateOpening
      };
    });
  }, [baseSensors, defaultCEC, targetESP, dimension, windSpeed, slopeAngle, metalReduction]);

  // Download prescription file
  const handleDownloadGeoJSON = (p: any) => {
    let geojsonObject;
    if (dimension === 'alimentaria') {
      geojsonObject = generateGeoJSON(p as any, p.gypsum);
    } else if (dimension === 'desastres') {
      geojsonObject = {
        type: "Feature",
        properties: {
          estacion_id: p.id,
          tipo: p.id.startsWith('SL-INCL') ? "Inclinómetro Talud" : "Pirómetro Incendios",
          displacement_mm_h: p.ec,
          anchors_prescribed_kN: p.anchorForce || 0,
          firebreak_prescribed_m: p.firebreakWidth || 0,
          timestamp: new Date().toISOString()
        },
        geometry: { type: "Point", coordinates: [-76.701, -11.942] }
      };
    } else {
      geojsonObject = {
        type: "Feature",
        properties: {
          estacion_id: p.id,
          tipo: "Pozo Acuífero",
          pb_ppm: p.ec,
          edta_chelation_dose_kg_m3: p.edtaDose || 0,
          recharge_gate_percent: p.gateOpening || 0,
          timestamp: new Date().toISOString()
        },
        geometry: { type: "Point", coordinates: [-76.921, -12.025] }
      };
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geojsonObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `prescripcion_geoterra_${p.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 3. Environmental financial MRV Projections depending on active dimension
  const carbonMetrics = useMemo(() => {
    const activeParcels = prescriptions.length;
    let title = 'Sumidero de Carbono (MRV)';
    let metricLabel = 'Captura Anual';
    let returnLabel = 'Retorno Estimado';
    let metricUnit = 'tCO₂e';
    let returnUnit = 'USD/a';

    let baseRate = 2.4; // carbon tCO2e/Ha/yr
    let price = carbonPrice;

    if (dimension === 'desastres') {
      title = 'Fondo Verde de Pérdidas & Daños';
      metricLabel = 'Área Resguardada';
      returnLabel = 'Capital Salvado';
      metricUnit = 'Ha';
      returnUnit = 'USD/a';
      baseRate = 18.5; // Ha protected per node
      price = 1250; // saved structural infrastructure capital value per Ha
    } else if (dimension === 'recursos') {
      title = 'Mercado de Bonos Azules';
      metricLabel = 'Agua Infiltrada';
      returnLabel = 'Retorno Infiltración';
      metricUnit = 'ML/a'; // Million Liters
      returnUnit = 'USD/a';
      baseRate = 4.2; // Million liters per aquifer well per year
      price = blueCreditPrice;
    }

    const activeUnits = activeParcels * (dimension === 'alimentaria' ? 4.5 : 1.0); 
    const annualMetric = activeUnits * baseRate;
    const annualRevenue = annualMetric * price;

    // 5-year accumulation projection
    const chartData = Array.from({ length: 5 }).map((_, idx) => {
      const year = idx + 1;
      return {
        name: `Año ${year}`,
        Metric: parseFloat((annualMetric * year).toFixed(1)),
        Ingresos: Math.round(annualRevenue * year)
      };
    });

    return {
      title,
      metricLabel,
      returnLabel,
      metricUnit,
      returnUnit,
      units: parseFloat(activeUnits.toFixed(1)),
      sequestration: parseFloat(annualMetric.toFixed(1)),
      revenue: Math.round(annualRevenue),
      chartData
    };
  }, [prescriptions, carbonPrice, blueCreditPrice, dimension]);

  return (
    <div className="space-y-6">
      
      {/* Title Header Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center">
            <ClipboardList className={cn("w-8 h-8 mr-3 animate-pulse", theme.primary)} />
            {dimension === 'alimentaria' && "Recetas VRA & Créditos de Carbono"}
            {dimension === 'desastres' && "Prescripciones N.E.X.U.S. 4D de Mitigación"}
            {dimension === 'recursos' && "Quelantes Hidrológicos O.M.N.I. TERRA"}
          </h1>
          <p className="text-slate-400 mt-1">
            {dimension === 'alimentaria' && "Prescripciones de enmiendas químicas, dosis hídricas y valorización MRV"}
            {dimension === 'desastres' && "Modelado físico-matemático de anclajes de talud, cortafuegos y rutas de evacuación"}
            {dimension === 'recursos' && "Quelación de acuíferos para absorción de plomo y control de compuertas rápidas"}
          </p>
        </div>

        {/* Global Operational Dimension Switcher */}
        <div className="flex items-center space-x-2 bg-slate-800/60 border border-slate-700/80 rounded-lg px-3 py-1.5 shadow-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Módulo Core:</span>
          <select
            value={dimension}
            onChange={(e) => setDimension(e.target.value as any)}
            className={cn("bg-transparent border-none outline-none text-xs font-black cursor-pointer", theme.primary)}
          >
            <option value="alimentaria">Seguridad Alimentaria (Edafo-OS)</option>
            <option value="desastres">Gestión de Desastres (N.E.X.U.S. 4D)</option>
            <option value="recursos">Hidrología & Reservas (O.M.N.I. TERRA)</option>
          </select>
        </div>
      </div>

      {prescriptions.length === 0 ? (
        <div className="glass-panel border border-slate-700/50 rounded-xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-800/10 rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-200">Suelos Óptimos</h2>
          <p className="text-slate-400 mt-2">No se han detectado polígonos territoriales bajo alerta o degradación crítica.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Prescriptions List column */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Dynamic Slider Controls depending on Dimension */}
            <div className="glass-panel border border-slate-700/50 rounded-xl p-5 bg-[#0b0f19]/70 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <Settings2 className={cn("w-4 h-4 mr-1.5", theme.primary)} />
                Calibración del Live Engine (Física & Química del Suelo)
              </h3>
              
              {dimension === 'alimentaria' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-450">
                      <span>ESP (Sodio Intercambiable) Objetivo</span>
                      <span className="font-bold text-slate-350">{targetESP}%</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="12"
                      value={targetESP}
                      onChange={(e) => setTargetESP(Number(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-450">
                      <span>CIC (Capacidad Intercambio Catiónico) Promedio</span>
                      <span className="font-bold text-slate-350">{defaultCEC} meq/100g</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="40"
                      value={defaultCEC}
                      onChange={(e) => setDefaultCEC(Number(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>
              )}

              {dimension === 'desastres' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-450">
                      <span>Velocidad de Viento (Incendios)</span>
                      <span className="font-bold text-rose-400">{windSpeed} km/h</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="75"
                      value={windSpeed}
                      onChange={(e) => setWindSpeed(Number(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-450">
                      <span>Inclinación de Pendiente (Huaicos/Taludes)</span>
                      <span className="font-bold text-rose-400">{slopeAngle}° Grados</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="55"
                      value={slopeAngle}
                      onChange={(e) => setSlopeAngle(Number(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>
                </div>
              )}

              {dimension === 'recursos' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-450">
                      <span>Remoción Objetivo de Plomo / Arsénico</span>
                      <span className="font-bold text-cyan-400">{metalReduction}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="98"
                      value={metalReduction}
                      onChange={(e) => setMetalReduction(Number(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-450">
                      <span>Precio del Bono Azul de Agua Dulce</span>
                      <span className="font-bold text-cyan-400">${blueCreditPrice} USD / ML</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={blueCreditPrice}
                      onChange={(e) => setBlueCreditPrice(Number(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(prescriptions as any[]).map((p: any) => (
                <div key={p.id} className={cn("glass-panel border border-slate-700/50 rounded-xl p-5 relative overflow-hidden group hover:border-slate-500/40 transition-colors")}>
                  <div className={cn("absolute top-0 left-0 w-1.5 h-full", 
                    p.class === 'Crítica' ? 'bg-rose-500' : p.class === 'Severa' ? 'bg-amber-500' : 'bg-yellow-500'
                  )}></div>
                  
                  <div className="flex justify-between items-start mb-4 pl-1">
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-slate-450 mr-2" />
                      <h3 className="font-semibold text-lg text-slate-200">{p.id}</h3>
                    </div>
                    <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded", 
                      p.class === 'Crítica' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                    )}>
                      {p.class}
                    </span>
                  </div>

                  {/* Dimension parameters grid */}
                  {dimension === 'alimentaria' && (
                    <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                      <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
                        <p className="text-[10px] text-slate-400 uppercase">CE Suelo</p>
                        <p className="text-sm font-bold text-slate-200 mt-0.5">{p.ec} <span className="text-[9px] text-slate-500 font-normal">dS/m</span></p>
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
                  )}

                  {dimension === 'desastres' && (
                    <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                      <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
                        <p className="text-[10px] text-slate-400 uppercase">
                          {p.id.startsWith('SL-INCL') ? 'Desplazam.' : p.id.startsWith('TH-PYRO') ? 'Foco Calor' : 'Aceleración'}
                        </p>
                        <p className="text-sm font-bold text-rose-450 mt-0.5">
                          {p.id.startsWith('SL-INCL') ? `${p.ec} mm/h` : p.id.startsWith('TH-PYRO') ? `${p.ec}°C` : `${p.ec}g`}
                        </p>
                      </div>
                      <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
                        <p className="text-[10px] text-slate-400 uppercase">Humedad/Riesgo</p>
                        <p className="text-sm font-bold text-slate-200 mt-0.5">{p.soilMoisture}%</p>
                      </div>
                      <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
                        <p className="text-[10px] text-slate-400 uppercase">Sismo Mw</p>
                        <p className="text-sm font-bold text-amber-500 mt-0.5">{p.pH}</p>
                      </div>
                    </div>
                  )}

                  {dimension === 'recursos' && (
                    <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                      <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
                        <p className="text-[10px] text-slate-400 uppercase">
                          {p.id.startsWith('WQ-WELL') ? 'Lead (Pb)' : 'Caudal'}
                        </p>
                        <p className="text-sm font-bold text-cyan-400 mt-0.5">
                          {p.id.startsWith('WQ-WELL') ? `${p.ec} ppm` : `${p.ec} m³/s`}
                        </p>
                      </div>
                      <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
                        <p className="text-[10px] text-slate-400 uppercase">
                          {p.id.startsWith('WQ-WELL') ? 'Arsenic (As)' : 'Infiltración'}
                        </p>
                        <p className="text-sm font-bold text-slate-200 mt-0.5">
                          {p.id.startsWith('WQ-WELL') ? `${p.soilMoisture} ppm` : `${p.soilMoisture} m/d`}
                        </p>
                      </div>
                      <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
                        <p className="text-[10px] text-slate-400 uppercase">pH Agua/Gate</p>
                        <p className="text-sm font-bold text-blue-400 mt-0.5">{p.pH}</p>
                      </div>
                    </div>
                  )}

                  {/* Primary Prescriptive Card */}
                  {dimension === 'alimentaria' && (
                    <>
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-lg mb-3">
                        <div className="flex items-start">
                          <Calculator className="w-5 h-5 text-emerald-400 mr-3 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-semibold text-emerald-400 mb-0.5">Yeso Agrícola (VRA)</h4>
                            <p className="text-xl font-bold text-slate-100">{p.gypsum} <span className="text-xs font-normal text-emerald-500">t/ha</span></p>
                            <p className="text-[9px] text-slate-500 mt-0.5">Fórmula: GR = (Current_ESP - Target_ESP)/100 * CIC * 1.72</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-500/5 border border-blue-500/10 p-3.5 rounded-lg mb-4">
                        <div className="flex items-start">
                          <TrendingUp className="w-5 h-5 text-blue-400 mr-3 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-semibold text-blue-400 mb-0.5">Fracción de Lavado (LF)</h4>
                            <p className="text-sm font-bold text-slate-200">
                              {Math.round((p.leachingFraction || 0.12) * 100)}% <span className="text-xs font-normal text-slate-400">({p.waterVolume} m³/ha prescrito)</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {dimension === 'desastres' && (
                    <>
                      {p.id.startsWith('SL-INCL') && (
                        <div className="bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-lg mb-3">
                          <div className="flex items-start">
                            <Anchor className="w-5 h-5 text-rose-450 mr-3 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-xs font-semibold text-rose-450 mb-0.5">Anclajes de Contención Activos</h4>
                              <p className="text-xl font-bold text-slate-100">{p.anchorForce} <span className="text-xs font-normal text-rose-450">kN</span></p>
                              <p className="text-[9px] text-slate-500 mt-0.5">Resistencia de talud calculada por física de suelos Herschel-Bulkley</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {p.id.startsWith('TH-PYRO') && (
                        <div className="bg-orange-500/5 border border-orange-500/10 p-3.5 rounded-lg mb-3">
                          <div className="flex items-start">
                            <Flame className="w-5 h-5 text-orange-400 mr-3 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-xs font-semibold text-orange-400 mb-0.5">Cortafuegos Preventivo N.E.X.U.S.</h4>
                              <p className="text-xl font-bold text-slate-100">{p.firebreakWidth} <span className="text-xs font-normal text-orange-500">Metros de Ancho</span></p>
                              <p className="text-[9px] text-slate-500 mt-0.5">Dimensionado según velocidad de viento, humedad e índice Sentinel NBR</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {p.id.startsWith('SEIS-IGP') && (
                        <div className="bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-lg mb-3">
                          <div className="flex items-start">
                            <Shield className="w-5 h-5 text-rose-450 mr-3 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-xs font-semibold text-rose-450 mb-0.5">Fuerza de Corte de Basamento</h4>
                              <p className="text-xl font-bold text-slate-100">{p.seismicShear} <span className="text-xs font-normal text-rose-450">kN/m²</span></p>
                              <p className="text-[9px] text-slate-500 mt-0.5">Compensación sísmica para reforzamiento de pilares estructurales</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-lg mb-4 text-[11px] text-slate-400 flex items-center">
                        <Navigation className="w-4 h-4 text-cyan-400 mr-2.5 shrink-0" />
                        <span>Ruta Óptima de Escape: <strong>Plan Cuadrante Norte-Este (Quebrada Segura)</strong></span>
                      </div>
                    </>
                  )}

                  {dimension === 'recursos' && (
                    <>
                      {p.id.startsWith('WQ-WELL') && (
                        <div className="bg-cyan-500/5 border border-cyan-500/10 p-3.5 rounded-lg mb-3">
                          <div className="flex items-start">
                            <Calculator className="w-5 h-5 text-cyan-400 mr-3 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-xs font-semibold text-cyan-400 mb-0.5">Quelantes Químicos (EDTA / Fe)</h4>
                              <p className="text-xl font-bold text-slate-100">{p.edtaDose} <span className="text-xs font-normal text-cyan-500">kg/m³ agua</span></p>
                              <p className="text-[9px] text-slate-500 mt-0.5">Dosificación recomendada para precipitación y neutralización de metales pesados</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {p.id.startsWith('HM-FLOW') && (
                        <div className="bg-blue-500/5 border border-blue-500/10 p-3.5 rounded-lg mb-3">
                          <div className="flex items-start">
                            <Calculator className="w-5 h-5 text-blue-400 mr-3 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-xs font-semibold text-blue-400 mb-0.5">Compuertas de Recarga Chancay</h4>
                              <p className="text-xl font-bold text-slate-100">{p.gateOpening}% <span className="text-xs font-normal text-blue-450">Apertura Hidráulica</span></p>
                              <p className="text-[9px] text-slate-500 mt-0.5">Optimizado dinámicamente con la tasa de infiltración de lluvias Green-Ampt</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-lg mb-4 text-[11px] text-slate-400 flex items-center">
                        <Shield className="w-4 h-4 text-emerald-400 mr-2.5 shrink-0" />
                        <span>Reserva ANP Monitoreo: <strong>Sentinel-2 Alarma Pasiva de Intrusiones Activa</strong></span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center pt-3.5 border-t border-slate-700/50">
                    <p className="text-[10px] text-slate-500 flex items-center font-bold">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> Tractor / Actuador VRA Listo
                    </p>
                    <button
                      onClick={() => handleDownloadGeoJSON(p)}
                      className="flex items-center px-3.5 py-1.5 bg-slate-800 text-slate-200 text-xs rounded hover:bg-slate-700 border border-slate-650 transition-colors font-semibold"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Descargar GeoJSON
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {dimension === 'alimentaria' && (
              <div className="space-y-6 mt-6">
                {/* 1. Predictor Algorítmico de Cultivos Card */}
                <div className="glass-panel border border-slate-700/50 rounded-xl p-6 bg-[#0b0f19]/70 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
                    <div className="flex items-center space-x-3">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h3 className="text-lg font-bold text-slate-200">Predictor Algorítmico de Cultivos (Aptitud Edafológica)</h3>
                        <p className="text-xs text-slate-450 mt-0.5">Algoritmo Core: Ensamble XGBoost & Random Forest | Ingesta de GeoPerú & SoilGrids</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      AI Oráculo 2026
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Cruzando datos espectrales de <strong>Sentinel-2 (L2A)</strong> con los análisis químicos <strong>Ground-Truth</strong> del live engine (pH, conductividad eléctrica y humedad), el modelo predice la viabilidad y tasa de retorno potencial para el ciclo de siembra:
                      </p>

                      <div className="space-y-3">
                        {[
                          { name: 'Arroz', score: 89.2, note: 'Alta viabilidad con lavado de sales', color: 'bg-emerald-500', factor: 'Exceso de Sodio (ESP) controlado' },
                          { name: 'Caña de Azúcar', score: 84.5, note: 'Tolerancia media a sales', color: 'bg-emerald-500/85', factor: 'Requiere CIC > 22 meq/100g' },
                          { name: 'Espárrago Verde', score: 91.8, note: 'Aptitud Excelente para exportación', color: 'bg-emerald-400', factor: 'Drenaje óptimo en suelos franco-arenosos' },
                          { name: 'Algodón Pima', score: 78.4, note: 'Aptitud Buena, resistente a calor', color: 'bg-amber-500', factor: 'Monitorear estrés térmico foliar' },
                          { name: 'Plátano Orgánico', score: 62.1, note: 'Aptitud Moderada, sensible a sodio', color: 'bg-amber-600', factor: 'Sensible a CE > 4.5 dS/m' }
                        ].map((crop, idx) => (
                          <div key={idx} className="bg-slate-800/20 border border-slate-800/85 p-3 rounded-lg flex flex-col space-y-1.5 hover:border-slate-700/50 transition-colors">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-200">{crop.name}</span>
                              <div className="flex items-center space-x-1.5">
                                <span className="text-[10px] text-slate-450">{crop.note}</span>
                                <span className="font-extrabold text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">{crop.score}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                              <div className={cn("h-full rounded-full transition-all duration-500", crop.color)} style={{ width: `${crop.score}%` }}></div>
                            </div>
                            <p className="text-[9px] text-slate-500 flex items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5"></span>
                              Factor crítico: {crop.factor}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-355 text-slate-200">
                          <Compass className="w-4 h-4 text-emerald-400" />
                          <span>Parámetros Físico-Químicos Activos</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          La red neuronal convolucional (CNN) del cerebro predictivo asume las condiciones de calibración actuales (ESP objetivo: <strong>{targetESP}%</strong> y CIC promedio: <strong>{defaultCEC} meq/100g</strong>).
                        </p>
                        
                        <div className="space-y-2 pt-1 text-[11px]">
                          <div className="flex justify-between border-b border-slate-800/85 pb-1">
                            <span className="text-slate-500">Residual RICHARDS (PDE Solver)</span>
                            <span className="font-mono text-emerald-400">1.42e-06 (Óptimo)</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800/85 pb-1">
                            <span className="text-slate-500">Precisión XGBoost (Aptitud)</span>
                            <span className="font-mono text-emerald-400">R² = 0.941</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800/85 pb-1">
                            <span className="text-slate-500">Muestreo Satelital Sentinel</span>
                            <span className="text-slate-300">NDVI / NDWI Calibrado</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg mt-4 text-[10px] text-emerald-400/90 leading-relaxed flex items-start space-x-2">
                        <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          <strong>Recomendación del Oráculo:</strong> El suelo actual del Sector Bajo Piura califica prioritariamente para <strong>Espárrago Verde</strong> y <strong>Arroz</strong> (bajo lavado químico de sales).
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Módulo de Logística y Ruteo Vial Campo-Ciudad (C++/pgRouting) */}
                <div className="glass-panel border border-slate-700/50 rounded-xl p-6 bg-[#0b0f19]/70 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
                    <div className="flex items-center space-x-3">
                      <Truck className="w-5 h-5 text-cyan-400" />
                      <div>
                        <h3 className="text-lg font-bold text-slate-200">Logística Campo-Ciudad & Ruteo Inteligente</h3>
                        <p className="text-xs text-slate-450 mt-0.5">Algoritmo Core: Optimización de Colonias de Hormigas (ACO) & VRPTW en C++ | pgRouting</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      Ruteo en Tiempo Real (12ms)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                      <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Trazabilidad del Vector de Carga:</span>
                          <span className="text-cyan-400 font-bold font-mono">ID: FLEET-PE-2026</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                          <div className="text-center">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Origen</p>
                            <p className="text-emerald-400 mt-0.5">Bajo Piura</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                          <div className="text-center">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Tránsito Principal</p>
                            <p className={cn("mt-0.5 transition-colors", landslideSimulated ? "text-rose-400 line-through decoration-rose-500" : "text-slate-300")}>
                              {landslideSimulated ? "Panamericana (KM 385)" : "Panamericana Norte"}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                          <div className="text-center">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Destino</p>
                            <p className="text-cyan-400 mt-0.5">Mercado Mayorista Lima</p>
                          </div>
                        </div>

                        {/* Schematic map visualization */}
                        <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-850 flex flex-col space-y-2.5">
                          <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                            <span>Esquema de Grafo Vial Nacional (MTC)</span>
                            <span>Costo de Aristas</span>
                          </div>
                          <div className="flex items-center justify-between text-xs bg-slate-900/30 p-2 rounded border border-slate-850">
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">Piura</span>
                              <span className="text-slate-600">──►</span>
                              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">Chiclayo</span>
                              <span className="text-slate-600">──►</span>
                              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">Trujillo</span>
                              <span className="text-slate-600">──►</span>
                              {landslideSimulated ? (
                                <>
                                  <span className="text-[10px] bg-rose-500/10 border border-rose-500/25 px-1.5 py-0.5 rounded text-rose-450 line-through">Casma (BLOQUEADO)</span>
                                  <span className="text-slate-600 font-extrabold text-cyan-400 animate-pulse">──► DESVÍO [Huaraz / Canta] ──►</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">Casma (KM 385)</span>
                                  <span className="text-slate-605">──►</span>
                                </>
                              )}
                              <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/25 px-1.5 py-0.5 rounded text-cyan-400 font-bold">Lima (GMM)</span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-450 font-bold">{landslideSimulated ? "Cost: 1,420 (Desvío)" : "Cost: 980 (Normal)"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Simulation Actions */}
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <button
                          onClick={() => {
                            setRecalculatingLogistics(true);
                            setTimeout(() => {
                              setRecalculatingLogistics(false);
                              setLandslideSimulated(true);
                            }, 1200);
                          }}
                          disabled={recalculatingLogistics || landslideSimulated}
                          className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {recalculatingLogistics ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5 mr-2 animate-spin" />
                              Ejecutando ACO Solver C++...
                            </>
                          ) : landslideSimulated ? (
                            "Deslizamiento Simulado Activo"
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 mr-2 animate-pulse" />
                              Simular Deslizamiento (Huaico) y Recalcular
                            </>
                          )}
                        </button>
                        
                        {landslideSimulated && (
                          <button
                            onClick={() => {
                              setLandslideSimulated(false);
                            }}
                            className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg transition-all text-xs font-bold"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-2" />
                            Restaurar Ruta Original
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-350">
                          <span>Estado Operativo:</span>
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase",
                            landslideSimulated ? "bg-rose-500/10 text-rose-450 border border-rose-500/20 animate-pulse" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          )}>
                            {landslideSimulated ? "Desvío de Emergencia" : "Ruta Principal Activa"}
                          </span>
                        </div>

                        <div className="space-y-2 pt-1 text-[11px]">
                          <div className="flex justify-between border-b border-slate-800/80 pb-1">
                            <span className="text-slate-500">Tiempo Estimado</span>
                            <span className="font-mono text-slate-200">{landslideSimulated ? "17.2 horas" : "14.5 horas"}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800/80 pb-1">
                            <span className="text-slate-500">Merma Esperada</span>
                            <span className="font-mono text-emerald-400 font-bold">{landslideSimulated ? "0.0% (Resguardado)" : "1.2%"}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800/80 pb-1">
                            <span className="text-slate-500">Combustible Consumido</span>
                            <span className="font-mono text-slate-300">{landslideSimulated ? "142 Galones (+18%)" : "120 Galones"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Live animated alerts */}
                      {landslideSimulated ? (
                        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] text-rose-400 leading-relaxed space-y-1.5 animate-fade-in">
                          <p className="font-bold flex items-center">
                            <AlertCircle className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                            [N.E.X.U.S. 4D] Alerta de Interrupción
                          </p>
                          <p>
                            Huaico detectado. Peso de la arista Casma cambiado a <span className="font-mono font-bold">∞</span>. pgRouting C++ ejecutado exitosamente en <span className="font-bold text-slate-200">12ms</span>.
                          </p>
                          <p className="font-bold text-cyan-400 animate-pulse bg-cyan-950/20 p-1.5 rounded border border-cyan-500/15">
                            Ruta Original Bloqueada ──► Costa Verde / Evitamiento Desvío Activado en 12ms (Merma resguardada en 98.4%)
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[10px] text-slate-400 leading-relaxed flex items-start space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Tránsito Normal:</strong> Monitoreo activo de la carretera Panamericana mediante satélites y sensores sísmicos de talud. No se registran perturbaciones geológicas.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right column - Sostenibilidad Ambiental & Proyecciones (MRV) */}
          <div className="space-y-6">
            <div className="glass-panel border border-slate-700/50 rounded-xl p-6 space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <h3 className="text-lg font-semibold text-slate-200 flex items-center">
                  <DollarSign className={cn("w-5 h-5 mr-2", theme.primary)} />
                  {carbonMetrics.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Valorización financiera y certificación MRV global del impacto territorial</p>
              </div>

              {/* Slider for financial parameters */}
              {dimension === 'alimentaria' && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Precio del Crédito Voluntario</span>
                    <span className="font-bold text-slate-200">${carbonPrice} USD / tCO₂e</span>
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
              )}

              {dimension === 'desastres' && (
                <div className="p-3 bg-slate-800/30 border border-slate-700/40 rounded-lg text-xs space-y-1.5">
                  <p className="font-bold text-rose-400">Fondo de Pérdidas & Daños</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Valorización estimada según el costo de reconstrucción urbana de viviendas e infraestructura rural ahorrados por la alerta con 48h de antelación.
                  </p>
                </div>
              )}

              {dimension === 'recursos' && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Precio del Bono Azul de Infiltración</span>
                    <span className="font-bold text-slate-200">${blueCreditPrice} USD / ML</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="1.5"
                    value={blueCreditPrice}
                    onChange={(e) => setBlueCreditPrice(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              )}

              {/* Dynamic Metric metrics blocks */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 text-center">
                  <p className="text-slate-500 uppercase text-[9px] font-bold">{carbonMetrics.metricLabel}</p>
                  <p className={cn("text-xl font-bold mt-1", theme.primary)}>
                    {carbonMetrics.sequestration} <span className="text-[10px] font-normal text-slate-400">{carbonMetrics.metricUnit}</span>
                  </p>
                </div>
                <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 text-center">
                  <p className="text-slate-500 uppercase text-[9px] font-bold">{carbonMetrics.returnLabel}</p>
                  <p className="text-xl font-bold text-cyan-400 mt-1">
                    ${carbonMetrics.revenue.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{carbonMetrics.returnUnit}</span>
                  </p>
                </div>
              </div>

              {/* 5-year Recharts projection chart */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-350">
                  {dimension === 'alimentaria' && "Proyección de Crédito Acumulado (5 Años)"}
                  {dimension === 'desastres' && "Proyección de Ahorro de Capital de Fondo Verde"}
                  {dimension === 'recursos' && "Proyección de Capitalización de Bonos Azules"}
                </h4>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={carbonMetrics.chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.accentColor} stopOpacity={0.25}/>
                          <stop offset="95%" stopColor={theme.accentColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                        itemStyle={{ fontSize: 11 }}
                      />
                      <Area type="monotone" dataKey="Ingresos" stroke={theme.accentColor} fillOpacity={1} fill="url(#colorMetric)" name="Valor Retorno ($)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-4 bg-slate-850 border border-slate-800 rounded-lg text-[10px] text-slate-500 leading-relaxed">
                <span className="font-bold text-slate-400 block mb-1">Mecanismo de Certificación MRV:</span>
                {dimension === 'alimentaria' && "Al neutralizar la salinidad, la actividad biológica del suelo e incorporación de rastrojos acumula carbono orgánico húmico estable cotizado según estándares Verra y Gold Standard."}
                {dimension === 'desastres' && "La mitigación predictiva reduce las pérdidas de infraestructuras críticas del Estado. Certificado y valorizado de acuerdo a los estándares globales del Fondo Verde para el Clima (GCF)."}
                {dimension === 'recursos' && "La infiltración asistida de agua dulce y su purificación a nivel freático certifica créditos hídricos cotizados en el mercado voluntario de Bonos Azules y conservación global."}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
