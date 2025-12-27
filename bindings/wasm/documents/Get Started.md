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

## Creating Reusable Libraries

If you want to create libraries that work in both manifoldCAD.org and custom applications, see our [Creating Reusable Libraries](./Creating%20Reusable%20Libraries.md) guide.

**Simple functions** (2 parameters):
```js
export function createMyShape(size, manifoldContext) {
  const M = manifoldContext?.Manifold ?? Manifold;
  const {cube, sphere} = M;
  // ... create your shape
}
```

**Operations on geometry** (3 parameters - recommended):
```js
export function layoutToGrid(options, target, manifoldContext) {
  const M = manifoldContext?.Manifold ?? Manifold;
  const shape = target ?? M.cube([10, 10, 10]);
  // ... arrange in grid
}
```

This pattern allows your library to work in both contexts:
- In manifoldCAD.org: `createMyShape(100)` or `layoutToGrid({rows: 3}, myShape)`
- In custom apps: `createMyShape(100, wasm)` or `layoutToGrid({rows: 3}, myShape, wasm)`

## Next steps

In order to visualize Manifold mesh using Three.js library please check out our example [here](https://github.com/elalish/manifold/blob/master/bindings/wasm/examples/three.ts) 