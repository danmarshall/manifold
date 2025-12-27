# Solution: Context-Agnostic Library Patterns

## Problem Summary

As described in the issue, there's a challenge when creating reusable TypeScript libraries for Manifold:

1. **ManifoldCAD.org** uses: `import {Manifold} from 'manifold-3d/manifoldCAD'` which provides a global singleton WASM instance
2. **Custom applications** create their own WASM instance: 
   ```typescript
   const wasm = await Module();
   wasm.setup();
   const { Manifold } = wasm;
   ```

If a library like "TeapotCube" imports from `'manifold-3d/manifoldCAD'`, it cannot work in custom applications that create their own WASM instances, because it's tied to the global singleton.

## Solution

The solution is to make library functions accept an **optional Manifold context parameter**. This allows the same library to work in both contexts. We provide multiple patterns depending on the library's needs.

### Pattern 1: Simple 2-Parameter Pattern (Basic Creation)

For simple creation functions:

```typescript
import {Manifold} from 'manifold-3d/manifoldCAD';
import type {ManifoldToplevel} from 'manifold-3d';

export function createTeapotCube(
  size: number = 100,
  manifoldContext?: ManifoldToplevel
) {
  const M = manifoldContext?.Manifold ?? Manifold;
  const {cube, cylinder} = M;
  
  const body = cube([size, size, size], true);
  const spout = cylinder(size * 0.15, size * 0.4)
    .rotate([0, 90, 0])
    .translate([size * 0.5, 0, size * 0.2]);
  
  return body.add(spout);
}
```

### Pattern 2: 3-Parameter Convention (Functional Composition)

For functions that operate on existing geometry or support functional programming patterns:

```typescript
import {Manifold} from 'manifold-3d/manifoldCAD';
import type {ManifoldToplevel} from 'manifold-3d';

interface GridOptions {
  rows: number;
  cols: number;
  spacing: number;
}

export function layoutToGrid(
  options: GridOptions,
  target?: Manifold | null,
  manifoldContext?: ManifoldToplevel
) {
  const M = manifoldContext?.Manifold ?? Manifold;
  const {cube} = M;
  
  // Use target or create default shape
  const shape = target ?? cube([10, 10, 10]);
  
  let result = shape;
  for (let row = 0; row < options.rows; row++) {
    for (let col = 0; col < options.cols; col++) {
      if (row === 0 && col === 0) continue;
      result = result.add(shape.translate([
        col * options.spacing,
        row * options.spacing,
        0
      ]));
    }
  }
  return result;
}
```

**3-Parameter Convention:**
1. **options**: Configuration object
2. **target**: Optional object to operate on (null for creation)
3. **manifoldContext**: Optional WASM instance (type: `ManifoldToplevel`)

**Type of 3rd parameter:** The `manifoldContext` parameter has type `ManifoldToplevel` which includes:
- `Manifold`, `CrossSection`, `Mesh` - Core classes
- `triangulate`, `setup()` - Utility functions
- Level of detail functions

**Using multiple types (Box, Vec2, Vec3, etc.):**

```typescript
import type {ManifoldToplevel, Box, Vec2, Vec3} from 'manifold-3d';
import {Manifold, CrossSection} from 'manifold-3d/manifoldCAD';

export function createBoundedVoxels(
  options: {bounds: Box; divisions?: Vec3},
  target?: Manifold | null,
  manifoldContext?: ManifoldToplevel
) {
  const M = manifoldContext?.Manifold ?? Manifold;
  const {bounds, divisions = [3, 3, 3]} = options;
  
  // Calculate from Box and Vec3
  const size: Vec3 = [
    (bounds.max[0] - bounds.min[0]) / divisions[0],
    (bounds.max[1] - bounds.min[1]) / divisions[1],
    (bounds.max[2] - bounds.min[2]) / divisions[2]
  ];
  // ... implementation
}

export function createExtrudedShape(
  options: {polygon: Vec2[]; height: number},
  target?: Manifold | null,
  manifoldContext?: ManifoldToplevel
) {
  const CS = manifoldContext?.CrossSection ?? CrossSection;
  const profile = new CS(options.polygon); // Vec2 array
  return profile.extrude(options.height);
}
```

This enables currying and composition:
```typescript
const lib = createLayoutLibrary(wasm);
const result = lib.circle({count: 6, radius: 50})(
  lib.grid({rows: 3, cols: 3, spacing: 25})(baseShape)
);
```

### Usage in ManifoldCAD.org

```typescript
import {createTeapotCube, layoutToGrid} from './my-library';

// Simple creation - uses global context
const teapot = createTeapotCube(100);

// Operations - last parameter omitted
const grid = layoutToGrid({rows: 3, cols: 3, spacing: 10}, teapot);

export default grid;
```

### Usage in Custom Applications

```typescript
import Module from 'manifold-3d';
import {createTeapotCube, layoutToGrid} from './my-library';

const wasm = await Module();
wasm.setup();

// Pass WASM instance as last parameter
const teapot = createTeapotCube(100, wasm);
const grid = layoutToGrid({rows: 3, cols: 3, spacing: 10}, teapot, wasm);
```

