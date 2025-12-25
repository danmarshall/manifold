// Mesh Serialization Module
// Handles extraction and serialization of mesh data for postMessage transfer

export interface SerializedMesh {
  name: string;
  material?: any;
  numVert: number;
  numTri: number;
  vertProperties: number[];
  triVerts: number[];
  numProp: number;
}

/**
 * Extracts mesh data from GLTFNodes for postMessage transfer
 * GLTFNode objects contain WASM references that can't be sent through postMessage,
 * so we extract the raw mesh data arrays
 */
export function serializeMeshData(nodes: any[]): SerializedMesh[] {
  const meshDataArray: SerializedMesh[] = [];
  
  nodes.forEach((node, index) => {
    if (node.manifold && typeof node.manifold.getMesh === 'function') {
      try {
        const mesh = node.manifold.getMesh();
        
        // Convert TypedArrays to regular arrays for postMessage
        const meshData: SerializedMesh = {
          name: node.name,
          material: node.material,
          numVert: mesh.numVert,
          numTri: mesh.numTri,
          vertProperties: Array.from(mesh.vertProperties), // Float32Array to array
          triVerts: Array.from(mesh.triVerts), // Uint32Array to array
          numProp: mesh.numProp
        };
        
        meshDataArray.push(meshData);
      } catch (err) {
        throw new Error(`Failed to extract mesh from node ${index} (${node.name}): ${err}`);
      }
    } else {
      throw new Error(`Node ${index} (${node.name}) has no valid manifold object`);
    }
  });
  
  return meshDataArray;
}
