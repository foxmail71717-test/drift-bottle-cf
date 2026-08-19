// ==================== 详情页 ====================

Pages.detail = {
  bottle: null,
  bottleId: null,

  render() {
    return `<div class="detail-page" id="detailContent"><div class="loading-container"><div class="loading-icon">🍾</div><div class="loading-text">加载中...</div></div></div>`;
  },

  async onLoad(params) {
    if (!params.id) {
      Utils.showToast('缺少漂流瓶ID');
      setTimeout(() => App.navigateBack(), 1500);
      return;
    }

    this.bottleId = params.id;

    try {
      const result = await callApi('detail', { id: params.id });
      if (result.code === 0) {
        this.bottle = {
          ...result.data,
          createTimeFormatted: Utils.formatTime(result.data.createTime),
          pickTimeFormatted: result.data.pickTime ? Utils.formatTime(result.data.pickTime) : ''
        };
        this.renderDetail();
      } else {
        throw new Error(result.msg);
      }
    } catch (err) {
      document.getElementById('detailContent').innerHTML = `
        <div class="error-container">
          <div class="error-icon">😢</div>
          <div class="error-text">漂流瓶不存在或加载失败</div>
          <button class="back-btn" onclick="App.navigateBack()">返回</button>
        </div>
      `;
    }
  },

  renderDetail() {
    const b = this.bottle;
    const isAdmin = App.isAdmin();
    const isAnonymous = b.userNickName === '匿名用户' || b.userId === 'anonymous';

    let imagesHtml = '';
    if (b.images && b.images.length > 0) {
      imagesHtml = `<div class="images-content"><div class="section-label">📷 图片</div><div class="image-grid">${b.images.map(url => `<img src="${url}" onclick="window.open('${url}')">`).join('')}</div></div>`;
    }
    let videoHtml = '';
    if (b.video) {
      videoHtml = `<div class="video-content"><div class="section-label">🎬 视频</div><video src="${b.video}" class="video-player" controls></video></div>`;
    }

    // 加好友按钮（仅普通用户可见，且投放者不是自己）
    let addFriendBtn = '';
    if (!isAdmin && b.userId !== App.userInfo.userId && !isAnonymous) {
      addFriendBtn = `<button class="back-btn" id="addFriendBtn" style="background:linear-gradient(135deg, #11998e, #38ef7d);margin-top:10px;">💬 加TA为好友</button>`;
    }

    document.getElementById('detailContent').innerHTML = `
      <div class="header-section">
        <div class="header-icon">🍾</div>
        <div class="header-info">
          <div class="header-title">树洞漂流瓶</div>
          <div class="header-time">${b.createTimeFormatted}</div>
        </div>
      </div>
      <div class="content-section">
        <div class="text-content">${b.content}</div>
        ${imagesHtml}
        ${videoHtml}
      </div>
      <div class="footer-section">
        <div class="footer-item"><span class="label">投放者：</span><span class="value">${isAnonymous ? '匿名用户' : Utils.maskNickname(b.userNickName)}</span></div>
        ${b.pickTimeFormatted ? `<div class="footer-item"><span class="label">拾取时间：</span><span class="value">${b.pickTimeFormatted}</span></div>` : ''}
      </div>
      <div class="back-section">
        ${addFriendBtn}
        <button class="back-btn" id="shareBtn" style="background:linear-gradient(135deg, #667eea, #764ba2);margin-top:10px;">📱 分享漂流瓶</button>
        <button class="back-btn" onclick="App.navigateBack()">返回</button>
      </div>
    `;

    // 绑定加好友事件
    const friendBtn = document.getElementById('addFriendBtn');
    if (friendBtn) {
      friendBtn.addEventListener('click', () => this.addFriend());
    }

    // 绑定分享事件
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => this.showShareQR());
    }
  },

  // 显示分享二维码
  showShareQR() {
    const bottleUrl = `${window.location.origin}/#/detail?id=${this.bottleId}`;
    // 使用在线API生成二维码图片
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bottleUrl)}`;

    // 创建弹窗
    const overlay = document.createElement('div');
    overlay.id = 'qrOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;';

    overlay.innerHTML = `
      <div style="background:#fff;border-radius:20px;padding:30px;text-align:center;max-width:320px;width:90%;">
        <div style="font-size:18px;font-weight:bold;color:#333;margin-bottom:5px;">🍾 树洞漂流瓶</div>
        <div style="font-size:13px;color:#999;margin-bottom:20px;">扫码查看这个漂流瓶</div>
        <div style="display:flex;justify-content:center;margin-bottom:15px;">
          <img src="${qrImageUrl}" alt="二维码" style="width:200px;height:200px;border:1px solid #eee;" />
        </div>
        <div style="font-size:12px;color:#666;background:#f5f5f5;padding:10px;border-radius:8px;word-break:break-all;margin-bottom:15px;">${bottleUrl}</div>
        <button onclick="document.getElementById('qrOverlay').remove()" style="width:100%;padding:12px;background:#667eea;color:#fff;border:none;border-radius:25px;font-size:15px;cursor:pointer;">关闭</button>
      </div>
    `;

    document.body.appendChild(overlay);

    // 点击背景关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  },

  async addFriend() {
    const message = prompt('给TA说句话吧（可选）：', '想和你交个朋友～');
    if (message === null) return; // 用户取消

    try {
      const result = await callApi('addFriend', {
        fromUserId: App.userInfo.userId,
        toBottleId: this.bottleId,
        message: message || '想和你交个朋友'
      });

      if (result.code === 0) {
        Utils.showToast('好友请求已发送！');
      } else {
        Utils.showToast(result.msg || '发送失败');
      }
    } catch (err) {
      Utils.showToast('发送失败');
    }
  }
};
