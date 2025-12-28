// This example shows how to use the TeapotCube library in manifoldCAD.org
// It demonstrates importing and using a reusable library that works in both
// manifoldCAD.org and custom applications.

import {createTeapotCube, createTeapotLibrary} from './teapot-cube';

// Simple usage: create a single teapot cube
const simpleTeapot = createTeapotCube(100);

// Library usage: create multiple teapots with different configurations
const lib = createTeapotLibrary();
const teapot1 = lib.teapotCube(50).translate([-120, 0, 0]);
const teapot2 = lib.teapotCubeWithAngle(50, 45).translate([0, 0, 0]);
const teapot3 = lib.teapotCube(50).translate([120, 0, 0]);

// Combine all teapots into a single model
const allTeapots = teapot1.add(teapot2).add(teapot3);

// Export the result for manifoldCAD.org
export default allTeapots;
