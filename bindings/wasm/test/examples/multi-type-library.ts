// Copyright 2025 The Manifold Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// This example demonstrates using multiple manifoldCAD types (Box, Vec2, Vec3, etc.)
// with the context-agnostic pattern.
//
// IMPORTANT: There are two categories of imports from 'manifold-3d/manifoldCAD':
//
// 1. WASM types (need context handling):
//    - Manifold, CrossSection, Mesh - from ManifoldToplevel
//    - These need the optional manifoldContext parameter
//
// 2. JavaScript utilities (context-independent):
//    - GLTFNode, GLTFMaterial, setMaterial, importManifold, etc.
//    - These are JavaScript wrappers that work with ANY Manifold instance
//    - Import them directly - no context handling needed
//
// Type definitions (Box, Vec2, Vec3) are TypeScript types only, not runtime values.

import type {Manifold as ManifoldType} from '../../manifold-encapsulated-types';
import type {ManifoldToplevel, Box, Vec2, Vec3} from '../../manifold';
import {Manifold, CrossSection, setMaterial, GLTFNode} from '../../lib/manifoldCAD';
import type {GLTFMaterial} from '../../lib/manifoldCAD';

/**
 * Options for creating a parametric shape with bounds
 */
export interface BoundedShapeOptions {
  bounds: Box;
  divisions?: Vec3;
  color?: Vec3;
}

/**
 * Create a voxelized shape within given bounds.
 * Demonstrates using Box and Vec3 types with context parameter.
 * 
 * @param options - Configuration with Box bounds and Vec3 divisions/color
 * @param target - Optional base shape to voxelize (null creates default)
 * @param manifoldContext - Optional Manifold WASM instance (ManifoldToplevel type)
 * @returns A Manifold object representing the voxelized shape
 */
export function createBoundedVoxels(
  options: BoundedShapeOptions,
  target?: ManifoldType | null,
  manifoldContext?: ManifoldToplevel
): ManifoldType {
  // The 3rd parameter type is ManifoldToplevel
  const M = manifoldContext?.Manifold ?? Manifold;
  const {cube, sphere} = M;
  
  const {bounds, divisions = [3, 3, 3], color} = options;
  
  // Calculate voxel size from bounds and divisions
  const size: Vec3 = [
    (bounds.max[0] - bounds.min[0]) / divisions[0],
    (bounds.max[1] - bounds.min[1]) / divisions[1],
    (bounds.max[2] - bounds.min[2]) / divisions[2]
  ];
  
  // Use target or create default shape
  const baseShape = target ?? sphere(Math.min(...size) * 0.4);
  
  let result = cube([0, 0, 0]); // Empty start
  let first = true;
  
  // Create voxel grid
  for (let x = 0; x < divisions[0]; x++) {
    for (let y = 0; y < divisions[1]; y++) {
      for (let z = 0; z < divisions[2]; z++) {
        const pos: Vec3 = [
          bounds.min[0] + (x + 0.5) * size[0],
          bounds.min[1] + (y + 0.5) * size[1],
          bounds.min[2] + (z + 0.5) * size[2]
        ];
        
        const voxel = baseShape.scale(size).translate(pos);
        result = first ? voxel : result.add(voxel);
        first = false;
      }
    }
  }
  
  return result;
}

/**
 * Options for creating a 2D to 3D extrusion
 */
export interface ExtrusionOptions {
  polygon: Vec2[];
  height: number;
  twist?: number;
  scale?: Vec2;
}

/**
 * Create a 3D shape by extruding a 2D polygon.
 * Demonstrates using Vec2 arrays with CrossSection.
 * 
 * @param options - Configuration with Vec2 polygon and extrusion params
 * @param target - Unused for this operation (always null)
 * @param manifoldContext - Optional Manifold WASM instance
 * @returns A Manifold object representing the extruded shape
 */
