import { useState } from 'react';
import { Presentation, ShieldAlert, Cpu, Calculator, Rocket, ArrowRight, ArrowLeft, RefreshCw, Leaf } from 'lucide-react';
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

  // ROI Calculator State
  const [hectares, setHectares] = useState(5);
  const [crop, setCrop] = useState<'arroz' | 'caña' | 'esparrago'>('arroz');
  const [roiResults, setRoiResults] = useState({
    waterSaved: 16000,
    netGain: 19000,
    soilStatus: '100% Recuperado'
  });

  const handleCalculateROI = () => {
    let water = 0;
    let gain = 0;

    if (crop === 'arroz') {
      water = hectares * 3200; // m3
      gain = hectares * 3800; // Soles
    } else if (crop === 'caña') {
      water = hectares * 2500;
      gain = hectares * 4200;
    } else { // Espárrago
      water = hectares * 1800;
      gain = hectares * 6500;
    }

    setRoiResults({
      waterSaved: water,
      netGain: gain,
      soilStatus: '100% Regenerado'
    });
  };

  const slides: Slide[] = [
    {
      id: 0,
      badge: 'PROYECTO TOP DE INNOVACIÓN - GEOTÓN PERÚ 2026',
      title: 'TERRA-REGEN',
      subtitle: 'El Cerebro y los Sentidos del Suelo',
      icon: Leaf
    },
    {
      id: 1,
      badge: '01 / LA CRISIS SILENCIOSA',
      title: 'La Salinización Secundaria',
      subtitle: 'El envenenamiento de los valles agrícolas costeros',
      icon: ShieldAlert
    },
    {
      id: 2,
      badge: '02 / TECNOLOGÍA PROFUNDA',
      title: 'Cerebro Híbrido PINN & IoT',
      subtitle: 'La física de suelos integrada en modelos de Inteligencia Artificial',
      icon: Cpu
    },
    {
      id: 3,
      badge: '03 / VIABILIDAD FINANCIERA',
      title: 'Calculadora de Impacto ROI',
      subtitle: 'Mide la rentabilidad agrícola y la eficiencia del recurso hídrico',
      icon: Calculator
    },
    {
      id: 4,
      badge: '04 / ESCALAMIENTO MUNDIAL',
      title: 'Hacia un Estándar Global',
      subtitle: 'Edafo-OS en el mercado voluntario de bonos de carbono (MRV)',
      icon: Rocket
    }
  ];

  const next = () => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1));
  const prev = () => setCurrentSlide((prev) => Math.max(0, prev - 1));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center">
            <Presentation className="w-6 h-6 text-emerald-400 mr-2" />
            Pitch de Impacto Geotón
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Presentación conceptual del negocio y la tecnología de TERRA-REGEN (Edafo-OS)
          </p>
        </div>

        {/* Slide Progress Indicators */}
        <div className="flex space-x-2">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={cn(
                "w-8 h-2 rounded-full transition-all duration-300",
                currentSlide === idx 
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-400 w-12" 
                  : "bg-slate-800 hover:bg-slate-700"
              )}
            />
          ))}
        </div>
      </div>

      {/* Main Slide Card */}
      <div className="glass-panel border border-slate-700/50 rounded-2xl p-8 min-h-[500px] flex flex-col justify-between relative overflow-hidden">
        {/* Glow decorative effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Slide Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-6">
          
          {/* SLIDE 0: HERO INTRO */}
          {currentSlide === 0 && (
            <div className="text-center space-y-6 max-w-3xl mx-auto animate-fade-in">
              <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full uppercase tracking-wider">
                {slides[0].badge}
              </span>
              <h2 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent tracking-tight font-outfit uppercase">
                {slides[0].title}
              </h2>
              <p className="text-lg md:text-xl text-slate-300 leading-relaxed font-light">
                No es un software básico de visualización. Es un **Sistema Operativo Edafológico (Edafo-OS)** interactivo que combina física, satélites e IoT para recuperar la salud del suelo y garantizar la seguridad alimentaria.
              </p>
              
              <div className="grid grid-cols-3 gap-6 pt-8 max-w-2xl mx-auto">
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-4xl font-extrabold text-slate-100 font-space">40%</p>
                  <p className="text-[10px] text-slate-500 uppercase mt-1">Suelos degradados en la Costa</p>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                  <p className="text-4xl font-extrabold text-emerald-400 font-space">-40%</p>
                  <p className="text-[10px] text-emerald-500 uppercase mt-1">Desperdicio de agua dulce</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-4xl font-extrabold text-cyan-400 font-space">+25%</p>
                  <p className="text-[10px] text-slate-500 uppercase mt-1">Productividad de cosecha</p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 1: LA CRISIS */}
          {currentSlide === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in">
              <div className="space-y-4">
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest block">{slides[1].badge}</span>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-100">{slides[1].title}</h2>
                <h3 className="text-base text-rose-300 font-medium">{slides[1].subtitle}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  El riego excesivo por inundación en valles como **Chancay-Lambayeque** eleva los niveles freáticos. El sol abrasador evapora el agua estancada, depositando costras salinas destructivas. En **Piura**, el drenaje deficiente esteriliza campos enteros. En **Ica**, la intrusión marina en pozos profundos envenena los cultivos de exportación.
                </p>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <p className="text-xs text-slate-300">**3,000+ Hectáreas** de arroz y algodón abandonadas anualmente en el norte por salinización.</p>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <p className="text-xs text-slate-300">**Drenaje colapsado:** Nivel freático a menos de 80cm ahoga las raíces de los cultivos.</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#070b13] border border-slate-800 p-6 rounded-2xl flex flex-col justify-center items-center relative min-h-[300px]">
                <div className="absolute inset-0 bg-radial-gradient from-rose-500/5 to-transparent blur-xl pointer-events-none" />
                <ShieldAlert className="w-16 h-16 text-rose-400 mb-4 animate-bounce" />
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider text-center">Alertas de Desertificación Catastral</h4>
                <p className="text-xs text-slate-400 text-center mt-2 max-w-sm">
                  Integración con datasets de **GEO Perú** para detectar en tiempo real las capas catastrales y zonas hídricas en peligro extremo de degradación física.
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 2: LA TECNOLOGÍA */}
          {currentSlide === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in">
              <div className="space-y-4">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest block">{slides[2].badge}</span>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-100">{slides[2].title}</h2>
                <h3 className="text-base text-cyan-300 font-medium">{slides[2].subtitle}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  No confiamos solo en correlaciones estadísticas ciegas. TERRA-REGEN corre una **Red Neuronal Informada por la Física (PINN)** en el backend. El modelo calcula el flujo de agua insaturada mediante la **Ecuación de Richards** y el arrastre salino mediante la **Ecuación de Advección-Dispersión**.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] text-slate-400">
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="font-bold text-slate-200 block mb-1">Richards Edafológica:</span>
                    dTheta/dt = d/dz [ K(t) * (dPsi/dz + 1) ]
                  </div>
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="font-bold text-slate-200 block mb-1">Advección de Solutos:</span>
                    d(t*C)/dt = d/dz [ t*D*dC/dz ] - d(q*C)/dz
                  </div>
                </div>
              </div>
              <div className="bg-[#070b13] border border-slate-800 p-6 rounded-2xl flex flex-col justify-center space-y-4 relative min-h-[300px]">
                <div className="flex justify-between items-center text-xs font-bold pb-2 border-b border-slate-850">
                  <span className="text-emerald-400 flex items-center"><Cpu className="w-4 h-4 mr-2" /> Residuales Físicos PINN</span>
                  <span className="text-slate-500 font-mono">Loss Convergencia</span>
                </div>
                <div className="space-y-3 font-mono text-[11px] pt-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-350">
                      <span>Richards Residual:</span>
                      <span className="text-emerald-400">1.42e-6</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full w-[94%]" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-350">
                      <span>Solute Transport Residual:</span>
                      <span className="text-emerald-400">8.95e-7</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full w-[97%]" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-350">
                      <span>Precisión de Kriging (Interpolación):</span>
                      <span className="text-cyan-400">R² = 0.941</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-400 h-full w-[91%]" />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 italic pt-2 text-center">
                  *Los residuos físicos limitan el comportamiento de la IA, obligándola a respetar las leyes universales de conservación de masa de agua y sales.
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 3: ROI CALCULATOR */}
          {currentSlide === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in">
              <div className="space-y-4">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest block">{slides[3].badge}</span>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-100">{slides[3].title}</h2>
                <h3 className="text-base text-emerald-300 font-medium">{slides[3].subtitle}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  TERRA-REGEN no solo cura el suelo; es una herramienta económica radical. Prueba nuestra calculadora interactiva para ver los ahorros hídricos y económicos estimados mediante prescripción inteligente VRA.
                </p>

                {/* Input form */}
                <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-2">Hectáreas de Cultivo</label>
                      <input
                        type="number"
                        value={hectares}
                        onChange={(e) => setHectares(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-[#05080f] border border-slate-700 rounded px-3 py-2 text-slate-200 outline-none focus:border-emerald-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-2">Cultivo Principal</label>
                      <select
                        value={crop}
                        onChange={(e) => setCrop(e.target.value as any)}
                        className="w-full bg-[#05080f] border border-slate-700 rounded px-3 py-2 text-slate-200 outline-none"
                      >
                        <option value="arroz">Arroz (Inundación)</option>
                        <option value="caña">Caña de Azúcar</option>
                        <option value="esparrago">Espárrago de Exportación</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleCalculateROI}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-semibold text-xs shadow transition-all flex items-center justify-center"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-2" /> Calcular Retorno Financiero
                  </button>
                </div>
              </div>

              {/* ROI Results Display */}
              <div className="bg-[#070b13] border border-slate-850 p-6 rounded-2xl text-center space-y-6 relative min-h-[300px] flex flex-col justify-center">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Impacto Financiero Proyectado Anual</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                    <p className="text-2xl font-black text-cyan-400 font-space">{roiResults.waterSaved.toLocaleString()} m³</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-1">Agua Dulce Ahorrada</p>
                  </div>
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                    <p className="text-2xl font-black text-emerald-400 font-space">S/. {roiResults.netGain.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-1">Margen Neto Extra</p>
                  </div>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg text-xs font-semibold text-emerald-400">
                  {roiResults.soilStatus} — Evitación de Degradación por Salinización
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 4: ESCALAMIENTO MUNDIAL */}
          {currentSlide === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in">
              <div className="space-y-4">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest block">{slides[4].badge}</span>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-100">{slides[4].title}</h2>
                <h3 className="text-base text-cyan-300 font-medium">{slides[4].subtitle}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  TERRA-REGEN está diseñado como una arquitectura desacoplada basada en microservicios e ingestión en la nube. Esto nos permite clonar y expandir el sistema a cualquier cuenca fluvial agrícola del mundo afectada por salinidad secundaria.
                </p>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 flex items-center justify-center text-[8px] font-bold text-black">1</span>
                    <p className="text-xs text-slate-300">**Monetización en Carbono (MRV):** Certificación del secuestro de carbono orgánico estable por restauración de suelos degradados.</p>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 flex items-center justify-center text-[8px] font-bold text-black">2</span>
                    <p className="text-xs text-slate-300">**SaaS B2B & HaaS (Hardware as a Service):** Kit de sensores LoRaWAN a costo de capital cero con suscripción anual por hectárea.</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#070b13] border border-slate-800 p-6 rounded-2xl flex flex-col justify-center items-center relative min-h-[300px]">
                <div className="absolute inset-0 bg-radial-gradient from-emerald-500/5 to-transparent blur-xl pointer-events-none" />
                <Rocket className="w-16 h-16 text-cyan-400 mb-4 animate-pulse" />
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider text-center">Escalamiento Modular Global</h4>
                <p className="text-xs text-slate-400 text-center mt-2 max-w-sm leading-relaxed">
                  Desde el Bajo Piura hacia valles de Ica, Chancay y Arequipa, escalable a cuencas agroexportadoras globales en California (San Joaquín) y Egipto (Delta del Nilo).
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Slide navigation controls */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-800 relative z-10">
          <button
            onClick={prev}
            disabled={currentSlide === 0}
            className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg disabled:opacity-30 transition-all border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Atrás
          </button>
          
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <span>Slide {currentSlide + 1} de {slides.length}</span>
          </div>

          <button
            onClick={next}
            disabled={currentSlide === slides.length - 1}
            className="flex items-center px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg disabled:opacity-30 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 border border-emerald-400/20"
          >
            Siguiente <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
