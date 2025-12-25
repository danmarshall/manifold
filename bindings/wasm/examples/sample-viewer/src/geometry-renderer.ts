// Handle rendering of GLTFNode geometries in Three.js
import * as THREE from 'three';

/**
 * Convert mesh data to Three.js geometry
 * This receives plain mesh data from the worker (not GLTFNode objects)
 */
function meshDataToThreeGeometry(meshData: any): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  // Get mesh data
  const numVert = meshData.numVert;
  const numTri = meshData.numTri;

  if (!numVert || !numTri) {
    throw new Error(`Invalid mesh data: numVert=${numVert}, numTri=${numTri}`);
  }

  // vertProperties is a flat array: [x, y, z, x, y, z, ...]
  const positions = new Float32Array(meshData.vertProperties);

  // triVerts is a flat array of vertex indices: [v0, v1, v2, v0, v1, v2, ...]
  const indices = new Uint32Array(meshData.triVerts);

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Create Three.js material from mesh data material properties
 */
function createMaterial(meshData: any): THREE.Material {
  const materialProps = meshData.material || {};
  const baseColor = materialProps.baseColorFactor || [0.8, 0.8, 0.8, 1.0];
  const roughness = materialProps.roughnessFactor !== undefined ? materialProps.roughnessFactor : 0.5;
  const metallic = materialProps.metallicFactor !== undefined ? materialProps.metallicFactor : 0.0;

  return new THREE.MeshLambertMaterial({
    color: new THREE.Color(baseColor[0], baseColor[1], baseColor[2]),
    flatShading: true,
  });
}

/**
 * Calculate bounding box for mesh data
 */
function calculateBoundingBox(meshData: any): THREE.Box3 {
  const bbox = new THREE.Box3();
  const positions = meshData.vertProperties;
  const numVert = meshData.numVert;

  for (let i = 0; i < numVert; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    bbox.expandByPoint(new THREE.Vector3(x, y, z));
  }

  return bbox;
}

/**
 * Calculate combined bounding box for multiple mesh data objects
 */
export function calculateCombinedBoundingBox(meshes: any[]): THREE.Box3 {
  const combinedBox = new THREE.Box3();

  meshes.forEach(meshData => {
    const bbox = calculateBoundingBox(meshData);
    combinedBox.union(bbox);
  });

  return combinedBox;
}

/**
 * Position camera to frame the model optimally
 */
export function positionCamera(
  camera: THREE.PerspectiveCamera,
  boundingBox: THREE.Box3,
  controls: any
) {
  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  // Position camera at a distance to frame the model
  const distance = maxDim * 2;
  const angle = Math.PI / 4; // 45 degrees

  camera.position.set(
    center.x + distance * Math.cos(angle),
    center.y - distance * Math.sin(angle),
    center.z + distance * 0.5
  );

  camera.lookAt(center);
  controls.target.copy(center);

  // Adjust clipping planes based on model size
  camera.near = maxDim * 0.01;
  camera.far = maxDim * 10;
  camera.updateProjectionMatrix();
}

/**
 * Render GLTFNodes into Three.js scene
 */
export function renderNodes(
  nodes: any[],
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  controls: any,
  lockCamera: boolean,
  meshGroup: THREE.Group
): void {
  // Clear previous meshes
  meshGroup.clear();

  // Add new meshes
  nodes.forEach((node, index) => {
    const geometry = meshDataToThreeGeometry(node);
    const material = createMaterial(node);
    const mesh = new THREE.Mesh(geometry, material);
    meshGroup.add(mesh);
  });

  // Position camera if not locked
  if (!lockCamera) {
    const bbox = calculateCombinedBoundingBox(nodes);
    positionCamera(camera, bbox, controls);
  } else {
    // Still update clipping planes even when camera is locked
    const bbox = calculateCombinedBoundingBox(nodes);
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.near = maxDim * 0.01;
    camera.far = maxDim * 10;
    camera.updateProjectionMatrix();
  }
}
