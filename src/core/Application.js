// src/core/Application.js
import * as THREE from 'three';
import SceneManager from './SceneManager.js';

export default class Application {
  constructor({ canvas }) {
    // 1. 儲存 HTMLCanvasElement 以供 Renderer 使用
    this.canvas = canvas;

    // 2. 建立 Three.js Renderer
    //    antialias: true => 反鋸齒，讓邊緣更平滑
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // 3. 建立 SceneManager，負責 Scene 與 Light 初始化
    this.sceneManager = new SceneManager();

    // 4. 建立 CameraController，負責 Camera 與 Controls
    //    這邊先透過 sceneManager 取得 camera
    this.camera = this.sceneManager.camera;
    this.controls = this.sceneManager.controls;

    // 5. 綁定 resize 事件，保持畫面比例
    window.addEventListener('resize', this.onResize.bind(this));

    // 6. 啟動渲染循環
    this.animate();
  }

  onResize() {
    // 當視窗大小改變時，同步更新 Renderer 與 Camera
    const { innerWidth: w, innerHeight: h } = window;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  animate() {
    // 1. 維持 requestAnimationFrame (最佳化動畫)
    requestAnimationFrame(this.animate.bind(this));

    // 2. 更新 Controls (enableDamping 時需呼叫)
    this.controls.update();

    // 3. 進行場景渲染
    this.renderer.render(this.sceneManager.scene, this.camera);
  }
}
