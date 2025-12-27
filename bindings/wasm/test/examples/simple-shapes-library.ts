// This is a minimal example showing how to create a simple reusable shape library
// that works in both manifoldCAD.org and custom applications.

import type {Manifold as ManifoldType} from '../../manifold-encapsulated-types';
import type {ManifoldToplevel} from '../../manifold';
import {Manifold} from '../../lib/manifoldCAD';

/**
 * Create a simple rounded box shape.
 *
 * @param size - The size of the box
 * @param radius - The radius of the corner spheres
 * @param manifoldContext - Optional Manifold context for custom apps
 * @returns A Manifold object representing a rounded box
 */
export function createRoundedBox(
  size: number = 100,
  radius: number = 10,
  manifoldContext?: ManifoldToplevel
): ManifoldType {
  // Use provided context or fall back to default import
  const M = manifoldContext?.Manifold ?? Manifold;
  const {cube, sphere} = M;

  // Create a cube
  const box = cube([size, size, size], true);

  // Add spheres at each corner for rounding effect
  const positions = [
    [-size/2, -size/2, -size/2],
    [ size/2, -size/2, -size/2],
    [-size/2,  size/2, -size/2],
    [ size/2,  size/2, -size/2],
    [-size/2, -size/2,  size/2],
    [ size/2, -size/2,  size/2],
    [-size/2,  size/2,  size/2],
    [ size/2,  size/2,  size/2],
  ];

  let result = box;
  for (const [x, y, z] of positions) {
    const corner = sphere(radius).translate([x, y, z]);
    result = result.add(corner);
  }

  return result;
}

/**
 * Create a capsule shape (cylinder with spherical ends).
 *
 * @param radius - The radius of the capsule
 * @param height - The height of the cylindrical section
 * @param manifoldContext - Optional Manifold context for custom apps
 * @returns A Manifold object representing a capsule
 */
export function createCapsule(
  radius: number = 10,
  height: number = 50,
  manifoldContext?: ManifoldToplevel
): ManifoldType {
  const M = manifoldContext?.Manifold ?? Manifold;
  const {cylinder, sphere} = M;

  const body = cylinder(radius, height);
  const topCap = sphere(radius).translate([0, 0, height / 2]);
  const bottomCap = sphere(radius).translate([0, 0, -height / 2]);

  return body.add(topCap).add(bottomCap);
}

// For manifoldCAD.org: Export a default function that demonstrates the library
export default () => {
  const box = createRoundedBox(100, 15);
  const capsule = createCapsule(20, 80).translate([150, 0, 0]);
  return box.add(capsule);
};
