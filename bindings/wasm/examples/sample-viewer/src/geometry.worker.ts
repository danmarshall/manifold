// Web Worker for generating geometry in background thread
// This keeps the UI responsive during complex geometry generation
import Module from 'manifold-3d';
import { Manifold, GLTFNode } from 'manifold-3d/lib/manifoldCAD.js'

import { createScene, SceneParams } from 'my-3d-app';

let ManifoldClass: (typeof Manifold) | null = null;
let GLTFNodeClass = GLTFNode;

// Initialize WASM module once when worker starts
async function initializeWASM() {
  if (!ManifoldClass) {
    console.log('Worker: Initializing WASM module');
    const wasm = await Module();
    console.log('Worker: Module loaded, calling setup()');
    wasm.setup();
    console.log('Worker: Setup complete, extracting classes');
    ManifoldClass = wasm.Manifold;
    // GLTFNode is a property on the Manifold class
    console.log('Worker: WASM initialized', {
      hasManifold: !!ManifoldClass,
      hasGLTFNode: !!GLTFNodeClass,
      manifestMethods: ManifoldClass ? Object.keys(ManifoldClass).slice(0, 10) : []
    });
  }
}

// Handle messages from main thread
self.onmessage = async (e: MessageEvent<SceneParams>) => {
  console.log('Worker: Received message from main thread', e.data);

  try {
    // Initialize WASM if not already done
    console.log('Worker: Calling initializeWASM');
    await initializeWASM();
    console.log('Worker: WASM initialization complete');

    // Generate geometry
    const params = e.data;
    console.log('Worker: Generating geometry with params', params);
    console.log('Worker: Calling createScene with', {
      hasManifoldClass: !!ManifoldClass,
      hasGLTFNodeClass: !!GLTFNodeClass,
      params
    });

    const sceneResult = createScene(ManifoldClass!, GLTFNodeClass!, params);
    console.log('Worker: createScene returned', {
      type: typeof sceneResult,
      isArray: Array.isArray(sceneResult),
      value: sceneResult
    });

    // Ensure we always return an array
    const nodes = Array.isArray(sceneResult) ? sceneResult : [sceneResult];
    console.log('Worker: Processed nodes', {
      count: nodes.length,
      nodeTypes: nodes.map(n => typeof n)
    });

    // Send geometry back to main thread
    console.log('Worker: Sending geometry back to main thread');
    self.postMessage({ type: 'geometry', nodes });
    console.log('Worker: Message sent successfully');
  } catch (error) {
    console.error('Worker: Error generating geometry', error);
    console.error('Worker: Error stack', error instanceof Error ? error.stack : 'no stack');
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
