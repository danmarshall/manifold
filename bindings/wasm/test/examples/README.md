# ManifoldCAD Examples

This directory contains example models demonstrating various features of the Manifold library when used with JavaScript/TypeScript.

## Running Examples

### Using the CLI

You can run any of these examples using the `manifold-cad` command-line tool:

```bash
# From the bindings/wasm directory
npx manifold-cad test/examples/intro.mjs output.glb

# With bundling (supports imports and TypeScript)
npx manifold-cad test/examples/using-npm-dependencies.ts output.glb
```

### Using the Web Editor

1. Visit [ManifoldCAD.org](https://manifoldcad.org)
2. Copy the code from any `.ts` or `.mjs` file
3. Paste it into the editor
4. Click "Run" to see your model

## Example Categories

### Basic Examples
- **intro.mjs** - Introduction to basic shapes and operations
- **heart.mjs** - Create a heart shape using bezier curves
- **scallop.mjs** - Scalloped edges demonstration

### Using Libraries
- **involute-gear-library.ts** - Reusable gear creation library
- **gear-bearing.ts** - Complex gear assembly using the gear library

### Using npm Dependencies
- **using-npm-dependencies.ts** - Demonstrates importing and using gl-matrix for vector math
- **geometry-library.ts** - Reusable geometry functions (torus, rounded box, star, etc.)
- **using-geometry-library.ts** - Example using the geometry library

### Advanced Techniques
- **gyroid-module.ts** - Signed Distance Function (SDF) demonstration
- **menger-sponge.mjs** - Recursive fractal geometry
- **voronoi.mjs** - Voronoi diagram in 3D
- **torus-knot.mjs** - Parametric torus knot

### Animation & Visualization
- **import-manifold.ts** - Demonstrates importing and exporting models

## Key Concepts Demonstrated

### 1. Importing from manifold-3d/manifoldCAD
```typescript
import {Manifold, CrossSection, Mesh} from 'manifold-3d/manifoldCAD';
```

### 2. Using npm packages
```typescript
import {vec3, mat4} from 'gl-matrix';
```

### 3. Creating reusable libraries
```typescript
// In library.ts
export function myFunction() { ... }

// In main.ts
import {myFunction} from './library.ts';
```

### 4. Exporting models
```typescript
// Simple export
export default myManifold;

// Or as a function (for preview in libraries)
export default () => myManifold;
```

## Documentation

For comprehensive documentation on using JavaScript/TypeScript with Manifold, see:
- [JavaScript/TypeScript Usage Guide](../documents/JavaScript-TypeScript-Usage.md)
- [Get Started Guide](../documents/Get%20Started.md)
- [API Documentation](https://manifoldcad.org/jsdocs)

## Contributing

When adding new examples:
1. Use clear, descriptive names
2. Add comments explaining key concepts
3. Follow the existing code style
4. Export a default model for preview
5. Update this README with your example
