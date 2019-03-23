import {vec2, vec3, vec4, mat3, mat4, quat} from 'gl-matrix';
import {gl} from './globals';

class Terrain {
  noise(p: vec3) {
    let val: number = Math.abs(Math.sin((p[0] * 10.0 + 100.0) * 987.654 + (p[1] * 10.0 + 100.0) * 123.456 + (p[2] * 10.0 + 100.0) * 531.975) * 85734.3545);
    return val - Math.floor(val);
  }

  noise2(p: vec3) {
    let val: number = Math.abs(Math.sin((p[0] * 10.0 - 100.0) * 456.789 + (p[1] * 10.0 - 100.0) * 654.321 + (p[2] * 10.0 - 100.0) * 579.135) * 54534.3758);
    return val - Math.floor(val);
  }

  random1(p: vec2, seed: vec2) {
    vec2.add(p, p, seed);
    return (Math.sin(vec2.dot(p, vec2.fromValues(127.1, 311.7))) * 43758.5453) % 1.0;
  }

  quinticSmooth(t: number) {
    let x: number = Math.max(0.0, Math.min(t, 1.0));
    return x * x * x * (x * (x * 6.0  - 15.0) + 10.0);
  }

  bias(b: number, t: number) {
    return Math.pow(t, Math.log(b) / Math.log(0.5));
  }

  mix(v1: number, v2: number, a: number) {
    return v1 * (1 - a) + v2 * a;
  }

  interpRand(x: number, z: number) {
    let seed: vec2 = vec2.fromValues(1.0, 1.0);

    let intX: number = Math.floor(x);
    let fractX: number = x % 1.0;
    let intZ: number = Math.floor(z);
    let fractZ: number = z % 1.0;

    let c1: vec2 = vec2.fromValues(intX, intZ);
    let c2: vec2 = vec2.fromValues(intX + 1.0, intZ);
    let c3: vec2 = vec2.fromValues(intX, intZ + 1.0);
    let c4: vec2 = vec2.fromValues(intX + 1.0, intZ + 1.0);

    let v1: number = this.random1(c1, seed);
    let v2: number = this.random1(c2, seed);
    let v3: number = this.random1(c3, seed);
    let v4: number = this.random1(c4, seed);

    let i1: number = this.mix(v1, v2, this.quinticSmooth(fractX));
    let i2: number = this.mix(v3, v4, this.quinticSmooth(fractX));
    return this.mix(i1, i2, this.quinticSmooth(fractZ));
  }

  heightFieldFBM(pos: vec2) {
    let total: number = 0.0;
    let octaves: number  = 16;
    let persistence: number = 0.5;
    for (let i: number = 0; i < octaves; i++) {
      let freq: number = Math.pow(1.5, i) * 1.75;
      let amp: number = Math.pow(persistence, i);
      total += this.interpRand(pos[0] * freq, pos[1] * freq) * amp;
    }
    return total;
  }

  populationDensityFBM(pos: vec2) {
    let total: number = 0.0;
    let octaves: number = 16;
    let persistence: number = 0.75;
    for (let i: number = 0; i < octaves; i++) {
      let freq: number = Math.pow(1.5, i) * 5.0;
      let amp: number = Math.pow(persistence, i);
      total += this.interpRand(pos[0] * freq, pos[1] * freq) * amp;
    }
    return total;
  }

  heightField(pos: vec2) {
    let heightOffset: vec2 = vec2.fromValues(-1.89, -1.71);
    vec2.add(pos, pos, heightOffset);
    let heightField: number = this.heightFieldFBM(pos);
    if (heightField > 0.75) {
      return 0;
    } else {
      return 0.75 - heightField;
    }
  }

  populationDensity(pos: vec2) {
    let heightOffset: vec2 = vec2.fromValues(-1.89, -1.71);
    let populationOffset: vec2 = vec2.fromValues(-1.89, -2.1);
    vec2.add(heightOffset, pos, heightOffset);
    vec2.add(populationOffset, pos, populationOffset);
    let heightField: number = this.heightFieldFBM(heightOffset);
    let populationDensity: number = this.populationDensityFBM(populationOffset);
    if (heightField > 0.75) {
      return 0;
    } else {
      populationDensity *= this.bias(0.775, 0.75 - heightField) * 1.5;
      return populationDensity;
    }
  }

}

export default Terrain;
