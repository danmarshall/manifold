// WASM Initialization Module
// Handles loading and setting up the Manifold WASM module

import Module from 'manifold-3d';
import type { Manifold as ManifoldType } from 'manifold-3d/lib/manifoldCAD.js';

let ManifoldClass: (typeof ManifoldType) | null = null;

export async function initializeWASM(): Promise<typeof ManifoldType> {
  if (!ManifoldClass) {
    const wasm = await Module();
    wasm.setup();
    
    // Extract Manifold class from WASM module
    // Following pattern from bindings/wasm/examples/three.ts line 22
    const { Manifold } = wasm;
    ManifoldClass = Manifold;
  }
  
  return ManifoldClass;
}

export function getManifoldClass(): (typeof ManifoldType) | null {
  return ManifoldClass;
}
