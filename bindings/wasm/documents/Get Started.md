# Get Started


## Installation

In your project root folder run:

```bash
npm i manifold-3d
```

To start using Manifold, import it and initialize it:

```js
import Module from 'manifold-3d';

const wasm = await Module();
wasm.setup();
const { Manifold } = wasm;
```

Intro example

```js
const {cube, sphere} = Manifold;
const box = cube([100, 100, 100], true);
const ball = sphere(60, 100);
const result = box.subtract(ball);
```

## Using with ManifoldCAD

If you want to use Manifold with the bundler and CDN imports (as in [ManifoldCAD.org](https://manifoldcad.org) or the CLI tool), you can import from `manifold-3d/manifoldCAD`:

```typescript
import {Manifold} from 'manifold-3d/manifoldCAD';

const box = Manifold.cube([100, 100, 100], true);
const ball = Manifold.sphere(60, 100);
const result = box.subtract(ball);

export default result;
```

## Next steps

- **[JavaScript/TypeScript Usage Guide](./JavaScript-TypeScript-Usage.md)** - Learn about using dependencies, imports, bundling, and more
- **[Three.js Integration Example](https://github.com/elalish/manifold/blob/master/bindings/wasm/examples/three.ts)** - Visualize Manifold meshes with Three.js
- **[API Documentation](https://manifoldcad.org/jsdocs)** - Complete TypeScript API reference
- **[Example Models](https://github.com/elalish/manifold/tree/master/bindings/wasm/test/examples)** - See how to create complex models 