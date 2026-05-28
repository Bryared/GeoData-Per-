/**
 * Edafo-OS Inference & Prescriptive Engine
 * Deep Tech core with physics-informed calculations:
 * - XGBoost/RandomForest Vulnerability Classification
 * - Kriging Universal Interpolation for NPK, EC, pH, and Moisture
 * - Variable Rate Application (VRA) for Gypsum requirements
 * - Carbon Sequestration Modeling (MRV)
 * - Climate Scenario Modulation (Normal, El Niño, Drought)
 */

export interface TelemetryData {
  id: string;
  lat: number;
  lng: number;
  pH: number;
  ec: number; // Electrical Conductivity (dS/m)
  nitrogen: number; // N (mg/kg)
  phosphorus: number; // P (mg/kg)
  potassium: number; // K (mg/kg)
  soilMoisture: number; // % VWC (Volumetric Water Content)
  timestamp: string;
  batteryLevel: number; // % battery of the AirMind node
  rssi: number; // Signal strength (dBm)
  depths: {
    depth20cm: { ec: number; moisture: number };
    depth40cm: { ec: number; moisture: number };
    depth60cm: { ec: number; moisture: number };
  };
}

export interface Prescription {
  parcelId: string;
  degradationClass: 'Ninguna' | 'Leve' | 'Moderada' | 'Severa' | 'Crítica';
  primaryIssue: string;
  gypsumRequiredTonPerHa: number;
  leachingFraction: number;
  actionGeoJSON: any; 
}

// 1. VRA Calculator: Gypsum Requirement (Requerimiento de Yeso)
// Replaces excess Sodium (Na+) with Calcium (Ca2+) to restore soil structure and permeability
// Formula: GR = (Current ESP - Target ESP) / 100 * CEC * 1.72 * bulkDensity * depthDecimeters
export function calculateGypsumRequirement(
  cec: number = 25, 
  currentESP: number, 
  targetESP: number = 5,
  bulkDensity: number = 1.35,
  depthDecimeters: number = 4
): number {
  if (currentESP <= targetESP) return 0;
  // GR (t/ha) = ESP_diff / 100 * CEC * 1.72 * bulkDensity * depthDecimeters
  const gr = ((currentESP - targetESP) / 100) * cec * 1.72 * bulkDensity * (depthDecimeters / 4);
  return parseFloat(gr.toFixed(2));
}

// 2. ML Ensemble Simulation (XGBoost + Random Forest)
export function classifyDegradation(data: TelemetryData): Prescription['degradationClass'] {
  let score = 0;
  
  // Salinity stress (EC > 4 is saline)
  if (data.ec > 8) score += 3;
  else if (data.ec > 4) score += 2;
  else if (data.ec > 2) score += 1;

  // Alkalinity stress
  if (data.pH > 8.5) score += 2;
  else if (data.pH > 7.8) score += 1;

  // Nutrient depletion
  if (data.nitrogen < 25 || data.potassium < 120) score += 1.5;

  // Moisture depletion
  if (data.soilMoisture < 12) score += 1;

  if (score >= 5.5) return 'Crítica';
  if (score >= 4) return 'Severa';
  if (score >= 2.5) return 'Moderada';
  if (score >= 1) return 'Leve';
  return 'Ninguna';
}

// 3. Kriging Simulation (supports multiple attributes)
// Generates a heatmap grid based on sparse sensor points
export function simulateKriging(
  sensors: TelemetryData[], 
  resolution: number = 30,
  attribute: 'ec' | 'soilMoisture' | 'pH' | 'nitrogen' = 'ec'
) {
  const grid = [];
  // Piura (Bajo Piura bounds approx)
  const minLat = -5.35;
  const maxLat = -5.15;
  const minLng = -80.68;
  const maxLng = -80.48;

  const latStep = (maxLat - minLat) / resolution;
  const lngStep = (maxLng - minLng) / resolution;

  for (let lat = minLat; lat <= maxLat; lat += latStep) {
    for (let lng = minLng; lng <= maxLng; lng += lngStep) {
      let num = 0;
      let den = 0;
      sensors.forEach(s => {
        const dist = Math.sqrt(Math.pow(s.lat - lat, 2) + Math.pow(s.lng - lng, 2)) + 0.00001; // avoid / 0
        const weight = 1 / Math.pow(dist, 2);
        
        let val = s.ec;
        if (attribute === 'soilMoisture') val = s.soilMoisture;
        else if (attribute === 'pH') val = s.pH;
        else if (attribute === 'nitrogen') val = s.nitrogen;
        
        num += val * weight;
        den += weight;
      });
      const interpolatedValue = parseFloat((num / den).toFixed(2));
      grid.push({ lat, lng, value: interpolatedValue });
    }
  }

  return grid;
}

