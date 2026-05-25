// ---- Gallery ----
var allThumbs = [];
var currentImgIdx = 0;

function selectThumb(el) {
  if (allThumbs.length === 0) {
    allThumbs = Array.from(document.querySelectorAll('.thumbnail-item'));
  }
  allThumbs.forEach(function(t) { t.classList.remove('active'); });
  el.classList.add('active');
  currentImgIdx = parseInt(el.dataset.idx) || 0;
  document.getElementById('mainImg').src = el.dataset.src;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

function mainImgNav(dir) {
  if (allThumbs.length === 0) {
    allThumbs = Array.from(document.querySelectorAll('.thumbnail-item'));
  }
  if (!allThumbs.length) return;
  currentImgIdx = (currentImgIdx + dir + allThumbs.length) % allThumbs.length;
  selectThumb(allThumbs[currentImgIdx]);
}

function scrollThumbs(dir) {
  var track = document.getElementById('thumbTrack');
  if (track) track.scrollBy({ left: dir * 160, behavior: 'smooth' });
}

(function() {
  document.addEventListener("DOMContentLoaded", function() {
    var track = document.getElementById('thumbTrack');
    if (!track) return;
    function updateNavBtns() {
      var prev = document.getElementById('thumbPrev');
      var next = document.getElementById('thumbNext');
      if (prev) prev.style.opacity = track.scrollLeft > 4 ? '1' : '0.35';
      if (next) next.style.opacity = (track.scrollLeft + track.clientWidth < track.scrollWidth - 4) ? '1' : '0.35';
    }
    track.addEventListener('scroll', updateNavBtns);
    updateNavBtns();
    
    // Initialize allThumbs
    allThumbs = Array.from(document.querySelectorAll('.thumbnail-item'));

    // Initialize variants if applicable
    document.querySelectorAll('.attr-group').forEach(function(g) {
        var f = g.querySelector('.attr-btn'); if (f) f.click();
    });
  });
})();

// ---- Quantity ----
function changeQty(delta) {
  var inp = document.getElementById('quantity');
  var val = parseInt(inp.value) + delta;
  var min = parseInt(inp.min) || 1;
  var max = parseInt(inp.max) || 9999;
  if (val < min) val = min;
  if (val > max) val = max;
  inp.value = val;
  var hiddenQty = document.getElementById('hiddenQty');
  if (hiddenQty) hiddenQty.value = val;
}

// ---- Variants ----
var selectedVariants = {};

function selectVariant(btn, attrCode, val) {
  btn.closest('.attr-group').querySelectorAll('.attr-btn').forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
  var lbl = document.getElementById(attrCode + '-selected');
  if (lbl) lbl.textContent = val;
  selectedVariants[attrCode] = val;
  matchVariant();
  if (btn.classList.contains('affects-image')) updateImageByVariant();
}

function matchVariant() {
  var variantsData = window.__VARIANTS_DATA__ || [];
  if (!variantsData.length) return;
  var matched = variantsData.find(function(v) {
    return Object.keys(selectedVariants).every(function(k) { return v.attributes[k] === selectedVariants[k]; });
  });
  if (matched) {
    var hiddenVariantId = document.getElementById('hiddenVariantId');
    if (hiddenVariantId) hiddenVariantId.value = matched._id;
    updatePriceDisplay(matched.price, matched.discount);

    // Update Stock UI
    var stockStatus = document.getElementById('stockStatus');
    var qtyInput = document.getElementById('quantity');
    var stock = matched.stock || 0;

    if (stockStatus && qtyInput) {
      if (stock > 0) {
        stockStatus.className = 'in-stock';
        stockStatus.textContent = '✓ Còn ' + stock + ' sản phẩm';
        qtyInput.max = stock;

        // Ensure quantity is at least 1 when in stock
        var currentVal = parseInt(qtyInput.value) || 0;
        if (currentVal <= 0) {
          qtyInput.value = 1;
          var hiddenQty = document.getElementById('hiddenQty');
          if (hiddenQty) hiddenQty.value = 1;
        } else if (currentVal > stock) {
          qtyInput.value = stock;
          var hiddenQty = document.getElementById('hiddenQty');
          if (hiddenQty) hiddenQty.value = stock;
        }
      } else {
        stockStatus.className = 'out-of-stock';
        stockStatus.textContent = '✗ Hết hàng';
        qtyInput.max = 0;
        qtyInput.value = 0;
        var hiddenQty = document.getElementById('hiddenQty');
        if (hiddenQty) hiddenQty.value = 0;
      }
    }
  }
}

function updatePriceDisplay(price, discount) {
  var pEl = document.getElementById('currentPrice');
  var oEl = document.getElementById('originalPrice');
  var bEl = document.querySelector('.discount-badge');
  if (!pEl) return;
  
  if (discount && discount > 0) {
    pEl.textContent = Math.round(price * (1 - discount / 100)).toLocaleString('vi-VN') + '₫';
    if (oEl) { oEl.textContent = price.toLocaleString('vi-VN') + '₫'; oEl.style.display = ''; }
    if (bEl) { bEl.textContent = '-' + discount + '%'; bEl.style.display = ''; }
  } else {
    pEl.textContent = price.toLocaleString('vi-VN') + '₫';
    if (oEl) oEl.style.display = 'none';
    if (bEl) bEl.style.display = 'none';
  }
}

function updateImageByVariant() {
  var variantsData = window.__VARIANTS_DATA__ || [];
  var matched = variantsData.find(function(v) {
    return Object.keys(selectedVariants).every(function(k) { return v.attributes[k] === selectedVariants[k]; });
  });
  if (matched && matched.thumbnail) {
    var mainImg = document.getElementById('mainImg');
    if (mainImg) mainImg.src = matched.thumbnail;
    // Find and highlight matching thumbnail
    var thumb = allThumbs.find(function(t) { return t.dataset.src === matched.thumbnail; });
    if (thumb) selectThumb(thumb);
  }

  // Sync sticky bar
  if (typeof syncStickyBar === 'function') syncStickyBar(matched);
}

// ---- Tabs ----
function switchTab(btn, tabId) {
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  document.querySelectorAll('.tab-pane').forEach(function(p) { p.classList.remove('active'); });
  btn.classList.add('active');
  var pane = document.getElementById(tabId);
  if (pane) pane.classList.add('active');
}


/* duplicate legacy block removed
async function handleCartAction(isBuyNow = false) {
  const cartForm = document.getElementById('addCartForm');
  if (!cartForm) return;

  const formData = new FormData(cartForm);
  const data = {};
  formData.forEach((value, key) => data[key] = value);

  try {
    const response = await fetch(cartForm.action, {
      method: 'POST',
      headers: window.withCsrfHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }),
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (result.code === 200) {
      if (isBuyNow) {
        window.location.href = '/cart';
      } else {
        showToast("Thành công", result.message, "success");
        // Update cart count in header if element exists
        const cartBadgeEl = document.querySelector('.cart-badge');
        if (cartBadgeEl && result.cartCount !== undefined) {
          cartBadgeEl.textContent = result.cartCount;
        }
      }
    } else {
      showToast("Thất bại", result.message || "Có lỗi xảy ra", "error");
    }
  } catch (error) {
    console.error("Cart error:", error);
  }
}
*/

document.addEventListener("DOMContentLoaded", function() {
  const cartForm = document.getElementById('addCartForm');
  if (cartForm) {
    cartForm.addEventListener('submit', function(e) {
      e.preventDefault();
      handleCartAction(false);
    });
  }

  const buyBtn = document.querySelector('.btn-buy-now');
  if (buyBtn) {
    buyBtn.addEventListener('click', function() {
      handleCartAction(true);
    });
  }
});

async function toggleWishlist(btn) {
  if (btn.dataset.loggedIn !== "true") {
    Swal.fire({
      icon: 'question',
      title: 'Yêu cầu đăng nhập',
      text: 'Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích!',
      showCancelButton: true,
      confirmButtonText: 'Đăng nhập ngay',
      cancelButtonText: 'Để sau',
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#FFFFFF'
    }).then(function (result) {
      if (result.isConfirmed) {
        window.location.href = "/user/login";
      }
    });
    return;
  }

  const productId = btn.dataset.id;
  try {
    const response = await fetch(`/products/favorite/${productId}`, {
      method: "PATCH",
      headers: window.withCsrfHeaders({ "Content-Type": "application/json" })
    });

    const result = await response.json();
    if (result.success) {
      btn.classList.toggle('active');
      const icon = btn.querySelector('svg');
      if (btn.classList.contains('active')) {
        icon.setAttribute('fill', 'var(--red)');
        icon.setAttribute('stroke', 'var(--red)');
      } else {
        icon.setAttribute('fill', 'none');
        icon.setAttribute('stroke', 'currentColor');
      }
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật yêu thích:", error);
  }
}

function toggleSpecs(btn) {
  var tabSpec = document.getElementById('tab-spec');
  var isActive = tabSpec ? tabSpec.classList.contains('active') : false;
  var tabBtns = document.querySelectorAll('.tab-btn');

  if (isActive) {
    // Collapse: switch back to first tab (Description)
    switchTab(tabBtns[0], 'tab-desc');
    btn.innerHTML = 'Xem đầy đủ thông số <span class="icon">⌄</span>';
    // Scroll back up to the specs summary section
    var summarySection = document.querySelector('.specs-summary-section');
    if (summarySection) {
      window.scrollTo({ top: summarySection.offsetTop - 100, behavior: 'smooth' });
    }
  } else {
    // Expand: switch to spec tab
    switchTab(tabBtns[1], 'tab-spec');
    btn.innerHTML = 'Thu gọn thông số <span class="icon">⌃</span>';
    if (tabSpec) tabSpec.scrollIntoView({ behavior: 'smooth' });
  }
}

// ---- Sticky Bar Toggle ----
window.addEventListener('scroll', function() {
  var stickyBar = document.getElementById('stickyBar');
  var triggerElement = document.querySelector('.product-detail-wrapper');
  if (!triggerElement || !stickyBar) return;
  var triggerPoint = triggerElement.offsetTop + 400; // Show after 400px of top section
  if (window.scrollY > triggerPoint) {
    stickyBar.classList.add('show');
  } else {
    stickyBar.classList.remove('show');
  }
});

// Sync Sticky Bar on Variant Match
function syncStickyBar(matched) {
  if (!matched) return;
  var sImg = document.getElementById('stickyImg');
  var sTitle = document.getElementById('stickyTitle');
  var sPriceNew = document.getElementById('stickyPriceNew');
  var sPriceOld = document.getElementById('stickyPriceOld');

  if (sImg && matched.thumbnail) sImg.src = matched.thumbnail;
  var productTitleEl = document.getElementById('productTitle');
  if (sTitle) sTitle.textContent = matched.title || (productTitleEl ? productTitleEl.textContent : '');

  var pNew = (matched.price * (100 - (matched.discount || 0)) / 100);
  if (sPriceNew) sPriceNew.textContent = pNew.toLocaleString('vi-VN') + '₫';
  if (sPriceOld) {
    if (matched.discount > 0) {
      sPriceOld.style.display = 'inline';
      sPriceOld.textContent = matched.price.toLocaleString('vi-VN') + '₫';
    } else {
      sPriceOld.style.display = 'none';
    }
  }
}

// Override cart feedback to anchor notification near the clicked button.
function removeAnchoredAlert() {
  var currentAlert = document.querySelector('.anchored-alert');
  if (!currentAlert) return;

  currentAlert.classList.remove('show');
  setTimeout(function() {
    if (currentAlert.parentNode) {
      currentAlert.remove();
    }
  }, 220);
}

function showToast(anchorEl, msg, type) {
  if (!anchorEl) return;

  removeAnchoredAlert();

  var alertEl = document.createElement('div');
  var icon = type === 'error' ? 'fa-circle-exclamation' : 'fa-check';

  alertEl.className = 'anchored-alert ' + (type || 'success');
  alertEl.innerHTML = `
    <span class="anchored-alert__icon"><i class="fa-solid ${icon}"></i></span>
    <span class="anchored-alert__text">${msg}</span>
  `;

  document.body.appendChild(alertEl);

  var rect = anchorEl.getBoundingClientRect();
  var alertWidth = 280;
  var top = window.scrollY + rect.top - 56;
  var left = window.scrollX + rect.left + (rect.width / 2) - (alertWidth / 2);
  var minLeft = window.scrollX + 12;
  var maxLeft = window.scrollX + window.innerWidth - alertWidth - 12;

  alertEl.style.width = alertWidth + 'px';
  alertEl.style.top = Math.max(window.scrollY + 12, top) + 'px';
  alertEl.style.left = Math.max(minLeft, Math.min(left, maxLeft)) + 'px';

  requestAnimationFrame(function() {
    alertEl.classList.add('show');
  });

  setTimeout(removeAnchoredAlert, 2200);
}

async function handleCartAction(isBuyNow = false, triggerButton = null) {
  var cartForm = document.getElementById('addCartForm');
  if (!cartForm) return;

  var activeTrigger =
    triggerButton ||
    document.activeElement ||
    cartForm.querySelector('.btn-add-cart');

  var formData = new FormData(cartForm);
  var data = {};
  formData.forEach(function(value, key) {
    data[key] = value;
  });

  try {
    var response = await fetch(cartForm.action, {
      method: 'POST',
      headers: window.withCsrfHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }),
      body: JSON.stringify(data)
    });

    var result = await response.json();
    if (result.success) {
      if (isBuyNow) {
        window.location.href = '/cart';
        return;
      }

      showToast(activeTrigger, result.message, 'success');

      var cartBadgeEl = document.querySelector('.cart-badge');
      if (cartBadgeEl && result.cartCount !== undefined) {
        cartBadgeEl.textContent = result.cartCount;
      }

      return;
    }

    showToast(activeTrigger, result.message || 'Co loi xay ra', 'error');
  } catch (error) {
    console.error('Cart error:', error);
    showToast(activeTrigger, 'Co loi xay ra khi them vao gio', 'error');
  }
}
