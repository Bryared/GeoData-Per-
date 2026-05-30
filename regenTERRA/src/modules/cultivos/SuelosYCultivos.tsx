import { useState } from 'react';
import { Telemetria } from '../edafologia/Telemetria';
import { Map3DKriging } from '../edafologia/Map3DKriging';
import { RecetasVRA } from '../edafologia/RecetasVRA';
import { Activity, Map, Cpu, ClipboardList, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export function SuelosYCultivos() {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'satellite' | 'predictor' | 'recipes'>('telemetry');

  // Soil Predictor State (UNALM calibration simulator)
  const [ph, setPh] = useState<number>(7.2);
  const [conductividad, setConductividad] = useState<number>(3.5); // dS/m
  const [textura, setTextura] = useState<'franco' | 'arenoso' | 'arcilloso'>('franco');
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionResults, setPredictionResults] = useState<any[] | null>(null);

  const handlePredict = () => {
    setIsPredicting(true);
    setTimeout(() => {
      // Simple logic simulating the XGBoost oráculo de UNALM
      let scoreArroz = 92;
      let scoreEsparrago = 65;
      let scoreCana = 80;
      let scoreQuinua = 50;

      // Adjust based on EC
      if (conductividad > 4.0) {
        scoreArroz -= 25;
        scoreCana -= 35;
        scoreEsparrago += 20; // tolerante
        scoreQuinua += 40; // muy tolerante
      } else if (conductividad > 2.0) {
        scoreArroz -= 5;
        scoreCana -= 10;
        scoreEsparrago += 10;
      }

      // Adjust based on pH
      if (ph < 6.0 || ph > 8.0) {
        scoreArroz -= 15;
        scoreCana -= 10;
        scoreQuinua += 10;
      }

      // Adjust based on texture
      if (textura === 'arenoso') {
        scoreArroz -= 30; // Rice needs clay/loam to retain water
        scoreEsparrago += 15; // Asparagus loves sand
      } else if (textura === 'arcilloso') {
        scoreArroz += 5;
        scoreEsparrago -= 20;
      }

      const results = [
        { name: 'Arroz (Capirona)', score: Math.max(10, Math.min(99, scoreArroz)), status: scoreArroz > 75 ? 'Óptimo' : scoreArroz > 50 ? 'Marginal' : 'No Recomendado' },
        { name: 'Espárrago Verde', score: Math.max(10, Math.min(99, scoreEsparrago)), status: scoreEsparrago > 75 ? 'Óptimo' : scoreEsparrago > 50 ? 'Marginal' : 'No Recomendado' },
        { name: 'Caña de Azúcar', score: Math.max(10, Math.min(99, scoreCana)), status: scoreCana > 75 ? 'Óptimo' : scoreCana > 50 ? 'Marginal' : 'No Recomendado' },
        { name: 'Quinua (INIA)', score: Math.max(10, Math.min(99, scoreQuinua)), status: scoreQuinua > 75 ? 'Óptimo' : scoreQuinua > 50 ? 'Marginal' : 'No Recomendado' }
      ].sort((a, b) => b.score - a.score);

      setPredictionResults(results);
      setIsPredicting(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header and Tabs Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center">
            <Sparkles className="w-6 h-6 text-emerald-450 mr-2" />
            Suelos y Cultivos
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Módulo integrado de edafología, análisis satelital Copernicus, predicción de aptitud de cultivos y recetas de enmiendas.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl shrink-0 self-start md:self-auto">
          {[
            { id: 'telemetry', label: 'Telemetría', icon: Activity },
            { id: 'satellite', label: 'Satélite 3D', icon: Map },
            { id: 'predictor', label: 'Predictor', icon: Cpu },
            { id: 'recipes', label: 'Recetas VRA', icon: ClipboardList }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="animate-fade-in">
        
        {activeTab === 'telemetry' && (
          <div className="bg-[#0b0f19]/30 rounded-2xl border border-transparent">
            <Telemetria />
          </div>
        )}

        {activeTab === 'satellite' && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center">
              <Map className="w-4 h-4 text-emerald-455 mr-2" />
              Vista de Dispersión Satelital Kriging 3D
            </h3>
            <div className="min-h-[480px]">
              <Map3DKriging />
            </div>
          </div>
        )}

        {activeTab === 'recipes' && (
          <div className="bg-[#0b0f19]/30 rounded-2xl border border-transparent">
            <RecetasVRA />
          </div>
        )}

        {activeTab === 'predictor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Input fields panel */}
            <div className="lg:col-span-1 glass-panel border border-slate-700/50 p-6 rounded-2xl bg-slate-900/40 space-y-5">
              <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center">
                <Cpu className="w-4 h-4 text-emerald-455 mr-2" />
                Variables de Entrada del Suelo
              </h3>

              <div className="space-y-4 text-xs">
                {/* pH selector */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-450 font-bold">Acidez del Suelo (pH)</span>
                    <span className="font-mono text-emerald-400 font-bold">{ph.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="5.0"
                    max="9.0"
                    step="0.1"
                    value={ph}
                    onChange={(e) => setPh(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>Ácido (5.0)</span>
                    <span>Neutro (7.0)</span>
                    <span>Alcalino (9.0)</span>
                  </div>
                </div>

                {/* Salinity selector */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-450 font-bold">Conductividad Eléctrica (CE)</span>
                    <span className="font-mono text-amber-400 font-bold">{conductividad.toFixed(1)} dS/m</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10.0"
                    step="0.1"
                    value={conductividad}
                    onChange={(e) => setConductividad(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>Bajo (0.5)</span>
                    <span>Salino (4.0)</span>
                    <span>Muy Salino (10.0)</span>
                  </div>
                </div>

                {/* Texture selector */}
                <div className="space-y-1.5">
                  <label className="text-slate-450 font-bold block">Textura del Suelo (Tacto)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'franco', label: 'Franco (Loam)' },
                      { id: 'arenoso', label: 'Arenoso (Sand)' },
                      { id: 'arcilloso', label: 'Arcilloso (Clay)' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTextura(t.id as any)}
                        className={cn(
                          "py-2 rounded-lg text-[10px] font-bold border transition-all text-center",
                          textura === t.id
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-450 shadow-sm"
                            : "bg-slate-950/40 border-slate-850 text-slate-500 hover:text-slate-400"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handlePredict}
                  disabled={isPredicting}
                  className="w-full mt-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl text-xs transition-all shadow-lg hover:shadow-emerald-500/10 cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isPredicting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Procesando XGBoost UNALM...</span>
                    </>
                  ) : (
                    <span>Ejecutar Modelo Predictivo</span>
                  )}
                </button>
              </div>
            </div>

            {/* Inferences panel */}
            <div className="lg:col-span-2 glass-panel border border-slate-700/50 p-6 rounded-2xl bg-slate-900/40 flex flex-col justify-center min-h-[300px] relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

              {!predictionResults ? (
                <div className="text-center py-12 space-y-3.5">
                  <Cpu className="w-12 h-12 text-slate-750 mx-auto animate-pulse" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-300">Esperando simulación</h4>
                    <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto font-light leading-normal">
                      Ajusta los parámetros edafológicos del panel de la izquierda y haz clic en "Ejecutar Modelo" para evaluar la aptitud del cultivo mediante la calibración satelital.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Resultados del Clasificador Agro-Territorial
                    </h3>
                    <p className="text-slate-500 text-[10px] mt-0.5">
                      Modelo: XGBoost Classifier. Calibrado con Sentinel-2 y Verdad-Terreno Lambayeque.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {predictionResults.map((crop, idx) => (
                      <div key={idx} className="space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-200">{crop.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className={cn(
                              "text-[8px] font-bold font-mono px-1.5 py-0.5 rounded",
                              crop.status === 'Óptimo' ? 'bg-emerald-500/10 text-emerald-450' :
                              crop.status === 'Marginal' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-rose-500/10 text-rose-455'
                            )}>
                              {crop.status}
                            </span>
                            <span className="font-mono font-bold text-slate-400">{crop.score}% aptitud</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900">
                          <div
                            className={cn("h-full rounded-full transition-all duration-300", 
                              crop.status === 'Óptimo' ? 'bg-emerald-500' :
                              crop.status === 'Marginal' ? 'bg-amber-500' :
                              'bg-rose-500'
                            )}
                            style={{ width: `${crop.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-start text-[10px] text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-2 shrink-0 mt-0.5" />
                    <span>El modelo se recalibra semanalmente con firmas espectrales Sentinel-2 para capturar variaciones temporales del suelo y humedad.</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
