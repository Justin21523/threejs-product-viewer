// src/utils/LoaderUI.js
export default class LoaderUI {
  /**
   * @param {HTMLElement} container - 放置 loading UI 的父層元素，預設 document.body
   */
  constructor(container = document.body) {
    // 1. 建立遮罩層 (overlay)
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed', top: '0', left: '0',
      width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      zIndex: '9999'
    });

    // 2. 建立 Spinner（旋轉圖示）
    this.spinner = document.createElement('div');
    this.spinner.className = 'loader-spinner';
    this.overlay.appendChild(this.spinner);

    // 3. 建立進度條容器 (progress bar container)
    this.progressContainer = document.createElement('div');
    Object.assign(this.progressContainer.style, {
      width: '50%', maxWidth: '300px',
      backgroundColor: '#ccc',
      borderRadius: '4px',
      marginTop: '1rem', overflow: 'hidden'
    });
    this.overlay.appendChild(this.progressContainer);

    // 4. 建立進度條 (progress bar)
    this.progressBar = document.createElement('div');
    Object.assign(this.progressBar.style, {
      height: '10px', width: '0%',
      backgroundColor: '#4caf50'
    });
    this.progressContainer.appendChild(this.progressBar);

    // 5. 將 overlay 加入頁面
    container.appendChild(this.overlay);

    // 6. 預先隱藏
    this.hide();

    // 7. 動態注入 CSS for spinner animation
    const style = document.createElement('style');
    style.textContent = `
.loader-spinner {
  width: 50px; height: 50px;
  border: 6px solid #f3f3f3;
  border-top: 6px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`;
    document.head.appendChild(style);
  }

  /** 顯示 Loading UI */
  show() {
    this.overlay.style.display = 'flex';
  }

  /** 隱藏 Loading UI */
  hide() {
    this.overlay.style.display = 'none';
  }

  /**
   * 設定進度條百分比 (0 – 100)
   * @param {number} percent
   */
  setProgress(percent) {
    this.progressBar.style.width = `${percent}%`;
    // 當進度到 100% 自動隱藏
    if (percent >= 100) this.hide();
  }
}
