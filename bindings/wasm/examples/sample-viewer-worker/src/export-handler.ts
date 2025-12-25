// Export Handler Module
// Handles 3MF and GLB export operations
// Uses Export3MF and ExportGLTF classes from manifold-3d npm package

import { GLTFNode } from 'manifold-3d/lib/manifoldCAD.js';

const GLTFNodeClass = GLTFNode;

/**
 * Exports GLTFNodes to the specified format (3mf or glb)
 * Returns an ArrayBuffer containing the exported file
 */
export async function exportModel(gltfNodesData: any[], format: '3mf' | 'glb' = '3mf'): Promise<ArrayBuffer> {
  // Import required modules - Export3MF and ExportGLTF classes from npm package
  const { GLTFNodesToGLTFDoc } = await import('manifold-3d/lib/scene-builder.js');
  
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
  
  // Use the Export3MF or ExportGLTF class with asBlob method
  let blob: Blob;
  if (format === '3mf') {
    const { Export3MF } = await import('manifold-3d/lib/export-3mf.js');
    const exporter = new Export3MF();
    blob = await exporter.asBlob(doc);
  } else {
    const { ExportGLTF } = await import('manifold-3d/lib/export-gltf.js');
    const exporter = new ExportGLTF();
    blob = await exporter.asBlob(doc);
  }
  
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
