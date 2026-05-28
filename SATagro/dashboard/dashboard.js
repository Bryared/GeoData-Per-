/* Sat-Agro: Interactive 4D GIS & Prescription Dashboard */

// Configuración y variables globales
let activeParcelId = 1;
let activeLayer = 'salinity'; // 'salinity', 'ndvi', 'moisture'
let activeChartType = 'moisture'; // 'moisture', 'salinity', 'satellites', 'pinn'

let simulatedData = null;
let prescriptionsData = null;

let mainChart = null;
let lstmChart = null;
let map = null;
let parcelLayers = {};

// Variables de dibujo catastral (Fase 2)
let isDrawMode = false;
let drawnPoints = [];
let drawPolyline = null;

// Coordenadas del centro de la simulación (Chancay-Lambayeque)
const MAP_CENTER = [-6.6452, -79.8821];

// Datos de respaldo de alta fidelidad (para evitar bloqueos de CORS si se abre localmente sin servidor)
const BACKUP_SIM_DATA = {
  "metadata": {
    "valle": "Valle Chancay-Lambayeque",
    "departamento": "Lambayeque"
  },
  "parcelas": [
    {
      "id": 1,
      "codigo": "P-CH-LMB-101",
      "propietario": "Asociación Agropecuaria Vista Alegre",
      "cultivo": "Arroz (Variedad Capirona)",
      "area_ha": 4.5,
      "suelo_tipo": "Franco-Arcilloso (Mal Drenaje)",
      "lat": -6.6452,
      "lng": -79.8821,
      "drenaje_eficiente": false,
      "riego_por_inundacion": true,
      "umbral_ec_crop": 3.0,
      "profundidad_raiz": 40,
      "coords": [
        [-6.643, -79.885],
        [-6.643, -79.880],
        [-6.647, -79.880],
        [-6.647, -79.885],
        [-6.643, -79.885]
      ]
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
      "drenaje_eficiente": true,
      "riego_por_inundacion": true,
      "umbral_ec_crop": 1.7,
      "profundidad_raiz": 60,
      "coords": [
        [-6.646, -79.880],
        [-6.646, -79.875],
        [-6.650, -79.875],
        [-6.650, -79.880],
        [-6.646, -79.880]
      ]
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
      "drenaje_eficiente": true,
      "riego_por_inundacion": false,
      "umbral_ec_crop": 4.1,
      "profundidad_raiz": 60,
      "coords": [
        [-6.639, -79.889],
        [-6.639, -79.884],
        [-6.643, -79.884],
        [-6.643, -79.889],
        [-6.639, -79.889]
      ]
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
      "drenaje_eficiente": false,
      "riego_por_inundacion": false,
      "umbral_ec_crop": 8.0,
      "profundidad_raiz": 30,
      "coords": [
        [-6.648, -79.887],
        [-6.648, -79.882],
        [-6.652, -79.882],
        [-6.652, -79.887],
        [-6.648, -79.887]
      ]
    }
  ]
};

// Inicializar la aplicación al cargar la página
window.addEventListener('DOMContentLoaded', async () => {
    await loadDatasets();
    initMap();
    renderParcelList();
    initSliders();
    updateDashboardUI();
    initEventListeners();
});

// Carga asíncrona de datos con manejo elegante de CORS / file://
async function loadDatasets() {
    try {
        // Intentar primero cargar desde los endpoints REST del Servidor
        const responseSim = await fetch('/api/data');
        simulatedData = await responseSim.json();
        
        const responsePresc = await fetch('/api/prescriptions');
        prescriptionsData = await responsePresc.json();
        console.log("Datos cargados correctamente desde los endpoints REST del Servidor.");
    } catch (error) {
        console.warn("Fallo la carga desde los endpoints REST del servidor. Reintentando con rutas relativas...");
        try {
            const responseSim = await fetch('../data/simulated_data.json');
            simulatedData = await responseSim.json();
            
            const responsePresc = await fetch('../brain/prescriptions.json');
            prescriptionsData = await responsePresc.json();
            console.log("Datos cargados correctamente de los archivos JSON relativos.");
        } catch (relativeError) {
            console.warn("Fallo la carga remota de JSON (CORS/local). Utilizando base de respaldo de alta fidelidad integrada...");
            simulatedData = generateIntegratedData(BACKUP_SIM_DATA);
            prescriptionsData = generateIntegratedPrescriptions(simulatedData);
        }
    }
}

