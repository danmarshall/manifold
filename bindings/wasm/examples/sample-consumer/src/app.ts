// Application that consumes the my-manifold-shapes library
import { createCubeWithHole, CubeWithHoleParams } from 'my-manifold-shapes';
import Module from 'manifold-3d';

export interface SceneParams {
  /**
   * Scale factor for the library's cylinder radius (0.1 to 2.0)
   */
  libraryRadiusScale?: number;
  /**
   * Number of spheres to create in a ring (1 to 12)
   */
  sphereCount?: number;
}

/**
 * Create a scene that combines shapes from the library with custom shapes
 */
export async function createScene(params: SceneParams = {}) {
  const {
    libraryRadiusScale = 1.0,
    sphereCount = 6
  } = params;

  // Initialize the WASM module
  const wasm = await Module();
  wasm.setup();
  const { Manifold } = wasm;

  // Use the library to create a cube with hole
  const cubeWithHole = await createCubeWithHole({
    cubeSize: [100, 100, 100],
    cylinderRadius: 30,
    cylinderHeight: 120,
    radiusScale: libraryRadiusScale
  });

  // Create our own custom shapes
  // Create a ring of small spheres around the cube
  const sphereRadius = 10;
  const ringRadius = 80;
  
  let spheres = Manifold.sphere(sphereRadius, 32);
  spheres = spheres.translate([ringRadius, 0, 0]);

  // Add more spheres in a circle
  for (let i = 1; i < sphereCount; i++) {
    const angle = (i / sphereCount) * Math.PI * 2;
    const x = Math.cos(angle) * ringRadius;
    const y = Math.sin(angle) * ringRadius;
    const sphere = Manifold.sphere(sphereRadius, 32).translate([x, y, 0]);
    spheres = spheres.add(sphere);
  }

  // Combine the library shape with our custom shapes
  const scene = cubeWithHole.add(spheres);

  return scene;
}

async function main() {
  console.log('Creating a scene with shapes from library and custom shapes...');

  try {
    const scene = await createScene({
      libraryRadiusScale: 1.0,
      sphereCount: 6
    });

    console.log('Scene created successfully!');
    console.log('Number of vertices:', scene.numVert());
    console.log('Number of triangles:', scene.numTri());

    // Clean up
    scene.delete();

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run main if this is the entry point
// In Node.js with ES modules, check if this module is being run directly
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  main();
}
