/**
 * FileDropHandler handles drag and drop file uploads
 * Supports 3D model files (GLB, GLTF) with validation and preview
 */
export class FileDropHandler extends EventTarget {
  constructor(container, options = {}) {
    super();

    this.container = container;
    this.options = {
      allowedExtensions: ['.glb', '.gltf'],
      maxFileSize: 50 * 1024 * 1024, // 50MB default
      showDropZone: true,
      autoProcess: true,
      ...options,
    };

    // Drop zone elements
    this.dropZone = null;
    this.dropOverlay = null;

    // State
    this.isDragOver = false;
    this.isProcessing = false;
    this.currentFile = null;

    // Validation
    this.supportedTypes = new Set([
      'model/gltf-binary',
      'model/gltf+json',
      'application/octet-stream', // GLB files might have this MIME type
      'application/json', // GLTF files might have this MIME type
    ]);

    this.init();
  }

  /**
   * Initialize drag and drop functionality
   */
  init() {
    console.log('FileDropHandler: Initializing drag and drop...');

    // Create drop zone if enabled
    if (this.options.showDropZone) {
      this.createDropZone();
    }

    // Setup event listeners
    this.setupEventListeners();

    console.log('FileDropHandler: Initialization completed');
  }

  /**
   * Create visual drop zone overlay
   */
  createDropZone() {
    // Create drop overlay
    this.dropOverlay = document.createElement('div');
    this.dropOverlay.className = 'file-drop-overlay';
    this.dropOverlay.innerHTML = `
      <div class="drop-zone-content">
        <div class="drop-icon">📁</div>
        <h3>Drop 3D Model Here</h3>
        <p>Supports GLB and GLTF files</p>
        <p class="file-size-limit">Max size: ${this.formatFileSize(this.options.maxFileSize)}</p>
        <button class="browse-button" type="button">Or Browse Files</button>
      </div>
    `;

    // Initially hidden
    this.dropOverlay.style.display = 'none';

    // Add styles
    this.addDropZoneStyles();

    // Create hidden file input
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = this.options.allowedExtensions.join(',');
    this.fileInput.style.display = 'none';
    this.fileInput.addEventListener('change', e => {
      if (e.target.files.length > 0) {
        this.handleFiles(e.target.files);
      }
    });

    // Setup browse button
    const browseButton = this.dropOverlay.querySelector('.browse-button');
    browseButton.addEventListener('click', () => {
      this.fileInput.click();
    });

    // Add to container
    this.container.appendChild(this.dropOverlay);
    this.container.appendChild(this.fileInput);
  }