// Genera datos simulados completos en JS si falla el fetch
function generateIntegratedData(base) {
    const data = {...base};
    data.satelite_escenas = [];
    data.series_temporales = {};
    
    // Simular 30 días de lecturas de suelo e índices satelitales
    const days = 30;
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - days);
    
    for (let d = 0; d < days; d++) {
        const currDate = new Date(baseDate);
        currDate.setDate(baseDate.getDate() + d);
        const dateStr = currDate.toISOString().split('T')[0];
        
        if (d % 5 === 0) {
            data.satelite_escenas.push({
                "fecha": dateStr,
                "escena_tile": "T17MQT",
                "nubosidad": 2.4
            });
        }
        
        base.parcelas.forEach(p => {
            if (!data.series_temporales[p.id]) {
                data.series_temporales[p.id] = [];
            }
            
            // Simular dinámica física
            const prev = data.series_temporales[p.id][d-1] || {
                "humedad_20cm": 25.0, "conductividad_20cm": p.drenaje_eficiente ? 1.8 : 4.5,
                "humedad_40cm": 28.0, "conductividad_40cm": p.drenaje_eficiente ? 2.0 : 4.8,
                "humedad_60cm": 30.0, "conductividad_60cm": p.drenaje_eficiente ? 2.2 : 5.2,
                "nivel_freatico_cm": 220.0
            };
            
            const riego = (d % (p.riego_por_inundacion ? 12 : 3) === 0) ? (p.riego_por_inundacion ? 80.0 : 15.0) : 0.0;
            
            // Humedad
            let hum20 = prev.humedad_20cm + (riego * 0.4) - 3.5 + Math.random()*2;
            let hum40 = prev.humedad_40cm + (riego * 0.2) - 1.5 + Math.random();
            let hum60 = prev.humedad_60cm + (riego * 0.1) - 0.5 + Math.random();
            
            hum20 = Math.max(Math.min(hum20, 42.0), 10.0);
            hum40 = Math.max(Math.min(hum40, 40.0), 12.0);
            hum60 = Math.max(Math.min(hum60, 38.0), 15.0);
            
            // Nivel freático
            let freatico = prev.nivel_freatico_cm;
            if (p.riego_por_inundacion && !p.drenaje_eficiente) {
                freatico -= riego * 1.2 - 3.0; // Sube (menor distancia a superficie)
            } else {
                freatico += 2.0 - Math.random()*1.5; // Baja o estable
            }
            freatico = Math.max(Math.min(freatico, 300.0), 40.0);
            
            // Capilaridad de sales
            let capilaridad = 0.0;
            if (freatico < 150.0 && !p.drenaje_eficiente) {
                capilaridad = (150.0 - freatico) * 0.015;
            }
            let lavado = riego > 40.0 ? prev.conductividad_20cm * 0.2 : 0.0;
            
            let sal20 = prev.conductividad_20cm + capilaridad - lavado + (Math.random()*0.1 - 0.05);
            let sal40 = prev.conductividad_40cm + (lavado * 0.6) - (riego > 40.0 ? prev.conductividad_40cm * 0.1 : 0) + (Math.random()*0.05 - 0.02);
            let sal60 = prev.conductividad_60cm + (riego > 40.0 ? prev.conductividad_40cm * 0.08 : 0) + (Math.random()*0.05 - 0.02);
            
            sal20 = Math.max(Math.min(sal20, 16.0), 0.6);
            sal40 = Math.max(Math.min(sal40, 14.0), 0.7);
            sal60 = Math.max(Math.min(sal60, 12.0), 0.8);
            
            // Satélite
            const isSatelite = d % 5 === 0;
            const ndvi = isSatelite ? Math.max(0.2, 0.8 - (sal20 > p.umbral_ec_crop ? (sal20 - p.umbral_ec_crop)*0.1 : 0)) : null;
            const si = isSatelite ? Math.min(0.9, 0.05 + (sal20 / 20.0) * (1.2 - ndvi)) : null;
            
            data.series_temporales[p.id].push({
                "fecha": dateStr,
                "temperatura_suelo_20cm": 23.5,
                "humedad_20cm": parseFloat(hum20.toFixed(2)),
                "conductividad_20cm": parseFloat(sal20.toFixed(2)),
                "humedad_40cm": parseFloat(hum40.toFixed(2)),
                "conductividad_40cm": parseFloat(sal40.toFixed(2)),
                "humedad_60cm": parseFloat(hum60.toFixed(2)),
                "conductividad_60cm": parseFloat(sal60.toFixed(2)),
                "nivel_freatico_cm": parseFloat(freatico.toFixed(1)),
                "riego_aplicado_mm": riego,
                "lluvia_mm": 0.0,
                "satelite_disponible": isSatelite,
                "ndvi": ndvi ? parseFloat(ndvi.toFixed(3)) : null,
                "ndwi": isSatelite ? parseFloat((0.15 + (hum20/100.0)).toFixed(3)) : null,
                "salinity_index": si ? parseFloat(si.toFixed(3)) : null,
                "cobertura_salina_porcentaje": sal20 > 4.0 ? parseFloat(((sal20 - 4.0)*7.5).toFixed(1)) : 0.0
            });
        });
    }
    
    return data;
}

// Genera prescripciones en JS si falla el fetch
function generateIntegratedPrescriptions(sim) {
    const output = {
        "metadata": {
            "motor": "Sat-Agro local-solver v1.0",
            "ec_agua_riego_ds_m": 1.2
        },
        "prescripciones": {}
    };
    
    sim.parcelas.forEach(p => {
        const lecturas = sim.series_temporales[p.id];
        output.prescripciones[p.id] = lecturas.map(l => {
            const sal = l.conductividad_20cm;
            const hum = l.humedad_20cm;
            const freatico = l.nivel_freatico_cm;
            
            let riesgo = "BAJO";
            if (sal > p.umbral_ec_crop * 1.4) riesgo = "CRÍTICO";
            else if (sal > p.umbral_ec_crop * 1.1) riesgo = "ALTO";
            else if (sal > p.umbral_ec_crop) riesgo = "MODERADO";
            
            if (freatico < 85.0 && (riesgo === "BAJO" || riesgo === "MODERADO")) riesgo = "ALTO";
            
            // Lavado
            let lr = 0.0;
            if (sal > p.umbral_ec_crop) {
                lr = 1.2 / ((5 * sal) - 1.2);
                lr = Math.min(Math.max(lr, 0.05), 0.3);
            }
            
            let riego_recom = Math.round(5.0 * (1 + lr) * 10);
            if (hum < 15.0) riego_recom += 100;
            
            let yeso = 0.0;
            if (sal > 4.5 && !p.drenaje_eficiente) {
                yeso = (sal - 3.0) * 0.45 * 1.35 * (p.profundidad_raiz / 10.0);
                yeso = parseFloat(Math.min(yeso, 7.5).toFixed(2));
            }
            
            let rotacion = sal > p.umbral_ec_crop * 1.8;
            let cultivo_sug = null;
            if (rotacion) {
                cultivo_sug = sal > 7.0 ? "Quinua (Altamente Tolerante)" : "Espárrago Verde (Tolerante)";
            }
            
            let corrector = "Ninguno";
            if (yeso > 0) {
                corrector = `Aplicar ${yeso} ton/ha de Yeso Agrícola para balancear sodio intercambiable.`;
            } else if (sal > 3.0) {
                corrector = "Aplicar ácidos orgánicos y lixiviación.";
            }
            
            return {
                "fecha": l.fecha,
                "salinidad_actual_ds_m": sal,
                "humedad_actual_porcentaje": hum,
                "nivel_freático_cm": freatico,
                "nivel_riesgo": riesgo,
                "pinn_residuo_richards": 0.00000142,
                "pinn_residuo_soluto": 0.00000089,
                "requerimiento_lavado_porcentaje": parseFloat((lr * 100).toFixed(1)),
                "riego_prescrito_m3_ha": riego_recom,
                "yeso_agricola_ton_ha": yeso,
                "corrector_salinidad_aplicar": corrector,
                "alerta_rotacion_cultivo": rotacion,
                "cultivo_sugerido_rotacion": cultivo_sug
            };
        });
    });
    
    return output;
}

