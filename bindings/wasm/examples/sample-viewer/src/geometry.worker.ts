// Web Worker for generating geometry in background thread
// This keeps the UI responsive during complex geometry generation
import Module from 'manifold-3d';
import type { Manifold } from 'manifold-3d/lib/manifoldCAD.js'

import { createScene, SceneParams } from 'my-3d-app';

// Strong typing - no 'any' types
let ManifoldClass: (typeof Manifold) | null = null;
let GLTFNodeClass: any = null; // Will be extracted from Manifold.GLTFNode

// Initialize WASM module once when worker starts
async function initializeWASM() {
  if (!ManifoldClass) {
    console.log('Worker: Step 1 - Starting WASM initialization');
    console.log('Worker: Step 2 - Calling Module()');
    
    try {
      const wasm = await Module();
      console.log('Worker: Step 3 - Module() returned successfully', {
        wasmType: typeof wasm,
        wasmKeys: Object.keys(wasm).slice(0, 20)
      });
      
      console.log('Worker: Step 4 - Calling wasm.setup()');
      wasm.setup();
      console.log('Worker: Step 5 - setup() completed');
      
      console.log('Worker: Step 6 - Extracting Manifold class');
      ManifoldClass = wasm.Manifold;
      console.log('Worker: Step 7 - Manifold extracted', {
        hasManifold: !!ManifoldClass,
        ManifoldType: typeof ManifoldClass,
        ManifoldKeys: ManifoldClass ? Object.keys(ManifoldClass).slice(0, 20) : []
      });
      
      console.log('Worker: Step 8 - Extracting GLTFNode from Manifold.GLTFNode');
      GLTFNodeClass = ManifoldClass.GLTFNode;
      console.log('Worker: Step 9 - GLTFNode extracted', {
        hasGLTFNode: !!GLTFNodeClass,
        GLTFNodeType: typeof GLTFNodeClass
      });
      
      console.log('Worker: Step 10 - WASM initialization complete!');
    } catch (error) {
      console.error('Worker: FATAL ERROR during WASM initialization', error);
      console.error('Worker: Error details', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'no stack',
        error: error
      });
      throw error;
    }
  } else {
    console.log('Worker: WASM already initialized, skipping');
  }
}

// Handle messages from main thread
self.onmessage = async (e: MessageEvent<SceneParams>) => {
  console.log('=== Worker: NEW MESSAGE RECEIVED ===');
  console.log('Worker: Message data:', e.data);
  console.log('Worker: Message type:', typeof e.data);

  try {
    // Initialize WASM if not already done
    console.log('Worker: About to call initializeWASM()');
    await initializeWASM();
    console.log('Worker: ✓ initializeWASM() completed successfully');

    // Generate geometry
    const params = e.data;
    console.log('Worker: Preparing to generate geometry');
    console.log('Worker: Parameters:', JSON.stringify(params, null, 2));
    console.log('Worker: State check:', {
      hasManifoldClass: !!ManifoldClass,
      ManifoldClassType: typeof ManifoldClass,
      hasGLTFNodeClass: !!GLTFNodeClass,
      GLTFNodeClassType: typeof GLTFNodeClass
    });

    console.log('Worker: Calling createScene()...');
    const sceneResult = createScene(ManifoldClass!, GLTFNodeClass!, params);
    console.log('Worker: ✓ createScene() returned', {
      resultType: typeof sceneResult,
      isArray: Array.isArray(sceneResult),
      arrayLength: Array.isArray(sceneResult) ? sceneResult.length : 'N/A',
      firstItem: Array.isArray(sceneResult) ? typeof sceneResult[0] : typeof sceneResult
    });

    // Ensure we always return an array
    const nodes = Array.isArray(sceneResult) ? sceneResult : [sceneResult];
    console.log('Worker: Processed into array', {
      nodeCount: nodes.length,
      nodeTypes: nodes.map(n => typeof n),
      firstNodeSample: nodes[0] ? {
        hasNumVert: 'numVert' in nodes[0],
        hasNumTri: 'numTri' in nodes[0],
        numVert: nodes[0].numVert,
        numTri: nodes[0].numTri
      } : 'no first node'
    });

    // Send geometry back to main thread
    console.log('Worker: Posting message to main thread...');
    self.postMessage({ type: 'geometry', nodes });
    console.log('Worker: ✓ Message posted successfully');
    console.log('=== Worker: MESSAGE HANDLING COMPLETE ===');
  } catch (error) {
    console.error('=== Worker: FATAL ERROR ===');
    console.error('Worker: Error object:', error);
    console.error('Worker: Error message:', error instanceof Error ? error.message : String(error));
    console.error('Worker: Error stack:', error instanceof Error ? error.stack : 'no stack trace');
    console.error('Worker: Error name:', error instanceof Error ? error.name : 'unknown');
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
