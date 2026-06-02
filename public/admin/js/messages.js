(function () {
  const root = document.getElementById("adminMessagesApp");
  if (!root || typeof io !== "function") return;

  const elements = {
    search: document.getElementById("adminChatSearch"),
    list: document.getElementById("adminChatConversationList"),
    listEmpty: document.getElementById("adminChatListEmpty"),
    placeholder: document.getElementById("adminChatPlaceholder"),
    workspace: document.getElementById("adminChatWorkspace"),
    headerAvatar: document.getElementById("adminChatHeaderAvatar"),
    headerName: document.getElementById("adminChatHeaderName"),
    headerStatus: document.getElementById("adminChatHeaderStatus"),
    headerPhone: document.getElementById("adminChatHeaderPhone"),
    headerProfile: document.getElementById("adminChatHeaderProfile"),
    messages: document.getElementById("adminChatMessages"),
    stream: document.getElementById("adminChatMessageStream"),
    topSentinel: document.getElementById("adminChatTopSentinel"),
    typing: document.getElementById("adminChatTyping"),
    feedEmpty: document.getElementById("adminChatFeedEmpty"),
    form: document.getElementById("adminChatForm"),
    input: document.getElementById("adminChatInput"),
    emoji: document.getElementById("adminChatEmoji"),
    upload: document.getElementById("adminChatUpload"),
    file: document.getElementById("adminChatFile"),
    closeConversation: document.getElementById("adminChatCloseConversation"),
    deleteConversation: document.getElementById("adminChatDeleteConversation"),
  };

  const state = {
    adminId: root.dataset.adminId || "",
    initialConversationId: root.dataset.initialConversationId || "",
    socket: null,
    conversations: [],
    activeConversationId: "",
    activeConversation: null,
    messages: [],
    nextCursor: null,
    hasMore: true,
    loadingOlder: false,
    observer: null,
    searchTimer: null,
    typingTimer: null,
    query: "",
    // Cache tin nhắn theo conversationId — tránh load lại khi chuyển qua lại
    messageCache: {},
    // Track conversation nào đã join socket room rồi
    joinedRooms: new Set(),
  };

  // ─── Skeleton loading ─────────────────────────────────────────────────────

  function renderSkeleton() {
    const lines = [72, 48, 88, 56, 64];
    const html = lines.map(function (width, index) {
      const isAdmin = index % 2 === 1;
      return '<div class="admin-chat__message-row' + (isAdmin ? " is-admin" : "") + '" style="pointer-events:none">'
        + '<div class="admin-chat__bubble" style="'
        + "width:" + width + "%;min-height:38px;background:var(--mc-border);"
        + "border-color:var(--mc-border);border-radius:14px;"
        + "animation:adminChatSkeletonPulse 1.2s ease-in-out " + (index * 0.12) + "s infinite alternate"
        + '"></div></div>';
    }).join("");

    elements.stream.innerHTML = '<style>'
      + '@keyframes adminChatSkeletonPulse{'
      + '0%{opacity:.45}100%{opacity:.9}'
      + '}'
      + '</style>' + html;
    elements.feedEmpty.hidden = true;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function escapeText(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
    });
  }

  function formatClock(value) {
    return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }

  function formatListTime(value) {
    if (!value) return "";
    const date = new Date(value);
    const now = new Date();
    const isSameDay = date.toDateString() === now.toDateString();
    return isSameDay
      ? formatClock(date)
      : date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  }

  function formatDayLabel(value) {
    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Hôm nay";
    if (date.toDateString() === yesterday.toDateString()) return "Hôm qua";
    return date.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function getStatusText(status) {
    if (status === "sending") return "Đang gửi";
    if (status === "failed") return "Lỗi gửi";
    if (status === "seen") return "Đã xem";
    return "Đã gửi";
  }

  function getInitials(name) {
    const words = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "KH";
    return words.slice(-2).map(function (w) { return w[0]; }).join("").toUpperCase();
  }

  function getPreviewText(conversation) {
    if (!conversation) return "";
    const lastMessage = conversation.lastMessage || {};
    const content = typeof lastMessage === "string" ? lastMessage : lastMessage.content;
    if (content) return content;
    return conversation.status === "closed" ? "Hội thoại đã được đóng" : "Chưa có tin nhắn";
  }

  function readJson(response) {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) throw new Error("Phản hồi từ máy chủ không hợp lệ");
    return response.json();
  }

  function getConversationIndex(conversationId) {
    return state.conversations.findIndex(function (item) { return item.id === conversationId; });
  }

  function getConversationById(conversationId) {
    return state.conversations.find(function (item) { return item.id === conversationId; }) || null;
  }

  function mergeConversationData(existing, incoming) {
    if (!existing) return incoming;
    if (!incoming) return existing;
    return {
      id: existing.id,
      status: incoming.status || existing.status,
      unreadCount: typeof incoming.unreadCount === "number" ? incoming.unreadCount : existing.unreadCount,
      lastMessage: incoming.lastMessage || existing.lastMessage,
      lastMessageAt: incoming.lastMessageAt || existing.lastMessageAt,
      user: Object.assign({}, existing.user || {}, incoming.user || {}),
    };
  }

  function upsertConversation(conversation, moveToTop) {
    if (!conversation || !conversation.id) return;
    const index = getConversationIndex(conversation.id);
    if (index === -1) {
      state.conversations.unshift(conversation);
    } else {
      state.conversations[index] = mergeConversationData(state.conversations[index], conversation);
      if (moveToTop) {
        const current = state.conversations.splice(index, 1)[0];
        state.conversations.unshift(current);
      }
    }
  }

  function removeConversation(conversationId) {
    state.conversations = state.conversations.filter(function (item) { return item.id !== conversationId; });
    delete state.messageCache[conversationId];
    state.joinedRooms.delete(conversationId);
  }

  function createAvatarMarkup(user) {
    if (user && user.avatar) {
      return '<img src="' + escapeText(user.avatar) + '" alt="' + escapeText(user.fullName || "Khách hàng") + '">';
    }
    return escapeText(getInitials(user && user.fullName));
  }

  // ─── Cache helpers ────────────────────────────────────────────────────────

  function getCachedMessages(conversationId) {
    return state.messageCache[conversationId] || null;
  }

  function setCachedMessages(conversationId, messages) {
    state.messageCache[conversationId] = messages.slice();
  }

  function appendToCache(conversationId, message) {
    if (!state.messageCache[conversationId]) return;
    const exists = state.messageCache[conversationId].some(function (m) { return m.id === message.id; });
    if (!exists) state.messageCache[conversationId].push(message);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  function renderConversationList() {
    if (!state.conversations.length) {
      elements.list.innerHTML = "";
      elements.list.appendChild(elements.listEmpty);
      elements.listEmpty.hidden = false;
      return;
    }

    elements.listEmpty.hidden = true;
    const fragment = document.createDocumentFragment();

    state.conversations.forEach(function (conversation) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "admin-chat__conversation" + (conversation.id === state.activeConversationId ? " is-active" : "");
      button.dataset.conversationId = conversation.id;

      const unreadBadge = conversation.unreadCount > 0
        ? '<span class="admin-chat__conversation-badge">' + conversation.unreadCount + "</span>"
        : "";

      button.innerHTML = ''
        + '<span class="admin-chat__conversation-avatar">' + createAvatarMarkup(conversation.user) + "</span>"
        + '<span class="admin-chat__conversation-body">'
        + '<span class="admin-chat__conversation-head">'
        + '<strong class="admin-chat__conversation-name">' + escapeText(conversation.user.fullName || "Khách hàng") + "</strong>"
        + '<span class="admin-chat__conversation-time">' + escapeText(formatListTime(conversation.lastMessageAt)) + "</span>"
        + "</span>"
        + '<span class="admin-chat__conversation-preview">' + escapeText(getPreviewText(conversation)) + "</span>"
        + "</span>"
        + '<span class="admin-chat__conversation-meta">' + unreadBadge + "</span>";

      fragment.appendChild(button);
    });

    elements.list.innerHTML = "";
    elements.list.appendChild(fragment);
  }

  function renderHeader() {
    const conversation = state.activeConversation;
    if (!conversation) {
      elements.placeholder.hidden = false;
      elements.workspace.hidden = true;
      return;
    }
    elements.placeholder.hidden = true;
    elements.workspace.hidden = false;
    elements.headerAvatar.innerHTML = createAvatarMarkup(conversation.user);
    elements.headerName.textContent = conversation.user.fullName || "Khách hàng";
    elements.headerPhone.textContent = conversation.user.phone || conversation.user.email || "Chưa cập nhật số điện thoại";
    elements.headerProfile.href = conversation.user.profileUrl || "/admin/accounts/user";
    elements.headerStatus.textContent = conversation.status === "closed" ? "Đã đóng" : "Đang mở";
    elements.headerStatus.classList.toggle("is-closed", conversation.status === "closed");
  }

  function buildMessageNode(message) {
    const senderType = String(message.senderType || "").toLowerCase();
    const isAdmin = senderType === "admin";
    const isDeleted = Boolean(message.isDeleted);

    const row = document.createElement("div");
    row.className = "admin-chat__message-row" + (isAdmin ? " is-admin" : "");
    row.dataset.messageId = message.id;

    const bubble = document.createElement("div");
    bubble.className = "admin-chat__bubble" + (isDeleted ? " is-deleted" : "");

    const content = document.createElement("div");
    content.className = "admin-chat__message-content";

    if (isDeleted) {
      content.textContent = "Tin nhắn đã được xóa";
    } else if (message.type === "image" && message.fileUrl) {
      content.innerHTML = '<img src="' + escapeText(message.fileUrl) + '" alt="' + escapeText(message.fileName || "Ảnh chat") + '">';
    } else if ((message.type === "file" || message.fileUrl) && message.fileUrl) {
      content.innerHTML = '<a href="' + escapeText(message.fileUrl) + '" target="_blank" rel="noopener"><i class="fas fa-file"></i>' + escapeText(message.fileName || "Tệp đính kèm") + "</a>";
    } else {
      content.textContent = message.content || "";
    }

    const meta = document.createElement("div");
    meta.className = "admin-chat__message-meta";
    if (isAdmin) {
      meta.innerHTML = "<span>" + escapeText(formatClock(message.createdAt)) + "</span><span>" + escapeText(getStatusText(message.status)) + "</span>";
    } else {
      meta.innerHTML = "<span>" + escapeText(formatClock(message.createdAt)) + "</span>";
    }

    bubble.appendChild(content);
    bubble.appendChild(meta);
    row.appendChild(bubble);
    return row;
  }

  function renderMessages(options) {
    const config = Object.assign({
      preserveScroll: false,
      previousHeight: 0,
      previousTop: 0,
      scrollBottom: false,
    }, options || {});

    const fragment = document.createDocumentFragment();
    let currentDate = "";

    state.messages.forEach(function (message) {
      const messageDate = new Date(message.createdAt).toDateString();
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        const divider = document.createElement("div");
        divider.className = "admin-chat__day-divider";
        divider.textContent = formatDayLabel(message.createdAt);
        fragment.appendChild(divider);
      }
      fragment.appendChild(buildMessageNode(message));
    });

    elements.stream.innerHTML = "";
    elements.stream.appendChild(fragment);
    elements.feedEmpty.hidden = state.messages.length > 0;

    if (config.preserveScroll) {
      const newHeight = elements.messages.scrollHeight;
      elements.messages.scrollTop = newHeight - config.previousHeight + config.previousTop;
      return;
    }

    if (config.scrollBottom) {
      requestAnimationFrame(function () {
        elements.messages.scrollTop = elements.messages.scrollHeight;
      });
    }
  }

  // ─── Socket ───────────────────────────────────────────────────────────────

  function ensureSocket() {
    if (state.socket) return state.socket;

    const socket = io({ withCredentials: true, transports: ["websocket", "polling"] });

    socket.on("chat:new_message", function (payload) {
      const message = payload && payload.message;
      if (!message) return;

      const baseConversation = getConversationById(message.conversationId)
        || (state.activeConversation && state.activeConversation.id === message.conversationId ? state.activeConversation : null);

      if (!baseConversation) {
        fetchConversations({ query: state.query, preserveSelection: true }).catch(console.error);
      }

      const mergedConversation = mergeConversationData(baseConversation, payload.conversation ? {
        id: payload.conversation.id || message.conversationId,
        status: payload.conversation.status,
        unreadCount: payload.conversation.unreadCount,
        lastMessage: payload.conversation.lastMessage,
        lastMessageAt: payload.conversation.lastMessageAt,
      } : null);

      if (!state.query || (baseConversation && baseConversation.id === message.conversationId)) {
        upsertConversation(mergedConversation || baseConversation, true);
        renderConversationList();
      }

      // Luôn update cache dù conversation có đang active hay không
      appendToCache(message.conversationId, message);

      if (message.conversationId !== state.activeConversationId) return;

      const exists = state.messages.some(function (item) { return item.id === message.id; });
      if (!exists) {
        state.messages.push(message);
        renderMessages({ scrollBottom: true });
      }

      if (message.senderType === "user") emitSeen();
    });

    socket.on("chat:typing_indicator", function (payload) {
      if (!payload || payload.conversationId !== state.activeConversationId) return;
      if (payload.senderType !== "user") return;
      elements.typing.hidden = !payload.isTyping;
      if (payload.isTyping) {
        requestAnimationFrame(function () {
          elements.messages.scrollTop = elements.messages.scrollHeight;
        });
      }
    });

    socket.on("chat:message_deleted", function (payload) {
      if (!payload || payload.conversationId !== state.activeConversationId) return;
      const message = state.messages.find(function (item) { return item.id === payload.messageId; });
      if (!message) return;
      message.isDeleted = true;
      const cached = getCachedMessages(state.activeConversationId);
      if (cached) {
        const cm = cached.find(function (m) { return m.id === payload.messageId; });
        if (cm) cm.isDeleted = true;
      }
      renderMessages();
    });

    socket.on("chat:seen_update", function (payload) {
      if (!payload || payload.conversationId !== state.activeConversationId) return;
      if (payload.seenBy && payload.seenBy.senderType !== "user") return;
      state.messages.forEach(function (message) {
        if (message.senderType === "admin") message.status = "seen";
      });
      const cached = getCachedMessages(state.activeConversationId);
      if (cached) {
        cached.forEach(function (m) { if (m.senderType === "admin") m.status = "seen"; });
      }
      renderMessages();
    });

    socket.on("chat:unread_count", function (payload) {
      if (!payload || !payload.conversationId) return;
      const conversation = getConversationById(payload.conversationId);
      if (!conversation) {
        fetchConversations({ query: state.query, preserveSelection: true }).catch(console.error);
        return;
      }
      conversation.unreadCount = payload.unreadCount || 0;
      renderConversationList();
    });

    state.socket = socket;
    return socket;
  }

  function emitWithAck(eventName, payload) {
    const socket = ensureSocket();
    return new Promise(function (resolve, reject) {
      socket.timeout(8000).emit(eventName, payload, function (error, response) {
        if (error) { reject(new Error(eventName + " timeout")); return; }
        if (!response || !response.ok) {
          reject(new Error(response && response.error && response.error.message || eventName + " failed"));
          return;
        }
        resolve(response.data || {});
      });
    });
  }

  // ─── Conversations ────────────────────────────────────────────────────────

  async function fetchConversations(options) {
    const config = Object.assign({ query: state.query, preserveSelection: true }, options || {});
    const url = new URL("/admin/messages/conversations", window.location.origin);
    if (config.query) url.searchParams.set("q", config.query);

    const response = await fetch(url.toString(), {
      headers: window.withCsrfHeaders ? window.withCsrfHeaders() : {},
    });
    const data = await readJson(response);
    if (!response.ok || !data.success) throw new Error(data.message || "Không thể tải danh sách hội thoại");

    state.conversations = data.conversations || [];
    renderConversationList();

    const currentId = config.preserveSelection ? state.activeConversationId : "";
    const fallbackId = currentId || state.initialConversationId || (state.conversations[0] && state.conversations[0].id) || "";

    if (!fallbackId) {
      state.activeConversationId = "";
      state.activeConversation = null;
      state.messages = [];
      renderHeader();
      renderMessages();
      return;
    }

    if (state.activeConversationId === fallbackId && getConversationById(fallbackId)) {
      state.activeConversation = mergeConversationData(state.activeConversation, getConversationById(fallbackId));
      renderHeader();
      return;
    }

    await openConversation(fallbackId);
  }

  async function fetchConversation(conversationId) {
    const response = await fetch("/admin/messages/conversations/" + encodeURIComponent(conversationId), {
      headers: window.withCsrfHeaders ? window.withCsrfHeaders() : {},
    });
    const data = await readJson(response);
    if (!response.ok || !data.success || !data.conversation) throw new Error(data.message || "Không thể tải hội thoại");
    return data.conversation;
  }

  function setupObserver() {
    if (state.observer) return;
    state.observer = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      loadMoreMessages().catch(console.error);
    }, { root: elements.messages, threshold: 1 });
    state.observer.observe(elements.topSentinel);
  }

  // ─── Open conversation — core được tối ưu ────────────────────────────────

  async function openConversation(conversationId) {
    if (!conversationId) return;

    // 1. Highlight list item ngay lập tức
    state.activeConversationId = conversationId;
    elements.typing.hidden = true;
    renderConversationList();

    // 2. Nếu có cache → render ngay (user thấy tin nhắn cũ lập tức, 0ms delay)
    const cached = getCachedMessages(conversationId);
    if (cached && cached.length) {
      state.messages = cached.slice();
      state.activeConversation = getConversationById(conversationId) || state.activeConversation;
      renderHeader();
      renderMessages({ scrollBottom: true });
    } else {
      // Chưa có cache → hiện skeleton trong khi chờ network
      state.messages = [];
      state.activeConversation = getConversationById(conversationId) || state.activeConversation;
      renderHeader();
      renderSkeleton();
    }

    state.nextCursor = null;
    state.hasMore = true;
    state.loadingOlder = false;

    // 3. Chạy song song fetchConversation + chat:join thay vì tuần tự
    const joinPromise = state.joinedRooms.has(conversationId)
      ? Promise.resolve()
      : emitWithAck("chat:join", { conversationId: conversationId }).then(function () {
          state.joinedRooms.add(conversationId);
        });

    const [conversation] = await Promise.all([
      fetchConversation(conversationId),
      joinPromise,
    ]);

    // 4. Update header với data mới nhất
    state.activeConversation = mergeConversationData(getConversationById(conversationId), conversation);
    upsertConversation(state.activeConversation, false);
    renderConversationList();
    renderHeader();
    setupObserver();

    // 5. Load tin nhắn mới nhất từ server (luôn refresh để đồng bộ)
    await loadMoreMessages({ reset: true, scrollBottom: !cached || !cached.length });

    // 6. Nếu có cache và vừa load xong — scroll xuống nếu có tin mới
    if (cached && cached.length && state.messages.length > cached.length) {
      requestAnimationFrame(function () {
        elements.messages.scrollTop = elements.messages.scrollHeight;
      });
    }

    await emitSeen();
  }

  async function loadMoreMessages(options) {
    const config = Object.assign({ reset: false, scrollBottom: false }, options || {});
    if (!state.activeConversationId || state.loadingOlder) return;
    if (!config.reset && !state.hasMore) return;

    state.loadingOlder = true;

    try {
      const previousHeight = elements.messages.scrollHeight;
      const previousTop = elements.messages.scrollTop;
      const data = await emitWithAck("chat:load_more", {
        conversationId: state.activeConversationId,
        cursor: config.reset ? null : state.nextCursor,
      });

      const incoming = data.messages || [];
      state.hasMore = Boolean(data.hasMore);
      state.nextCursor = data.nextCursor || null;

      if (config.reset) {
        state.messages = incoming;
        setCachedMessages(state.activeConversationId, incoming);
        renderMessages({ scrollBottom: config.scrollBottom });
      } else if (incoming.length) {
        const seenIds = new Set(state.messages.map(function (item) { return item.id; }));
        const prepended = incoming.filter(function (item) { return !seenIds.has(item.id); });
        state.messages = prepended.concat(state.messages);
        setCachedMessages(state.activeConversationId, state.messages);
        renderMessages({ preserveScroll: true, previousHeight: previousHeight, previousTop: previousTop });
      }
    } finally {
      state.loadingOlder = false;
    }
  }

  async function emitSeen() {
    if (!state.activeConversationId) return;
    try {
      await emitWithAck("chat:seen", { conversationId: state.activeConversationId });
      const conversation = getConversationById(state.activeConversationId);
      if (conversation) conversation.unreadCount = 0;
      if (state.activeConversation) state.activeConversation.unreadCount = 0;
      renderConversationList();
    } catch (error) {
      console.error(error);
    }
  }

  function emitTyping() {
    if (!state.activeConversationId) return;
    emitWithAck("chat:typing", { conversationId: state.activeConversationId }).catch(function () {});
    clearTimeout(state.typingTimer);
    state.typingTimer = setTimeout(function () {
      emitWithAck("chat:stop_typing", { conversationId: state.activeConversationId }).catch(function () {});
    }, 1200);
  }

  // ─── Send / Upload ────────────────────────────────────────────────────────

  async function sendMessage(payload) {
    if (!state.activeConversationId) return;

    const pendingId = "pending:" + Date.now();
    const pendingMessage = {
      id: pendingId,
      conversationId: state.activeConversationId,
      senderId: state.adminId,
      senderType: "admin",
      type: payload.type || "text",
      content: payload.content || "",
      fileUrl: payload.fileUrl || "",
      fileName: payload.fileName || "",
      fileSize: payload.fileSize || 0,
      status: "sending",
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };
    state.messages.push(pendingMessage);
    renderMessages({ scrollBottom: true });

    try {
      const data = await emitWithAck("chat:send_message", Object.assign({ conversationId: state.activeConversationId }, payload));

      state.messages = state.messages.filter(function (item) { return item.id !== pendingId; });
      const exists = state.messages.some(function (item) { return item.id === data.message.id; });
      if (!exists) state.messages.push(data.message);

      setCachedMessages(state.activeConversationId, state.messages);

      const updatedConversation = mergeConversationData(getConversationById(state.activeConversationId), {
        id: state.activeConversationId,
        status: data.conversation && data.conversation.status,
        unreadCount: data.conversation && data.conversation.unreadCount,
        lastMessage: data.conversation && data.conversation.lastMessage,
        lastMessageAt: data.conversation && data.conversation.lastMessageAt,
      });

      if (updatedConversation) {
        upsertConversation(updatedConversation, true);
        state.activeConversation = mergeConversationData(state.activeConversation, updatedConversation);
        renderConversationList();
        renderHeader();
      }

      renderMessages({ scrollBottom: true });
    } catch (error) {
      state.messages.forEach(function (message) {
        if (message.id === pendingId) message.status = "failed";
      });
      renderMessages({ scrollBottom: true });
      throw error;
    }
  }

  async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/admin/messages/upload", {
      method: "POST",
      headers: window.withCsrfHeaders ? window.withCsrfHeaders() : {},
      body: formData,
    });
    const data = await readJson(response);
    if (!response.ok || !data.success) throw new Error(data.message || "Upload thất bại");
    await sendMessage({ type: data.type, fileUrl: data.url, fileName: data.fileName, fileSize: data.fileSize, content: data.fileName });
  }

  async function closeConversation() {
    if (!state.activeConversationId) return;
    
    Swal.fire({
      icon: 'question',
      title: 'Đóng hội thoại',
      text: 'Đóng hội thoại này? Khách hàng vẫn có thể nhắn lại để mở tiếp.',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý đóng',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#FFFFFF'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch("/admin/messages/conversations/" + encodeURIComponent(state.activeConversationId) + "/close", {
            method: "PATCH",
            headers: window.withCsrfHeaders ? window.withCsrfHeaders({ "Content-Type": "application/json" }) : { "Content-Type": "application/json" },
          });
          const data = await readJson(response);
          if (!response.ok || !data.success) throw new Error(data.message || "Không thể đóng hội thoại");

          state.activeConversation = mergeConversationData(state.activeConversation, data.conversation);
          upsertConversation(data.conversation, false);
          renderConversationList();
          renderHeader();
        } catch (error) {
          Swal.fire({ icon: 'error', text: error.message });
        }
      }
    });
  }

  async function deleteConversation() {
    if (!state.activeConversationId) return;
    
    Swal.fire({
      icon: 'warning',
      title: 'Xóa hội thoại',
      text: 'Xóa toàn bộ đoạn chat này? Hành động này không thể hoàn tác.',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#FFFFFF'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const deletingId = state.activeConversationId;
          const response = await fetch("/admin/messages/conversations/" + encodeURIComponent(deletingId), {
            method: "DELETE",
            headers: window.withCsrfHeaders ? window.withCsrfHeaders({ "Content-Type": "application/json" }) : { "Content-Type": "application/json" },
          });
          const data = await readJson(response);
          if (!response.ok || !data.success) throw new Error(data.message || "Không thể xóa hội thoại");

          removeConversation(deletingId);
          state.activeConversationId = "";
          state.activeConversation = null;
          state.messages = [];
          renderConversationList();
          renderHeader();
          renderMessages();
        } catch (error) {
          Swal.fire({ icon: 'error', text: error.message });
        }
      }
    });
  }

  // ─── Event listeners ──────────────────────────────────────────────────────

  elements.list.addEventListener("click", function (event) {
    const trigger = event.target.closest("[data-conversation-id]");
    if (!trigger) return;
    const conversationId = trigger.dataset.conversationId;
    if (!conversationId || conversationId === state.activeConversationId) return;
    openConversation(conversationId).catch(function (error) { Swal.fire({ icon: 'error', text: error.message }); });
  });

  elements.search.addEventListener("input", function () {
    clearTimeout(state.searchTimer);
    state.query = elements.search.value.trim();
    state.searchTimer = setTimeout(function () {
      fetchConversations({ query: state.query, preserveSelection: false }).catch(console.error);
    }, 220);
  });

  elements.emoji.addEventListener("click", function () {
    elements.input.value += " 🙂";
    elements.input.focus();
  });

  elements.upload.addEventListener("click", function () { elements.file.click(); });

  elements.file.addEventListener("change", function () {
    const file = elements.file.files && elements.file.files[0];
    if (!file) return;
    uploadFile(file).catch(function (error) { Swal.fire({ icon: 'error', text: error.message }); }).finally(function () { elements.file.value = ""; });
  });

  elements.input.addEventListener("input", emitTyping);

  elements.form.addEventListener("submit", function (event) {
    event.preventDefault();
    const content = elements.input.value.trim();
    if (!content) return;
    elements.input.value = "";
    sendMessage({ type: "text", content: content }).catch(function (error) { Swal.fire({ icon: 'error', text: error.message }); });
  });

  elements.closeConversation.addEventListener("click", function () {
    closeConversation().catch(function (error) { Swal.fire({ icon: 'error', text: error.message }); });
  });

  elements.deleteConversation.addEventListener("click", function () {
    deleteConversation().catch(function (error) { Swal.fire({ icon: 'error', text: error.message }); });
  });

  fetchConversations().catch(function (error) {
    console.error(error);
    Swal.fire({ icon: 'error', text: error.message });
  });
})();