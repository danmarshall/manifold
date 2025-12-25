// Three.js scene setup and configuration
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface SceneConfig {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
}

/**
 * Set up Three.js scene, camera, renderer, and controls
 */
export function setupScene(canvas: HTMLCanvasElement): SceneConfig {
  console.log('SceneSetup: Setting up Three.js scene');
  
  // Set up scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);
  console.log('SceneSetup: Scene created');

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
  console.log('SceneSetup: Camera created at position', camera.position);

  // Set up lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.3);
  directionalLight.position.set(0, 0, 1);
  camera.add(directionalLight);
  scene.add(camera);
  console.log('SceneSetup: Lighting added');

  // Add ground grid
  const gridHelper = new THREE.GridHelper(200, 20, 0x888888, 0xcccccc);
  gridHelper.rotation.x = Math.PI / 2; // Rotate to XY plane (Z up)
  scene.add(gridHelper);
  console.log('SceneSetup: Grid added');

  // Set up renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  console.log('SceneSetup: Renderer configured');

  // Set up controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 10;
  controls.maxDistance = 1000;
  controls.maxPolarAngle = Math.PI;
  console.log('SceneSetup: Controls configured');
  
  console.log('SceneSetup: Setup complete, scene has', scene.children.length, 'children');

  return { scene, camera, renderer, controls };
}

/**
 * Handle window resize
 */
export function handleResize(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Animation loop
 */
let frameCount = 0;
export function animate(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls
) {
  requestAnimationFrame(() => animate(renderer, scene, camera, controls));
  controls.update();
  renderer.render(scene, camera);
  
  // Log every 60 frames to monitor animation loop
  frameCount++;
  if (frameCount % 60 === 0) {
    console.log('Animate: Frame', frameCount, 'scene children:', scene.children.length);
  }
}
