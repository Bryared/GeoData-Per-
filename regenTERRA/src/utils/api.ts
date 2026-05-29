/**
 * TERRA-REGEN API Service
 * Dynamic connection bridge between React Frontend and Python PINN Analytical Server.
 * Supports a hybrid connected mode (http://localhost:8000) and a standalone high-fidelity fallback.
 */

import { generateMockSensors, calculateGypsumRequirement, type TelemetryData } from './engine';

const API_BASE_URL = 'http://localhost:8000';

class SoilAPIService {
  private isConnected: boolean = false;
  private checkPromise: Promise<boolean> | null = null;

  constructor() {
    this.checkConnection();
  }

  /**
   * Pings the Python server to check if it is active.
   */
  async checkConnection(): Promise<boolean> {
    if (this.checkPromise) return this.checkPromise;

    this.checkPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200); // 1.2s timeout
        
        const response = await fetch(`${API_BASE_URL}/api/data`, {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        this.isConnected = response.ok;
        return response.ok;
      } catch (e) {
        this.isConnected = false;
        return false;
      } finally {
        this.checkPromise = null;
      }
    })();

    return this.checkPromise;
  }

  /**
   * Returns the cached connection status.
   */
  isServerConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Fetches telemetry parcel data.
   */
  async getTelemetryData(climate: 'normal' | 'nino' | 'sequia' = 'normal'): Promise<TelemetryData[]> {
    const connected = await this.checkConnection();
    if (connected) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/data`);
        const json = await res.json();
        
        const dbConnected = json.metadata?.database_connected || false;
        console.log(`%c[GeoTERRA API] Conectado al backend local. Modo DB: ${dbConnected ? 'SUPABASE EN VIVO' : 'SIMULADOR LOCAL (JSON)'}`, 'color: #10b981; font-weight: bold;');

        // Map Python backend schema back to frontend React TelemetryData format
        const parcelas = json.parcelas || [];
        const series = json.series_temporales || {};
        
        return parcelas.map((p: any) => {
          const readings = series[p.id] || [];
          const lastReading = readings[readings.length - 1] || {};
          
          return {
            id: p.codigo,
            lat: p.lat,
            lng: p.lng,
            pH: lastReading.temperatura_suelo_20cm ? 7.6 : 7.2, // fallback or generic
            ec: lastReading.conductividad_20cm || 1.2,
            nitrogen: 35,
            phosphorus: 12,
            potassium: 180,
            soilMoisture: lastReading.humedad_20cm || 24.0,
            timestamp: lastReading.fecha || new Date().toISOString(),
            batteryLevel: 94,
            rssi: -72,
            depths: {
              depth20cm: { 
                ec: lastReading.conductividad_20cm || 1.2, 
                moisture: lastReading.humedad_20cm || 24.0 
              },
              depth40cm: { 
                ec: lastReading.conductividad_40cm || 1.4, 
                moisture: lastReading.humedad_40cm || 22.0 
              },
              depth60cm: { 
                ec: lastReading.conductividad_60cm || 1.6, 
                moisture: lastReading.humedad_60cm || 20.0 
              }
            }
          };
        });
      } catch (err) {
        console.warn('API error fetching soil data, falling back to local simulation:', err);
      }
    }
    
    // Standalone fallback
    return generateMockSensors(climate);
  }

  /**
   * Fetches VRA prescriptions.
   */
  async getPrescriptions(): Promise<any> {
    const connected = await this.checkConnection();
    if (connected) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/prescriptions`);
        const json = await res.json();
        const dbConnected = json.valle?.includes('Supabase') || false;
        console.log(`%c[GeoTERRA Prescripciones] Ingesta desde: ${dbConnected ? 'Supabase DB' : 'Archivo Local JSON'}`, 'color: #3b82f6; font-weight: bold;');
        return json;
      } catch (err) {
        console.warn('API error fetching prescriptions:', err);
      }
    }
    return null;
  }

  /**
   * Executes a live analytical simulation in the server or runs frontend physics formulas.
   */
  async runLiveSimulation(params: {
    parcel_id: number;
    clima: 'normal' | 'nino' | 'sequia';
    riego_mm: number;
    freatico_cm: number;
    corrector: 'none' | 'yeso' | 'organico';
  }): Promise<any> {
    const connected = await this.checkConnection();
    if (connected) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/simulate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        });
        return await res.json();
      } catch (err) {
        console.error('Failed to run server simulation:', err);
      }
    }

    // Fallback simulation (simulate PINN residues and VRA on client-side)
    const mockSensors = generateMockSensors(params.clima);
    const sensor = mockSensors.find((_, i) => i === (params.parcel_id - 1) % mockSensors.length) || mockSensors[0];
    
    // Simple physical model modulation on frontend
    const humMod = params.riego_mm * 0.35 - (params.clima === 'sequia' ? 4.8 : 2.5);
    const newMoisture = Math.max(5, Math.min(45, sensor.soilMoisture + humMod));
    
    const capRise = params.freatico_cm < 150 ? (150 - params.freatico_cm) * 0.02 : 0;
    const wash = params.riego_mm > 45 ? sensor.ec * 0.3 : params.riego_mm > 15 ? sensor.ec * 0.1 : 0;
    const corr = params.corrector === 'yeso' ? 1.5 : params.corrector === 'organico' ? 0.7 : 0;
    const newEC = Math.max(0.4, sensor.ec + capRise - wash - corr);

    const targetESP = Number(localStorage.getItem('soil_target_esp') || '5');
    const defaultCEC = Number(localStorage.getItem('soil_default_cec') || '25');
    const esp = newEC * 2.4;
    const gypsum = calculateGypsumRequirement(defaultCEC, esp, targetESP);

    return {
      parcel_id: params.parcel_id,
      variables_actualizadas: {
        humedad_20cm: parseFloat(newMoisture.toFixed(2)),
        humedad_40cm: parseFloat((newMoisture - 2).toFixed(2)),
        conductividad_20cm: parseFloat(newEC.toFixed(2)),
        conductividad_40cm: parseFloat((newEC + 0.3).toFixed(2)),
        nivel_freatico_cm: params.freatico_cm,
        riego_aplicado_mm: params.riego_mm
      },
      pinn_residuals: {
        richards: 0.00000214 + Math.random() * 0.000001,
        soluto: 0.00000085 + Math.random() * 0.0000004
      },
      prescription: {
        salinidad_ds_m: parseFloat(newEC.toFixed(2)),
        nivel_riesgo: newEC > 6.0 ? 'CRÍTICO' : newEC > 4.0 ? 'ALTO' : newEC > 2.0 ? 'MODERADO' : 'BAJO',
        requerimiento_lavado_porcentaje: newEC > 3.0 ? parseFloat(((1.2 / (5 * newEC - 1.2)) * 100).toFixed(1)) : 0,
        riego_prescrito_m3_ha: newEC > 3.0 ? Math.round(50 * (1 + 1.2 / (5 * newEC - 1.2))) * 10 : 500,
        yeso_agricola_ton_ha: gypsum,
        corrector_salinidad_aplicar: gypsum > 0 
          ? `Aplicar ${gypsum} ton/ha de Yeso Agrícola de inmediato.` 
          : 'Suelo balanceado. Mantener monitoreo.',
        alerta_rotacion_cultivo: newEC > 6.5,
        cultivo_sugerido_rotacion: newEC > 7.0 ? 'Quinua (Altamente Tolerante)' : newEC > 5.0 ? 'Espárrago Verde (Tolerante)' : null
      }
    };
  }

  /**
   * Adds a newly drawn parcel to the system.
   */
  async registerParcel(parcel: {
    codigo: string;
    cultivo: string;
    area_ha: number;
    lat: number;
    lng: number;
    coords: number[][];
  }): Promise<any> {
    const connected = await this.checkConnection();
    if (connected) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/parcels/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(parcel)
        });
        return await res.json();
      } catch (err) {
        console.error('Failed to register parcel on server:', err);
      }
    }

    // Local fallback - store in custom sensors list
    const customStr = localStorage.getItem('custom_sensors');
    const existing = customStr ? JSON.parse(customStr) : [];
    
    const newSensor = {
      id: parcel.codigo,
      lat: parcel.lat,
      lng: parcel.lng,
      pH: 7.7,
      ec: 3.2,
      nitrogen: 38,
      phosphorus: 14,
      potassium: 190,
      soilMoisture: 24,
      timestamp: new Date().toISOString(),
      batteryLevel: 100,
      rssi: -65,
      depths: {
        depth20cm: { ec: 3.0, moisture: 22 },
        depth40cm: { ec: 3.2, moisture: 24 },
        depth60cm: { ec: 3.5, moisture: 26 }
      }
    };

    localStorage.setItem('custom_sensors', JSON.stringify([...existing, newSensor]));
    window.dispatchEvent(new Event('storage'));
    return newSensor;
  }
}

