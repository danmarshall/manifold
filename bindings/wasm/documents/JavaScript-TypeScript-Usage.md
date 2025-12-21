# JavaScript and TypeScript Usage in Manifold

This document explains how JavaScript and TypeScript code is used to create 3D models in Manifold, including how code is executed, how to use dependencies, and the different formats available.

## Table of Contents
- [How Code is Executed](#how-code-is-executed)
- [Code Formats](#code-formats)
- [Using Dependencies](#using-dependencies)
- [Examples](#examples)
- [CLI Usage](#cli-usage)
- [Web Editor Usage](#web-editor-usage)

## How Code is Executed

Manifold processes JavaScript/TypeScript code in the following way:

### 1. Code Input
Your JavaScript or TypeScript code is provided as a string. This can happen in several ways:
- **Web Editor**: [ManifoldCAD.org](https://manifoldcad.org) takes your code from the Monaco editor
- **CLI**: The `manifold-cad` command-line tool reads code from a file
- **Node.js**: The `evaluate()` function accepts a code string directly

### 2. Bundling Process
Before execution, your code goes through a bundling step using [esbuild](https://esbuild.github.io/):

```
Your JS/TS Code → esbuild Bundler → Bundled CommonJS → Execution
```

The bundler:
- Transpiles TypeScript to JavaScript
- Resolves and bundles imports from npm packages
- Converts ES modules to CommonJS format
- Generates source maps for debugging
- Injects the ManifoldCAD runtime context

### 3. Execution
The bundled code is executed using JavaScript's `AsyncFunction` constructor (similar to `eval()` but async):
- The code runs in a controlled context with access to Manifold classes
- Global variables like `Manifold`, `CrossSection`, `Mesh` are available
- The default export becomes your 3D model

## Code Formats

### Direct Format (No Bundling)
You can skip the bundling step if you've already bundled your code:

**CLI:**
```bash
manifold-cad --no-bundle prebundled-file.js output.glb
```

**Node.js:**
```javascript
import {evaluate} from 'manifold-3d/lib/worker.js';
const doc = await evaluate(bundledCode, {doNotBundle: true});
```

### Standard Format (With Bundling)
This is the default and recommended format. Your code can use:
- TypeScript syntax
- ES6 import/export statements
- npm packages (via CDN or local)
- Top-level await

## Using Dependencies

### Method 1: CDN Imports (Web & CLI)
The easiest way to use npm packages is through CDN imports. The bundler will automatically fetch packages from a CDN.

**Available CDNs:**
- `jsDelivr` (default): `https://cdn.jsdelivr.net/npm/`
- `esm.sh`: `https://esm.sh/`
- `skypack`: `https://cdn.skypack.dev/`

**Example - Using gl-matrix:**
```typescript
import {vec3, mat4} from 'gl-matrix';
import {Manifold} from 'manifold-3d/manifoldCAD';

const position = vec3.fromValues(0, 0, 10);
const box = Manifold.cube([10, 10, 10]);

export default box.translate(position);
```

**CLI with specific CDN:**
```bash
manifold-cad --jscdn esm.sh model.ts output.glb
```

### Method 2: Node.js Local Dependencies (CLI Only)
When using the CLI tool in a Node.js project, you can install and use npm packages directly:

**Setup:**
```bash
# Create a project
mkdir my-manifold-project
cd my-manifold-project
npm init -y

# Install dependencies
npm install manifold-3d gl-matrix

# Create your model file
cat > model.ts << 'EOF'
import {vec3} from 'gl-matrix';
import {Manifold} from 'manifold-3d/manifoldCAD';

const position = vec3.fromValues(5, 5, 5);
const sphere = Manifold.sphere(10);

export default sphere.translate(position);
EOF

# Build your model
npx manifold-cad model.ts output.glb
```

The bundler will resolve local `node_modules` first, then fall back to CDN if not found.

### Method 3: Creating Reusable Libraries
You can create your own libraries and import them:

**my-library.ts:**
```typescript
import {Manifold, CrossSection} from 'manifold-3d/manifoldCAD';

export function createGear(teeth: number, height: number) {
  // ... gear creation logic
  return gear;
}
```

**main.ts:**
```typescript
import {createGear} from './my-library.ts';
import {Manifold} from 'manifold-3d/manifoldCAD';

const gear1 = createGear(15, 5);
const gear2 = createGear(20, 5).translate([30, 0, 0]);

export default gear1.add(gear2);
```

### Method 4: Importing from URL
You can import libraries directly from URLs:

```typescript
import {someFunction} from 'https://cdn.jsdelivr.net/npm/my-package/+esm';
```

## Examples

### Example 1: Simple Model (No Dependencies)
```typescript
import {Manifold} from 'manifold-3d/manifoldCAD';

const box = Manifold.cube([100, 100, 100], true);
const ball = Manifold.sphere(60, 100);
const result = box.subtract(ball);

export default result;
```

### Example 2: Using External Math Library
```typescript
import {Manifold} from 'manifold-3d/manifoldCAD';
import {vec3} from 'gl-matrix';

function createPattern(count: number) {
  const sphere = Manifold.sphere(5);
  let result = sphere;
  
  for (let i = 1; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const pos = vec3.fromValues(
      Math.cos(angle) * 20,
      Math.sin(angle) * 20,
      0
    );
    result = result.add(sphere.translate(pos));
  }
  
  return result;
}

export default createPattern(8);
```

### Example 3: Using a Geometry Library
```typescript
import {Manifold, Mesh} from 'manifold-3d/manifoldCAD';
// Example with a hypothetical geometry utilities package
import {voronoi3D} from 'voronoi-3d-utils';

// Create a voronoi structure
const points = Array.from({length: 20}, () => [
  Math.random() * 100,
  Math.random() * 100,
  Math.random() * 100
]);

// This is pseudocode - actual implementation depends on the library
const voronoiData = voronoi3D(points);
const mesh = new Mesh({
  vertPos: voronoiData.vertices,
  triVerts: voronoiData.faces
});

export default new Manifold(mesh);
```

### Example 4: Creating a Library
**involute-gear.ts** (library):
```typescript
import {CrossSection, getCircularSegments} from 'manifold-3d/manifoldCAD';

export function spurGear(teeth: number, height: number, options = {}) {
  const {
    circularPitch = 10,
    pressureDeg = 20,
    depthRatio = 0.75,
    clearance = 0,
  } = options;
  
  // ... gear creation logic
  const profile = createGearProfile(teeth, options);
  return profile.extrude(height);
}

function createGearProfile(teeth: number, options: any) {
  // ... implementation
  return CrossSection.circle(10);
}

// Default export for testing/preview
export default () => spurGear(15, 5);
```

**main.ts** (uses the library):
```typescript
import {spurGear} from './involute-gear.ts';
import {Manifold} from 'manifold-3d/manifoldCAD';

const gear1 = spurGear(15, 5, {circularPitch: 5});
const gear2 = spurGear(20, 5, {circularPitch: 5})
  .translate([25, 0, 0]);

export default gear1.add(gear2);
```

## CLI Usage

The `manifold-cad` CLI tool provides full bundling support:

```bash
# Basic usage with bundling (default)
manifold-cad input.ts output.glb

# Disable bundling (code must be pre-bundled)
manifold-cad --no-bundle bundled.js output.glb

# Use a specific CDN for npm packages
manifold-cad --jscdn esm.sh input.ts output.glb

# Output to different formats
manifold-cad input.ts output.3mf
```

**Full example workflow:**
```bash
# 1. Create a project
mkdir my-model
cd my-model

# 2. Initialize npm (optional, for local dependencies)
npm init -y
npm install gl-matrix

# 3. Create your model
cat > gear.ts << 'EOF'
import {Manifold} from 'manifold-3d/manifoldCAD';

function createGear(teeth: number) {
  // Simplified gear
  return Manifold.cylinder(20, 10, teeth * 2);
}

export default createGear(15);
EOF

# 4. Build it
npx manifold-cad gear.ts gear.glb

# 5. View the result
# Open gear.glb in your 3D viewer
```

## Web Editor Usage

[ManifoldCAD.org](https://manifoldcad.org) provides a web-based editor with:

- **Automatic bundling**: All imports are automatically resolved via CDN
- **TypeScript support**: Full TypeScript intellisense and type checking
- **Auto-completion**: Manifold API auto-completion via Monaco editor
- **Instant preview**: See your model update in real-time
- **Examples**: Built-in examples showing various techniques

**In the web editor:**
1. Write your code using `import` statements for dependencies
2. The editor automatically bundles with jsDelivr CDN
3. Click Run to see your model
4. Export as GLB or 3MF

## Technical Details

### Global Context
When your code runs, these are available globally (without import):
```typescript
// Top-level scripts only:
setCircularSegments(n)
setMinCircularAngle(degrees)
setMinCircularEdgeLength(mm)
setAnimationDuration(seconds)
setAnimationFPS(fps)
```

### ManifoldCAD Module
Import from `'manifold-3d/manifoldCAD'` to get:
```typescript
// Core classes
Manifold, Mesh, CrossSection

// Functions
triangulate()

// Scene building (top-level only)
show(), only(), setMaterial()
GLTFNode, GLTFMaterial, getGLTFNodes()

// Import utilities
importModel(), importManifold()

// Getters for quality settings
getCircularSegments(), getMinCircularAngle(), getMinCircularEdgeLength()
```

### Source Maps
The bundler generates inline source maps, so:
- Error messages show the original line numbers
- Stack traces reference your source code
- Debugging works in browser dev tools (with DWARF extension for WASM)

### Memory Management
**Important**: Manifold objects must be manually deleted in web environments:
```typescript
import {Manifold} from 'manifold-3d/manifoldCAD';

const box = Manifold.cube([10, 10, 10]);
const sphere = Manifold.sphere(5);
const result = box.subtract(sphere);

// Clean up intermediate objects
box.delete();
sphere.delete();

export default result;
// result.delete() is called automatically by the evaluator
```

## Limitations

### Web Editor Limitations
- Cannot access Node.js built-in modules (fs, path, etc.)
- Cannot use packages with native dependencies
- Large dependencies may slow down bundling
- No file system access (except for import/export)

### CLI Limitations
- Bundling requires network access for CDN imports (unless using local modules)
- Some packages may not be compatible with the ES module format
- C++/native addons are not supported

## Troubleshooting

### "Module not found"
**Problem**: Import fails to resolve
**Solution**: 
- Ensure the package name is correct
- Try a different CDN: `--jscdn esm.sh`
- Install locally: `npm install package-name`

### "ReferenceError: Manifold is not defined"
**Problem**: Forgot to import Manifold classes
**Solution**: Add import statement:
```typescript
import {Manifold} from 'manifold-3d/manifoldCAD';
```

### "exports is not defined"
**Problem**: Code is in ES module format but bundler expects CommonJS
**Solution**: This should not happen with the bundler. If using `--no-bundle`, ensure your code is properly bundled.

### Bundling is slow
**Problem**: Large dependencies take time to download
**Solution**:
- Use local dependencies with npm install
- Cache is used after first download
- Consider using lighter-weight alternatives

## Best Practices

1. **Use TypeScript**: Better type safety and IDE support
2. **Modular code**: Split complex models into multiple files
3. **Reusable libraries**: Create functions for repeated patterns
4. **Clean code**: Delete intermediate Manifold objects in tight loops
5. **Version pins**: Specify exact versions in CDN imports for reproducibility
   ```typescript
   import {something} from 'package-name@1.2.3';
   ```
6. **Test locally**: Use the CLI to test before deploying to web
7. **Source control**: Keep your `.ts`/`.js` files in git, not the bundled output

## Further Reading

- [Manifold API Documentation](https://manifoldcad.org/jsdocs)
- [C++ Documentation](https://manifoldcad.org/docs/html/classmanifold_1_1_manifold.html)
- [Example Models](https://github.com/elalish/manifold/tree/master/bindings/wasm/test/examples)
- [esbuild Documentation](https://esbuild.github.io/)
