import { Map, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export function VisorCatastral() {
  const [loading, setLoading] = useState(true);

  const handleRefresh = () => {
    setLoading(true);
    const iframe = document.getElementById('satagro-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center">
            <Map className="w-6 h-6 text-cyan-400 mr-2 animate-pulse" />
            SAT-Agro Pro: Visor Catastral 2D
          </h1>
          <p className="text-slate-400 text-sm">
            Visualizador espacial de parcelas, dibujo catastral e hidráulico del Valle Chancay-Lambayeque.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Recargar Visor
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="flex-1 min-h-[600px] xl:min-h-[700px] glass-panel border border-slate-700/50 rounded-xl relative overflow-hidden bg-[#070b13] shadow-2xl flex flex-col">
        {loading && (
          <div className="absolute inset-0 bg-[#070b13]/90 flex flex-col items-center justify-center z-20 space-y-4 transition-all duration-300">
            <div className="w-10 h-10 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase animate-pulse">
              Inicializando Mapa GIS y Motores 2D...
            </p>
          </div>
        )}
        <iframe
          id="satagro-iframe"
          src="/satagro/index.html"
          onLoad={() => setLoading(false)}
          className="w-full h-full border-none flex-1"
          title="SAT-Agro Catastral Pro"
        />
      </div>
    </div>
  );
}
