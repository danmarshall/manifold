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

## Best Practices

1. **Always use optional context parameters**: Make the Manifold context optional with a sensible default so your library works seamlessly in manifoldCAD.org.

2. **Type your context parameter**: Use `ManifoldToplevel` type from `'manifold-3d'` for proper TypeScript support.

3. **Provide default exports**: When your library is run as a top-level script in manifoldCAD.org, export a default function that demonstrates your library's functionality.

4. **Document both usage patterns**: In your library's README, show examples for both manifoldCAD.org and custom applications.

5. **Don't create side effects**: Libraries should not create geometry as a side effect. Only create geometry when functions are explicitly called.

6. **Test in both contexts**: Ensure your library works both with `import {Manifold} from 'manifold-3d/manifoldCAD'` and with a custom WASM instance.

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
