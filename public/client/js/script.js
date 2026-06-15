// thanh thông báo
const showAlert = document.querySelector("[show-alert]");
if (showAlert) {
  const time = parseInt(showAlert.getAttribute("data-time"));
  const closeAlert = showAlert.querySelector("[close-alert]");
  // console.log(closeAlert);
  setTimeout(() => {
    showAlert.classList.add("alert-hidden");
  }, time);
  closeAlert.addEventListener("click", () => {
    showAlert.classList.add("alert-hidden");
  });
}
// edn thanh thông báo

// upload image
const uploadImage = document.querySelector("[upload-image]");
if (uploadImage) {
  const uploadImageInput = uploadImage.querySelector("[upload-image-input]");
  const uploadImagePreview = uploadImage.querySelector(
    "[upload-image-preview]",
  );
  const uploadImageRemove = uploadImage.querySelector("[upload-image-remove]");
  if (uploadImagePreview.src && uploadImagePreview.src.length > 0) {
    uploadImagePreview.style.display = "block";
  }

  uploadImageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadImagePreview.src = URL.createObjectURL(file);
      uploadImagePreview.style.display = "block";
      uploadImageRemove.style.display = "block";
    } else {
      uploadImagePreview.src = "";
      uploadImagePreview.style.display = "none";
    }
  });
  uploadImageRemove.addEventListener("click", () => {
    // Xoá preview và reset input
    uploadImagePreview.src = "";
    uploadImagePreview.style.display = "none";
    uploadImageRemove.style.display = "none";
    uploadImageInput.value = ""; // reset input file
  });
}
// end upload image

// location in payment-info (Generic for any form with province/district/ward selects)
const provinceSelects = document.querySelectorAll("[button-province]");
const districtSelects = document.querySelectorAll("[button-district]");
const wardSelects = document.querySelectorAll("[button-ward]");

// ===== LOAD TỈNH =====
if (provinceSelects.length > 0) {
  fetch("https://provinces.open-api.vn/api/v1/?depth=1")
    .then((res) => res.json())
    .then((data) => {
      let html = `<option value="" disabled selected>Chọn tỉnh / thành phố</option>`;
      data.forEach((item) => {
        html += `<option value="${item.code}" data-name="${item.name}">${item.name}</option>`;
      });

      provinceSelects.forEach(select => {
        const currentValue = select.getAttribute('data-current');
        select.innerHTML = html;
        if (currentValue) {
          select.value = currentValue;
          // Trigger change to load districts if needed
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
}

// ===== LOAD HUYỆN & XÃ LOGIC =====
document.addEventListener("change", (e) => {
  const target = e.target;

  // Change Province -> Load Districts
  if (target.matches("[button-province]")) {
    const provinceCode = target.value;
    const form = target.closest("form");
    const districtSelect = form.querySelector("[button-district]");
    const wardSelect = form.querySelector("[button-ward]");

    if (districtSelect) districtSelect.innerHTML = `<option value="" disabled selected>Chọn quận/huyện</option>`;
    if (wardSelect) wardSelect.innerHTML = `<option value="" disabled selected>Chọn phường/xã</option>`;

    if (!provinceCode) return;

    fetch(`https://provinces.open-api.vn/api/v1/p/${provinceCode}?depth=2`)
      .then((res) => res.json())
      .then((data) => {
        let html = `<option value="" disabled selected>Chọn quận/huyện</option>`;
        data.districts.forEach((item) => {
          html += `<option value="${item.code}" data-name="${item.name}">${item.name}</option>`;
        });
        if(districtSelect) districtSelect.innerHTML = html;
      });
  }

  // Change District -> Load Wards
  if (target.matches("[button-district]")) {
    const districtCode = target.value;
    const form = target.closest("form");
    const wardSelect = form.querySelector("[button-ward]");

    if (wardSelect) wardSelect.innerHTML = `<option value="" disabled selected>Chọn phường/xã</option>`;

    if (!districtCode) return;

    fetch(`https://provinces.open-api.vn/api/v1/d/${districtCode}?depth=2`)
      .then((res) => res.json())
      .then((data) => {
        let html = `<option value="" disabled selected>Chọn phường/xã</option>`;
        data.wards.forEach((item) => {
          html += `<option value="${item.code}" data-name="${item.name}">${item.name}</option>`;
        });
        if(wardSelect) wardSelect.innerHTML = html;
      });
  }
});

// ===== LẤY NAME + CODE TRƯỚC KHI SUBMIT (Generic) =====
document.addEventListener("submit", (e) => {
  const form = e.target;
  const bProvince = form.querySelector("[button-province]");
  const bDistrict = form.querySelector("[button-district]");
  const bWard = form.querySelector("[button-ward]");

  if (bProvince && bDistrict && bWard) {
    const provinceOption = bProvince.options[bProvince.selectedIndex];
    const districtOption = bDistrict.options[bDistrict.selectedIndex];
    const wardOption = bWard.options[bWard.selectedIndex];

    const provinceName = provinceOption?.dataset.name || "";
    const districtName = districtOption?.dataset.name || "";
    const wardName = wardOption?.dataset.name || "";

    // Determine field name prefix
    const isCheckout = form.id === "checkoutForm";
    
    if (isCheckout) {
      addHiddenInputToForm(form, "userInfo[address][provinceName]", provinceName);
      addHiddenInputToForm(form, "userInfo[address][districtName]", districtName);
      addHiddenInputToForm(form, "userInfo[address][wardName]", wardName);
      addHiddenInputToForm(form, "userInfo[address][provinceCode]", bProvince.value);
      addHiddenInputToForm(form, "userInfo[address][districtCode]", bDistrict.value);
      addHiddenInputToForm(form, "userInfo[address][wardCode]", bWard.value);
    } else {
      // For profile edit
      addHiddenInputToForm(form, "provinceName", provinceName);
      addHiddenInputToForm(form, "districtName", districtName);
      addHiddenInputToForm(form, "wardName", wardName);
      addHiddenInputToForm(form, "provinceCode", bProvince.value);
      addHiddenInputToForm(form, "districtCode", bDistrict.value);
      addHiddenInputToForm(form, "wardCode", bWard.value);
    }
  }
});

function addHiddenInputToForm(form, name, value) {
  let input = form.querySelector(`input[name="${name}"]`);
  if (!input) {
    input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    form.appendChild(input);
  }
  input.value = value;
}
// end location in payment-info

// chọn sản phẩm yêu thích
const btnFavoriteProduct = document.querySelectorAll(".btnFavoriteProduct");
if (btnFavoriteProduct && btnFavoriteProduct.length > 0) {
  btnFavoriteProduct.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const product_id = btn.dataset.id;
      fetch(`/products/favorite/${product_id}`, {
        method: "PATCH",
        headers: window.withCsrfHeaders({
          "Content-Type": "application/json"
        })
      })
        .then(res => {
          if (res.status === 401) {
            Swal.fire({
              icon: 'question',
              title: 'Yêu cầu đăng nhập',
              text: 'Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích!',
              showCancelButton: true,
              confirmButtonText: 'Đăng nhập ngay',
              cancelButtonText: 'Để sau',
              confirmButtonColor: '#3B82F6',
              cancelButtonColor: '#FFFFFF'
            }).then((result) => {
              if (result.isConfirmed) {
                window.location.href = "/user/login";
              }
            });
            throw new Error("Unauthorized");
          }
          return res.json();
        })
        .then(data => {
          if (data && data.success) {
            if (data.type === "removed") {
              btn.classList.remove("active");
            } else {
              btn.classList.add("active");
            }
          }
        })
        .catch(err => {
          if (err.message !== "Unauthorized") {
            console.error("Lỗi khi cập nhật yêu thích:", err);
          }
        });
    });
  });
}

// Clickable product card
const productCards = document.querySelectorAll(".product-card[data-href]");
if (productCards.length > 0) {
  productCards.forEach(card => {
    card.addEventListener("click", (e) => {
      // Don't navigate if clicking on a link or button inside the card
      if (e.target.closest('a') || e.target.closest('button')) return;
      
      const href = card.getAttribute("data-href");
      if (href) {
        window.location.href = href;
      }
    });
  });
}

// Cập nhật số lượng giỏ hàng khi quay lại trang (xử lý bfcache)
window.addEventListener("pageshow", function(event) {
  // event.persisted là true nếu trang được load từ bộ nhớ đệm (Back-Forward Cache)
  if (event.persisted) {
    const cartBadgeEl = document.querySelector(".cart-badge");
    if (cartBadgeEl) {
      fetch("/cart/count")
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            cartBadgeEl.textContent = data.count;
          }
        })
        .catch(err => console.error("Error fetching cart count:", err));
    }
  }
});

