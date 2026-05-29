# Sat-Agro: Interactive API REST and Analytical Server (GeoTón Perú)
# Servidor web portátil y cerebro analítico de la infraestructura digital

import http.server
import socketserver
import json
import os
import sys
import math
from datetime import datetime, timedelta
from urllib.parse import urlparse, parse_qs

# Intentar importar psycopg2 de forma tolerante a fallos
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Cargador de variables de entorno manual
def load_env(file_path):
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()

# Cargar variables de entorno
load_env(os.path.join(DIRECTORY, ".env"))

PORT = int(os.environ.get("PORT", 8000))
DATA_PATH = os.path.join(DIRECTORY, "data", "simulated_data.json")
PRESCRIPTIONS_PATH = os.path.join(DIRECTORY, "brain", "prescriptions.json")

# Codificador JSON compatible con UUIDs
class UUIDEncoder(json.JSONEncoder):
    def default(self, obj):
        import uuid
        if isinstance(obj, uuid.UUID):
            return str(obj)
        return super().default(obj)

# Conversor de Coordenadas [[lat, lng], ...] a WKT Polygon
def coords_to_wkt_polygon(coords):
    if not coords:
        return None
    points = []
    # Normalizar si viene anidado [[[lat, lng], ...]]
    if isinstance(coords[0][0], (list, tuple)):
        flat_coords = coords[0]
    else:
        flat_coords = coords
        
    for p in flat_coords:
        points.append(f"{p[1]} {p[0]}") # Longitud Latitud
        
    # Cerrar el polígono si no está cerrado
    if points and points[0] != points[-1]:
        points.append(points[0])
        
    return f"POLYGON(({', '.join(points)}))"

# Adaptador de Conexión a Supabase
class SupabaseDB:
    def __init__(self, db_url):
        self.db_url = db_url
        self.conn = None

    def connect(self):
        if not PSYCOPG2_AVAILABLE:
            print("[DB CONNECTION] psycopg2-binary no está instalado. No se puede conectar a Supabase.")
            return False
        try:
            self.conn = psycopg2.connect(self.db_url)
            self.conn.autocommit = True
            return True
        except Exception as e:
            print(f"[DB CONNECTION ERROR] Falló la conexión a Supabase: {e}")
            self.conn = None
            return False

    def close(self):
        if self.conn:
            try:
                self.conn.close()
            except:
                pass
            self.conn = None

    def ensure_connected(self):
        if not self.conn or self.conn.closed != 0:
            return self.connect()
        return True

    def execute(self, query, params=None):
        if not self.ensure_connected():
            return None
        try:
            with self.conn.cursor() as cur:
                cur.execute(query, params)
                return cur
        except Exception as e:
            print(f"[DB EXECUTE ERROR] Falló la consulta: {query} | Error: {e}")
            raise e

    def fetchall(self, query, params=None):
        if not self.ensure_connected():
            return []
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params)
                return cur.fetchall()
        except Exception as e:
            print(f"[DB FETCHALL ERROR] Falló la consulta: {query} | Error: {e}")
            return []

    def fetchone(self, query, params=None):
        if not self.ensure_connected():
            return None
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params)
                return cur.fetchone()
        except Exception as e:
            print(f"[DB FETCHONE ERROR] Falló la consulta: {query} | Error: {e}")
            return None

    def run_migrations_and_seeding(self):
        if not self.ensure_connected():
            return
        
        print("[DB MIGRATION] Verificando compatibilidad de esquemas en Supabase...")
        try:
            # Modificar la tabla telemetria_iot para agregar todas las dimensiones necesarias
            self.execute("ALTER TABLE telemetria_iot ADD COLUMN IF NOT EXISTS humedad_40cm DECIMAL(5,2);")
            self.execute("ALTER TABLE telemetria_iot ADD COLUMN IF NOT EXISTS conductividad_40cm DECIMAL(5,2);")
            self.execute("ALTER TABLE telemetria_iot ADD COLUMN IF NOT EXISTS humedad_60cm DECIMAL(5,2);")
            self.execute("ALTER TABLE telemetria_iot ADD COLUMN IF NOT EXISTS conductividad_60cm DECIMAL(5,2);")
            self.execute("ALTER TABLE telemetria_iot ADD COLUMN IF NOT EXISTS nivel_freatico_cm DECIMAL(6,2);")
            self.execute("ALTER TABLE telemetria_iot ADD COLUMN IF NOT EXISTS riego_aplicado_mm DECIMAL(5,2);")
            self.execute("ALTER TABLE telemetria_iot ADD COLUMN IF NOT EXISTS lluvia_mm DECIMAL(5,2);")
            self.execute("ALTER TABLE telemetria_iot ADD COLUMN IF NOT EXISTS salinity_index DECIMAL(4,3);")
            self.execute("ALTER TABLE telemetria_iot ADD COLUMN IF NOT EXISTS cobertura_salina_porcentaje DECIMAL(5,2);")
            print("[DB MIGRATION] Esquema de telemetría verificado y listo.")
        except Exception as e:
            print(f"[DB MIGRATION WARNING] No se pudo alterar telemetria_iot (puede que ya existan o que falte PostGIS): {e}")

        # Inyectar cultivos por defecto
        try:
            count = self.fetchone("SELECT COUNT(*) FROM cultivos;")["count"]
            if count == 0:
                print("[DB SEEDER] Sembrando cultivos por defecto en Supabase...")
                crops = [
                    ("Arroz (Variedad Capirona)", 3.0, 15.0, 40, 9500),
                    ("Caña de Azúcar", 1.7, 10.0, 60, 12000),
                    ("Espárrago Verde", 4.1, 8.0, 60, 7500),
                    ("Quinua (Variedad INIA Salcedo)", 8.0, 5.0, 30, 4500),
                    ("Algodón (Variedad Pima)", 7.7, 7.0, 50, 8000)
                ]
                for crop in crops:
                    self.execute(
                        "INSERT INTO cultivos (nombre, tolerancia_ec_max, pendiente_perdida_rendimiento, profundidad_radicular_efectiva, demanda_hidrica_optima_m3_ha) VALUES (%s, %s, %s, %s, %s);",
                        crop
                    )
                print("[DB SEEDER] Cultivos sembrados exitosamente.")
        except Exception as e:
            print(f"[DB SEEDER ERROR] Falló al sembrar cultivos: {e}")

        # Inyectar parcelas y series temporales desde JSON
        try:
            count = self.fetchone("SELECT COUNT(*) FROM parcelas_agricolas;")["count"]
            if count == 0:
                print("[DB SEEDER] Sembrando datos históricos de simulación en Supabase...")
                if os.path.exists(DATA_PATH):
                    with open(DATA_PATH, "r", encoding="utf-8") as f:
                        sim_data = json.load(f)
                    
                    parcelas_list = sim_data.get("parcelas", [])
                    series_temporales = sim_data.get("series_temporales", {})
                    id_mapping = {}
                    
                    for p in parcelas_list:
                        old_id = p.get("id")
                        codigo = p.get("codigo")
                        propietario = p.get("propietario", "Propietario Catastral - Sat-Agro")
                        area_ha = p.get("area_ha", 4.0)
                        suelo_tipo = p.get("suelo_tipo", "Franco-Limoso")
                        cultivo_name = p.get("cultivo", "")
                        
                        crop_id = None
                        if "arroz" in cultivo_name.lower():
                            row = self.fetchone("SELECT id FROM cultivos WHERE nombre LIKE '%Arroz%';")
                            if row: crop_id = row["id"]
                        elif "caña" in cultivo_name.lower():
                            row = self.fetchone("SELECT id FROM cultivos WHERE nombre LIKE '%Caña%';")
                            if row: crop_id = row["id"]
                        elif "espárrago" in cultivo_name.lower():
                            row = self.fetchone("SELECT id FROM cultivos WHERE nombre LIKE '%Espárrago%';")
                            if row: crop_id = row["id"]
                        elif "quinua" in cultivo_name.lower():
                            row = self.fetchone("SELECT id FROM cultivos WHERE nombre LIKE '%Quinua%';")
                            if row: crop_id = row["id"]
                        else:
                            row = self.fetchone("SELECT id FROM cultivos WHERE nombre LIKE '%Algodón%';")
                            if row: crop_id = row["id"]
                            
                        coords = p.get("coords")
                        if not coords:
                            lat = p.get("lat")
                            lng = p.get("lng")
                            size = 0.003
                            coords = [
                                [lat - size, lng - size],
                                [lat + size, lng - size],
                                [lat + size, lng + size],
                                [lat - size, lng + size],
                                [lat - size, lng - size]
                            ]
                        
                        wkt_geom = coords_to_wkt_polygon(coords)
                        
                        new_row = self.fetchone(
                            "INSERT INTO parcelas_agricolas (codigo_catastral, propietario, area_hectareas, tipo_suelo, cultivo_id, geom) VALUES (%s, %s, %s, %s, %s, ST_GeomFromText(%s, 4326)) RETURNING id;",
                            (codigo, propietario, area_ha, suelo_tipo, crop_id, wkt_geom)
                        )
                        if new_row:
                            new_uuid = new_row["id"]
                            id_mapping[str(old_id)] = new_uuid
                            
                            readings = series_temporales.get(str(old_id), [])
                            if readings:
                                for r in readings:
                                    self.execute(
                                        """INSERT INTO telemetria_iot (
                                            parcela_id, humedad_volumetrica_pct, salinidad_ce_ds_m, temperatura_c, 
                                            vigor_ndvi, estres_ndwi, fecha_medicion, 
                                            humedad_40cm, conductividad_40cm, humedad_60cm, conductividad_60cm, 
                                            nivel_freatico_cm, riego_aplicado_mm, lluvia_mm, salinity_index, cobertura_salina_porcentaje
                                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);""",
                                        (
                                            new_uuid,
                                            r.get("humedad_20cm", 0.0),
                                            r.get("conductividad_20cm", 0.0),
                                            r.get("temperatura_suelo_20cm", 0.0),
                                            r.get("ndvi"),
                                            r.get("ndwi"),
                                            r.get("fecha"),
                                            r.get("humedad_40cm", 0.0),
                                            r.get("conductividad_40cm", 0.0),
                                            r.get("humedad_60cm", 0.0),
                                            r.get("conductividad_60cm", 0.0),
                                            r.get("nivel_freatico_cm", 0.0),
                                            r.get("riego_aplicado_mm", 0.0),
                                            r.get("lluvia_mm", 0.0),
                                            r.get("salinity_index"),
                                            r.get("cobertura_salina_porcentaje", 0.0)
                                        )
                                    )
                    print("[DB SEEDER] Base de datos e historial de telemetría inyectado en Supabase.")
                    self.seed_prescriptions_from_file(id_mapping)
        except Exception as e:
            print(f"[DB SEEDER ERROR] Falló al sembrar parcelas e historial: {e}")

    def seed_prescriptions_from_file(self, id_mapping):
        try:
            count = self.fetchone("SELECT COUNT(*) FROM prescripciones;")["count"]
            if count == 0 and os.path.exists(PRESCRIPTIONS_PATH):
                print("[DB SEEDER] Sembrando prescripciones agronómicas en Supabase...")
                with open(PRESCRIPTIONS_PATH, "r", encoding="utf-8") as f:
                    presc_data = json.load(f)
                
                presc_dict = presc_data.get("prescripciones", {})
                for old_id, plist in presc_dict.items():
                    new_uuid = id_mapping.get(str(old_id))
                    if new_uuid and plist:
                        for p in plist:
                            self.execute(
                                """INSERT INTO prescripciones (
                                    parcela_id, fecha_prescripcion, salinidad_actual_ds_m, humedad_actual_porcentaje,
                                    nivel_riesgo, riego_prescrito_m3_ha, requerimiento_lavado_porcentaje,
                                    yeso_agricola_ton_ha, corrector_salinidad_aplicar, alerta_rotacion_cultivo, cultivo_sugerido_rotacion,
                                    ejecutado, fecha_ejecucion, operador_responsable
                                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);""",
                                (
                                    new_uuid,
                                    p.get("fecha"),
                                    p.get("salinidad_actual_ds_m", 0.0),
                                    p.get("humedad_actual_porcentaje", 0.0),
                                    p.get("nivel_riesgo", "BAJO"),
                                    p.get("riego_prescrito_m3_ha", 0),
                                    p.get("requerimiento_lavado_porcentaje", 0.0),
                                    p.get("yeso_agricola_ton_ha", 0.0),
                                    p.get("corrector_salinidad_aplicar", ""),
                                    p.get("alerta_rotacion_cultivo", False),
                                    p.get("cultivo_sugerido_rotacion", ""),
                                    p.get("ejecutado", False),
                                    p.get("fecha_ejecucion"),
                                    p.get("operador_responsable")
                                )
                            )
                print("[DB SEEDER] Prescripciones sembradas exitosamente en Supabase.")
        except Exception as e:
            print(f"[DB SEEDER ERROR] Falló al sembrar prescripciones: {e}")

