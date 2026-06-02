(function () {
  const root = document.getElementById("clientChatWidget");
  if (!root || typeof io !== "function") return;

  const userId = root.dataset.userId;
  const fab = document.getElementById("clientChatFab");
  const overlay = document.getElementById("clientChatOverlay");
  const panel = document.getElementById("clientChatPanel");
  const closeBtn = document.getElementById("clientChatClose");
  const messagesEl = document.getElementById("clientChatMessages");
  const sentinel = document.getElementById("clientChatSentinel");
  const emptyEl = document.getElementById("clientChatEmpty");
  const typingEl = document.getElementById("clientChatTyping");
  const form = document.getElementById("clientChatForm");
  const input = document.getElementById("clientChatInput");
  const emojiBtn = document.getElementById("clientChatEmoji");
  const uploadBtn = document.getElementById("clientChatUpload");
  const fileInput = document.getElementById("clientChatFile");
  const sound = document.getElementById("clientChatSound");

  const state = {
    socket: null,
    conversationId: null,
    conversationPromise: null,
    opened: false,
    loadingOlder: false,
    hasMore: true,
    nextCursor: null,
    typingTimer: null,
    observer: null,
    messageIds: new Set(),
  };

  function formatTime(value) {
    const date = value ? new Date(value) : new Date();
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }

  function getStatusText(status) {
    if (status === "sending") return "đang gửi";
    if (status === "seen") return "đã xem";
    return "đã gửi";
  }

  function escapeText(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char]));
  }

  function setEmptyVisible() {
    emptyEl.hidden = state.messageIds.size > 0;
  }

  function createMessageElement(message, statusOverride) {
    // user → bên phải (is-user), admin → bên trái (is-admin)
    // CSS: .client-chat-message.is-user { justify-content: flex-end }
    const isUser = message.senderType === "user";
    const row = document.createElement("div");
    row.className = `client-chat-message ${isUser ? "is-user" : "is-admin"}`;
    if (message.id) row.dataset.messageId = message.id;

    const bubble = document.createElement("div");
    bubble.className = "client-chat-bubble";

    const content = document.createElement("div");
    content.className = "client-chat-content";

    if (message.type === "image" && message.fileUrl) {
      content.innerHTML = `<img class="client-chat-image" src="${escapeText(message.fileUrl)}" alt="${escapeText(message.fileName || "Ảnh chat")}">`;
    } else if ((message.type === "file" || message.fileUrl) && message.fileUrl) {
      content.innerHTML = `<a class="client-chat-attachment" href="${escapeText(message.fileUrl)}" target="_blank" rel="noopener"><i class="fas fa-file"></i>${escapeText(message.fileName || "Tệp đính kèm")}</a>`;
    } else {
      content.textContent = message.content || "";
    }

    const meta = document.createElement("div");
    meta.className = "client-chat-meta";
    // Chỉ hiện status cho tin nhắn của user (bên phải)
    if (isUser) {
      meta.innerHTML = `<span>${formatTime(message.createdAt)}</span><span>${getStatusText(statusOverride || message.status)}</span>`;
    } else {
      meta.innerHTML = `<span>${formatTime(message.createdAt)}</span>`;
    }

    bubble.append(content, meta);
    row.appendChild(bubble);
    return row;
  }

  function appendMessage(message, options = {}) {
    if (message.id && state.messageIds.has(message.id)) return;
    if (message.id) state.messageIds.add(message.id);

    const node = createMessageElement(message, options.status);
    messagesEl.insertBefore(node, typingEl);
    setEmptyVisible();

    if (options.scroll !== false) {
      scrollToBottom();
    }
  }

  function prependMessages(messages) {
    const previousHeight = messagesEl.scrollHeight;
    const fragment = document.createDocumentFragment();

    messages.forEach((message) => {
      if (message.id && state.messageIds.has(message.id)) return;
      if (message.id) state.messageIds.add(message.id);
      fragment.appendChild(createMessageElement(message));
    });

    messagesEl.insertBefore(fragment, sentinel.nextSibling);
    setEmptyVisible();
    messagesEl.scrollTop = messagesEl.scrollHeight - previousHeight;
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  function playNotification() {
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(playFallbackTone);
      return;
    }
    playFallbackTone();
  }

  function playFallbackTone() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 720;
      gain.gain.value = 0.035;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (error) {
      // Notification audio is optional.
    }
  }

  async function readJson(response) {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("Server returned non-json response");
    }
    return response.json();
  }

  async function ensureConversation() {
    if (state.conversationId) return state.conversationId;
    if (!state.conversationPromise) {
      state.conversationPromise = fetch("/chat/conversation")
        .then(async (response) => {
          const data = await readJson(response);
          if (!response.ok || !data.success || !data.conversation?.id) {
            throw new Error(data.message || "Không thể khởi tạo chat");
          }
          state.conversationId = data.conversation.id;
          return state.conversationId;
        })
        .catch((error) => {
          state.conversationPromise = null;
          throw error;
        });
    }
    return state.conversationPromise;
  }

  function ensureSocket() {
    if (state.socket) return state.socket;

    state.socket = io({
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    state.socket.on("chat:new_message", (payload = {}) => {
      const message = payload.message;
      if (!message || message.conversationId !== state.conversationId) return;
      // Bỏ qua tin nhắn do chính mình gửi (đã hiện qua pending)
      if (message.senderId === userId && message.senderType === "user") return;
      appendMessage(message);
      playNotification();
    });

    state.socket.on("chat:typing_indicator", (payload = {}) => {
      if (payload.conversationId !== state.conversationId || payload.senderType === "user") return;
      typingEl.hidden = !payload.isTyping;
      if (payload.isTyping) scrollToBottom();
    });

    state.socket.on("chat:message_deleted", (payload = {}) => {
      if (!payload.messageId) return;
      const node = messagesEl.querySelector(`[data-message-id="${payload.messageId}"] .client-chat-content`);
      if (node) node.textContent = "Tin nhắn đã được xóa";
    });

    state.socket.on("chat:seen_update", (payload = {}) => {
      if (payload.conversationId !== state.conversationId) return;
      messagesEl.querySelectorAll(".client-chat-message.is-user .client-chat-meta span:last-child")
        .forEach((node) => { node.textContent = "đã xem"; });
    });

    return state.socket;
  }

  function emitWithAck(eventName, payload) {
    const socket = ensureSocket();
    return new Promise((resolve, reject) => {
      socket.timeout(8000).emit(eventName, payload, (error, response) => {
        if (error) return reject(new Error(`${eventName} timeout`));
        if (!response?.ok) return reject(new Error(response?.error?.message || `${eventName} failed`));
        resolve(response.data || {});
      });
    });
  }

  async function joinAndLoadInitial() {
    const conversationId = await ensureConversation();
    ensureSocket();
    await emitWithAck("chat:join", { conversationId });
    await loadMore();
    scrollToBottom();
  }

  async function loadMore() {
    if (!state.conversationId || state.loadingOlder || !state.hasMore) return;
    state.loadingOlder = true;

    try {
      const data = await emitWithAck("chat:load_more", {
        conversationId: state.conversationId,
        cursor: state.nextCursor,
      });
      state.hasMore = Boolean(data.hasMore);
      state.nextCursor = data.nextCursor || null;
      prependMessages(data.messages || []);
    } finally {
      state.loadingOlder = false;
    }
  }

  function setupObserver() {
    if (state.observer) return;
    state.observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadMore().catch(console.error);
      }
    }, {
      root: messagesEl,
      threshold: 1,
    });
    state.observer.observe(sentinel);
  }

  function openChat() {
    overlay.hidden = false;
    state.opened = true;
    input.focus();
    setupObserver();
    joinAndLoadInitial().catch(console.error);
  }

  function closeChat() {
    overlay.hidden = true;
    state.opened = false;
  }

  async function sendMessage(payload) {
    const conversationId = await ensureConversation();
    const pendingMessage = {
      id: `pending:${Date.now()}`,
      conversationId,
      senderId: userId,
      senderType: "user",
      type: payload.type || "text",
      content: payload.content || "",
      fileUrl: payload.fileUrl || "",
      fileName: payload.fileName || "",
      fileSize: payload.fileSize || 0,
      status: "sending",
      createdAt: new Date().toISOString(),
    };

    appendMessage(pendingMessage, { status: "sending" });

    try {
      const data = await emitWithAck("chat:send_message", { conversationId, ...payload });
      const pendingNode = messagesEl.querySelector(`[data-message-id="${pendingMessage.id}"]`);
      if (pendingNode) pendingNode.remove();
      state.messageIds.delete(pendingMessage.id);
      appendMessage(data.message, { status: "sent" });
    } catch (error) {
      const statusNode = messagesEl.querySelector(`[data-message-id="${pendingMessage.id}"] .client-chat-meta span:last-child`);
      if (statusNode) statusNode.textContent = "lỗi gửi";
      throw error;
    }
  }

  function emitTyping() {
    if (!state.conversationId) return;
    emitWithAck("chat:typing", { conversationId: state.conversationId }).catch(() => {});
    clearTimeout(state.typingTimer);
    state.typingTimer = setTimeout(() => {
      emitWithAck("chat:stop_typing", { conversationId: state.conversationId }).catch(() => {});
    }, 1200);
  }

  async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/chat/upload", {
      method: "POST",
      headers: typeof window.withCsrfHeaders === "function" ? window.withCsrfHeaders() : {},
      body: formData,
    });
    const data = await readJson(response);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Upload thất bại");
    }

    await sendMessage({
      type: data.type,
      fileUrl: data.url,
      fileName: data.fileName,
      fileSize: data.fileSize,
      content: data.fileName,
    });
  }

  fab.addEventListener("click", openChat);
  closeBtn.addEventListener("click", closeChat);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeChat();
  });
  panel.addEventListener("click", (event) => event.stopPropagation());

  document.querySelectorAll("[data-quick-reply]").forEach((button) => {
    button.addEventListener("click", () => {
      input.value = button.dataset.quickReply || "";
      input.focus();
    });
  });

  emojiBtn.addEventListener("click", () => {
    input.value += " 🙂";
    input.focus();
  });

  uploadBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    uploadFile(file).catch((error) => alert(error.message));
    fileInput.value = "";
  });

  input.addEventListener("input", emitTyping);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const content = input.value.trim();
    if (!content) return;
    input.value = "";
    sendMessage({ type: "text", content }).catch((error) => alert(error.message));
  });
})();