// ===== GIỎ HÀNG: CHỌN SẢN PHẨM & TÍNH TỔNG =====
const cartFormCheckout = document.querySelector("#cartFormCheckout");
if (cartFormCheckout) {
  const selectAllBtn = cartFormCheckout.querySelector("#selectAll");
  const itemCheckboxes = cartFormCheckout.querySelectorAll(".item-checkbox");
  const checkoutBtn = cartFormCheckout.querySelector(".btn-checkout");
  const subtotalEl = document.querySelector("#subtotal");
  const finalTotalEl = document.querySelector("#finalTotal");

  function updateCartTotals() {
    let total = 0;
    let countChecked = 0;

    itemCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        const cartItem = checkbox.closest(".cart-item");
        const itemTotal = parseInt(cartItem.querySelector(".price-total").dataset.itemTotal) || 0;
        total += itemTotal;
        countChecked++;
      }
    });

    if (subtotalEl) subtotalEl.textContent = total.toLocaleString('vi-VN') + " ₫";
    if (finalTotalEl) finalTotalEl.textContent = total.toLocaleString('vi-VN') + " ₫";

    // Bật/tắt nút thanh toán
    if (checkoutBtn) {
      checkoutBtn.disabled = (countChecked === 0);
    }
    
    // Cập nhật trạng thái nút "Chọn tất cả"
    if (selectAllBtn) {
      selectAllBtn.checked = (countChecked === itemCheckboxes.length && itemCheckboxes.length > 0);
    }
  }

  if (selectAllBtn) {
    selectAllBtn.addEventListener("change", () => {
      itemCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllBtn.checked;
      });
      updateCartTotals();
    });
  }

  itemCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", updateCartTotals);
  });

  // Mặc định chọn tất cả khi mới vào trang
  if (selectAllBtn && itemCheckboxes.length > 0) {
    selectAllBtn.checked = true;
    itemCheckboxes.forEach(cb => cb.checked = true);
    updateCartTotals();
  }
}

// ===== LỌC / SẮP XẾP SẢN PHẨM =====
const sortButtons = document.querySelectorAll(".sort-options button");
if (sortButtons.length > 0) {
  sortButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const url = new URL(window.location.href);
      
      if (btn.hasAttribute("sort-clear")) {
        url.searchParams.delete("sortKey");
        url.searchParams.delete("sortValue");
      } else {
        const sortKey = btn.getAttribute("sort-key");
        const sortValue = btn.getAttribute("sort-value");
        if (sortKey && sortValue) {
          url.searchParams.set("sortKey", sortKey);
          url.searchParams.set("sortValue", sortValue);
        }
      }

      // Reset trang về 1 khi sort
      url.searchParams.delete("page");
      
      window.location.href = url.href;
    });
  });
}
