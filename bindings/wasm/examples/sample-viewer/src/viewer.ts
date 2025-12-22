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
const status = document.getElementById('status') as HTMLDivElement;

// Set up Three.js scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// Set up camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  1,
  1000
);
camera.position.set(200, 200, 200);
camera.lookAt(0, 0, 0);

// Set up orbit controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 100;
controls.maxDistance = 500;
controls.maxPolarAngle = Math.PI;

// Set up simple, conventional lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

// Set up renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

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

  // Compute normals for proper lighting
  geometry.computeVertexNormals();

  return geometry;
}

// Create material - simple flat color with standard shading
const material = new THREE.MeshStandardMaterial({
  color: 0x4a90e2,
  roughness: 0.7,
  metalness: 0.0,
  flatShading: false,
});

// Scene mesh object
let sceneMesh: THREE.Mesh | null = null;

// Current parameters
let currentParams: SceneParams = {
  libraryRadiusScale: 1.0,
  sphereCount: 6
};

// WASM module - initialized once for the entire application
let ManifoldClass: typeof Manifold | null = null;

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

    // Create new mesh
    sceneMesh = new THREE.Mesh(geometry, material);
    scene.add(sceneMesh);

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
