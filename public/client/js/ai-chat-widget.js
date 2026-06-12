document.addEventListener('DOMContentLoaded', () => {
  const aiChatWidget = document.getElementById('aiChatWidget');
  const aiChatFab = document.getElementById('aiChatFab');
  const aiChatOverlay = document.getElementById('aiChatOverlay');
  const aiChatClose = document.getElementById('aiChatClose');
  const aiChatForm = document.getElementById('aiChatForm');
  const aiChatInput = document.getElementById('aiChatInput');
  const aiChatSend = document.getElementById('aiChatSend');
  const aiChatMessages = document.getElementById('aiChatMessages');
  const aiChatTyping = document.getElementById('aiChatTyping');
  const suggestionChips = document.querySelectorAll('.ai-suggestion-chip');

  const botReplies = {
    hello: "Xin chào! Chúc bạn ngày mới tốt lành. Tôi có thể hỗ trợ gì cho bạn về các sản phẩm hoặc dịch vụ công nghệ của Tida?",
    intro: "Tôi là TidaAI - trợ lý ảo thông minh. Tôi hoạt động hoàn toàn ở phía trình duyệt khách (Client) cho bản demo này. Lập trình viên có thể kết nối tôi với API của Gemini hoặc OpenAI sau.",
    help: "Tôi có thể giúp bạn tìm hiểu thông tin, viết nội dung email, lên dàn ý viết bài blog hoặc giải thích các khái niệm kỹ thuật đơn giản.",
    thanks: "Cảm ơn bạn! Rất hân hạnh được hỗ trợ bạn. Hãy thoải mái đặt thêm câu hỏi nếu bạn cần nhé!",
    default: "Cảm ơn bạn đã trải nghiệm giao diện Chat AI của Tida! Hiện tại tôi đang chạy ở chế độ giao diện giả lập (Mock UI). API kết nối thực tế sẽ được lập trình viên cấu hình thêm ở phía Server."
  };

  // Toggle Modal
  function openAiChat() {
    aiChatOverlay.removeAttribute('hidden');
    aiChatFab.classList.add('active');
    
    // Auto-focus input on desktop devices
    if (window.innerWidth > 560) {
      setTimeout(() => aiChatInput.focus(), 200);
    }
  }

  function closeAiChat() {
    aiChatOverlay.setAttribute('hidden', '');
    aiChatFab.classList.remove('active');
  }

  aiChatFab.addEventListener('click', (e) => {
    e.stopPropagation();
    if (aiChatOverlay.hasAttribute('hidden')) {
      openAiChat();
    } else {
      closeAiChat();
    }
  });

  aiChatClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAiChat();
  });

  aiChatOverlay.addEventListener('click', (e) => {
    if (e.target === aiChatOverlay) {
      closeAiChat();
    }
  });

  // Handle auto-resize textarea
  aiChatInput.addEventListener('input', () => {
    aiChatInput.style.height = 'auto';
    const scrollHeight = aiChatInput.scrollHeight;
    aiChatInput.style.height = `${Math.min(scrollHeight, 80)}px`;

    if (aiChatInput.value.trim() !== '') {
      aiChatSend.removeAttribute('disabled');
    } else {
      aiChatSend.setAttribute('disabled', 'true');
    }
  });

  // Submit form
  aiChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = aiChatInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    aiChatInput.value = '';
    aiChatInput.style.height = '36px';
    aiChatSend.setAttribute('disabled', 'true');
    scrollToBottom();

    simulateResponse(text);
  });

  // Dynamic message element creation
  function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-chat-message ${sender === 'user' ? 'ai-msg-user' : 'ai-msg-system'}`;

    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const iconClass = sender === 'user' ? 'fa-regular fa-user' : 'fa-solid fa-robot';

    // Insert message content above the typing indicator
    msgDiv.innerHTML = `
      <div class="ai-msg-avatar">
        <i class="${iconClass}"></i>
      </div>
      <div class="ai-msg-content">
        <p>${escapeHtml(text)}</p>
        <span class="ai-msg-time">${timeString}</span>
      </div>
    `;

    aiChatMessages.insertBefore(msgDiv, aiChatTyping);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function scrollToBottom() {
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
  }

  // AI response simulation
  function simulateResponse(userText) {
    // Show typing indicator
    aiChatTyping.removeAttribute('hidden');
    scrollToBottom();

    let reply = botReplies.default;
    const cleanText = userText.toLowerCase();

    if (cleanText.includes('chào') || cleanText.includes('hi') || cleanText.includes('hello')) {
      reply = botReplies.hello;
    } else if (cleanText.includes('ai là ai') || cleanText.includes('giới thiệu') || cleanText.includes('tên gì')) {
      reply = botReplies.intro;
    } else if (cleanText.includes('giúp') || cleanText.includes('làm gì') || cleanText.includes('chức năng')) {
      reply = botReplies.help;
    } else if (cleanText.includes('cảm ơn') || cleanText.includes('thanks') || cleanText.includes('cám ơn')) {
      reply = botReplies.thanks;
    }

    // Delay between 1s and 2s
    const typingDelay = 1000 + Math.random() * 1000;

    setTimeout(() => {
      aiChatTyping.setAttribute('hidden', '');
      appendMessage(reply, 'bot');
      scrollToBottom();
    }, typingDelay);
  }

  // Suggestion chips click
  suggestionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      aiChatInput.value = prompt;
      aiChatInput.dispatchEvent(new Event('input'));
      aiChatInput.focus();
    });
  });
});
