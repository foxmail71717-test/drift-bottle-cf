// ==================== 首页 ====================

Pages.index = {
  requestCount: 0,
  eventBound: false,

  render() {
    const userInfo = App.userInfo;
    const isAdmin = App.isAdmin();
    const badge = this.requestCount > 0 ? `<span style="background:#f5576c;color:#fff;padding:2px 8px;border-radius:10px;font-size:12px;margin-left:8px;vertical-align:middle;">${this.requestCount}</span>` : '';

    return `
      <div class="home-page">
        <div class="user-card">
          <img class="avatar" src="${userInfo.avatarUrl || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%234a90d9%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2265%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2240%22>👤</text></svg>'}" alt="头像">
          <div class="user-info">
            <div class="nickname">${userInfo.nickName}</div>
            <div class="role-tag ${isAdmin ? 'admin' : 'user'}">
              ${isAdmin ? '⭐ 管理员' : '👤 普通用户'}
            </div>
          </div>
        </div>

        <div class="action-section">
          <div class="action-card throw-card" id="throwBtn">
            <div class="action-icon">📝</div>
            <div class="action-content">
              <div class="action-title">投放漂流瓶</div>
              <div class="action-desc">写下你的心声，投入大海</div>
            </div>
            <div class="action-arrow">→</div>
          </div>

          <div class="action-card" id="chatBtn" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);">
            <div class="action-icon">💬</div>
            <div class="action-content">
              <div class="action-title" style="color:#fff;display:flex;align-items:center;">消息${badge}</div>
              <div class="action-desc" style="color:rgba(255,255,255,0.9);">查看好友和聊天</div>
            </div>
            <div class="action-arrow" style="color:#fff;">→</div>
          </div>

          ${isAdmin ? `
          <div class="action-card pick-card" id="pickBtn">
            <div class="action-icon">🍾</div>
            <div class="action-content">
              <div class="action-title">拾取漂流瓶</div>
              <div class="action-desc">查看用户投放的内容</div>
            </div>
            <div class="action-arrow">→</div>
          </div>
          ` : ''}
        </div>

        <div class="footer-tip">
          ${isAdmin ? '管理员模式，可以拾取漂流瓶哦～' : '尽情投放你的想法吧～'}
        </div>
      </div>
    `;
  },

  onLoad() {
    if (!this.eventBound) {
      document.getElementById('throwBtn').addEventListener('click', () => App.navigateTo('/throw'));
      document.getElementById('chatBtn').addEventListener('click', () => location.href = '/chat.html');
      const pickBtn = document.getElementById('pickBtn');
      if (pickBtn) pickBtn.addEventListener('click', () => App.navigateTo('/pick'));
      this.eventBound = true;
    }

    // 加载好友请求数量
    this.loadRequestCount();
  },

  async loadRequestCount() {
    try {
      const result = await callApi('unreadCount', { userId: App.userInfo.userId });
      console.log('未读统计:', result);
      if (result.code === 0 && result.data) {
        const newCount = result.data.total;
        if (newCount !== this.requestCount) {
          this.requestCount = newCount;
          this.updateBadge();
        }
      }
    } catch (e) {
      console.error('加载未读数量失败', e);
    }
  },

  updateBadge() {
    const titleEl = document.querySelector('#chatBtn .action-title');
    if (titleEl) {
      const badge = this.requestCount > 0
        ? `<span style="background:#f5576c;color:#fff;padding:2px 8px;border-radius:10px;font-size:12px;margin-left:8px;">${this.requestCount}</span>`
        : '';
      titleEl.innerHTML = '消息' + badge;
    }
  }
};
