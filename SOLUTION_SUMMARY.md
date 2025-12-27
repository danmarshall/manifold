# Solution: Context-Agnostic Library Pattern

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

The solution is to make library functions accept an **optional Manifold context parameter**. This allows the same library to work in both contexts:

### Example Library Function

```typescript
import {Manifold} from 'manifold-3d/manifoldCAD';
import type {ManifoldToplevel} from 'manifold-3d';

export function createTeapotCube(
  size: number = 100,
  manifoldContext?: ManifoldToplevel  // Optional parameter
) {
  // Use provided context or fall back to default import
  const M = manifoldContext?.Manifold ?? Manifold;
  const {cube, cylinder} = M;
  
  // Create your geometry using M
  const body = cube([size, size, size], true);
  const spout = cylinder(size * 0.15, size * 0.4)
    .rotate([0, 90, 0])
    .translate([size * 0.5, 0, size * 0.2]);
  
  return body.add(spout);
}
```

### Usage in ManifoldCAD.org

```typescript
import {createTeapotCube} from './teapot-cube';

// No second parameter needed - uses global context
const teapot = createTeapotCube(100);
export default teapot;
```

### Usage in Custom Applications

```typescript
import Module from 'manifold-3d';
import {createTeapotCube} from './teapot-cube';

const wasm = await Module();
wasm.setup();

// Pass your custom WASM instance as the second parameter
const teapot = createTeapotCube(100, wasm);
```

## Key Benefits

1. **Single codebase**: One library works in both contexts
2. **Backward compatible**: Existing code in manifoldCAD.org continues to work
3. **Type safe**: Full TypeScript support with proper types
4. **Flexible**: Libraries can be used in web apps, Node.js, or anywhere
5. **No breaking changes**: Optional parameter means existing code doesn't break

## Files Added

1. **Documentation**: `bindings/wasm/documents/Creating Reusable Libraries.md` - Comprehensive guide with multiple patterns and examples
2. **Example Library**: `bindings/wasm/test/examples/teapot-cube.ts` - Full implementation of TeapotCube demonstrating the pattern
3. **Simple Example**: `bindings/wasm/test/examples/simple-shapes-library.ts` - Simpler example for quick reference
4. **Tests**: `bindings/wasm/test/reusable-library.test.ts` - Validates the pattern works in both contexts
5. **Usage Examples**: 
   - `bindings/wasm/test/examples/use-teapot-cube.mjs` - For manifoldCAD.org
   - `bindings/wasm/test/examples/use-teapot-custom-app.mjs` - For custom apps

## Updated Documentation

- Updated `bindings/wasm/README.md` to link to the new guide
- Updated `bindings/wasm/documents/Get Started.md` with library pattern overview

## Testing

The test suite (`reusable-library.test.ts`) validates:
- Libraries work with default context (manifoldCAD.org pattern)
- Libraries work with custom WASM instances (custom app pattern)
- Both contexts produce identical geometric results
- Factory pattern for complex libraries works in both contexts

## Alternative Patterns

The documentation also covers:
- **Factory Pattern**: For libraries with many functions, create a factory that binds all functions to a context
- **ES Module Exports**: For simple libraries with just a few functions

All patterns follow the same core principle: accept an optional Manifold context parameter with a sensible default.
