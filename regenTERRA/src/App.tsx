import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Telemetria } from './modules/edafologia/Telemetria';
import { Map3DKriging } from './modules/edafologia/Map3DKriging';
import { RecetasVRA } from './modules/edafologia/RecetasVRA';
import { MandoRiesgos } from './modules/riesgos/MandoRiesgos';
import { VisorCatastral } from './modules/catastro/VisorCatastral';
import { Settings } from './pages/Settings';
import { Pitch } from './pages/Pitch';
import { DimensionProvider } from './context/DimensionContext';

function App() {
  return (
    <DimensionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="telemetry" element={<Telemetria />} />
            <Route path="satagro" element={<VisorCatastral />} />
            <Route path="map" element={<Map3DKriging />} />
            <Route path="prescriptions" element={<RecetasVRA />} />
            <Route path="riesgos" element={<MandoRiesgos />} />
            <Route path="settings" element={<Settings />} />
            <Route path="pitch" element={<Pitch />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DimensionProvider>
  );
}

export default App;
