// Three.js viewer for shapes created by my-3d-app
// Refactored into modular architecture with Web Worker support for geometry generation
import * as THREE from 'three';
import { SceneParams } from 'my-3d-app';
import { setupScene, handleResize, animate } from './scene-setup';
import { renderNodes } from './geometry-renderer';

// Get DOM elements
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const radiusScaleSlider = document.getElementById('radiusScale') as HTMLInputElement;
const edgeLengthSlider = document.getElementById('sphereCount') as HTMLInputElement;
const radiusValue = document.getElementById('radiusValue') as HTMLSpanElement;
const edgeLengthValue = document.getElementById('sphereValue') as HTMLSpanElement;
const lockCameraCheckbox = document.getElementById('lockCamera') as HTMLInputElement;
const status = document.getElementById('status') as HTMLDivElement;

// localStorage key for camera lock preference
const CAMERA_LOCK_KEY = 'manifold-viewer-camera-lock';

// Load camera lock preference from localStorage
const savedLockState = localStorage.getItem(CAMERA_LOCK_KEY);
if (savedLockState !== null) {
  lockCameraCheckbox.checked = savedLockState === 'true';
}

// Set up Three.js scene, camera, renderer, and controls
const { scene, camera, renderer, controls } = setupScene(canvas);

// Group to hold all mesh objects
const meshGroup = new THREE.Group();
scene.add(meshGroup);

// Initialize Web Worker for geometry generation
const geometryWorker = new Worker(
  new URL('./geometry.worker.ts', import.meta.url),
  { type: 'module' }
);

// Handle messages from worker
geometryWorker.onmessage = (e: MessageEvent) => {
  console.log('=== Main: RECEIVED MESSAGE FROM WORKER ===');
  console.log('Main: Message data:', e.data);
  console.log('Main: Message type:', e.data?.type);
  
  if (e.data.type === 'geometry') {
    const meshes = e.data.meshes;
    console.log('Main: Received geometry meshes', { 
      meshCount: meshes?.length,
      isArray: Array.isArray(meshes),
      meshTypes: meshes ? meshes.map((m: any) => typeof m) : 'no meshes'
    });
    
    // Log each mesh in detail
    if (meshes && Array.isArray(meshes)) {
      meshes.forEach((mesh: any, index: number) => {
        console.log(`Main: Mesh ${index}:`, {
          type: typeof mesh,
          keys: mesh ? Object.keys(mesh) : 'no keys',
          name: mesh?.name,
          numVert: mesh?.numVert,
          numTri: mesh?.numTri,
          hasVertProperties: mesh && 'vertProperties' in mesh,
          hasTriVerts: mesh && 'triVerts' in mesh,
          vertPropertiesLength: mesh?.vertProperties?.length,
          triVertsLength: mesh?.triVerts?.length,
          material: mesh?.material
        });
      });
    }
    
    const lockCamera = lockCameraCheckbox.checked;
    console.log('Main: Camera lock state:', lockCamera);

    try {
      console.log('Main: Calling renderNodes()...');
      renderNodes(meshes, scene, camera, controls, lockCamera, meshGroup);
      console.log('Main: ✓ Geometry rendered successfully');
      console.log('Main: Scene now has', scene.children.length, 'children');
      console.log('Main: MeshGroup now has', meshGroup.children.length, 'children');
      status.textContent = 'Ready';
      status.style.color = '#4CAF50';
    } catch (error) {
      console.error('Main: ✗ Error rendering geometry:', error);
      console.error('Main: Error stack:', error instanceof Error ? error.stack : 'no stack');
      status.textContent = `Rendering error: ${error}`;
      status.style.color = '#f44336';
    }
  } else if (e.data.type === 'error') {
    console.error('Main: Worker error:', e.data.message);
    status.textContent = `Error: ${e.data.message}`;
    status.style.color = '#f44336';
  } else {
    console.warn('Main: Unknown message type from worker', e.data);
  }
  console.log('=== Main: MESSAGE HANDLING COMPLETE ===');
};

// Handle worker errors
geometryWorker.onerror = (error) => {
  console.error('Worker error:', error);
  status.textContent = `Worker error: ${error.message}`;
  status.style.color = '#f44336';
};

/**
 * Update scene with new parameters
 * Sends parameters to worker for geometry generation
 */
function updateScene() {
  const params: SceneParams = {
    libraryRadiusScale: parseFloat(radiusScaleSlider.value),
    edgeLength: parseFloat(edgeLengthSlider.value),
  };

  console.log('Main: Updating scene with params', params);
  status.textContent = 'Generating geometry...';
  status.style.color = '#2196F3';

  // Send parameters to worker
  geometryWorker.postMessage(params);
  console.log('Main: Message sent to worker');
}

// Update display values and regenerate on slider change
radiusScaleSlider.addEventListener('input', () => {
  radiusValue.textContent = radiusScaleSlider.value;
  updateScene();
});

edgeLengthSlider.addEventListener('input', () => {
  edgeLengthValue.textContent = edgeLengthSlider.value;
  updateScene();
});

// Handle camera lock checkbox
lockCameraCheckbox.addEventListener('change', () => {
  // Save preference to localStorage
  localStorage.setItem(CAMERA_LOCK_KEY, lockCameraCheckbox.checked.toString());

  // If unchecking, immediately reposition camera to current model
  if (!lockCameraCheckbox.checked) {
    updateScene();
  }
});

// Handle window resize
window.addEventListener('resize', () => {
  handleResize(camera, renderer);
});

// Start animation loop
animate(renderer, scene, camera, controls);

// Initial scene generation
status.textContent = 'Initializing...';
status.style.color = '#2196F3';
updateScene();
