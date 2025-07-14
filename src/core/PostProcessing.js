// src/core/PostProcessing.js
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }    from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass }      from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { Vector2 }       from 'three';

export default class PostProcessing {
  constructor(renderer, scene, camera, options = {}) {
    // 1. 建立 Composer
    this.composer = new EffectComposer(renderer);
    // 2. 第一個 Pass：正常渲染
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // 3. Bloom Pass
    if (options.bloom?.enabled) {
      const bloom = new UnrealBloomPass(
        new Vector2(window.innerWidth, window.innerHeight),
        options.bloom.strength || 1.5,
        options.bloom.radius   || 0.4,
        options.bloom.threshold|| 0.85
      );
      this.composer.addPass(bloom);
    }

    // 4. SSAO Pass
    if (options.ssao?.enabled) {
      const ssao = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
      ssao.kernelRadius = options.ssao.kernelRadius || 16;
      ssao.minDistance  = options.ssao.minDistance  || 0.005;
      ssao.maxDistance  = options.ssao.maxDistance  || 0.1;
      this.composer.addPass(ssao);
    }
  }

  render() {
    this.composer.render();
  }

  setSize(width, height) {
    this.composer.setSize(width, height);
  }
}
