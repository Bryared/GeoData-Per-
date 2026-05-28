# Sat-Agro: Soil IoT and Sentinel-2 Physical Simulator
# Generador de datos con base biofísica para simular dinámicas de salinización en valles agrícolas costeros (Enfoque Chancay-Lambayeque)

import json
import math
import random
import os
from datetime import datetime, timedelta

def simulate_valley_data(days=90):
    print(f"Iniciando simulación física de Sat-Agro para los últimos {days} días...")
    
    # Configuración de Parcelas (Simulamos 4 parcelas con diferentes cultivos y condiciones físicas)
    parcelas = [
        {
            "id": 1,
            "codigo": "P-CH-LMB-101",
            "propietario": "Asociación Agropecuaria Vista Alegre",
            "cultivo": "Arroz (Variedad Capirona)",
            "area_ha": 4.5,
            "suelo_tipo": "Franco-Arcilloso (Mal Drenaje)",
            "lat": -6.6452,
            "lng": -79.8821,
            "drenaje_eficiente": False, # Crítico en Lambayeque
            "riego_por_inundacion": True,
            "umbral_ec_crop": 3.0, # Tolerancia arroz: 3.0 dS/m
            "profundidad_raiz": 40
        },
        {
            "id": 2,
            "codigo": "P-CH-LMB-102",
            "propietario": "Fundo San Juan",
            "cultivo": "Caña de Azúcar",
            "area_ha": 12.0,
            "suelo_tipo": "Franco (Drenaje Moderado)",
            "lat": -6.6481,
            "lng": -79.8790,
            "drenaje_eficiente": True,
            "riego_por_inundacion": True,
            "umbral_ec_crop": 1.7, # Tolerancia caña: 1.7 dS/m
            "profundidad_raiz": 60
        },
        {
            "id": 3,
            "codigo": "P-CH-LMB-103",
            "propietario": "Agrícola Lambayeque S.A.",
            "cultivo": "Espárrago Verde",
            "area_ha": 8.2,
            "suelo_tipo": "Arenoso (Buen Drenaje)",
            "lat": -6.6415,
            "lng": -79.8864,
            "drenaje_eficiente": True,
            "riego_por_inundacion": False, # Riego por goteo
            "umbral_ec_crop": 4.1, # Alta tolerancia: 4.1 dS/m
            "profundidad_raiz": 60
        },
        {
            "id": 4,
            "codigo": "P-CH-LMB-104",
            "propietario": "Cooperativa Agraria Túcume",
            "cultivo": "Quinua (Variedad INIA Salcedo)",
            "area_ha": 3.8,
            "suelo_tipo": "Franco-Limoso (Drenaje Deficiente)",
            "lat": -6.6505,
            "lng": -79.8845,
            "drenaje_eficiente": False,
            "riego_por_inundacion": False, # Riego por gravedad controlado
            "umbral_ec_crop": 8.0, # Halófita moderada: 8.0 dS/m
            "profundidad_raiz": 30
        }
    ]

    base_date = datetime.now() - timedelta(days=days)
    historical_data = {p["id"]: [] for p in parcelas}
    satellite_passes = []

    # Generar lecturas diarias del suelo e índices satelitales
    for d in range(days):
        current_date = base_date + timedelta(days=d)
        date_str = current_date.strftime("%Y-%m-%d")
        
        # Simulación climática básica (Costa Norte de Perú: cálido, muy seco, alta evaporación)
        temp_ambiente = 24.0 + 5.0 * math.sin(2 * math.pi * d / 365.0) + random.uniform(-1.5, 1.5)
        evaporacion_potencial = 4.5 + 1.5 * math.sin(2 * math.pi * d / 365.0) + random.uniform(-0.5, 0.5) # mm/día
        
        # Lluvia ocasional (muy rara en costa norte salvo El Niño)
        lluvia = 0.0
        if random.random() < 0.02: # 2% probabilidad
            lluvia = random.uniform(5.0, 20.0)

        # ¿Hay paso de satélite Sentinel-2? (Cada 5 días)
        is_satellite_day = (d % 5 == 0)
        cloud_cover = random.uniform(0.0, 45.0) if random.random() < 0.15 else random.uniform(0.0, 5.0) # Mayormente despejado
        
        for p in parcelas:
            # Determinamos si el agricultor realiza un riego hoy
            # El riego por inundación en arroz es masivo (cada 12-15 días si no es permanente)
            # El riego por goteo en espárrago es frecuente (cada 2-3 días)
            riego_hoy = False
            riego_volumen_mm = 0.0
            
            if p["riego_por_inundacion"]:
                if p["id"] == 1: # Arroz inundado
                    # El arroz mantiene una lámina de agua casi permanente
                    riego_hoy = (d % 10 == 0)
                    riego_volumen_mm = 80.0 if riego_hoy else 0.0
                else: # Caña
                    riego_hoy = (d % 18 == 0)
                    riego_volumen_mm = 120.0 if riego_hoy else 0.0
            else:
                if p["id"] == 3: # Espárrago goteo
                    riego_hoy = (d % 3 == 0)
                    riego_volumen_mm = 15.0 if riego_hoy else 0.0
                else: # Quinua
                    riego_hoy = (d % 8 == 0)
                    riego_volumen_mm = 30.0 if riego_hoy else 0.0

            # --- MODELO FÍSICO DE AGUA EN EL SUELO ---
            # La humedad disminuye por evapotranspiración (ET) y aumenta por riego/lluvia.
            # En parcelas sin drenaje, el nivel freático asciende drásticamente tras riego por inundación.
            
            # Recuperar lectura anterior para continuidad temporal
            if len(historical_data[p["id"]]) > 0:
                prev = historical_data[p["id"]][-1]
                prev_hum_20 = prev["humedad_20cm"]
                prev_hum_40 = prev["humedad_40cm"]
                prev_hum_60 = prev["humedad_60cm"]
                prev_sal_20 = prev["conductividad_20cm"]
                prev_sal_40 = prev["conductividad_40cm"]
                prev_sal_60 = prev["conductividad_60cm"]
                prev_freatico = prev["nivel_freatico_cm"]
            else:
                # Valores iniciales (Día 0)
                prev_hum_20 = 25.0
                prev_hum_40 = 28.0
                prev_hum_60 = 30.0
                prev_sal_20 = 2.0 if p["drenaje_eficiente"] else 4.5
                prev_sal_40 = 2.2 if p["drenaje_eficiente"] else 5.0
                prev_sal_60 = 2.5 if p["drenaje_eficiente"] else 5.5
                prev_freatico = 250.0 # 2.5 metros de profundidad

            # Dinámica de Humedad (Ecuación simplificada de conservación de masa de agua)
            ingreso_agua = riego_volumen_mm + lluvia
            et_cultivo = evaporacion_potencial * (0.85 if p["id"] == 1 else 0.65) # Kc simplificado
            
            # Dinámica en capa 20cm (reacción rápida al clima y riego)
            hum_20 = prev_hum_20 + (ingreso_agua * 0.6) - (et_cultivo * 0.7) - random.uniform(0.5, 1.5)
            # Capa 40cm
            hum_40 = prev_hum_40 + (ingreso_agua * 0.3) - (et_cultivo * 0.25) + (prev_hum_20 - prev_hum_40) * 0.05
            # Capa 60cm
            hum_60 = prev_hum_60 + (ingreso_agua * 0.1) - (et_cultivo * 0.05) + (prev_hum_40 - prev_hum_60) * 0.05

            # Restricciones físicas
            sat_point = 45.0 # Punto de saturación arcilla/limo
            wilting_point = 8.0 # Punto de marchitez permanente
            
            hum_20 = max(min(hum_20, sat_point), wilting_point)
            hum_40 = max(min(hum_40, sat_point), wilting_point)
            hum_60 = max(min(hum_60, sat_point), wilting_point)

            # Dinámica del Nivel Freático (Crítico para Lambayeque)
            # Si se riega por inundación y no hay drenaje, el agua subterránea sube rápido.
            # Si hay drenaje eficiente, se mantiene profundo.
            if p["riego_por_inundacion"] and not p["drenaje_eficiente"]:
                # Sube por la recarga excesiva sin salida
                freatico = prev_freatico - (riego_volumen_mm * 1.5) + random.uniform(2.0, 5.0) # Subir = menor distancia a la superficie
            else:
                # Drenaje o goteo mantiene el nivel freático profundo o estable
                freatico = prev_freatico + random.uniform(-1.0, 3.0) # Tiende a estabilizarse o bajar
            
            freatico = max(min(freatico, 350.0), 30.0) # Límite: mínimo 30 cm de la superficie (encharcamiento subterráneo), máx 3.5m

            # --- MODELO FÍSICO DE SALINIDAD (Ascenso Capilar y Acumulación) ---
            # Si el nivel freático está alto (< 150 cm) y el drenaje es deficiente, la evaporación jala agua salina del acuífero
            # hacia arriba, aumentando la salinidad en los 20cm superiores.
            # Si hay un riego fuerte (inundación), ocurre un lavado temporal de sales (dilución y lixiviación hacia capas inferiores).
            
            capilaridad_sales = 0.0
            if freatico < 150.0 and not p["drenaje_eficiente"]:
                # Tasa de evaporación jala sales. A menor profundidad freática, mayor transporte.
                capilaridad_sales = (150.0 - freatico) * 0.015 * (temp_ambiente / 25.0)

            # Lavado por riego (Lixiviación)
            lixiviacion_sales_20 = 0.0
            lixiviacion_sales_40 = 0.0
            if riego_volumen_mm > 40.0:
                # Un riego masivo empuja las sales de 20cm a 40cm y de 40cm a 60cm
                lixiviacion_sales_20 = prev_sal_20 * 0.25 * (riego_volumen_mm / 100.0)
                lixiviacion_sales_40 = prev_sal_40 * 0.15 * (riego_volumen_mm / 100.0)

            # Ecuaciones de balance de salinidad (dS/m)
            sal_20 = prev_sal_20 + capilaridad_sales - lixiviacion_sales_20 + random.uniform(-0.1, 0.15)
            sal_40 = prev_sal_40 + (lixiviacion_sales_20 * 0.7) - lixiviacion_sales_40 + random.uniform(-0.05, 0.05)
            sal_60 = prev_sal_60 + (lixiviacion_sales_40 * 0.8) - (0.1 if p["drenaje_eficiente"] else 0.0) + random.uniform(-0.05, 0.05)

            # Límites físicos lógicos
            sal_20 = max(min(sal_20, 20.0), 0.5)
            sal_40 = max(min(sal_40, 18.0), 0.5)
            sal_60 = max(min(sal_60, 15.0), 0.5)

            # --- MODELADO SATELLITAL SENTINEL-2 (Índices Multiespectrales) ---
            # NDVI disminuye si la salinidad (sal_20) es muy alta (estrés salino) o si hay estrés hídrico (hum_20 < 12%).
            # NDWI se correlaciona directamente con la humedad foliar e indirectamente con la humedad del suelo.
            # SI (Salinity Index) aumenta fuertemente en suelos desnudos altamente salinizados (sal_20 > 6.0) y NDVI bajo.
            

            # Estado del cultivo
            factor_salinidad = max(0.0, sal_20 - p["umbral_ec_crop"])
            pendiente = 12.0
            if "Caña" in p["cultivo"]:
                pendiente = 5.9
            elif "Espárrago" in p["cultivo"]:
                pendiente = 2.0
            elif "Quinua" in p["cultivo"]:
                pendiente = 1.5
            estres_salino = factor_salinidad * pendiente / 100.0
            
            estres_hidrico = 0.0
            if hum_20 < 15.0:
                estres_hidrico = (15.0 - hum_20) / 15.0

            # NDVI base teórico del cultivo sano en este momento del año
            ndvi_max = 0.82 if p["id"] == 1 else 0.78 # Arroz vs Caña
            if p["id"] == 3: ndvi_max = 0.75 # Espárrago
            if p["id"] == 4: ndvi_max = 0.70 # Quinua

            ndvi = ndvi_max * (1.0 - max(estres_salino * 0.7, estres_hidrico * 0.6))
            ndvi = max(min(ndvi, 0.9), 0.15) # Límite de vegetación viva vs suelo desnudo

            ndwi = 0.1 + 0.6 * (hum_20 / 45.0) - (estres_salino * 0.2)
            ndwi = max(min(ndwi, 0.8), -0.2)

            # Índice de salinidad en superficie (SI)
            # A mayor salinidad superficial (sal_20), mayor reflectancia de costras salinas
            si_base = 0.05 + (sal_20 / 25.0)
            # El SI es más visible si el NDVI es bajo (suelo descubierto o vegetación muerta)
            si = si_base * (1.2 - ndvi)
            si = max(min(si, 0.95), 0.02)

            # Cobertura salina visible (%)
            cobertura_salina = 0.0
            if sal_20 > 4.0:
                cobertura_salina = min(100.0, (sal_20 - 4.0) * 8.0 + random.uniform(-5.0, 5.0))
            cobertura_salina = max(cobertura_salina, 0.0)

            # Registrar lectura diaria
            lectura = {
                "fecha": date_str,
                "temperatura_suelo_20cm": round(temp_ambiente - 1.5 + random.uniform(-0.5, 0.5), 1),
                "humedad_20cm": round(hum_20, 2),
                "conductividad_20cm": round(sal_20, 2),
                "humedad_40cm": round(hum_40, 2),
                "conductividad_40cm": round(sal_40, 2),
                "humedad_60cm": round(hum_60, 2),
                "conductividad_60cm": round(sal_60, 2),
                "nivel_freatico_cm": round(freatico, 1),
                "riego_aplicado_mm": round(riego_volumen_mm, 1),
                "lluvia_mm": round(lluvia, 1),
                # Datos satelitales (solo se capturan en días de satélite y sin muchas nubes)
                "satelite_disponible": is_satellite_day and cloud_cover < 30.0,
                "ndvi": round(ndvi, 3) if (is_satellite_day and cloud_cover < 30.0) else None,
                "ndwi": round(ndwi, 3) if (is_satellite_day and cloud_cover < 30.0) else None,
                "salinity_index": round(si, 3) if (is_satellite_day and cloud_cover < 30.0) else None,
                "cobertura_salina_porcentaje": round(cobertura_salina, 1) if (is_satellite_day and cloud_cover < 30.0) else None
            }
            
            historical_data[p["id"]].append(lectura)

        # Si hoy pasó satélite y estuvo despejado, guardar escena general
        if is_satellite_day and cloud_cover < 30.0:
            satellite_passes.append({
                "fecha": date_str,
                "escena_tile": "T17MQT",
                "nubosidad": round(cloud_cover, 2)
            })

    # Guardar en archivo final JSON para el Dashboard
    final_output = {
        "metadata": {
            "valle": "Valle Chancay-Lambayeque",
            "departamento": "Lambayeque",
            "simulado_en": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_dias": days
        },
        "parcelas": parcelas,
        "satelite_escenas": satellite_passes,
        "series_temporales": historical_data
    }

    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(output_dir, "simulated_data.json")
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(final_output, f, indent=2, ensure_ascii=False)
        
    print(f"¡Simulación finalizada! Archivo generado con éxito en: {output_path}")
    print(f"Se han generado {days} lecturas para {len(parcelas)} parcelas agrícolas.")
    return output_path

if __name__ == "__main__":
    simulate_valley_data(90)
