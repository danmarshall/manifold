// Application that consumes the my-manifold-shapes library
import { createCubeWithHole, CubeWithHoleParams } from 'my-manifold-shapes';
import Module from 'manifold-3d';

// Type for Manifold class constructor
type ManifoldConstructor = {
  cube: (size: [number, number, number], center?: boolean) => ManifoldInstance;
  cylinder: (height: number, radiusLow: number, radiusHigh?: number, circularSegments?: number) => ManifoldInstance;
  sphere: (radius: number, circularSegments?: number) => ManifoldInstance;
  [key: string]: any;
};

// Type for Manifold instance
type ManifoldInstance = {
  add: (other: ManifoldInstance) => ManifoldInstance;
  subtract: (other: ManifoldInstance) => ManifoldInstance;
  translate: (v: [number, number, number] | number[]) => ManifoldInstance;
  [key: string]: any;
};

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
 * Create a scene that combines shapes from the library with custom shapes.
 * 
 * The Manifold class should be passed in from the caller who has already
 * initialized the WASM module. This ensures only one WASM instance across
 * the entire application.
 * 
 * @param Manifold - The Manifold class from an initialized WASM module
 * @param params - Scene configuration parameters
 * @returns A Manifold object containing the complete scene
 */
export function createScene(
  Manifold: ManifoldConstructor,
  params: SceneParams = {}
): ManifoldInstance {
  const {
    libraryRadiusScale = 1.0,
    sphereCount = 6
  } = params;

  // Use the library to create a cube with hole
  // Pass the Manifold class to avoid re-initializing WASM
  const cubeWithHole = createCubeWithHole(Manifold, {
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
