// API 入口 - 漂流瓶接口
export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.pathname.split('/').pop();

  try {
    const body = await request.json();

    switch (action) {
      case 'login':
        return handleLogin(env, body);
      case 'emailRegister':
        return handleEmailRegister(env, body);
      case 'emailLogin':
        return handleEmailLogin(env, body);
      case 'throw':
        return handleThrow(env, body);
      case 'pick':
        return handlePick(env, body);
      case 'detail':
        return handleDetail(env, body, request);
      case 'list':
        return handleList(env, body);
      case 'stats':
        return handleStats(env);
      case 'addFriend':
        return handleAddFriend(env, body);
      case 'acceptFriend':
        return handleAcceptFriend(env, body);
      case 'rejectFriend':
        return handleRejectFriend(env, body);
      case 'friends':
        return handleGetFriends(env, body);
      case 'friendRequests':
        return handleGetFriendRequests(env, body);
      case 'sendMessage':
        return handleSendMessage(env, body);
      case 'messages':
        return handleGetMessages(env, body);
      case 'userInfo':
        return handleGetUserInfo(env, body, request);
      case 'unreadCount':
        return handleGetUnreadCount(env, body);
      case 'unreadCountByFriend':
        return handleGetUnreadCountByFriend(env, body);
      case 'markRead':
        return handleMarkRead(env, body);
      case 'allUsers':
        return handleGetAllUsers(env, body);
      default:
        return jsonResponse({ code: -1, msg: '未知操作' });
    }
  } catch (err) {
    return jsonResponse({ code: -1, msg: err.message });
  }
}

// 登录
async function handleLogin(env, { userId, nickName, isAdmin }) {
  const users = await getData(env, 'users') || {};

  if (users[userId]) {
    return jsonResponse({
      code: 0,
      data: users[userId]
    });
  }

  // 新用户 - 判断是否管理员
  let role = 'user';
  if (isAdmin === true) {
    role = 'admin';
  } else if ((env.ADMIN_IDS || '').split(',').filter(id => id).includes(userId)) {
    role = 'admin';
  }

  const newUser = {
    userId,
    nickName: nickName || (role === 'admin' ? '管理员' : '用户' + userId.slice(-4)),
    avatarUrl: '',
    role: role,
    createTime: new Date().toISOString()
  };

  users[userId] = newUser;
  await setData(env, 'users', users);

  return jsonResponse({ code: 0, data: newUser });
}

// 简单密码哈希
function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
}

// 邮箱注册
async function handleEmailRegister(env, { nickname, email, password }) {
  if (!email || !password || !nickname) {
    return jsonResponse({ code: -1, msg: '请填写完整信息' });
  }
  if (password.length < 6) {
    return jsonResponse({ code: -1, msg: '密码至少6位' });
  }
  if (!email.includes('@')) {
    return jsonResponse({ code: -1, msg: '邮箱格式不正确' });
  }

  const emailUsers = await getData(env, 'emailUsers') || {};

  if (emailUsers[email]) {
    return jsonResponse({ code: -1, msg: '该邮箱已注册' });
  }

  const userId = 'eu_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  const hashedPassword = hashPassword(password);

  emailUsers[email] = {
    userId,
    email,
    nickname,
    password: hashedPassword,
    createTime: new Date().toISOString()
  };

  await setData(env, 'emailUsers', emailUsers);

  return jsonResponse({ code: 0, msg: '注册成功' });
}

// 邮箱登录
async function handleEmailLogin(env, { email, password }) {
  if (!email || !password) {
    return jsonResponse({ code: -1, msg: '请填写邮箱和密码' });
  }

  const emailUsers = await getData(env, 'emailUsers') || {};
  const user = emailUsers[email];

  if (!user) {
    return jsonResponse({ code: -1, msg: '用户不存在' });
  }

  if (user.password !== hashPassword(password)) {
    return jsonResponse({ code: -1, msg: '密码错误' });
  }

  const userInfo = {
    userId: user.userId,
    nickName: user.nickname,
    email: user.email,
    avatarUrl: '',
    role: 'user',
    createTime: user.createTime
  };

  return jsonResponse({ code: 0, data: userInfo });
}

