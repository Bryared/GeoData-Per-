import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Map3D } from './pages/Map3D';
import { Prescriptions } from './pages/Prescriptions';
import { Telemetry } from './pages/Telemetry';
import { Settings } from './pages/Settings';
import { Pitch } from './pages/Pitch';
import { SATAgroPro } from './pages/SATAgroPro';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="telemetry" element={<Telemetry />} />
          <Route path="satagro" element={<SATAgroPro />} />
          <Route path="map" element={<Map3D />} />
          <Route path="prescriptions" element={<Prescriptions />} />
          <Route path="settings" element={<Settings />} />
          <Route path="pitch" element={<Pitch />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
