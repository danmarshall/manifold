// Three.js viewer for shapes created by my-3d-app
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Module from 'manifold-3d';
import { Manifold } from 'manifold-3d/lib/manifoldCAD.js'
import { createScene, SceneParams } from 'my-3d-app';

// Get canvas and controls
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const radiusScaleSlider = document.getElementById('radiusScale') as HTMLInputElement;
const sphereCountSlider = document.getElementById('sphereCount') as HTMLInputElement;
const radiusValue = document.getElementById('radiusValue') as HTMLSpanElement;
const sphereValue = document.getElementById('sphereValue') as HTMLSpanElement;
const lockCameraCheckbox = document.getElementById('lockCamera') as HTMLInputElement;
const status = document.getElementById('status') as HTMLDivElement;

// localStorage key for camera lock preference
const CAMERA_LOCK_KEY = 'manifold-viewer-camera-lock';

// Load camera lock preference from localStorage
const savedLockState = localStorage.getItem(CAMERA_LOCK_KEY);
if (savedLockState !== null) {
  lockCameraCheckbox.checked = savedLockState === 'true';
}

// Set up Three.js scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// Set up camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.set(200, -200, 200);
camera.up.set(0, 0, 1); // CAD coordinates: Z is up
camera.lookAt(0, 0, 0);

// Set up lighting
// Add ambient light for base illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// Attach directional light to camera so it moves with the view
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.3);
directionalLight.position.set(0, 0, 1); // Position relative to camera
camera.add(directionalLight);

scene.add(camera);

// Set up orbit controls AFTER camera is added to scene
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 100;
controls.maxDistance = 500;
controls.maxPolarAngle = Math.PI;

// Set up renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Add grid at Z=0
const gridHelper = new THREE.GridHelper(500, 50, 0x888888, 0xcccccc);
gridHelper.rotation.x = Math.PI / 2; // Rotate to XY plane (Z=0)
scene.add(gridHelper);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Convert Manifold mesh to Three.js geometry
function manifoldToThreeGeometry(manifold: InstanceType<typeof Manifold>): THREE.BufferGeometry {
  const mesh = manifold.getMesh();
  const geometry = new THREE.BufferGeometry();

  // Get vertex positions (numProp=3 means xyz)
  const positions = new Float32Array(mesh.vertProperties);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Get triangle indices
  const indices = new Uint32Array(mesh.triVerts);
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  // Compute normals - flat shading is enabled in material
  geometry.computeVertexNormals();

  return geometry;
}

// Create material
const material = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  roughness: 0.7,
  metalness: 0.3,
  flatShading: true, // Prevents smoothing artifacts on boolean operations
});

// Scene mesh object
let sceneMesh: THREE.Mesh | null = null;
let edgesLine: THREE.LineSegments | null = null;

// Current parameters
let currentParams: SceneParams = {
  libraryRadiusScale: 1.0,
  sphereCount: 6
};

// WASM module - initialized once for the entire application
let ManifoldClass: typeof Manifold | null = null;

// Auto-position camera based on model bounds
function positionCameraForModel(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  
  if (!bbox) return;
  
  // Calculate model center and size
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  
  const size = new THREE.Vector3();
  bbox.getSize(size);
  
  const maxDim = Math.max(size.x, size.y, size.z);
  
  // Position camera at a good viewing distance
  // Use 2x the max dimension for good framing
  const distance = maxDim * 2;
  
  // Position camera at 45-degree angle from XY plane, looking down at model
  const cameraPos = new THREE.Vector3(
    center.x + distance * 0.7,
    center.y - distance * 0.7,
    center.z + distance * 0.7
  );
  
  camera.position.copy(cameraPos);
  camera.lookAt(center);
  
  // Update controls target to model center
  controls.target.copy(center);
  
  // Update controls distance limits based on model size
  controls.minDistance = maxDim * 0.5;
  controls.maxDistance = maxDim * 5;
  
  // Update camera near/far planes based on model size
  // This prevents clipping when zooming in or out
  camera.near = maxDim * 0.01;
  camera.far = maxDim * 10;
  camera.updateProjectionMatrix();
  
  controls.update();
}

// Update scene with new parameters
function updateScene(params: SceneParams) {
  try {
    status.textContent = 'Generating geometry...';

    if (!ManifoldClass) {
      throw new Error('Manifold class not initialized');
    }

    // Create the scene from my-3d-app
    // Pass the Manifold class that was initialized once
    const manifoldScene = createScene(ManifoldClass, params);

    // Convert to Three.js geometry
    const geometry = manifoldToThreeGeometry(manifoldScene);

    // Clean up old mesh
    if (sceneMesh) {
      sceneMesh.geometry.dispose();
      scene.remove(sceneMesh);
    }
    if (edgesLine) {
      edgesLine.geometry.dispose();
      scene.remove(edgesLine);
    }

    // Create new mesh
    sceneMesh = new THREE.Mesh(geometry, material);
    scene.add(sceneMesh);

    // Add edge lines for face distinction
    const edges = new THREE.EdgesGeometry(geometry, 15); // 15 degree threshold
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
    edgesLine = new THREE.LineSegments(edges, lineMaterial);
    scene.add(edgesLine);

    // Auto-position camera to fit the model (only if not locked)
    if (!lockCameraCheckbox.checked) {
      positionCameraForModel(geometry);
    } else {
      // Even when locked, update the clipping planes to prevent rendering issues
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox;
      if (bbox) {
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        
        camera.near = maxDim * 0.01;
        camera.far = maxDim * 10;
        camera.updateProjectionMatrix();
      }
    }

    // Clean up Manifold object
    manifoldScene.delete();

    status.textContent = `Vertices: ${geometry.attributes.position.count}, Triangles: ${geometry.index!.count / 3}`;
  } catch (error) {
    console.error('Error updating scene:', error);
    status.textContent = `Error: ${error}`;
  }
}

// Set up slider event listeners
// Note: For production, consider debouncing these events to improve performance
// with rapid slider movements. Current implementation updates immediately for
// better responsiveness in this demo.
radiusScaleSlider.addEventListener('input', () => {
  const value = parseFloat(radiusScaleSlider.value);
  radiusValue.textContent = value.toFixed(2);
  currentParams.libraryRadiusScale = value;
  updateScene(currentParams);
});

sphereCountSlider.addEventListener('input', () => {
  const value = parseInt(sphereCountSlider.value);
  sphereValue.textContent = value.toString();
  currentParams.sphereCount = value;
  updateScene(currentParams);
});

// Save camera lock preference to localStorage when changed
lockCameraCheckbox.addEventListener('change', () => {
  localStorage.setItem(CAMERA_LOCK_KEY, lockCameraCheckbox.checked.toString());
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update orbit controls
  controls.update();

  renderer.render(scene, camera);
}

// Initialize
async function init() {
  try {
    status.textContent = 'Initializing WASM module...';

    // Initialize WASM module ONCE for the entire application
    // This is the key optimization - only one WASM instance
    const wasm = await Module();
    wasm.setup();
    ManifoldClass = wasm.Manifold;

    status.textContent = 'WASM initialized. Generating scene...';

    // Now we can create scenes without re-initializing WASM
    updateScene(currentParams);
    animate();
  } catch (error) {
    console.error('Initialization error:', error);
    status.textContent = `Initialization failed: ${error}`;
  }
}

init();