// 投放漂流瓶
async function handleThrow(env, { userId, content, images, video, nickName }) {
  if (!content || !content.trim()) {
    return jsonResponse({ code: -1, msg: '文字内容不能为空' });
  }

  // 检查文件大小（后端二次验证）
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB

  // 估算base64大小（base64比原文件大约33%）
  if (images && images.length > 0) {
    for (let i = 0; i < images.length; i++) {
      const estimatedSize = images[i].length * 0.75; // base64转回原大小
      if (estimatedSize > MAX_IMAGE_SIZE) {
        return jsonResponse({ code: -1, msg: `图片${i + 1}太大，请压缩后重试` });
      }
    }
  }

  if (video) {
    const estimatedSize = video.length * 0.75;
    if (estimatedSize > MAX_VIDEO_SIZE) {
      return jsonResponse({ code: -1, msg: '视频太大（超过10MB），请压缩后重试' });
    }
  }

  // 检查总大小是否超过KV限制（25MB）
  const totalSize = (content.length || 0) +
    (images ? images.reduce((sum, img) => sum + img.length, 0) : 0) +
    (video ? video.length : 0);

  if (totalSize > 20 * 1024 * 1024) { // 限制20MB，留一些余量
    return jsonResponse({ code: -1, msg: '内容太大，请减少图片或视频大小' });
  }

  const id = 'b_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

  const bottle = {
    id,
    userId,
    content: content.trim(),
    images: images || [],
    video: video || '',
    status: 'pending',
    userNickName: nickName || '匿名用户',
    createTime: new Date().toISOString(),
    pickTime: null
  };

  // 单独存储每个漂流瓶
  try {
    await env.DB.put('bottle_' + id, JSON.stringify(bottle));

    // 更新索引
    const index = await getData(env, 'bottleIndex') || [];
    index.push({ id, status: 'pending', createTime: bottle.createTime });
    await setData(env, 'bottleIndex', index);

    // 查找管理员用户 - 优先查找固定的管理员ID
    const emailUsers = await getData(env, 'emailUsers') || {};
    const users = await getData(env, 'users') || {};

    // 首先查找固定的管理员ID
    let adminUser = users['admin_fixed_001'] || emailUsers['admin_fixed_001'];

    // 如果没找到，再查找其他管理员
    if (!adminUser) {
      adminUser = Object.values(emailUsers).find(u =>
        (u.email && (env.ADMIN_IDS || '').split(',').filter(id => id).includes(u.email)) || u.role === 'admin'
      ) || Object.values(users).find(u => u.role === 'admin');
    }

    console.log('Found admin user:', adminUser);

    let actionTaken = 'bottle_created';
    let adminUserId = adminUser?.userId;

    console.log('Admin userId:', adminUserId, 'Current userId:', userId);

    if (adminUserId && adminUserId !== userId) {
      // 检查是否已是好友
      const friends = await getData(env, 'friends') || {};
      const friendKey = `${userId}_${adminUserId}`;
      const isFriend = !!friends[friendKey];

      if (isFriend) {
        // 已是好友，发送聊天消息
        const messages = await getData(env, 'messages') || {};
        const chatKey = [userId, adminUserId].sort().join('_');
        if (!messages[chatKey]) {
          messages[chatKey] = [];
        }

        // 构建消息内容
        let messageContent = content.trim();
        if (images && images.length > 0) {
          messageContent += '\n[图片]';
        }
        if (video) {
          messageContent += '\n[视频]';
        }

        const msgId = 'msg_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
        messages[chatKey].push({
          id: msgId,
          fromUserId: userId,
          toUserId: adminUserId,
          content: messageContent,
          images: images || [],
          video: video || '',
          createTime: new Date().toISOString(),
          isBottleContent: true // 标记这是漂流瓶内容
        });

        await setData(env, 'messages', messages);
        actionTaken = 'message_sent';
      } else {
        // 不是好友，发送好友请求
        const friendRequests = await getData(env, 'friendRequests') || {};

        // 检查是否已有待处理的请求
        const existingRequest = Object.values(friendRequests).find(r =>
          r.fromUserId === userId && r.toUserId === adminUserId && r.status === 'pending'
        );

        if (!existingRequest) {
          const requestId = 'fr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
          friendRequests[requestId] = {
            id: requestId,
            fromUserId: userId,
            toUserId: adminUserId,
            message: '我想和你交个朋友～（来自漂流瓶）',
            status: 'pending',
            createTime: new Date().toISOString(),
            isFromBottle: true // 标记这是来自漂流瓶的请求
          };
          await setData(env, 'friendRequests', friendRequests);
        }
        actionTaken = 'friend_request_sent';
      }
    }

    return jsonResponse({
      code: 0,
      data: { id, actionTaken, adminUserId },
      msg: actionTaken === 'message_sent' ? '已发送给管理员' :
           actionTaken === 'friend_request_sent' ? '已向管理员发送好友请求' :
           '投放成功'
    });
  } catch (e) {
    console.error('投放失败:', e);
    return jsonResponse({ code: -1, msg: '投放失败：' + e.message });
  }
}

