// ==================== 首页 ====================
// 版本: 2026-08-19-分享按钮修复版

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

          <div class="action-card" id="shareAppBtn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div class="action-icon">📱</div>
            <div class="action-content">
              <div class="action-title" style="color:#fff;">分享给朋友</div>
              <div class="action-desc" style="color:rgba(255,255,255,0.9);">生成二维码邀请好友</div>
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
    console.log('首页加载，绑定事件...');

    // 每次加载都绑定事件
    const throwBtn = document.getElementById('throwBtn');
    const chatBtn = document.getElementById('chatBtn');
    const pickBtn = document.getElementById('pickBtn');
    const shareBtn = document.getElementById('shareAppBtn');

    console.log('按钮状态:', {
      throwBtn: !!throwBtn,
      chatBtn: !!chatBtn,
      pickBtn: !!pickBtn,
      shareBtn: !!shareBtn
    });

    if (throwBtn) {
      throwBtn.addEventListener('click', () => {
        console.log('点击投放');
        App.navigateTo('/throw');
      });
    }
    if (chatBtn) {
      chatBtn.addEventListener('click', () => {
        console.log('点击消息');
        location.href = '/chat.html';
      });
    }
    if (pickBtn) {
      pickBtn.addEventListener('click', () => {
        console.log('点击拾取');
        App.navigateTo('/pick');
      });
    }
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        console.log('点击分享');
        this.showShareQR();
      });
    }

    // 加载好友请求数量
    this.loadRequestCount();
  },

  // 显示分享二维码
  showShareQR() {
    const appUrl = 'https://drift-bottle-dfc.pages.dev/';
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}`;

    const overlay = document.createElement('div');
    overlay.id = 'qrOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;';

    overlay.innerHTML = `
      <div style="background:#fff;border-radius:20px;padding:30px;text-align:center;max-width:320px;width:90%;">
        <div style="font-size:18px;font-weight:bold;color:#333;margin-bottom:5px;">🍾 树洞漂流瓶</div>
        <div style="font-size:13px;color:#999;margin-bottom:20px;">扫码来投放你的漂流瓶</div>
        <div style="display:flex;justify-content:center;margin-bottom:15px;">
          <canvas id="qrCanvas" width="280" height="320" style="border:1px solid #eee;border-radius:10px;"></canvas>
        </div>
        <div style="font-size:12px;color:#666;background:#f5f5f5;padding:10px;border-radius:8px;word-break:break-all;margin-bottom:15px;">${appUrl}</div>
        <button id="saveQRBtn" style="width:100%;padding:12px;background:#11998e;color:#fff;border:none;border-radius:25px;font-size:15px;cursor:pointer;margin-bottom:10px;">💾 保存二维码</button>
        <button onclick="document.getElementById('qrOverlay').remove()" style="width:100%;padding:12px;background:#667eea;color:#fff;border:none;border-radius:25px;font-size:15px;cursor:pointer;">关闭</button>
      </div>
    `;

    document.body.appendChild(overlay);

    // 绘制带品牌的二维码
    const canvas = document.getElementById('qrCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 280, 320);

      // 标题
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🍾 树洞漂流瓶', 140, 30);

      // 二维码
      ctx.drawImage(img, 40, 50, 200, 200);

      // 底部文字
      ctx.fillStyle = '#666666';
      ctx.font = '14px Arial';
      ctx.fillText('扫码来投放你的漂流瓶', 140, 280);
    };
    img.src = qrImageUrl;

    // 保存二维码功能
    document.getElementById('saveQRBtn').addEventListener('click', () => {
      try {
        const canvas = document.getElementById('qrCanvas');
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = '树洞漂流瓶二维码.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          Utils.showToast('二维码已保存');
        }, 'image/png');
      } catch (err) {
        Utils.showToast('保存失败');
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
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
// Deploy Wed Aug 19 16:27:22     2026
