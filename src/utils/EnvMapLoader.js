// src/utils/EnvMapLoader.js
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export default class EnvMapLoader {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;
    // PMREMGenerator 用來生成 PBR 環境貼圖
    this.pmremGenerator = new THREE.PMREMGenerator(renderer);
    this.pmremGenerator.compileEquirectangularShader();
  }

  load(path) {
    return new Promise((resolve, reject) => {
       new RGBELoader()
         // 用 FloatType 才在 RGBELoader 支援列表裡
        .setDataType(THREE.FloatType)
        .load(
          path,
          (hdrTexture) => {
            // 轉成 environment map
            const envMap = this.pmremGenerator
              .fromEquirectangular(hdrTexture)
              .texture;
            // 設定場景環境貼圖
            this.scene.environment = envMap;
            // 釋放中間貼圖
            hdrTexture.dispose();
            this.pmremGenerator.dispose();
            resolve(envMap);
          },
          undefined,
          (err) => reject(err)
        );
    });
  }
}
