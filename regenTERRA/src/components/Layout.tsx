import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Leaf, Activity, Compass, Settings, Menu, Bell, Search, Presentation, ShieldAlert, Droplet, Sun, Moon, CheckCircle2, ShieldCheck, Database, Languages } from 'lucide-react';
import { cn } from '../utils/cn';
import { useDimension } from '../context/DimensionContext';
import { useMemo, useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export function Layout() {
  const location = useLocation();
  const { dimension, setDimension } = useDimension();
  const { t, language, setLanguage } = useLanguage();

  const dynamicNavigation = useMemo(() => [
    { name: t.nav.dashboard, href: '/', icon: Leaf },
    { name: t.nav.risks, href: '/riesgos', icon: ShieldAlert },
    { name: t.nav.crops, href: '/cultivos', icon: Activity },
    { name: t.nav.cadastre, href: '/satagro', icon: Compass },
    { name: t.nav.water, href: '/recursos', icon: Droplet },
    { name: t.nav.evidence, href: '/evidencia', icon: Database },
    { name: t.nav.settings, href: '/settings', icon: Settings },
    { name: t.nav.pitch, href: '/pitch', icon: Presentation },
  ], [t]);

  // Modo de Datos (Escenario Controlado / PostGIS Live)
  const [dataMode, setDataMode] = useState<'controlado' | 'live'>(() => {
    return (localStorage.getItem('geoterra_datamode') as 'controlado' | 'live') || 'controlado';
  });

  const toggleDataMode = () => {
    const nextMode = dataMode === 'controlado' ? 'live' : 'controlado';
    setDataMode(nextMode);
    localStorage.setItem('geoterra_datamode', nextMode);
    window.dispatchEvent(new Event('geoterra_datamode_changed'));
  };

  // Perfil Lumínico (Theme state)
  const [isLight, setIsLight] = useState(() => {
    return localStorage.getItem('geoterra_theme') === 'light';
  });

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      category: 'SÍSMICO',
      message: 'IGP reporta micro-aceleración de 0.05g en Falla de la Costa Central. Módulo de Riesgos en modo preventivo.',
      time: 'Hace 5m',
      type: 'warning',
      unread: true
    },
    {
      id: 2,
      category: 'HIDROLÓGICO',
      message: 'Poechos registra cota máxima de 103 msnm. Modelo de simulación estimando caudal de descarga.',
      time: 'Hace 15m',
      type: 'info',
      unread: true
    },
    {
      id: 3,
      category: 'AGRO-LOGÍSTICO',
      message: 'Camión TRUCK-PE-02 ha cruzado desvío de Canta de forma óptima. Tiempo estimado intacto.',
      time: 'Hace 28m',
      type: 'success',
      unread: true
    },
    {
      id: 4,
      category: 'INCENDIO',
      message: 'Imágenes satelitales alertan anomalía térmica menor en Tambopata (NDVI/NBR). Guardaparques alertados.',
      time: 'Hace 1h',
      type: 'danger',
      unread: false
    }
  ]);

  // Synchronize HTML class for Perfil Lumínico
  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.add('light');
      localStorage.setItem('geoterra_theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('geoterra_theme', 'dark');
    }
  }, [isLight]);

  // Poll live alerts from backend and map to notifications dropdown
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/alerts');
        if (response.ok) {
          const data = await response.json();
          // Map to notifications
          const mapped = data.map((alert: any) => {
            const desc = alert.detalles_tensor?.descripcion || alert.detalles?.descripcion || `${alert.tipo_evento} activo con severidad ${alert.severidad} detectado.`;
            // Calculate time difference
            let timeStr = 'Reciente';
            const baseTime = alert.detalles_tensor?.fecha_evento || alert.detalles?.fecha_evento || alert.fecha_deteccion;
            if (baseTime) {
              const diff = Date.now() - new Date(baseTime).getTime();
              const mins = Math.floor(diff / 60000);
              if (mins < 1) timeStr = 'Hace un momento';
              else if (mins < 60) timeStr = `Hace ${mins}m`;
              else {
                const hrs = Math.floor(mins / 60);
                timeStr = `Hace ${hrs}h`;
              }
            }
            return {
              id: alert.id,
              category: alert.tipo_evento,
              message: desc,
              time: timeStr,
              type: alert.severidad >= 4 ? 'danger' : alert.severidad === 3 ? 'warning' : 'info',
              unread: alert.estado === 'ACTIVO'
            };
          });
          setNotifications(mapped);
        }
      } catch (err) {
        console.warn('Failed to fetch live alerts from server:', err);
      }
    };

    fetchAlerts();
    const pollInterval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(pollInterval);
  }, []);

  const toggleTheme = () => {
    setIsLight(!isLight);
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const removeNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const unreadCount = useMemo(() => {
    return notifications.filter(n => n.unread).length;
  }, [notifications]);

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
      <aside className="w-64 glass-panel border-r border-slate-700/50 hidden md:flex flex-col relative z-20 transition-all duration-350">
        
        {/* Global Branding Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
          <LogoIcon className={cn("w-6 h-6 mr-2 transition-transform duration-300 hover:rotate-12", theme.logoClass)} />
          <span className={cn("text-lg font-extrabold bg-gradient-to-r bg-clip-text text-transparent transition-all duration-300", theme.logoTextClass)}>
            GeoTERRA Perú
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
                "w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center border border-transparent",
                dimension === 'alimentaria'
                  ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/25 shadow-sm font-black"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 shrink-0"></span>
              {language === 'qu' ? 'Mikhuy Ruray Amachay' : 'Seguridad Alimentaria'}
            </button>
            <button
              onClick={() => setDimension('desastres')}
              className={cn(
                "w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center border border-transparent",
                dimension === 'desastres'
                  ? "bg-rose-500/10 text-rose-500 border-rose-500/25 shadow-sm font-black"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2 shrink-0 animate-pulse"></span>
              {language === 'qu' ? 'Llakiykuna Allichay' : 'Gestión de Desastres'}
            </button>
            <button
              onClick={() => setDimension('recursos')}
              className={cn(
                "w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center border border-transparent",
                dimension === 'recursos'
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/25 shadow-sm font-black"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2 shrink-0"></span>
              {language === 'qu' ? 'Yaku Kallpachay' : 'Agua y Recursos Hídricos'}
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {dynamicNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group text-xs font-bold',
                  isActive
                    ? theme.activeLinkClass
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                )}
              >
                <item.icon className={cn('w-4 h-4 mr-3 transition-transform group-hover:scale-110', isActive ? theme.activeIconClass : 'text-slate-500')} />
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
              <p className="text-xs font-bold text-slate-200">{t.roleBadge}</p>
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
        <header className="h-16 glass-panel border-b border-slate-700/50 flex items-center justify-between px-6 z-30 sticky top-0 transition-all duration-350">
          <div className="flex items-center md:hidden">
            <Menu className="w-6 h-6 text-slate-400 cursor-pointer" />
          </div>
          
          <div className="hidden md:flex items-center bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-1.5 focus-within:border-slate-550/50 transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={t.searchPlaceholder} 
              className="bg-transparent border-none outline-none text-xs text-slate-200 px-3 w-64 placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center space-x-4 relative">
            {/* Language Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 rounded-full px-3 py-1 transition-all text-xs font-bold">
              <Languages className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'es' | 'qu')}
                className="bg-transparent border-none outline-none text-[9px] text-slate-350 uppercase tracking-wider font-mono font-bold cursor-pointer"
              >
                <option value="es" className="bg-slate-900 text-slate-300">ESP</option>
                <option value="qu" className="bg-slate-900 text-slate-300">QUE</option>
              </select>
            </div>

            {/* Professional Data Mode Switcher */}
            <button 
              onClick={toggleDataMode}
              className={cn(
                "flex items-center space-x-2 px-3 py-1.5 border rounded-full transition-all text-xs font-bold cursor-pointer",
                dataMode === 'live' 
                  ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
              )}
              title={t.modeTooltip}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", dataMode === 'live' ? "bg-emerald-400 animate-pulse" : "bg-amber-400")}></span>
              <span className="text-[9px] uppercase tracking-wider font-mono">
                {t.modeLabel} {dataMode === 'live' ? t.modeLive : t.modeControlled}
              </span>
            </button>

            {/* Professional Light Mode Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 rounded-full transition-all text-xs font-bold"
              title="Alternar Perfil Lumínico del Sistema"
            >
              {isLight ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider font-mono">Claro Profesional</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Oscuro Científico</span>
                </>
              )}
            </button>

            {/* Notifications Bell Icon */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "relative p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-full",
                  showNotifications ? "bg-slate-800 text-slate-200" : "hover:bg-slate-800/30"
                )}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Functional Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifications(false)} 
                  />
                  <div className="absolute right-0 mt-3 w-96 bg-slate-900/95 border border-slate-850 rounded-xl shadow-2xl z-50 p-4 animate-fade-in font-sans glass-panel text-xs text-slate-300">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-800 mb-3">
                      <span className="font-bold text-slate-200 flex items-center">
                        <ShieldAlert className="w-4 h-4 text-rose-500 mr-2" />
                        {language === 'qu' ? 'Allpa sasachakuy willakuykuna' : 'Alertas Territoriales'}
                      </span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllRead}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold hover:underline"
                        >
                          {t.markAllRead}
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 font-mono">
                          <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          {t.noAlerts}
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <div 
                            key={item.id} 
                            className={cn(
                              "p-3 rounded-lg border relative group transition-all",
                              item.unread 
                                ? "bg-slate-850/80 border-slate-800 text-slate-200" 
                                : "bg-slate-900/40 border-slate-850 text-slate-400 opacity-75"
                            )}
                          >
                            <div className="flex justify-between items-start font-bold mb-1">
                              <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded font-mono",
                                item.type === 'warning' ? "bg-amber-500/10 text-amber-400" :
                                item.type === 'danger' ? "bg-rose-500/10 text-rose-455" :
                                item.type === 'success' ? "bg-emerald-500/10 text-emerald-450" :
                                "bg-cyan-500/10 text-cyan-450"
                              )}>
                                {item.category}
                              </span>
                              <span className="text-[8px] text-slate-500 font-mono">{item.time}</span>
                            </div>
                            <p className="text-[10px] leading-relaxed pr-6">{item.message}</p>
                            <button 
                              onClick={() => removeNotification(item.id)}
                              className="absolute top-2 right-2 text-slate-600 hover:text-slate-400 transition-colors"
                              title="Descartar notificación"
                            >
                              &times;
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-3.5 pt-2 border-t border-slate-800 text-center">
                      <span className="text-[8px] text-slate-500 font-mono flex items-center justify-center">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 mr-1.5" />
                        {t.footerCaption}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

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

