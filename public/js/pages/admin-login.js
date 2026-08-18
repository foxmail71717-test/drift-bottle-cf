// ==================== 管理员登录页 ====================

Pages.adminLogin = {
  isLoading: false,

  render() {
    return `
      <div class="login-page">
        <div class="logo-section">
          <div class="logo-icon">⭐</div>
          <div class="logo-title">管理员登录</div>
          <div class="logo-subtitle">树洞漂流瓶管理后台</div>
        </div>
        <div class="login-section">
          <button class="login-btn" id="adminLoginBtn">管理员登录</button>
          <div class="login-tip">仅限管理员使用</div>
        </div>
      </div>
    `;
  },

  onLoad() {
    document.getElementById('adminLoginBtn').addEventListener('click', () => this.handleAdminLogin());
  },

  async handleAdminLogin() {
    if (this.isLoading) return;
    this.isLoading = true;

    const btn = document.getElementById('adminLoginBtn');
    btn.textContent = '登录中...';
    btn.disabled = true;

    try {
      // 管理员固定 ID
      const userId = 'admin_' + Utils.generateId();
      const nickName = '管理员';

      const result = await callApi('login', { userId, nickName, isAdmin: true });

      if (result.code === 0) {
        // 强制设置为管理员
        const userInfo = result.data;
        userInfo.role = 'admin';
        App.saveUserInfo(userInfo);
        Utils.showToast('管理员登录成功');
        setTimeout(() => App.redirectTo('/index'), 1000);
      } else {
        Utils.showToast(result.msg || '登录失败');
      }
    } catch (err) {
      Utils.showToast('登录失败：' + err.message);
    } finally {
      this.isLoading = false;
      btn.textContent = '管理员登录';
      btn.disabled = false;
    }
  }
};
