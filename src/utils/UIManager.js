// src/utils/UIManager.js
import GUI from 'lil-gui';

export default class UIManager {
  constructor(materialController) {
    this.matCtrl = materialController;
    this.gui = new GUI({ title: 'Material Controls' });

    // 初始參數
    const params = {
      color: '#' + this.matCtrl.getMaterial().color.getHexString(),
      roughness: this.matCtrl.getMaterial().roughness || 0,
      metalness: this.matCtrl.getMaterial().metalness || 0
    };

    // Color Picker
    this.gui
      .addColor(params, 'color')
      .name('Color')
      .onChange((value) => {
        // 將 #rrggbb 字串轉成十六進位
        const hex = parseInt(value.replace('#', ''), 16);
        this.matCtrl.setColor(hex);
      });

    // Roughness Slider
    this.gui
      .add(params, 'roughness', 0, 1, 0.01)
      .name('Roughness')
      .onChange((v) => this.matCtrl.setRoughness(v));

    // Metalness Slider
    this.gui
      .add(params, 'metalness', 0, 1, 0.01)
      .name('Metalness')
      .onChange((v) => this.matCtrl.setMetalness(v));
  }
}
