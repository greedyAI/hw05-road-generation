import {vec2, vec3, vec4, mat3, mat4, quat} from 'gl-matrix';
import Drawable from './rendering/gl/Drawable';
import {gl} from './globals';
import Turtle from './Turtle';
import Terrain from './Terrain'

class RoadNetwork {
  upVector: vec3 = vec3.fromValues(0,1,0);
  root: vec2;
  highwayDensity: number;
  streetDensity: number;
  highwayThreshold: number;
  terrain: Terrain;

  highwayTranslate: number[] = [];
  highwayRotate: number[] = [];
  highwayScale: number[] = [];
  highwayColor: number[] = [];
  highwayCount: number = 0;

  streetTranslate: number[] = [];
  streetRotate: number[] = [];
  streetScale: number[] = [];
  streetColor: number[] = [];
  streetCount: number = 0;

  constructor(highwayDensity: number, streetDensity: number, highwayThreshold: number, terrainTexture: Uint8Array, width: number, height: number) {
    this.terrain = new Terrain(terrainTexture, width, height);
    let randX: number = this.terrain.noise(vec3.fromValues(0.0,0.0,0.0)) - 0.5;
    let lowestY: number = -1.0;
    console.log(this.terrain.heightField(vec2.fromValues(randX, lowestY)));
    while (true) {
      if (this.terrain.heightField(vec2.fromValues(randX, lowestY)) > 0) {
        break;
      }
      lowestY += 1.0 / height;
    }
    this.root = vec2.fromValues(randX, lowestY);
    this.highwayDensity = highwayDensity;
    this.streetDensity = streetDensity;
    this.highwayThreshold = highwayThreshold;
  }

  createNetwork() {
    let turtles: Turtle[] = [];
    let rootCopy: vec3 = vec3.fromValues(this.root[0], this.root[1], 0.999);
    turtles.push(new Turtle(rootCopy, vec3.fromValues(0,1,0), vec3.fromValues(0.005, 0.1 / this.highwayDensity, 0.0), 0));
    let currentTurtle: Turtle = turtles[0];
    while (this.highwayCount < 10 && currentTurtle != null) {
      let newTurtle1: Turtle = currentTurtle.copy();
      newTurtle1.depth += 1;
      newTurtle1.rotate(vec3.fromValues(0,0,1), 180 * this.terrain.noise(currentTurtle.position) - 90);
      newTurtle1.move();
      if (this.terrain.populationDensity(vec2.fromValues(newTurtle1.position[0], newTurtle1.position[1])) > this.highwayThreshold) {
        newTurtle1.moveBack();
        let quaternion: quat = quat.fromValues(0,0,0,1);
        quat.rotationTo(quaternion, this.upVector, newTurtle1.orientation);
        quat.normalize(quaternion, quaternion);
        this.highwayTranslate.push(newTurtle1.position[0], newTurtle1.position[1], 0);
        this.highwayRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
        this.highwayScale.push(newTurtle1.scale[0], newTurtle1.scale[1], newTurtle1.scale[2], 1);
        this.highwayColor.push(0,0,0,1);
        this.highwayCount += 1
        newTurtle1.move();
        turtles.push(newTurtle1);
      }

      let newTurtle2: Turtle = currentTurtle.copy();
      newTurtle2.depth += 1;
      newTurtle2.rotate(vec3.fromValues(0,0,1), 180 * this.terrain.noise2(currentTurtle.position) - 90);
      newTurtle2.move();
      if (this.terrain.populationDensity(vec2.fromValues(newTurtle2.position[0], newTurtle2.position[1])) > this.highwayThreshold) {
        newTurtle1.moveBack();
        let quaternion: quat = quat.fromValues(0,0,0,1);
        quat.rotationTo(quaternion, this.upVector, newTurtle2.orientation);
        quat.normalize(quaternion, quaternion);
        this.highwayTranslate.push(newTurtle2.position[0], newTurtle2.position[1], 0);
        this.highwayRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
        this.highwayScale.push(newTurtle2.scale[0], newTurtle2.scale[1], newTurtle2.scale[2], 1);
        this.highwayColor.push(0,0,0,1);
        this.highwayCount += 1
        newTurtle2.move();
        turtles.push(newTurtle2);
      }

      currentTurtle.move();
      if (this.terrain.populationDensity(vec2.fromValues(currentTurtle.position[0], currentTurtle.position[1])) > this.highwayThreshold) {
        currentTurtle.moveBack();
        let quaternion: quat = quat.fromValues(0,0,0,1);
        quat.rotationTo(quaternion, this.upVector, currentTurtle.orientation);
        quat.normalize(quaternion, quaternion);
        this.highwayTranslate.push(currentTurtle.position[0], currentTurtle.position[1], 0);
        this.highwayRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
        this.highwayScale.push(currentTurtle.scale[0], currentTurtle.scale[1], currentTurtle.scale[2], 1);
        this.highwayColor.push(0,0,0,1);
        this.highwayCount += 1
        currentTurtle.move();
      } else {
        currentTurtle = turtles.pop();
      }
    }
  }
};

export default RoadNetwork;
