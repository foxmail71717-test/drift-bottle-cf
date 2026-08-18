// API 配置
const API_URL = '/api';

// 管理员用户ID列表
const ADMIN_IDS = [];

// 调用 API
async function callApi(action, data = {}) {
  const response = await fetch(`${API_URL}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}
