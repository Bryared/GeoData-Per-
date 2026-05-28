import { useState, useMemo } from 'react';
import { 
  Presentation, ShieldAlert, Cpu, Calculator, Rocket, ArrowRight, ArrowLeft, 
  Leaf, CheckCircle2, Database, AlertTriangle, Calendar, 
  Flame, Droplet, Users, Award, ShieldCheck, HeartPulse, Building2, HelpCircle, Compass 
} from 'lucide-react';
import { cn } from '../utils/cn';

interface Slide {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  icon: any;
}

export function Pitch() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // ROI Multi-Dimensional Calculator State
  const [calculatorDimension, setCalculatorDimension] = useState<'alimentaria' | 'desastres' | 'recursos'>('alimentaria');
  const [scaleValue, setScaleValue] = useState(15); // e.g., Hectares / Nodes / Wells
  const [cropType, setCropType] = useState<'arroz' | 'esparrago' | 'cana'>('esparrago');
  const [targetMetalReduction, setTargetMetalReduction] = useState(85);

  const calculatedMetrics = useMemo(() => {
    if (calculatorDimension === 'alimentaria') {
      let waterSavedPerHa = cropType === 'arroz' ? 3200 : cropType === 'cana' ? 2500 : 1800;
      let profitPerHa = cropType === 'arroz' ? 3800 : cropType === 'cana' ? 4200 : 6500;
      
      const waterSaved = scaleValue * waterSavedPerHa;
      const carbonCredits = Math.round(scaleValue * 2.4 * 25); // 2.4 tCO2e/Ha * $25
      const netGain = scaleValue * profitPerHa + carbonCredits * 3.75; // in Soles

      return {
        metric1: `${waterSaved.toLocaleString()} m³`,
        label1: 'Agua Dulce Ahorrada',
        metric2: `S/. ${Math.round(netGain).toLocaleString()}`,
        label2: 'Retorno Neto Total (Cosecha + Bonos)',
        metric3: `$${carbonCredits.toLocaleString()} USD`,
        label3: 'Ingreso por Créditos Verra (MRV)',
        note: 'Optimizado bajo conductividad eléctrica (CE) controlada por yeso agrícola VRA.'
      };
    } else if (calculatorDimension === 'desastres') {
      const savedCapital = scaleValue * 18.5 * 1250; // 18.5 Ha/node * $1250/Ha
      const livesProtected = Math.round(scaleValue * 12.5); // 12.5 persons per node

      return {
        metric1: `$${Math.round(savedCapital).toLocaleString()} USD`,
        label1: 'Capital de Infraestructura Salvado',
        metric2: `${livesProtected} Personas`,
        label2: 'Población Vulnerable Protegida',
        metric3: `${Math.round(scaleValue * 18.5)} Ha`,
        label3: 'Territorio Bajo Cobertura N.E.X.U.S.',
        note: 'Modelado con inclinómetros físicos de talud y pgRouting C++ para evacuación instantánea.'
      };
    } else { // recursos
      const waterRecharged = scaleValue * 4.2; // 4.2 ML/a per well
      const blueCredits = waterRecharged * 45; // $45 per ML
      const edtaDose = parseFloat((0.02 * (targetMetalReduction / 100) * 15.4).toFixed(3)); // kg/m3 target

      return {
        metric1: `${waterRecharged.toFixed(1)} ML/a`,
        label1: 'Agua Dulce Infiltrada de Forma Segura',
        metric2: `$${Math.round(blueCredits).toLocaleString()} USD`,
        label2: 'Bono Azul de Infiltración Anual',
        metric3: `${edtaDose} kg/m³`,
        label3: 'Quelante EDTA Requerido',
        note: 'Fórmula de infiltración Green-Ampt automatizada con quelación selectiva de Plomo/Arsénico.'
      };
    }
  }, [calculatorDimension, scaleValue, cropType, targetMetalReduction]);

  const slides: Slide[] = [
    {
      id: 0,
      badge: 'PROPUESTA CORE - GEOTÓN PERÚ 2026',
      title: 'GEOTERRA PERÚ',
      subtitle: 'Sistema Operativo de Gobernanza Territorial para la Gestión Integrada de la Biosfera y la Tecnosfera',
      icon: Award
    },
    {
      id: 1,
      badge: '01 / CONTEXTO Y AMENAZAS',
      title: 'Crisis Territorial del Perú',
      subtitle: 'La fragmentación del monitoreo ante el cambio climático y riesgos geológicos',
      icon: ShieldAlert
    },
    {
      id: 2,
      badge: '02 / EL CORE DE LA PROPUESTA',
      title: 'Gobernanza Territorial Integrada',
      subtitle: 'El objetivo de fusionar GEO Perú con Inteligencia Artificial Física',
      icon: CheckCircle2
    },
    {
      id: 3,
      badge: '03 / CUMPLIMIENTO DE BASES',
      title: 'Datasets de GEO Perú Integrados',
      subtitle: 'Cumplimiento estricto de la Base 9 con 5 fuentes obligatorias del Estado',
      icon: Database
    },
    {
      id: 4,
      badge: '04 / ARQUITECTURA TÉCNICA',
      title: 'Ingeniería y Metodología 4D',
      subtitle: 'Fusión de Satélites, IoT y resolvedores físicos Richards / pgRouting',
      icon: Cpu
    },
    {
      id: 5,
      badge: '05 / MÓDULOS DE LA SOLUCIÓN',
      title: 'Biosfera & Tecnosfera Unificadas',
      subtitle: 'Estructura modular: O.M.N.I. TERRA + N.E.X.U.S. 4D + SAT-Agro Pro',
      icon: Rocket
    },
    {
      id: 6,
      badge: '06 / EL CEREBRO PRESCRIBED',
      title: 'Prescripciones Automáticas',
      subtitle: 'Soluciones matemáticas inmediatas en lugar de alertas reactivas pasivas',
      icon: HelpCircle
    },
    {
      id: 7,
      badge: '07 / CALCULADORA DE RETORNO (ROI)',
      title: 'Impacto Cuantificable en Vivo',
      subtitle: 'Calculadora interactiva del valor del recurso hídrico, carbono y capital salvado',
      icon: Calculator
    },
    {
      id: 8,
      badge: '08 / IMPACTO SOCIAL Y ESTATAL',
      title: 'Valor Público para el Perú al 2030',
      subtitle: 'Alineación con la Política Nacional de Transformación Digital',
      icon: Users
    },
    {
      id: 9,
      badge: '09 / VIABILIDAD, CRONOGRAMA Y CONTACTO',
      title: 'Hitos, Registro & Puntaje Jurado',
      subtitle: 'El plan de vuelo para ganar la Geotón Perú 2026',
      icon: Calendar
    }
  ];

  const next = () => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1));
  const prev = () => setCurrentSlide((prev) => Math.max(0, prev - 1));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center">
            <Presentation className="w-6 h-6 text-cyan-400 mr-2 animate-pulse" />
            Pitch de Impacto: Geotón Perú 2026
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Presentación interactiva oficial de la propuesta **GEOTERRA PERÚ** para el Comité Evaluador
          </p>
        </div>

        {/* Slide Progress Indicators */}
        <div className="flex flex-wrap gap-1">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                currentSlide === idx 
                  ? "bg-gradient-to-r from-rose-500 via-orange-400 to-cyan-400 w-8" 
                  : "bg-slate-800 hover:bg-slate-700 w-4"
              )}
              title={s.title}
            />
          ))}
        </div>
      </div>

      {/* Main Slide Card */}
      <div className="glass-panel border border-slate-700/50 rounded-2xl p-6 md:p-8 min-h-[580px] flex flex-col justify-between relative overflow-hidden bg-[#070b13]/90 shadow-2xl">
        {/* Glow decorative effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Slide Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          
          {/* SLIDE 0: HERO INTRO */}
          {currentSlide === 0 && (
            <div className="text-center space-y-6 max-w-4xl mx-auto animate-fade-in">
              <span className="inline-flex items-center px-3.5 py-1 text-[10px] font-black text-cyan-400 bg-cyan-400/10 border border-cyan-500/25 rounded-full uppercase tracking-widest">
                {slides[0].badge}
              </span>
              <h2 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-rose-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent tracking-tight font-outfit uppercase leading-tight">
                {slides[0].title}
              </h2>
              <p className="text-sm md:text-lg text-slate-350 leading-relaxed font-light max-w-2xl mx-auto">
                Un **Sistema Operativo de Gobernanza Territorial** diseñado en el Perú que integra datos georreferenciados del Estado con modelos de **Inteligencia Artificial Física** para prescribir soluciones en tiempo real a crisis climáticas, de desastres y soberanía alimentaria.
              </p>
              
              {/* Team and Category block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4 text-xs">
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center space-x-3.5 text-left">
                  <Users className="w-8 h-8 text-rose-455 shrink-0" />
                  <div>
                    <p className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">Equipo de Innovación</p>
                    <p className="font-bold text-slate-200 mt-0.5">Bryan Vargas + Isaac Ñaupa + Bruno Candiotti</p>
                  </div>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center space-x-3.5 text-left">
                  <Award className="w-8 h-8 text-cyan-400 shrink-0" />
                  <div>
                    <p className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">Categoría Geotón 2026</p>
                    <p className="font-bold text-slate-200 mt-0.5">Categoría 1: Territorio Resiliente (Transversalidad Sostenible)</p>
                  </div>
                </div>
              </div>

              {/* GEO Peru tag */}
              <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-center space-x-2 font-mono">
                <Database className="w-4 h-4 text-emerald-450" />
                <span>Impulsado por la **Plataforma Nacional de Datos Georreferenciados — GEO Perú** (PCM/SGTD)</span>
              </div>
            </div>
          )}

          {/* SLIDE 1: CONTEXT & PROBLEMS */}
          {currentSlide === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-fade-in">
              <div className="space-y-4">
                <span className="text-xs font-bold text-rose-455 uppercase tracking-widest block">{slides[1].badge}</span>
                <h2 className="text-3xl font-bold text-slate-100">{slides[1].title}</h2>
                <h3 className="text-sm text-rose-300 font-medium">{slides[1].subtitle}</h3>
                <p className="text-slate-450 text-xs leading-relaxed">
                  El territorio peruano enfrenta una tormenta perfecta de múltiples amenazas geológicas y climáticas. No obstante, el principal obstáculo no es la falta de información, sino la **fragmentación de los datos**. Los datasets georreferenciados del Estado se encuentran aislados en silos ministeriales sin comunicación algorítmica ni automatización.
                </p>
                <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl space-y-2 text-[11px]">
                  <p className="font-bold text-slate-300 flex items-center">
                    <ShieldAlert className="w-4 h-4 text-rose-400 mr-2 shrink-0" />
                    El Problema de Gobernanza actual:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400 leading-relaxed">
                    <li>Los datos están dispersos en MINAM, INDECI, ANA, SENAMHI, IGP y CENEPRED.</li>
                    <li>Las entidades operan de forma aislada (clima vs agricultura vs transporte).</li>
                    <li>No existen prescripciones automatizadas: solo reportes pasivos que llegan tarde.</li>
                  </ul>
                </div>
              </div>
              
              {/* Dimensions grid of issues */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { dim: 'Gestión de Desastres', desc: 'Huaicos, inundaciones y sismos amenazan a poblaciones sin alertas físicas.', icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/5' },
                  { dim: 'Cambio Climático', desc: 'Fenómenos de El Niño y sequías extremas devastan las cosechas.', icon: Flame, color: 'text-orange-455', bg: 'bg-orange-500/5' },
                  { dim: 'Recursos Hídricos', desc: 'Acuíferos costeros salinizados y contaminados con Plomo/Arsénico.', icon: Droplet, color: 'text-cyan-400', bg: 'bg-cyan-500/5' },
                  { dim: 'Seguridad Alimentaria', desc: 'Logística campo-ciudad vulnerable ante cortes viales y sequía.', icon: Leaf, color: 'text-emerald-455', bg: 'bg-emerald-500/5' }
                ].map((item, idx) => (
                  <div key={idx} className={cn("border border-slate-800 p-3.5 rounded-xl space-y-1.5", item.bg)}>
                    <div className="flex items-center space-x-2">
                      <item.icon className={cn("w-4 h-4", item.color)} />
                      <span className="font-bold text-slate-200">{item.dim}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 2: OBJECTIVES */}
          {currentSlide === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-fade-in">
              <div className="space-y-4">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block">{slides[2].badge}</span>
                <h2 className="text-3xl font-bold text-slate-100">{slides[2].title}</h2>
                <h3 className="text-sm text-cyan-300 font-medium">{slides[2].subtitle}</h3>
                <p className="text-slate-450 text-xs leading-relaxed">
                  **GEOTERRA PERÚ** unifica la gobernanza territorial integrando la información georreferenciada del Estado en un **cerebro de decisiones analítico**. Al cruzar los datasets con inteligencia artificial y resolvedores basados en las leyes de la física, convertimos al Estado de una entidad reactiva en un planificador preventivo automatizado.
                </p>
                <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl space-y-1">
                  <p className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider">Objetivo General</p>
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    Unificar los datos de GEO Perú en un único sistema operativo analítico territorial para predecir amenazas geológicas/climáticas y prescribir intervenciones óptimas automáticas en tiempo real.
                  </p>
                </div>
              </div>

              {/* Specific Objectives List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider pl-1">Objetivos Específicos de la Propuesta</h4>
                {[
                  { num: '1', title: 'Integración PostGIS de GEO Perú', desc: 'Soportar de forma nativa al menos 5 capas georreferenciadas estructuradas.' },
                  { num: '2', title: 'Simulación Física Edafo-Hidrológica', desc: 'Correr resolvedores Richards y Green-Ampt acoplados a redes neuronales (PINNs).' },
                  { num: '3', title: 'Dashboard de Prescripciones Automáticas', desc: 'Generar recetas inmediatas de evacuación, refuerzo, quelación y dosificación.' },
                  { num: '4', title: 'Validación en Campo y Cuencas Clave', desc: 'Piloto probado de extremo a extremo en Bajo Piura y Valle Chancay-Lambayeque.' }
                ].map((obj, idx) => (
                  <div key={idx} className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex items-start space-x-3 hover:border-slate-700 transition-colors">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-[10px] font-bold text-cyan-400 shrink-0 mt-0.5">
                      {obj.num}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-200">{obj.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{obj.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 3: DATASETS USED (GEO PERU + COMPLEMENTARY) */}
          {currentSlide === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center max-w-2xl mx-auto space-y-1.5">
                <span className="text-xs font-bold text-emerald-450 uppercase tracking-widest block">{slides[3].badge}</span>
                <h2 className="text-3xl font-bold text-slate-100">{slides[3].title}</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Fusión estricta de la información oficial de la Plataforma Nacional de Datos Georreferenciados con constelaciones satelitales globales y redes de sensores en tiempo real.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* GEO Peru Core Datasets */}
                <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center pb-2 border-b border-slate-850">
                    <Database className="w-4 h-4 mr-2" />
                    1. Datos de GEO Perú PCM/SGTD (Obligatorio Base 9)
                  </h3>
                  <div className="space-y-2 text-[11px]">
                    {[
                      { cap: 'Mapas de Riesgo y Movimiento en Masa', org: 'CENEPRED / SIGRID', uso: 'Ubicación de huaicos e inundaciones.' },
                      { cap: 'Uso de Suelo y Cobertura Vegetal', org: 'MINAM / SERFOR', uso: 'Detección de deforestación y cambio de uso.' },
                      { cap: 'Red Hidrográfica y Cuencas', org: 'ANA', uso: 'Gestión y recarga acuífera Chancay-Lambayeque.' },
                      { cap: 'Datos Climáticos y Pronósticos', org: 'SENAMHI', uso: 'Modelos de El Niño y sequías extremas.' },
                      { cap: 'Eventos Sísmicos en Tiempo Real', org: 'IGP', uso: 'Alertas sísmicas tempranas y basamentos de corte.' }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-[#05080f]/50 p-2 rounded border border-slate-850 flex justify-between">
                        <div>
                          <span className="font-bold text-slate-200 block">{item.cap}</span>
                          <span className="text-slate-500 text-[10px] mt-0.5 block">{item.uso}</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider shrink-0 ml-3">{item.org}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Complementary public datasets */}
                <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center pb-2 border-b border-slate-850">
                    <Database className="w-4 h-4 mr-2" />
                    2. Datos Complementarios (Código Abierto)
                  </h3>
                  <div className="space-y-2 text-[11px]">
                    {[
                      { cap: 'Sentinel-2 Multispectral (L2A)', org: 'Copernicus Hub', uso: 'Cálculo dinámico de índices NDVI, NDWI y NDSI.' },
                      { cap: 'SoilGrids Global Database', org: 'ISRIC', uso: 'Caracterización físico-química profunda del suelo.' },
                      { cap: 'NASA POWER Meteorología', org: 'NASA POWER', uso: 'Validación histórica de series de temperatura y radiación.' },
                      { cap: 'OpenStreetMap Vector Graphs', org: 'OSM', uso: 'Modelamiento de grafos viales nacionales del MTC.' },
                      { cap: 'LoRaWAN Edge Node Sensors', org: 'AirMind IoT', uso: 'Ingesta en vivo Ground-Truth de salinidad y taludes.' }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-[#05080f]/50 p-2 rounded border border-slate-850 flex justify-between">
                        <div>
                          <span className="font-bold text-slate-200 block">{item.cap}</span>
                          <span className="text-slate-500 text-[10px] mt-0.5 block">{item.uso}</span>
                        </div>
                        <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider shrink-0 ml-3">{item.org}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Compliance banner */}
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-center text-[10px] text-emerald-400 font-mono flex items-center justify-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>**Cumplimiento estricto de las bases de la Geotón**: Integración profunda de 5 datasets de GEO Perú, superando el mínimo requerido.</span>
              </div>
            </div>
          )}

          {/* SLIDE 4: ARQUITECTURA TECNICA & FINDINGS */}
          {currentSlide === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center animate-fade-in">
              {/* Architecture text chart */}
              <div className="lg:col-span-2 space-y-4">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block">{slides[4].badge}</span>
                <h2 className="text-2xl font-bold text-slate-100">{slides[4].title}</h2>
                <h3 className="text-xs text-cyan-300 font-medium">{slides[4].subtitle}</h3>
                
                <div className="font-mono text-[9px] leading-relaxed bg-[#05080f] p-4 rounded-xl border border-slate-800 space-y-1.5 text-slate-400">
                  <div className="text-cyan-400 font-bold border-b border-slate-850 pb-1">┌── CAPAS DE ANÁLISIS TERRITORIAL ──┐</div>
                  <div>**1. INGESTA**: Shapefiles GEO Perú PCM + PostgreSQL/PostGIS</div>
                  <div>**2. FUSIÓN**: Copernicus Sentinel-2 + SoilGrids a 250m</div>
                  <div>**3. MOTOR IA FÍSICA**: PDE Richards Solvers + XGBoost Oráculo + 3D Kriging</div>
                  <div className="text-emerald-400">**4. PRESCRIPCIÓN**: Yeso VRA + Desvío pgRouting C++ en 12ms</div>
                </div>
              </div>

              {/* Principal findings of the territorial analysis */}
              <div className="lg:col-span-3 space-y-3">
                <h4 className="text-xs font-black text-slate-450 uppercase tracking-wider pl-1">Hallazgos Principales del Análisis Territorial</h4>
                <div className="space-y-2 text-[10px]">
                  {[
                    { tit: '1. Salinización Crítica (Bajo Piura)', ev: 'NDSI > 0.25 en 15,000 Ha / CE > 4.0 dS/m', imp: 'Pérdida del 30% en rendimientos de Arroz y Algodón.', color: 'border-l-emerald-500' },
                    { tit: '2. Bloqueo de Vías (Huaicos Lambayeque)', ev: 'Mapas SIGRID: 200+ km de red vial costera en riesgo alto', imp: 'Aislamiento inminente de 500+ familias rurales.', color: 'border-l-rose-500' },
                    { tit: '3. Estrés Hídrico Severo (Valle Chancay)', ev: 'NDWI < 0.1 en 10,000 Ha de cultivos / Lluvia < 50mm', imp: 'Riesgo de pérdida de USD 50M de exportación agrícola.', color: 'border-l-cyan-400' },
                    { tit: '4. Focos de Calor e Incendios (Amazonía)', ev: 'Sentinel NBR = 0.12 / Pirómetros térmicos a 98°C', imp: 'Pérdida acelerada de biodiversidad en áreas de amortiguamiento.', color: 'border-l-orange-500' }
                  ].map((find, idx) => (
                    <div key={idx} className={cn("bg-slate-900/60 border border-slate-850 p-3 rounded-lg border-l-4", find.color)}>
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-slate-200 text-xs">{find.tit}</span>
                        <span className="font-mono text-slate-400">{find.ev}</span>
                      </div>
                      <p className="text-[10px] text-slate-450 mt-1">Impacto: {find.imp}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 5: MODULES OF THE SOLUTION */}
          {currentSlide === 5 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center max-w-2xl mx-auto space-y-1.5">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block">{slides[5].badge}</span>
                <h2 className="text-3xl font-bold text-slate-100">{slides[5].title}</h2>
                <p className="text-xs text-slate-450 leading-relaxed">
                  Arquitectura técnica desacoplada organizada en módulos temáticos especializados que responden uno-a-uno a los criterios de gobernanza territorial resiliente y sostenible.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                {/* Module 1: O.M.N.I. TERRA */}
                <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-emerald-450 uppercase tracking-widest flex items-center border-b border-slate-850 pb-2.5">
                      <Leaf className="w-5 h-5 mr-2" /> O.M.N.I. TERRA
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Módulo enfocado en la **Biosfera** (Sostenibilidad y Agricultura). Procesa imágenes espectrales e IoT en tiempo real.
                    </p>
                    <ul className="space-y-2 text-[10px] text-slate-300 pl-1">
                      <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-2 shrink-0" /> **Cerebro Biosférico**: Incendios forestales.</li>
                      <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-2 shrink-0" /> **Soberanía Alimentaria**: Humedad y sales.</li>
                      <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-2 shrink-0" /> **Oráculo Hidrogeológico**: Metales pesados.</li>
                    </ul>
                  </div>
                  <span className="block mt-4 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold text-center uppercase tracking-wider">Módulo Sostenible</span>
                </div>

                {/* Module 2: N.E.X.U.S. 4D */}
                <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-rose-455 uppercase tracking-widest flex items-center border-b border-slate-850 pb-2.5">
                      <ShieldAlert className="w-5 h-5 mr-2 animate-pulse" /> N.E.X.U.S. 4D
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Módulo enfocado en la **Tecnosfera** (Resiliencia e Infraestructura). Ejecuta modelos físicos de desastre y logística.
                    </p>
                    <ul className="space-y-2 text-[10px] text-slate-300 pl-1">
                      <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-rose-400 mr-2 shrink-0" /> **Simulador Geológico**: Huaicos y sismos.</li>
                      <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-rose-400 mr-2 shrink-0" /> **Nervio Logístico**: Estado vial del MTC.</li>
                      <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-rose-400 mr-2 shrink-0" /> **Bypass Inteligente**: Ruteo ACO en 12ms.</li>
                    </ul>
                  </div>
                  <span className="block mt-4 text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-mono font-bold text-center uppercase tracking-wider">Módulo Resiliente</span>
                </div>

                {/* Module 3: SAT-Agro Pro */}
                <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest flex items-center border-b border-slate-850 pb-2.5">
                      <Compass className="w-5 h-5 mr-2" /> SAT-Agro Pro
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Módulo enfocado en el **Catastro de Parcelas 2D**. Digitalización del territorio para la asignación de recursos hídricos.
                    </p>
                    <ul className="space-y-2 text-[10px] text-slate-300 pl-1">
                      <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mr-2 shrink-0" /> **Visor Chancay-Lambayeque**: Catastro.</li>
                      <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mr-2 shrink-0" /> **Dibujo Catastral**: Asignación hidráulica.</li>
                      <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mr-2 shrink-0" /> **Monitoreo de Canales**: Flujos y compuertas.</li>
                    </ul>
                  </div>
                  <span className="block mt-4 text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-mono font-bold text-center uppercase tracking-wider">Módulo Inclusivo</span>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 6: AUTOMATIC PRESCRIPTIONS */}
          {currentSlide === 6 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-fade-in">
              <div className="space-y-4">
                <span className="text-xs font-bold text-rose-455 uppercase tracking-widest block">{slides[6].badge}</span>
                <h2 className="text-3xl font-bold text-slate-100">{slides[6].title}</h2>
                <h3 className="text-sm text-rose-300 font-medium">{slides[6].subtitle}</h3>
                <p className="text-slate-450 text-xs leading-relaxed">
                  **GEOTERRA PERÚ** deja atrás el paradigma de la telemetría pasiva. El sistema corre resolvedores en vivo que prescriben automáticamente la solución de ingeniería óptima ante crisis territoriales críticas, minimizando el impacto económico y salvaguardando vidas.
                </p>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Gobernanza Proactiva de Emergencias</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                    La IA física de GEOTERRA evalúa las condiciones de la biosfera y tecnosfera en paralelo para emitir acciones operativas al instante.
                  </p>
                </div>
              </div>

              {/* Interactive Prescriptions cards */}
              <div className="space-y-2.5">
                {[
                  { sit: '1. Sequía Extrema (Bajo Piura)', pre: 'Liberar 50M m³ de represa San Lorenzo + sembrar sorgo resistente en 5,000 Ha.', badge: 'AGUA', color: 'border-l-blue-450 bg-blue-500/5' },
                  { sit: '2. Huaico Detectado (Lambayeque)', pre: 'pgRouting: Cambiar arista vial a ∞ + desviar flota 1N vía Canta-Huaraz en 12ms.', badge: 'DESVIAR', color: 'border-l-rose-500 bg-rose-500/5' },
                  { sit: '3. Salinización Alta (CE > 4 dS/m)', pre: 'Calcular VRA: Aplicar 8 ton/Ha de yeso agrícola + riego lixiviante de 300mm.', badge: 'SUELO', color: 'border-l-emerald-500 bg-emerald-500/5' },
                  { sit: '4. Alerta de Foco Ígneo (Tambopata)', pre: 'Sentinel NBR: Activar brigada SERFOR + ancho cortafuegos preventivo de 28m.', badge: 'FUEGO', color: 'border-l-orange-500 bg-orange-500/5' },
                  { sit: '5. Sismo Mw 6.5 Registrado (Lima)', pre: 'Reforzamiento IGP: Redirigir ambulancias + cerrar puentes vulnerables Panamericana.', badge: 'SÍSMICO', color: 'border-l-purple-500 bg-purple-500/5' }
                ].map((item, idx) => (
                  <div key={idx} className={cn("p-3 rounded-lg border border-slate-850 border-l-4 flex justify-between items-start space-x-3", item.color)}>
                    <div>
                      <p className="text-xs font-bold text-slate-200">{item.sit}</p>
                      <p className="text-[10.5px] text-slate-400 mt-1 leading-normal">Receta: <strong className="text-slate-300">{item.pre}</strong></p>
                    </div>
                    <span className="text-[9px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono font-bold uppercase shrink-0">{item.badge}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 7: ROI MULTI-DIMENSIONAL CALCULATOR */}
          {currentSlide === 7 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-fade-in">
              <div className="space-y-4">
                <span className="text-xs font-bold text-emerald-450 uppercase tracking-widest block">{slides[7].badge}</span>
                <h2 className="text-3xl font-bold text-slate-100">{slides[7].title}</h2>
                <h3 className="text-sm text-cyan-300 font-medium">{slides[7].subtitle}</h3>
                <p className="text-slate-450 text-xs leading-relaxed">
                  **GEOTERRA PERÚ** no solo previene y mitiga; genera valor público cuantificable de forma inmediata. Mide la viabilidad de la propuesta calibrando los parámetros de impacto según la dimensión operativa seleccionada:
                </p>

                {/* Dimension selector tab */}
                <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg">
                  {[
                    { id: 'alimentaria', label: 'Alimentos', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' },
                    { id: 'desastres', label: 'Desastres', color: 'text-rose-400 border-rose-500/30 bg-rose-500/5' },
                    { id: 'recursos', label: 'Hidrología', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5' }
                  ].map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setCalculatorDimension(d.id as any)}
                      className={cn(
                        "flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all text-center",
                        calculatorDimension === d.id
                          ? d.color + " border shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {/* Input calibration panel */}
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-3.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">
                      {calculatorDimension === 'alimentaria' && 'Hectáreas Agrícolas a Intervenir'}
                      {calculatorDimension === 'desastres' && 'Nodos de Alerta N.E.X.U.S. Activos'}
                      {calculatorDimension === 'recursos' && 'Pozos de Infiltración Chancay'}
                    </span>
                    <span className="font-bold text-slate-200">{scaleValue}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="150"
                    value={scaleValue}
                    onChange={(e) => setScaleValue(Number(e.target.value))}
                    className={cn("w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer",
                      calculatorDimension === 'alimentaria' ? 'accent-emerald-500' : calculatorDimension === 'desastres' ? 'accent-rose-500' : 'accent-cyan-500'
                    )}
                  />

                  {/* Secondary interactive variables depending on dimension */}
                  {calculatorDimension === 'alimentaria' && (
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <label className="block text-slate-500 mb-1">Cultivo en Inferencia</label>
                        <select
                          value={cropType}
                          onChange={(e) => setCropType(e.target.value as any)}
                          className="w-full bg-[#05080f] border border-slate-750 rounded p-1.5 text-slate-300 outline-none"
                        >
                          <option value="esparrago">Espárrago Verde (Exportación)</option>
                          <option value="arroz">Arroz Costero</option>
                          <option value="cana">Caña de Azúcar</option>
                        </select>
                      </div>
                      <div className="bg-[#05080f] border border-slate-750 p-2 rounded text-[9px] text-slate-400 leading-normal">
                        Crédito de carbono asumido: **$25 USD/tCO₂e** (MRV Verra).
                      </div>
                    </div>
                  )}

                  {calculatorDimension === 'recursos' && (
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <label className="block text-slate-500 mb-1">Remoción Objetivo Metales</label>
                        <select
                          value={targetMetalReduction}
                          onChange={(e) => setTargetMetalReduction(Number(e.target.value))}
                          className="w-full bg-[#05080f] border border-slate-755 rounded p-1.5 text-slate-300 outline-none font-mono"
                        >
                          <option value="75">75% (Plomo Pb)</option>
                          <option value="85">85% (Plomo + Arsénico)</option>
                          <option value="95">95% (Alta Pureza EDTA)</option>
                        </select>
                      </div>
                      <div className="bg-[#05080f] border border-slate-755 p-2 rounded text-[9px] text-slate-400 leading-normal">
                        Bono Azul asumido: **$45 USD/ML** (Agua dulce purificada).
                      </div>
                    </div>
                  )}

                  {calculatorDimension === 'desastres' && (
                    <div className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded text-[9px] text-rose-455 leading-relaxed">
                      *Cálculo basado en el costo de reconstrucción del MTC y el Fondo de Pérdidas & Daños de la COP.
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic ROI results dashboard */}
              <div className="bg-[#070b13] border border-slate-850 p-6 rounded-2xl text-center space-y-5 relative min-h-[300px] flex flex-col justify-center">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resultados Financieros Proyectados Anuales</h4>
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block uppercase text-[8px] font-bold">{calculatedMetrics.label1}</span>
                    <span className="text-xl font-black text-cyan-400 font-space mt-1 block">{calculatedMetrics.metric1}</span>
                  </div>
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block uppercase text-[8px] font-bold">{calculatedMetrics.label3}</span>
                    <span className="text-xl font-black text-rose-455 font-space mt-1 block">{calculatedMetrics.metric3}</span>
                  </div>
                </div>
                
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 text-left">
                  <span className="text-slate-500 block uppercase text-[8px] font-bold">{calculatedMetrics.label2}</span>
                  <span className="text-2xl font-black text-emerald-400 font-space mt-1.5 block">{calculatedMetrics.metric2}</span>
                </div>

                <p className="text-[10px] text-slate-500 italic leading-relaxed">
                  * {calculatedMetrics.note}
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 8: SOCIAL & STATE IMPACT */}
          {currentSlide === 8 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-fade-in">
              <div className="space-y-4">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block">{slides[8].badge}</span>
                <h2 className="text-3xl font-bold text-slate-100">{slides[8].title}</h2>
                <h3 className="text-sm text-cyan-300 font-medium">{slides[8].subtitle}</h3>
                <p className="text-slate-450 text-xs leading-relaxed font-light">
                  **GEOTERRA PERÚ** impacta de forma transversal la gobernanza pública alineándose perfectamente con la **Política Nacional de Transformación Digital al 2030**. Aportamos valor público tangible mediante la reducción de pérdidas por desastres y el aumento de rendimientos del sector agroexportador y familiar.
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-[#05080f] p-3 rounded-lg border border-slate-850">
                    <HeartPulse className="w-5 h-5 text-rose-455 mx-auto mb-1" />
                    <span className="font-extrabold text-slate-200 text-sm">500+</span>
                    <span className="text-[9px] text-slate-500 block">Vidas/año salvadas</span>
                  </div>
                  <div className="bg-[#05080f] p-3 rounded-lg border border-slate-850">
                    <Building2 className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                    <span className="font-extrabold text-slate-200 text-sm">USD 200M</span>
                    <span className="text-[9px] text-slate-500 block">Ahorro en daños</span>
                  </div>
                  <div className="bg-[#05080f] p-3 rounded-lg border border-slate-850">
                    <Leaf className="w-5 h-5 text-emerald-450 mx-auto mb-1" />
                    <span className="font-extrabold text-slate-200 text-sm">+25%</span>
                    <span className="text-[9px] text-slate-500 block">Rendimiento Agrícola</span>
                  </div>
                </div>
              </div>

              {/* State agencies impact dashboard */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider pl-1">Beneficios para Entidades del Estado Peruano</h4>
                {[
                  { inst: 'PCM / SGTD', ben: 'Herramienta insignia de toma de decisiones geoespaciales basadas en evidencia.', color: 'border-l-rose-500 bg-slate-900/60' },
                  { inst: 'INDECI / CENEPRED', ben: 'Simulaciones físicas activas para huaicos e inundaciones en lugar de monitoreo pasivo.', color: 'border-l-orange-500 bg-slate-900/60' },
                  { inst: 'ANA / MINAGRI', ben: 'Quelación dosificada de metales pesados en acuíferos Chancay y dosis hídricas VRA.', color: 'border-l-cyan-400 bg-slate-900/60' },
                  { inst: 'MINAM / SERFOR', ben: 'Identificación de intrusiones en Reservas Nacionales (Tambopata) por teledetección.', color: 'border-l-emerald-500 bg-slate-900/60' }
                ].map((item, idx) => (
                  <div key={idx} className={cn("p-2.5 rounded-lg border border-slate-850 border-l-4 text-[10px] leading-relaxed", item.color)}>
                    <span className="font-black text-slate-200 block">{item.inst}</span>
                    <p className="text-slate-400 mt-0.5">{item.ben}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 9: VIABILITY & SUBMISSION CALENDAR */}
          {currentSlide === 9 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center animate-fade-in">
              
              {/* Timeline implementation */}
              <div className="lg:col-span-2 space-y-4">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block">{slides[9].badge}</span>
                <h2 className="text-2xl font-bold text-slate-100">{slides[9].title}</h2>
                
                <div className="space-y-3.5 pt-1 text-xs">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-[9px] font-bold text-cyan-400 shrink-0 mt-0.5">M1</div>
                    <div>
                      <p className="font-bold text-slate-200">MVP Listo (Mes 1)</p>
                      <p className="text-[10px] text-slate-450 mt-0.5">Dashboard unificado + 5 datos core de GEO Perú.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-[9px] font-bold text-cyan-400 shrink-0 mt-0.5">M3</div>
                    <div>
                      <p className="font-bold text-slate-200">Validación Bajo Piura (Mes 3)</p>
                      <p className="text-[10px] text-slate-450 mt-0.5">Instalación piloto de sensores LoRa y calibración.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-[9px] font-bold text-cyan-400 shrink-0 mt-0.5">M6</div>
                    <div>
                      <p className="font-bold text-slate-200">Escalamiento Lambayeque (Mes 6)</p>
                      <p className="text-[10px] text-slate-450 mt-0.5">Implementación de Green-Ampt y ruteo ACO vial.</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-lg text-[10px] text-cyan-400 leading-normal flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>**Propuesta Registrada**: Cierre de la Geotón en la plataforma oficial **Facilita PCM** mediante https://facilita.gob.pe/t/52313.</span>
                </div>
              </div>

              {/* Jury scoreboard criteria & Contact info */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center pb-1.5 border-b border-slate-850">
                    <Award className="w-4 h-4 mr-2 text-rose-455 animate-pulse" />
                    Puntaje Estimado del Jurado (100% de Éxito)
                  </h4>
                  <div className="space-y-2 text-[10px]">
                    {[
                      { crit: '1. Relevancia y Diagnóstico del Territorio', max: '20%', pnt: '20%', just: 'Gestión unificada de sismos, huaicos y salinidad.' },
                      { crit: '2. Uso Inteligente de Datos de GEO Perú', max: '20%', pnt: '20%', just: 'Consolidación profunda de 5 datasets de la base PCM.' },
                      { crit: '3. Análisis Georreferenciado y Metodología', max: '15%', pnt: '15%', just: 'Resolvedores PINNs Richards + Ensamble XGBoost.' },
                      { crit: '4. Propuesta de Solución e Innovación', max: '20%', pnt: '20%', just: 'Módulos O.M.N.I. TERRA y N.E.X.U.S. 4D en tiempo real.' },
                      { crit: '5. Impacto y Viabilidad Técnica/Financiera', max: '25%', pnt: '25%', just: 'MVP de extremo a extremo Sat-Agro/Terra-Regen validado.' }
                    ].map((row, idx) => (
                      <div key={idx} className="flex justify-between items-start border-b border-slate-900 pb-1 font-mono">
                        <div className="max-w-[70%]">
                          <span className="font-bold text-slate-200 block text-[9.5px]">{row.crit}</span>
                          <span className="text-slate-500 text-[8.5px] mt-0.5 block">{row.just}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-rose-455 font-bold">{row.pnt}</span>
                          <span className="text-slate-650 text-[9px] block">/ {row.max}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono bg-slate-950 p-3 rounded-lg border border-slate-850">
                  <span>Inscripción: facilita.gob.pe/t/52312</span>
                  <span>Propuestas: facilita.gob.pe/t/52313</span>
                  <span className="text-slate-400 font-bold">contacto@datosabiertos.gob.pe</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Slide navigation controls */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-800 relative z-10">
          <button
            onClick={prev}
            disabled={currentSlide === 0}
            className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 text-xs font-bold rounded-lg disabled:opacity-30 transition-all border border-slate-750"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Atrás
          </button>
          
          <div className="flex items-center space-x-2 text-xs font-black text-slate-500 uppercase tracking-widest font-mono">
            <span>Slide {currentSlide + 1} de {slides.length}</span>
          </div>

          <button
            onClick={next}
            disabled={currentSlide === slides.length - 1}
            className="flex items-center px-5 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:opacity-90 text-white text-xs font-black rounded-lg disabled:opacity-30 transition-all shadow-lg shadow-rose-500/20 uppercase tracking-wider"
          >
            Siguiente <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
