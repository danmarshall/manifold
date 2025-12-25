// Web Worker for generating geometry in background thread
// This keeps the UI responsive during complex geometry generation
//
// This worker orchestrates modular components for WASM initialization,
// geometry generation, mesh serialization, and 3MF export

import { SceneParams } from 'my-3d-app';
import { initializeWASM, getManifoldClass } from './wasm-init.js';
import { generateGeometry } from './geometry-generator.js';
import { serializeMeshData } from './mesh-serializer.js';
import { export3MF } from './export-handler.js';

// Start WASM initialization immediately when worker loads
initializeWASM().then(() => {
  // Send ready message to main thread
  self.postMessage({ type: 'ready' });
}).catch((error) => {
  self.postMessage({
    type: 'error',
    message: `WASM initialization failed: ${error instanceof Error ? error.message : String(error)}`
  });
});

// Handle messages from main thread
self.onmessage = async (e: MessageEvent) => {
  const messageData = e.data;
  
  if (messageData.type === 'generate') {
    const requestId = messageData.requestId;
    const params: SceneParams = messageData.params;

    try {
      // Ensure WASM is initialized
      let ManifoldClass = getManifoldClass();
      if (!ManifoldClass) {
        ManifoldClass = await initializeWASM();
      }

      // Generate geometry using modular component
      const nodes = generateGeometry(ManifoldClass, params);

      // Serialize mesh data for postMessage transfer
      const meshDataArray = serializeMeshData(nodes);

      // Send mesh data back to main thread with request ID
      // Also send the original GLTFNodes (as plain objects) for export
      self.postMessage({ 
        type: 'geometry', 
        requestId,
        meshes: meshDataArray,
        gltfNodes: nodes.map((node: any) => ({
          name: node.name,
          manifold: node.manifold,
          material: node.material,
          transform: node.transform
        }))
      });
    } catch (error) {
      self.postMessage({
        type: 'error',
        requestId,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  } else if (messageData.type === 'export3mf') {
    // Handle 3MF export request
    try {
      // Ensure WASM is initialized
      let ManifoldClass = getManifoldClass();
      if (!ManifoldClass) {
        ManifoldClass = await initializeWASM();
      }
      
      // Use modular export handler
      const buffer = await export3MF(messageData.gltfNodes);
      
      // Send back the 3MF file
      self.postMessage({
        type: '3mf',
        buffer
      }, [buffer]); // Transfer ownership of ArrayBuffer for efficiency
    } catch (error) {
      self.postMessage({
        type: 'error',
        message: `3MF export failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
};
