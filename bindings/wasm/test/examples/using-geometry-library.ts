// Example showing how to use a local geometry library
// This imports functions from the geometry-library.ts file

import {roundedBox, torus, star, regularPolygon} from './geometry-library.ts';
import {Manifold} from 'manifold-3d/manifoldCAD';

/**
 * Create a decorative container using library functions
 */
function createContainer() {
  // Base container with rounded edges
  const outer = roundedBox([60, 60, 40], 5);
  const inner = roundedBox([54, 54, 36], 4).translate([0, 0, 2]);
  
  // Hollow out the container
  const container = outer.subtract(inner);
  
  // Add decorative elements
  // Create star-shaped cutouts on the sides
  const starCutout = star(5, 8, 4).extrude(10);
  
  // Position cutouts on each side
  const cutout1 = starCutout
    .rotate([0, 90, 0])
    .translate([30, 0, 20]);
  const cutout2 = starCutout
    .rotate([0, -90, 0])
    .translate([-30, 0, 20]);
  const cutout3 = starCutout
    .rotate([90, 0, 0])
    .translate([0, 30, 20]);
  const cutout4 = starCutout
    .rotate([-90, 0, 0])
    .translate([0, -30, 20]);
  
  return container
    .subtract(cutout1)
    .subtract(cutout2)
    .subtract(cutout3)
    .subtract(cutout4);
}

/**
 * Create a lid for the container
 */
function createLid() {
  // Base of the lid
  const base = roundedBox([62, 62, 4], 5);
  
  // Add a handle using a torus
  const handle = torus(8, 2, 32, 16)
    .rotate([90, 0, 0])
    .translate([0, 0, 8]);
  
  return base.add(handle);
}

/**
 * Create decorative feet
 */
function createFoot() {
  const cylinder = Manifold.cylinder(6, 4, 4);
  const sphere = Manifold.sphere(5, 24);
  return cylinder.add(sphere.translate([0, 0, -3]));
}

// Assemble the complete model
const container = createContainer();
const lid = createLid().translate([0, 0, 42]);

// Add four feet at the corners
const foot = createFoot();
const feet = [
  foot.translate([25, 25, -6]),
  foot.translate([-25, 25, -6]),
  foot.translate([25, -25, -6]),
  foot.translate([-25, -25, -6])
];

let result = container.add(lid);
for (const f of feet) {
  result = result.add(f);
}

export default result;