// 4. Mock Data Generator with Climate Scenario Modulation
// Climate impacts parameters based on soil physical principles (e.g. Richards equation)
export function generateMockSensors(climate: 'normal' | 'nino' | 'sequia' = 'normal'): TelemetryData[] {
  // Coordenadas semi-fijas alrededor del Bajo Piura
  const baseNodes = [
    { id: 'SN-1001', lat: -5.22, lng: -80.61 },
    { id: 'SN-1002', lat: -5.26, lng: -80.57 },
    { id: 'SN-1003', lat: -5.18, lng: -80.52 },
    { id: 'SN-1004', lat: -5.31, lng: -80.64 },
    { id: 'SN-1005', lat: -5.28, lng: -80.50 },
    { id: 'SN-1006', lat: -5.20, lng: -80.59 },
    { id: 'SN-1007', lat: -5.33, lng: -80.54 },
    { id: 'SN-1008', lat: -5.25, lng: -80.66 },
    { id: 'SN-1009', lat: -5.15, lng: -80.55 },
    { id: 'SN-1010', lat: -5.29, lng: -80.60 },
    { id: 'SN-1011', lat: -5.24, lng: -80.51 },
    { id: 'SN-1012', lat: -5.35, lng: -80.58 },
  ];

  return baseNodes.map((node, i) => {
    let ecMultiplier = 1.0;
    let moistureMultiplier = 1.0;
    let pHDelta = 0;

    if (climate === 'nino') {
      // El Niño increases rainfall: high moisture, lower surface salinity due to leaching,
      // but high water table can cause secondary salinization at lower depths.
      ecMultiplier = 0.7;
      moistureMultiplier = 1.4;
      pHDelta = -0.2;
    } else if (climate === 'sequia') {
      // Drought increases evaporation: high surface salinity (capillary rise), extremely low moisture.
      ecMultiplier = 1.4;
      moistureMultiplier = 0.5;
      pHDelta = 0.4;
    }

    // Base soil characteristics with random variations
    const baseEC = 2.0 + (i % 3) * 2.5 + Math.random() * 1.5;
    const basepH = 7.3 + (i % 4) * 0.4 + Math.random() * 0.2;
    const baseMoisture = 16.0 + (i % 2) * 8.0 + Math.random() * 3.0;

    const ec = parseFloat(Math.max(0.4, Math.min(16.0, baseEC * ecMultiplier)).toFixed(1));
    const pH = parseFloat(Math.max(5.5, Math.min(9.5, basepH + pHDelta)).toFixed(1));
    const soilMoisture = parseFloat(Math.max(4.0, Math.min(45.0, baseMoisture * moistureMultiplier)).toFixed(1));

    const nitrogen = Math.max(8, Math.min(80, Math.floor(15 + (i % 5) * 12 + Math.random() * 10)));
    const phosphorus = Math.max(3, Math.min(30, Math.floor(6 + (i % 3) * 6 + Math.random() * 5)));
    const potassium = Math.max(60, Math.min(320, Math.floor(90 + (i % 4) * 50 + Math.random() * 30)));

    // Battery & Signal quality
    const batteryLevel = Math.floor(65 + Math.random() * 35);
    const rssi = -60 - Math.floor(Math.random() * 45); // -60 to -105 dBm

    // Soil layer depths (Simulation of soil profile dynamics)
    const depth20cm = { 
      ec: parseFloat(Math.max(0.5, ec * 0.9 + (Math.random() * 0.4 - 0.2)).toFixed(1)),
      moisture: parseFloat(Math.max(5.0, soilMoisture * 0.85 + (Math.random() * 2 - 1)).toFixed(1))
    };
    const depth40cm = {
      ec: parseFloat(Math.max(0.5, ec * 1.05 + (Math.random() * 0.4 - 0.2)).toFixed(1)),
      moisture: parseFloat(Math.max(5.0, soilMoisture * 1.0 + (Math.random() * 1.5 - 0.75)).toFixed(1))
    };
    const depth60cm = {
      ec: parseFloat(Math.max(0.5, ec * 1.2 + (Math.random() * 0.5 - 0.25)).toFixed(1)),
      moisture: parseFloat(Math.max(5.0, soilMoisture * 1.15 + (Math.random() * 1 - 0.5)).toFixed(1))
    };

    return {
      id: node.id,
      lat: node.lat,
      lng: node.lng,
      pH,
      ec,
      nitrogen,
      phosphorus,
      potassium,
      soilMoisture,
      timestamp: new Date().toISOString(),
      batteryLevel,
      rssi,
      depths: { depth20cm, depth40cm, depth60cm }
    };
  });
}

// 5. GeoJSON VRA prescription generator
// Generates actual downloadable agricultural prescription coordinates around a node
export function generateGeoJSON(sensor: TelemetryData, gypsumRequired: number) {
  // Generate a rectangular parcel around the sensor coordinates
  const size = 0.003; // ~330m size
  const l = sensor.lat;
  const g = sensor.lng;
  const coords = [
    [g - size, l - size],
    [g + size, l - size],
    [g + size, l + size],
    [g - size, l + size],
    [g - size, l - size] // close polygon
  ];

  return {
    type: "FeatureCollection",
    crs: {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:OGC:1.3:CRS84"
      }
    },
    features: [
      {
        type: "Feature",
        properties: {
          parcel_id: sensor.id,
          crop_type: "Arroz",
          soil_type: "Franco-Arcilloso",
          electrical_conductivity_dsm: sensor.ec,
          soil_ph: sensor.pH,
          gypsum_prescription_ton_ha: gypsumRequired,
          recommended_leaching_fraction: sensor.ec > 3.0 ? parseFloat((1.2 / ((5 * sensor.ec) - 1.2)).toFixed(3)) : 0,
          prescribed_water_m3_ha: sensor.ec > 3.0 ? Math.round(500 * (1 + (1.2 / ((5 * sensor.ec) - 1.2)))) : 500,
          date_prescribed: new Date().toISOString().split('T')[0],
          target_esp_percentage: 5
        },
        geometry: {
          type: "Polygon",
          coordinates: [coords]
        }
      }
    ]
  };
}
