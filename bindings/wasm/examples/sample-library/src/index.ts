// Library that creates shapes using manifold-3d
// The WASM module should be initialized once by the application and passed in

// Define the minimal interface we need from Manifold
export interface ManifoldStatic {
  cube(size: [number, number, number], center?: boolean): Manifold;
  cylinder(height: number, radiusLow: number, radiusHigh?: number, circularSegments?: number): Manifold;
}

export interface Manifold {
  add(other: Manifold): Manifold;
  subtract(other: Manifold): Manifold;
  translate(v: [number, number, number] | number[]): Manifold;
  getMesh(): { vertProperties: Float32Array | number[]; triVerts: Uint32Array | number[]; };
  delete(): void;
}

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
  ManifoldClass: ManifoldStatic,
  params: CubeWithHoleParams = {}
): Manifold {
  const {
    cubeSize = [100, 100, 100],
    cylinderRadius = 30,
    cylinderHeight = 120,
    radiusScale = 1.0
  } = params;

  // Create a cube centered at origin
  const cube = ManifoldClass.cube(cubeSize, true);

  // Create a cylinder along the Z-axis with scaled radius
  const scaledRadius = cylinderRadius * radiusScale;
  const cylinder = ManifoldClass.cylinder(cylinderHeight, scaledRadius, scaledRadius);

  // Subtract the cylinder from the cube
  const result = cube.subtract(cylinder);

  return result;
}
