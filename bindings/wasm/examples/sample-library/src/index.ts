import { Manifold } from 'manifold-3d/lib/manifoldCAD.js'

// Library that creates shapes using manifold-3d
// The WASM module should be initialized once by the application and passed in

// Type representing the static Manifold class with constructor methods

export interface CubeWithHoleParams {
  cubeSize?: [number, number, number];
  cylinderRadius?: number;
  cylinderHeight?: number;
  /**
   * Scale factor for the cylinder radius (0.1 to 2.0)
   * This parameter can be controlled by a slider in UI
   */
  radiusScale?: number;
}

/**
 * Create a cube with a cylinder subtracted from it.
 * 
 * The Manifold class should be passed in from the caller who has already
 * initialized the WASM module. This avoids multiple WASM initializations.
 * 
 * @param ManifoldClass - The Manifold class from an initialized WASM module
 * @param params - Configuration parameters
 * @returns A Manifold object with the cylinder subtracted from the cube
 */
export function createCubeWithHole(
  ManifoldClass: typeof Manifold,
  params: CubeWithHoleParams = {}
) {
  const {
    cubeSize = [100, 100, 100],
    cylinderRadius = 30,
    cylinderHeight = 150, // Taller than cube to ensure it goes all the way through
    radiusScale = 1.0
  } = params;

  // Create a cube centered at origin
  const cube = ManifoldClass.cube(cubeSize, true);

  // Create a cylinder along the Z-axis with scaled radius
  // Make it taller than the cube so it goes all the way through
  const scaledRadius = cylinderRadius * radiusScale;
  const cylinder = ManifoldClass.cylinder(cylinderHeight, scaledRadius, scaledRadius);
  // Subtract the cylinder from the cube
  const result = cube.subtract(cylinder);

  return result;
}
