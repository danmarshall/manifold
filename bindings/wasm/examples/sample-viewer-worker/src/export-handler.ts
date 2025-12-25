// Export Handler Module
// Handles 3MF and GLB export operations
// Uses the same pattern as manifoldcad.org worker

import { GLTFNode } from 'manifold-3d/lib/manifoldCAD.js';

const GLTFNodeClass = GLTFNode;

/**
 * Exports GLTFNodes to the specified format (3mf or glb)
 * Returns an ArrayBuffer containing the exported file
 */
export async function exportModel(gltfNodesData: any[], format: '3mf' | 'glb' = '3mf'): Promise<ArrayBuffer> {
  // Import required modules - using the same pattern as manifoldcad.org
  const { GLTFNodesToGLTFDoc } = await import('manifold-3d/lib/scene-builder.js');
  const exportModelModule = await import('manifold-3d/lib/export-model.js');
  
  // Reconstruct GLTFNodes from the serialized data
  const gltfNodes = gltfNodesData.map((nodeData: any) => {
    const node = new GLTFNodeClass!();
    node.name = nodeData.name;
    node.manifold = nodeData.manifold;
    node.material = nodeData.material;
    return node;
  });
  
  // Convert GLTFNodes to GLTF Document
  const doc = await GLTFNodesToGLTFDoc(gltfNodes);
  
  // Export using the same pattern as manifoldcad.org: exportModel.toBlob(doc, extension)
  const blob = await exportModelModule.toBlob(doc, format);
  
  // Convert Blob to ArrayBuffer
  const buffer = await blob.arrayBuffer();
  
  return buffer;
}

/**
 * Exports GLTFNodes to 3MF format
 * Returns an ArrayBuffer containing the 3MF file
 */
export async function export3MF(gltfNodesData: any[]): Promise<ArrayBuffer> {
  return exportModel(gltfNodesData, '3mf');
}
