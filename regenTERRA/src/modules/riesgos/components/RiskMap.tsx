import { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import RiskAlertLayer from './RiskAlertLayer';
import type { RiskAlert } from '../../../services/alertsApi';

type RiskMapProps = {
  alerts: RiskAlert[];
  loading?: boolean;
  error?: string | null;
  backendMode?: 'live' | 'demo';
  lastUpdated?: Date | null;
};

export default function RiskMap({
  alerts,
  loading = false,
  error = null,
  backendMode = 'live',
  lastUpdated = null
}: RiskMapProps) {
  const [isLight, setIsLight] = useState(() => document.documentElement.classList.contains('light'));

  useEffect(() => {
    const handleThemeChange = () => {
      setIsLight(document.documentElement.classList.contains('light'));
    };
    window.addEventListener('geoterra_theme_changed', handleThemeChange);
    return () => window.removeEventListener('geoterra_theme_changed', handleThemeChange);
  }, []);

  return (
    <div className="w-full h-full min-h-[500px] relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
      {/* MAPA DE LEAFLET */}
      <MapContainer
        center={[-9.19, -75.02]}
        zoom={6}
        minZoom={5}
        maxZoom={18}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[500px] z-0"
      >
        <TileLayer
          key={isLight ? 'light-map' : 'dark-map'}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={isLight 
            ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
            : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          }
        />

        <RiskAlertLayer alerts={alerts} />
      </MapContainer>

      {/* WIDGET: Estado del Mapa / Conexión (Esquina Superior Derecha) */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-1.5 pointer-events-none">
        <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 shadow-2xl flex items-center gap-2 pointer-events-auto">
          <span className={`w-2 h-2 rounded-full ${
            loading 
              ? 'bg-amber-400 animate-pulse' 
              : backendMode === 'live'
                ? 'bg-emerald-400'
                : 'bg-amber-500 animate-pulse'
          }`} />
          <span className="text-[9px] text-slate-200 font-bold font-mono uppercase tracking-wider">
            {loading 
              ? 'Sincronizando...' 
              : backendMode === 'live'
                ? 'PostGIS Conectado'
                : 'Modo Demo (Local)'}
          </span>
        </div>
        
        {lastUpdated && (
          <div className="text-[8px] text-slate-500 font-mono bg-slate-950/40 backdrop-blur-sm px-2 py-0.5 rounded border border-slate-900 pointer-events-auto">
            Act: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* WIDGET: Leyenda del Mapa (Esquina Inferior Derecha) */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-2xl max-w-[180px] pointer-events-auto">
        <div className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-850 pb-1 font-mono">
          Severidad del Riesgo
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#ff0055] inline-block shadow-[0_0_6px_#ff0055]" />
            <span className="font-semibold font-mono text-[9px]">Severidad 5 (Crítico)</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#ffaa00] inline-block shadow-[0_0_6px_#ffaa00]" />
            <span className="font-semibold font-mono text-[9px]">Severidad 3-4 (Alerta)</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#00d4ff] inline-block shadow-[0_0_6px_#00d4ff]" />
            <span className="font-semibold font-mono text-[9px]">Severidad 1-2 (Informativo)</span>
          </div>
        </div>
      </div>

      {/* BANNER: Aviso de Fallback/Error de API (Esquina Inferior Izquierda) */}
      {error && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-amber-500/10 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-amber-500/20 text-[10px] text-amber-400 font-mono shadow-2xl max-w-xs flex items-start gap-2 pointer-events-auto">
          <span className="font-bold">⚠️</span>
          <div>
            <div className="font-extrabold text-[9px] uppercase tracking-wider">Aviso de Operación</div>
            <div className="text-[9px] mt-0.5 text-slate-300 font-medium leading-relaxed">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
}