export function createExtrudedShape(
  options: ExtrusionOptions,
  target?: ManifoldType | null,
  manifoldContext?: ManifoldToplevel
): ManifoldType {
  const CS = manifoldContext?.CrossSection ?? CrossSection;
  
  const {polygon, height, twist = 0, scale = [1, 1]} = options;
  
  // Create 2D cross-section from Vec2 array
  const profile = new CS(polygon);
  
  // Extrude to 3D with optional twist and scale
  return profile.extrude(height, twist, scale);
}

/**
 * Create a complex shape with materials using GLTFNode.
 * Demonstrates that GLTFNode and setMaterial are JavaScript utilities
 * that don't need context - they work with any Manifold instance.
 * 
 * @param options - Configuration for the shape
 * @param target - Optional base manifold
 * @param manifoldContext - Optional Manifold WASM instance
 * @returns A GLTFNode with material properties
 */
export function createMaterializedShape(
  options: {size: Vec3; color: Vec3; roughness?: number},
  target?: ManifoldType | null,
  manifoldContext?: ManifoldToplevel
): GLTFNode {
  // WASM type - needs context handling
  const M = manifoldContext?.Manifold ?? Manifold;
  const {cube} = M;
  
  const shape = target ?? cube(options.size);
  
  // GLTFNode is a JavaScript utility - no context needed
  // It works with any Manifold instance
  const node = new GLTFNode();
  node.manifold = shape;
  
  // Set material using Vec3 for color
  // GLTFMaterial is also a JavaScript utility
  const material: GLTFMaterial = {
    baseColorFactor: [...options.color, 1.0],
    roughnessFactor: options.roughness ?? 0.5
  };
  
  node.material = material;
  
  return node;
}

/**
 * Calculate bounding box and create shape at center.
 * Demonstrates working with Box type for bounds calculation.
 * 
 * @param options - Configuration with shapes to bound
 * @param target - Optional shape to add at center of bounds
 * @param manifoldContext - Optional Manifold WASM instance
 * @returns A Manifold with marker at bounding box center
 */
export function createBoundingBoxMarker(
  options: {shapes: ManifoldType[]},
  target?: ManifoldType | null,
  manifoldContext?: ManifoldToplevel
): ManifoldType {
  const M = manifoldContext?.Manifold ?? Manifold;
  const {sphere, cube} = M;
  
  // Combine all shapes to get overall bounds
  let combined = options.shapes[0];
  for (let i = 1; i < options.shapes.length; i++) {
    combined = combined.add(options.shapes[i]);
  }
  
  // Get bounding box (Box type)
  const bounds: Box = combined.boundingBox();
  
  // Calculate center from Box
  const center: Vec3 = [
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
    (bounds.min[2] + bounds.max[2]) / 2
  ];
  
  // Calculate size
  const size: Vec3 = [
    bounds.max[0] - bounds.min[0],
    bounds.max[1] - bounds.min[1],
    bounds.max[2] - bounds.min[2]
  ];
  
  // Create marker at center
  const marker = target ?? sphere(Math.min(...size) * 0.05);
  
  return combined.add(marker.translate(center));
}

// Default export for manifoldCAD.org - demonstrates all functions
export default () => {
  // Example 1: Bounded voxels using Box and Vec3
  const bounds: Box = {
    min: [-50, -50, -50],
    max: [50, 50, 50]
  };
  
  const voxels = createBoundedVoxels(
    {bounds, divisions: [3, 3, 3], color: [1, 0, 0]},
    Manifold.sphere(8)
  );
  
  // Example 2: Extruded shape using Vec2 array
  const star: Vec2[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI * 2) / 10;
    const radius = i % 2 === 0 ? 30 : 15;
    star.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
  }
  
  const extruded = createExtrudedShape(
    {polygon: star, height: 20, twist: 45}
  ).translate([120, 0, 0]);
  
  // Example 3: Bounding box marker
  const shapes = [
    Manifold.cube([20, 20, 20]).translate([0, 0, 40]),
    Manifold.sphere(15).translate([30, 30, 40])
  ];
  
  const withMarker = createBoundingBoxMarker(
    {shapes},
    Manifold.sphere(3)
  ).translate([-120, 0, 0]);
  
  return voxels.add(extruded).add(withMarker);
};
