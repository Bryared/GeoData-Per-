# 🦀 wasm_core: Módulo de Aceleración Analítica (Rust ──► WebAssembly)

Este directorio contiene el resolvedor matemático de alto rendimiento para la **interpolación espacial continua de Kriging ordinario** de variables edafológicas (humedad, salinidad, temperatura).

Está diseñado para compilar a código binario WebAssembly (Wasm) ejecutable a velocidad nativa de CPU directamente en el navegador del cliente.

---

## 🛠️ Requisitos de Compilación

1. **Rust & Cargo**: Tener instalado el compilador de Rust.
2. **wasm-pack**: La herramienta oficial de empaquetado WebAssembly para Rust. Instálala ejecutando:
   ```bash
   cargo install wasm-pack
   ```

---

## 📦 Compilación a WebAssembly

Para compilar el código de Rust y generar los módulos de integración para el frontend en React (`regenTERRA`), ejecuta el siguiente comando dentro de este directorio:

```bash
wasm-pack build --target web
```

### 🔄 Integración en React
Una vez compilado, `wasm-pack` creará una carpeta llamada `./pkg/`. Podrás importar y consumir el resolvedor espacial de forma asíncrona dentro de tus componentes de React (`Map3DKriging.tsx`) de la siguiente manera:

```typescript
import init, { solve_kriging_wasm } from 'wasm_core';

async function inicializarKriging() {
  await init();
  
  // Array de lecturas serializado a JSON
  const sensoresJSON = JSON.stringify([
    { x: 120, y: 70, value: 1.8 },
    { x: 160, y: 130, value: 4.2 }
  ]);
  
  // Inferencia espacial a velocidad de código binario nativo (60 FPS)
  const conductividadEstimada = solve_kriging_wasm(
    sensoresJSON,
    140.0, // target_x
    100.0, // target_y
    0.05,  // nugget
    0.85,  // sill
    200.0  // range
  );
  
  console.log("Conductividad interpolada en Wasm:", conductividadEstimada);
}
```