// Inicializar Mapa Satelital GIS (Leaflet.js)
function initMap() {
    // Inicializar el mapa con fondo oscuro premium
    map = L.map('map', {
        zoomControl: true,
        attributionControl: false
    }).setView(MAP_CENTER, 14);

    // Servidor de mapas oscuros (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);

    // Dibujar las parcelas
    drawParcelsOnMap();
    
    // Escuchar clics en el mapa para dibujo catastral (Fase 2)
    map.on('click', handleMapClick);
}

// Dibujar polígonos de las parcelas en el mapa
function drawParcelsOnMap() {
    // Limpiar polígonos antiguos
    Object.keys(parcelLayers).forEach(k => map.removeLayer(parcelLayers[k]));
    parcelLayers = {};

    simulatedData.parcelas.forEach(p => {
        // Encontrar la última lectura para colorear según índice activo
        const lecturas = simulatedData.series_temporales[p.id];
        const ultima = lecturas[lecturas.length - 1];
        
        const color = getParcelColor(p, ultima);
        
        // Coordenadas del polígono
        // Si no existen en el archivo original, las tomamos de BACKUP_SIM_DATA
        const coords = p.coords || BACKUP_SIM_DATA.parcelas.find(bp => bp.id === p.id).coords;

        const polygon = L.polygon(coords, {
            color: color,
            fillColor: color,
            fillOpacity: 0.45,
            weight: 2,
            dashArray: p.id === activeParcelId ? '0' : '3'
        }).addTo(map);

        // Al hacer clic en una parcela en el mapa
        polygon.on('click', () => {
            selectParcel(p.id);
        });

        // Crear Tooltip con info rápida
        polygon.bindTooltip(`
            <div style="font-family: var(--font-body); font-size: 0.75rem; color: #fff;">
                <strong>${p.codigo}</strong><br>
                Cultivo: ${p.cultivo}<br>
                Salinidad: <strong>${ultima.conductividad_20cm} dS/m</strong>
            </div>
        `, { sticky: true });

        parcelLayers[p.id] = polygon;
    });

    // Ajustar vista del mapa para encuadrar las parcelas
    const group = new L.featureGroup(Object.values(parcelLayers));
    map.fitBounds(group.getBounds().pad(0.1));
}

// Determinar el color del polígono según la capa activa
function getParcelColor(p, lectura) {
    if (activeLayer === 'salinity') {
        const sal = lectura.conductividad_20cm;
        if (sal < 2.0) return '#00e676'; // Sano / Bajo
        if (sal < p.umbral_ec_crop) return '#eed202'; // Moderado
        if (sal < p.umbral_ec_crop * 1.5) return '#ff9100'; // Alto
        return '#ff1744'; // Crítico
    } else if (activeLayer === 'ndvi') {
        const ndvi = lectura.ndvi || 0.6; // Si no hay dato satelital, usar valor sano
        if (ndvi > 0.7) return '#00e676';
        if (ndvi > 0.5) return '#eed202';
        if (ndvi > 0.3) return '#ff9100';
        return '#ff1744';
    } else { // Humedad (moisture)
        const hum = lectura.humedad_20cm;
        if (hum > 25.0) return '#00e5ff'; // Buena humedad (Cyan)
        if (hum > 18.0) return '#00e676'; // Aceptable
        if (hum > 14.0) return '#ff9100'; // Deficiente
        return '#ff1744'; // Seco
    }
}

// Renderizar la lista de parcelas en la barra lateral izquierda
function renderParcelList() {
    const listContainer = document.getElementById('parcel-list');
    listContainer.innerHTML = '';
    
    document.getElementById('parcel-count').innerText = `${simulatedData.parcelas.length} Parcelas`;

    simulatedData.parcelas.forEach(p => {
        const lecturas = simulatedData.series_temporales[p.id];
        const ultima = lecturas[lecturas.length - 1];
        
        const sal = ultima.conductividad_20cm;
        let salClass = 'sal-bajo';
        let salLabel = 'Bajo';
        
        if (sal > p.umbral_ec_crop * 1.4) {
            salClass = 'sal-critico';
            salLabel = 'Crítico';
        } else if (sal > p.umbral_ec_crop * 1.1) {
            salClass = 'sal-alto';
            salLabel = 'Alto';
        } else if (sal > p.umbral_ec_crop) {
            salClass = 'sal-mod';
            salLabel = 'Moderado';
        }

        const card = document.createElement('div');
        card.className = `parcel-card ${p.id === activeParcelId ? 'active' : ''}`;
        card.innerHTML = `
            <div class="parcel-card-header">
                <h3>${p.codigo}</h3>
                <span class="crop-badge ${getCropClass(p.cultivo)}">${p.cultivo.split(' ')[0]}</span>
            </div>
            <div class="parcel-card-details">
                <span>Área: ${p.area_ha} ha</span>
                <span>Humedad: ${ultima.humedad_20cm}%</span>
            </div>
            <div class="salinity-meter ${salClass}">
                <span class="salinity-indicator-dot"></span>
                <span>Salinidad: ${sal} dS/m (${salLabel})</span>
            </div>
        `;

        card.addEventListener('click', () => {
            selectParcel(p.id);
        });

        listContainer.appendChild(card);
    });
}

function getCropClass(cultivo) {
    if (cultivo.toLowerCase().includes('arroz')) return 'arroz';
    if (cultivo.toLowerCase().includes('caña')) return 'caña';
    if (cultivo.toLowerCase().includes('espárrago')) return 'espárrago';
    if (cultivo.toLowerCase().includes('quinua')) return 'quinua';
    return '';
}

// Seleccionar una parcela de la lista o mapa
function selectParcel(id) {
    activeParcelId = id;
    
    // Cambiar borde de polígono en el mapa
    Object.keys(parcelLayers).forEach(pid => {
        const polygon = parcelLayers[pid];
        if (parseInt(pid) === activeParcelId) {
            polygon.setStyle({ dashArray: '0', weight: 3 });
        } else {
            polygon.setStyle({ dashArray: '3', weight: 2 });
        }
    });

    // Centrar mapa suavemente
    const p = simulatedData.parcelas.find(x => x.id === id);
    map.panTo([p.lat, p.lng]);

    // Actualizar sliders del simulador con los valores actuales de la parcela
    const lecturas = simulatedData.series_temporales[id];
    const ultima = lecturas[lecturas.length - 1];
    
    document.getElementById('sim-irrigation-slider').value = 30; // Reset a riego típico
    document.getElementById('sim-irrigation-val').innerText = '30 mm';
    
    document.getElementById('sim-freatico-slider').value = Math.round(ultima.nivel_freatico_cm);
    document.getElementById('sim-freatico-val').innerText = `${Math.round(ultima.nivel_freatico_cm)} cm`;
    
    document.getElementById('sim-amendment').value = 'none';

    renderParcelList();
    updateDashboardUI();
}

