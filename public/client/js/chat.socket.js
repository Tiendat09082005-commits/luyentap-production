const socket = io();

// ===== NHẬN THÔNG BÁO MUA HÀNG REALTIME =====
socket.on("new_order", (data) => {
  const toast = document.createElement("div");
  toast.classList.add("purchase-toast");
  toast.innerHTML = `
    <img src="${data.productImage}" alt="${data.productTitle}">
    <div class="purchase-toast-content">
      <span class="purchase-toast-name">${data.customerName}</span>
      <p class="purchase-toast-text">Vừa đặt mua <strong>${data.productTitle}</strong></p>
      <span class="purchase-toast-time">Vừa xong</span>
    </div>
  `;

  document.body.appendChild(toast);

  // Tự động xóa sau 5 giây
  setTimeout(() => {
    toast.classList.add("purchase-toast-hidden");
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 5000);
});
