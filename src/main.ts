import {vec3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import RoadNetwork from './RoadNetwork';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  showHeight: false,
  showPopulation: false,
  showBoth: true
};

let screenQuad: ScreenQuad;
let highway: Square;
let time: number = 0.0;

function loadScene() {
  screenQuad = new ScreenQuad();
  screenQuad.create();

  let roadNetwork: RoadNetwork = new RoadNetwork(1, 1, 0);
  roadNetwork.createNetwork();

  highway = new Square();
  highway.create();
  highway.setInstanceVBOs(new Float32Array(roadNetwork.highwayTranslate), new Float32Array(roadNetwork.highwayRotate), new Float32Array(roadNetwork.highwayScale), new Float32Array(roadNetwork.highwayColor));
  highway.setNumInstances(roadNetwork.highwayCount);
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();

  var showHeightController = gui.add(controls, 'showHeight').name("Show Height").listen();
  showHeightController.onChange(function(value: boolean){
    controls.showHeight = true;
    controls.showPopulation = false;
    controls.showBoth = false;
  });

  var showPopulationController = gui.add(controls, 'showPopulation').name("Show Population").listen();
  showPopulationController.onChange(function(value: boolean){
    controls.showHeight = false;
    controls.showPopulation = true;
    controls.showBoth = false;
  });

  var showBothController = gui.add(controls, 'showBoth').name("Show Both").listen();
  showBothController.onChange(function(value: boolean){
    controls.showHeight = false;
    controls.showPopulation = false;
    controls.showBoth = true;
  });

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(50, 50, 10), vec3.fromValues(50, 50, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending
  // gl.enable(gl.DEPTH_TEST);

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flat.setTime(time++);
    if (controls.showHeight) {
      flat.setMapState(0);
    } else if (controls.showPopulation) {
      flat.setMapState(1);
    } else if (controls.showBoth) {
      flat.setMapState(2);
    }
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    renderer.render(camera, flat, [screenQuad]);
    renderer.render(camera, instancedShader, [
      highway
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
