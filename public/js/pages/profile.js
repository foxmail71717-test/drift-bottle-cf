// ==================== 我的页面 ====================

Pages.profile = {
  render() {
    const userInfo = App.userInfo;
    const isAdmin = App.isAdmin();

    return `
      <div class="profile-page">
        <div class="user-card">
          <div class="card-bg"></div>
          <div class="card-content">
            <img class="profile-avatar" src="${userInfo.avatarUrl || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%234a90d9%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2265%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2240%22>👤</text></svg>'}" alt="头像">
            <div class="user-info">
              <div class="profile-nickname">${userInfo.nickName}</div>
              <div class="profile-role-tag ${isAdmin ? 'admin' : 'user'}">
                ${isAdmin ? '⭐ 管理员' : '👤 普通用户'}
              </div>
            </div>
          </div>
        </div>

        <div class="menu-section">
          <div class="menu-item">
            <div class="menu-icon">${isAdmin ? '🍾' : '📝'}</div>
            <div class="menu-content">
              <div class="menu-title">${isAdmin ? '管理员权限' : '投放权限'}</div>
              <div class="menu-desc">${isAdmin ? '可以投放和拾取漂流瓶' : '可以投放漂流瓶'}</div>
            </div>
          </div>
          <div class="menu-item">
            <div class="menu-icon">ℹ️</div>
            <div class="menu-content">
              <div class="menu-title">版本</div>
              <div class="menu-desc">v1.0.0 (Cloudflare)</div>
            </div>
          </div>
        </div>

        <div class="logout-section">
          <button class="logout-btn" id="logoutBtn">退出登录</button>
        </div>
      </div>
    `;
  },

  onLoad() {
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      if (await Utils.showModal('提示', '确定退出登录吗？')) {
        App.clearUserInfo();
        Utils.showToast('已退出');
        setTimeout(() => App.redirectTo('/login'), 1500);
      }
    });
  }
};
