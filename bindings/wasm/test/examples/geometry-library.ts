// Example library demonstrating reusable geometry functions
// This can be imported by other ManifoldCAD models

import {Manifold, CrossSection, Vec3} from 'manifold-3d/manifoldCAD';

/**
 * Create a parametric torus
 */
export function torus(
  majorRadius: number = 20,
  minorRadius: number = 5,
  majorSegments: number = 48,
  minorSegments: number = 24
): Manifold {
  const circle = CrossSection.circle(minorRadius, minorSegments);
  const path: Vec3[] = [];
  
  for (let i = 0; i <= majorSegments; i++) {
    const angle = (i / majorSegments) * Math.PI * 2;
    path.push([
      Math.cos(angle) * majorRadius,
      Math.sin(angle) * majorRadius,
      0
    ]);
  }
  
  return Manifold.revolve(
    circle.translate([majorRadius, 0]),
    majorSegments
  );
}

/**
 * Create a twisted box
 */
export function twistedBox(
  size: [number, number, number],
  twistDegrees: number = 45,
  segments: number = 20
): Manifold {
  const profile = CrossSection.square([size[0], size[1]], true);
  return profile.extrude(size[2], segments, twistDegrees);
}

/**
 * Create a spring/coil
 */
export function spring(
  coilRadius: number = 10,
  wireRadius: number = 2,
  coils: number = 5,
  pitch: number = 8,
  segments: number = 64
): Manifold {
  const circle = CrossSection.circle(wireRadius, 16);
  const path: Vec3[] = [];
  
  const totalSegments = segments * coils;
  for (let i = 0; i <= totalSegments; i++) {
    const t = i / totalSegments;
    const angle = t * Math.PI * 2 * coils;
    const z = t * pitch * coils;
    
    path.push([
      Math.cos(angle) * coilRadius,
      Math.sin(angle) * coilRadius,
      z
    ]);
  }
  
  // Note: This is a simplified version. Real implementation would use
  // Manifold.extrude with a path or custom mesh construction
  return torus(coilRadius, wireRadius, segments, 16);
}

/**
 * Create a rounded box (box with filleted edges)
 */
export function roundedBox(
  size: [number, number, number],
  radius: number = 2
): Manifold {
  const [width, depth, height] = size;
  
  // Create the main box
  const box = Manifold.cube([
    width - 2 * radius,
    depth - 2 * radius,
    height - 2 * radius
  ], true);
  
  // Create rounded edges with cylinders
  const cylinder = Manifold.cylinder(height - 2 * radius, radius, radius);
  
  // Add cylinders at the four corners
  const corners = [
    cylinder.translate([(width - 2 * radius) / 2, (depth - 2 * radius) / 2, 0]),
    cylinder.translate([-(width - 2 * radius) / 2, (depth - 2 * radius) / 2, 0]),
    cylinder.translate([(width - 2 * radius) / 2, -(depth - 2 * radius) / 2, 0]),
    cylinder.translate([-(width - 2 * radius) / 2, -(depth - 2 * radius) / 2, 0])
  ];
  
  // Create the rounded edges
  let result = box;
  for (const corner of corners) {
    result = result.add(corner);
  }
  
  // Add spheres at the 8 vertices
  const sphere = Manifold.sphere(radius, 16);
  const dw = (width - 2 * radius) / 2;
  const dd = (depth - 2 * radius) / 2;
  const dh = (height - 2 * radius) / 2;
  
  for (const x of [-dw, dw]) {
    for (const y of [-dd, dd]) {
      for (const z of [-dh, dh]) {
        result = result.add(sphere.translate([x, y, z]));
      }
    }
  }
  
  return result.hull();
}

/**
 * Create a regular polygon as a 2D CrossSection
 */
export function regularPolygon(
  sides: number,
  radius: number = 10
): CrossSection {
  const points: [number, number][] = [];
  
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    points.push([
      Math.cos(angle) * radius,
      Math.sin(angle) * radius
    ]);
  }
  
  return new CrossSection([points]);
}

/**
 * Create a star shape as a 2D CrossSection
 */
export function star(
  points: number = 5,
  outerRadius: number = 10,
  innerRadius: number = 5
): CrossSection {
  const vertices: [number, number][] = [];
  
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    vertices.push([
      Math.cos(angle) * radius,
      Math.sin(angle) * radius
    ]);
  }
  
  return new CrossSection([vertices]);
}

// Default export for preview/testing
export default () => {
  const box = roundedBox([30, 20, 10], 3);
  const torusShape = torus(15, 3);
  const starShape = star(5, 12, 6).extrude(5);
  
  return box
    .add(torusShape.translate([0, 0, 20]))
    .add(starShape.translate([0, 0, -10]));
};
