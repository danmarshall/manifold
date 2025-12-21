// Application that consumes the my-manifold-shapes library
import { createCubeWithHole } from 'my-manifold-shapes';

async function main() {
  console.log('Creating a cube with a hole using my-manifold-shapes library...');

  try {
    // Use the library to create a shape
    const shape = await createCubeWithHole(
      [100, 100, 100],  // cube size
      30,               // cylinder radius  
      120               // cylinder height
    );

    console.log('Shape created successfully!');
    console.log('Shape type:', shape.constructor.name);
    console.log('Number of vertices:', shape.numVert());
    console.log('Number of triangles:', shape.numTri());

    // You can continue to manipulate the shape
    // For example, scale it
    const scaledShape = shape.scale([2, 2, 2]);
    console.log('Scaled shape vertices:', scaledShape.numVert());

    // Clean up
    shape.delete();
    scaledShape.delete();

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
