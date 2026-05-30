import { Circle, Popup, GeoJSON } from 'react-leaflet';
import type { RiskAlert } from '../../../services/alertsApi';

type RiskAlertLayerProps = {
  alerts: RiskAlert[];
};

function getAlertColor(severidad: number) {
  if (severidad >= 5) return '#ff0055'; // Rojo crítico
  if (severidad >= 3) return '#ffaa00'; // Ámbar moderado
  return '#00d4ff'; // Cian info
}

function getRadius(severidad: number) {
  if (severidad >= 5) return 18000;
  if (severidad >= 3) return 10000;
  return 6000;
}

export default function RiskAlertLayer({ alerts }: RiskAlertLayerProps) {
  return (
    <>
      {alerts.map((alert) => {
        const color = getAlertColor(alert.severidad);
        const detalles = alert.detalles || {};
        const descripcion = detalles.descripcion || `${alert.tipo_evento} activo.`;
        const fuente = detalles.fuente || (alert.tipo_evento === 'SISMO' ? 'IGP' : 'CENEPRED');
        
        let fechaFormatted = 'Reciente';
        if (detalles.fecha_evento) {
          try {
            const d = new Date(detalles.fecha_evento);
            fechaFormatted = d.toLocaleDateString('es-PE', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });
          } catch (e) {
            // Ignorar y usar fallback
          }
        }

        const popupContent = (
          <div className="text-slate-800 font-sans p-1 leading-normal min-w-[200px]">
            <div className="font-bold text-xs uppercase tracking-wider border-b border-slate-200 pb-1 mb-1.5 flex justify-between items-center">
              <span>{alert.tipo_evento}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] text-white font-extrabold" style={{ backgroundColor: color }}>
                Sev {alert.severidad}
              </span>
            </div>
            <div className="text-[11px] font-medium text-slate-700 leading-relaxed">
              {descripcion}
            </div>
            <div className="text-[9px] text-slate-400 mt-2 font-mono flex justify-between items-center border-t border-slate-100 pt-1">
              <span>Fte: {fuente}</span>
              <span>{fechaFormatted}</span>
            </div>
          </div>
        );

        // Caso A: Si existe la geometría real GeoJSON
        if (alert.geom_geojson) {
          return (
            <GeoJSON
              key={`alert-geom-${alert.id}`}
              data={alert.geom_geojson}
              style={{
                color: color,
                fillColor: color,
                fillOpacity: 0.25,
                weight: 2,
              }}
            >
              <Popup>{popupContent}</Popup>
            </GeoJSON>
          );
        }

        // Caso B: Si solo vienen lat/lon
        if (typeof alert.lat === 'number' && typeof alert.lon === 'number') {
          return (
            <Circle
              key={`alert-circle-${alert.id}`}
              center={[alert.lat, alert.lon]}
              radius={getRadius(alert.severidad)}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.2,
                weight: 2,
              }}
            >
              <Popup>{popupContent}</Popup>
            </Circle>
          );
        }

        return null;
      })}
    </>
  );
}
