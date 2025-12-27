# Creating Reusable Libraries for ManifoldCAD

This guide explains how to create TypeScript/JavaScript libraries that can work in multiple contexts:
- In the ManifoldCAD.org web app
- In custom applications with their own WASM instances
- As standalone npm packages

## The Challenge

ManifoldCAD has two different usage patterns with different bundling approaches:

**1. ManifoldCAD.org web app:**
```typescript
// Scripts running on manifoldcad.org
import {Manifold} from 'manifold-3d/manifoldCAD';
const {cube, sphere} = Manifold;
```
- Uses a **global singleton** WASM instance created in a Web Worker
- Bundles code at **runtime** using esbuild-wasm
- Scripts are bundled dynamically when you click "Run"

**2. Custom applications:**
```typescript
// Custom app with its own WASM instance
import Module from 'manifold-3d';
const wasm = await Module();
wasm.setup();
const { Manifold } = wasm;
```
- Creates a **custom WASM instance** under your control
- Bundles code at **build time** using standard tools (Webpack, Vite, Rollup, etc.)
- No runtime bundling - everything is pre-bundled before deployment

If your library imports from `'manifold-3d/manifoldCAD'`, it will only work in the first context. To make your library work in both contexts, follow the patterns below.

## Pattern 1: Accept Optional Manifold Context (Recommended)

The cleanest approach is to make your library functions accept an optional Manifold context parameter.

### Example: TeapotCube Library

```typescript
// teapot-cube.ts - A reusable library
import {Manifold} from 'manifold-3d/manifoldCAD';
import type {ManifoldToplevel} from 'manifold-3d';

/**
 * Create a teapot-shaped cube with a spout.
 * 
 * @param size - The size of the cube
 * @param manifoldContext - Optional Manifold context. If not provided,
 *                          uses the default manifoldCAD context.
 * @returns A Manifold object representing the teapot cube
 */
export function createTeapotCube(
  size: number = 100,
  manifoldContext?: ManifoldToplevel
): Manifold {
  // Use provided context or fall back to default import
  const M = manifoldContext?.Manifold ?? Manifold;
  const {cube, cylinder} = M;
  
  // Create the main cube body
  const body = cube([size, size, size], true);
  
  // Create a spout
  const spout = cylinder(size * 0.15, size * 0.4)
    .rotate([0, 90, 0])
    .translate([size * 0.5, 0, size * 0.2]);
  
  // Create a handle
  const handle = cylinder(size * 0.1, size * 0.6)
    .rotate([90, 0, 0])
    .translate([-size * 0.45, 0, 0]);
  
  return body.add(spout).add(handle);
}

// For manifoldCAD.org: Export a default function that uses the global context
export default () => createTeapotCube(100);
```

### Usage in ManifoldCAD.org

```typescript
// On manifoldcad.org
import {createTeapotCube} from './teapot-cube';

// Uses the default manifoldCAD context
const teapot = createTeapotCube(150);
export default teapot;
```

### Usage in Custom Applications

Custom applications create their own WASM instance and bundle code at build time (using tools like Webpack, Rollup, or Vite), not at runtime like manifoldCAD.org does.

```typescript
// In your custom app (bundled at build time)
import Module from 'manifold-3d';
import {createTeapotCube} from './teapot-cube';

// Initialize your WASM instance
const wasm = await Module();
wasm.setup();

// Pass your custom WASM instance as the second parameter
const teapot = createTeapotCube(150, wasm);
```

**Key differences from manifoldCAD.org:**
- Custom apps bundle at **build time** using standard bundlers (Webpack, Vite, Rollup, etc.)
- manifoldCAD.org bundles at **runtime** using esbuild-wasm in a Web Worker
- Both patterns work with the same library code by passing the appropriate context

## Pattern 2: Parameterized Context for Complex Libraries

For libraries with many functions, create a factory function that returns all your library functions bound to a specific context.