## Key Benefits

1. **Single codebase**: One library works in both contexts
2. **Backward compatible**: Existing code in manifoldCAD.org continues to work
3. **Type safe**: Full TypeScript support with proper types
4. **Flexible**: Libraries can be used in web apps, Node.js, or anywhere
5. **No breaking changes**: Optional parameters mean existing code doesn't break
6. **Functional composition**: 3-parameter pattern enables currying and chaining

## Available Patterns

### Pattern 1: Simple 2-Parameter (Basic Creation)
Best for simple creation functions that don't need configuration objects.
- Parameters: `(value, manifoldContext?)`
- Example: `createTeapotCube(size, wasm?)`

### Pattern 2: Factory Pattern
Best for libraries with many related functions.
- Create a factory that binds all functions to a context
- Example: `createGearLibrary(wasm?)` returns object with gear functions

### Pattern 3: ES Module Exports
Best for simple libraries with a few independent functions.
- Multiple exports, each with optional context
- Example: `createRoundedBox(size, radius, wasm?)`

### Pattern 4: 3-Parameter Convention (Recommended for Operations)
Best for functions that operate on existing geometry or support composition.
- Parameters: `(options, target?, manifoldContext?)`
- Enables currying: `layoutToGrid(opts)(shape)(wasm)`
- Example: `layoutToGrid({rows: 3}, myShape, wasm)`

## manifoldCAD Exports: What Needs Context?

Libraries can use any export from `manifold-3d/manifoldCAD`. **Crucially**, they fall into two categories:

### WASM Types (need `manifoldContext` parameter)
These come from the WASM module (`ManifoldToplevel`):
- Core: `Manifold`, `CrossSection`, `Mesh`
- Functions: `triangulate`, `setup()`
- Level of detail: `setMinCircularAngle`, `setMinCircularEdgeLength`, `setCircularSegments`, `getCircularSegments`, `resetToCircularDefaults`

### JavaScript Utilities (context-independent)
These are JavaScript wrappers that work with any Manifold instance - import directly:
- GLTF: `GLTFNode`, `GLTFMaterial`, `GLTFAttribute`, `VisualizationGLTFNode`, `getGLTFNodes`
- Material/Debug: `setMaterial`, `show`, `only`
- Animation: `setMorphStart`, `setMorphEnd`
- Import: `importManifold`, `importModel`
- Types: `Box`, `Vec2`, `Vec3`, `Vec4` (TypeScript types only)

**Example using both:**
```typescript
import {Manifold, GLTFNode} from 'manifold-3d/manifoldCAD';
import type {ManifoldToplevel, Vec3} from 'manifold-3d';

export function createColoredCube(
  options: {size: Vec3},
  target?: Manifold | null,
  manifoldContext?: ManifoldToplevel
) {
  // WASM type - needs context
  const M = manifoldContext?.Manifold ?? Manifold;
  const shape = M.cube(options.size);
  
  // JavaScript utility - no context needed
  const node = new GLTFNode();
  node.manifold = shape;
  return node;
}
```

## Files Added

1. **Documentation**: `bindings/wasm/documents/Creating Reusable Libraries.md` - Comprehensive guide with all 4 patterns and examples
2. **Example Libraries**: 
   - `bindings/wasm/test/examples/teapot-cube.ts` - Basic 2-parameter pattern
   - `bindings/wasm/test/examples/simple-shapes-library.ts` - Multiple simple functions
   - `bindings/wasm/test/examples/layout-library.ts` - 3-parameter pattern with functional composition
3. **Tests**: `bindings/wasm/test/reusable-library.test.ts` - Validates patterns work in both contexts
4. **Usage Examples**: 
   - `bindings/wasm/test/examples/use-teapot-cube.mjs` - For manifoldCAD.org
   - `bindings/wasm/test/examples/use-teapot-custom-app.mjs` - For custom apps

## Updated Documentation

- Updated `bindings/wasm/README.md` to link to the new guide
- Updated `bindings/wasm/documents/Get Started.md` with library pattern overview
- Updated `SOLUTION_SUMMARY.md` with all patterns

## Testing

The test suite (`reusable-library.test.ts`) validates:
- Libraries work with default context (manifoldCAD.org pattern)
- Libraries work with custom WASM instances (custom app pattern)
- Both contexts produce identical geometric results
- Factory pattern for complex libraries works in both contexts

## Functional Composition

The 3-parameter pattern enables powerful functional programming:

```typescript
// Curry functions for composition
const gridLayout = (opts) => (obj, ctx) => layoutToGrid(opts, obj, ctx);
const circularLayout = (opts) => (obj, ctx) => layoutToCircle(opts, obj, ctx);

// Compose operations
const pattern = circularLayout({count: 6, radius: 50})(
  gridLayout({rows: 2, cols: 2, spacing: 20})(baseShape, wasm),
  wasm
);
```

All patterns follow the same core principle: accept an optional Manifold context parameter with a sensible default.
