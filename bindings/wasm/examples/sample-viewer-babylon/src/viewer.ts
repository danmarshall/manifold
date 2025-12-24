// Babylon.js viewer for shapes created by my-3d-app
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  Mesh,
  StandardMaterial,
  Color3,
  VertexData,
  MeshBuilder,
  AxesViewer
} from '@babylonjs/core';
import Module from 'manifold-3d';
import { Manifold } from 'manifold-3d/lib/manifoldCAD.js'
import { createScene as createManifoldScene, SceneParams } from 'my-3d-app';

// Get canvas and controls
const canvasElement = document.getElementById('canvas');
if (!(canvasElement instanceof HTMLCanvasElement)) {
  throw new Error('Canvas element with id "canvas" not found or not a canvas.');
}
const canvas = canvasElement;

const radiusScaleElement = document.getElementById('radiusScale');
if (!(radiusScaleElement instanceof HTMLInputElement)) {
  throw new Error('Element with id "radiusScale" must be an input.');
}
const radiusScaleSlider = radiusScaleElement;

const sphereCountElement = document.getElementById('sphereCount');
if (!(sphereCountElement instanceof HTMLInputElement)) {
  throw new Error('Element with id "sphereCount" must be an input.');
}
const sphereCountSlider = sphereCountElement;

const radiusValueElement = document.getElementById('radiusValue');
if (!(radiusValueElement instanceof HTMLSpanElement)) {
  throw new Error('Element with id "radiusValue" must be a span.');
}
const radiusValue = radiusValueElement;

const sphereValueElement = document.getElementById('sphereValue');
if (!(sphereValueElement instanceof HTMLSpanElement)) {
  throw new Error('Element with id "sphereValue" must be a span.');
}
const sphereValue = sphereValueElement;

const statusElement = document.getElementById('status');
if (!(statusElement instanceof HTMLDivElement)) {
  throw new Error('Element with id "status" must be a div.');
}
const status = statusElement;

// Create Babylon.js engine and scene
const engine = new Engine(canvas, true);
const scene = new Scene(engine);
scene.clearColor = new Color3(0.94, 0.94, 0.94).toColor4();

// Set up camera
// CAD coordinates: Z is up
const camera = new ArcRotateCamera(
  'camera',
  3 * Math.PI / 4, // alpha (horizontal rotation)
  Math.PI / 3, // beta (vertical rotation)
  300, // radius
  Vector3.Zero(),
  scene
);
camera.upVector = new Vector3(0, 0, 1); // CAD coordinates: Z is up
camera.upperBetaLimit = Math.PI; // Allow camera to go all the way down
camera.lowerRadiusLimit = 100;
camera.upperRadiusLimit = 500;
camera.attachControl(canvas, true);

// Set up lighting - match Three.js viewer approach
// Ambient light for base illumination
const ambientLight = new HemisphericLight('ambient', new Vector3(0, 0, 1), scene);
ambientLight.intensity = 0.4;
ambientLight.parent = camera;

// Main light from upper-right-front for good face distinction
const mainLight = new HemisphericLight('mainLight', new Vector3(1, 1, 1), scene);
mainLight.intensity = 0.8;
mainLight.parent = camera;

// Create ground grid plane using MeshBuilder
const groundSize = 500;
const ground = MeshBuilder.CreateGround('ground', { width: groundSize, height: groundSize, subdivisions: 50 }, scene);

const gridMaterial = new StandardMaterial('gridMaterial', scene);
gridMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5);
gridMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
gridMaterial.alpha = 0.5;
gridMaterial.wireframe = true;

ground.material = gridMaterial;
ground.rotation.x = Math.PI / 2; // Rotate to XY plane
ground.position.z = 0; // At Z=0 in CAD coordinates

// Add custom axes at origin with flipped X
const axisLength = 50;
// X axis (red) - flipped direction
const xAxis = MeshBuilder.CreateLines('xAxis', {
  points: [new Vector3(0, 0, 0), new Vector3(-axisLength, 0, 0)]
}, scene);
xAxis.color = new Color3(1, 0, 0);

// Y axis (green)
const yAxis = MeshBuilder.CreateLines('yAxis', {
  points: [new Vector3(0, 0, 0), new Vector3(0, axisLength, 0)]
}, scene);
yAxis.color = new Color3(0, 1, 0);

// Z axis (blue)
const zAxis = MeshBuilder.CreateLines('zAxis', {
  points: [new Vector3(0, 0, 0), new Vector3(0, 0, axisLength)]
}, scene);
zAxis.color = new Color3(0, 0, 1);

// Handle window resize
window.addEventListener('resize', () => {
  engine.resize();
});

// Convert Manifold mesh to Babylon.js geometry
function manifoldToBabylonMesh(manifold: InstanceType<typeof Manifold>, name: string): Mesh {
  const mesh = manifold.getMesh();
  const babylonMesh = new Mesh(name, scene);

  // Create vertex data
  const vertexData = new VertexData();

  // Get vertex positions (numProp=3 means xyz)
  // Flip X coordinate to match CAD orientation
  const vertProps = mesh.vertProperties;
  const positions: number[] = [];
  for (let i = 0; i < vertProps.length; i += 3) {
    positions.push(-vertProps[i]);     // Negate X
    positions.push(vertProps[i + 1]);  // Y stays the same
    positions.push(vertProps[i + 2]);  // Z stays the same
  }
  vertexData.positions = positions;

  // Get triangle indices
  const indices = Array.from(mesh.triVerts);
  vertexData.indices = indices;

  // Compute flat normals for consistent face appearance (no triangle artifacts)
  const normals: number[] = [];
  VertexData.ComputeNormals(positions, indices, normals);
  vertexData.normals = normals;

  // Apply vertex data to mesh
  vertexData.applyToMesh(babylonMesh);

  // Convert to flat shaded mesh
  babylonMesh.convertToFlatShadedMesh();

  return babylonMesh;
}

// Create material
const material = new StandardMaterial('material', scene);
material.diffuseColor = new Color3(0.8, 0.8, 0.8);
material.specularColor = new Color3(0.2, 0.2, 0.2);
material.backFaceCulling = false;

// Scene mesh object
let sceneMesh: Mesh | null = null;

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
    const manifoldScene = createManifoldScene(ManifoldClass, params);

    // Convert to Babylon.js mesh
    const newMesh = manifoldToBabylonMesh(manifoldScene, 'sceneMesh');
    newMesh.material = material;

    // Clean up old mesh
    if (sceneMesh) {
      sceneMesh.dispose();
    }

    sceneMesh = newMesh;

    // Add edge lines for better visualization
    sceneMesh.enableEdgesRendering();
    sceneMesh.edgesWidth = 2.0;
    sceneMesh.edgesColor = new Color3(0, 0, 0).toColor4();

    // Clean up Manifold object
    manifoldScene.delete();

    const vertexCount = sceneMesh.getTotalVertices();
    const faceCount = sceneMesh.getTotalIndices() / 3;
    status.textContent = `Vertices: ${vertexCount}, Triangles: ${faceCount}`;
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

// Render loop
engine.runRenderLoop(() => {
  // Update light directions to follow camera - lights come FROM behind camera
  const cameraDirection = camera.getDirection(Vector3.Forward());
  mainLight.direction = cameraDirection.negate().add(new Vector3(-0.3, -0.3, 0));
  ambientLight.direction = camera.getDirection(Vector3.Up()).negate();

  scene.render();
});

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
  } catch (error) {
    console.error('Initialization error:', error);
    status.textContent = `Initialization failed: ${error}`;
  }
}

init();