```typescript
// gear-library.ts
import {Manifold, CrossSection} from 'manifold-3d/manifoldCAD';
import type {ManifoldToplevel} from 'manifold-3d';

export function createGearLibrary(manifoldContext?: ManifoldToplevel) {
  const M = manifoldContext?.Manifold ?? Manifold;
  const CS = manifoldContext?.CrossSection ?? CrossSection;
  
  function spurGear(teeth: number, height: number, options = {}) {
    // Implementation using M and CS
    const {circle, square} = CS;
    // ... gear creation logic
  }
  
  function bevelGear(teeth: number, angle: number, options = {}) {
    // Implementation using M and CS
    // ... gear creation logic
  }
  
  return {
    spurGear,
    bevelGear
  };
}

// Default export for manifoldCAD.org
export default () => {
  const gears = createGearLibrary();
  return gears.spurGear(15, 5);
};
```

### Usage

```typescript
// In manifoldCAD.org
import {createGearLibrary} from './gear-library';
const gears = createGearLibrary();
const myGear = gears.spurGear(20, 10);

// In custom app
import Module from 'manifold-3d';
import {createGearLibrary} from './gear-library';

const wasm = await Module();
wasm.setup();
const gears = createGearLibrary(wasm);
const myGear = gears.spurGear(20, 10);
```

## Pattern 3: ES Module Exports for Simple Libraries

For very simple libraries, you can export both individual functions and a default:

```typescript
// simple-shapes.ts
import {Manifold} from 'manifold-3d/manifoldCAD';
import type {ManifoldToplevel} from 'manifold-3d';

export function createRoundedBox(
  size: number,
  radius: number,
  manifoldContext?: ManifoldToplevel
) {
  const M = manifoldContext?.Manifold ?? Manifold;
  // ... implementation
}

export function createCapsule(
  radius: number,
  height: number,
  manifoldContext?: ManifoldToplevel
) {
  const M = manifoldContext?.Manifold ?? Manifold;
  // ... implementation
}

// Preview function for manifoldCAD.org
export default () => createRoundedBox(100, 10);
```

## Pattern 4: Three-Parameter Convention for Functional Composition

For maximum flexibility and to enable functional programming patterns like currying and composition, use a standardized 3-parameter signature:

1. **options** - Configuration object for the function
2. **target** - Optional object to operate on (null for creation functions)
3. **manifoldContext** - Optional Manifold WASM instance

This pattern supports complex function chains and composition.

### Available Exports from manifold-3d/manifoldCAD

The manifoldCAD module exports many types and utilities beyond just `Manifold`:

```typescript
import {
  // Core classes
  Manifold, CrossSection, Mesh,
  
  // GLTF and visualization
  GLTFNode, GLTFMaterial, GLTFAttribute, 
  VisualizationGLTFNode, getGLTFNodes,
  
  // Material and debugging
  setMaterial, show, only,
  
  // Animation
  setMorphStart, setMorphEnd,
  
  // Level of detail
  getCircularSegments, getMinCircularAngle, getMinCircularEdgeLength,
  
  // Importing
  importManifold, importModel,
  
  // Types
  Box, Vec2, Vec3, Vec4
} from 'manifold-3d/manifoldCAD';
```

**Important**: When using the 3-parameter pattern, the type of the 3rd parameter is `ManifoldToplevel`:

```typescript
import type {ManifoldToplevel} from 'manifold-3d';

export function myFunction(
  options: MyOptions,
  target?: Manifold | null,
  manifoldContext?: ManifoldToplevel  // <-- This is the type
): Manifold {
  // ...
}
```

The `ManifoldToplevel` interface includes:
- `Manifold`, `CrossSection`, `Mesh` - Core classes
- `triangulate` - Utility function
- `setup()` - WASM initialization function
- Level of detail functions

### Example: Layout Functions

