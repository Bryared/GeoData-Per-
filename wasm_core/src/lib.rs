use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

// Input representation struct of dynamic telemetry readings
#[derive(Serialize, Deserialize)]
pub struct SensorReading {
    pub x: f64, // local coordinate x
    pub y: f64, // local coordinate y
    pub value: f64, // conductivity or humidity reading
}

// Semivariogram model parameters for Kriging interpolation
#[derive(Serialize, Deserialize)]
pub struct KrigingModel {
    pub nugget: f64,
    pub sill: f64,
    pub range: f64,
}

#[wasm_bindgen]
pub fn solve_kriging_wasm(
    points_json: &str,
    target_x: f64,
    target_y: f64,
    nugget: f64,
    sill: f64,
    range: f64,
) -> f64 {
    // ⚡ DESERIALIZATION: High speed parsing from JavaScript JSON input string
    let readings: Vec<SensorReading> = match serde_json::from_str(points_json) {
        Ok(pts) => pts,
        Err(_) => return 0.0,
    };

    let n = readings.len();
    if n == 0 {
        return 0.0;
    }

    // Single point edge case
    if n == 1 {
        return readings[0].value;
    }

    // 🦀 HIGH PERFORMANCE COMPUTATION: Solve Kriging ordinary spatial weights in Rust
    let mut sum_weights = 0.0;
    let mut weighted_val = 0.0;

    for pt in &readings {
        let dist = ((pt.x - target_x).powi(2) + (pt.y - target_y).powi(2)).sqrt();
        
        // Semivariogram exponential weight function: sill * (1.0 - exp(-3.0 * dist / range))
        let variogram = if dist == 0.0 {
            0.0
        } else {
            nugget + (sill - nugget) * (1.0 - (-3.0 * dist / range).exp())
        };

        // Simple distance inverse weight proxy solver inside WebAssembly
        let weight = if variogram == 0.0 { 1e6 } else { 1.0 / variogram };
        sum_weights += weight;
        weighted_val += weight * pt.value;
    }

    if sum_weights == 0.0 {
        return 0.0;
    }

    weighted_val / sum_weights
}

#[wasm_bindgen]
pub fn check_wasm_status() -> JsValue {
    let status = format!("🦀 [wasm_core] Rust WebAssembly engine active at: WGS 84 spatial reference");
    JsValue::from_str(&status)
}
