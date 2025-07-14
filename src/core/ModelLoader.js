// src/core/ModelLoader.js
import {
  EventDispatcher
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TextureLoader } from 'three/src/loaders/TextureLoader.js';

export default class ModelLoader extends EventDispatcher {
  constructor() {
    super();
    // 1. 初始化 glTF 載入器
    this.gltfLoader = new GLTFLoader();
    // 2. 初始化貼圖載入器
    this.textureLoader = new TextureLoader();
  }

  /**
   * 載入 glTF 模型或貼圖
   * @param {string} url 資源位址 (可為 .glb/.gltf/.jpg/.png)
   */
  loadModel(url) {
    // 簡單判斷副檔名決定使用哪一個 Loader
    const ext = url.split('.').pop().toLowerCase();
    if (ext === 'gltf' || ext === 'glb') {
      this._loadGLTF(url);
    } else if (['jpg','jpeg','png'].includes(ext)) {
      this._loadTexture(url);
    } else {
      // 未知格式
      this.dispatchEvent({ type: 'error', message: `不支援的格式：${ext}` });
    }
  }

  // 私有：載入 glTF
  _loadGLTF(url) {
    this.gltfLoader.load(
      url,
      (gltf) => {
        // 載入完成：廣播 'load' 事件，攜帶 gltf.scene
        this.dispatchEvent({ type: 'load', content: gltf.scene });
      },
      (xhr) => {
        // 載入進度：廣播 'progress' 事件
        const percent = (xhr.loaded / xhr.total) * 100;
        this.dispatchEvent({ type: 'progress', progress: percent });
      },
      (err) => {
        // 載入失敗：廣播 'error' 事件
        this.dispatchEvent({ type: 'error', error: err });
      }
    );
  }

  // 私有：載入貼圖
  _loadTexture(url) {
    this.textureLoader.load(
      url,
      (texture) => {
        this.dispatchEvent({ type: 'load', content: texture });
      },
      (xhr) => {
        const percent = (xhr.loaded / xhr.total) * 100;
        this.dispatchEvent({ type: 'progress', progress: percent });
      },
      (err) => {
        this.dispatchEvent({ type: 'error', error: err });
      }
    );
  }

  /**
   * 註冊載入完成 (load) 回呼
   * @param {Function} callback signature: ({ content }) => void
   */
  onLoad(callback) {
    this.addEventListener('load', (e) => callback(e.content));
  }

  /**
   * 註冊載入進度 (progress) 回呼
   * @param {Function} callback signature: (progress: number) => void
   */
  onProgress(callback) {
    this.addEventListener('progress', (e) => callback(e.progress));
  }

  /**
   * 註冊載入錯誤 (error) 回呼
   * @param {Function} callback signature: (error: any) => void
   */
  onError(callback) {
    this.addEventListener('error', (e) => callback(e.error || e.message));
  }
}
