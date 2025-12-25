// Web Worker for generating geometry in background thread
// This keeps the UI responsive during complex geometry generation
import Module from 'manifold-3d';
// GLTFNode is a higher-level class, not part of the base WASM module
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

      console.log('Worker: Step 6 - Extracting Manifold using destructuring (like three.ts line 22)');
      // Following the pattern from bindings/wasm/examples/three.ts line 22
      // Note: GLTFNode is NOT in wasm, it's imported from manifoldCAD module
      const { Manifold } = wasm;
      ManifoldClass = Manifold;
      
      console.log('Worker: Step 7 - Classes extracted', {
        hasManifold: !!ManifoldClass,
        ManifoldType: typeof ManifoldClass,
        hasCube: typeof ManifoldClass?.cube,
        hasCylinder: typeof ManifoldClass?.cylinder,
        hasSphere: typeof ManifoldClass?.sphere,
        hasGLTFNode: !!GLTFNodeClass,
        GLTFNodeType: typeof GLTFNodeClass
      });

      console.log('Worker: Step 8 - WASM initialization complete!');
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
      nodeTypes: nodes.map(n => typeof n)
    });
    
    // Log detailed info about each node and extract mesh data
    const meshDataArray: any[] = [];
    
    nodes.forEach((node, index) => {
      console.log(`Worker: Node ${index} details:`, {
        type: typeof node,
        constructor: node?.constructor?.name,
        hasManifold: 'manifold' in node,
        hasMaterial: 'material' in node,
        hasName: 'name' in node,
        name: node.name,
        manifoldType: node.manifold ? typeof node.manifold : 'no manifold',
        manifoldConstructor: node.manifold?.constructor?.name,
        hasGetMesh: node.manifold && typeof node.manifold.getMesh === 'function',
        material: node.material,
        keys: Object.keys(node)
      });
      
      // Extract mesh data from the GLTFNode's manifold
      // GLTFNode objects contain WASM references that can't be sent through postMessage
      // So we need to extract the raw mesh data here in the worker
      if (node.manifold && typeof node.manifold.getMesh === 'function') {
        try {
          console.log(`Worker: Extracting mesh from node ${index}...`);
          const mesh = node.manifold.getMesh();
          console.log(`Worker: Mesh extracted:`, {
            meshType: typeof mesh,
            meshConstructor: mesh?.constructor?.name,
            hasNumVert: 'numVert' in mesh,
            numVert: mesh.numVert,
            hasNumTri: 'numTri' in mesh,
            numTri: mesh.numTri,
            hasVertProperties: 'vertProperties' in mesh,
            hasTriVerts: 'triVerts' in mesh,
            vertPropertiesLength: mesh.vertProperties?.length,
            triVertsLength: mesh.triVerts?.length
          });
          
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
          
          console.log(`Worker: Mesh data prepared for node ${index}:`, {
            name: meshData.name,
            numVert: meshData.numVert,
            numTri: meshData.numTri,
            vertPropertiesLength: meshData.vertProperties.length,
            triVertsLength: meshData.triVerts.length,
            firstVert: meshData.vertProperties.slice(0, 3),
            firstTri: meshData.triVerts.slice(0, 3)
          });
          
          meshDataArray.push(meshData);
        } catch (err) {
          console.error(`Worker: Error extracting mesh from node ${index}:`, err);
          throw err;
        }
      } else {
        console.error(`Worker: Node ${index} has no manifold or getMesh method!`);
        throw new Error(`Node ${index} (${node.name}) has no valid manifold object`);
      }
    });
    
    console.log('Worker: All mesh data extracted', {
      meshCount: meshDataArray.length,
      meshNames: meshDataArray.map(m => m.name)
    });

    // Send mesh data back to main thread
    console.log('Worker: Posting message to main thread...');
    self.postMessage({ type: 'geometry', meshes: meshDataArray });
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
