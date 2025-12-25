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
  console.log('Main: Received message from worker', e.data);
  
  if (e.data.type === 'geometry') {
    const nodes = e.data.nodes;
    console.log('Main: Received geometry nodes', { 
      nodeCount: nodes?.length, 
      nodes: nodes 
    });
    
    const lockCamera = lockCameraCheckbox.checked;

    try {
      renderNodes(nodes, scene, camera, controls, lockCamera, meshGroup);
      console.log('Main: Geometry rendered successfully');
      status.textContent = 'Ready';
      status.style.color = '#4CAF50';
    } catch (error) {
      console.error('Main: Error rendering geometry:', error);
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