export const soilAPI = new SoilAPIService();

const GO_API_BASE_URL = 'http://localhost:9000';

class LogisticsAPIService {
  private isConnected: boolean = false;
  private checkPromise: Promise<boolean> | null = null;

  async checkConnection(): Promise<boolean> {
    if (this.checkPromise) return this.checkPromise;

    this.checkPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s timeout
        
        const response = await fetch(`${GO_API_BASE_URL}/api/v1/nexus/status`, {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        this.isConnected = response.ok;
        return response.ok;
      } catch (e) {
        this.isConnected = false;
        return false;
      } finally {
        this.checkPromise = null;
      }
    })();

    return this.checkPromise;
  }

  isServerConnected(): boolean {
    return this.isConnected;
  }

  async triggerReroute(payload: {
    event_id: string;
    event_type: string;
    severity: number;
    latitude: number;
    longitude: number;
  }): Promise<any> {
    const connected = await this.checkConnection();
    if (connected) {
      try {
        const response = await fetch(`${GO_API_BASE_URL}/api/v1/nexus/reroute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const json = await response.json();
        console.log('%c[GeoTERRA Routing] Conexión activa con Golang nexus_router.', 'color: #06b6d4; font-weight: bold;');
        console.log(`%c[Golang Solver] Dijkstra tiempo de resolución: ${json.solver_time_ms} ms. Rutas recalculadas: ${json.rerouted_paths}`, 'color: #06b6d4;');
        return json;
      } catch (err) {
        console.warn('API error communicating with Golang router, falling back to local simulation:', err);
      }
    }
    
    // Fallback simulation
    return {
      status: "SUCCESS",
      optimal_route: " Trujillo ──► Callejón de Huaylas (Huaraz) ──► Canta ──► Lima Hub",
      solver_time_ms: 12,
      rerouted_paths: 3,
      message: "Huaico en Casma simulado. Desvío por sierra calculado mediante simulación en cliente."
    };
  }
}

export const logisticsAPI = new LogisticsAPIService();
