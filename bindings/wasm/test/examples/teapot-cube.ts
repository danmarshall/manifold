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

// This example demonstrates how to create a reusable library that works in both
// manifoldCAD.org and custom applications with their own WASM instances.

import type {Manifold as ManifoldType} from '../../manifold-encapsulated-types';
import type {ManifoldToplevel} from '../../manifold';
import {Manifold} from '../../lib/manifoldCAD';

/**
 * Create a teapot-shaped cube with a spout and handle.
 *
 * This function demonstrates the recommended pattern for creating reusable
 * libraries: accept an optional Manifold context parameter that allows the
 * library to work in both manifoldCAD.org and custom applications.
 *
 * @param size - The size of the cube body
 * @param manifoldContext - Optional Manifold context. If not provided,
 *                          uses the default manifoldCAD context.
 * @returns A Manifold object representing the teapot cube
 */
export function createTeapotCube(
  size: number = 100,
  manifoldContext?: ManifoldToplevel
): ManifoldType {
  // Use provided context or fall back to default import
  const M = manifoldContext?.Manifold ?? Manifold;
  const {cube, cylinder, sphere} = M;

  // Create the main cube body
  const body = cube([size, size, size], true);

  // Create a spout (cylindrical with slight taper effect)
  const spoutBase = cylinder(size * 0.15, size * 0.4);
  const spoutTip = cylinder(size * 0.1, size * 0.05)
      .translate([0, 0, size * 0.35]);
  const spout = spoutBase.add(spoutTip)
      .rotate([0, 90, 0])
      .translate([size * 0.5, 0, size * 0.2]);

  // Create a handle (torus-like shape made from cylinders)
  const handleOuter = cylinder(size * 0.12, size * 0.6)
      .rotate([90, 0, 0])
      .translate([-size * 0.45, 0, 0]);
  const handleInner = cylinder(size * 0.08, size * 0.65)
      .rotate([90, 0, 0])
      .translate([-size * 0.45, 0, 0]);
  const handle = handleOuter.subtract(handleInner);

  // Create a lid knob (small sphere on top)
  const knob = sphere(size * 0.1).translate([0, 0, size * 0.55]);

  // Combine all parts
  return body.add(spout).add(handle).add(knob);
}

/**
 * Alternative factory pattern for more complex libraries.
 * Returns a set of functions all bound to the same Manifold context.
 */
export function createTeapotLibrary(manifoldContext?: ManifoldToplevel) {
  const M = manifoldContext?.Manifold ?? Manifold;

  return {
    /**
     * Create a basic teapot cube
     */
    teapotCube: (size: number = 100) => createTeapotCube(size, manifoldContext),

    /**
     * Create a teapot cube with a custom spout angle
     */
    teapotCubeWithAngle: (size: number = 100, spoutAngle: number = 0) => {
      const {cube, cylinder, sphere} = M;

      const body = cube([size, size, size], true);
      const spoutBase = cylinder(size * 0.15, size * 0.4);
      const spoutTip = cylinder(size * 0.1, size * 0.05)
          .translate([0, 0, size * 0.35]);
      const spout = spoutBase.add(spoutTip)
          .rotate([0, 90, 0])
          .rotate([0, 0, spoutAngle])
          .translate([size * 0.5, 0, size * 0.2]);

      const handleOuter = cylinder(size * 0.12, size * 0.6)
          .rotate([90, 0, 0])
          .translate([-size * 0.45, 0, 0]);
      const handleInner = cylinder(size * 0.08, size * 0.65)
          .rotate([90, 0, 0])
          .translate([-size * 0.45, 0, 0]);
      const handle = handleOuter.subtract(handleInner);

      const knob = sphere(size * 0.1).translate([0, 0, size * 0.55]);

      return body.add(spout).add(handle).add(knob);
    },
  };
}

// For visual preview in manifoldCAD.org: export a default function that
// demonstrates the library's functionality. This will be executed when the
// file is run as a top-level script, but not when imported as a library.
export default () => createTeapotCube(100);
