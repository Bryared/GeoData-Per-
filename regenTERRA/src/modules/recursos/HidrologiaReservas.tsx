import { Droplet, AlertTriangle, ShieldCheck, TrendingUp, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Reservoir {
  name: string;
  valley: string;
  currentVol: number; // MM3
  maxVol: number; // MM3
  cota: number; // msnm
  cotaMax: number; // msnm
  status: 'Crítico' | 'Estable' | 'Alerta Altura';
}

interface WaterBalance {
  zone: string;
  demand: number; // m3/s
  supply: number; // m3/s
  cropType: string;
  status: 'Balanceado' | 'Estrés Moderado' | 'Estrés Alto';
}

export function HidrologiaReservas() {
  const reservoirs: Reservoir[] = [
    { name: 'Poechos', valley: 'Chira-Piura', currentVol: 118.4, maxVol: 820.0, cota: 97.2, cotaMax: 103.0, status: 'Crítico' },
    { name: 'Tinajones', valley: 'Chancay-Lambayeque', currentVol: 98.2, maxVol: 320.0, cota: 84.5, cotaMax: 92.0, status: 'Estable' },
    { name: 'Gallito Ciego', valley: 'Jequetepeque', currentVol: 145.8, maxVol: 400.0, cota: 81.3, cotaMax: 86.0, status: 'Estable' }
  ];

  const balances: WaterBalance[] = [
    { zone: 'Bajo Piura', demand: 45.0, supply: 40.0, cropType: 'Algodón Pima', status: 'Estrés Moderado' },
    { zone: 'Chancay-Lambayeque', demand: 62.0, supply: 35.0, cropType: 'Arroz (Capirona)', status: 'Estrés Alto' },
    { zone: 'Valle Jequetepeque', demand: 25.0, supply: 30.0, cropType: 'Espárrago Verde', status: 'Balanceado' }
  ];

  const chartData = [
    { name: 'Ene', Oferta: 38, Demanda: 30 },
    { name: 'Feb', Oferta: 42, Demanda: 35 },
    { name: 'Mar', Oferta: 55, Demanda: 48 },
    { name: 'Abr', Oferta: 48, Demanda: 52 },
    { name: 'May', Oferta: 35, Demanda: 62 }, // High gap in May
    { name: 'Jun', Oferta: 28, Demanda: 58 },
    { name: 'Jul', Oferta: 22, Demanda: 45 },
    { name: 'Ago', Oferta: 18, Demanda: 38 },
    { name: 'Set', Oferta: 20, Demanda: 30 },
    { name: 'Oct', Oferta: 25, Demanda: 28 },
    { name: 'Nov', Oferta: 30, Demanda: 32 },
    { name: 'Dic', Oferta: 35, Demanda: 30 }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center">
          <Droplet className="w-6 h-6 text-cyan-400 mr-2" />
          Agua y Reservas
        </h1>
        <p className="text-slate-400 text-xs mt-0.5">
          Monitoreo de la disponibilidad hídrica regional, almacenamiento de embalses y balances oferta/demanda para juntas de riego.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Reservoir Capacities */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
            Capacidad de Reservorios (Embalses)
          </h2>
          <div className="space-y-3.5">
            {reservoirs.map((res, idx) => {
              const percentage = (res.currentVol / res.maxVol) * 100;
              return (
                <div key={idx} className="glass-panel border border-slate-700/50 p-4.5 rounded-xl bg-slate-900/40 space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-extrabold text-sm text-slate-200">{res.name}</span>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Valle: {res.valley}</p>
                    </div>
                    <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border ${
                      res.status === 'Crítico' ? 'bg-rose-500/10 text-rose-455 border-rose-500/20' :
                      res.status === 'Alerta Altura' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {res.status}
                    </span>
                  </div>

                  {/* Meter Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Volumen Útil: <strong className="text-slate-200">{res.currentVol} MM³</strong></span>
                      <span className="text-slate-500">Máx: {res.maxVol} MM³</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          res.status === 'Crítico' ? 'bg-rose-500' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Cota Info */}
                  <div className="flex justify-between text-[10px] border-t border-slate-850 pt-2 text-slate-450">
                    <span>Cota actual: <strong>{res.cota} msnm</strong></span>
                    <span>Cota Máxima: {res.cotaMax} msnm</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center/Right Col: Water Balance & Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Water balance table */}
          <div className="glass-panel border border-slate-700/50 p-5 rounded-2xl bg-slate-900/40 space-y-4">
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center">
              <BarChart2 className="w-4.5 h-4.5 text-cyan-400 mr-2" />
              Balance de Estrés Hídrico Agrícola
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <th className="pb-2">Zona / Valle</th>
                    <th className="pb-2">Oferta Caudal</th>
                    <th className="pb-2">Demanda Requerida</th>
                    <th className="pb-2">Cultivo Principal</th>
                    <th className="pb-2 text-right">Estatus Hídrico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {balances.map((bal, idx) => (
                    <tr key={idx} className="text-slate-300">
                      <td className="py-3 font-bold text-slate-200">{bal.zone}</td>
                      <td className="py-3 font-mono text-cyan-400">{bal.supply} m³/s</td>
                      <td className="py-3 font-mono text-rose-455">{bal.demand} m³/s</td>
                      <td className="py-3 font-light text-slate-400">{bal.cropType}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-block text-[9px] font-bold font-mono px-2 py-0.5 rounded ${
                          bal.status === 'Estrés Alto' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                          bal.status === 'Estrés Moderado' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                        }`}>
                          {bal.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* In-app recommendation warning */}
            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start text-[11px] text-slate-400">
              <AlertTriangle className="w-4 h-4 text-amber-500 mr-2 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Recomendación Activa (Chancay-Lambayeque):</strong> Déficit de caudal detectado de 27 m³/s. Se recomienda a la Junta de Usuarios coordinar riegos por sectores e iniciar la optimización de lámina mínima saturada en parcelas de Arroz.
              </div>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="glass-panel border border-slate-700/50 p-5 rounded-2xl bg-[#070b13]/60 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center">
                <TrendingUp className="w-4.5 h-4.5 text-cyan-400 mr-2" />
                Historial de Oferta vs Demanda Hídrica (Campaña Lambayeque)
              </h3>
              <span className="text-[9px] font-mono text-slate-500">Unidad: m³/s</span>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOferta" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDemanda" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b/30" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '11px' }}
                    itemStyle={{ fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="Oferta" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorOferta)" />
                  <Area type="monotone" dataKey="Demanda" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorDemanda)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quality Indicator Footer */}
          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center space-x-2 text-[10px] text-slate-450 font-sans">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Datos provistos bajo el estándar de la **Autoridad Nacional del Agua (ANA)** y validados en laboratorio UNALM.</span>
          </div>

        </div>
      </div>
    </div>
  );
}
