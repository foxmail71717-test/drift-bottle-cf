// ==================== 全局应用逻辑 ====================

const App = {
  currentPage: null,
  userInfo: null,

  init() {
    this.loadUserInfo();
    this.initRouter();
    this.initTabBar();
  },

  loadUserInfo() {
    const saved = localStorage.getItem('userInfo');
    if (saved) {
      this.userInfo = JSON.parse(saved);
    }
  },

  saveUserInfo(info) {
    this.userInfo = info;
    localStorage.setItem('userInfo', JSON.stringify(info));
  },

  clearUserInfo() {
    this.userInfo = null;
    localStorage.removeItem('userInfo');
  },

  isLoggedIn() {
    return !!this.userInfo;
  },

  isAdmin() {
    return this.userInfo && this.userInfo.role === 'admin';
  },

  initRouter() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  handleRoute() {
    const hash = location.hash.slice(1) || '/login';
    const [path, query] = hash.split('?');
    const params = this.parseQuery(query);

    // 未登录时直接跳转到邮箱登录页
    if (!this.isLoggedIn()) {
      // 如果是根路径或任何需要登录的页面，直接跳转到登录页
      location.href = '/login.html';
      return;
    }

    // 已登录用户在 /login 或 /admin-login 时跳转到首页
    if (path === '/login' || path === '/admin-login') {
      location.hash = '/index';
      return;
    }

    const tabBar = document.getElementById('tab-bar');
    const showTabBar = ['/index', '/profile'].includes(path);
    tabBar.classList.toggle('hidden', !showTabBar);

    if (showTabBar) {
      document.querySelectorAll('.tab-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === path.slice(1));
      });
    }

    this.renderPage(path.slice(1), params);
  },

  parseQuery(query) {
    if (!query) return {};
    const params = {};
    query.split('&').forEach(item => {
      const [key, value] = item.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
    return params;
  },

  renderPage(page, params) {
    const container = document.getElementById('page-container');

    if (this.currentPage && this.currentPage.onDestroy) {
      this.currentPage.onDestroy();
    }

    const pageObj = Pages[page];
    if (pageObj) {
      this.currentPage = pageObj;
      container.innerHTML = pageObj.render(params);
      if (pageObj.onLoad) {
        pageObj.onLoad(params);
      }
    } else {
      container.innerHTML = '<div class="loading-container"><div class="loading-icon">🔍</div><div class="loading-text">页面不存在</div></div>';
    }
  },

  initTabBar() {
    document.querySelectorAll('.tab-item').forEach(item => {
      item.addEventListener('click', () => {
        location.hash = '/' + item.dataset.page;
      });
    });
  },

  navigateTo(page) {
    location.hash = page;
  },

  redirectTo(page) {
    location.hash = page;
  },

  navigateBack() {
    history.back();
  }
};

// ==================== 工具函数 ====================

const Utils = {
  formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  maskNickname(nickname) {
    if (!nickname) return '匿名用户';
    const len = nickname.length;
    if (len <= 2) return nickname[0] + '*';
    return nickname[0] + '***' + nickname[len - 1];
  },

  showToast(msg, duration = 2000) {
    let toast = document.getElementById('global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'global-toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  },

  showModal(title, content) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal">
          <div class="modal-header">${title}</div>
          <div class="modal-body">${content}</div>
          <div class="modal-footer">
            <button class="modal-btn cancel">取消</button>
            <button class="modal-btn confirm">确定</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.querySelector('.cancel').onclick = () => {
        document.body.removeChild(overlay);
        resolve(false);
      };
      overlay.querySelector('.confirm').onclick = () => {
        document.body.removeChild(overlay);
        resolve(true);
      };
    });
  },

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
};

const Pages = {};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
