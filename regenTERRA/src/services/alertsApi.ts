export type RiskAlert = {
  id: string | number;
  tipo_evento: string;
  severidad: number;
  estado: string;
  lat?: number;
  lon?: number;
  geom_geojson?: any;
  detalles?: {
    descripcion?: string;
    fecha_evento?: string;
    fuente?: string;
  };
};

export async function fetchRiskAlerts(): Promise<RiskAlert[]> {
  const response = await fetch('http://localhost:8000/api/alerts');
  if (!response.ok) {
    throw new Error(`Error loading alerts: ${response.status}`);
  }
  return response.json();
}
