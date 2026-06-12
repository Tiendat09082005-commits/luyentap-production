document.addEventListener('DOMContentLoaded', () => {
  const aiChatWidget = document.getElementById('aiChatWidget');
  const aiChatFab = document.getElementById('aiChatFab');
  const aiChatOverlay = document.getElementById('aiChatOverlay');
  const aiChatClose = document.getElementById('aiChatClose');
  const aiChatReset = document.getElementById('aiChatReset');
  
  const aiChatWelcome = document.getElementById('aiChatWelcome');
  const aiChatMessages = document.getElementById('aiChatMessages');
  const aiChatForm = document.getElementById('aiChatForm');
  const aiChatFooterNote = document.getElementById('aiChatFooterNote');

  const aiChatInput = document.getElementById('aiChatInput');
  const aiChatSend = document.getElementById('aiChatSend');
  const aiChatTyping = document.getElementById('aiChatTyping');
  const welcomeCards = document.querySelectorAll('.ai-welcome-card');

  // Trạng thái hội thoại hiện tại
  let currentFlow = {
    type: 'GENERAL_KNOWLEDGE', // PRODUCT_SEARCH | PRODUCT_COMPARE | STORE_POLICY | GENERAL_KNOWLEDGE
    option: null,               // laptop, pc, phone, order, compare, warranty, other
    wizardStep: 0,
    wizardData: {}
  };

  const botReplies = {
    laptop: "Chào bạn! Tôi có thể tư vấn các dòng laptop văn phòng mỏng nhẹ (Dell XPS, HP Envy, Macbook Air) hoặc laptop gaming cấu hình khủng (Asus ROG, MSI, Acer Predator). Bạn cần laptop cho nhu cầu học tập/làm việc hay chiến game? Ngân sách dự kiến của bạn khoảng bao nhiêu?",
    pc: "Chào bạn! Tôi sẽ hỗ trợ bạn cấu hình PC Gaming tối ưu nhất. Bạn muốn lắp ráp PC theo yêu cầu (custom build) hay mua máy đồng bộ nguyên chiếc? Bạn dự định chơi những tựa game nào và tầm tài chính thế nào?",
    phone: "Chào bạn! Hiện tại Tida đang có sẵn các mẫu flagship cao cấp nhất (iPhone 15 Series, Samsung Galaxy S24) và các dòng tầm trung giá cực tốt. Bạn quan tâm thương hiệu nào hay cần tư vấn máy thiên về chụp ảnh, chơi game?",
    compare: "Chào bạn! Bạn đang phân vân giữa sản phẩm nào? Hãy gửi cho tôi tên 2 sản phẩm cần so sánh (ví dụ: 'iPhone 15 Pro vs Galaxy S24 Ultra'), tôi sẽ đối chiếu hiệu năng, màn hình, camera và pin cho bạn.",
    order: "Chào bạn! Bạn vui lòng nhập Mã đơn hàng của mình (ví dụ: 'TD-9988'). Tôi sẽ kiểm tra nhanh trạng thái xử lý và giao nhận của đơn hàng giúp bạn ngay lập tức.",
    warranty: "Chào bạn! Chính sách bảo hành của Tida hỗ trợ 1 đổi 1 trong 30 ngày đầu nếu có lỗi phần cứng từ nhà sản xuất, bảo hành chính hãng 12-24 tháng. Bạn cần hỗ trợ bảo hành cho thiết bị nào?",
    other: "Chào bạn! Tôi là trợ lý mua sắm AI. Hãy đặt câu hỏi bất kỳ ở khung chat bên dưới về các thiết bị công nghệ, tôi sẽ trả lời bạn ngay!",
    default: "Cảm ơn bạn đã trò chuyện! Nếu bạn cần tìm kiếm thông số chi tiết của sản phẩm nào, hãy nhắn cho tôi nhé. Tôi rất sẵn lòng hỗ trợ."
  };

  // Toggle Modal
  function openAiChat() {
    aiChatOverlay.removeAttribute('hidden');
    aiChatFab.classList.add('active');
    
    // Auto focus ô nhập liệu chỉ khi form chat đang được hiển thị
    if (!aiChatForm.hasAttribute('hidden') && window.innerWidth > 560) {
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

  // Reset chat quay về màn hình chào mừng (+)
  aiChatReset.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Dọn dẹp tin nhắn cũ
    const messages = aiChatMessages.querySelectorAll('.ai-chat-message');
    messages.forEach((msg, index) => {
      if (index > 0) msg.remove(); // Chỉ giữ lại tin nhắn gốc đầu tiên
    });

    // Xóa bỏ các lựa chọn wizard cũ
    const wizardEl = aiChatMessages.querySelectorAll('.ai-wizard-choices');
    wizardEl.forEach(w => w.remove());

    // Chuyển đổi trạng thái giao diện
    aiChatMessages.setAttribute('hidden', '');
    aiChatForm.setAttribute('hidden', '');
    aiChatFooterNote.setAttribute('hidden', '');
    aiChatReset.setAttribute('hidden', '');
    aiChatWelcome.removeAttribute('hidden');

    // Reset State
    currentFlow = {
      type: 'GENERAL_KNOWLEDGE',
      option: null,
      wizardStep: 0,
      wizardData: {}
    };

    aiChatInput.value = '';
    aiChatInput.style.height = '36px';
    aiChatInput.placeholder = "Nhập câu hỏi của bạn...";
    aiChatSend.setAttribute('disabled', 'true');
  });

  // Xử lý khi chọn Thẻ gợi ý ở màn hình chào mừng
  welcomeCards.forEach(card => {
    card.addEventListener('click', () => {
      const type = card.getAttribute('data-type');
      const option = card.getAttribute('data-option');
      const label = card.getAttribute('data-label');

      // Thiết lập trạng thái luồng
      currentFlow.type = type;
      currentFlow.option = option;
      currentFlow.wizardStep = 0;
      currentFlow.wizardData = {};

      // Chuyển đổi giao diện
      aiChatWelcome.setAttribute('hidden', '');
      aiChatMessages.removeAttribute('hidden');
      aiChatForm.removeAttribute('hidden');
      aiChatFooterNote.removeAttribute('hidden');
      aiChatReset.removeAttribute('hidden');

      // Tùy biến placeholder theo luồng
      updateInputPlaceholder(option);

      // Đi vào các luồng Wizard hoặc Tin nhắn mẫu
      if (type === 'PRODUCT_SEARCH' && ['laptop', 'pc', 'phone'].includes(option)) {
        startWizardFlow(option);
      } else {
        // Tự động gửi tin nhắn đại diện cho thẻ đã chọn
        appendMessage(label, 'user');
        scrollToBottom();
        
        // Gửi yêu cầu lên Backend
        const payload = {
          type: currentFlow.type,
          content: label,
          metadata: {
            category: option
          }
        };
        sendPayloadToBackend(payload);
      }
    });
  });

  // Thay đổi placeholder của khung input dựa trên chủ đề được chọn
  function updateInputPlaceholder(option) {
    if (option === 'compare') {
      aiChatInput.placeholder = "Ví dụ: so sánh iPhone 15 Pro và Galaxy S24 Ultra...";
    } else if (option === 'order') {
      aiChatInput.placeholder = "Nhập mã đơn hàng của bạn (ví dụ: TD-1029)...";
    } else if (option === 'warranty') {
      aiChatInput.placeholder = "Nhập thiết bị cần bảo hành hoặc thắc mắc của bạn...";
    } else {
      aiChatInput.placeholder = "Nhập câu hỏi của bạn...";
    }
  }

  // Khởi động luồng chọn khảo sát nhanh Wizard 4 BƯỚC cho PRODUCT_SEARCH
  function startWizardFlow(option) {
    currentFlow.wizardStep = 1;
    
    if (option === 'laptop') {
      appendSystemMessage("Bước 1/4: Bạn ưu tiên thương hiệu / hệ sinh thái Laptop nào?");
      appendWizardChoices([
        { value: "apple", label: "🍎 Apple (Macbook)" },
        { value: "dell-hp", label: "💻 Dell / HP" },
        { value: "asus-acer", label: "🔥 Asus / Acer" },
        { value: "lenovo-msi", label: "💼 Lenovo / MSI" },
        { value: "any", label: "✨ Không quan trọng" }
      ], 1);
    } else if (option === 'pc') {
      appendSystemMessage("Bước 1/4: Bạn cần loại máy PC nào?");
      appendWizardChoices([
        { value: "custom", label: "🔧 PC Tự lắp ráp (Custom)" },
        { value: "brand", label: "🏢 PC Nguyên bộ hãng" },
        { value: "all-in-one", label: "🖥️ PC All-in-One (Liền màn)" }
      ], 1);
    } else if (option === 'phone') {
      appendSystemMessage("Bước 1/4: Bạn muốn tìm Điện thoại thuộc hệ điều hành nào?");
      appendWizardChoices([
        { value: "ios", label: "🍎 iOS (iPhone)" },
        { value: "android", label: "🤖 Android (Samsung/Xiaomi...)" },
        { value: "any", label: "✨ Hệ điều hành nào cũng được" }
      ], 1);
    }
    scrollToBottom();
  }

  // Hàm điều khiển luồng Wizard qua 4 bước liên tiếp
  function handleWizardChoice(value, label, event) {
    // Lấy step của nút bấm vừa click
    const clickedStep = parseInt(event.target.getAttribute('data-step'));
    
    // GUARD 1: Nếu bấm vào nút bấm cũ (clickedStep khác với step hiện hành của máy trạng thái) thì bỏ qua
    if (clickedStep !== currentFlow.wizardStep) return;

    // GUARD 2: Disable toàn bộ nút con trong cụm nút vừa click để chống bấm lại
    const container = event.target.closest('.ai-wizard-choices');
    if (container) {
      container.querySelectorAll('button').forEach(btn => {
        btn.disabled = true;
        if (btn.innerText === label) {
          btn.style.background = 'var(--ai-gradient)';
          btn.style.borderColor = 'transparent';
        }
      });
    }

    // 2. Hiện tin nhắn đã chọn của người dùng vào chat log
    appendMessage(label, 'user');
    scrollToBottom();

    const option = currentFlow.option;
    const step = currentFlow.wizardStep;

    // Lưu dữ liệu theo từng bước tương ứng
    if (step === 1) {
      currentFlow.wizardData.brandOrTypeOrOs = value; // Bước 1
      currentFlow.wizardStep = 2;

      // Chuyển sang Bước 2
      setTimeout(() => {
        if (option === 'laptop') {
          appendSystemMessage("Bước 2/4: Nhu cầu sử dụng chủ yếu của bạn là gì?");
          appendWizardChoices([
            { value: "office", label: "💻 Học tập / Văn phòng" },
            { value: "graphics", label: "🎨 Thiết kế đồ họa / Làm phim" },
            { value: "gaming", label: "🔥 Gaming giải trí" },
            { value: "coding", label: "💼 Lập trình / Kỹ thuật" }
          ], 2);
        } else if (option === 'pc') {
          appendSystemMessage("Bước 2/4: Mục tiêu sử dụng PC chính của bạn?");
          appendWizardChoices([
            { value: "esports", label: "🔫 Game Esport nhẹ (Valorant/CS2)" },
            { value: "aaa", label: "🚀 Game AAA đồ họa nặng" },
            { value: "work-play", label: "🏢 Làm việc kết hợp giải trí" }
          ], 2);
        } else if (option === 'phone') {
          appendSystemMessage("Bước 2/4: Tiêu chí tính năng bạn ưu tiên hàng đầu?");
          appendWizardChoices([
            { value: "camera", label: "📸 Quay phim / Chụp ảnh đẹp" },
            { value: "gaming", label: "⚡ Cấu hình cao chơi game mượt" },
            { value: "battery", label: "🔋 Pin trâu / Sạc siêu nhanh" },
            { value: "durable", label: "💸 Giá hợp lý / Dùng bền lâu" }
          ], 2);
        }
        scrollToBottom();
      }, 500);

    } else if (step === 2) {
      currentFlow.wizardData.usageOrPriority = value; // Bước 2
      currentFlow.wizardStep = 3;

      // Chuyển sang Bước 3
      setTimeout(() => {
        if (option === 'laptop') {
          appendSystemMessage("Bước 3/4: Mức ngân sách dự kiến của bạn là bao nhiêu?");
          appendWizardChoices([
            { value: "under-15", label: "💵 Dưới 15 Triệu" },
            { value: "15-25", label: "💳 Từ 15 - 25 Triệu" },
            { value: "above-25", label: "💎 Trên 25 Triệu" }
          ], 3);
        } else if (option === 'pc') {
          appendSystemMessage("Bước 3/4: Ưu tiên nào khác cho cấu hình linh kiện?");
          appendWizardChoices([
            { value: "gpu", label: "🎮 Đồ họa mạnh (Card màn hình rời)" },
            { value: "cpu", label: "⚡ Xử lý đa nhân mạnh (CPU)" },
            { value: "led", label: "💡 Thẩm mỹ (Đèn LED RGB lấp lánh)" },
            { value: "balance", label: "⚖️ Cân bằng / Tối ưu hiệu năng" }
          ], 3);
        } else if (option === 'phone') {
          appendSystemMessage("Bước 3/4: Bạn ưu tiên kích thước màn hình như thế nào?");
          appendWizardChoices([
            { value: "large", label: "📱 Màn hình lớn (>6.5 inch)" },
            { value: "compact", label: "🤏 Nhỏ gọn, dễ bỏ túi" }
          ], 3);
        }
        scrollToBottom();
      }, 500);

    } else if (step === 3) {
      currentFlow.wizardData.budgetOrSpecOrSize = value; // Bước 3
      currentFlow.wizardStep = 4;

      // Chuyển sang Bước 4 (Bước cuối cùng)
      setTimeout(() => {
        if (option === 'laptop') {
          appendSystemMessage("Bước 4/4: Bạn có ưu tiên đặc biệt nào khác không?");
          appendWizardChoices([
            { value: "lightweight", label: "⚖️ Siêu nhẹ (Dưới 1.4 kg)" },
            { value: "battery", label: "🔋 Thời lượng pin siêu trâu" },
            { value: "large-screen", label: "🖥️ Màn hình rộng (15.6 inch+)" },
            { value: "none", label: "❌ Không cần ưu tiên thêm" }
          ], 4);
        } else if (option === 'pc') {
          appendSystemMessage("Bước 4/4: Mức ngân sách tối đa bạn đầu tư cho PC là bao nhiêu?");
          appendWizardChoices([
            { value: "under-15", label: "💵 Dưới 15 Triệu" },
            { value: "15-30", label: "💳 Từ 15 - 30 Triệu" },
            { value: "above-30", label: "💎 Trên 30 Triệu" }
          ], 4);
        } else if (option === 'phone') {
          appendSystemMessage("Bước 4/4: Phân khúc ngân sách bạn dự kiến cho Điện thoại?");
          appendWizardChoices([
            { value: "under-7", label: "💵 Dưới 7 Triệu (Giá rẻ)" },
            { value: "7-15", label: "💳 Từ 7 - 15 Triệu (Tầm trung)" },
            { value: "above-15", label: "💎 Trên 15 Triệu (Flagship)" }
          ], 4);
        }
        scrollToBottom();
      }, 500);

    } else if (step === 4) {
      currentFlow.wizardData.extraOrBudget = value; // Bước 4
      currentFlow.wizardStep = 5; // Hoàn thành tất cả các bước

      // Đóng gói payload gửi lên Backend
      const finalPayload = {
        type: currentFlow.type, // PRODUCT_SEARCH
        content: `Tư vấn mua sắm ${option} dựa trên lựa chọn khảo sát 4 bước`,
        metadata: {
          category: option,
          criteria: currentFlow.wizardData
        }
      };

      // Gửi API fetch lên Backend
      sendPayloadToBackend(finalPayload);
    }
  }

  // Chèn bộ nút lựa chọn khảo sát phụ, gán thêm thuộc tính data-step bảo vệ
  function appendWizardChoices(choices, step) {
    const choicesDiv = document.createElement('div');
    choicesDiv.className = 'ai-wizard-choices';

    choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ai-choice-btn';
      btn.innerText = choice.label;
      btn.setAttribute('data-step', step); // Gán step bảo vệ
      btn.addEventListener('click', (e) => {
        handleWizardChoice(choice.value, choice.label, e);
      });
      choicesDiv.appendChild(btn);
    });

    aiChatMessages.insertBefore(choicesDiv, aiChatTyping);
  }

  // Ghi tin nhắn hệ thống
  function appendSystemMessage(text) {
    appendMessage(text, 'bot');
  }

  // Tự động co giãn khung soạn thảo tin nhắn
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

  // Xử lý gửi tin nhắn từ bàn phím người dùng
  aiChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = aiChatInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    aiChatInput.value = '';
    aiChatInput.style.height = '36px';
    aiChatSend.setAttribute('disabled', 'true');
    scrollToBottom();

    // Đóng gói payload gửi lên Backend
    const payload = {
      type: currentFlow.type, // PRODUCT_SEARCH | PRODUCT_COMPARE | STORE_POLICY | GENERAL_KNOWLEDGE
      content: text,
      metadata: {
        category: currentFlow.option
      }
    };

    // Gửi API fetch lên Backend
    sendPayloadToBackend(payload);
  });

  // Hàm gọi API fetch thực tế gửi dữ liệu lên Backend
  async function sendPayloadToBackend(payload) {
    aiChatTyping.removeAttribute('hidden');
    scrollToBottom();

    console.log(">>> [API CALL] Gửi dữ liệu lên Backend:", payload);

    try {
      // Trích xuất CSRF Token từ thẻ Meta để vượt qua bảo mật máy chủ
      const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');
      const csrfToken = csrfTokenMeta ? csrfTokenMeta.getAttribute('content') : '';

      const response = await fetch('/ai/chat-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP status ${response.status}`);
      }

      const data = await response.json();
      aiChatTyping.setAttribute('hidden', '');

      if (data.success && data.reply) {
        appendSystemMessage(data.reply);
      } else {
        // Fallback chạy giả lập khi BE chưa trả về cấu trúc chuẩn hoặc phản hồi lỗi
        showMockResponseFallback(payload);
      }
    } catch (error) {
      console.warn("Lỗi kết nối hoặc route BE chưa khả dụng. Chuyển sang chế độ mô phỏng:", error);
      // Graceful Fallback: Chạy mô phỏng cục bộ để đảm bảo giao diện luôn phản hồi mượt mà
      showMockResponseFallback(payload);
    }
    scrollToBottom();
  }

  // Chèn cấu trúc tin nhắn
  function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-chat-message ${sender === 'user' ? 'ai-msg-user' : 'ai-msg-system'}`;

    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const iconClass = sender === 'user' ? 'fa-regular fa-user' : 'fa-solid fa-robot';

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

  // Hàm mô phỏng phản hồi (Fallback local simulation)
  function showMockResponseFallback(payload) {
    const option = payload.metadata ? payload.metadata.category : 'default';
    const userText = payload.content || '';

    let reply = botReplies[option] || botReplies.default;

    // Phân tích văn bản khi người dùng gõ tay
    if (userText !== '' && option === 'default') {
      const cleanText = userText.toLowerCase();
      if (cleanText.includes('laptop') || cleanText.includes('máy tính xách tay')) {
        reply = botReplies.laptop;
      } else if (cleanText.includes('pc') || cleanText.includes('gaming') || cleanText.includes('máy bàn')) {
        reply = botReplies.pc;
      } else if (cleanText.includes('điện thoại') || cleanText.includes('phone') || cleanText.includes('mobile')) {
        reply = botReplies.phone;
      } else if (cleanText.includes('so sánh') || cleanText.includes('vs') || cleanText.includes('hơn')) {
        reply = botReplies.compare;
      } else if (cleanText.includes('đơn hàng') || cleanText.includes('mua') || cleanText.includes('ship')) {
        reply = botReplies.order;
      } else if (cleanText.includes('bảo hành') || cleanText.includes('lỗi') || cleanText.includes('hỏng')) {
        reply = botReplies.warranty;
      }
    } else if (payload.type === 'PRODUCT_SEARCH' && payload.metadata && payload.metadata.criteria) {
      const criteria = payload.metadata.criteria;
      if (option === 'laptop') {
        if (criteria.usageOrPriority === 'gaming') {
          reply = "[MÔ PHỎNG] Dành cho nhu cầu **Gaming**: Gợi ý mẫu **Acer Nitro V** (nếu tầm 20tr) hoặc mẫu **ASUS ROG Strix G16** (nếu ngân sách thoải mái) để có trải nghiệm đồ họa tuyệt vời nhất.";
        } else if (criteria.usageOrPriority === 'graphics') {
          reply = "[MÔ PHỎNG] Dành cho nhu cầu **Đồ họa**: Bạn nên chọn **Macbook Pro M3** hoặc **Dell XPS 15** trang bị màn hình chuẩn màu 100% sRGB / DCI-P3.";
        } else {
          reply = `[MÔ PHỎNG] Với tiêu chí học tập/văn phòng và tầm giá ${criteria.budgetOrSpecOrSize === 'under-15' ? 'dưới 15 triệu' : 'từ 15-25 triệu'}, mẫu **HP Pavilion 14** hoặc **Dell Inspiron 14** là những lựa chọn vô cùng bền bỉ, mượt mà.`;
        }
      } else if (option === 'pc') {
        reply = `[MÔ PHỎNG] Hệ thống gợi ý cấu hình PC tối ưu cho game ${criteria.usageOrPriority === 'aaa' ? 'nặng AAA' : 'Esport'} trong tầm giá đầu tư của bạn. Bạn nên chọn cấu hình chip **Intel Core i5-14400F kết hợp Card đồ họa RTX 4060** để có hiệu năng chơi game tốt nhất trong tầm giá trung.`;
      } else if (option === 'phone') {
        reply = `[MÔ PHỎNG] Gợi ý mẫu điện thoại có tính năng ${criteria.usageOrPriority === 'camera' ? 'Chụp ảnh chuyên nghiệp' : 'Cấu hình mạnh mẽ'}: Bạn hãy tham khảo **Samsung Galaxy S24 Plus** hoặc **iPhone 15** để nhận được hỗ trợ phần mềm lâu dài cùng khả năng xử lý mượt mà nhất.`;
      }
    }

    const typingDelay = 1000 + Math.random() * 1000;

    setTimeout(() => {
      aiChatTyping.setAttribute('hidden', '');
      appendSystemMessage(reply);
      scrollToBottom();
      
      if (window.innerWidth > 560) {
        aiChatInput.focus();
      }
    }, typingDelay);
  }
});
