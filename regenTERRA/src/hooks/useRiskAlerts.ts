import { useState, useEffect } from 'react';
import { fetchRiskAlerts, type RiskAlert } from '../services/alertsApi';

export function useRiskAlerts() {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [backendMode, setBackendMode] = useState<'live' | 'demo'>('live');

  useEffect(() => {
    let active = true;

    const loadAlerts = async () => {
      try {
        const data = await fetchRiskAlerts();
        if (active) {
          setAlerts(data);
          setError(null);
          setLoading(false);
          setLastUpdated(new Date());
          
          // Detectar si el backend está operando en modo simulado / demo
          const isDemo = data.some(
            (a) =>
              a.detalles?.descripcion?.toLowerCase().includes('simulado') || false
          );
          setBackendMode(isDemo ? 'demo' : 'live');
        }
      } catch (err: any) {
        if (active) {
          console.warn("FastAPI offline, cargando alertas de contingencia local:", err);
          
          // Alertas de contingencia local
          const fallbackData: RiskAlert[] = [
            {
              id: "fallback-1",
              tipo_evento: "HUAICO",
              severidad: 4,
              estado: "ACTIVO",
              lat: -9.47,
              lon: -78.31,
              geom_geojson: {
                type: "Polygon",
                coordinates: [[
                  [-78.33, -9.49],
                  [-78.29, -9.49],
                  [-78.29, -9.45],
                  [-78.33, -9.45],
                  [-78.33, -9.49]
                ]]
              },
              detalles: {
                descripcion: "Huaico crítico simulado en Casma KM 385. Obstrucción inminente de la Panamericana Norte (Local Fallback).",
                fecha_evento: new Date().toISOString(),
                fuente: "CENEPRED"
              }
            },
            {
              id: "fallback-2",
              tipo_evento: "SISMO",
              severidad: 5,
              estado: "ACTIVO",
              lat: -14.42,
              lon: -75.83,
              geom_geojson: null,
              detalles: {
                descripcion: "Sismo crítico simulado de magnitud 6.1 Mw - Ica (Local Fallback).",
                fecha_evento: new Date().toISOString(),
                fuente: "IGP"
              }
            }
          ];
          setAlerts(fallbackData);
          setBackendMode('demo');
          setError('Backend no disponible. Mostrando datos locales de simulación.');
          setLoading(false);
          setLastUpdated(new Date());
        }
      }
    };

    loadAlerts();
    const interval = setInterval(loadAlerts, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return { alerts, loading, error, lastUpdated, backendMode };
}
