// src/main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();

// Camera (相機)
const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 3);

// Renderer (渲染器)
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// OrbitControls (軌道控制器)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Light (光源)
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5,10,7.5);
scene.add(dirLight);

// GLTFLoader 載入模型 (models/product.glb)
new GLTFLoader().load(
  'models/product.glb',
  gltf => scene.add(gltf.scene),
  xhr => console.log(`載入 ${(xhr.loaded/xhr.total*100).toFixed(2)}%`),
  err => console.error('載入失敗：', err)
);

// 畫面調整
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 動畫迴圈
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
