// src/utils/StatsManager.js

import Stats from 'stats.js';

export default class StatsManager {
  constructor() {
    // 1. 建立 Stats 實例
    this.stats = new Stats();
    // 顯示面板：0 = FPS, 1 = MS, 2 = MB, 3 = custom
    this.stats.showPanel(0);
    // 2. 把面板 DOM 加到頁面左上角
    document.body.appendChild(this.stats.dom);
  }

  // 在每一幀開始前呼叫
  begin() {
    this.stats.begin();
  }

  // 在每一幀渲染後呼叫
  end() {
    this.stats.end();
  }
}
