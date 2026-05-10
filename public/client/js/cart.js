// public/client/js/cart.js

document.addEventListener("DOMContentLoaded", () => {
    const qtyButtons = document.querySelectorAll(".qty-btn");
    const cartItemsList = document.querySelector(".cart-items-list");
    const selectAllCheckbox = document.getElementById("selectAll");
    const itemCheckboxes = document.querySelectorAll(".item-checkbox");
    const subtotalEl = document.getElementById("subtotal");
    const finalTotalEl = document.getElementById("finalTotal");
    const btnCheckout = document.querySelector(".btn-checkout");
    const cartForm = document.getElementById("cartFormCheckout");

    // CSRF Token
    const csrfToken = document.querySelector('input[name="_csrf"]')?.value;

    const updateTotals = () => {
        let subtotal = 0;
        const checkedItems = document.querySelectorAll(".item-checkbox:checked");
        
        checkedItems.forEach(checkbox => {
            const cartItem = checkbox.closest(".cart-item");
            if (cartItem) {
                const itemTotal = parseFloat(cartItem.getAttribute("data-item-total")) || 0;
                subtotal += itemTotal;
            }
        });

        if (subtotalEl) subtotalEl.textContent = subtotal.toLocaleString('vi-VN') + " ₫";
        if (finalTotalEl) finalTotalEl.textContent = subtotal.toLocaleString('vi-VN') + " ₫";
        
        // Update checkout button state
        if (btnCheckout) {
            btnCheckout.disabled = checkedItems.length === 0;
        }
    };

    // Initial calculation
    updateTotals();

    // Handle quantity update
    if (cartItemsList) {
        cartItemsList.addEventListener("click", async (e) => {
            const removeBtn = e.target.closest(".cart-item-remove");
            if (removeBtn) {
                const productId = removeBtn.getAttribute("data-product-id");
                const variantId = removeBtn.getAttribute("data-variant-id");

                removeBtn.style.opacity = "0.5";
                removeBtn.disabled = true;

                try {
                    const url = `/cart/delete/${productId}${variantId ? "/" + variantId : ""}`;
                    const response = await fetch(url, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRF-Token": csrfToken
                        }
                    });

                    if (response.ok) {
                        window.location.reload();
                        return;
                    }

                    alert("Xóa sản phẩm thất bại");
                } catch (error) {
                    console.error("Delete cart item error:", error);
                    alert("Lỗi hệ thống");
                } finally {
                    removeBtn.style.opacity = "1";
                    removeBtn.disabled = false;
                }
                return;
            }

            const btn = e.target.closest(".qty-btn");
            if (!btn) return;

            const cartItem = btn.closest(".cart-item");
            const productId = btn.getAttribute("data-product-id");
            const variantId = btn.getAttribute("data-variant-id");
            const qtyValueEl = cartItem.querySelector(".qty-value");
            const priceTotalEl = cartItem.querySelector(".price-total");

            let currentQty = parseInt(qtyValueEl.textContent);
            let newQty = btn.classList.contains("qty-plus") ? currentQty + 1 : currentQty - 1;

            if (newQty < 1) return;

            // Show loading state (optional)
            btn.style.opacity = "0.5";
            btn.disabled = true;

            try {
                const url = `/cart/update/${productId}/${newQty}${variantId ? "/" + variantId : ""}`;
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": csrfToken
                    }
                });

                const data = await response.json();

                if (data.success) {
                    qtyValueEl.textContent = data.newQty;
                    priceTotalEl.textContent = data.itemTotalPrice.toLocaleString('vi-VN') + " ₫";
                    cartItem.setAttribute("data-item-total", data.itemTotalPrice);
                    updateTotals();
                } else {
                    alert(data.message || "Cập nhật thất bại");
                }
            } catch (error) {
                console.error("Update qty error:", error);
                alert("Lỗi hệ thống");
            } finally {
                btn.style.opacity = "1";
                btn.disabled = false;
            }
        });
    }

    // Handle checkboxes
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener("change", (e) => {
            const isChecked = e.target.checked;
            itemCheckboxes.forEach(cb => {
                cb.checked = isChecked;
            });
            updateTotals();
        });
    }

    itemCheckboxes.forEach(cb => {
        cb.onchange = updateTotals;
    });
});