  /**
   * Add CSS styles for drop zone
   */
  addDropZoneStyles() {
    if (document.getElementById('file-drop-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'file-drop-styles';
    styles.textContent = `
      .file-drop-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        backdrop-filter: blur(5px);
        transition: all 0.3s ease;
      }

      .file-drop-overlay.drag-over {
        background: rgba(33, 150, 243, 0.2);
        border: 3px dashed #2196f3;
      }

      .drop-zone-content {
        text-align: center;
        color: white;
        max-width: 400px;
        padding: 40px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
      }

      .drop-icon {
        font-size: 64px;
        margin-bottom: 20px;
      }

      .drop-zone-content h3 {
        font-size: 24px;
        margin-bottom: 12px;
        color: white;
      }

      .drop-zone-content p {
        font-size: 16px;
        margin-bottom: 8px;
        opacity: 0.8;
      }

      .file-size-limit {
        font-size: 14px !important;
        opacity: 0.6 !important;
      }

      .browse-button {
        background: #2196f3;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 16px;
        cursor: pointer;
        margin-top: 20px;
        transition: background 0.3s ease;
      }

      .browse-button:hover {
        background: #1976d2;
      }

      .file-processing {
        opacity: 0.7;
        pointer-events: none;
      }

      .file-progress {
        margin-top: 20px;
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        overflow: hidden;
      }

      .file-progress-bar {
        height: 100%;
        background: #2196f3;
        width: 0%;
        transition: width 0.3s ease;
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Setup drag and drop event listeners
   */
  setupEventListeners() {
    // Prevent default drag behaviors on container
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.container.addEventListener(
        eventName,
        this.preventDefaults.bind(this),
        false
      );
      document.body.addEventListener(
        eventName,
        this.preventDefaults.bind(this),
        false
      );
    });

    // Drag enter/over events
    ['dragenter', 'dragover'].forEach(eventName => {
      this.container.addEventListener(
        eventName,
        this.handleDragEnter.bind(this),
        false
      );
    });

    // Drag leave event
    this.container.addEventListener(
      'dragleave',
      this.handleDragLeave.bind(this),
      false
    );

    // Drop event
    this.container.addEventListener('drop', this.handleDrop.bind(this), false);

    console.log('FileDropHandler: Event listeners setup completed');
  }

  /**
   * Prevent default drag behaviors
   * @param {Event} e - Drag event
   */
  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  /**
   * Handle drag enter/over events
   * @param {Event} e - Drag event
   */
  handleDragEnter(e) {
    if (this.isProcessing) return;

    this.isDragOver = true;

    if (this.dropOverlay) {
      this.dropOverlay.style.display = 'flex';
      this.dropOverlay.classList.add('drag-over');
    }

    this.dispatchEvent(new CustomEvent('dragenter', { detail: { event: e } }));
  }

  /**
   * Handle drag leave events
   * @param {Event} e - Drag event
   */
  handleDragLeave(e) {
    // Only hide if leaving the container entirely
    if (!this.container.contains(e.relatedTarget)) {
      this.isDragOver = false;

      if (this.dropOverlay) {
        this.dropOverlay.style.display = 'none';
        this.dropOverlay.classList.remove('drag-over');
      }

      this.dispatchEvent(
        new CustomEvent('dragleave', { detail: { event: e } })
      );
    }
  }

  /**
   * Handle drop events
   * @param {Event} e - Drop event
   */
  handleDrop(e) {
    this.isDragOver = false;

    if (this.dropOverlay) {
      this.dropOverlay.classList.remove('drag-over');
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.handleFiles(files);
    }

    this.dispatchEvent(
      new CustomEvent('drop', { detail: { event: e, files } })
    );
  }

  /**
   * Handle dropped or selected files
   * @param {FileList} files - Files to process
   */
  async handleFiles(files) {
    if (this.isProcessing) {
      console.warn('FileDropHandler: Already processing a file');
      return;
    }

    const file = files[0]; // Only handle first file for now

    if (!file) {
      console.warn('FileDropHandler: No file provided');
      return;
    }

    console.log(`FileDropHandler: Processing file "${file.name}"`);

    try {
      // Validate file
      const validation = await this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      this.currentFile = file;
      this.isProcessing = true;

      // Show processing state
      this.showProcessingState();

      // Dispatch file accepted event
      this.dispatchEvent(
        new CustomEvent('fileaccepted', {
          detail: { file, validation },
        })
      );

      if (this.options.autoProcess) {
        // Create object URL and dispatch for loading
        const objectUrl = URL.createObjectURL(file);

        this.dispatchEvent(
          new CustomEvent('fileready', {
            detail: {
              file,
              url: objectUrl,
              cleanup: () => URL.revokeObjectURL(objectUrl),
            },
          })
        );
      }
    } catch (error) {
      console.error('FileDropHandler: File processing failed:', error);
      this.showErrorState(error.message);

      this.dispatchEvent(
        new CustomEvent('fileerror', {
          detail: { file, error: error.message },
        })
      );
    }
  }

  /**
   * Validate uploaded file
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  async validateFile(file) {
    // Check file size
    if (file.size > this.options.maxFileSize) {
      return {
        valid: false,
        error: `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(this.options.maxFileSize)})`,
      };
    }

    // Check file extension
    const extension = this.getFileExtension(file.name);
    if (!this.options.allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File type "${extension}" is not supported. Allowed types: ${this.options.allowedExtensions.join(', ')}`,
      };
    }

    // Check MIME type (basic check)
    if (file.type && !this.supportedTypes.has(file.type)) {
      console.warn(
        `FileDropHandler: Unexpected MIME type "${file.type}" for file "${file.name}"`
      );
      // Don't fail on MIME type, as it can be unreliable for 3D files
    }

    // Basic file content validation
    try {
      const validation = await this.validateFileContent(file);
      if (!validation.valid) {
        return validation;
      }
    } catch (error) {
      return {
        valid: false,
        error: `File content validation failed: ${error.message}`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate file content (basic checks)
   * @param {File} file - File to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateFileContent(file) {
    return new Promise(resolve => {
      const reader = new FileReader();

      reader.onload = e => {
        const data = e.target.result;
        const extension = this.getFileExtension(file.name);

        if (extension === '.glb') {
          // Check GLB magic number
          const view = new DataView(data);
          const magic = view.getUint32(0, true);

          if (magic !== 0x46546c67) {
            // "glTF" in little-endian
            resolve({
              valid: false,
              error: 'Invalid GLB file format',
            });
            return;
          }
        } else if (extension === '.gltf') {
          // Check if valid JSON
          try {
            const text = new TextDecoder().decode(data);
            const gltf = JSON.parse(text);

            if (!gltf.asset || !gltf.asset.version) {
              resolve({
                valid: false,
                error: 'Invalid GLTF file structure',
              });
              return;
            }
          } catch (error) {
            resolve({
              valid: false,
              error: 'Invalid GLTF JSON format',
            });
            return;
          }
        }

        resolve({ valid: true });
      };

      reader.onerror = () => {
        resolve({
          valid: false,
          error: 'Failed to read file content',
        });
      };

      // Read first 1KB for validation
      const blob = file.slice(0, 1024);
      reader.readAsArrayBuffer(blob);
    });
  }

  /**
   * Show processing state in UI
   */
  showProcessingState() {
    if (this.dropOverlay) {
      const content = this.dropOverlay.querySelector('.drop-zone-content');
      content.classList.add('file-processing');

      // Add progress bar
      const progressHtml = `
        <div class="file-progress">
          <div class="file-progress-bar"></div>
        </div>
      `;

      if (!content.querySelector('.file-progress')) {
        content.insertAdjacentHTML('beforeend', progressHtml);
      }
    }
  }

  /**
   * Show error state in UI
   * @param {string} errorMessage - Error message to display
   */
  showErrorState(errorMessage) {
    if (this.dropOverlay) {
      const content = this.dropOverlay.querySelector('.drop-zone-content');
      content.innerHTML = `
        <div class="drop-icon">❌</div>
        <h3>Upload Failed</h3>
        <p>${errorMessage}</p>
        <button class="browse-button" onclick="location.reload()">Try Again</button>
      `;
    }

    // Hide after 5 seconds
    setTimeout(() => {
      this.hideDropZone();
      this.resetState();
    }, 5000);
  }

  /**
   * Update processing progress
   * @param {number} progress - Progress percentage (0-100)
   */
  updateProgress(progress) {
    if (this.dropOverlay) {
      const progressBar = this.dropOverlay.querySelector('.file-progress-bar');
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }
    }
  }

  /**
   * Hide drop zone
   */
  hideDropZone() {
    if (this.dropOverlay) {
      this.dropOverlay.style.display = 'none';
    }
  }

  /**
   * Show drop zone
   */
  showDropZone() {
    if (this.dropOverlay) {
      this.dropOverlay.style.display = 'flex';
    }
  }

  /**
   * Reset handler state
   */
  resetState() {
    this.isProcessing = false;
    this.isDragOver = false;
    this.currentFile = null;

    if (this.dropOverlay) {
      const content = this.dropOverlay.querySelector('.drop-zone-content');
      content.classList.remove('file-processing');

      // Remove progress bar
      const progress = content.querySelector('.file-progress');
      if (progress) {
        progress.remove();
      }

      // Reset to original content
      content.innerHTML = `
        <div class="drop-icon">📁</div>
        <h3>Drop 3D Model Here</h3>
        <p>Supports GLB and GLTF files</p>
        <p class="file-size-limit">Max size: ${this.formatFileSize(this.options.maxFileSize)}</p>
        <button class="browse-button" type="button">Or Browse Files</button>
      `;

      // Re-setup browse button
      const browseButton = content.querySelector('.browse-button');
      browseButton.addEventListener('click', () => {
        this.fileInput.click();
      });
    }
  }

  /**
   * Get file extension from filename
   * @param {string} filename - File name
   * @returns {string} File extension
   */
  getFileExtension(filename) {
    return filename.toLowerCase().substring(filename.lastIndexOf('.'));
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get current file being processed
   * @returns {File|null} Current file
   */
  getCurrentFile() {
    return this.currentFile;
  }

  /**
   * Check if currently processing
   * @returns {boolean} Processing status
   */
  isProcessingFile() {
    return this.isProcessing;
  }

  /**
   * Programmatically trigger file selection
   */
  triggerFileSelect() {
    if (this.fileInput) {
      this.fileInput.click();
    }
  }

  /**
   * Set processing complete
   */
  setProcessingComplete() {
    this.isProcessing = false;
    this.hideDropZone();

    setTimeout(() => {
      this.resetState();
    }, 1000);

    this.dispatchEvent(
      new CustomEvent('processingcomplete', {
        detail: { file: this.currentFile },
      })
    );
  }

  /**
   * Get handler information
   * @returns {Object} Handler information
   */
  getInfo() {
    return {
      allowedExtensions: this.options.allowedExtensions,
      maxFileSize: this.options.maxFileSize,
      maxFileSizeFormatted: this.formatFileSize(this.options.maxFileSize),
      isProcessing: this.isProcessing,
      isDragOver: this.isDragOver,
      currentFile: this.currentFile
        ? {
            name: this.currentFile.name,
            size: this.currentFile.size,
            sizeFormatted: this.formatFileSize(this.currentFile.size),
            type: this.currentFile.type,
          }
        : null,
    };
  }

  /**
   * Clean up resources
   */
  dispose() {
    console.log('FileDropHandler: Starting cleanup...');

    // Remove event listeners
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.container.removeEventListener(eventName, this.preventDefaults);
      document.body.removeEventListener(eventName, this.preventDefaults);
    });

    this.container.removeEventListener('dragenter', this.handleDragEnter);
    this.container.removeEventListener('dragleave', this.handleDragLeave);
    this.container.removeEventListener('drop', this.handleDrop);

    // Remove DOM elements
    if (this.dropOverlay && this.dropOverlay.parentNode) {
      this.dropOverlay.parentNode.removeChild(this.dropOverlay);
    }

    if (this.fileInput && this.fileInput.parentNode) {
      this.fileInput.parentNode.removeChild(this.fileInput);
    }

    // Clear references
    this.container = null;
    this.dropOverlay = null;
    this.fileInput = null;
    this.currentFile = null;

    console.log('FileDropHandler: Cleanup completed');
  }
}
