// Web Worker for generating geometry in background thread
// This keeps the UI responsive during complex geometry generation
import Module from 'manifold-3d';
import { Manifold, GLTFNode } from 'manifold-3d/lib/manifoldCAD.js';
import { createScene, SceneParams } from 'my-3d-app';

let ManifoldClass: any = null;
let GLTFNodeClass: any = null;

// Initialize WASM module once when worker starts
async function initializeWASM() {
  if (!ManifoldClass) {
    console.log('Worker: Initializing WASM module');
    const wasm = await Module();
    wasm.setup();
    ManifoldClass = wasm.Manifold;
    GLTFNodeClass = wasm.GLTFNode;
    console.log('Worker: WASM initialized');
  }
}

// Handle messages from main thread
self.onmessage = async (e: MessageEvent<SceneParams>) => {
  try {
    // Initialize WASM if not already done
    await initializeWASM();
    
    // Generate geometry
    const params = e.data;
    console.log('Worker: Generating geometry with params', params);
    const sceneResult = createScene(ManifoldClass, GLTFNodeClass, params);
    
    // Ensure we always return an array
    const nodes = Array.isArray(sceneResult) ? sceneResult : [sceneResult];
    
    // Send geometry back to main thread
    self.postMessage({ type: 'geometry', nodes });
  } catch (error) {
    console.error('Worker: Error generating geometry', error);
    self.postMessage({ 
      type: 'error', 
      message: error instanceof Error ? error.message : String(error) 
    });
  }
};
