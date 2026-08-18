// ==================== 拾取页 ====================

Pages.pick = {
  pickedList: [],
  isPicking: false,

  render() {
    return `
      <div class="pick-page">
        <div class="pick-section">
          <div class="pick-bottle" id="pickBottleBtn">
            <div class="bottle-icon" id="bottleIcon">🍾</div>
            <div class="pick-text" id="pickText">点击拾取漂流瓶</div>
          </div>
        </div>
        <div class="list-section">
          <div class="section-header">
            <span class="section-title">已拾取</span>
            <span class="section-count" id="listCount">共 0 个</span>
          </div>
          <div class="bottle-list" id="bottleList">
            <div class="empty-state"><div class="empty-icon">🌊</div><div class="empty-text">加载中...</div></div>
          </div>
        </div>
      </div>
    `;
  },

  async onLoad() {
    if (!App.isAdmin()) {
      Utils.showToast('权限不足');
      setTimeout(() => App.navigateBack(), 1500);
      return;
    }
    document.getElementById('pickBottleBtn').addEventListener('click', () => this.pickBottle());
    await this.loadList();
  },

  async loadList() {
    try {
      const result = await callApi('list');
      if (result.code === 0) {
        this.pickedList = (result.data || []).map(b => ({
          ...b,
          createTimeFormatted: Utils.formatTime(b.createTime),
          pickTimeFormatted: Utils.formatTime(b.pickTime)
        }));
        this.renderList();
      }
    } catch (err) {
      Utils.showToast('加载失败');
    }
  },

  renderList() {
    const listEl = document.getElementById('bottleList');
    document.getElementById('listCount').textContent = `共 ${this.pickedList.length} 个`;

    if (this.pickedList.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><div class="empty-icon">🌊</div><div class="empty-text">还没有拾取过漂流瓶</div></div>`;
      return;
    }

    listEl.innerHTML = this.pickedList.map(item => `
      <div class="bottle-item" data-id="${item.id}">
        <div class="item-icon">📜</div>
        <div class="item-content">
          <div class="item-text">${item.content}</div>
          <div class="item-meta">
            <span class="item-time">${item.createTimeFormatted}</span>
            <span class="item-user">来自 ${item.userNickName || '匿名'}</span>
          </div>
        </div>
        <div class="item-arrow">›</div>
      </div>
    `).join('');

    listEl.querySelectorAll('.bottle-item').forEach(el => {
      el.addEventListener('click', () => App.navigateTo('/detail?id=' + el.dataset.id));
    });
  },

  async pickBottle() {
    if (this.isPicking) return;
    this.isPicking = true;
    document.getElementById('bottleIcon').classList.add('shaking');
    document.getElementById('pickText').textContent = '正在拾取中...';

    try {
      const result = await callApi('pick', { userId: App.userInfo.userId });

      if (result.code === 0) {
        if (result.data) {
          Utils.showToast('拾取成功！');
          await this.loadList();
          setTimeout(() => App.navigateTo('/detail?id=' + result.data.id), 1000);
        } else {
          Utils.showToast('暂无新的漂流瓶');
        }
      } else {
        Utils.showToast(result.msg || '拾取失败');
      }
    } catch (err) {
      Utils.showToast('拾取失败');
    } finally {
      this.isPicking = false;
      document.getElementById('bottleIcon').classList.remove('shaking');
      document.getElementById('pickText').textContent = '点击拾取漂流瓶';
    }
  }
};
