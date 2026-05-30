import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Telemetria } from './modules/edafologia/Telemetria';
import { Map3DKriging } from './modules/edafologia/Map3DKriging';
import { RecetasVRA } from './modules/edafologia/RecetasVRA';
import { MandoRiesgos } from './modules/riesgos/MandoRiesgos';
import { VisorCatastral } from './modules/catastro/VisorCatastral';
import { DataHub } from './modules/analitica/DataHub';
import { Settings } from './pages/Settings';
import { Pitch } from './pages/Pitch';
import { DimensionProvider } from './context/DimensionContext';
import { LanguageProvider } from './i18n/LanguageContext';

// Nuevas Ventanillas del Pivote Estratégico
import { SuelosYCultivos } from './modules/cultivos/SuelosYCultivos';
import { HidrologiaReservas } from './modules/recursos/HidrologiaReservas';
import { EvidenciaGeoPeru } from './modules/evidencia/EvidenciaGeoPeru';

function App() {
  return (
    <LanguageProvider>
      <DimensionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Rutas Core del Pivote */}
              <Route index element={<Dashboard />} />
              <Route path="riesgos" element={<MandoRiesgos />} />
              <Route path="cultivos" element={<SuelosYCultivos />} />
              <Route path="satagro" element={<VisorCatastral />} />
              <Route path="recursos" element={<HidrologiaReservas />} />
              <Route path="evidencia" element={<EvidenciaGeoPeru />} />
              <Route path="settings" element={<Settings />} />
              <Route path="pitch" element={<Pitch />} />

              {/* Rutas Legacy Ocultas (Mantener compatibilidad) */}
              <Route path="telemetry" element={<Telemetria />} />
              <Route path="map" element={<Map3DKriging />} />
              <Route path="prescriptions" element={<RecetasVRA />} />
              <Route path="analytics" element={<DataHub />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DimensionProvider>
    </LanguageProvider>
  );
}

export default App;