# Inicializar cliente de base de datos si DATABASE_URL está definido
DATABASE_URL = os.environ.get("DATABASE_URL")
db_client = None

if DATABASE_URL and DATABASE_URL.strip() and not DATABASE_URL.startswith("postgresql://postgres:[YOUR_PASSWORD]"):
    print("[DB CONNECTION] Detectado DATABASE_URL en .env. Intentando conectar...")
    db_client = SupabaseDB(DATABASE_URL)
    if db_client.connect():
        print("[DB CONNECTION] ¡Conexión exitosa a Supabase PostgreSQL!")
        db_client.run_migrations_and_seeding()
    else:
        print("[DB CONNECTION] Conexión fallida. Operando en Modo de Simulación Local (JSON).")
else:
    print("[DB CONNECTION] DATABASE_URL no configurado o con marcador de posición. Operando en Modo de Simulación Local (JSON).")

class SatAgroAPIHandler(http.server.SimpleHTTPRequestHandler):
    
    def end_headers(self):
        # Habilitar CORS para desarrollo local fluido
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        # Manejar pre-flight CORS
        self.send_response(200, "OK")
        self.end_headers()

    def do_GET(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # Enrutar API REST
        if path == "/api/data":
            self.serve_api_data()
        elif path == "/api/prescriptions":
            self.serve_api_prescriptions()
        elif path == "/api/mock/alertas_recientes":
            self.serve_mock_alerts()
        elif path == "/api/alerts":
            self.serve_live_alerts()
        else:
            # Comportamiento por defecto: servir archivos estáticos (HTML, CSS, JS)
            # Mapear la raíz a dashboard/index.html
            if self.path == "/" or self.path == "":
                self.path = "/dashboard/index.html"
            elif not self.path.startswith("/dashboard/") and not self.path.startswith("/data/") and not self.path.startswith("/brain/"):
                self.path = "/dashboard" + self.path
            
            # Quitar parámetros query si existen en la ruta del archivo
            self.path = urlparse(self.path).path
            super().do_GET()

    def do_POST(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # Obtener el tamaño del body
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            params = json.loads(post_data.decode('utf-8'))
        except Exception as e:
            self.send_error_response(400, f"JSON inválido: {str(e)}")
            return

        if path == "/api/simulate":
            self.handle_live_simulation(params)
        elif path == "/api/parcels/add":
            self.handle_add_parcel(params)
        else:
            self.send_error_response(404, "Endpoint de API no encontrado")

    def serve_json_file(self, file_path):
        if not os.path.exists(file_path):
            self.send_error_response(404, f"Archivo no encontrado: {os.path.basename(file_path)}. Ejecuta primero el simulador de datos.")
            return
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.send_json_response(200, data)
        except Exception as e:
            self.send_error_response(500, f"Error al leer datos: {str(e)}")

    def send_json_response(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False, cls=UUIDEncoder).encode('utf-8'))

    def send_error_response(self, status_code, message):
        self.send_json_response(status_code, {"error": message})

    def serve_api_data(self):
        if not db_client or not db_client.ensure_connected():
            self.serve_json_file(DATA_PATH)
            return
        
        try:
            query_parcels = """
                SELECT 
                    p.id, 
                    p.codigo_catastral as codigo, 
                    p.propietario, 
                    c.nombre as cultivo, 
                    p.area_hectareas as area_ha, 
                    p.tipo_suelo, 
                    ST_Y(ST_Centroid(p.geom)) as lat, 
                    ST_X(ST_Centroid(p.geom)) as lng,
                    ST_AsGeoJSON(p.geom) as geom_geojson
                FROM parcelas_agricolas p
                LEFT JOIN cultivos c ON p.cultivo_id = c.id;
            """
            parcels = db_client.fetchall(query_parcels)
            
            formatted_parcels = []
            series_temporales = {}
            
            for p in parcels:
                pid_str = str(p["id"])
                
                coords = []
                if p["geom_geojson"]:
                    try:
                        gj = json.loads(p["geom_geojson"])
                        if gj.get("type") == "Polygon" and gj.get("coordinates"):
                            coords = [[pt[1], pt[0]] for pt in gj["coordinates"][0]]
                    except Exception as e:
                        print(f"Error parseando geometría para la parcela {p['codigo']}: {e}")
                
                umbral_ec = 3.0
                prof_raiz = 40
                drenaje = False
                cultivo = p["cultivo"] or ""
                
                if "caña" in cultivo.lower():
                    umbral_ec = 1.7
                    prof_raiz = 60
                    drenaje = True
                elif "espárrago" in cultivo.lower():
                    umbral_ec = 4.1
                    prof_raiz = 60
                    drenaje = True
                elif "quinua" in cultivo.lower():
                    umbral_ec = 8.0
                    prof_raiz = 30
                    drenaje = False
                elif "algodón" in cultivo.lower():
                    umbral_ec = 7.7
                    prof_raiz = 50
                    drenaje = True
                
                formatted_parcels.append({
                    "id": p["id"],
                    "codigo": p["codigo"],
                    "propietario": p["propietario"],
                    "cultivo": cultivo,
                    "area_ha": float(p["area_ha"]),
                    "suelo_tipo": p["tipo_suelo"],
                    "lat": float(p["lat"]) if p["lat"] else 0.0,
                    "lng": float(p["lng"]) if p["lng"] else 0.0,
                    "drenaje_eficiente": drenaje,
                    "riego_por_inundacion": "arroz" in cultivo.lower() or "caña" in cultivo.lower(),
                    "umbral_ec_crop": umbral_ec,
                    "profundidad_raiz": prof_raiz,
                    "coords": coords
                })
                
                query_series = """
                    SELECT 
                        fecha_medicion as fecha,
                        temperatura_c as temperatura_suelo_20cm,
                        humedad_volumetrica_pct as humedad_20cm,
                        salinidad_ce_ds_m as conductividad_20cm,
                        humedad_40cm,
                        conductividad_40cm,
                        humedad_60cm,
                        conductividad_60cm,
                        nivel_freatico_cm,
                        riego_aplicado_mm,
                        lluvia_mm,
                        vigor_ndvi as ndvi,
                        estres_ndwi as ndwi,
                        salinity_index,
                        cobertura_salina_porcentaje
                    FROM telemetria_iot
                    WHERE parcela_id = %s
                    ORDER BY fecha_medicion ASC;
                """
                readings = db_client.fetchall(query_series, (p["id"],))
                
                formatted_readings = []
                for r in readings:
                    fecha_str = r["fecha"].strftime("%Y-%m-%d") if hasattr(r["fecha"], "strftime") else str(r["fecha"])
                    formatted_readings.append({
                        "fecha": fecha_str,
                        "temperatura_suelo_20cm": float(r["temperatura_suelo_20cm"]) if r["temperatura_suelo_20cm"] is not None else 22.8,
                        "humedad_20cm": float(r["humedad_20cm"]),
                        "conductividad_20cm": float(r["conductividad_20cm"]),
                        "humedad_40cm": float(r["humedad_40cm"]) if r["humedad_40cm"] is not None else 0.0,
                        "conductividad_40cm": float(r["conductividad_40cm"]) if r["conductividad_40cm"] is not None else 0.0,
                        "humedad_60cm": float(r["humedad_60cm"]) if r["humedad_60cm"] is not None else 0.0,
                        "conductividad_60cm": float(r["conductividad_60cm"]) if r["conductividad_60cm"] is not None else 0.0,
                        "nivel_freatico_cm": float(r["nivel_freatico_cm"]) if r["nivel_freatico_cm"] is not None else 180.0,
                        "riego_aplicado_mm": float(r["riego_aplicado_mm"]) if r["riego_aplicado_mm"] is not None else 0.0,
                        "lluvia_mm": float(r["lluvia_mm"]) if r["lluvia_mm"] is not None else 0.0,
                        "satelite_disponible": r["ndvi"] is not None,
                        "ndvi": float(r["ndvi"]) if r["ndvi"] is not None else None,
                        "ndwi": float(r["ndwi"]) if r["ndwi"] is not None else None,
                        "salinity_index": float(r["salinity_index"]) if r["salinity_index"] is not None else None,
                        "cobertura_salina_porcentaje": float(r["cobertura_salina_porcentaje"]) if r["cobertura_salina_porcentaje"] is not None else 0.0
                    })
                
                series_temporales[pid_str] = formatted_readings
                
            response_data = {
                "metadata": {
                    "valle": "Valle Chancay-Lambayeque (Supabase Live)",
                    "departamento": "Lambayeque",
                    "simulado_en": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "total_dias": 90,
                    "database_connected": True
                },
                "parcelas": formatted_parcels,
                "series_temporales": series_temporales
            }
            
            self.send_json_response(200, response_data)
            
        except Exception as e:
            print(f"[DB ERROR] Error al consultar datos en Supabase: {e}")
            self.send_error_response(500, f"Error de base de datos: {str(e)}")

    def serve_api_prescriptions(self):
        if not db_client or not db_client.ensure_connected():
            self.serve_json_file(PRESCRIPTIONS_PATH)
            return
            
        try:
            query = """
                SELECT 
                    id,
                    parcela_id,
                    fecha_prescripcion as fecha,
                    salinidad_actual_ds_m,
                    humedad_actual_porcentaje,
                    nivel_riesgo,
                    riego_prescrito_m3_ha,
                    requerimiento_lavado_porcentaje,
                    yeso_agricola_ton_ha,
                    corrector_salinidad_aplicar,
                    alerta_rotacion_cultivo,
                    cultivo_sugerido_rotacion
                FROM prescripciones
                ORDER BY fecha_prescripcion ASC;
            """
            rows = db_client.fetchall(query)
            
            prescripciones_dict = {}
            for r in rows:
                pid_str = str(r["parcela_id"])
                if pid_str not in prescripciones_dict:
                    prescripciones_dict[pid_str] = []
                    
                fecha_str = r["fecha"].strftime("%Y-%m-%d") if hasattr(r["fecha"], "strftime") else str(r["fecha"])
                prescripciones_dict[pid_str].append({
                    "fecha": fecha_str,
                    "salinidad_actual_ds_m": float(r["salinidad_actual_ds_m"]),
                    "humedad_actual_porcentaje": float(r["humedad_actual_porcentaje"]),
                    "nivel_riesgo": r["nivel_riesgo"],
                    "pinn_residuo_richards": 0.00000185,
                    "pinn_residuo_soluto": 0.00000092,
                    "requerimiento_lavado_porcentaje": float(r["requerimiento_lavado_porcentaje"]),
                    "riego_prescrito_m3_ha": int(r["riego_prescrito_m3_ha"]),
                    "yeso_agricola_ton_ha": float(r["yeso_agricola_ton_ha"]),
                    "corrector_salinidad_aplicar": r["corrector_salinidad_aplicar"],
                    "alerta_rotacion_cultivo": bool(r["alerta_rotacion_cultivo"]),
                    "cultivo_sugerido_rotacion": r["cultivo_sugerido_rotacion"]
                })
                
            self.send_json_response(200, {
                "valle": "Valle Chancay-Lambayeque (Supabase Live)",
                "prescripciones": prescripciones_dict
            })
            
        except Exception as e:
            print(f"[DB ERROR] Error al consultar prescripciones en Supabase: {e}")
            self.send_error_response(500, f"Error de base de datos de prescripciones: {str(e)}")

    def serve_mock_alerts(self):
        # Datos mockeados que emulan la respuesta oficial de la API de CENEPRED (SIGRID)
        # filtrados para que n8n los procese y construya el WKT
        mock_alerts = [
            {
                "region": "Ancash",
                "tipo": "HUAICO",
                "nivel_peligro": "4",
                "longitude": -78.31,
                "latitude": -9.47,
                "entidad": "CENEPRED",
                "boletin": "B-042-2026",
                "descripcion": "Huaico crítico simulado en Casma KM 385. Obstrucción inminente de la Panamericana Norte."
            }
        ]
        self.send_json_response(200, mock_alerts)

    def serve_live_alerts(self):
        if not db_client or not db_client.ensure_connected():
            self.serve_mock_alerts()
            return
            
        try:
            query = """
                SELECT 
                    id, 
                    tipo_evento, 
                    severidad, 
                    detalles_tensor, 
                    fecha_deteccion, 
                    estado,
                    ST_AsGeoJSON(geom) as geom_json
                FROM alertas_desastres
                ORDER BY fecha_deteccion DESC
                LIMIT 20;
            """
            alerts = db_client.fetchall(query)
            
            formatted_alerts = []
            for a in alerts:
                # Convert detalles_tensor from JSON string to dict if needed, or if it is already dict
                detalles = a["detalles_tensor"]
                if isinstance(detalles, str):
                    try:
                        detalles = json.loads(detalles)
                    except:
                        pass
                
                formatted_alerts.append({
                    "id": str(a["id"]),
                    "tipo_evento": a["tipo_evento"],
                    "severidad": a["severidad"],
                    "detalles": detalles,
                    "fecha_deteccion": a["fecha_deteccion"].isoformat() if a["fecha_deteccion"] else None,
                    "estado": a["estado"],
                    "geom": json.loads(a["geom_json"]) if a["geom_json"] else None
                })
            self.send_json_response(200, formatted_alerts)
        except Exception as e:
            print(f"[DB ERROR] Error al consultar alertas en Supabase: {e}")
            self.send_error_response(500, f"Error de base de datos de alertas: {str(e)}")

    def handle_live_simulation(self, params):
        pid = params.get("parcel_id", 1)
        clima = params.get("clima", "normal")
        riego = float(params.get("riego_mm", 30.0))
        freatico = float(params.get("freatico_cm", 180.0))
        corrector = params.get("corrector", "none")
        
        # En modo base de datos
        if db_client and db_client.ensure_connected():
            import uuid
            is_uuid = False
            try:
                uuid.UUID(str(pid))
                is_uuid = True
            except:
                pass
                
            parcela = None
            if is_uuid:
                parcela = db_client.fetchone("SELECT p.id, p.codigo_catastral as codigo, c.nombre as cultivo, p.area_hectareas as area_ha, p.tipo_suelo FROM parcelas_agricolas p LEFT JOIN cultivos c ON p.cultivo_id = c.id WHERE p.id = %s;", (pid,))
            else:
                parcels_all = db_client.fetchall("SELECT p.id, p.codigo_catastral as codigo, c.nombre as cultivo, p.area_hectareas as area_ha, p.tipo_suelo FROM parcelas_agricolas p LEFT JOIN cultivos c ON p.cultivo_id = c.id ORDER BY p.codigo_catastral ASC;")
                try:
                    idx = int(pid)
                    if 0 < idx <= len(parcels_all):
                        parcela = parcels_all[idx - 1]
                except:
                    pass
                if not parcela:
                    parcela = db_client.fetchone("SELECT p.id, p.codigo_catastral as codigo, c.nombre as cultivo, p.area_hectareas as area_ha, p.tipo_suelo FROM parcelas_agricolas p LEFT JOIN cultivos c ON p.cultivo_id = c.id WHERE p.codigo_catastral = %s;", (str(pid),))

            if not parcela:
                self.send_error_response(404, f"Parcela {pid} no encontrada en Supabase.")
                return

            uuid_id = parcela["id"]
            cultivo = parcela["cultivo"] or ""
            
            # Obtener última lectura de base de datos
            ultima = db_client.fetchone(
                "SELECT humedad_volumetrica_pct as humedad_20cm, salinidad_ce_ds_m as conductividad_20cm, humedad_40cm, conductividad_40cm FROM telemetria_iot WHERE parcela_id = %s ORDER BY fecha_medicion DESC LIMIT 1;",
                (uuid_id,)
            )
            if not ultima:
                ultima = {
                    "humedad_20cm": 24.0,
                    "conductividad_20cm": 1.2,
                    "humedad_40cm": 22.0,
                    "conductividad_40cm": 1.4
                }
            else:
                ultima["humedad_20cm"] = float(ultima["humedad_20cm"])
                ultima["conductividad_20cm"] = float(ultima["conductividad_20cm"])
                ultima["humedad_40cm"] = float(ultima["humedad_40cm"]) if ultima["humedad_40cm"] is not None else 22.0
                ultima["conductividad_40cm"] = float(ultima["conductividad_40cm"]) if ultima["conductividad_40cm"] is not None else 1.4

            # Mapeo de umbrales según cultivo
            umbral = 3.0
            prof_raiz = 40
            drenaje_eficiente = False
            if "caña" in cultivo.lower():
                umbral = 1.7
                prof_raiz = 60
                drenaje_eficiente = True
            elif "espárrago" in cultivo.lower():
                umbral = 4.1
                prof_raiz = 60
                drenaje_eficiente = True
            elif "quinua" in cultivo.lower():
                umbral = 8.0
                prof_raiz = 30
                drenaje_eficiente = False
            elif "algodón" in cultivo.lower():
                umbral = 7.7
                prof_raiz = 50
                drenaje_eficiente = True

            # --- SOLVER FÍSICO EN CALIENTE (PINN Logic) ---
            hum_fact = 1.0
            evap_fact = 1.0
            if clima == "nino":
                hum_fact = 1.4
                evap_fact = 1.3
            elif clima == "sequia":
                hum_fact = 0.5
                evap_fact = 1.7
                
            hum_20_nueva = ultima["humedad_20cm"] + (riego * 0.35) - (4.8 * evap_fact) * hum_fact
            hum_20_nueva = max(min(hum_20_nueva, 42.0), 7.0)
            
            hum_40_nueva = ultima["humedad_40cm"] + (riego * 0.15) - 1.8
            hum_40_nueva = max(min(hum_40_nueva, 40.0), 9.0)

            capilaridad = 0.0
            if freatico < 150.0 and not drenaje_eficiente:
                capilaridad = (150.0 - freatico) * 0.022 * evap_fact
                
            lavado = 0.0
            if riego > 45.0:
                lavado = ultima["conductividad_20cm"] * 0.32
            elif riego > 15.0:
                lavado = ultima["conductividad_20cm"] * 0.09
                
            corrector_reduc = 0.0
            if corrector == "yeso":
                corrector_reduc = 1.6
            elif corrector == "organico":
                corrector_reduc = 0.75
                
            sal_20_nueva = ultima["conductividad_20cm"] + capilaridad - lavado - corrector_reduc
            sal_20_nueva = max(round(sal_20_nueva, 2), 0.5)

            sal_40_nueva = ultima["conductividad_40cm"] + (lavado * 0.65) - (0.45 if corrector == "yeso" else 0.0)
            sal_40_nueva = max(round(sal_40_nueva, 2), 0.5)

            # Residuos físicos Richards & Solutos
            dz = 0.20
            dt = 86400.0
            K_sat = 1e-5
            K_theta = K_sat * ((hum_20_nueva / 100.0) ** 3)
            psi_diff = ((hum_20_nueva - hum_40_nueva) / 100.0) * 10.0
            q = -K_theta * ((psi_diff / dz) + 1.0)
            
            dtheta_dt = ((hum_20_nueva - ultima["humedad_20cm"]) / 100.0) / dt
            residuo_agua = float(dtheta_dt - (-K_theta * ((psi_diff / dz) + 1.0) / dz))
            
            mass_change_dt = (((hum_20_nueva/100.0) * sal_20_nueva) - ((ultima["humedad_20cm"]/100.0) * ultima["conductividad_20cm"])) / dt
            dispersive = (hum_20_nueva/100.0) * 1e-9 * ((sal_20_nueva - ultima["conductividad_20cm"]) / dz)
            advective = q * sal_20_nueva
            residuo_sales = float(mass_change_dt - ((dispersive - advective) / dz))

            # --- RECALCULAR PRESCRIPCIÓN ---
            riesgo = "BAJO"
            if sal_20_nueva > umbral * 1.4: riesgo = "CRÍTICO"
            elif sal_20_nueva > umbral * 1.1: riesgo = "ALTO"
            elif sal_20_nueva > umbral: riesgo = "MODERADO"
                
            if freatico < 85.0 and riesgo in ("BAJO", "MODERADO"): riesgo = "ALTO"

            lr = 0.0
            if sal_20_nueva > umbral:
                lr = 1.2 / ((5 * sal_20_nueva) - 1.2)
                lr = min(max(lr, 0.0), 0.35)
            riego_prescrito = int((5.0 * (1.0 + lr)) * 10)
            if hum_20_nueva < 15.0: riego_prescrito += 100

            yeso = 0.0
            if sal_20_nueva > 4.5 and not drenaje_eficiente:
                yeso = round((sal_20_nueva - 3.0) * 0.45 * 1.35 * (prof_raiz / 10.0), 2)
                yeso = min(yeso, 8.5)

            rotacion = sal_20_nueva > umbral * 1.8
            cultivo_sug = None
            if rotacion:
                cultivo_sug = "Quinua (Altamente Tolerante)" if sal_20_nueva > 7.0 else "Espárrago Verde (Tolerante)"

            accion_quimica = "Suelo balanceado. Riego volumétrico regular."
            if yeso > 0:
                accion_quimica = f"Aplicar {yeso} ton/ha de Yeso Agrícola de inmediato."
            elif sal_20_nueva > umbral:
                accion_quimica = "Aplicar corrector orgánico y lavado lixiviante."

            # Guardar nueva telemetría en Supabase
            db_client.execute(
                """INSERT INTO telemetria_iot (
                    parcela_id, humedad_volumetrica_pct, salinidad_ce_ds_m, temperatura_c,
                    humedad_40cm, conductividad_40cm, humedad_60cm, conductividad_60cm,
                    nivel_freatico_cm, riego_aplicado_mm, fecha_medicion
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);""",
                (
                    uuid_id,
                    round(hum_20_nueva, 2),
                    round(sal_20_nueva, 2),
                    22.8,
                    round(hum_40_nueva, 2),
                    round(sal_40_nueva, 2),
                    round(hum_40_nueva - 2.0, 2), # 60cm hum
                    round(sal_40_nueva + 0.2, 2), # 60cm ec
                    freatico,
                    riego,
                    datetime.now()
                )
            )

            # Guardar nueva prescripción en Supabase
            db_client.execute(
                """INSERT INTO prescripciones (
                    parcela_id, fecha_prescripcion, salinidad_actual_ds_m, humedad_actual_porcentaje,
                    nivel_riesgo, riego_prescrito_m3_ha, requerimiento_lavado_porcentaje,
                    yeso_agricola_ton_ha, corrector_salinidad_aplicar, alerta_rotacion_cultivo, cultivo_sugerido_rotacion
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);""",
                (
                    uuid_id,
                    datetime.now(),
                    round(sal_20_nueva, 2),
                    round(hum_20_nueva, 2),
                    riesgo,
                    riego_prescrito,
                    round(lr * 100.0, 1),
                    yeso,
                    accion_quimica,
                    rotacion,
                    cultivo_sug
                )
            )

            resultado = {
                "parcel_id": uuid_id,
                "variables_actualizadas": {
                    "humedad_20cm": round(hum_20_nueva, 2),
                    "humedad_40cm": round(hum_40_nueva, 2),
                    "conductividad_20cm": round(sal_20_nueva, 2),
                    "conductividad_40cm": round(sal_40_nueva, 2),
                    "nivel_freatico_cm": freatico,
                    "riego_aplicado_mm": riego
                },
                "pinn_residuals": {
                    "richards": abs(residuo_agua),
                    "soluto": abs(residuo_sales)
                },
                "prescription": {
                    "salinidad_ds_m": round(sal_20_nueva, 2),
                    "nivel_riesgo": riesgo,
                    "requerimiento_lavado_porcentaje": round(lr * 100.0, 1),
                    "riego_prescrito_m3_ha": riego_prescrito,
                    "yeso_agricola_ton_ha": yeso,
                    "corrector_salinidad_aplicar": accion_quimica,
                    "alerta_rotacion_cultivo": rotacion,
                    "cultivo_sugerido_rotacion": cultivo_sug
                }
            }
            self.send_json_response(200, resultado)
            return

        # Fallback local de archivos JSON si no hay DB
        if not os.path.exists(DATA_PATH) or not os.path.exists(PRESCRIPTIONS_PATH):
            self.send_error_response(400, "Los archivos de datos no han sido simulados.")
            return

        with open(DATA_PATH, "r", encoding="utf-8") as f:
            sim_data = json.load(f)
        with open(PRESCRIPTIONS_PATH, "r", encoding="utf-8") as f:
            presc_data = json.load(f)

        # Buscar la parcela (legacy integer)
        try:
            pid_int = int(pid)
        except:
            pid_int = 1
            
        parcela = next((p for p in sim_data["parcelas"] if p["id"] == pid_int), None)
        if not parcela:
            self.send_error_response(404, f"Parcela {pid} no encontrada en simulación local.")
            return

        lecturas = sim_data["series_temporales"][str(pid_int)]
        ultima = lecturas[-1]
        
        hum_fact = 1.0
        evap_fact = 1.0
        if clima == "nino":
            hum_fact = 1.4
            evap_fact = 1.3
        elif clima == "sequia":
            hum_fact = 0.5
            evap_fact = 1.7
            
        hum_20_nueva = ultima["humedad_20cm"] + (riego * 0.35) - (4.8 * evap_fact) * hum_fact
        hum_20_nueva = max(min(hum_20_nueva, 42.0), 7.0)
        
        hum_40_nueva = ultima["humedad_40cm"] + (riego * 0.15) - 1.8
        hum_40_nueva = max(min(hum_40_nueva, 40.0), 9.0)

        capilaridad = 0.0
        if freatico < 150.0 and not parcela["drenaje_eficiente"]:
            capilaridad = (150.0 - freatico) * 0.022 * evap_fact
            
        lavado = 0.0
        if riego > 45.0:
            lavado = ultima["conductividad_20cm"] * 0.32
        elif riego > 15.0:
            lavado = ultima["conductividad_20cm"] * 0.09
            
        corrector_reduc = 0.0
        if corrector == "yeso":
            corrector_reduc = 1.6
        elif corrector == "organico":
            corrector_reduc = 0.75
            
        sal_20_nueva = ultima["conductividad_20cm"] + capilaridad - lavado - corrector_reduc
        sal_20_nueva = max(round(sal_20_nueva, 2), 0.5)

        sal_40_nueva = ultima["conductividad_40cm"] + (lavado * 0.65) - (0.45 if corrector == "yeso" else 0.0)
        sal_40_nueva = max(round(sal_40_nueva, 2), 0.5)

        dz = 0.20
        dt = 86400.0
        K_sat = 1e-5
        K_theta = K_sat * ((hum_20_nueva / 100.0) ** 3)
        psi_diff = ((hum_20_nueva - hum_40_nueva) / 100.0) * 10.0
        q = -K_theta * ((psi_diff / dz) + 1.0)
        
        dtheta_dt = ((hum_20_nueva - ultima["humedad_20cm"]) / 100.0) / dt
        residuo_agua = float(dtheta_dt - (-K_theta * ((psi_diff / dz) + 1.0) / dz))
        
        mass_change_dt = (((hum_20_nueva/100.0) * sal_20_nueva) - ((ultima["humedad_20cm"]/100.0) * ultima["conductividad_20cm"])) / dt
        dispersive = (hum_20_nueva/100.0) * 1e-9 * ((sal_20_nueva - ultima["conductividad_20cm"]) / dz)
        advective = q * sal_20_nueva
        residuo_sales = float(mass_change_dt - ((dispersive - advective) / dz))

        umbral = parcela["umbral_ec_crop"]
        riesgo = "BAJO"
        if sal_20_nueva > umbral * 1.4: riesgo = "CRÍTICO"
        elif sal_20_nueva > umbral * 1.1: riesgo = "ALTO"
        elif sal_20_nueva > umbral: riesgo = "MODERADO"
            
        if freatico < 85.0 and riesgo in ("BAJO", "MODERADO"): riesgo = "ALTO"

        lr = 0.0
        if sal_20_nueva > umbral:
            lr = 1.2 / ((5 * sal_20_nueva) - 1.2)
            lr = min(max(lr, 0.0), 0.35)
        riego_prescrito = int((5.0 * (1.0 + lr)) * 10)
        if hum_20_nueva < 15.0: riego_prescrito += 100

        yeso = 0.0
        if sal_20_nueva > 4.5 and not parcela["drenaje_eficiente"]:
            yeso = round((sal_20_nueva - 3.0) * 0.45 * 1.35 * (parcela["profundidad_raiz"] / 10.0), 2)
            yeso = min(yeso, 8.5)

        rotacion = sal_20_nueva > umbral * 1.8
        cultivo_sug = None
        if rotacion:
            cultivo_sug = "Quinua (Altamente Tolerante)" if sal_20_nueva > 7.0 else "Espárrago Verde (Tolerante)"

        accion_quimica = "Suelo balanceado. Riego volumétrico regular."
        if yeso > 0:
            accion_quimica = f"Aplicar {yeso} ton/ha de Yeso Agrícola de inmediato."
        elif sal_20_nueva > umbral:
            accion_quimica = "Aplicar corrector orgánico y lavado lixiviante."

        resultado = {
            "parcel_id": pid_int,
            "variables_actualizadas": {
                "humedad_20cm": round(hum_20_nueva, 2),
                "humedad_40cm": round(hum_40_nueva, 2),
                "conductividad_20cm": round(sal_20_nueva, 2),
                "conductividad_40cm": round(sal_40_nueva, 2),
                "nivel_freatico_cm": freatico,
                "riego_aplicado_mm": riego
            },
            "pinn_residuals": {
                "richards": abs(residuo_agua),
                "soluto": abs(residuo_sales)
            },
            "prescription": {
                "salinidad_ds_m": round(sal_20_nueva, 2),
                "nivel_riesgo": riesgo,
                "requerimiento_lavado_porcentaje": round(lr * 100.0, 1),
                "riego_prescrito_m3_ha": riego_prescrito,
                "yeso_agricola_ton_ha": yeso,
                "corrector_salinidad_aplicar": accion_quimica,
                "alerta_rotacion_cultivo": rotacion,
                "cultivo_sugerido_rotacion": cultivo_sug
            }
        }
        
        # Actualizar lecturas en memoria y guardarlas en disco
        sim_data["series_temporales"][str(pid_int)].append({
            "fecha": datetime.now().strftime("%Y-%m-%d"),
            "temperatura_suelo_20cm": 22.8,
            "humedad_20cm": round(hum_20_nueva, 2),
            "conductividad_20cm": round(sal_20_nueva, 2),
            "humedad_40cm": round(hum_40_nueva, 2),
            "conductividad_40cm": round(sal_40_nueva, 2),
            "humedad_60cm": round(hum_40_nueva - 2.0, 2),
            "conductividad_60cm": round(sal_40_nueva + 0.2, 2),
            "nivel_freatico_cm": freatico,
            "riego_aplicado_mm": riego,
            "lluvia_mm": 0.0,
            "satelite_disponible": False
        })
        
        presc_data["prescripciones"][str(pid_int)].append({
            "fecha": datetime.now().strftime("%Y-%m-%d"),
            "salinidad_actual_ds_m": round(sal_20_nueva, 2),
            "humedad_actual_porcentaje": round(hum_20_nueva, 2),
            "nivel_freático_cm": freatico,
            "nivel_riesgo": riesgo,
            "pinn_residuo_richards": abs(residuo_agua),
            "pinn_residuo_soluto": abs(residuo_sales),
            "requerimiento_lavado_porcentaje": round(lr * 100.0, 1),
            "riego_prescrito_m3_ha": riego_prescrito,
            "yeso_agricola_ton_ha": yeso,
            "corrector_salinidad_aplicar": accion_quimica,
            "alerta_rotacion_cultivo": rotacion,
            "cultivo_sugerido_rotacion": cultivo_sug
        })
        
        with open(DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(sim_data, f, indent=2, ensure_ascii=False)
        with open(PRESCRIPTIONS_PATH, "w", encoding="utf-8") as f:
            json.dump(presc_data, f, indent=2, ensure_ascii=False)
            
        self.send_json_response(200, resultado)

    def handle_add_parcel(self, params):
        codigo = params.get("codigo")
        cultivo = params.get("cultivo")
        area_ha = float(params.get("area_ha", 4.0))
        lat = float(params.get("lat"))
        lng = float(params.get("lng"))
        coords = params.get("coords")

        if not codigo or not cultivo or not lat or not lng or not coords:
            self.send_error_response(400, "Faltan campos obligatorios para registrar la parcela catastral.")
            return

        # En modo base de datos
        if db_client and db_client.ensure_connected():
            try:
                # Buscar o insertar cultivo
                crop_row = db_client.fetchone("SELECT id FROM cultivos WHERE nombre = %s;", (cultivo,))
                if crop_row:
                    crop_id = crop_row["id"]
                else:
                    umbral_ec = 3.0
                    prof_raiz = 40
                    if "caña" in cultivo.lower():
                        umbral_ec = 1.7
                        prof_raiz = 60
                    elif "espárrago" in cultivo.lower():
                        umbral_ec = 4.1
                        prof_raiz = 60
                    elif "quinua" in cultivo.lower():
                        umbral_ec = 8.0
                        prof_raiz = 30
                    elif "algodón" in cultivo.lower():
                        umbral_ec = 7.7
                        prof_raiz = 50
                    
                    new_crop = db_client.fetchone(
                        "INSERT INTO cultivos (nombre, tolerancia_ec_max, pendiente_perdida_rendimiento, profundidad_radicular_efectiva, demanda_hidrica_optima_m3_ha) VALUES (%s, %s, %s, %s, %s) RETURNING id;",
                        (cultivo, umbral_ec, 8.0, prof_raiz, 8000)
                    )
                    crop_id = new_crop["id"] if new_crop else None

                # Insertar parcela
                wkt_geom = coords_to_wkt_polygon(coords)
                new_parcel_row = db_client.fetchone(
                    "INSERT INTO parcelas_agricolas (codigo_catastral, propietario, area_hectareas, tipo_suelo, cultivo_id, geom) VALUES (%s, %s, %s, %s, %s, ST_GeomFromText(%s, 4326)) RETURNING id;",
                    (codigo, "Propietario Catastral - Sat-Agro", area_ha, "Franco-Limoso (Monitoreado)", crop_id, wkt_geom)
                )
                
                if not new_parcel_row:
                    self.send_error_response(500, "Error al registrar la parcela en la base de datos.")
                    return
                
                new_uuid = new_parcel_row["id"]
                
                # Simular e insertar 30 días iniciales
                dias_simulados = 30
                base_date = datetime.now() - timedelta(days=dias_simulados)
                
                hum_inicial = 26.0
                drenaje = "caña" in cultivo.lower() or "espárrago" in cultivo.lower() or "algodón" in cultivo.lower()
                sal_inicial = 2.2 if drenaje else 4.0
                freatico_inicial = 230.0
                umbral_ec = 3.0
                if "caña" in cultivo.lower(): umbral_ec = 1.7
                elif "espárrago" in cultivo.lower(): umbral_ec = 4.1
                elif "quinua" in cultivo.lower(): umbral_ec = 8.0
                elif "algodón" in cultivo.lower(): umbral_ec = 7.7
                prof_raiz = 60 if drenaje else 40
                
                # Desactivar autocommit para agrupar todas las inserciones en una única transacción rápida
                db_client.conn.autocommit = False
                try:
                    for d in range(dias_simulados):
                        current_date = base_date + timedelta(days=d)
                        riego_val = 70.0 if (d % 10 == 0 and ("arroz" in cultivo.lower() or "caña" in cultivo.lower())) else (15.0 if (d % 3 == 0 and not ("arroz" in cultivo.lower() or "caña" in cultivo.lower())) else 0.0)
                        
                        hum = max(min(hum_inicial + (riego_val * 0.3) - 3.0 + (d % 3)*0.5, 41.0), 9.0)
                        freatico = max(min(freatico_inicial - (riego_val * 1.1) + 4.0 if not drenaje else freatico_inicial + 1.0, 300.0), 50.0)
                        capilaridad = (150.0 - freatico) * 0.015 if (freatico < 150.0 and not drenaje) else 0.0
                        lavado = riego_val * 0.15
                        sal = max(min(sal_inicial + capilaridad - lavado + (d % 5)*0.08, 15.0), 0.5)

                        is_sat = d % 5 == 0
                        ndvi = min(0.999, max(0.0, umbral_ec / sal * 0.75)) if is_sat else None
                        ndwi = min(0.999, max(-0.999, 0.18 + hum/100.0)) if is_sat else None
                        sal_idx = min(0.999, max(0.0, 0.08 + (sal/22.0) * (1.2 - (ndvi or 0.5)))) if is_sat else None
                        cobertura = (sal - 3.5)*8.0 if (is_sat and sal > 3.5) else 0.0
                        
                        db_client.execute(
                            """INSERT INTO telemetria_iot (
                                parcela_id, humedad_volumetrica_pct, salinidad_ce_ds_m, temperatura_c,
                                vigor_ndvi, estres_ndwi, fecha_medicion,
                                humedad_40cm, conductividad_40cm, humedad_60cm, conductividad_60cm,
                                nivel_freatico_cm, riego_aplicado_mm, lluvia_mm, salinity_index, cobertura_salina_porcentaje
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);""",
                            (
                                new_uuid,
                                round(hum, 2),
                                round(sal, 2),
                                22.8,
                                ndvi,
                                ndwi,
                                current_date,
                                round(hum - 2.0, 2),
                                round(sal - 0.2, 2),
                                round(hum - 4.0, 2),
                                round(sal - 0.4, 2),
                                round(freatico, 1),
                                riego_val,
                                0.0,
                                sal_idx,
                                round(cobertura, 1)
                            )
                        )
                        
                        riesgo = "BAJO"
                        if sal > umbral_ec * 1.4: riesgo = "CRÍTICO"
                        elif sal > umbral_ec * 1.1: riesgo = "ALTO"
                        elif sal > umbral_ec: riesgo = "MODERADO"
                        if freatico < 85.0 and riesgo in ("BAJO", "MODERADO"): riesgo = "ALTO"

                        lr = 0.0
                        if sal > umbral_ec:
                            lr = 1.2 / ((5 * sal) - 1.2)
                            lr = min(max(lr, 0.0), 0.35)

                        riego_prescrito = int((5.0 * (1.0 + lr)) * 10)
                        if hum < 15.0: riego_prescrito += 100

                        yeso = 0.0
                        if sal > 4.5 and not drenaje:
                            yeso = round((sal - 3.0) * 0.45 * 1.35 * (prof_raiz / 10.0), 2)
                            yeso = min(yeso, 8.5)

                        rot = sal > umbral_ec * 1.8
                        sug_rot = "Quinua (Altamente Tolerante)" if sal > 7.0 else "Espárrago Verde (Tolerante)" if rot else None

                        accion = "Suelo balanceado. Mantener riego."
                        if yeso > 0:
                            accion = f"Aplicar {yeso} ton/ha de Yeso Agrícola."
                        elif sal > umbral_ec:
                            accion = "Lixiviar sales acumuladas mediante lavado."
                            
                        db_client.execute(
                            """INSERT INTO prescripciones (
                                parcela_id, fecha_prescripcion, salinidad_actual_ds_m, humedad_actual_porcentaje,
                                nivel_riesgo, riego_prescrito_m3_ha, requerimiento_lavado_porcentaje,
                                yeso_agricola_ton_ha, corrector_salinidad_aplicar, alerta_rotacion_cultivo, cultivo_sugerido_rotacion
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);""",
                            (
                                new_uuid,
                                current_date,
                                round(sal, 2),
                                round(hum, 2),
                                riesgo,
                                riego_prescrito,
                                round(lr * 100.0, 1),
                                yeso,
                                accion,
                                rot,
                                sug_rot
                            )
                        )
                    
                    db_client.conn.commit()
                except Exception as db_err:
                    db_client.conn.rollback()
                    raise db_err
                finally:
                    db_client.conn.autocommit = True
                
                response_parcel = {
                    "id": new_uuid,
                    "codigo": codigo,
                    "propietario": "Propietario Catastral - Sat-Agro",
                    "cultivo": cultivo,
                    "area_ha": area_ha,
                    "suelo_tipo": "Franco-Limoso (Monitoreado)",
                    "lat": lat,
                    "lng": lng,
                    "drenaje_eficiente": drenaje,
                    "riego_por_inundacion": "arroz" in cultivo.lower() or "caña" in cultivo.lower(),
                    "umbral_ec_crop": umbral_ec,
                    "profundidad_raiz": prof_raiz,
                    "coords": coords
                }
                self.send_json_response(201, response_parcel)
                return
            except Exception as e:
                print(f"[DB ERROR] Error al registrar parcela en Supabase: {e}")
                self.send_error_response(500, f"Error de base de datos al registrar parcela: {str(e)}")
                return

        # Fallback local de archivos JSON
        if not os.path.exists(DATA_PATH) or not os.path.exists(PRESCRIPTIONS_PATH):
            self.send_error_response(400, "Los archivos de datos no han sido simulados.")
            return

        with open(DATA_PATH, "r", encoding="utf-8") as f:
            sim_data = json.load(f)
        with open(PRESCRIPTIONS_PATH, "r", encoding="utf-8") as f:
            presc_data = json.load(f)

        nuevo_id = max(p["id"] for p in sim_data["parcelas"]) + 1
        
        umbral_ec = 3.0
        prof_raiz = 40
        drenaje = False
        
        if "caña" in cultivo.lower():
            umbral_ec = 1.7
            prof_raiz = 60
            drenaje = True
        elif "espárrago" in cultivo.lower():
            umbral_ec = 4.1
            prof_raiz = 60
            drenaje = True
        elif "quinua" in cultivo.lower():
            umbral_ec = 8.0
            prof_raiz = 30
            drenaje = False

        nueva_parcela = {
            "id": nuevo_id,
            "codigo": codigo,
            "propietario": "Propietario Catastral - Sat-Agro",
            "cultivo": cultivo,
            "area_ha": area_ha,
            "suelo_tipo": "Franco-Limoso (Monitoreado)",
            "lat": lat,
            "lng": lng,
            "drenaje_eficiente": drenaje,
            "riego_por_inundacion": "arroz" in cultivo.lower() or "caña" in cultivo.lower(),
            "umbral_ec_crop": umbral_ec,
            "profundidad_raiz": prof_raiz,
            "coords": coords
        }

        sim_data["parcelas"].append(nueva_parcela)

        dias_simulados = sim_data["metadata"]["total_dias"]
        base_date = datetime.now() - timedelta(days=dias_simulados)
        lecturas_nueva = []

        hum_inicial = 26.0
        sal_inicial = 2.2 if drenaje else 4.0
        freatico_inicial = 230.0

        for d in range(dias_simulados):
            current_date = base_date + timedelta(days=d)
            date_str = current_date.strftime("%Y-%m-%d")
            
            riego = 70.0 if (d % 10 == 0 and nueva_parcela["riego_por_inundacion"]) else (15.0 if (d % 3 == 0 and not nueva_parcela["riego_por_inundacion"]) else 0.0)
            
            hum = max(min(hum_inicial + (riego * 0.3) - 3.0 + (d % 3)*0.5, 41.0), 9.0)
            freatico = max(min(freatico_inicial - (riego * 1.1) + 4.0 if not drenaje else freatico_inicial + 1.0, 300.0), 50.0)
            capilaridad = (150.0 - freatico) * 0.015 if (freatico < 150.0 and not drenaje) else 0.0
            lavado = riego * 0.15
            sal = max(min(sal_inicial + capilaridad - lavado + (d % 5)*0.08, 15.0), 0.5)

            is_sat = d % 5 == 0
            ndvi = max(0.2, umbral_ec / sal * 0.75) if is_sat else None

            lecturas_nueva.append({
                "fecha": date_str,
                "temperatura_suelo_20cm": 22.8,
                "humedad_20cm": round(hum, 2),
                "conductividad_20cm": round(sal, 2),
                "humedad_40cm": round(hum - 2.0, 2),
                "conductividad_40cm": round(sal - 0.2, 2),
                "humedad_60cm": round(hum - 4.0, 2),
                "conductividad_60cm": round(sal - 0.4, 2),
                "nivel_freatico_cm": round(freatico, 1),
                "riego_aplicado_mm": riego,
                "lluvia_mm": 0.0,
                "satelite_disponible": is_sat,
                "ndvi": round(ndvi, 3) if is_sat else None,
                "ndwi": round(0.18 + hum/100.0, 3) if is_sat else None,
                "salinity_index": round(0.08 + (sal/22.0) * (1.2 - (ndvi or 0.5)), 3) if is_sat else None,
                "cobertura_salina_porcentaje": round((sal - 3.5)*8.0, 1) if (is_sat and sal > 3.5) else 0.0
            })

        sim_data["series_temporales"][str(nuevo_id)] = lecturas_nueva

        prescripciones_nueva = []
        for l in lecturas_nueva:
            sal = l["conductividad_20cm"]
            hum = l["humedad_20cm"]
            freatico = l["nivel_freatico_cm"]
            
            riesgo = "BAJO"
            if sal > umbral_ec * 1.4: riesgo = "CRÍTICO"
            elif sal > umbral_ec * 1.1: riesgo = "ALTO"
            elif sal > umbral_ec: riesgo = "MODERADO"
            
            if freatico < 85.0 and riesgo in ("BAJO", "MODERADO"): riesgo = "ALTO"

            lr = 0.0
            if sal > umbral_ec:
                lr = 1.2 / ((5 * sal) - 1.2)
                lr = min(max(lr, 0.0), 0.35)

            riego_prescrito = int((5.0 * (1.0 + lr)) * 10)
            if hum < 15.0: riego_prescrito += 100

            yeso = 0.0
            if sal > 4.5 and not drenaje:
                yeso = round((sal - 3.0) * 0.45 * 1.35 * (prof_raiz / 10.0), 2)
                yeso = min(yeso, 8.5)

            rot = sal > umbral_ec * 1.8
            sug_rot = "Quinua (Altamente Tolerante)" if sal > 7.0 else "Espárrago Verde (Tolerante)" if rot else None

            accion = "Suelo balanceado. Mantener riego."
            if yeso > 0:
                accion = f"Aplicar {yeso} ton/ha de Yeso Agrícola."
            elif sal > umbral_ec:
                accion = "Lixiviar sales acumuladas mediante lavado."

            prescripciones_nueva.append({
                "fecha": l["fecha"],
                "salinidad_actual_ds_m": sal,
                "humedad_actual_porcentaje": hum,
                "nivel_freático_cm": freatico,
                "nivel_riesgo": riesgo,
                "pinn_residuo_richards": 0.00000185,
                "pinn_residuo_soluto": 0.00000092,
                "requerimiento_lavado_porcentaje": round(lr * 100.0, 1),
                "riego_prescrito_m3_ha": riego_prescrito,
                "yeso_agricola_ton_ha": yeso,
                "corrector_salinidad_aplicar": accion,
                "alerta_rotacion_cultivo": rot,
                "cultivo_sugerido_rotacion": sug_rot
            })

        presc_data["prescripciones"][str(nuevo_id)] = prescripciones_nueva

        with open(DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(sim_data, f, indent=2, ensure_ascii=False)
        with open(PRESCRIPTIONS_PATH, "w", encoding="utf-8") as f:
            json.dump(presc_data, f, indent=2, ensure_ascii=False)

        print(f"¡Nueva parcela catastral {codigo} registrada dinámicamente en caliente!")
        self.send_json_response(201, nueva_parcela)

def run_server():
    server_address = ('', PORT)
    # Configurar socket reusable para evitar el error 'Address already in use'
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(server_address, SatAgroAPIHandler) as httpd:
            print(f"===========================================================")
            print(f"SERVIDOR BACKEND ACTIVO - SAT-AGRO (GEO-TON PERU)")
            print(f"Servidor web local disponible en: http://localhost:{PORT}")
            print(f"Sirviendo archivos desde: {DIRECTORY}")
            print(f"===========================================================")
            print(f"Presiona CTRL+C para detener el servidor local de APIs.")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido por el usuario. Cierre exitoso.")
        sys.exit(0)
    except Exception as e:
        print(f"Error al arrancar el servidor: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    run_server()
