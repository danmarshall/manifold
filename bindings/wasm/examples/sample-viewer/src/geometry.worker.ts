// Web Worker for generating geometry in background thread
// This keeps the UI responsive during complex geometry generation
import Module from 'manifold-3d';
import { GLTFNode } from 'manifold-3d/lib/manifoldCAD.js';
import { createScene, SceneParams } from 'my-3d-app';

// Type imports for TypeScript - these are type-only, not runtime values
import type { Manifold as ManifoldType } from 'manifold-3d/lib/manifoldCAD.js';

// Runtime class references - will be extracted from WASM module
let ManifoldClass: (typeof ManifoldType) | null = null;
const GLTFNodeClass = GLTFNode; // GLTFNode is imported from manifoldCAD, not from wasm

// Initialize WASM module once when worker starts
async function initializeWASM() {
  if (!ManifoldClass) {

    try {
      const wasm = await Module();
      wasm.setup();

      // Following the pattern from bindings/wasm/examples/three.ts line 22
      // Note: GLTFNode is NOT in wasm, it's imported from manifoldCAD module
      const { Manifold } = wasm;
      ManifoldClass = Manifold;

      // Send ready message to main thread
      self.postMessage({ type: 'ready' });
    } catch (error) {
      self.postMessage({
        type: 'error',
        message: `WASM initialization failed: ${error instanceof Error ? error.message : String(error)}`
      });
      throw error;
    }
  }
}

// Start initialization immediately when worker loads
initializeWASM();

// Handle messages from main thread
self.onmessage = async (e: MessageEvent) => {
  // Handle different message types
  const messageData = e.data;
  
  // Only process 'generate' messages
  if (messageData.type !== 'generate') {
    return;
  }

  const requestId = messageData.requestId;
  const params: SceneParams = messageData.params;

  try {
    // Wait for WASM to be initialized (should already be done by now)
    if (!ManifoldClass) {
      await initializeWASM();
    }

    // Generate geometry
    const sceneResult = createScene(ManifoldClass!, GLTFNodeClass!, params);

    // Ensure we always return an array
    const nodes = Array.isArray(sceneResult) ? sceneResult : [sceneResult];

    // Extract mesh data
    const meshDataArray: any[] = [];

    nodes.forEach((node, index) => {
      // Extract mesh data from the GLTFNode's manifold
      // GLTFNode objects contain WASM references that can't be sent through postMessage
      // So we need to extract the raw mesh data here in the worker
      if (node.manifold && typeof node.manifold.getMesh === 'function') {
        try {
          const mesh = node.manifold.getMesh();

          // Convert to plain object that can be sent through postMessage
          const meshData = {
            name: node.name,
            material: node.material,
            // Copy the mesh data arrays
            numVert: mesh.numVert,
            numTri: mesh.numTri,
            vertProperties: Array.from(mesh.vertProperties), // Float32Array to regular array
            triVerts: Array.from(mesh.triVerts), // Uint32Array to regular array
            numProp: mesh.numProp
          };

          meshDataArray.push(meshData);
        } catch (err) {
          throw err;
        }
      } else {
        throw new Error(`Node ${index} (${node.name}) has no valid manifold object`);
      }
    });

    // Send mesh data back to main thread with request ID
    self.postMessage({ 
      type: 'geometry', 
      requestId,
      meshes: meshDataArray 
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      requestId,
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
