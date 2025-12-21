// Library that creates shapes using manifold-3d
import Module from 'manifold-3d';

/**
 * Create a cube with a cylinder subtracted from it.
 * 
 * @param cubeSize - Size of the cube [width, depth, height]
 * @param cylinderRadius - Radius of the cylinder to subtract
 * @param cylinderHeight - Height of the cylinder (should be > cubeSize[2])
 * @returns A Manifold object with the cylinder subtracted from the cube
 */
export async function createCubeWithHole(
  cubeSize: [number, number, number] = [100, 100, 100],
  cylinderRadius: number = 30,
  cylinderHeight: number = 120
) {
  // Initialize the WASM module
  const wasm = await Module();
  wasm.setup();
  const { Manifold } = wasm;

  // Create a cube centered at origin
  const cube = Manifold.cube(cubeSize, true);

  // Create a cylinder along the Z-axis
  const cylinder = Manifold.cylinder(cylinderHeight, cylinderRadius, cylinderRadius);

  // Subtract the cylinder from the cube
  const result = cube.subtract(cylinder);

  return result;
}
