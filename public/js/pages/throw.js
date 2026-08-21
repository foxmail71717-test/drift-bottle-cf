// ==================== 投放页 ====================

Pages.throw = {
  images: [],
  video: null,
  content: '',
  isSubmitting: false,
  maxImages: 3,

  render() {
    return `
      <div class="throw-page">
        <div class="section">
          <div class="section-title">写下你的心声</div>
          <div class="input-wrapper">
            <textarea class="content-input" id="contentInput" placeholder="分享你的想法、心情或故事..." maxlength="500"></textarea>
            <div class="char-count"><span id="charCount">0</span>/500</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">添加图片 <span class="optional">（可选，最多${this.maxImages}张）</span></div>
          <div class="media-grid" id="imageGrid">
            <div class="add-btn" id="addImageBtn">
              <div class="add-icon">+</div>
              <div class="add-text">图片</div>
            </div>
          </div>
          <input type="file" id="imageInput" accept="image/*" multiple style="display:none">
        </div>

        <div class="section">
          <div class="section-title">添加视频 <span class="optional">（可选，限60秒内）</span></div>
          <div id="videoContainer">
            <div class="add-btn" id="addVideoBtn">
              <div class="add-icon">📹</div>
              <div class="add-text">选择视频</div>
            </div>
          </div>
          <input type="file" id="videoInput" accept="video/*" style="display:none">
        </div>

        <div class="submit-section">
          <button class="submit-btn" id="submitBtn" disabled>🌊 投入大海</button>
        </div>
      </div>
    `;
  },

  onLoad() {
    this.images = [];
    this.video = null;
    this.content = '';

    const contentInput = document.getElementById('contentInput');
    const charCount = document.getElementById('charCount');
    const submitBtn = document.getElementById('submitBtn');

    contentInput.addEventListener('input', (e) => {
      this.content = e.target.value;
      charCount.textContent = this.content.length;
      submitBtn.disabled = !this.content.trim();
    });

    document.getElementById('addImageBtn').addEventListener('click', () => {
      if (this.images.length >= this.maxImages) {
        Utils.showToast(`最多${this.maxImages}张`);
        return;
      }
      document.getElementById('imageInput').click();
    });

    document.getElementById('imageInput').addEventListener('change', async (e) => {
      for (const file of Array.from(e.target.files)) {
        if (this.images.length >= this.maxImages) break;
        // 检查图片大小（限制5MB）
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          Utils.showToast(`图片 ${file.name} 不能超过5MB`);
          continue;
        }
        this.images.push(await Utils.fileToBase64(file));
      }
      this.renderImageGrid();
      e.target.value = '';
    });

    document.getElementById('addVideoBtn').addEventListener('click', () => {
      if (this.video) { Utils.showToast('只能一个视频'); return; }
      document.getElementById('videoInput').click();
    });

    document.getElementById('videoInput').addEventListener('change', async (e) => {
      if (e.target.files[0]) {
        const file = e.target.files[0];
        // 检查视频大小（限制10MB）
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          Utils.showToast('视频文件不能超过10MB');
          e.target.value = '';
          return;
        }
        this.video = await Utils.fileToBase64(file);
        this.renderVideoContainer();
      }
      e.target.value = '';
    });

    submitBtn.addEventListener('click', () => this.submitBottle());
  },

  renderImageGrid() {
    const grid = document.getElementById('imageGrid');
    grid.innerHTML = this.images.map((img, i) => `
      <div class="image-item">
        <img src="${img}">
        <div class="delete-btn" data-index="${i}">×</div>
      </div>
    `).join('') + (this.images.length < this.maxImages ? `
      <div class="add-btn" id="addImageBtn"><div class="add-icon">+</div><div class="add-text">图片</div></div>
    ` : '');

    grid.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.images.splice(parseInt(e.target.dataset.index), 1);
        this.renderImageGrid();
      });
    });

    const newAddBtn = document.getElementById('addImageBtn');
    if (newAddBtn) newAddBtn.addEventListener('click', () => document.getElementById('imageInput').click());
  },

  renderVideoContainer() {
    const container = document.getElementById('videoContainer');
    if (this.video) {
      container.innerHTML = `
        <div class="video-wrapper">
          <video src="${this.video}" class="video-preview" controls></video>
          <div class="delete-btn" id="deleteVideoBtn">×</div>
        </div>
      `;
      document.getElementById('deleteVideoBtn').addEventListener('click', () => {
        this.video = null;
        this.renderVideoContainer();
      });
    } else {
      container.innerHTML = `<div class="add-btn" id="addVideoBtn"><div class="add-icon">📹</div><div class="add-text">选择视频</div></div>`;
      document.getElementById('addVideoBtn').addEventListener('click', () => document.getElementById('videoInput').click());
    }
  },

  async submitBottle() {
    if (this.isSubmitting || !this.content.trim()) return;
    this.isSubmitting = true;
    const btn = document.getElementById('submitBtn');
    btn.textContent = '投放中...';
    btn.disabled = true;

    try {
      const result = await callApi('throw', {
        userId: App.userInfo.userId,
        content: this.content,
        images: this.images,
        video: this.video || '',
        nickName: App.userInfo.nickName
      });

      if (result.code === 0) {
        Utils.showToast('投放成功！');
        setTimeout(() => App.navigateBack(), 1500);
      } else {
        Utils.showToast(result.msg || '投放失败');
      }
    } catch (err) {
      Utils.showToast('投放失败');
    } finally {
      this.isSubmitting = false;
      btn.textContent = '🌊 投入大海';
      btn.disabled = !this.content.trim();
    }
  }
};
