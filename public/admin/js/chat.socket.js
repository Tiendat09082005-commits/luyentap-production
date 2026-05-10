const socket = io();

let conversationId = null;
const convItems = document.querySelectorAll(".conv-item");
const convList = document.querySelector(".conv-list");
const sendMessage = document.querySelector(".send-btn");
const inputChat = document.querySelector("#inputChatAdmin");
const emojiBtn = document.querySelector("#emojiBtn");
const picker = document.querySelector("#emojiPicker");

// Tự động cuộn xuống dưới cùng khi trang vừa load xong
const messageArea = document.querySelector(".messages-area");
if (messageArea) {
  setTimeout(() => {
    messageArea.scrollTop = messageArea.scrollHeight;
  }, 100);
}

// Khởi tạo conversationId từ item đang active (thường là cái đầu tiên)
const activeConv = document.querySelector(".conv-item.active");
if (activeConv) {
  conversationId = activeConv.dataset.conversationId;
  const unread = activeConv.querySelector(".unread-badge");
  if (unread) unread.remove();
  socket.emit("join_room", conversationId);
}

function bindConversationItem(item) {
  if (!item || item.dataset.boundClick === "true") return;

  item.dataset.boundClick = "true";
  item.addEventListener("click", () => {
    document
      .querySelectorAll(".conv-item")
      .forEach((i) => i.classList.remove("active"));

    item.classList.add("active");
    conversationId = item.dataset.conversationId;
    //   console.log("Conversation:", conversationId);
    if (inputChat) {
      inputChat.value = ""; // reset input
    }

    const unread = item.querySelector(".unread-badge");
    if (unread) unread.remove();

    socket.emit("join_room", conversationId);
    loadMessages(conversationId);
  });
}

if (convItems) {
  convItems.forEach((item) => {
    bindConversationItem(item);
  });
}

function appendTextWithLineBreaks(container, text) {
  const parts = String(text ?? "").split("\n");

  parts.forEach((part, index) => {
    if (index > 0) {
      container.appendChild(document.createElement("br"));
    }

    container.appendChild(document.createTextNode(part));
  });
}

function createMessageBubble(content, time) {
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";

  appendTextWithLineBreaks(bubble, content);

  const timeEl = document.createElement("div");
  timeEl.className = "msg-time";
  timeEl.textContent = time;
  bubble.appendChild(timeEl);

  return bubble;
}

