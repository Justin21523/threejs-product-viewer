// src/core/MaterialController.js
import * as THREE from 'three';

export default class MaterialController {
  constructor(type = 'standard', options = {}) {
    this.type = type;
    this.options = options;
    this.material = this._createMaterial(type, options);
  }

  _createMaterial(type, options) {
    const params = {
      color: options.color || 0xffffff,
      roughness: options.roughness !== undefined ? options.roughness : 0.5,
      metalness: options.metalness !== undefined ? options.metalness : 0.5,
      map: options.map || null
    };

    if (type === 'phong') {
      return new THREE.MeshPhongMaterial({
        color: params.color,
        shininess: options.shininess || 30,
        map: params.map
      });
    }

    // 預設 standard
    return new THREE.MeshStandardMaterial(params);
  }

  setColor(hex) {
    this.material.color.setHex(hex);
  }

  setRoughness(value) {
    if (this.material.isMeshStandardMaterial) {
      this.material.roughness = value;
    }
  }

  setMetalness(value) {
    if (this.material.isMeshStandardMaterial) {
      this.material.metalness = value;
    }
  }

  setTexture(texture) {
    this.material.map = texture;
    this.material.needsUpdate = true;
  }

  getMaterial() {
    return this.material;
  }
}
