import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Leaf, Activity, Compass, Map, ClipboardList, Settings, Menu, Bell, Search, Presentation } from 'lucide-react';
import { cn } from '../utils/cn';

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

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex overflow-hidden selection:bg-emerald-500/30">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-slate-700/50 hidden md:flex flex-col relative z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
          <Leaf className="w-6 h-6 text-emerald-500 mr-2" />
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Edafo-OS
          </span>
        </div>
        
        <div className="px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Foco: Bajo Piura
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 shadow-[inset_4px_0_0_0_rgba(16,185,129,1)]'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                )}
              >
                <item.icon className={cn('w-5 h-5 mr-3 transition-transform group-hover:scale-110', isActive ? 'text-emerald-400' : 'text-slate-500')} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/20">
              JS
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-200">Ing. Agrónomo</p>
              <p className="text-xs text-slate-400">ID: 1045-PRO</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen relative">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Header */}
        <header className="h-16 glass-panel border-b border-slate-700/50 flex items-center justify-between px-6 z-10 sticky top-0">
          <div className="flex items-center md:hidden">
            <Menu className="w-6 h-6 text-slate-400 cursor-pointer" />
          </div>
          
          <div className="hidden md:flex items-center bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-1.5 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar parcela, sensor, receta..." 
              className="bg-transparent border-none outline-none text-sm text-slate-200 px-3 w-64 placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            </button>
            <div className="px-3 py-1 text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full flex items-center shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
              Red LoRa Activa
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
