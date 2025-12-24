// Application that consumes the my-manifold-shapes library
import { createCubeWithHole } from 'my-manifold-shapes';

export interface SceneParams {
  /**
   * Scale factor for the library's cylinder radius (0.1 to 2.0)
   */
  libraryRadiusScale?: number;
  /**
   * Edge length for the rounded frame (20 to 150)
   */
  edgeLength?: number;
}

/**
 * Create a rounded frame (like the rounded-frame example).
 * A frame made of rounded edges and corners.
 * 
 * @param ManifoldClass - The Manifold class
 * @param edgeLength - Length of each edge
 * @param radius - Radius of corners and edges
 * @param circularSegments - Number of segments for circles
 * @returns A Manifold object representing the rounded frame
 */
function roundedFrame(
  ManifoldClass: any,
  edgeLength: number,
  radius: number,
  circularSegments: number = 0
) {
  const edge = ManifoldClass.cylinder(edgeLength, radius, -1, circularSegments);
  const corner = ManifoldClass.sphere(radius, circularSegments);

  const edge1 = corner.add(edge).rotate([-90, 0, 0]).translate([
    -edgeLength / 2, -edgeLength / 2, 0
  ]);

  const edge2 = edge1.add(edge1.rotate([0, 0, 180]))
    .add(edge.translate([-edgeLength / 2, -edgeLength / 2, 0]));

  const edge4 = edge2.add(edge2.rotate([0, 0, 90])).translate([
    0, 0, -edgeLength / 2
  ]);

  return edge4.add(edge4.rotate([180, 0, 0]));
}

/**
 * Create a scene that combines shapes from the library with custom shapes.
 * 
 * The Manifold class should be passed in from the caller who has already
 * initialized the WASM module. This ensures only one WASM instance across
 * the entire application.
 * 
 * @param ManifoldClass - The Manifold class from an initialized WASM module
 * @param GLTFNodeClass - The GLTFNode class from manifold-3d
 * @param params - Scene configuration parameters
 * @returns An array of GLTFNodes with materials for color support
 */
export function createScene(
  ManifoldClass: any,
  GLTFNodeClass: any,
  params: SceneParams = {}
) {
  const {
    libraryRadiusScale = 1.0,
    edgeLength = 80
  } = params;

  // Use the library to create a cube with hole
  // Pass the Manifold class to avoid re-initializing WASM
  const cubeWithHole = createCubeWithHole(ManifoldClass, {
    cubeSize: [100, 150, 10],
    cylinderRadius: 30,
    cylinderHeight: 120,
    radiusScale: libraryRadiusScale
  });

  // Create the cube-with-hole node (default gray color)
  const cubeNode = new GLTFNodeClass();
  cubeNode.manifold = cubeWithHole;
  cubeNode.name = 'Cube with Hole';

  // Create a rounded frame with colors (similar to rounded-frame.mjs example)
  const result = roundedFrame(ManifoldClass, edgeLength, 8);
  
  // Split the frame using a cube to create inside and outside parts
  const [inside, outside] = result.split(ManifoldClass.cube([edgeLength, edgeLength, edgeLength], true));

  // Create node for the outside part (default color)
  const outsideNode = new GLTFNodeClass();
  outsideNode.manifold = outside;
  outsideNode.name = 'Frame Outside';

  // Create node for the inside part with cyan color
  const insideNode = new GLTFNodeClass();
  insideNode.manifold = inside;
  insideNode.material = { baseColorFactor: [0, 1, 1] }; // Cyan color (RGB)
  insideNode.name = 'Frame Inside';

  // Return an array of GLTFNodes
  return [cubeNode, outsideNode, insideNode];
}