// 拾取漂流瓶
async function handlePick(env, { userId }) {
  const index = await getData(env, 'bottleIndex') || [];
  const pendingItems = index.filter(b => b.status === 'pending');

  if (pendingItems.length === 0) {
    return jsonResponse({ code: 0, data: null, msg: '暂无新的漂流瓶' });
  }

  // 随机选一个
  const randomIndex = Math.floor(Math.random() * pendingItems.length);
  const item = pendingItems[randomIndex];

  // 获取瓶子详情
  const bottleData = await env.DB.get('bottle_' + item.id);
  if (!bottleData) {
    return jsonResponse({ code: -1, msg: '漂流瓶数据丢失' });
  }
  const bottle = JSON.parse(bottleData);

  // 更新状态
  bottle.status = 'picked';
  bottle.pickTime = new Date().toISOString();
  await env.DB.put('bottle_' + item.id, JSON.stringify(bottle));

  // 更新索引
  item.status = 'picked';
  item.pickTime = bottle.pickTime;
  await setData(env, 'bottleIndex', index);

  return jsonResponse({ code: 0, data: bottle });
}

// 获取已拾取列表
async function handleList(env) {
  const index = await getData(env, 'bottleIndex') || [];
  const pickedItems = index.filter(b => b.status === 'picked').sort((a, b) => new Date(b.pickTime) - new Date(a.pickTime));

  const bottles = [];
  for (const item of pickedItems.slice(0, 50)) {
    const data = await env.DB.get('bottle_' + item.id);
    if (data) bottles.push(JSON.parse(data));
  }

  return jsonResponse({ code: 0, data: bottles });
}

// 获取漂流瓶详情
async function handleDetail(env, { id }, request) {
  const bottleData = await env.DB.get('bottle_' + id);

  if (!bottleData) {
    return jsonResponse({ code: -1, msg: '漂流瓶不存在' });
  }

  const bottle = JSON.parse(bottleData);

  // 检查请求者身份
  const viewerId = request.headers.get('x-user-id');
  const emailUsers = await getData(env, 'emailUsers') || {};
  const viewer = Object.values(emailUsers).find(u => u.userId === viewerId);
  const isAdminViewer = viewer && (env.ADMIN_IDS || '').split(',').filter(id => id).includes(viewer.email);

  // 如果投放者是管理员，对普通用户显示为匿名
  const throwerEmail = Object.values(emailUsers).find(u => u.userId === bottle.userId)?.email;
  const isThrowerAdmin = throwerEmail && (env.ADMIN_IDS || '').split(',').filter(id => id).includes(throwerEmail);

  const result = { ...bottle };
  if (isThrowerAdmin && !isAdminViewer) {
    result.userNickName = '匿名用户';
    result.userId = 'anonymous';
  }

  return jsonResponse({ code: 0, data: result });
}

