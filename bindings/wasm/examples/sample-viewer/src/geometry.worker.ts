// Web Worker for generating geometry in background thread
// This keeps the UI responsive during complex geometry generation
import Module from 'manifold-3d';
import { Manifold, GLTFNode } from 'manifold-3d/lib/manifoldCAD';
import { createScene, SceneParams } from 'my-3d-app';

let ManifoldClass: typeof Manifold | null = null;
let GLTFNodeClass: typeof GLTFNode | null = null;

// Initialize WASM module once when worker starts
async function initializeWASM() {
  if (!ManifoldClass) {
    console.log('Worker: Initializing WASM module');
    const wasm = await Module();
    wasm.setup();
    ManifoldClass = wasm.Manifold;
    // GLTFNode is a property on the Manifold class, not the wasm module
    GLTFNodeClass = GLTFNode;
    console.log('Worker: WASM initialized', { 
      hasManifold: !!ManifoldClass, 
      hasGLTFNode: !!GLTFNodeClass 
    });
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
    const sceneResult = createScene(ManifoldClass!, GLTFNodeClass!, params);
    
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
