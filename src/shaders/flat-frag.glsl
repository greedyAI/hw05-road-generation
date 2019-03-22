#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;
uniform int u_MapState;

in vec2 fs_Pos;
out vec4 out_Col;

#define MAX_DIST 100.0

float random1(vec2 p, vec2 seed) {
  return fract(sin(dot(p + seed, vec2(127.1, 311.7))) * 43758.5453);
}

float quinticSmooth(float t) {
  float x = clamp(t, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0  - 15.0) + 10.0);
}

float bias(float b, float t) {
  return pow(t, log(b) / log(0.5));
}

float gain(float g, float t) {
  if (t < 0.5) {
    return bias(1.0 - g, 2.0 * t) / 2.0;
  } else {
    return 1.0 - bias(1.0 - g, 2.0 - 2.0 * t) / 2.0;
  }
}

float interpRand(float x, float z) {
  vec2 seed = vec2(1.0, 1.0);

  float intX = floor(x);
  float fractX = fract(x);
  float intZ = floor(z);
  float fractZ = fract(z);

  vec2 c1 = vec2(intX, intZ);
  vec2 c2 = vec2(intX + 1.0, intZ);
  vec2 c3 = vec2(intX, intZ + 1.0);
  vec2 c4 = vec2(intX + 1.0, intZ + 1.0);

  float v1 = random1(c1, seed);
  float v2 = random1(c2, seed);
  float v3 = random1(c3, seed);
  float v4 = random1(c4, seed);

  float i1 = mix(v1, v2, quinticSmooth(fractX));
  float i2 = mix(v3, v4, quinticSmooth(fractX));
  return mix(i1, i2, quinticSmooth(fractZ));
}

float heightField(vec2 pos) {
  float total = 0.0;
  int octaves = 16;
  float persistence = 0.5;
  for (int i = 0; i < octaves; i++) {
    float freq = pow(1.5, float(i)) * 1.75;
    float amp = pow(persistence, float(i));
    total += interpRand(pos.x * freq, pos.y * freq) * amp;
  }
  return total;
}

float populationDensity(vec2 pos) {
  float total = 0.0;
  int octaves = 16;
  float persistence = 0.75;
  for (int i = 0; i < octaves; i++) {
    float freq = pow(1.5, float(i)) * 5.0;
    float amp = pow(persistence, float(i));
    total += interpRand(pos.x * freq, pos.y * freq) * amp;
  }
  return total;
}

void main() {
  vec2 heightOffset = vec2(-1.89, -1.71);
  vec2 populationOffset = vec2(-1.89, -2.1);
  float heightField = heightField(fs_Pos + heightOffset);
  float populationDensity = populationDensity(fs_Pos + populationOffset);
  if (heightField > 0.75) {
    out_Col = vec4(vec3(51.0 / 255.0, 153.0 / 255.0, 255.0 / 255.0) * (2.0 - heightField), 1.0);
  } else {
    vec3 heightCol = vec3(90.0 / 255.0, 77.0 / 255.0, 65.0 / 255.0) * (0.9 - heightField) * 3.0;
    vec3 popCol;
    populationDensity *= bias(0.775, 0.75 - heightField) * 1.5;
    if (populationDensity < 1.0) {
      popCol = mix(vec3(255.0 / 255.0, 255.0 / 255.0, 255.0 / 255.0), vec3(255.0 / 255.0, 255.0 / 255.0, 0.0 / 255.0), populationDensity);
    } else {
      popCol = mix(vec3(255.0 / 255.0, 255.0 / 255.0, 0.0 / 255.0), vec3(255.0 / 255.0, 0.0 / 255.0, 0.0 / 255.0), populationDensity - 1.0);
    }
    if (u_MapState == 0) {
      out_Col = vec4(heightCol, 1.0);
    } else if (u_MapState == 1) {
      out_Col = vec4(popCol, 1.0);
    } else {
      out_Col = vec4(mix(heightCol, popCol, 0.5), 1.0);
    }
  }

}