// 获取统计信息
async function handleStats(env) {
  const index = await getData(env, 'bottleIndex') || [];
  const pending = index.filter(b => b.status === 'pending').length;
  const picked = index.filter(b => b.status === 'picked').length;

  return jsonResponse({
    code: 0,
    data: {
      total: index.length,
      pending,
      picked
    }
  });
}

// ==================== 好友系统 ====================

// 发送好友请求（通过漂流瓶）
async function handleAddFriend(env, { fromUserId, toBottleId, message }) {
  const bottleData = await env.DB.get('bottle_' + toBottleId);

  if (!bottleData) {
    return jsonResponse({ code: -1, msg: '漂流瓶不存在' });
  }

  const bottle = JSON.parse(bottleData);

  const friendRequests = await getData(env, 'friendRequests') || {};
  const requestId = 'fr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);

  friendRequests[requestId] = {
    id: requestId,
    fromUserId,
    toUserId: bottle.userId,
    bottleId: toBottleId,
    message: message || '想和你交个朋友',
    status: 'pending', // pending, accepted, rejected
    createTime: new Date().toISOString()
  };

  await setData(env, 'friendRequests', friendRequests);
  return jsonResponse({ code: 0, msg: '好友请求已发送' });
}

// 接受好友请求
async function handleAcceptFriend(env, { requestId, userId }) {
  const friendRequests = await getData(env, 'friendRequests') || {};
  const request = friendRequests[requestId];

  if (!request || request.toUserId !== userId) {
    return jsonResponse({ code: -1, msg: '请求不存在' });
  }

  request.status = 'accepted';
  await setData(env, 'friendRequests', friendRequests);

  // 添加好友关系
  const friends = await getData(env, 'friends') || {};
  const friendKey1 = `${request.fromUserId}_${request.toUserId}`;
  const friendKey2 = `${request.toUserId}_${request.fromUserId}`;

  friends[friendKey1] = {
    userId: request.toUserId,
    friendId: request.fromUserId,
    createTime: new Date().toISOString()
  };
  friends[friendKey2] = {
    userId: request.fromUserId,
    friendId: request.toUserId,
    createTime: new Date().toISOString()
  };

  await setData(env, 'friends', friends);
  return jsonResponse({ code: 0, msg: '已添加好友' });
}

// 拒绝好友请求
async function handleRejectFriend(env, { requestId, userId }) {
  const friendRequests = await getData(env, 'friendRequests') || {};
  const request = friendRequests[requestId];

  if (!request || request.toUserId !== userId) {
    return jsonResponse({ code: -1, msg: '请求不存在' });
  }

  request.status = 'rejected';
  await setData(env, 'friendRequests', friendRequests);
  return jsonResponse({ code: 0, msg: '已拒绝' });
}

// 获取好友列表
async function handleGetFriends(env, { userId }) {
  const friends = await getData(env, 'friends') || {};
  const emailUsers = await getData(env, 'emailUsers') || {};
  const users = await getData(env, 'users') || {};

  // 检查请求者是否是管理员
  const requester = Object.values(emailUsers).find(u => u.userId === userId) || Object.values(users).find(u => u.userId === userId);
  const isAdminRequester = requester && (
    (requester.email && (env.ADMIN_IDS || '').split(',').filter(id => id).includes(requester.email)) ||
    requester.role === 'admin'
  );

  const myFriends = Object.values(friends)
    .filter(f => f.userId === userId)
    .map(f => {
      // 同时查两个表
      const friendUser = Object.values(emailUsers).find(u => u.userId === f.friendId) || Object.values(users).find(u => u.userId === f.friendId);

      const isFriendAdmin = friendUser && (
        (friendUser.email && (env.ADMIN_IDS || '').split(',').filter(id => id).includes(friendUser.email)) ||
        friendUser.role === 'admin'
      );

      let nickname = friendUser?.nickName || friendUser?.nickname || '未知用户';
      let email = '';

      if (isFriendAdmin && !isAdminRequester) {
        nickname = '匿名用户';
      }

      // 管理员可以看到好友的邮箱
      if (isAdminRequester && friendUser?.email) {
        email = friendUser.email;
      }

      return {
        friendId: f.friendId,
        nickname,
        email,
        createTime: f.createTime
      };
    });

  return jsonResponse({ code: 0, data: myFriends });
}

