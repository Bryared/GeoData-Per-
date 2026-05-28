import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Leaf, Activity, Compass, Map, ClipboardList, Settings, Menu, Bell, Search, Presentation, ShieldAlert, Droplet } from 'lucide-react';
import { cn } from '../utils/cn';
import { useDimension } from '../context/DimensionContext';
import { useMemo } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Leaf },
  { name: 'Telemetría', href: '/telemetry', icon: Activity },
  { name: 'SAT-Agro Pro', href: '/satagro', icon: Compass },
  { name: 'Mapa 3D', href: '/map', icon: Map },
  { name: 'Recetas VRA', href: '/prescriptions', icon: ClipboardList },
  { name: 'Configuración', href: '/settings', icon: Settings },
  { name: 'Pitch Geotón', href: '/pitch', icon: Presentation },
];

export function Layout() {
  const location = useLocation();
  const { dimension, setDimension } = useDimension();

  // Dynamic Theme Colors depending on active Dimension
  const theme = useMemo(() => {
    if (dimension === 'desastres') {
      return {
        logoIcon: ShieldAlert,
        logoClass: 'text-rose-400',
        logoTextClass: 'from-rose-400 to-orange-400',
        activeLinkClass: 'bg-rose-500/10 text-rose-400 shadow-[inset_4px_0_0_0_rgba(244,63,94,1)]',
        activeIconClass: 'text-rose-400',
        glow1: 'bg-rose-500/5',
        glow2: 'bg-orange-500/5',
        headerPill: 'text-rose-400 bg-rose-400/10 border-rose-400/20 shadow-[0_0_10px_rgba(244,63,94,0.15)]',
        headerPillText: 'Alerta Temprana Activa',
        badgeBg: 'from-rose-500 to-orange-500'
      };
    } else if (dimension === 'recursos') {
      return {
        logoIcon: Droplet,
        logoClass: 'text-cyan-400',
        logoTextClass: 'from-cyan-400 to-blue-400',
        activeLinkClass: 'bg-cyan-500/10 text-cyan-400 shadow-[inset_4px_0_0_0_rgba(6,182,212,1)]',
        activeIconClass: 'text-cyan-400',
        glow1: 'bg-cyan-500/5',
        glow2: 'bg-blue-500/5',
        headerPill: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]',
        headerPillText: 'Monitor ANP Activo',
        badgeBg: 'from-cyan-500 to-blue-500'
      };
    } else {
      return {
        logoIcon: Leaf,
        logoClass: 'text-emerald-450',
        logoTextClass: 'from-emerald-400 to-cyan-400',
        activeLinkClass: 'bg-emerald-500/10 text-emerald-400 shadow-[inset_4px_0_0_0_rgba(16,185,129,1)]',
        activeIconClass: 'text-emerald-400',
        glow1: 'bg-emerald-500/10',
        glow2: 'bg-blue-500/10',
        headerPill: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
        headerPillText: 'Red LoRa Activa',
        badgeBg: 'from-emerald-500 to-blue-500'
      };
    }
  }, [dimension]);

  const LogoIcon = theme.logoIcon;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex overflow-hidden selection:bg-emerald-500/30">
      
      {/* Sidebar Container */}
      <aside className="w-64 glass-panel border-r border-slate-700/50 hidden md:flex flex-col relative z-20">
        
        {/* Global Branding Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
          <LogoIcon className={cn("w-6 h-6 mr-2 transition-transform duration-300 hover:rotate-12", theme.logoClass)} />
          <span className={cn("text-lg font-extrabold bg-gradient-to-r bg-clip-text text-transparent transition-all duration-300", theme.logoTextClass)}>
            GeoTerra Perú
          </span>
        </div>
        
        {/* Interactive Sidebar Dimension Switcher */}
        <div className="px-4 py-4 border-b border-slate-800/80 bg-slate-900/10 space-y-2">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block pl-1">
            Gobernanza Territorial
          </label>
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => setDimension('alimentaria')}
              className={cn(
                "w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center",
                dimension === 'alimentaria'
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 shrink-0"></span>
              Seguridad Alimentaria
            </button>
            <button
              onClick={() => setDimension('desastres')}
              className={cn(
                "w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center",
                dimension === 'desastres'
                  ? "bg-rose-500/10 text-rose-450 border border-rose-500/25 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-450 mr-2 shrink-0 animate-pulse"></span>
              Gestión de Desastres
            </button>
            <button
              onClick={() => setDimension('recursos')}
              className={cn(
                "w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center",
                dimension === 'recursos'
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2 shrink-0"></span>
              Hidrología & Reservas
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group',
                  isActive
                    ? theme.activeLinkClass
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                )}
              >
                <item.icon className={cn('w-5 h-5 mr-3 transition-transform group-hover:scale-110', isActive ? theme.activeIconClass : 'text-slate-500')} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className={cn("w-8 h-8 rounded-full bg-gradient-to-tr flex items-center justify-center text-white font-black text-xs shadow-lg", theme.badgeBg)}>
              JS
            </div>
            <div className="ml-3">
              <p className="text-xs font-bold text-slate-200">Ing. Agrónomo</p>
              <p className="text-[10px] text-slate-400">ID: 1045-PRO</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col h-screen relative">
        
        {/* Glow Effects (Transition colors dynamically) */}
        <div className={cn("absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-all duration-500", theme.glow1)} />
        <div className={cn("absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-all duration-500", theme.glow2)} />

        {/* Top Header */}
        <header className="h-16 glass-panel border-b border-slate-700/50 flex items-center justify-between px-6 z-10 sticky top-0">
          <div className="flex items-center md:hidden">
            <Menu className="w-6 h-6 text-slate-400 cursor-pointer" />
          </div>
          
          <div className="hidden md:flex items-center bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-1.5 focus-within:border-slate-500/50 focus-within:ring-1 focus-within:ring-slate-550/40 transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar parcela, sensor, receta..." 
              className="bg-transparent border-none outline-none text-xs text-slate-200 px-3 w-64 placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            </button>
            <div className={cn("px-3 py-1 text-xs font-semibold rounded-full flex items-center transition-all duration-300", theme.headerPill)}>
              <span className="w-1.5 h-1.5 bg-current rounded-full mr-2 animate-pulse"></span>
              {theme.headerPillText}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 z-10 scrollbar-hide">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
