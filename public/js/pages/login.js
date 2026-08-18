// ==================== 登录页 ====================

Pages.login = {
  isLoading: false,

  render() {
    return `
      <div class="login-page">
        <div class="logo-section">
          <div class="logo-icon">🍾</div>
          <div class="logo-title">树洞漂流瓶</div>
          <div class="logo-subtitle">投放你的心声，等待有缘人拾取</div>
        </div>
        <div class="login-section">
          <button class="login-btn" id="loginBtn">登录</button>
          <div class="login-tip">点击登录开始使用</div>
        </div>
      </div>
    `;
  },

  onLoad() {
    document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
  },

  async handleLogin() {
    if (this.isLoading) return;
    this.isLoading = true;

    const btn = document.getElementById('loginBtn');
    btn.textContent = '登录中...';
    btn.disabled = true;

    try {
      const userId = 'user_' + Utils.generateId();
      const nickName = '用户' + userId.slice(-4);

      const result = await callApi('login', { userId, nickName });

      if (result.code === 0) {
        App.saveUserInfo(result.data);
        Utils.showToast('登录成功');
        setTimeout(() => App.redirectTo('/index'), 1000);
      } else {
        Utils.showToast(result.msg || '登录失败');
      }
    } catch (err) {
      Utils.showToast('登录失败：' + err.message);
    } finally {
      this.isLoading = false;
      btn.textContent = '登录';
      btn.disabled = false;
    }
  }
};
