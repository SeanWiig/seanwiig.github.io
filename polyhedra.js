import * as THREE from 'https://unpkg.com/three@0.148.0/build/three.module.js';

const vertexSolidShader = `
uniform float uOpacity;
uniform float uBright;

varying vec4 fragColor;

const mat4 cols = mat4(
  150.0,68.0,88.0,0.0,
  138.,99.0,156.0,0.0,
  246.0,183.0,106.0,0.0,
  0.0,43.0,54.0,0.0
) / 256.;

const mat3 trig_consts = mat3(
  0.0,sqrt(.75),-sqrt(.75),
  1.0, -0.5, -0.5,
  0.0, 0.0, 0.0
);

const vec3 ones = vec3(1.0);

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  vec3 nv = normalize(normalMatrix * normalize(normal));
  
  // apply color gradients in three directions and at center
  vec4 nv_tripoint = max(vec4(trig_consts * nv, nv.z*nv.z), 0.);
  vec3 nv_color = (cols * nv_tripoint).rgb;

  // saturate slightly
  float c_min = min(nv_color.r,min(nv_color.g,nv_color.b));
  nv_color -= 0.5 * c_min;
  // nv_color = normalize(nv_color);

  // add edge glint
  nv_color += 1.-pow(nv.z,0.1);

  // apply brightness value
  nv_color = mix(nv_color, ones * 0.88, smoothstep(0.,1.,uBright));

  // apply opacity value
  fragColor.rgba = vec4(nv_color.xyz,uOpacity);
}
`;

const vertexGlassyGlintShader = `
#define PI 3.1415926538
uniform float uOpacity;

varying vec4 fragColor;

const vec3 glintDirection = normalize(vec3(0.5,0.3,0.1));

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  vec3 nv = normalize(normalMatrix * normalize(normal));

  float facing_light = max(0.0, dot(nv, glintDirection) - 0.01);

  float glint = sin(uOpacity * PI) * pow(facing_light, 16.0) * 0.1;

  // apply opacity value
  fragColor.rgba = vec4(1.,1.,1.,glint);
}
`;

const fragmentSolidShader = `
varying vec4 fragColor;

void main() {
  // all colors are calculated in vertex shader because the colors of faces of solids should be unvarying
  gl_FragColor = fragColor;
}
`;


const vertexSphereShader = `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentSphereShader = `
uniform float uOpacity;

