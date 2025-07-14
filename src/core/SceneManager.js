// src/core/SceneManager.js
import * as THREE from 'three';
import { EventDispatcher, Scene, AmbientLight, DirectionalLight } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import MaterialController from './MaterialController';

export default class SceneManager extends EventDispatcher {
  constructor() {
    super();
    this.scene = new Scene();
    this.scene.add(new AmbientLight(0xffffff, 0.6));
    const dir = new DirectionalLight(0xffffff, 1);
    dir.position.set(5,10,7.5);
    this.scene.add(dir);

    // 立即呼叫載入
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
    new GLTFLoader().load(
      '/models/product.glb',
      (gltf) => {
        // 1. 先建立 MaterialController
        const matCtrl = new MaterialController('standard', { color: 0xdddddd });
        this.materialController = matCtrl;
        // 2. 對所有子節點做 traverse，找到是真正的 Mesh 才設材質
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.material = matCtrl.getMaterial();
          }
        });
        // 3. 加到 Scene
        this.scene.add(gltf.scene);
        // 4. 通知外部：模型 + 材質已就緒
        this.dispatchEvent({ type: 'modelLoaded' });
      },
      null,
      (err) => console.error(err)
    );
  }
}