// 获取好友请求列表
async function handleGetFriendRequests(env, { userId }) {
  const friendRequests = await getData(env, 'friendRequests') || {};
  const emailUsers = await getData(env, 'emailUsers') || {};
  const users = await getData(env, 'users') || {};

  // 检查接收者是否是管理员
  const toUser = Object.values(emailUsers).find(u => u.userId === userId) || Object.values(users).find(u => u.userId === userId);
  const isAdminReceiver = toUser && (
    (toUser.email && (env.ADMIN_IDS || '').split(',').filter(id => id).includes(toUser.email)) ||
    toUser.role === 'admin'
  );

  const requests = Object.values(friendRequests)
    .filter(r => r.toUserId === userId && r.status === 'pending')
    .map(r => {
      const fromUser = Object.values(emailUsers).find(u => u.userId === r.fromUserId) || Object.values(users).find(u => u.userId === r.fromUserId);
      const isFromAdmin = fromUser && (
        (fromUser.email && (env.ADMIN_IDS || '').split(',').filter(id => id).includes(fromUser.email)) ||
        fromUser.role === 'admin'
      );

      let nickname = fromUser?.nickName || fromUser?.nickname || '未知用户';
      if (isFromAdmin && !isAdminReceiver) {
        nickname = '匿名用户';
      }

      return {
        ...r,
        fromNickname: nickname
      };
    });

  return jsonResponse({ code: 0, data: requests });
}

// ==================== 聊天系统 ====================

// 发送消息
async function handleSendMessage(env, { fromUserId, toUserId, content }) {
  if (!content || !content.trim()) {
    return jsonResponse({ code: -1, msg: '消息不能为空' });
  }

  // 验证是否好友
  const friends = await getData(env, 'friends') || {};
  const friendKey = `${fromUserId}_${toUserId}`;
  if (!friends[friendKey]) {
    return jsonResponse({ code: -1, msg: '还不是好友' });
  }

  const messages = await getData(env, 'messages') || {};
  const msgId = 'msg_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);

  // 用排序键存储，方便按时间查询
  const chatKey = [fromUserId, toUserId].sort().join('_');
  if (!messages[chatKey]) {
    messages[chatKey] = [];
  }

  messages[chatKey].push({
    id: msgId,
    fromUserId,
    toUserId,
    content: content.trim(),
    createTime: new Date().toISOString()
  });

  await setData(env, 'messages', messages);
  return jsonResponse({ code: 0, data: { id: msgId } });
}

// 获取聊天记录
async function handleGetMessages(env, { userId, friendId }) {
  const messages = await getData(env, 'messages') || {};
  const emailUsers = await getData(env, 'emailUsers') || {};
  const users = await getData(env, 'users') || {};

  // 调试日志
  console.log('Get messages - userId:', userId, 'friendId:', friendId);
  console.log('All chat keys:', Object.keys(messages));

  // 检查请求者是否是管理员
  const requester = Object.values(emailUsers).find(u => u.userId === userId) || Object.values(users).find(u => u.userId === userId);
  const isAdminRequester = requester && (
    (requester.email && (env.ADMIN_IDS || '').split(',').filter(id => id).includes(requester.email)) ||
    requester.role === 'admin'
  );

  const chatKey = [userId, friendId].sort().join('_');
  console.log('Looking for chatKey:', chatKey);
  const chatMessages = messages[chatKey] || [];
  console.log('Found messages:', chatMessages.length);

  const result = chatMessages.map(msg => {
    const sender = Object.values(emailUsers).find(u => u.userId === msg.fromUserId) || Object.values(users).find(u => u.userId === msg.fromUserId);
    const isSenderAdmin = sender && (
      (sender.email && (env.ADMIN_IDS || '').split(',').filter(id => id).includes(sender.email)) ||
      sender.role === 'admin'
    );

    let nickname = sender?.nickName || sender?.nickname || '未知用户';
    if (isSenderAdmin && !isAdminRequester) {
      nickname = '匿名用户';
    }

    return {
      ...msg,
      fromNickname: nickname,
      isMine: msg.fromUserId === userId
    };
  });

  return jsonResponse({ code: 0, data: result });
}

