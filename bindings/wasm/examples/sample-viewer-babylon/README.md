# Babylon.js 3D Viewer - Manifold Sample

This is an interactive 3D viewer built with Babylon.js that renders shapes from the `my-3d-app` (sample-consumer) library. It demonstrates the full stack: library → consumer → Babylon.js visualization.

## Features

- **Interactive Babylon.js Scene**: Orbit camera controls with mouse/touch
- **Ground Grid Plane**: Visual reference grid at Z=0 in CAD coordinates
- **Real-time Parameter Control**: Two sliders control scene parameters
  - Library Cylinder Radius Scale (0.1-2.0)
  - Sphere Count (1-12)
- **Edge Rendering**: Black edge lines for better face distinction
- **Efficient WASM Architecture**: Single WASM instance shared across all operations
- **Live Statistics**: Displays vertex and triangle counts

## Architecture

This viewer uses the same efficient WASM architecture as the Three.js viewer:

1. **WASM initialized once** at application startup
2. **Manifold class passed** to consumer and library as parameter
3. **Selective recomputation** - only changed geometry is regenerated
4. No multiple WASM instances - optimal for complex models

## Setup

Install dependencies:

```bash
npm install
```

## Development

Run the development server:

```bash
npm run dev
```

Then open http://localhost:5173 (or the port shown in console) in your browser.

## Building

Build for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## How It Works

1. **Initialization**: Loads WASM module once at startup
2. **Scene Creation**: Calls `createScene()` from my-3d-app with Manifold class and parameters
3. **Conversion**: Converts Manifold mesh to Babylon.js VertexData
4. **Rendering**: Babylon.js renders the scene with camera controls and lighting
5. **Updates**: When sliders change, only regenerates affected geometry

## Comparison with Three.js Viewer

This Babylon.js viewer provides the same functionality as the Three.js viewer (`sample-viewer`) but uses Babylon.js instead:

- **Same architecture**: Single WASM instance, same parameter flow
- **Same scene**: Renders identical geometry from my-3d-app
- **Different rendering**: Uses Babylon.js rendering engine instead of Three.js
- **Grid Material**: Uses Babylon.js GridMaterial for ground plane
- **Edge rendering**: Uses Babylon.js built-in edge rendering

Both viewers demonstrate that manifold-3d works with any rendering library when using the direct WASM approach.

## Dependencies

- **@babylonjs/core**: Babylon.js 3D engine
- **manifold-3d**: WASM-based solid modeling library
- **my-3d-app**: Consumer library that creates the scene

## License

MIT
