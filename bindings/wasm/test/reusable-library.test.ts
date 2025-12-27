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

import {expect, suite, test} from 'vitest';
import Module from '../manifold';

import {createTeapotCube, createTeapotLibrary} from './examples/teapot-cube';

suite('Reusable library pattern', () => {
  test('createTeapotCube works with default context', async () => {
    const teapot = createTeapotCube(100);
    expect(teapot.volume()).toBeGreaterThan(0);
    expect(teapot.numVert()).toBeGreaterThan(0);
  });

  test('createTeapotCube works with custom WASM instance', async () => {
    const wasm = await Module();
    wasm.setup();

    const teapot = createTeapotCube(100, wasm);
    expect(teapot.volume()).toBeGreaterThan(0);
    expect(teapot.numVert()).toBeGreaterThan(0);
  });

  test('createTeapotCube with different sizes', async () => {
    const small = createTeapotCube(50);
    const large = createTeapotCube(200);

    expect(large.volume()).toBeGreaterThan(small.volume());
  });

  test('createTeapotLibrary factory pattern works with default context', async () => {
    const lib = createTeapotLibrary();
    const teapot = lib.teapotCube(100);

    expect(teapot.volume()).toBeGreaterThan(0);
    expect(teapot.numVert()).toBeGreaterThan(0);
  });

  test('createTeapotLibrary factory pattern works with custom WASM instance', async () => {
    const wasm = await Module();
    wasm.setup();

    const lib = createTeapotLibrary(wasm);
    const teapot = lib.teapotCube(100);

    expect(teapot.volume()).toBeGreaterThan(0);
    expect(teapot.numVert()).toBeGreaterThan(0);
  });

  test('createTeapotLibrary with custom angle', async () => {
    const lib = createTeapotLibrary();
    const teapot1 = lib.teapotCubeWithAngle(100, 0);
    const teapot2 = lib.teapotCubeWithAngle(100, 45);

    expect(teapot1.volume()).toBeCloseTo(teapot2.volume(), -2);
    expect(teapot1.numVert()).toBeGreaterThan(0);
    expect(teapot2.numVert()).toBeGreaterThan(0);
  });

  test('Both contexts produce geometrically similar results', async () => {
    const wasm = await Module();
    wasm.setup();

    const teapotDefault = createTeapotCube(100);
    const teapotCustom = createTeapotCube(100, wasm);

    // Both should have the same volume (within floating point tolerance)
    expect(teapotDefault.volume()).toBeCloseTo(teapotCustom.volume(), -2);

    // Both should have the same number of vertices
    expect(teapotDefault.numVert()).toBe(teapotCustom.numVert());
  });
});
