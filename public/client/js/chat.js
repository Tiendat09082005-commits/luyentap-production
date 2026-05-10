const socket = io();
let currentRoomId = null;

// Elements
const chatMain = document.getElementById("chatMain");
const chatHistory = document.getElementById("chatHistory");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const quickReplyBtns = document.querySelectorAll(".btn-quick-reply");

// Lấy conversationId từ element ẩn hoặc qua API
async function initChat() {
  try {
    const res = await fetch("/chat/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const data = await res.json();
    if (data.success && data.data && data.data.conversation_id) {
      currentRoomId = data.data.conversation_id;
      
      // Load tin nhắn cũ
      loadMessages();
      
      // Tham gia phòng
      socket.emit("join_room", currentRoomId);
      
      chatMain.style.display = "flex";
    }
  } catch (error) {
    console.error("Failed to init chat", error);
  }
}

async function loadMessages() {
  try {
    const res = await fetch(`/chat/message?conversationId=${currentRoomId}`);
    const data = await res.json();
    if (data.success) {
      renderMessages(data.data);
    }
  } catch (error) {
    console.error("Failed to load messages", error);
  }
}

function renderMessages(messages) {
  chatHistory.innerHTML = "";
  // Server trả về newer first hay older first?
  // Service getMessages trả về reverse() tức là oldest first -> render từ trên xuống dưới
  messages.forEach(msg => {
    appendMessageToDOM(msg);
  });
  scrollToBottom();
}

function appendMessageToDOM(msg) {
  const isMe = msg.sender_role === "user"; 
  
  const row = document.createElement("div");
  row.className = `message-row ${isMe ? 'me' : 'other'}`;
  
  let contentHtml = `<div class="msg-content">${msg.content}</div>`;

  row.innerHTML = `
    ${!isMe ? `<div class="msg-avatar">S</div>` : ''}
    ${contentHtml}
  `;
  chatHistory.appendChild(row);
}

function scrollToBottom() {
  const body = document.querySelector(".chat-body");
  if(body) {
    body.scrollTop = body.scrollHeight;
  }
}

// Gửi tin nhắn
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const content = chatInput.value.trim();
  if (!content || !currentRoomId) return;

  socket.emit("send_message", {
    conversation_id: currentRoomId,
    sender_role: "user",
    content: content
  });
  
  chatInput.value = "";
});

// Socket lắng nghe tin nhắn mới
socket.on("receive_message", (msg) => {
  if (msg.conversation_id === currentRoomId) {
    appendMessageToDOM(msg);
    scrollToBottom();
  }
});

// Quick Replies
quickReplyBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const text = btn.getAttribute("data-text");
    chatInput.value = text;
    chatForm.dispatchEvent(new Event("submit"));
  });
});

// Init
initChat();
