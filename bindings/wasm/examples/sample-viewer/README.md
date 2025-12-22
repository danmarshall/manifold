# my-3d-viewer

A Three.js-based 3D viewer that renders shapes from the `my-3d-app` consumer library with interactive sliders.

## Features

- **Interactive UI**: Real-time sliders to control scene parameters
- **Three.js Rendering**: Smooth 3D visualization with lighting and materials
- **Parameter Control**:
  - Library Cylinder Radius Scale (0.1 to 2.0)
  - Sphere Count (1 to 12)
- **Auto-rotation**: Scene automatically rotates for better viewing

## Setup

### Prerequisites

Make sure the dependencies are built first:

```bash
# Build the library
cd ../sample-library
npm install
npm run build

# Build the consumer app
cd ../sample-consumer
npm install
npm run build

# Now build the viewer
cd ../sample-viewer
npm install
```

### Run Development Server

```bash
npm run dev
```

This will start a Vite development server at `http://localhost:3000`.

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
sample-viewer/
├── package.json           # depends on my-3d-app and three
├── tsconfig.json
├── vite.config.ts         # Vite configuration
├── index.html             # HTML with UI controls
├── src/
│   └── viewer.ts         # Main Three.js viewer code
└── README.md
```

## How It Works

### Dependency Chain

```
my-3d-viewer (this project)
  ↓ imports createScene from
my-3d-app (sample-consumer)
  ↓ imports createCubeWithHole from
my-manifold-shapes (sample-library)
  ↓ depends on
manifold-3d (npm package)
```

### Parameter Flow

1. **User adjusts sliders** in the HTML UI
2. **viewer.ts** captures slider values and calls `createScene(params)`
3. **my-3d-app** receives params, passes `libraryRadiusScale` to library
4. **my-manifold-shapes** creates cube with scaled cylinder hole
5. **my-3d-app** adds spheres based on `sphereCount` parameter
6. **viewer.ts** converts Manifold mesh to Three.js geometry and renders

### Code Walkthrough

**index.html**:
```html
<input type="range" id="radiusScale" min="0.1" max="2.0" step="0.1" value="1.0" />
<input type="range" id="sphereCount" min="1" max="12" step="1" value="6" />
```

**viewer.ts**:
```typescript
import { createScene } from 'my-3d-app';

// Listen to slider changes
radiusScaleSlider.addEventListener('input', () => {
  const value = parseFloat(radiusScaleSlider.value);
  currentParams.libraryRadiusScale = value;
  updateScene(currentParams);
});

// Update the 3D scene
async function updateScene(params: SceneParams) {
  const manifoldScene = await createScene(params);
  const geometry = manifoldToThreeGeometry(manifoldScene);
  sceneMesh = new THREE.Mesh(geometry, material);
  scene.add(sceneMesh);
}
```

**my-3d-app (consumer)**:
```typescript
export async function createScene(params: SceneParams = {}) {
  const { libraryRadiusScale = 1.0, sphereCount = 6 } = params;
  
  // Pass parameter to library
  const cubeWithHole = await createCubeWithHole({
    radiusScale: libraryRadiusScale
  });
  
  // Create spheres based on parameter
  for (let i = 0; i < sphereCount; i++) {
    // ... create sphere at angle
  }
}
```

**my-manifold-shapes (library)**:
```typescript
export async function createCubeWithHole(params: CubeWithHoleParams) {
  const { radiusScale = 1.0 } = params;
  const scaledRadius = cylinderRadius * radiusScale;
  const cylinder = Manifold.cylinder(height, scaledRadius, scaledRadius);
  // ...
}
```

## Key Features Demonstrated

### ✅ Three.js Integration
- Converting Manifold meshes to Three.js BufferGeometry
- Proper lighting and materials
- Camera and scene setup

### ✅ Interactive Parameters
- Real-time UI controls
- Parameter propagation through library stack
- Immediate visual feedback

### ✅ Library Composition
- Consumer app (`my-3d-app`) exports its own API
- Viewer app uses consumer's API
- Clean separation of concerns

### ✅ Modern Web Development
- Vite for fast development
- TypeScript for type safety
- ES modules throughout

## Customization

### Add More Parameters

1. **In the library** (sample-library/src/index.ts):
   ```typescript
   export interface CubeWithHoleParams {
     newParam?: number;
   }
   ```

2. **In the consumer** (sample-consumer/src/app.ts):
   ```typescript
   export interface SceneParams {
     anotherParam?: number;
   }
   ```

3. **In the viewer** (sample-viewer/index.html):
   ```html
   <input type="range" id="newParam" ... />
   ```

4. **Wire it up** in viewer.ts:
   ```typescript
   newParamSlider.addEventListener('input', () => {
     currentParams.newParam = parseFloat(newParamSlider.value);
     updateScene(currentParams);
   });
   ```

### Change Visual Style

Modify the material in `viewer.ts`:
```typescript
const material = new THREE.MeshStandardMaterial({
  color: 0xff6b6b,      // Different color
  metalness: 0.8,       // More metallic
  roughness: 0.2,       // More shiny
});
```

### Adjust Camera

```typescript
camera.position.set(300, 300, 300);  // Further away
camera.fov = 60;                      // Wider field of view
```

## Troubleshooting

### Blank screen
- Check browser console for errors
- Ensure all dependencies are built (library → consumer → viewer)
- Verify Vite dev server is running

### Sliders don't work
- Check that element IDs in HTML match TypeScript
- Verify parameter names match across all projects

### Build errors
- Run `npm install` in all three projects
- Build in order: library → consumer → viewer

## Performance

- Scene regenerates on every slider change
- For better performance, consider debouncing slider events
- Manifold operations are fast, but Three.js geometry creation adds overhead

## Next Steps

- Add more shapes to the scene
- Implement camera controls (OrbitControls)
- Add export functionality (GLB/STL)
- Create animations with time-based parameters
- Add material/color controls