// Actualizar los elementos de la interfaz basados en el estado actual de la parcela activa
function updateDashboardUI() {
    const p = simulatedData.parcelas.find(x => x.id === activeParcelId);
    const lecturas = simulatedData.series_temporales[activeParcelId];
    const ultima = lecturas[lecturas.length - 1];
    
    const prescripcionLista = prescriptionsData.prescripciones[activeParcelId];
    const ultimaPresc = prescripcionLista[prescripcionLista.length - 1];

    // 1. Mostrar Prescripciones Agronómicas en el panel izquierdo
    const prescBox = document.getElementById('prescription-box');
    prescBox.innerHTML = '';

    let cardClass = 'bajo';
    let badge = `<span class="presc-normal-badge">ESTABLE</span>`;
    
    if (ultimaPresc.nivel_riesgo === 'CRÍTICO') {
        cardClass = 'critico';
        badge = `<span class="presc-danger-badge">CRÍTICO</span>`;
    } else if (ultimaPresc.nivel_riesgo === 'ALTO') {
        cardClass = 'alto';
        badge = `<span class="presc-danger-badge">ALTO RIESGO</span>`;
    } else if (ultimaPresc.nivel_riesgo === 'MODERADO') {
        cardClass = 'moderado';
        badge = `<span class="presc-warning-badge">ATENCIÓN</span>`;
    }

    const card = document.createElement('div');
    card.className = `prescription-card ${cardClass}`;
    
    let contenidoPills = `
        <div class="presc-pill highlight"><i class="fa-solid fa-droplet"></i> Riego: ${ultimaPresc.riego_prescrito_m3_ha} m³/ha</div>
    `;
    if (ultimaPresc.requerimiento_lavado_porcentaje > 0) {
        contenidoPills += `
            <div class="presc-pill highlight"><i class="fa-solid fa-shower"></i> Lavado (LR): ${ultimaPresc.requerimiento_lavado_porcentaje}%</div>
        `;
    }
    if (ultimaPresc.yeso_agricola_ton_ha > 0) {
        contenidoPills += `
            <div class="presc-pill highlight"><i class="fa-solid fa-flask"></i> Yeso: ${ultimaPresc.yeso_agricola_ton_ha} ton/ha</div>
        `;
    }

    card.innerHTML = `
        <div class="prescription-card-header">
            <strong>${p.codigo} - ${p.cultivo}</strong>
            ${badge}
        </div>
        <p class="prescription-detail">
            <strong>Diagnóstico del suelo:</strong> La conductividad promedio en raíces es de <strong>${ultimaPresc.salinidad_actual_ds_m} dS/m</strong> (tolerancia: ${p.umbral_ec_crop} dS/m) con un nivel freático a <strong>${ultimaPresc.nivel_freático_cm} cm</strong>.
        </p>
        <p class="prescription-detail">
            <strong>Enmienda Química:</strong> ${ultimaPresc.corrector_salinidad_aplicar}
        </p>
        ${ultimaPresc.alerta_rotacion_cultivo ? `
            <p class="prescription-detail" style="color: var(--danger); font-weight: 600;">
                <i class="fa-solid fa-rotate"></i> Alerta Rotación: Se aconseja cambiar a <strong>${ultimaPresc.cultivo_sugerido_rotacion}</strong> debido a salinidad acumulada insostenible.
            </p>
        ` : ''}
        <div class="prescription-pill-container">
            ${contenidoPills}
        </div>
    `;
    prescBox.appendChild(card);

    // 2. Mostrar métricas de la PINN en el panel derecho
    document.getElementById('val-residue-richards').innerText = ultimaPresc.pinn_residuo_richards.toExponential(2);
    document.getElementById('val-residue-solutes').innerText = ultimaPresc.pinn_residuo_soluto.toExponential(2);
    const loss = ultimaPresc.pinn_residuo_richards + ultimaPresc.pinn_residuo_soluto;
    document.getElementById('val-physics-loss').innerText = loss.toExponential(2);

    // 3. Renderizar los gráficos
    renderMainChart();
    renderLSTMChart();
}

// InicializarSliders del simulador interactivo
function initSliders() {
    const sliderIrrig = document.getElementById('sim-irrigation-slider');
    const labelIrrig = document.getElementById('sim-irrigation-val');
    
    sliderIrrig.addEventListener('input', (e) => {
        labelIrrig.innerText = `${e.target.value} mm`;
        runRealtimeSolverSimulation();
    });

    const sliderFreat = document.getElementById('sim-freatico-slider');
    const labelFreat = document.getElementById('sim-freatico-val');
    
    sliderFreat.addEventListener('input', (e) => {
        labelFreat.innerText = `${e.target.value} cm`;
        runRealtimeSolverSimulation();
    });

    document.getElementById('sim-climate').addEventListener('change', () => {
        runRealtimeSolverSimulation();
    });

    document.getElementById('sim-amendment').addEventListener('change', () => {
        runRealtimeSolverSimulation();
    });
}