function formatConversationTime(createdAt) {
  return new Date(createdAt).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ensureConversationItem(msg) {
  let conv = document.querySelector(
    `.conv-item[data-conversation-id="${msg.conversation_id}"]`,
  );

  if (conv || !convList) {
    return conv;
  }

  conv = document.createElement("div");
  conv.className = "conv-item";
  conv.dataset.conversationId = msg.conversation_id;

  const avatarWrap = document.createElement("div");
  avatarWrap.className = "avatar-wrap";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "U";

  const avatarOnline = document.createElement("div");
  avatarOnline.className = "avatar-online";

  avatarWrap.appendChild(avatar);
  avatarWrap.appendChild(avatarOnline);

  const convInfo = document.createElement("div");
  convInfo.className = "conv-info";

  const convTop = document.createElement("div");
  convTop.className = "conv-top";

  const convName = document.createElement("span");
  convName.className = "conv-name";
  convName.textContent = "Unknown";

  const convTime = document.createElement("span");
  convTime.className = "conv-time";
  convTime.textContent = formatConversationTime(msg.createdAt);

  convTop.appendChild(convName);
  convTop.appendChild(convTime);

  const convBottom = document.createElement("div");
  convBottom.className = "conv-bottom";

  const convLast = document.createElement("span");
  convLast.className = "conv-last";
  convLast.textContent =
    msg.sender_role === "admin" ? `Bạn: ${msg.content}` : msg.content;

  convBottom.appendChild(convLast);

  convInfo.appendChild(convTop);
  convInfo.appendChild(convBottom);

  conv.appendChild(avatarWrap);
  conv.appendChild(convInfo);

  convList.prepend(conv);
  bindConversationItem(conv);

  return conv;
}

function loadMessages(conversationId) {
  fetch(`/admin/message/${conversationId}`)
    .then((res) => res.json())
    .then((data) => {
      const { messages, fullNameUser } = data;
      const messageArea = document.querySelector(".messages-area");
      messageArea.innerHTML = "";

      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      const nameEl = document.querySelector(".chat-header-name");
      const avatarEl = document.querySelector(".chat-avatar");

      // avatar chữ cái đầu

      nameEl.innerText = fullNameUser;
      avatarEl.innerText = fullNameUser.charAt(0).toUpperCase();
      let lastDate = null;

      messages.forEach((msg) => {
        const msgDate = new Date(msg.createdAt);
        const msgDay = msgDate.toDateString();

        // DATE DIVIDER
        if (msgDay !== lastDate) {
          let label = "";

          if (msgDay === today) {
            label = "Hôm nay";
          } else if (msgDay === yesterday) {
            label = "Hôm qua";
          } else {
            label = msgDate.toLocaleDateString("vi-VN");
          }

          const dateDivider = document.createElement("div");
          dateDivider.className = "date-divider";
          const labelEl = document.createElement("span");
          labelEl.textContent = label;
          dateDivider.appendChild(labelEl);

          messageArea.appendChild(dateDivider);
        }

        lastDate = msgDay;

        // MESSAGE ROW
        const msgRow = document.createElement("div");

        if (msg.sender_role === "admin") {
          msgRow.className = "msg-row me";
        } else {
          msgRow.className = "msg-row them";
        }

        const time = msgDate.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });

        msgRow.appendChild(createMessageBubble(msg.content, time));

        messageArea.appendChild(msgRow);
      });

      // auto scroll xuống tin nhắn mới nhất
      setTimeout(() => {
        messageArea.scrollTop = messageArea.scrollHeight;
      }, 100);
    });
}
if (sendMessage) {
  sendMessage.addEventListener("click", () => {
    const message = inputChat.value.trim();

    if (!conversationId) {
      alert("Hãy chọn cuộc trò chuyện trước");
      return;
    }

    if (message === "") return;

    socket.emit("send_message", {
      conversation_id: conversationId,
      sender_role: "admin",
      content: message,
    });

    inputChat.value = "";
  });
}
// socket.on
socket.on("receive_message", (msg) => {
  ensureConversationItem(msg);
  updateLastMessage(msg);

  moveConversationToTop(msg.conversation_id);
  // nếu đang mở conversation đó → hiển thị message
  if (msg.conversation_id === conversationId) {
    addMessageToChat(msg);
    return;
  }

  // nếu ở conversation khác → tăng unread
  increaseUnread(msg.conversation_id);
});

function addMessageToChat(msg) {
  const messageArea = document.querySelector(".messages-area");

  const msgRow = document.createElement("div");

  if (msg.sender_role === "admin") {
    msgRow.className = "msg-row me";
  } else {
    msgRow.className = "msg-row them";
  }

  const msgDate = new Date(msg.createdAt);

  const time = msgDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  msgRow.appendChild(createMessageBubble(msg.content, time));

  messageArea.appendChild(msgRow);

  setTimeout(() => {
    messageArea.scrollTop = messageArea.scrollHeight;
  }, 100);
}

function increaseUnread(conversationId) {
  const conv = document.querySelector(
    `.conv-item[data-conversation-id="${conversationId}"]`,
  );

  if (!conv) return;

  let badge = conv.querySelector(".unread-badge");

  if (!badge) {
    badge = document.createElement("div");
    badge.className = "unread-badge";
    badge.innerText = "1";

    conv.appendChild(badge);
  } else {
    badge.innerText = Number(badge.innerText) + 1;
  }
}


function updateLastMessage(msg) {

  const conv = document.querySelector(
    `.conv-item[data-conversation-id="${msg.conversation_id}"]`
  );

  if (!conv) return;

  const lastMsg = conv.querySelector(".conv-last");
  const timeMsg = conv.querySelector(".conv-time");

  const msgDate = new Date(msg.createdAt);
  const formattedTime = msgDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (lastMsg) {
    if (msg.sender_role === "admin") {
      lastMsg.innerText = "Bạn: " + msg.content;
    } else {
      lastMsg.innerText = msg.content;
    }
  }

  if (timeMsg) {
    timeMsg.innerText = formattedTime;
  }

}


function moveConversationToTop(conversationId) {

  const conv = document.querySelector(
    `.conv-item[data-conversation-id="${conversationId}"]`
  );

  if (!conv) return;

  const list = conv.parentElement;

  if (conv && list) {
    list.prepend(conv);
  }

}



//emoji
if (emojiBtn && picker) {
  emojiBtn.addEventListener("click", () => {
    picker.style.display = picker.style.display === "none" ? "block" : "none";
  });
  picker.addEventListener("emoji-click", (event) => {
    if (!inputChat) return;
    inputChat.value += event.detail.unicode;
  });
}
//emoji
