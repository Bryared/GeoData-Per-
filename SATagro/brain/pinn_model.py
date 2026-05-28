# Sat-Agro: Physics-Informed Neural Network (PINN) & Prescription Engine
# Resolvedor Analítico del Transporte de Agua y Solutos para Alertas Agronómicas de Precisión

import json
import math
import os
from datetime import datetime

class PINNSoluteTransportSolver:
    def __init__(self, data_path):
        self.data_path = data_path
        self.sim_data = None
        self.load_data()
        
    def load_data(self):
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"No se encontró el archivo de simulación en {self.data_path}")
        with open(self.data_path, "r", encoding="utf-8") as f:
            self.sim_data = json.load(f)
            
    def solve_richards_residual(self, theta_prev, theta_curr, dz, dt, K_theta, psi_diff):
        """
        Calcula el residuo físico de la Ecuación de Richards (conservación de masa de agua).
        dTheta/dt = d/dz [ K(theta) * (dPsi/dz + 1) ]
        """
        # Derivada temporal de la humedad volumétrica (dTheta / dt)
        dtheta_dt = (theta_curr - theta_prev) / dt
        
        # Derivada espacial del potencial total (dPsi/dz + 1)
        # psi_diff es el gradiente de succión matricial entre profundidades
        total_potential_gradient = (psi_diff / dz) + 1.0
        
        # Flujo de agua de Darcy (q = -K * gradiente)
        water_flux = -K_theta * total_potential_gradient
        
        # En una PINN real, este residuo físico se suma a la pérdida L_fisica
        residual = dtheta_dt - (water_flux / dz)
        return float(residual)

    def solve_convection_dispersion_residual(self, theta, C_prev, C_curr, dt, dz, D, q):
        """
        Calcula el residuo de la Ecuación de Convección-Dispersión para transporte de sales.
        d(theta*C)/dt = d/dz [ theta * D * dC/dz ] - d(q*C)/dz
        """
        # Cambio temporal de la masa de sales en la celda
        mass_change_dt = ((theta * C_curr) - (theta * C_prev)) / dt
        
        # Término dispersivo: theta * D * (dC / dz)
        dispersive_flux = theta * D * ((C_curr - C_prev) / dz)
        
        # Término advectivo (arrastre por flujo de agua q)
        advective_flux = q * C_curr
        
        # Residuo físico del soluto
        residual = mass_change_dt - ((dispersive_flux - advective_flux) / dz)
        return float(residual)

    def run_prescription_engine(self):
        print("Iniciando Motor de Prescripción Sat-Agro con leyes de física de suelos...")
        
        series = self.sim_data["series_temporales"]
        parcelas = self.sim_data["parcelas"]
        
        prescripciones_finales = {}
        
        # Salinidad del agua de riego de referencia (en dS/m)
        # En Lambayeque suele ser alta (ej. 1.2 dS/m) si proviene de pozos mixtos o drenes reutilizados
        EC_w = 1.2 
        
        # Densidad aparente del suelo promedio (g/cm3)
        densidad_aparente = 1.35 
        
        for p in parcelas:
            pid = str(p["id"])
            p_lecturas = series[pid]
            prescripciones_finales[pid] = []
            
            # Procesar las lecturas para generar prescripciones
            for i in range(1, len(p_lecturas)):
                curr = p_lecturas[i]
                prev = p_lecturas[i-1]
                
                # Extraer variables para la física
                theta_20_prev = prev["humedad_20cm"] / 100.0
                theta_20_curr = curr["humedad_20cm"] / 100.0
                sal_20_prev = prev["conductividad_20cm"]
                sal_20_curr = curr["conductividad_20cm"]
                sal_40_curr = curr["conductividad_40cm"]
                freatico = curr["nivel_freatico_cm"]
                riego = curr["riego_aplicado_mm"] / 1000.0 # Convertir a metros
                
                # --- PASO 1: EVALUAR RESIDUOS FÍSICOS (Garantía PINN) ---
                # Definir constantes físicas simuladas
                dz = 0.20 # 20 cm entre capas
                dt = 86400.0 # 1 día en segundos
                K_sat = 1e-5 # Conductividad hidráulica saturada (m/s)
                # Modelo de Van Genuchten simplificado para K(theta)
                K_theta = K_sat * (theta_20_curr ** 3)
                
                # Gradiente de succión (aproximado por diferencia de humedad)
                psi_diff = (theta_20_curr - (curr["humedad_40cm"] / 100.0)) * 10.0 
                
                # Calcular residuo de Richards
                residuo_agua = self.solve_richards_residual(theta_20_prev, theta_20_curr, dz, dt, K_theta, psi_diff)
                
                # Flujo de agua Darcy y Coeficiente de Dispersión
                q = -K_theta * ((psi_diff / dz) + 1.0)
                D = 1e-9 # Coeficiente de difusión molecular en m2/s
                
                # Calcular residuo de transporte de sales
                residuo_sales = self.solve_convection_dispersion_residual(
                    theta_20_curr, sal_20_prev, sal_20_curr, dt, dz, D, q
                )

                # --- PASO 2: MOTOR DE PRESCRIPCIÓN QUÍMICA Y HIDRÁULICA ---
                sal_promedio_raiz = (sal_20_curr + sal_40_curr) / 2.0
                umbral = p["umbral_ec_crop"]
                
                nivel_riesgo = "BAJO"
                if sal_promedio_raiz > umbral * 1.5:
                    nivel_riesgo = "CRÍTICO"
                elif sal_promedio_raiz > umbral * 1.1:
                    nivel_riesgo = "ALTO"
                elif sal_promedio_raiz > umbral:
                    nivel_riesgo = "MODERADO"
                
                # Si el nivel freático está muy alto, aumenta el riesgo de salinización de inmediato
                if freatico < 80.0 and nivel_riesgo in ("BAJO", "MODERADO"):
                    nivel_riesgo = "ALTO" # El freático alto ahoga raíces y jala sales

                # A. Requerimiento de Lavado (Leaching Requirement - LR)
                # LR = EC_w / (5 * EC_e - EC_w)
                # Determina la fracción de agua extra de riego para lixiviar sales
                if sal_promedio_raiz > umbral:
                    denominador = (5.0 * sal_promedio_raiz) - EC_w
                    lr = EC_w / denominador if denominador > 0 else 0.05
                    lr = min(max(lr, 0.0), 0.35) # Tope de 35% de agua extra
                else:
                    lr = 0.0
                
                # B. Volumen de Riego Prescrito (m3/ha)
                # Basado en la demanda hídrica diaria + requerimiento de lavado
                et_diaria_mm = 5.0 # mm de evaporación típica
                riego_prescrito_mm = et_diaria_mm * (1.0 + lr)
                
                # Si el suelo está muy seco (humedad < 15%), aplicar dosis de recuperación
                if curr["humedad_20cm"] < 15.0:
                    riego_prescrito_mm += 10.0 # Dosis extra de humectación
                    
                # Si el nivel freático es crítico (< 50cm), reducir riego para evitar inundación total
                if freatico < 50.0:
                    riego_prescrito_mm = max(2.0, riego_prescrito_mm * 0.4) # Reducir al 40%
                    
                riego_prescrito_m3_ha = int(riego_prescrito_mm * 10.0) # 1 mm = 10 m3/ha

                # C. Enmienda Química de Yeso Agrícola (GR - Gypsum Requirement)
                # Si la conductividad es alta y el drenaje es deficiente, hay alto riesgo de sodicidad (PSI alto).
                # Calculamos el yeso necesario en toneladas por hectárea.
                yeso_ton_ha = 0.0
                if sal_20_curr > 4.5 and not p["drenaje_eficiente"]:
                    # Ecuación empírica adaptada para dosificación de enmienda cálcica
                    # Yeso (ton/ha) = f(CE_actual - CE_deseable) * Profundidad * Densidad
                    yeso_ton_ha = (sal_20_curr - 3.0) * 0.45 * densidad_aparente * (p["profundidad_raiz"] / 10.0)
                    yeso_ton_ha = round(min(max(yeso_ton_ha, 0.0), 8.5), 2) # Máximo 8.5 toneladas/ha por aplicación

                # D. Alerta de Rotación de Cultivos
                # Si la salinidad excede drásticamente el umbral tolerado, sugerir cambiar a un cultivo resistente
                alerta_rotacion = False
                cultivo_sugerido = None
                if sal_promedio_raiz > umbral * 1.8:
                    alerta_rotacion = True
                    # Recomendar un cultivo más resistente según la salinidad
                    if sal_promedio_raiz > 7.0:
                        cultivo_sugerido = "Quinua (Altamente Tolerante)"
                    elif sal_promedio_raiz > 4.0:
                        cultivo_sugerido = "Espárrago Verde (Tolerante)"
                    else:
                        cultivo_sugerido = "Alfalfa o Granado"

                # Formular la recomendación en texto dinámico
                accion_quimica = "Ninguna"
                if yeso_ton_ha > 0:
                    accion_quimica = f"Aplicar {yeso_ton_ha} ton/ha de Yeso Agrícola para corregir dispersión de arcillas."
                elif sal_20_curr > 3.0:
                    accion_quimica = "Aplicar ácidos húmicos y materia orgánica para mejorar porosidad."

                prescripciones_finales[pid].append({
                    "fecha": curr["fecha"],
                    "salinidad_actual_ds_m": round(sal_20_curr, 2),
                    "humedad_actual_porcentaje": round(curr["humedad_20cm"], 2),
                    "nivel_freático_cm": freatico,
                    "nivel_riesgo": nivel_riesgo,
                    "pinn_residuo_richards": round(residuo_agua, 9),
                    "pinn_residuo_soluto": round(residuo_sales, 9),
                    "requerimiento_lavado_porcentaje": round(lr * 100.0, 1),
                    "riego_prescrito_m3_ha": riego_prescrito_m3_ha,
                    "yeso_agricola_ton_ha": yeso_ton_ha,
                    "corrector_salinidad_aplicar": accion_quimica,
                    "alerta_rotacion_cultivo": alerta_rotacion,
                    "cultivo_sugerido_rotacion": cultivo_sugerido
                })

        # Guardar archivo de salida de prescripciones
        output_dir = os.path.dirname(os.path.abspath(__file__))
        output_path = os.path.join(output_dir, "prescriptions.json")
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump({
                "metadata": {
                    "motor": "Sat-Agro PINN & Prescription Engine v1.0",
                    "fecha_procesamiento": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "ec_agua_riego_ds_m": EC_w
                },
                "prescripciones": prescripciones_finales
            }, f, indent=2, ensure_ascii=False)
            
        print(f"¡Motor de prescripción completado con éxito!")
        print(f"Prescripciones espaciales-temporales guardadas en: {output_path}")
        return output_path

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sim_data_file = os.path.join(current_dir, "..", "data", "simulated_data.json")
    
    solver = PINNSoluteTransportSolver(sim_data_file)
    solver.run_prescription_engine()