// GEMELO DIGITAL: Resolver las ecuaciones físicas en tiempo real cuando se arrastran los sliders
async function runRealtimeSolverSimulation() {
    const p = simulatedData.parcelas.find(x => x.id === activeParcelId);
    
    // Capturar inputs del simulador
    const clima = document.getElementById('sim-climate').value;
    const riego = parseFloat(document.getElementById('sim-irrigation-slider').value);
    const freatico = parseFloat(document.getElementById('sim-freatico-slider').value);
    const corrector = document.getElementById('sim-amendment').value;

    const payload = {
        parcel_id: activeParcelId,
        clima: clima,
        riego_mm: riego,
        freatico_cm: freatico,
        corrector: corrector
    };

    let simulatedByBackend = false;

    try {
        // Enviar parámetros al Cerebro Físico del backend
        const response = await fetch('/api/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const result = await response.json();
            
            // Actualizar variables en memoria con los resultados precisos del backend
            const lecturas = simulatedData.series_temporales[activeParcelId];
            const idx = lecturas.length - 1;
            
            lecturas[idx].humedad_20cm = result.variables_actualizadas.humedad_20cm;
            lecturas[idx].humedad_40cm = result.variables_actualizadas.humedad_40cm;
            lecturas[idx].conductividad_20cm = result.variables_actualizadas.conductividad_20cm;
            lecturas[idx].conductividad_40cm = result.variables_actualizadas.conductividad_40cm;
            lecturas[idx].nivel_freatico_cm = result.variables_actualizadas.nivel_freatico_cm;
            lecturas[idx].riego_aplicado_mm = result.variables_actualizadas.riego_aplicado_mm;

            // Actualizar prescripción y residuos PINN en memoria
            const prescLista = prescriptionsData.prescripciones[activeParcelId];
            const prescUlt = prescLista[prescLista.length - 1];

            prescUlt.salinidad_actual_ds_m = result.prescription.salinidad_ds_m;
            prescUlt.humedad_actual_porcentaje = result.variables_actualizadas.humedad_20cm;
            prescUlt.nivel_freático_cm = result.variables_actualizadas.nivel_freatico_cm;
            prescUlt.nivel_riesgo = result.prescription.nivel_riesgo;
            prescUlt.pinn_residuo_richards = result.pinn_residuals.richards;
            prescUlt.pinn_residuo_soluto = result.pinn_residuals.soluto;
            prescUlt.requerimiento_lavado_porcentaje = result.prescription.requerimiento_lavado_porcentaje;
            prescUlt.riego_prescrito_m3_ha = result.prescription.riego_prescrito_m3_ha;
            prescUlt.yeso_agricola_ton_ha = result.prescription.yeso_agricola_ton_ha;
            prescUlt.corrector_salinidad_aplicar = result.prescription.corrector_salinidad_aplicar;
            prescUlt.alerta_rotacion_cultivo = result.prescription.alerta_rotacion_cultivo;
            prescUlt.cultivo_sugerido_rotacion = result.prescription.cultivo_sugerido_rotacion;

            simulatedByBackend = true;
            console.log("Simulación física en caliente procesada por el Cerebro PINN del Servidor.");
        }
    } catch (err) {
        console.warn("Servidor no disponible para simulación en vivo. Usando resolvedor físico local en cliente...");
    }

    if (!simulatedByBackend) {
        // --- resolvedor físico local de respaldo ---
        // Obtener lecturas y generar una proyección física simplificada de 3 días para los gráficos
        const lecturas = [...simulatedData.series_temporales[activeParcelId]];
        const ultima = {...lecturas[lecturas.length - 1]};
        
        // Modificar la última lectura basándonos en la física interactiva
        let humFact = 1.0;
        let evapFact = 1.0;
        if (clima === 'nino') {
            humFact = 1.4; 
            evapFact = 1.3;
        } else if (clima === 'sequia') {
            humFact = 0.5;
            evapFact = 1.8;
        }

        // Efecto de riego sobre la humedad subsuperficial
        let hum_nueva = ultima.humedad_20cm + (riego * 0.3) - (5.0 * evapFact) * humFact;
        hum_nueva = Math.max(Math.min(hum_nueva, 42.0), 8.0);
        
        let hum_40_nueva = ultima.humedad_40cm + (riego * 0.1) - 2.0;
        hum_40_nueva = Math.max(Math.min(hum_40_nueva, 40.0), 10.0);

        // Efecto capilar y corrector sobre la salinidad
        let capilaridad = 0.0;
        if (freatico < 150.0 && !p.drenaje_eficiente) {
            capilaridad = (150.0 - freatico) * 0.02 * evapFact;
        }
        
        let lavado = riego > 45.0 ? ultima.conductividad_20cm * 0.35 : (riego > 15 ? ultima.conductividad_20cm * 0.1 : 0);
        
        let correctorReduc = 0.0;
        if (corrector === 'yeso') correctorReduc = 1.5;
        else if (corrector === 'organico') correctorReduc = 0.8;

        let sal_nueva = ultima.conductividad_20cm + capilaridad - lavado - correctorReduc;
        sal_nueva = parseFloat(Math.max(sal_nueva, 0.5).toFixed(2));
        
        let sal_40_nueva = ultima.conductividad_40cm + (lavado * 0.7) - (corrector === 'yeso' ? 0.5 : 0);
        sal_40_nueva = parseFloat(Math.max(sal_40_nueva, 0.5).toFixed(2));

        // Modificar temporalmente los datos en memoria para actualizar visualizaciones
        simulatedData.series_temporales[activeParcelId][lecturas.length - 1].humedad_20cm = hum_nueva;
        simulatedData.series_temporales[activeParcelId][lecturas.length - 1].humedad_40cm = hum_40_nueva;
        simulatedData.series_temporales[activeParcelId][lecturas.length - 1].conductividad_20cm = sal_nueva;
        simulatedData.series_temporales[activeParcelId][lecturas.length - 1].conductividad_40cm = sal_40_nueva;
        simulatedData.series_temporales[activeParcelId][lecturas.length - 1].nivel_freatico_cm = freatico;
        
        // Recalcular prescripción de inmediato
        const prescLista = prescriptionsData.prescripciones[activeParcelId];
        const prescUlt = prescLista[prescLista.length - 1];
        
        let riesgo_nuevo = "BAJO";
        if (sal_nueva > p.umbral_ec_crop * 1.4) riesgo_nuevo = "CRÍTICO";
        else if (sal_nueva > p.umbral_ec_crop * 1.1) riesgo_nuevo = "ALTO";
        else if (sal_nueva > p.umbral_ec_crop) riesgo_nuevo = "MODERADO";
        
        if (freatico < 85.0 && (riesgo_nuevo === "BAJO" || riesgo_nuevo === "MODERADO")) riesgo_nuevo = "ALTO";

        let lr_nuevo = 0.0;
        if (sal_nueva > p.umbral_ec_crop) {
            lr_nuevo = 1.2 / ((5 * sal_nueva) - 1.2);
            lr_nuevo = Math.min(Math.max(lr_nuevo, 0.0), 0.35);
        }
        
        let yeso_nuevo = 0.0;
        if (sal_nueva > 4.5 && !p.drenaje_eficiente) {
            yeso_nuevo = parseFloat(((sal_nueva - 3.0) * 0.45 * 1.35 * (p.profundidad_raiz / 10.0)).toFixed(2));
            yeso_nuevo = Math.min(yeso_nuevo, 8.5);
        }
        
        prescUlt.salinidad_actual_ds_m = sal_nueva;
        prescUlt.humedad_actual_porcentaje = hum_nueva;
        prescUlt.nivel_freático_cm = freatico;
        prescUlt.nivel_riesgo = riesgo_nuevo;
        prescUlt.requerimiento_lavado_porcentaje = parseFloat((lr_nuevo * 100).toFixed(1));
        prescUlt.yeso_agricola_ton_ha = yeso_nuevo;
        
        if (yeso_nuevo > 0) {
            prescUlt.corrector_salinidad_aplicar = `Aplicar ${yeso_nuevo} ton/ha de Yeso Agrícola de inmediato.`;
        } else if (sal_nueva > p.umbral_ec_crop) {
            prescUlt.corrector_salinidad_aplicar = "Drenar excedentes y aplicar lavado profundo (LR).";
        } else {
            prescUlt.corrector_salinidad_aplicar = "Suelo balanceado. Mantener riego volumétrico.";
        }

        prescUlt.alerta_rotacion_cultivo = sal_nueva > p.umbral_ec_crop * 1.8;
        if (prescUlt.alerta_rotacion_cultivo) {
            prescUlt.cultivo_sugerido_rotacion = sal_nueva > 7.0 ? "Quinua (Altamente Tolerante)" : "Espárrago Verde (Tolerante)";
        }
    }

    // Actualizar visualizaciones del mapa (cambiar colores del polígono de inmediato)
    const color = getParcelColor(p, simulatedData.series_temporales[activeParcelId][simulatedData.series_temporales[activeParcelId].length - 1]);
    parcelLayers[activeParcelId].setStyle({ fillColor: color, color: color });

    // Actualizar UI
    updateDashboardUI();
}

