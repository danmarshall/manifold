// This example shows how to use the TeapotCube library in a custom application
// with its own WASM instance.

import Module from 'manifold-3d';
import {createTeapotCube, createTeapotLibrary} from './teapot-cube';

async function main() {
  // Create and initialize your own WASM instance
  const wasm = await Module();
  wasm.setup();

  console.log('Creating teapots with custom WASM instance...');

  // Pass the WASM instance to the library functions
  const teapot1 = createTeapotCube(100, wasm);
  console.log('Teapot 1 volume:', teapot1.volume());

  // Or use the library factory pattern
  const lib = createTeapotLibrary(wasm);
  const teapot2 = lib.teapotCube(150);
  console.log('Teapot 2 volume:', teapot2.volume());

  const teapot3 = lib.teapotCubeWithAngle(100, 45);
  console.log('Teapot 3 volume:', teapot3.volume());

  // Combine teapots
  const combined = teapot1.translate([-200, 0, 0])
      .add(teapot2.translate([0, 0, 0]))
      .add(teapot3.translate([200, 0, 0]));

  console.log('Combined volume:', combined.volume());
  console.log('Combined vertices:', combined.numVert());

  // Export as glTF, 3MF, or other format using manifold's export functions
  // (export functionality not shown in this example)

  return combined;
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default main;
