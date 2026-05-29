#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
🌌 GeoTERRA - Replicador de Recolección de Datos de GEO Perú
Este script ejemplifica cómo consumir de manera automática y programática
los datasets espaciales a través de los servidores WFS (Web Feature Service)
oficiales de las instituciones públicas de Perú (MIDAGRI, MTC, CENEPRED).
"""

import os
import requests
import json

# ==============================================================================
# 🌐 CONFIGURACIÓN DE ENDPOINTS WFS OFICIALES (GEOSERVERS ESTATALES)
# ==============================================================================
ENDPOINTS = {
    # 🌿 MIDAGRI: Límites de Predios Rurales / Catastro
    "MIDAGRI_CATASTRO": {
        "url": "http://siea.midagri.gob.pe/geoserver/wfs",
        "typename": "midagri:predios_rurales_chancay", # Nombre de capa ejemplo
    },
    # 🚗 MTC: Red Vial Nacional, Departamental y Vecinal
    "MTC_RED_VIAL": {
        "url": "https://gis.mtc.gob.pe/geoserver/wfs",
        "typename": "mtc:red_vial_nacional",
    },
    # ⚠️ CENEPRED: Áreas de susceptibilidad a movimientos en masa e inundaciones
    "CENEPRED_RIESGOS": {
        "url": "https://sigrid.cenepred.gob.pe/sigridv3/geoserver/wfs",
        "typename": "cenepred:susceptibilidad_movimientos_masa",
    }
}

# Bounding box de ejemplo (Valle Chancay-Lambayeque en EPSG:4326)
# Formato: [Min Longitude, Min Latitude, Max Longitude, Max Latitude]
BBOX_CHANCAY = "-80.1, -6.8, -79.4, -6.3"

def descargar_capa_wfs(nombre_servicio, output_file, bbox=None):
    """
    Realiza una petición WFS HTTP GET para descargar datos en formato GeoJSON.
    
    Parámetros:
    - nombre_servicio: Clave del endpoint en el diccionario ENDPOINTS.
    - output_file: Ruta donde se guardará el GeoJSON resultante.
    - bbox: Bounding box de filtrado espacial (opcional).
    """
    config = ENDPOINTS.get(nombre_servicio)
    if not config:
        print(f"❌ Servicio '{nombre_servicio}' no configurado.")
        return False
        
    print(f"\n📡 Conectando al Geoserver de {nombre_servicio}...")
    print(f"🔗 URL Base: {config['url']}")
    print(f"📦 Capa (TypeName): {config['typename']}")

    # Parámetros estandarizados de OGC WFS para retornar GeoJSON
    params = {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typeName": config["typename"],
        "outputFormat": "application/json", # Solicita GeoJSON nativo
        "srsName": "EPSG:4326"               # Pide reproyección a WGS84
    }
    
    # Aplicar filtro por Bounding Box si se proporciona
    if bbox:
        params["bbox"] = f"{bbox},EPSG:4326"
        print(f"📍 Aplicando Filtro de Área (BBOX): {bbox}")
        
    try:
        # Realizamos la petición HTTP GET al servidor estatal
        response = requests.get(config["url"], params=params, timeout=30)
        
        # Validamos respuesta exitosa
        if response.status_code == 200:
            data = response.json()
            
            # Verificamos si contiene elementos
            features = data.get("features", [])
            print(f"✅ Descarga completada. Elementos recibidos: {len(features)}")
            
            # Guardamos el archivo GeoJSON localmente
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"💾 Guardado exitosamente en: {output_file}")
            return True
        else:
            print(f"⚠️ Error de Servidor. Código HTTP: {response.status_code}")
            print(f"📄 Respuesta cruda: {response.text[:200]}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Error: Tiempo de espera agotado (El Geoserver estatal tardó demasiado en responder).")
        return False
    except json.JSONDecodeError:
        print("❌ Error: La respuesta no es un JSON válido. El servidor podría estar retornando un archivo XML de error.")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")
        return False

# ==============================================================================
# 🚀 EJECUCIÓN DEL FLUJO DE EJEMPLO
# ==============================================================================
if __name__ == "__main__":
    # Creamos carpeta de descargas si no existe
    output_dir = os.path.join(os.path.dirname(__file__), "descargas_geoperu")
    os.makedirs(output_dir, exist_ok=True)
    
    print("======================================================================")
    print("🌍 INICIANDO DEMOSTRACIÓN DE EXTRACCIÓN PROGRAMÁTICA (WFS) DE GEO PERÚ")
    print("======================================================================")
    
    # 1. Ejemplo de descarga de Riesgos (CENEPRED) filtrando por Chancay
    geojson_riesgos = os.path.join(output_dir, "susceptibilidad_huaicos_chancay.geojson")
    descargar_capa_wfs("CENEPRED_RIESGOS", geojson_riesgos, bbox=BBOX_CHANCAY)
    
    # Nota: Este script sirve para replicar la ingesta en caliente. Para el MVP actual,
    # debido a la volatilidad de los Geoservers del estado peruano (caídas de línea), 
    # se almacena una copia estática e integrada de estos datos en:
    # 'c:/Users/bryan/GeoData Perú/SATagro/data/simulated_data.json'
    
    print("\n💡 Tip de Réplica: Los archivos resultantes se cargan a PostgreSQL")
    print("   con 'ogr2ogr' o usando un script psycopg2 que inserte cada 'feature' en las tablas.")
    print("======================================================================")
