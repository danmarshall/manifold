// Geometry Generation Module
// Handles creating geometry from scene parameters

import { GLTFNode } from 'manifold-3d/lib/manifoldCAD.js';
import { createScene, SceneParams } from 'my-3d-app';
import type { Manifold as ManifoldType } from 'manifold-3d/lib/manifoldCAD.js';

const GLTFNodeClass = GLTFNode;

/**
 * Generates geometry based on provided parameters
 * Returns an array of GLTFNodes containing the generated geometry
 */
export function generateGeometry(
  ManifoldClass: typeof ManifoldType,
  params: SceneParams
): any[] {
  // Generate geometry using the consumer's createScene function
  const sceneResult = createScene(ManifoldClass, GLTFNodeClass!, params);
  
  // Ensure we always return an array
  const nodes = Array.isArray(sceneResult) ? sceneResult : [sceneResult];
  
  return nodes;
}