```typescript
import {Manifold, type ManifoldToplevel} from 'manifold-3d/manifoldCAD';

interface GridOptions {
  rows: number;
  cols: number;
  spacing: number;
}

/**
 * Arrange objects in a grid pattern.
 * Can create new geometry or clone existing geometry to grid positions.
 */
export function layoutToGrid(
  options: GridOptions,
  target?: Manifold | null,
  manifoldContext?: ManifoldToplevel  // Type of 3rd parameter
): Manifold {
  const M = manifoldContext?.Manifold ?? Manifold;
  const {cube} = M;
  
  // Use target or create default shape
  const shape = target ?? cube([10, 10, 10]);
  
  let result = shape;
  for (let row = 0; row < options.rows; row++) {
    for (let col = 0; col < options.cols; col++) {
      if (row === 0 && col === 0) continue; // Skip first position
      const offset = [
        col * options.spacing,
        row * options.spacing,
        0
      ];
      result = result.add(shape.translate(offset));
    }
  }
  
  return result;
}

interface HoneycombOptions {
  count: number;
  radius: number;
  hexSize?: number;
}

/**
 * Clone and arrange objects in a honeycomb pattern.
 */
export function cloneToHoneycomb(
  options: HoneycombOptions,
  target?: Manifold | null,
  manifoldContext?: ManifoldToplevel
): Manifold {
  const M = manifoldContext?.Manifold ?? Manifold;
  const {cylinder} = M;
  
  const shape = target ?? cylinder(5, 10);
  const hexSize = options.hexSize ?? options.radius * 0.2;
  
  let result = shape;
  // Honeycomb pattern logic...
  // (simplified for example)
  
  return result;
}

// Default export for manifoldCAD.org
export default () => {
  const myShape = Manifold.sphere(5);
  return layoutToGrid({rows: 3, cols: 3, spacing: 20}, myShape);
};
```

### Example: Using Multiple Types (Box, Vec2, Vec3, etc.)

Here's a comprehensive example showing how to use various manifoldCAD types with the dual-context pattern:

```typescript
import type {Manifold as ManifoldType} from 'manifold-3d/manifold-encapsulated-types';
import type {ManifoldToplevel, Box, Vec2, Vec3} from 'manifold-3d';
import {Manifold, CrossSection} from 'manifold-3d/manifoldCAD';

/**
 * Create a voxelized shape within given bounds.
 * Demonstrates using Box and Vec3 types.
 */
export function createBoundedVoxels(
  options: {bounds: Box; divisions?: Vec3},
  target?: ManifoldType | null,
  manifoldContext?: ManifoldToplevel
): ManifoldType {
  const M = manifoldContext?.Manifold ?? Manifold;
  const {cube, sphere} = M;
  
  const {bounds, divisions = [3, 3, 3]} = options;
  
  // Calculate voxel size from Box bounds and Vec3 divisions
  const size: Vec3 = [
    (bounds.max[0] - bounds.min[0]) / divisions[0],
    (bounds.max[1] - bounds.min[1]) / divisions[1],
    (bounds.max[2] - bounds.min[2]) / divisions[2]
  ];
  
  const baseShape = target ?? sphere(Math.min(...size) * 0.4);
  
  let result = cube([0, 0, 0]);
  let first = true;
  
  // Create voxel grid using Vec3 positions
  for (let x = 0; x < divisions[0]; x++) {
    for (let y = 0; y < divisions[1]; y++) {
      for (let z = 0; z < divisions[2]; z++) {
        const pos: Vec3 = [
          bounds.min[0] + (x + 0.5) * size[0],
          bounds.min[1] + (y + 0.5) * size[1],
          bounds.min[2] + (z + 0.5) * size[2]
        ];
        
        const voxel = baseShape.scale(size).translate(pos);
        result = first ? voxel : result.add(voxel);
        first = false;
      }
    }
  }
  
  return result;
}

/**
 * Create a 3D shape by extruding a 2D polygon.
 * Demonstrates using Vec2 arrays with CrossSection.
 */
export function createExtrudedShape(
  options: {polygon: Vec2[]; height: number; twist?: number},
  target?: ManifoldType | null,
  manifoldContext?: ManifoldToplevel
): ManifoldType {
  const CS = manifoldContext?.CrossSection ?? CrossSection;
  
  const {polygon, height, twist = 0} = options;
  
  // Create 2D cross-section from Vec2 array
  const profile = new CS(polygon);
  
  // Extrude to 3D
  return profile.extrude(height, twist);
}

/**
 * Calculate bounding box center and create marker.
 * Demonstrates working with Box type.
 */
export function createBoundingBoxMarker(
  options: {shapes: ManifoldType[]},
  target?: ManifoldType | null,
  manifoldContext?: ManifoldToplevel
): ManifoldType {
  const M = manifoldContext?.Manifold ?? Manifold;
  const {sphere} = M;
  
  // Combine shapes to get overall bounds
  let combined = options.shapes[0];
  for (let i = 1; i < options.shapes.length; i++) {
    combined = combined.add(options.shapes[i]);
  }
  
  // Get bounding box (Box type)
  const bounds: Box = combined.boundingBox();
  
  // Calculate center from Box
  const center: Vec3 = [
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
    (bounds.min[2] + bounds.max[2]) / 2
  ];
  
  const marker = target ?? sphere(5);
  return combined.add(marker.translate(center));
}

// Usage in manifoldCAD.org
export default () => {
  // Example 1: Using Box and Vec3
  const bounds: Box = {min: [-50, -50, -50], max: [50, 50, 50]};
  const voxels = createBoundedVoxels(
    {bounds, divisions: [3, 3, 3]},
    Manifold.sphere(8)
  );
  
  // Example 2: Using Vec2 array
  const star: Vec2[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI * 2) / 10;
    const radius = i % 2 === 0 ? 30 : 15;
    star.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
  }
  const extruded = createExtrudedShape({polygon: star, height: 20});
  
  return voxels.add(extruded.translate([120, 0, 0]));
};
```