void main() {
  gl_FragColor = vec4(.0,.9,1.,uOpacity);
}
`;

function group(mesh, radius) {
  const g = new THREE.Group();

  g.solid = new THREE.Mesh(mesh, new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: 0.0 },
      uBright: { value: 0.0 }
    },
    vertexShader: vertexSolidShader,
    fragmentShader: fragmentSolidShader,
    transparent: true
  }));

  g.glassy = new THREE.Mesh(mesh, new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: 0.0 }
    },
    vertexShader: vertexGlassyGlintShader,
    fragmentShader: fragmentSolidShader,
    transparent: true,
    depthWrite: false
  }));

  g.sphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 64, 64),
    new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 0.0 } },
      vertexShader: vertexSphereShader,
      fragmentShader: fragmentSphereShader,
      transparent: true,
      depthWrite: false
    })
  )

  g.wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh), 
    new THREE.LineBasicMaterial({
      color: 'rgb(60,68,70)',
      transparent: true,
      depthWrite: false
    })
  );

  g.add(g.solid);
  g.add(g.glassy);
  g.add(g.sphere);
  g.add(g.wire);
  return g;
};

function main() {
  const canvas = document.querySelector('#center-graphic');
  const renderer = new THREE.WebGLRenderer({canvas});

  const camera = new THREE.PerspectiveCamera(20, 1,1,1000)
  camera.position.z = 50;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('rgb(0,43,54)');

  const octa = group(new THREE.OctahedronGeometry(1),1);
  const cube = group(new THREE.BoxGeometry(1,1,1),Math.sqrt(3)/2);

  const rotator = new THREE.Group();
  rotator.add(cube);
  rotator.add(octa);
  scene.add(rotator);

  let t = 0;
  let t1 = 0;
  let t2 = 0;
  let state = 0;
  let tSlowStart1 = 0;
  let tSlowStart2 = 0;
  let tDelay1 = 0;
  let tDelay2 = 0;

  const cubeFitOffset = (Math.log(2/3) / Math.log(3));
  const scaleOffset = 1.5;

  function setScale(obj, scale) {
    obj.scale.fromArray([scale,scale,scale])
  };

  const period = 8.0;
  const freq = 1.0 / period;

  function render(time) {
    const width = renderer.domElement.clientWidth;
    const height = renderer.domElement.clientHeight;
    renderer.setSize(width,height, false);
    camera.setViewOffset(width*2., height*2., height*0.4, height*(0.6), width, height);
    time = time * 0.0012;
    t = time - 5;
    t1 = t * freq % 1;
    t2 = (t1 + 0.5) % 1;

    setScale(cube.solid, Math.pow(3,cubeFitOffset+scaleOffset+t2-0.5));
    setScale(cube.wire, Math.pow(3,cubeFitOffset+scaleOffset+t1));
    setScale(cube.glassy, Math.pow(3,cubeFitOffset+scaleOffset+t1));
    setScale(cube.sphere, 1.05*Math.pow(3,cubeFitOffset+scaleOffset+t1));
    setScale(octa.solid, Math.pow(3,scaleOffset+t1-1));
    setScale(octa.wire, Math.pow(3,scaleOffset+t2-0.5));
    setScale(octa.glassy, Math.pow(3,scaleOffset+t2-0.5));
    setScale(octa.sphere, 1.05*Math.pow(3,scaleOffset+t2-0.5));
    
    state = t1 < 0.5;
    cube.solid.renderOrder = 1+2*state;
    cube.wire.renderOrder = 2+2*!state;
    cube.glassy.renderOrder = 2+2*!state;
    octa.solid.renderOrder = 1+2*!state;
    octa.wire.renderOrder = 2+2*state;
    octa.glassy.renderOrder = 2+2*state;
    cube.sphere.renderOrder = 0;
    octa.sphere.renderOrder = 0;
    
    cube.solid.material.uniforms.uOpacity.value = Math.min(1,2-2*t2);
    cube.solid.material.uniforms.uBright.value = 1-2*t2;
    cube.sphere.material.uniforms.uOpacity.value = Math.min(t1*0.3,0.2-t1*0.25);
    cube.wire.material.opacity = Math.min(2*t1,2-2*t1);
    cube.glassy.material.uniforms.uOpacity.value = Math.min(t1,1-t1);
    
    octa.solid.material.uniforms.uOpacity.value = Math.min(1,2-2*t1);
    octa.solid.material.uniforms.uBright.value = 1-2*t1;
    octa.sphere.material.uniforms.uOpacity.value = Math.min(t2*0.3,0.2-t2*0.25);
    octa.wire.material.opacity = Math.min(2*t2,2-2*t2);
    octa.glassy.material.uniforms.uOpacity.value = Math.min(t2,1-t2);

    if (t < period * 0.5) {
      octa.wire.material.opacity = 0;
      octa.sphere.material.uniforms.uOpacity.value = 0;
    }
    tDelay1 = Math.max(0, time - 2.5);
    tDelay2 = Math.max(0, time - 10);
    tSlowStart1 = tDelay1 / (1 + 20/tDelay1 + tDelay1/5.);
    tSlowStart2 = tDelay2 / (1 + 20/tDelay2);
    rotator.rotation.x = -0.9553 + tSlowStart2 * 0.5;
    rotator.rotation.y =  tSlowStart2 * 0.15;
    rotator.rotation.z = Math.PI/4 + tSlowStart2 * 0.1;
    camera.rotation.z = tSlowStart1;

    rotator.position.z = -1/(time*0.03);
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

export default main;