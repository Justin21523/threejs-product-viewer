// src/core/CameraController.js
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default class CameraController {
  /**
   * @param {THREE.PerspectiveCamera} camera  已建立的 PerspectiveCamera
   * @param {HTMLElement} domElement            渲染器的 DOM 元素，用於綁定事件
   */
  constructor(camera, domElement) {
    this.camera = camera;
    // 1. 建立 OrbitControls
    this.controls = new OrbitControls(this.camera, domElement);
    this.controls.enableDamping = true;       // 啟用阻尼 (damping) 讓操作更平滑
    this.controls.dampingFactor = 0.05;       // 阻尼係數

    // 2. 初始參數 (可依需求調整)
    this.controls.minDistance = 1;            // 最小縮放距離
    this.controls.maxDistance = 10;           // 最大縮放距離
    this.controls.enablePan = false;          // 關閉平移 (pan)，只允許旋轉與縮放
  }

  /**
   * 在動畫迴圈中呼叫，更新阻尼等
   */
  update() {
    this.controls.update();
  }

  /**
   * 設定相機位置
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  setPosition(x, y, z) {
    this.camera.position.set(x, y, z);
    this.controls.update();  // 位置改變後也觸發一次更新
  }

  /**
   * 設定控制器目標 (controls.target)，讓相機看向此點
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  setTarget(x, y, z) {
    this.controls.target.set(x, y, z);
    this.controls.update();
  }

  /**
   * 註冊使用者開始拖曳事件
   * @param {Function} callback 
   */
  onStart(callback) {
    this.controls.addEventListener('start', callback);
  }

  /**
   * 註冊使用者結束拖曳事件
   * @param {Function} callback 
   */
  onEnd(callback) {
    this.controls.addEventListener('end', callback);
  }
}
