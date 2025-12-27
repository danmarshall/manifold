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

// This example demonstrates the 3-parameter pattern for library functions
// that enables functional composition and currying.

import type {Manifold as ManifoldType} from '../../manifold-encapsulated-types';
import type {ManifoldToplevel} from '../../manifold';
import {Manifold} from '../../lib/manifoldCAD';

/**
 * Options for grid layout
 */
export interface GridOptions {
  rows: number;
  cols: number;
  spacing: number;
}

/**
 * Arrange objects in a grid pattern.
 * 
 * This demonstrates the 3-parameter pattern:
 * 1. options - Configuration object
 * 2. target - Optional object to operate on (null creates default shape)
 * 3. manifoldContext - Optional Manifold WASM instance
 * 
 * @param options - Grid configuration
 * @param target - Optional Manifold object to clone to grid positions
 * @param manifoldContext - Optional Manifold context for custom apps
 * @returns A Manifold object with shapes arranged in a grid
 */
export function layoutToGrid(
  options: GridOptions,
  target?: ManifoldType | null,
  manifoldContext?: ManifoldToplevel
): ManifoldType {
  const M = manifoldContext?.Manifold ?? Manifold;
  const {cube} = M;
  
  // Use target or create default shape
  const shape = target ?? cube([10, 10, 10]);
  
  let result = shape;
  for (let row = 0; row < options.rows; row++) {
    for (let col = 0; col < options.cols; col++) {
      if (row === 0 && col === 0) continue; // Skip first position (already have original)
      const offset: [number, number, number] = [
        col * options.spacing,
        row * options.spacing,
        0
      ];
      result = result.add(shape.translate(offset));
    }
  }
  
  return result;
}

/**
 * Options for circular layout
 */
export interface CircularOptions {
  count: number;
  radius: number;
  startAngle?: number;
}

/**
 * Arrange objects in a circular pattern.
 * 
 * @param options - Circular layout configuration
 * @param target - Optional Manifold object to clone to circular positions
 * @param manifoldContext - Optional Manifold context for custom apps
 * @returns A Manifold object with shapes arranged in a circle
 */
export function layoutToCircle(
  options: CircularOptions,
  target?: ManifoldType | null,
  manifoldContext?: ManifoldToplevel
): ManifoldType {
  const M = manifoldContext?.Manifold ?? Manifold;
  const {cylinder} = M;
  
  const shape = target ?? cylinder(5, 10);
  const startAngle = options.startAngle ?? 0;
  const angleStep = (2 * Math.PI) / options.count;
  
  let result = shape;
  for (let i = 1; i < options.count; i++) {
    const angle = startAngle + i * angleStep;
    const x = options.radius * Math.cos(angle);
    const y = options.radius * Math.sin(angle);
    result = result.add(shape.translate([x, y, 0]));
  }
  
  return result;
}

/**
 * Options for linear array
 */
export interface LinearOptions {
  count: number;
  spacing: number;
  direction?: [number, number, number];
}

/**
 * Create a linear array of objects.
 * 
 * @param options - Linear array configuration
 * @param target - Optional Manifold object to clone
 * @param manifoldContext - Optional Manifold context for custom apps
 * @returns A Manifold object with shapes arranged linearly
 */
export function layoutLinear(
  options: LinearOptions,
  target?: ManifoldType | null,
  manifoldContext?: ManifoldToplevel
): ManifoldType {
  const M = manifoldContext?.Manifold ?? Manifold;
  const {sphere} = M;
  
  const shape = target ?? sphere(5);
  const direction = options.direction ?? [1, 0, 0];
  
  let result = shape;
  for (let i = 1; i < options.count; i++) {
    const offset: [number, number, number] = [
      direction[0] * i * options.spacing,
      direction[1] * i * options.spacing,
      direction[2] * i * options.spacing
    ];
    result = result.add(shape.translate(offset));
  }
  
  return result;
}

/**
 * Factory function for creating curried layout functions.
 * This demonstrates functional composition patterns.
 */
export function createLayoutLibrary(manifoldContext?: ManifoldToplevel) {
  return {
    grid: (options: GridOptions) => 
      (target?: ManifoldType | null) => layoutToGrid(options, target, manifoldContext),
    
    circle: (options: CircularOptions) =>
      (target?: ManifoldType | null) => layoutToCircle(options, target, manifoldContext),
    
    linear: (options: LinearOptions) =>
      (target?: ManifoldType | null) => layoutLinear(options, target, manifoldContext),
  };
}

// Default export for manifoldCAD.org
export default () => {
  const baseShape = Manifold.sphere(8);
  
  // Demonstrate functional composition
  const lib = createLayoutLibrary();
  const gridLayout = lib.grid({rows: 3, cols: 3, spacing: 25});
  const circularLayout = lib.circle({count: 6, radius: 50});
  
  // Create a pattern by composing layouts
  const smallGrid = gridLayout(Manifold.cube([5, 5, 5]));
  const pattern = circularLayout(smallGrid);
  
  return pattern;
};