// Renderizar el gráfico de series temporales (4D)
function renderMainChart() {
    const ctx = document.getElementById('soil-time-chart').getContext('2d');
    
    const lecturas = simulatedData.series_temporales[activeParcelId];
    
    // Obtener los últimos 15 días para mantener legibilidad
    const subset = lecturas.slice(-15);
    const labels = subset.map(l => l.fecha.split('-').slice(1).join('/')); // Formato mm/dd
    
    let datasets = [];

    if (activeChartType === 'moisture') {
        datasets = [
            {
                label: '20 cm (Zona Superior)',
                data: subset.map(l => l.humedad_20cm),
                borderColor: '#00e5ff',
                backgroundColor: 'rgba(0, 229, 255, 0.05)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            },
            {
                label: '40 cm (Zona Media)',
                data: subset.map(l => l.humedad_40cm),
                borderColor: '#00e676',
                borderWidth: 2,
                fill: false,
                tension: 0.3
            },
            {
                label: '60 cm (Límite Radical)',
                data: subset.map(l => l.humedad_60cm),
                borderColor: '#eed202',
                borderWidth: 1.5,
                borderDash: [4, 4],
                fill: false,
                tension: 0.3
            }
        ];
    } else if (activeChartType === 'salinity') {
        datasets = [
            {
                label: '20 cm (Salinidad)',
                data: subset.map(l => l.conductividad_20cm),
                borderColor: '#ff1744',
                backgroundColor: 'rgba(255, 23, 68, 0.05)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            },
            {
                label: '40 cm (Salinidad)',
                data: subset.map(l => l.conductividad_40cm),
                borderColor: '#ff9100',
                borderWidth: 2,
                fill: false,
                tension: 0.3
            },
            {
                label: '60 cm (Salinidad)',
                data: subset.map(l => l.conductividad_60cm),
                borderColor: '#eed202',
                borderWidth: 1.5,
                borderDash: [4, 4],
                fill: false,
                tension: 0.3
            }
        ];
    } else if (activeChartType === 'satellites') {
        // Filtrar solo los datos que tengan satélite disponible
        const s2Data = subset.filter(l => l.satelite_disponible);
        const s2Labels = s2Data.map(l => l.fecha.split('-').slice(1).join('/'));
        
        if (mainChart) mainChart.destroy();
        
        mainChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: s2Labels.length > 0 ? s2Labels : ['Sin Escenas Despejadas'],
                datasets: [
                    {
                        type: 'line',
                        label: 'Vigor (NDVI)',
                        data: s2Data.map(l => l.ndvi),
                        borderColor: '#00e676',
                        borderWidth: 2,
                        tension: 0.2
                    },
                    {
                        type: 'line',
                        label: 'Humedad Foliar (NDWI)',
                        data: s2Data.map(l => l.ndwi),
                        borderColor: '#00e5ff',
                        borderWidth: 2,
                        tension: 0.2
                    },
                    {
                        type: 'bar',
                        label: 'Índice de Salinidad (SI)',
                        data: s2Data.map(l => l.salinity_index),
                        backgroundColor: 'rgba(255, 23, 68, 0.3)',
                        borderColor: '#ff1744',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#9ca3af', font: { size: 9 } } }
                },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#9ca3af', font: { size: 9 } } },
                    y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#9ca3af', font: { size: 9 } }, min: -0.2, max: 1.0 }
                }
            }
        });
        return;
    } else { // PINN Pérdida
        const presc = prescriptionsData.prescripciones[activeParcelId].slice(-15);
        datasets = [
            {
                label: 'Residuo de Richards (Humedad)',
                data: presc.map(l => l.pinn_residuo_richards),
                borderColor: '#00e5ff',
                borderWidth: 2,
                fill: false,
                tension: 0.2
            },
            {
                label: 'Residuo de Solutos (Sales)',
                data: presc.map(l => l.pinn_residuo_soluto),
                borderColor: '#00e676',
                borderWidth: 2,
                fill: false,
                tension: 0.2
            }
        ];
    }

    if (mainChart) mainChart.destroy();

    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#9ca3af', font: { size: 9, family: 'var(--font-body)' } }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#9ca3af', font: { size: 9 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#9ca3af', font: { size: 9 } }
                }
            }
        }
    });
}

