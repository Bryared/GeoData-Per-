import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import { simulateKriging, generateMockSensors, type TelemetryData } from '../utils/engine';

interface TerrainProps {
  sensors: TelemetryData[];
  attribute: 'ec' | 'soilMoisture' | 'pH' | 'nitrogen';
  heightExaggeration: number;
  wireframe: boolean;
  resolution: number;
  autoRotate: boolean;
  rotateSpeed: number;
}

function KrigingTerrain({ 
  sensors, 
  attribute, 
  heightExaggeration, 
  wireframe, 
  resolution,
  autoRotate,
  rotateSpeed
}: TerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Calculate Kriging grid
  const gridData = useMemo(() => {
    return simulateKriging(sensors, resolution, attribute);
  }, [sensors, resolution, attribute]);

  // Construct dynamic geometry
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(10, 10, resolution - 1, resolution - 1);
    const pos = geo.attributes.position;
    const colors = [];
    const color = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const zValue = gridData[i]?.value || 0;
      // Vertices Z coordinates represent values
      const height = zValue * heightExaggeration; 
      pos.setZ(i, height);

      // Color mapping according to active attribute
      if (attribute === 'ec') {
        if (zValue > 8) color.setHSL(0, 0.9, 0.5); // Rose (Critical)
        else if (zValue > 4) color.setHSL(0.1, 0.95, 0.5); // Yellow/Orange
        else color.setHSL(0.4, 0.9, 0.4); // Emerald (Healthy)
      } else if (attribute === 'soilMoisture') {
        if (zValue < 12) color.setHSL(0, 0.9, 0.5); // Rose (Dry)
        else if (zValue < 22) color.setHSL(0.1, 0.95, 0.5); // Yellow
        else color.setHSL(0.55, 0.9, 0.5); // Cyan/Blue (Wet)
      } else if (attribute === 'pH') {
        if (zValue > 8.2) color.setHSL(0, 0.9, 0.5); // Rose (Alkaline)
        else if (zValue < 6.2) color.setHSL(0.65, 0.9, 0.5); // Purple (Acidic)
        else color.setHSL(0.4, 0.9, 0.4); // Emerald (Neutral)
      } else { // Nitrogen
        if (zValue < 20) color.setHSL(0, 0.9, 0.5); // Rose (Deficient)
        else if (zValue < 45) color.setHSL(0.1, 0.95, 0.5); // Yellow
        else color.setHSL(0.4, 0.9, 0.4); // Emerald (Rich)
      }
      colors.push(color.r, color.g, color.b);
    }
    
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [gridData, resolution, attribute, heightExaggeration]);

  // Handle subtle automatic terrain rotation
  useFrame((state) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.05 * rotateSpeed;
    }
  });

  // Calculate coordinates mapping bounds (Piura) to match our 10x10 Three plane
  const minLat = -5.35;
  const maxLat = -5.15;
  const minLng = -80.68;
  const maxLng = -80.48;

  return (
    <group rotation={[-Math.PI / 3, 0, 0]}>
      {/* Dynamic Interpolated Mesh */}
      <mesh ref={meshRef} geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial 
          vertexColors 
          wireframe={wireframe}
          roughness={0.7}
          metalness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Mesh Grid wireframe overlay */}
      {!wireframe && (
        <mesh geometry={geometry}>
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.06} />
        </mesh>
      )}

      {/* Floating Interactive 3D Nodes */}
      {sensors.map((s) => {
        // Map geo coordinates [lat, lng] to Three [x, y] coordinates on the 10x10 plane
        const x = ((s.lat - minLat) / (maxLat - minLat)) * 10 - 5;
        const y = ((s.lng - minLng) / (maxLng - minLng)) * 10 - 5;
        
        let nodeVal = s.ec;
        if (attribute === 'soilMoisture') nodeVal = s.soilMoisture;
        else if (attribute === 'pH') nodeVal = s.pH;
        else if (attribute === 'nitrogen') nodeVal = s.nitrogen;

        const z = nodeVal * heightExaggeration;

        return (
          <group key={s.id} position={[x, y, z + 0.2]}>
            <mesh castShadow>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Outer glowing halo ring */}
            <mesh>
              <ringGeometry args={[0.2, 0.25, 16]} />
              <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} transparent opacity={0.6} />
            </mesh>
            
            {/* Interactive HTML overlay marker */}
            <Html distanceFactor={8} position={[0, 0.3, 0]} center>
              <div className="glass-panel p-2 rounded border border-slate-700 bg-slate-950/90 text-[9px] font-mono text-slate-200 select-none whitespace-nowrap shadow-xl">
                <span className="font-bold text-emerald-400">{s.id}</span>
                <span className="ml-1.5 text-slate-400">
                  {nodeVal} {attribute === 'ec' ? 'dS/m' : attribute === 'soilMoisture' ? '%' : attribute === 'nitrogen' ? 'N' : 'pH'}
                </span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export function Map3D() {
  const [attribute, setAttribute] = useState<'ec' | 'soilMoisture' | 'pH' | 'nitrogen'>('ec');
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotateSpeed, setRotateSpeed] = useState(1);
  const [exaggeration, setExaggeration] = useState(0.2);
  const [resolution, setResolution] = useState(30);
  const [sensors, setSensors] = useState<TelemetryData[]>([]);

  // Load sensors from mock + custom local storage, listening to updates
  const loadSensorsData = () => {
    const climate = localStorage.getItem('soil_climate') as any || 'normal';
    const base = generateMockSensors(climate);
    const customStr = localStorage.getItem('custom_sensors');
    if (customStr) {
      const custom = JSON.parse(customStr);
      setSensors([...base, ...custom]);
    } else {
      setSensors(base);
    }
  };

  useEffect(() => {
    loadSensorsData();
    window.addEventListener('storage', loadSensorsData);
    return () => window.removeEventListener('storage', loadSensorsData);
  }, []);

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Interpolación Kriging 3D</h1>
          <p className="text-slate-400">Modelo Digital de Inferencia Geoespacial en Vivo - Bajo Piura</p>
        </div>
        
        {/* Layer Selector */}
        <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-lg p-1">
          <button
            onClick={() => setAttribute('ec')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
              attribute === 'ec' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Salinidad (CE)
          </button>
          <button
            onClick={() => setAttribute('soilMoisture')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
              attribute === 'soilMoisture' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Humedad (%)
          </button>
          <button
            onClick={() => setAttribute('pH')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
              attribute === 'pH' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            pH Suelo
          </button>
          <button
            onClick={() => setAttribute('nitrogen')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
              attribute === 'nitrogen' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Nitrógeno
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[500px] glass-panel border border-slate-700/50 rounded-xl relative overflow-hidden flex flex-col lg:flex-row">
        
        {/* 3D Canvas container */}
        <div className="flex-1 h-full cursor-move bg-gradient-to-b from-slate-900 to-[#0b0f19] relative min-h-[400px]">
          {/* Legend overlay */}
          <div className="absolute top-4 left-4 z-10 glass-panel p-4 rounded-lg border border-slate-700/50 bg-slate-900/90 text-xs w-44">
            <h3 className="font-semibold text-slate-200 mb-2.5">
              Leyenda ({attribute === 'ec' ? 'CE dS/m' : attribute === 'soilMoisture' ? 'Hum %' : attribute === 'nitrogen' ? 'N mg/kg' : 'pH'})
            </h3>
            
            {attribute === 'ec' && (
              <div className="space-y-2 text-slate-300">
                <div className="flex items-center"><span className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></span> {'< 4 (Sano)'}</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-amber-500 rounded-full mr-2"></span> {'4 - 8 (Alerta)'}</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-rose-500 rounded-full mr-2"></span> {'> 8 (Crítico)'}</div>
              </div>
            )}
            {attribute === 'soilMoisture' && (
              <div className="space-y-2 text-slate-300">
                <div className="flex items-center"><span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span> {'> 22 (Óptimo)'}</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-amber-500 rounded-full mr-2"></span> {'12 - 22 (Bajo)'}</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-rose-500 rounded-full mr-2"></span> {'< 12 (Sequedad)'}</div>
              </div>
            )}
            {attribute === 'pH' && (
              <div className="space-y-2 text-slate-300">
                <div className="flex items-center"><span className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></span> {'6.2 - 8.2 (Neutro)'}</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span> {'< 6.2 (Ácido)'}</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-rose-500 rounded-full mr-2"></span> {'> 8.2 (Alcalino)'}</div>
              </div>
            )}
            {attribute === 'nitrogen' && (
              <div className="space-y-2 text-slate-300">
                <div className="flex items-center"><span className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></span> {'> 45 (Rico)'}</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-amber-500 rounded-full mr-2"></span> {'20 - 45 (Regular)'}</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-rose-500 rounded-full mr-2"></span> {'< 20 (Deficiente)'}</div>
              </div>
            )}
          </div>

          <Canvas camera={{ position: [0, -5, 12], fov: 45 }} shadows>
            <ambientLight intensity={0.65} />
            <directionalLight position={[10, 10, 8]} intensity={1.5} castShadow />
            <pointLight position={[-10, -10, -5]} intensity={0.5} color="#10b981" />
            
            {sensors.length > 0 && (
              <KrigingTerrain 
                sensors={sensors}
                attribute={attribute}
                heightExaggeration={exaggeration}
                wireframe={wireframe}
                resolution={resolution}
                autoRotate={autoRotate}
                rotateSpeed={rotateSpeed}
              />
            )}
            
            <Grid 
              position={[0, -2, 0]} 
              args={[20, 20]} 
              cellSize={1} 
              cellThickness={1} 
              cellColor="#1e293b" 
              sectionSize={5} 
              sectionThickness={1.5} 
              sectionColor="#334155" 
              fadeDistance={25} 
            />
            <OrbitControls enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2 - 0.05} />
            <Environment preset="night" />
          </Canvas>
        </div>

        {/* 3D Map Control Sidebar */}
        <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-700/50 p-6 space-y-6 flex flex-col justify-between bg-slate-900/20">
          <div className="space-y-6">
            <h3 className="font-bold text-slate-200 text-sm pb-3 border-b border-slate-800">Controles de Visualización</h3>
            
            {/* Auto-rotation speed */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Rotación del Terreno</span>
                <input
                  type="checkbox"
                  checked={autoRotate}
                  onChange={(e) => setAutoRotate(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
              </div>
              {autoRotate && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Velocidad</span>
                    <span>{rotateSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="3"
                    step="0.1"
                    value={rotateSpeed}
                    onChange={(e) => setRotateSpeed(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Wireframe toggle */}
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Visualizar Malla (Wireframe)</span>
              <input
                type="checkbox"
                checked={wireframe}
                onChange={(e) => setWireframe(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
            </div>

            {/* Exaggeration Factor */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Exageración de Relieve</span>
                <span className="font-mono text-[10px] text-slate-500">x{exaggeration.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.4"
                step="0.01"
                value={exaggeration}
                onChange={(e) => setExaggeration(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Resolution Selector */}
            <div className="space-y-2 text-xs">
              <label className="block text-slate-400">Resolución Kriging (Malla)</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(Number(e.target.value))}
                className="w-full bg-[#070b13] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-emerald-500"
              >
                <option value="15">Baja (Malla 15x15)</option>
                <option value="30">Media (Malla 30x30)</option>
                <option value="50">Alta (Malla 50x50 - Pesado)</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg text-[10px] text-slate-500 leading-relaxed">
            <span className="font-bold text-slate-400 block mb-1">Inferencia Geoespacial Kriging:</span>
            El resolvedor computa la covarianza espacial de los {sensors.length} nodos activos para reconstruir superficies continuas, rellenando vacíos sin sensores físicos.
          </div>
        </div>

      </div>
    </div>
  );
}
