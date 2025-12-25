# Viewer Architecture

The viewer has been refactored into a modular architecture with Web Worker support for non-blocking geometry generation.

## Module Structure

### `viewer.ts` (Main Coordinator - 117 lines)
- Entry point and UI orchestration
- Manages DOM elements and user interactions
- Creates and communicates with Web Worker
- Coordinates between worker, scene, and renderer

### `geometry.worker.ts` (Background Geometry Generation)
- Runs in separate thread (Web Worker)
- Initializes WASM module independently
- Receives parameters from main thread via `postMessage`
- Generates geometry using `createScene()` from consumer library
- Sends GLTFNodes back to main thread
- **Benefit**: Keeps UI responsive during complex geometry generation

### `scene-setup.ts` (Three.js Configuration)
- Sets up Three.js scene, camera, renderer
- Configures OrbitControls
- Handles window resize
- Manages animation loop
- **Benefit**: Reusable Three.js setup logic

### `geometry-renderer.ts` (Rendering Logic)
- Converts GLTFNode meshes to Three.js BufferGeometry
- Creates materials from GLTFNode material properties
- Handles color via `baseColorFactor` property
- Calculates bounding boxes for camera positioning
- Updates clipping planes based on model size
- **Benefit**: Isolated rendering concerns

## Architecture Benefits

### 1. **Non-Blocking UI**
Geometry generation runs in Web Worker, preventing UI freezes during complex operations.

### 2. **Better Code Organization**
Each module has a single responsibility:
- **viewer.ts**: UI coordination
- **geometry.worker.ts**: Geometry generation
- **scene-setup.ts**: Three.js setup
- **geometry-renderer.ts**: Rendering

### 3. **Maintainability**
- Smaller, focused files (was 338 lines, now 4 files averaging ~90 lines)
- Clear separation of concerns
- Easier to test individual modules
- Easy to extend (e.g., add more workers, different renderers)

### 4. **Production-Ready**
This pattern scales to complex applications:
- Multiple workers for parallel processing
- Worker pool management for large datasets
- Isolated WASM contexts prevent interference
- UI remains responsive regardless of geometry complexity

## Data Flow

```
User Interaction (UI Thread)
    ↓
viewer.ts sends parameters
    ↓
geometry.worker.ts (Worker Thread)
  - Initializes WASM
  - Calls createScene()
  - Generates GLTFNodes
    ↓
geometry.worker.ts sends GLTFNodes back
    ↓
viewer.ts receives geometry
    ↓
geometry-renderer.ts converts to Three.js meshes
    ↓
scene-setup.ts renders the scene
```

## Vite Support

Vite natively supports Web Workers:

```typescript
const worker = new Worker(
  new URL('./geometry.worker.ts', import.meta.url),
  { type: 'module' }
);
```

- No build configuration needed
- Automatic code splitting
- TypeScript support
- Hot module replacement during development

## Future Enhancements

- **Worker Pool**: Multiple workers for parallel geometry generation
- **Progressive Rendering**: Stream geometry as it's generated
- **Caching**: Cache generated geometry in worker
- **Error Recovery**: Better error handling and retry logic
- **Performance Monitoring**: Track worker execution time
