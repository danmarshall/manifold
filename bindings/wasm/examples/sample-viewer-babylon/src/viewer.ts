// Babylon.js viewer for shapes created by my-3d-app
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  Mesh,
  StandardMaterial,
  Color3,
  VertexData,
  GridMaterial,
  LinesMesh
} from '@babylonjs/core';
import Module from 'manifold-3d';
import { Manifold } from 'manifold-3d/lib/manifoldCAD.js'
import { createScene as createManifoldScene, SceneParams } from 'my-3d-app';

// Get canvas and controls
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const radiusScaleSlider = document.getElementById('radiusScale') as HTMLInputElement;
const sphereCountSlider = document.getElementById('sphereCount') as HTMLInputElement;
const radiusValue = document.getElementById('radiusValue') as HTMLSpanElement;
const sphereValue = document.getElementById('sphereValue') as HTMLSpanElement;
const status = document.getElementById('status') as HTMLDivElement;

// Create Babylon.js engine and scene
const engine = new Engine(canvas, true);
const scene = new Scene(engine);
scene.clearColor = new Color3(0.94, 0.94, 0.94).toColor4();

// Set up camera
// CAD coordinates: Z is up
const camera = new ArcRotateCamera(
  'camera',
  Math.PI / 4, // alpha (horizontal rotation)
  Math.PI / 3, // beta (vertical rotation)
  300, // radius
  Vector3.Zero(),
  scene
);
camera.upperBetaLimit = Math.PI; // Allow camera to go all the way down
camera.lowerRadiusLimit = 100;
camera.upperRadiusLimit = 500;
camera.attachControl(canvas, true);

// Set up lighting
const light = new HemisphericLight('light', new Vector3(0, 1, 1), scene);
light.intensity = 0.8;

// Create ground grid plane
const groundSize = 500;
const gridMaterial = new GridMaterial('gridMaterial', scene);
gridMaterial.majorUnitFrequency = 5;
gridMaterial.minorUnitVisibility = 0.45;
gridMaterial.gridRatio = 10;
gridMaterial.backFaceCulling = false;
gridMaterial.mainColor = new Color3(0.5, 0.5, 0.5);
gridMaterial.lineColor = new Color3(0.8, 0.8, 0.8);
gridMaterial.opacity = 0.8;

const ground = Mesh.CreateGround('ground', groundSize, groundSize, 2, scene);
ground.material = gridMaterial;
ground.position.z = 0; // At Z=0 in CAD coordinates

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
  const positions = Array.from(mesh.vertProperties);
  vertexData.positions = positions;

  // Get triangle indices
  const indices = Array.from(mesh.triVerts);
  vertexData.indices = indices;

  // Compute normals
  const normals: number[] = [];
  VertexData.ComputeNormals(positions, indices, normals);
  vertexData.normals = normals;

  // Apply vertex data to mesh
  vertexData.applyToMesh(babylonMesh);

  return babylonMesh;
}

// Create material
const material = new StandardMaterial('material', scene);
material.diffuseColor = new Color3(0.8, 0.8, 0.8);
material.specularColor = new Color3(0.2, 0.2, 0.2);
material.backFaceCulling = false;

// Scene mesh object
let sceneMesh: Mesh | null = null;
let edgesLines: LinesMesh | null = null;

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
    if (edgesLines) {
      edgesLines.dispose();
    }

    sceneMesh = newMesh;

    // Add edge lines for better visualization
    edgesLines = sceneMesh.createInstance('edges') as any;
    edgesLines = sceneMesh.enableEdgesRendering();
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
