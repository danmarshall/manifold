// Example demonstrating how to use npm dependencies in ManifoldCAD
// This example uses the gl-matrix library for vector math

import {vec3, mat4} from 'gl-matrix';
import {Manifold} from 'manifold-3d/manifoldCAD';

/**
 * Create a circular pattern of objects using vector math from gl-matrix
 */
function createCircularPattern(
  object: Manifold,
  count: number,
  radius: number
): Manifold {
  let result = object;
  
  for (let i = 1; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    
    // Use gl-matrix for vector operations
    const position = vec3.fromValues(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      0
    );
    
    result = result.add(object.translate(position));
  }
  
  return result;
}

/**
 * Create a spiral pattern using matrix transformations
 */
function createSpiralPattern(
  object: Manifold,
  count: number,
  radius: number,
  height: number
): Manifold {
  let result = object;
  
  for (let i = 1; i < count; i++) {
    const angle = (i / count) * Math.PI * 4; // 2 full rotations
    const z = (i / count) * height;
    
    const position = vec3.fromValues(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      z
    );
    
    // Scale down as we go up
    const scale = 1 - (i / count) * 0.5;
    
    result = result.add(
      object
        .scale([scale, scale, scale])
        .translate(position)
    );
  }
  
  return result;
}

// Create base objects
const sphere = Manifold.sphere(3, 32);
const cube = Manifold.cube([4, 4, 4], true);

// Create patterns
const circularPattern = createCircularPattern(sphere, 12, 20);
const spiralPattern = createSpiralPattern(cube, 20, 15, 40);

// Combine them
const combined = circularPattern.add(spiralPattern.translate([0, 0, 10]));

export default combined;