**Usage in custom applications:**

```typescript
import Module from 'manifold-3d';
import {createBoundedVoxels, createExtrudedShape} from './my-library';

const wasm = await Module();
wasm.setup();

// All functions work with custom WASM instance
const bounds = {min: [-50, -50, -50], max: [50, 50, 50]};
const voxels = createBoundedVoxels({bounds, divisions: [4, 4, 4]}, null, wasm);

const triangle: Vec2[] = [[0, 0], [30, 0], [15, 30]];
const extruded = createExtrudedShape({polygon: triangle, height: 40}, null, wasm);
```

This example shows:
- `Box` type for bounding boxes
- `Vec2` arrays for 2D polygons
- `Vec3` for 3D coordinates and divisions
- `CrossSection` for 2D operations
- All working with both manifoldCAD.org and custom contexts

### Functional Composition

The 3-parameter pattern enables powerful functional composition:

```typescript
import {layoutToGrid, cloneToHoneycomb, applyMaterial} from 'my-library';

// Curry functions for composition
const gridLayout = (opts) => (obj, ctx) => layoutToGrid(opts, obj, ctx);
const honeycomb = (opts) => (obj, ctx) => cloneToHoneycomb(opts, obj, ctx);

// Compose operations
const createPattern = (baseShape, wasm) => {
  const grid = gridLayout({rows: 2, cols: 2, spacing: 50});
  const honey = honeycomb({count: 20, radius: 30});
  
  return honey(grid(baseShape, wasm), wasm);
};

// Usage
const wasm = await Module();
wasm.setup();
const pattern = createPattern(wasm.Manifold.sphere(5), wasm);
```

### Usage Examples

```typescript
// Creating new geometry
const grid1 = layoutToGrid({rows: 3, cols: 3, spacing: 10}, null, wasm);

// Operating on existing geometry
const myShape = Manifold.cube([20, 20, 20]);
const grid2 = layoutToGrid({rows: 4, cols: 4, spacing: 25}, myShape, wasm);

// Chaining operations
const base = Manifold.sphere(5);
const pattern = cloneToHoneycomb(
  {count: 12, radius: 40},
  layoutToGrid({rows: 2, cols: 2, spacing: 15}, base, wasm),
  wasm
);
```

