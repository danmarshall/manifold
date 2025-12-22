// Library that creates shapes using manifold-3d
import Module from 'manifold-3d';

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
 * @param params - Configuration parameters
 * @returns A Manifold object with the cylinder subtracted from the cube
 */
export async function createCubeWithHole(
  params: CubeWithHoleParams = {}
) {
  const {
    cubeSize = [100, 100, 100],
    cylinderRadius = 30,
    cylinderHeight = 120,
    radiusScale = 1.0
  } = params;

  // Initialize the WASM module
  const wasm = await Module();
  wasm.setup();
  const { Manifold } = wasm;

  // Create a cube centered at origin
  const cube = Manifold.cube(cubeSize, true);

  // Create a cylinder along the Z-axis with scaled radius
  const scaledRadius = cylinderRadius * radiusScale;
  const cylinder = Manifold.cylinder(cylinderHeight, scaledRadius, scaledRadius);

  // Subtract the cylinder from the cube
  const result = cube.subtract(cylinder);

  return result;
}
