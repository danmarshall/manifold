// Handle rendering of GLTFNode geometries in Three.js
import * as THREE from 'three';

/**
 * Convert GLTFNode mesh to Three.js geometry
 */
function gltfNodeToThreeGeometry(node: any): THREE.BufferGeometry {
  console.log('GeometryConverter: Converting node to THREE.BufferGeometry');
  console.log('GeometryConverter: Node structure:', {
    hasNumVert: 'numVert' in node,
    hasNumTri: 'numTri' in node,
    hasGetVert: typeof node.getVert === 'function',
    hasGetTri: typeof node.getTri === 'function',
    numVert: node.numVert,
    numTri: node.numTri
  });
  
  const geometry = new THREE.BufferGeometry();
  
  // Get mesh data
  const numVert = node.numVert;
  const numTri = node.numTri;
  
  if (!numVert || !numTri) {
    console.error('GeometryConverter: ✗ Node missing vertex or triangle count!', { numVert, numTri });
    throw new Error(`Invalid node: numVert=${numVert}, numTri=${numTri}`);
  }
  
  console.log(`GeometryConverter: Extracting ${numVert} vertices...`);
  // Create Float32Array for positions (3 values per vertex)
  const positions = new Float32Array(numVert * 3);
  for (let i = 0; i < numVert; i++) {
    const vert = node.getVert(i);
    positions[i * 3] = vert[0];
    positions[i * 3 + 1] = vert[1];
    positions[i * 3 + 2] = vert[2];
  }
  console.log('GeometryConverter: ✓ Vertices extracted, sample:', {
    first: [positions[0], positions[1], positions[2]],
    last: [positions[positions.length - 3], positions[positions.length - 2], positions[positions.length - 1]]
  });
  
  console.log(`GeometryConverter: Extracting ${numTri} triangles...`);
  // Create Uint32Array for indices
  const indices = new Uint32Array(numTri * 3);
  for (let i = 0; i < numTri; i++) {
    const tri = node.getTri(i);
    indices[i * 3] = tri[0];
    indices[i * 3 + 1] = tri[1];
    indices[i * 3 + 2] = tri[2];
  }
  console.log('GeometryConverter: ✓ Triangles extracted, sample:', {
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
 * Create Three.js material from GLTFNode material properties
 */
function createMaterial(node: any): THREE.Material {
  const materialProps = node.material || {};
  const baseColor = materialProps.baseColorFactor || [0.8, 0.8, 0.8, 1.0];
  const roughness = materialProps.roughnessFactor !== undefined ? materialProps.roughnessFactor : 0.5;
  const metallic = materialProps.metallicFactor !== undefined ? materialProps.metallicFactor : 0.0;
  
  return new THREE.MeshLambertMaterial({
    color: new THREE.Color(baseColor[0], baseColor[1], baseColor[2]),
    flatShading: true,
  });
}

/**
 * Calculate bounding box for a GLTFNode
 */
function calculateBoundingBox(node: any): THREE.Box3 {
  const bbox = new THREE.Box3();
  const numVert = node.numVert;
  
  for (let i = 0; i < numVert; i++) {
    const vert = node.getVert(i);
    bbox.expandByPoint(new THREE.Vector3(vert[0], vert[1], vert[2]));
  }
  
  return bbox;
}

/**
 * Calculate combined bounding box for multiple nodes
 */
export function calculateCombinedBoundingBox(nodes: any[]): THREE.Box3 {
  const combinedBox = new THREE.Box3();
  
  nodes.forEach(node => {
    const bbox = calculateBoundingBox(node);
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
    
    const geometry = gltfNodeToThreeGeometry(node);
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