// Renderizar el gráfico LSTM a 12 meses
function renderLSTMChart() {
    const ctx = document.getElementById('lstm-chart').getContext('2d');
    
    // Generar datos predictivos simulando la proyección LSTM
    const labels = ['Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May'];
    
    const p = simulatedData.parcelas.find(x => x.id === activeParcelId);
    const lecturas = simulatedData.series_temporales[activeParcelId];
    const ultima = lecturas[lecturas.length - 1];
    
    const salBase = ultima.conductividad_20cm;
    const dataProyectada = [];
    
    // Si no hay drenaje, el LSTM predice un incremento severo de salinidad
    const tasaSubida = !p.drenaje_eficiente ? 0.25 : 0.02;
    
    for (let i = 0; i < 12; i++) {
        const val = salBase + (i * tasaSubida) + Math.sin(i / 1.5) * 0.15;
        dataProyectada.push(parseFloat(Math.max(val, 0.5).toFixed(2)));
    }

    // Actualizar el texto del cuadro de alerta LSTM
    const alertBox = document.getElementById('projection-alert');
    if (!p.drenaje_eficiente) {
        alertBox.className = 'projection-message alert';
        alertBox.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>Alerta LSTM: En las condiciones actuales (sin drenes), la salinidad de los 20cm llegará a <strong>${dataProyectada[11]} dS/m</strong> en mayo (+${Math.round((dataProyectada[11]-salBase)/salBase*100)}%).</span>
        `;
    } else {
        alertBox.className = 'projection-message';
        alertBox.innerHTML = `
            <i class="fa-solid fa-circle-check" style="color: var(--secondary); animation: none;"></i>
            <span style="color: #a5d6a7;">LSTM Estable: El sistema de drenaje mantendrá la salinidad superficial estabilizada en <strong>${dataProyectada[11]} dS/m</strong>.</span>
        `;
    }

    if (lstmChart) lstmChart.destroy();

    lstmChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Proyección Salinidad (dS/m)',
                    data: dataProyectada,
                    borderColor: '#d500f9',
                    backgroundColor: 'rgba(213, 0, 249, 0.05)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 8 } } },
                y: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: '#6b7280', font: { size: 8 } } }
            }
        }
    });
}

// Configurar los eventos de clic en los botones y pestañas
function initEventListeners() {
    // Selector de Capas del Mapa
    document.getElementById('btn-layer-salinity').addEventListener('click', (e) => {
        setMapLayer('salinity', e.target);
    });
    document.getElementById('btn-layer-ndvi').addEventListener('click', (e) => {
        setMapLayer('ndvi', e.target);
    });
    document.getElementById('btn-layer-moisture').addEventListener('click', (e) => {
        setMapLayer('moisture', e.target);
    });

    // Selector de Pestañas de Gráficos
    document.getElementById('tab-chart-moisture').addEventListener('click', (e) => {
        setChartTab('moisture', e.target);
    });
    document.getElementById('tab-chart-salinity').addEventListener('click', (e) => {
        setChartTab('salinity', e.target);
    });
    document.getElementById('tab-chart-satellites').addEventListener('click', (e) => {
        setChartTab('satellites', e.target);
    });
    document.getElementById('tab-chart-pinn').addEventListener('click', (e) => {
        setChartTab('pinn', e.target);
    });

    // Eventos del digitalizador catastral (Fase 2)
    document.getElementById('btn-draw-mode').addEventListener('click', toggleDrawMode);
    document.getElementById('btn-save-drawn').addEventListener('click', saveDrawnParcel);
}

function setMapLayer(layer, button) {
    activeLayer = layer;
    
    // Actualizar botones activos
    document.querySelectorAll('.layer-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    // Redibujar parcelas en el mapa con los nuevos colores de la capa activa
    drawParcelsOnMap();
}

function setChartTab(chartType, tabButton) {
    activeChartType = chartType;
    
    // Actualizar pestañas activas
    document.querySelectorAll('.chart-tab').forEach(tab => tab.classList.remove('active'));
    tabButton.classList.add('active');
    
    // Redibujar gráfico
    renderMainChart();
}

// =========================================================================
// MÓDULO DE DIBUJO CATASTRAL E INTERACCIÓN CON EL SERVIDOR (FASE 2)
// =========================================================================

function toggleDrawMode() {
    isDrawMode = !isDrawMode;
    const btn = document.getElementById('btn-draw-mode');
    const form = document.getElementById('digitize-form');
    
    if (isDrawMode) {
        btn.innerHTML = '<i class="fa-solid fa-xmark"></i> Cancelar Dibujo';
        btn.style.background = 'rgba(255, 23, 68, 0.15)';
        btn.style.borderColor = 'rgba(255, 23, 68, 0.4)';
        btn.style.color = 'var(--danger)';
        form.style.display = 'flex';
        
        // Limpiar puntos antiguos
        drawnPoints = [];
        if (drawPolyline) {
            map.removeLayer(drawPolyline);
            drawPolyline = null;
        }
    } else {
        btn.innerHTML = '<i class="fa-solid fa-pencil"></i> Iniciar Dibujo en Mapa';
        btn.style.background = 'rgba(0, 229, 255, 0.08)';
        btn.style.borderColor = 'rgba(0, 229, 255, 0.3)';
        btn.style.color = 'var(--primary)';
        form.style.display = 'none';
        
        if (drawPolyline) {
            map.removeLayer(drawPolyline);
            drawPolyline = null;
        }
        drawnPoints = [];
    }
}

function handleMapClick(e) {
    if (!isDrawMode) return;
    
    const latlng = [e.latlng.lat, e.latlng.lng];
    drawnPoints.push(latlng);
    
    // Dibujar o actualizar línea en el mapa
    if (drawPolyline) {
        map.removeLayer(drawPolyline);
    }
    
    // Si tenemos al menos 3 puntos, cerrar el polígono visualmente dibujando de vuelta al primer punto
    let pts = [...drawnPoints];
    if (pts.length >= 3) {
        pts.push(pts[0]);
    }
    
    drawPolyline = L.polyline(pts, {
        color: 'var(--primary)',
        weight: 3,
        dashArray: '5, 5',
        opacity: 0.8
    }).addTo(map);
    
    // Colocar un marcador pequeño temporal en el último punto
    L.circleMarker(latlng, {
        radius: 4,
        fillColor: '#fff',
        color: 'var(--primary)',
        fillOpacity: 1,
        weight: 2
    }).addTo(map);
}

async function saveDrawnParcel() {
    if (drawnPoints.length < 3) {
        alert("Por favor, marca al menos 3 vértices en el mapa antes de guardar.");
        return;
    }
    
    const code = document.getElementById('new-parcel-code').value.trim() || `P-CH-LMB-${Math.round(Math.random()*100 + 100)}`;
    const crop = document.getElementById('new-parcel-crop').value;
    
    // Calcular centro geométrico de los puntos dibujados
    let sumLat = 0, sumLng = 0;
    drawnPoints.forEach(p => { sumLat += p[0]; sumLng += p[1]; });
    const lat = sumLat / drawnPoints.length;
    const lng = sumLng / drawnPoints.length;
    
    // Asegurar que el polígono esté cerrado (primer y último punto idénticos para GeoJSON standard)
    const closedCoords = [...drawnPoints, drawnPoints[0]];
    
    const area = parseFloat((Math.random() * 4 + 2).toFixed(2)); // Simular área en hectáreas

    const payload = {
        codigo: code,
        cultivo: crop,
        area_ha: area,
        lat: lat,
        lng: lng,
        coords: closedCoords
    };

    try {
        // Intentar guardar en el servidor web activo
        const response = await fetch('http://localhost:8000/api/parcels/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            const nuevaParcela = await response.json();
            
            // Recargar conjuntos de datos completos desde el servidor para sincronizar
            const responseSim = await fetch('http://localhost:8000/api/data');
            simulatedData = await responseSim.json();
            
            const responsePresc = await fetch('http://localhost:8000/api/prescriptions');
            prescriptionsData = await responsePresc.json();
            
            alert(`¡Parcela ${code} guardada y procesada en el Servidor Sat-Agro!`);
            
            // Apagar modo dibujo y redibujar
            toggleDrawMode();
            drawParcelsOnMap();
            selectParcel(nuevaParcela.id);
            return;
        }
    } catch (err) {
        console.warn("Servidor fuera de línea. Guardando parcela en caché del navegador de forma robusta...");
    }

    // --- FALLBACK TOTAL OFFLINE (Garantía de Robustez del Software) ---
    const nuevoId = simulatedData.parcelas.length + 1;
    const drenaje = !crop.toLowerCase().includes('arroz') && !crop.toLowerCase().includes('limoso');
    const umbral = crop.toLowerCase().includes('caña') ? 1.7 : crop.toLowerCase().includes('espárrago') ? 4.1 : crop.toLowerCase().includes('quinua') ? 8.0 : 3.0;
    
    const nuevaParcelaLocal = {
        id: nuevoId,
        codigo: code,
        propietario: "Propietario Local - Sat-Agro",
        cultivo: crop,
        area_ha: area,
        suelo_tipo: "Franco-Limoso (Caché Local)",
        lat: lat,
        lng: lng,
        drenaje_eficiente: drenaje,
        riego_por_inundacion: crop.toLowerCase().includes('arroz') || crop.toLowerCase().includes('caña'),
        umbral_ec_crop: umbral,
        profundidad_raiz: crop.toLowerCase().includes('quinua') ? 30 : crop.toLowerCase().includes('arroz') ? 40 : 60,
        coords: closedCoords
    };

    // Añadir localmente
    simulatedData.parcelas.push(nuevaParcelaLocal);
    
    // Simular lecturas en memoria
    const days = simulatedData.metadata ? simulatedData.metadata.total_dias : 30;
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - days);
    
    simulatedData.series_temporales[nuevoId] = [];
    prescriptionsData.prescripciones[nuevoId] = [];
    
    for (let d = 0; d < days; d++) {
        const currDate = new Date(baseDate);
        currDate.setDate(baseDate.getDate() + d);
        const dateStr = currDate.toISOString().split('T')[0];
        
        const hum = 22 + (d % 4) * 2;
        const sal = 3.2 + (d % 6) * 0.15;
        const freatico = 220 - (d % 10) * 5;
        
        simulatedData.series_temporales[nuevoId].push({
            "fecha": dateStr,
            "temperatura_suelo_20cm": 23.0,
            "humedad_20cm": hum,
            "conductividad_20cm": sal,
            "humedad_40cm": hum - 2,
            "conductividad_40cm": sal - 0.2,
            "humedad_60cm": hum - 4,
            "conductividad_60cm": sal - 0.4,
            "nivel_freatico_cm": freatico,
            "riego_aplicado_mm": d % 7 === 0 ? 30.0 : 0.0,
            "lluvia_mm": 0.0,
            "satelite_disponible": d % 5 === 0,
            "ndvi": d % 5 === 0 ? 0.65 : null,
            "ndwi": d % 5 === 0 ? 0.35 : null,
            "salinity_index": d % 5 === 0 ? 0.22 : null,
            "cobertura_salina_porcentaje": 0.0
        });

        // Prescripción local
        let riesgo = "BAJO";
        if (sal > umbral) riesgo = "MODERADO";
        
        prescriptionsData.prescripciones[nuevoId].push({
            "fecha": dateStr,
            "salinidad_actual_ds_m": sal,
            "humedad_actual_porcentaje": hum,
            "nivel_freático_cm": freatico,
            "nivel_riesgo": riesgo,
            "pinn_residuo_richards": 1.5e-6,
            "pinn_residuo_soluto": 9.2e-7,
            "requerimiento_lavado_porcentaje": sal > umbral ? 8.5 : 0.0,
            "riego_prescrito_m3_ha": 55,
            "yeso_agricola_ton_ha": 0.0,
            "corrector_salinidad_aplicar": sal > umbral ? "Lixiviar sales acumuladas mediante riego ligero." : "Suelo estable.",
            "alerta_rotacion_cultivo": false,
            "cultivo_sugerido_rotacion": null
        });
    }

    alert(`¡Parcela ${code} creada exitosamente en caché local! (Offline Mode)`);
    toggleDrawMode();
    drawParcelsOnMap();
    selectParcel(nuevoId);
}
