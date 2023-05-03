import * as THREE from 'https://unpkg.com/three@0.148.0/build/three.module.js';

function group(mesh) {
  const g = new THREE.Group();

  g.wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh), 
    new THREE.LineBasicMaterial({
      color: 'rgb(60,68,70)',
      transparent: true,
      depthWrite: false
    })
  );

  g.add(g.wire);
  return g;
};

function main2() {
  const canvas = document.querySelector('#background');
  const renderer = new THREE.WebGLRenderer({canvas})
  const inside = document.querySelector('#center-graphic');

  const camera = new THREE.PerspectiveCamera(20, 1,1,1000)
  camera.position.z = 50;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('rgb(0,32,41)');

  const octa = group(new THREE.OctahedronGeometry(1));
  const cube = group(new THREE.BoxGeometry(1,1,1));

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
    const insideWidth = inside.clientWidth;
    const insideHeight = inside.clientHeight;
    renderer.setSize(width,height, false);
    const offsetx = (width - insideWidth)/2;
    const offsety = (height - insideHeight)/2;
    camera.setViewOffset(insideWidth*2, insideHeight*2, (insideHeight * 0.4) - offsetx, (insideHeight*0.6) - offsety, width, height);
    time = time * 0.0012;
    t = time - 5;
    t1 = t * freq % 1;
    t2 = (t1 + 0.5) % 1;

    setScale(cube.wire, Math.pow(3,cubeFitOffset+scaleOffset+t1));
    setScale(octa.wire, Math.pow(3,scaleOffset+t2-0.5));
    
    cube.wire.material.opacity = 2-2*t1; 
    octa.wire.material.opacity = 2-2*t2;

    if (t < period * 0.5) {
      octa.wire.material.opacity = 0;
    }
    tDelay1 = Math.max(0, time - 2.5);
    tDelay2 = Math.max(0, time - 10);
    tSlowStart1 = tDelay1 / (1 + 20./tDelay1 + tDelay1/5.);
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

export default main2;