## Best Practices

1. **Always use optional context parameters**: Make the Manifold context optional with a sensible default so your library works seamlessly in manifoldCAD.org.

2. **Type your context parameter**: Use `ManifoldToplevel` type from `'manifold-3d'` for proper TypeScript support.

3. **Provide default exports**: When your library is run as a top-level script in manifoldCAD.org, export a default function that demonstrates your library's functionality.

4. **Document both usage patterns**: In your library's README, show examples for both manifoldCAD.org and custom applications.

5. **Don't create side effects**: Libraries should not create geometry as a side effect. Only create geometry when functions are explicitly called.

6. **Test in both contexts**: Ensure your library works both with `import {Manifold} from 'manifold-3d/manifoldCAD'` and with a custom WASM instance.

7. **Use the 3-parameter pattern for operations**: When creating functions that operate on existing geometry or support functional composition, follow the convention: `(options, target, manifoldContext)`. This enables currying and chaining.

8. **Make all parameters optional where sensible**: Allow `options` to have defaults, `target` to be null (for creation), and `manifoldContext` to be undefined (for manifoldCAD.org compatibility).

9. **Import all needed types**: Beyond `Manifold`, you may need `CrossSection`, `Mesh`, `GLTFNode`, `Vec2`, `Vec3`, and other exports from `manifold-3d/manifoldCAD`. Make sure to handle the context for all types you use.

## Custom Application Setup

Custom applications have different requirements than manifoldCAD.org:

### Build-Time Bundling

Unlike manifoldCAD.org which bundles at runtime, custom apps use standard build-time bundlers:

```bash
# Using Vite
npm install -D vite

# Using Webpack
npm install -D webpack webpack-cli

# Using Rollup
npm install -D rollup
```

Your bundler configuration should handle WASM files. For Vite, this works out of the box. For Webpack, you may need to configure asset handling.

### WASM Instance Management

In custom apps, you control the WASM lifecycle:

```typescript
// app.ts - Your custom application entry point
import Module from 'manifold-3d';
import {createTeapotCube, createGearLibrary} from 'your-manifold-library';

async function initialize() {
  // Create and initialize WASM once at app startup
  const wasm = await Module();
  wasm.setup();
  
  // Pass the WASM instance to all library functions
  const teapot = createTeapotCube(100, wasm);
  const gears = createGearLibrary(wasm);
  const gear = gears.spurGear(20, 10);
  
  // Use the geometry in your application...
}

initialize();
```

### No Worker Required

Unlike manifoldCAD.org, custom apps typically don't need a Web Worker unless you're doing heavy computation and want to keep the UI responsive. The WASM instance runs in your main thread or in a worker of your choosing.

## Publishing to npm

When publishing your library to npm, ensure your `package.json` includes:

```json
{
  "name": "your-manifold-library",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "peerDependencies": {
    "manifold-3d": "^3.3.0"
  }
}
```

Mark `manifold-3d` as a peer dependency so users can provide their own instance.

## Testing Your Library

Here's a simple test structure that validates both contexts:

```typescript
// test/teapot-cube.test.ts
import {expect, test} from 'vitest';
import Module from 'manifold-3d';
import {createTeapotCube} from '../src/teapot-cube';

test('Works with default context', async () => {
  const teapot = createTeapotCube(100);
  expect(teapot.volume()).toBeGreaterThan(0);
});

test('Works with custom WASM instance', async () => {
  const wasm = await Module();
  wasm.setup();
  
  const teapot = createTeapotCube(100, wasm);
  expect(teapot.volume()).toBeGreaterThan(0);
});
```

## Conclusion

By following these patterns, you can create libraries that work seamlessly in both the ManifoldCAD.org web app and custom applications. The key is to make the Manifold context an optional parameter, with a sensible default that falls back to the global context when available.
