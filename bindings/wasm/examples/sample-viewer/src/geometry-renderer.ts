// Handle rendering of GLTFNode geometries in Three.js
import * as THREE from 'three';

/**
 * Convert mesh data to Three.js geometry
 * This receives plain mesh data from the worker (not GLTFNode objects)
 */
function meshDataToThreeGeometry(meshData: any): THREE.BufferGeometry {
  console.log('GeometryConverter: Converting mesh data to THREE.BufferGeometry');
  console.log('GeometryConverter: Mesh data structure:', {
    hasNumVert: 'numVert' in meshData,
    hasNumTri: 'numTri' in meshData,
    hasVertProperties: 'vertProperties' in meshData,
    hasTriVerts: 'triVerts' in meshData,
    numVert: meshData.numVert,
    numTri: meshData.numTri,
    vertPropertiesLength: meshData.vertProperties?.length,
    triVertsLength: meshData.triVerts?.length
  });
  
  const geometry = new THREE.BufferGeometry();
  
  // Get mesh data
  const numVert = meshData.numVert;
  const numTri = meshData.numTri;
  
  if (!numVert || !numTri) {
    console.error('GeometryConverter: ✗ Mesh data missing vertex or triangle count!', { numVert, numTri });
    throw new Error(`Invalid mesh data: numVert=${numVert}, numTri=${numTri}`);
  }
  
  console.log(`GeometryConverter: Converting ${numVert} vertices...`);
  // vertProperties is a flat array: [x, y, z, x, y, z, ...]
  const positions = new Float32Array(meshData.vertProperties);
  console.log('GeometryConverter: ✓ Vertices converted, sample:', {
    first: [positions[0], positions[1], positions[2]],
    last: [positions[positions.length - 3], positions[positions.length - 2], positions[positions.length - 1]]
  });
  
  console.log(`GeometryConverter: Converting ${numTri} triangles...`);
  // triVerts is a flat array of vertex indices: [v0, v1, v2, v0, v1, v2, ...]
  const indices = new Uint32Array(meshData.triVerts);
  console.log('GeometryConverter: ✓ Triangles converted, sample:', {
    first: [indices[0], indices[1], indices[2]],
    last: [indices[indices.length - 3], indices[indices.length - 2], indices[indices.length - 1]]
  });
  
  console.log('GeometryConverter: Setting geometry attributes...');
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  console.log('GeometryConverter: Computing vertex normals...');
  geometry.computeVertexNormals();
  console.log('GeometryConverter: ✓ Geometry complete');
  
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
  console.log('Renderer: Starting renderNodes', { 
    nodeCount: nodes?.length,
    lockCamera,
    meshGroupChildrenBefore: meshGroup.children.length 
  });
  
  // Clear previous meshes
  meshGroup.clear();
  console.log('Renderer: Cleared previous meshes');
  
  // Add new meshes
  nodes.forEach((node, index) => {
    console.log(`Renderer: Processing node ${index}`, {
      numVert: node.numVert,
      numTri: node.numTri,
      hasMaterial: !!node.material
    });
    
    const geometry = meshDataToThreeGeometry(node);
    console.log(`Renderer: Created geometry for node ${index}`, {
      positionCount: geometry.attributes.position.count,
      indexCount: geometry.index?.count
    });
    
    const material = createMaterial(node);
    console.log(`Renderer: Created material for node ${index}`, {
      type: material.type,
      color: (material as any).color
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    meshGroup.add(mesh);
    console.log(`Renderer: Added mesh ${index} to group`);
  });
  
  console.log('Renderer: All meshes added', {
    meshGroupChildren: meshGroup.children.length
  });
  
  // Position camera if not locked
  if (!lockCamera) {
    console.log('Renderer: Positioning camera (unlocked)');
    const bbox = calculateCombinedBoundingBox(nodes);
    console.log('Renderer: Bounding box', {
      min: bbox.min,
      max: bbox.max,
      center: bbox.getCenter(new THREE.Vector3()),
      size: bbox.getSize(new THREE.Vector3())
    });
    positionCamera(camera, bbox, controls);
    console.log('Renderer: Camera positioned', {
      position: camera.position,
      target: controls.target
    });
  } else {
    console.log('Renderer: Camera locked, only updating clipping planes');
    // Still update clipping planes even when camera is locked
    const bbox = calculateCombinedBoundingBox(nodes);
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.near = maxDim * 0.01;
    camera.far = maxDim * 10;
    camera.updateProjectionMatrix();
    console.log('Renderer: Clipping planes updated', {
      near: camera.near,
      far: camera.far
    });
  }
  
  console.log('Renderer: renderNodes complete');
}