// 获取用户信息
async function handleGetUserInfo(env, { userId }, request) {
  const emailUsers = await getData(env, 'emailUsers') || {};
  const user = Object.values(emailUsers).find(u => u.userId === userId);

  if (!user) {
    return jsonResponse({ code: -1, msg: '用户不存在' });
  }

  // 检查请求者是否为管理员
  const viewerId = request.headers.get('x-user-id');
  const viewer = Object.values(emailUsers).find(u => u.userId === viewerId);
  const isAdminViewer = viewer && (env.ADMIN_IDS || '').split(',').filter(id => id).includes(viewer.email);

  // 检查被查看者是否为管理员
  const isTargetAdmin = (env.ADMIN_IDS || '').split(',').filter(id => id).includes(user.email);

  return jsonResponse({
    code: 0,
    data: {
      userId: user.userId,
      nickname: (isTargetAdmin && !isAdminViewer) ? '匿名用户' : user.nickname,
      email: isAdminViewer ? user.email : undefined // 只有管理员能看到邮箱
    }
  });
}

// 获取未读消息数
async function handleGetUnreadCount(env, { userId }) {
  // 好友请求数
  const friendRequests = await getData(env, 'friendRequests') || {};
  const pendingRequests = Object.values(friendRequests)
    .filter(r => r.toUserId === userId && r.status === 'pending').length;

  // 未读消息数
  const messages = await getData(env, 'messages') || {};
  const readMarkers = await getData(env, 'readMarkers') || {};
  const lastRead = readMarkers[userId] || {};

  let unreadMessages = 0;
  const friends = await getData(env, 'friends') || {};
  const myFriends = Object.values(friends).filter(f => f.userId === userId);

  for (const friend of myFriends) {
    const chatKey = [userId, friend.friendId].sort().join('_');
    const chatMessages = messages[chatKey] || [];
    const friendLastRead = lastRead[friend.friendId] || 0;

    unreadMessages += chatMessages.filter(m =>
      m.fromUserId === friend.friendId &&
      new Date(m.createTime).getTime() > friendLastRead
    ).length;
  }

  return jsonResponse({
    code: 0,
    data: {
      friendRequests: pendingRequests,
      messages: unreadMessages,
      total: pendingRequests + unreadMessages
    }
  });
}

// 获取每个好友的未读消息数
async function handleGetUnreadCountByFriend(env, { userId }) {
  const messages = await getData(env, 'messages') || {};
  const readMarkers = await getData(env, 'readMarkers') || {};
  const lastRead = readMarkers[userId] || {};
  const friends = await getData(env, 'friends') || {};
  const myFriends = Object.values(friends).filter(f => f.userId === userId);

  const unreadByFriend = {};

  for (const friend of myFriends) {
    const chatKey = [userId, friend.friendId].sort().join('_');
    const chatMessages = messages[chatKey] || [];
    const friendLastRead = lastRead[friend.friendId] || 0;

    const unreadCount = chatMessages.filter(m =>
      m.fromUserId === friend.friendId &&
      new Date(m.createTime).getTime() > friendLastRead
    ).length;

    if (unreadCount > 0) {
      unreadByFriend[friend.friendId] = unreadCount;
    }
  }

  return jsonResponse({
    code: 0,
    data: unreadByFriend
  });
}

// 标记已读
async function handleMarkRead(env, { userId, friendId }) {
  const readMarkers = await getData(env, 'readMarkers') || {};
  if (!readMarkers[userId]) {
    readMarkers[userId] = {};
  }
  readMarkers[userId][friendId] = Date.now();
  await setData(env, 'readMarkers', readMarkers);

  return jsonResponse({ code: 0 });
}

// 工具函数
async function getData(env, key) {
  const data = await env.DB.get(key);
  return data ? JSON.parse(data) : null;
}

async function setData(env, key, value) {
  await env.DB.put(key, JSON.stringify(value));
}

function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// 处理 OPTIONS 预检请求
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
