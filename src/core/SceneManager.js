// src/core/SceneManager.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/js/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/js/loaders/GLTFLoader.js';
import ModelLoader from './ModelLoader.js';
import LoaderUI from '../utils/LoaderUI.js';
import MaterialController from './MaterialController';

export default class SceneManager {
  constructor() {
    // 1. 建立場景 (Scene)
    this.scene = new THREE.Scene();

    // 2. 初始化相機 (PerspectiveCamera)
    this.camera = new THREE.PerspectiveCamera(
      45, window.innerWidth / window.innerHeight, 0.1, 100
    );
    this.camera.position.set(0, 1.5, 3);

    // 3. 設定光源 (Lighting)
    this._initLights();

    //  建立 LoaderUI
    this.loaderUI = new LoaderUI();
    
    // 建立 ModelLoader
    this.loader = new ModelLoader();
    // 註冊事件
    this.loader.onProgress(p => {
      this.loaderUI.show();
      this.loaderUI.setProgress(p);
    });
    this.loader.onLoad(gltf => {
      const mesh = gltf.scene.children.find(obj => obj.isMesh);
      const matCtrl = new MaterialController('standard', { color: 0xdddddd });
      mesh.material = matCtrl.getMaterial();
      this.scene.add(gltf.scene);
      // 儲存 matCtrl 方便 UIManager 調用
      this.materialController = matCtrl;
      // 確保進度條到 100% 並隱藏
      this.loaderUI.setProgress(100);
    });
    this.loader.onError(err => {
      console.error('載入錯誤：', err);
      this.loaderUI.hide();
    });
    // 開始載入
    this.loader.loadModel('models/product.glb');
    
    // 4. 初始化 Controls
    //    OrbitControls 需要 camera 與 renderer.domElement
    this.controls = new OrbitControls(this.camera, document.body); 
    this.controls.enableDamping = true;

    // 5. 載入模型
    this._loadModel();
  }

  _initLights() {
    // 環境光 (AmbientLight)：提供整場景基礎亮度
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    // 平行光 (DirectionalLight)：模擬太陽光，投射陰影與立體感
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7.5);
    this.scene.add(dirLight);
  }

  _loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      'models/product.glb',
      (gltf) => {
        // 成功載入後，把 gltf.scene 加入 Three.js 場景
        this.scene.add(gltf.scene);
      },
      (xhr) => console.log(`載入 ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`),
      (err) => console.error('模型載入錯誤：', err)
    );
  }
}
