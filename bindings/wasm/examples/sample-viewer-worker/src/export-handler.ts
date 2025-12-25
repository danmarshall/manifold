// Export Handler Module
// Handles 3MF export operations

import { GLTFNode } from 'manifold-3d/lib/manifoldCAD.js';

const GLTFNodeClass = GLTFNode;

/**
 * Exports GLTFNodes to 3MF format
 * Returns an ArrayBuffer containing the 3MF file
 */
export async function export3MF(gltfNodesData: any[]): Promise<ArrayBuffer> {
  // Import required modules for 3MF export
  const { GLTFNodesToGLTFDoc } = await import('manifold-3d/lib/scene-builder.js');
  const { toArrayBuffer } = await import('manifold-3d/lib/export-3mf.js');
  
  // Reconstruct GLTFNodes from the serialized data
  const gltfNodes = gltfNodesData.map((nodeData: any) => {
    const node = new GLTFNodeClass!();
    node.name = nodeData.name;
    node.manifold = nodeData.manifold;
    node.material = nodeData.material;
    // Note: transform property is not available on GLTFNode
    return node;
  });
  
  // Convert GLTFNodes to GLTF Document
  const doc = await GLTFNodesToGLTFDoc(gltfNodes);
  
  // Export to 3MF ArrayBuffer
  const buffer = await toArrayBuffer(doc, '3mf');
  
  return buffer;
}
