// src/core/Application.js
import * as THREE from 'three';
import SceneManager from './SceneManager.js';
import CameraController from './CameraController.js';
import UIManager from '../utils/UIManager.js';
import EnvMapLoader   from '../utils/EnvMapLoader.js';
import PostProcessing from './PostProcessing.js';

export default class Application {
  constructor({ canvas }) {
    // 1. 儲存 HTMLCanvasElement 以供 Renderer 使用
    this.canvas = canvas;
    // 2. 建立 Three.js Renderer
    //    antialias: true => 反鋸齒，讓邊緣更平滑
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // 3. 建立 SceneManager，負責 Scene 與 Light 初始化
    this.sceneManager = new SceneManager();
    // 2. 在 Application 自行建立 camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 1.5, 3);
    
    // 2. 等模型 & MaterialController 準備好之後，再 init UI
    this.sceneManager.addEventListener('modelLoaded', () => {
      // 確保 this.sceneManager.materialController 已被設定
        this.uiManager = new UIManager(this.sceneManager.materialController);
    });
    
    // 4. 建立 CameraController，拿我們剛剛建立的 camera
    this.cameraController = new CameraController(
      this.camera,
      this.renderer.domElement
    );

    // 5. 綁定 resize 事件，保持畫面比例
    window.addEventListener('resize', this.onResize.bind(this));

    //  先載入 environment map
   this.envLoader = new EnvMapLoader(this.renderer, this.sceneManager.scene);
   this.envLoader
     .load('/envmaps/royal_esplanade_1k.hdr')
     .then(() => {
       // 2. 環境貼圖就緒後，再啟動後處理 (post-processing)
       this.post = new PostProcessing(
         this.renderer,
         this.sceneManager.scene,
         this.camera,
         {
           bloom: { enabled: true },
           ssao:  { enabled: true }
         }
       );
     })
     .catch(console.error);
    
    // 6. 啟動渲染循環
    this.animate();
  }

  onResize() {
    // 當視窗大小改變時，同步更新 Renderer 與 Camera
    const { innerWidth: w, innerHeight: h } = window;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.post) {
       this.post.setSize(w, h);
     }
  }

  animate() {
    // 1. 維持 requestAnimationFrame (最佳化動畫)
    requestAnimationFrame(this.animate.bind(this));
    // 2. 更新 Controls (enableDamping 時需呼叫)
    this.cameraController.update();
  
    // **暫時停用後處理**，直接用 WebGLRenderer
    this.renderer.render(this.sceneManager.scene, this.camera);
  }
}
