import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Sliders, Wifi, ClipboardList, Database, Save, CheckCircle } from 'lucide-react';

interface CropSetting {
  name: string;
  ecThreshold: number; // dS/m
  rootDepth: number; // cm
  toleranciaClass: 'Baja' | 'Moderada' | 'Alta' | 'Muy Alta';
}

export function Settings() {
  const [activeTab, setActiveTab] = useState<'soils' | 'lora' | 'simulator'>('soils');
  const [isSaved, setIsSaved] = useState(false);
  const [testingLora, setTestingLora] = useState(false);
  const [loraTested, setLoraTested] = useState(false);

  // Soils & Physics configs
  const [targetESP, setTargetESP] = useState(5);
  const [defaultCEC, setDefaultCEC] = useState(25);
  const [bulkDensity, setBulkDensity] = useState(1.35);
  const [activeClimate, setActiveClimate] = useState<'normal' | 'nino' | 'sequia'>('normal');

  // Crops standards state
  const [cropList, setCropList] = useState<CropSetting[]>([
    { name: 'Arroz (Capirona)', ecThreshold: 3.0, rootDepth: 40, toleranciaClass: 'Moderada' },
    { name: 'Caña de Azúcar', ecThreshold: 1.7, rootDepth: 60, toleranciaClass: 'Baja' },
    { name: 'Espárrago Verde', ecThreshold: 4.1, rootDepth: 60, toleranciaClass: 'Alta' },
    { name: 'Quinua (INIA)', ecThreshold: 8.0, rootDepth: 30, toleranciaClass: 'Muy Alta' },
    { name: 'Algodón (Pima)', ecThreshold: 7.7, rootDepth: 50, toleranciaClass: 'Muy Alta' }
  ]);

  // LoRa configurations
  const [appEUI, setAppEUI] = useState('70B3D57ED004FC39');
  const [spreadingFactor, setSpreadingFactor] = useState('SF7');
  const [frequency, setFrequency] = useState('915.2 MHz');

  // Simulator: new custom sensor
  const [newSensorId, setNewSensorId] = useState('SN-1013');
  const [newSensorLat, setNewSensorLat] = useState(-5.25);
  const [newSensorLng, setNewSensorLng] = useState(-80.55);

  useEffect(() => {
    // Load persisted climate or settings if present
    const savedClimate = localStorage.getItem('soil_climate') as any;
    if (savedClimate) setActiveClimate(savedClimate);

    const savedESP = localStorage.getItem('soil_target_esp');
    if (savedESP) setTargetESP(Number(savedESP));

    const savedCEC = localStorage.getItem('soil_default_cec');
    if (savedCEC) setDefaultCEC(Number(savedCEC));
  }, []);

  const handleSaveSoils = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('soil_climate', activeClimate);
    localStorage.setItem('soil_target_esp', targetESP.toString());
    localStorage.setItem('soil_default_cec', defaultCEC.toString());
    
    // Broadcast an event so other components update if listening
    window.dispatchEvent(new Event('storage'));

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestLora = () => {
    setTestingLora(true);
    setLoraTested(false);
    setTimeout(() => {
      setTestingLora(false);
      setLoraTested(true);
    }, 2000);
  };

  const handleAddSensor = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate adding a sensor node to local storage nodes list
    const existingStr = localStorage.getItem('custom_sensors');
    const existing = existingStr ? JSON.parse(existingStr) : [];
    const newSensor = {
      id: newSensorId,
      lat: newSensorLat,
      lng: newSensorLng,
      pH: 7.8,
      ec: 3.5,
      nitrogen: 35,
      phosphorus: 12,
      potassium: 160,
      soilMoisture: 22,
      timestamp: new Date().toISOString(),
      batteryLevel: 98,
      rssi: -72,
      depths: {
        depth20cm: { ec: 3.1, moisture: 19 },
        depth40cm: { ec: 3.5, moisture: 22 },
        depth60cm: { ec: 4.1, moisture: 25 }
      }
    };
    localStorage.setItem('custom_sensors', JSON.stringify([...existing, newSensor]));
    window.dispatchEvent(new Event('storage'));

    // Reset form
    setNewSensorId(`SN-${Math.floor(1014 + Math.random() * 1000)}`);
    alert(`Sensor ${newSensorId} registrado y transmitiendo en Bajo Piura!`);
  };

  const handleResetDatabase = () => {
    localStorage.removeItem('custom_sensors');
    localStorage.setItem('soil_climate', 'normal');
    setActiveClimate('normal');
    window.dispatchEvent(new Event('storage'));
    alert('Base de datos de sensores y clima restablecidos a la configuración por defecto de Bajo Piura.');
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100 flex items-center">
          <SettingsIcon className="w-8 h-8 text-emerald-400 mr-3" />
          Configuración Edafo-OS
        </h1>
        <p className="text-slate-400 mt-1">
          Ajustes de calibración de física del suelo, parámetros LoRaWAN y simulador de gemelo digital
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 glass-panel border border-slate-700/50 rounded-xl p-4 flex flex-col space-y-2 h-fit">
          <button
            onClick={() => setActiveTab('soils')}
            className={`flex items-center px-4 py-3 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'soils'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4 mr-3" />
            Calibración de Suelos
          </button>
          <button
            onClick={() => setActiveTab('lora')}
            className={`flex items-center px-4 py-3 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'lora'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-4 h-4 mr-3" />
            Parámetros LoRaWAN
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center px-4 py-3 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'simulator'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4 mr-3" />
            Simulador de Escenarios
          </button>
        </div>

        {/* Configurations content panel */}
        <div className="lg:col-span-3">
          {activeTab === 'soils' && (
            <div className="glass-panel border border-slate-700/50 rounded-xl p-6 space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-slate-200">Parámetros Químicos y Calibración Física</h2>
                <p className="text-xs text-slate-400 mt-1">Configuración del modelo resolvedor de requerimientos químicos (Yeso) y lavado</p>
              </div>

              <form onSubmit={handleSaveSoils} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Sodio Intercambiable Objetivo (Target ESP %)
                    </label>
                    <input
                      type="number"
                      value={targetESP}
                      onChange={(e) => setTargetESP(Number(e.target.value))}
                      className="w-full bg-[#070b13] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-emerald-500 outline-none"
                      min="1"
                      max="15"
                      required
                    />
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                      *El porcentaje estándar para agricultura libre de estrés sódico en Bajo Piura es 5%. Valores mayores causan dispersión de arcillas.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Capacidad de Intercambio Catiónico Promedio (CIC - meq/100g)
                    </label>
                    <input
                      type="number"
                      value={defaultCEC}
                      onChange={(e) => setDefaultCEC(Number(e.target.value))}
                      className="w-full bg-[#070b13] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-emerald-500 outline-none"
                      min="10"
                      max="45"
                      required
                    />
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                      *Representa la carga de arcillas y limos del suelo. Los suelos arcillosos del Bajo Piura típicamente promedian 25 meq/100g.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Densidad Aparente del Suelo (bulkDensity - g/cm³)
                    </label>
                    <input
                      type="number"
                      value={bulkDensity}
                      onChange={(e) => setBulkDensity(Number(e.target.value))}
                      className="w-full bg-[#070b13] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-emerald-500 outline-none"
                      step="0.05"
                      min="1.0"
                      max="1.6"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Escenario Climático Activo (Bajo Piura)
                    </label>
                    <select
                      value={activeClimate}
                      onChange={(e) => setActiveClimate(e.target.value as any)}
                      className="w-full bg-[#070b13] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-emerald-500 outline-none"
                    >
                      <option value="normal">Normal (Estable)</option>
                      <option value="nino">Fenómeno de El Niño (Lluvioso/Lixiviación)</option>
                      <option value="sequia">Sequía Extrema (Evaporación/Acapilaridad)</option>
                    </select>
                  </div>
                </div>

                {/* Crop thresholds config */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-300 flex items-center">
                    <ClipboardList className="w-4 h-4 text-emerald-400 mr-2" />
                    Umbrales Espectrales y Tolerancias de Cultivo
                  </h3>

                  <div className="overflow-x-auto border border-slate-750 rounded-lg bg-slate-900/30">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-800/40 text-slate-400 border-b border-slate-750">
                          <th className="p-3">Cultivo</th>
                          <th className="p-3">Umbral CE ($EC_e$ dS/m)</th>
                          <th className="p-3">Prof. Raíz (cm)</th>
                          <th className="p-3">Clase Tolerancia</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-300 divide-y divide-slate-800">
                        {cropList.map((crop, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/20">
                            <td className="p-3 font-semibold text-slate-200">{crop.name}</td>
                            <td className="p-3">
                              <input
                                type="number"
                                step="0.1"
                                value={crop.ecThreshold}
                                onChange={(e) => {
                                  const updated = [...cropList];
                                  updated[idx].ecThreshold = Number(e.target.value);
                                  setCropList(updated);
                                }}
                                className="bg-[#05080f] border border-slate-800 rounded px-2 py-1 w-16 text-center text-slate-200 outline-none focus:border-emerald-500"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                value={crop.rootDepth}
                                onChange={(e) => {
                                  const updated = [...cropList];
                                  updated[idx].rootDepth = Number(e.target.value);
                                  setCropList(updated);
                                }}
                                className="bg-[#05080f] border border-slate-800 rounded px-2 py-1 w-16 text-center text-slate-200 outline-none focus:border-emerald-500"
                              />
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                crop.toleranciaClass === 'Baja' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                crop.toleranciaClass === 'Moderada' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {crop.toleranciaClass}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                  {isSaved && (
                    <span className="flex items-center text-xs text-emerald-400 font-semibold animate-fade-in">
                      <CheckCircle className="w-4 h-4 mr-2" /> Umbrales y constantes edafológicas guardadas.
                    </span>
                  )}
                  <button
                    type="submit"
                    className="flex items-center ml-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Configuración
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'lora' && (
            <div className="glass-panel border border-slate-700/50 rounded-xl p-6 space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-slate-200">Parámetros de Red LoRaWAN & Concentrador</h2>
                <p className="text-xs text-slate-400 mt-1">Gestión de la comunicación inalámbrica y encriptación de los nodos AirMind</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Frecuencia Inalámbrica (Banda)
                    </label>
                    <input
                      type="text"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full bg-[#070b13] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      AppEUI (ID de Aplicación)
                    </label>
                    <input
                      type="text"
                      value={appEUI}
                      onChange={(e) => setAppEUI(e.target.value)}
                      className="w-full bg-[#070b13] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Spreading Factor (SF)
                    </label>
                    <select
                      value={spreadingFactor}
                      onChange={(e) => setSpreadingFactor(e.target.value)}
                      className="w-full bg-[#070b13] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none"
                    >
                      <option value="SF7">SF7 (Alto Ancho de Banda - 1km)</option>
                      <option value="SF8">SF8</option>
                      <option value="SF9">SF9</option>
                      <option value="SF10">SF10</option>
                      <option value="SF12">SF12 (Bajo Ancho de Banda - 15km)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-800/20 border border-slate-700/50 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-slate-200 text-sm">Estado de Pasarela (Gateway)</h4>
                      <p className="text-xs text-slate-400 mt-1">Probar canal uplink/downlink con el nodo central de la Comisión de Regantes</p>
                    </div>
                    <button
                      onClick={handleTestLora}
                      disabled={testingLora}
                      className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold disabled:opacity-50 transition-colors"
                    >
                      {testingLora ? 'Escaneando...' : 'Comprobar Canal'}
                    </button>
                  </div>

                  {loraTested && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-slate-300 flex items-center">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mr-2.5 animate-pulse" />
                      Canal LoRaWAN encriptado óptimo. Paquetes redundantes recibidos en Gateway Principal de Bajo Piura (100% de éxito).
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'simulator' && (
            <div className="glass-panel border border-slate-700/50 rounded-xl p-6 space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-slate-200">Herramientas del Simulador & Registro IoT</h2>
                <p className="text-xs text-slate-400 mt-1">Añada nuevos nodos interactivos al campo o restablezca la base de datos simulada</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Add sensor Form */}
                <form onSubmit={handleAddSensor} className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-300">Registrar Nuevo Nodo AirMind</h3>
                  
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">ID del Dispositivo (DevAddr)</label>
                      <input
                        type="text"
                        value={newSensorId}
                        onChange={(e) => setNewSensorId(e.target.value)}
                        className="w-full bg-[#070b13] border border-slate-700 rounded px-3 py-2 text-slate-200 outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Latitud (Bajo Piura)</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={newSensorLat}
                          onChange={(e) => setNewSensorLat(Number(e.target.value))}
                          className="w-full bg-[#070b13] border border-slate-700 rounded px-3 py-2 text-slate-200 outline-none"
                          min="-5.5"
                          max="-5.0"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Longitud (Bajo Piura)</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={newSensorLng}
                          onChange={(e) => setNewSensorLng(Number(e.target.value))}
                          className="w-full bg-[#070b13] border border-slate-700 rounded px-3 py-2 text-slate-200 outline-none"
                          min="-80.8"
                          max="-80.4"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-semibold shadow transition-colors"
                    >
                      Añadir Nodo & Iniciar Uplink
                    </button>
                  </div>
                </form>

                {/* Database actions */}
                <div className="space-y-4 border-l border-slate-800 pl-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-rose-450">Zona de Restablecimiento</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-2">
                      Si desea eliminar los nodos personalizados registrados o restablecer la simulación climática a su estado inicial, puede reiniciar la base de datos volátil local.
                    </p>
                  </div>

                  <button
                    onClick={handleResetDatabase}
                    className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs font-semibold transition-colors mt-6"
                  >
                    Restablecer Base de Datos y Clima
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
