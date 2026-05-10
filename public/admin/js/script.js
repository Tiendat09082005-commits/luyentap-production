// console.log("JS LOADED");
// lấy ra sản phẩm theo trạng thái hoạt động
const buttonStatus = document.querySelectorAll("[button-status]");
// console.log(buttonStatus);
if (buttonStatus.length > 0) {
  let url = new URL(window.location.href);
  buttonStatus.forEach((button) => {
    button.addEventListener("click", () => {
      const status = button.getAttribute("button-status");
      // console.log(status);
      if (status) {
        url.searchParams.set("status", status);
      } else {
        url.searchParams.delete("status");
      }
      // console.log(url);
      window.location.href = url.href;
    });
  });
}
// end lấy ra sản phẩm theo trạng thái hoạt động

// phân trnag (pagination)
const buttonsPagination = document.querySelectorAll("[button-pagination]");
// console.log(buttonsPagination);
if (buttonsPagination.length > 0) {
  const url = new URL(window.location.href);
  buttonsPagination.forEach((button) => {
    button.addEventListener("click", () => {
      const page = button.getAttribute("button-pagination");
      console.log(page);
      url.searchParams.set("page", page);
      window.location.href = url.href;
    });
  });
}
// end phân trang (pagination)

// form search
const formSearch = document.querySelector("#form-search");
if (formSearch) {
  const searchInput = formSearch.querySelector(".form-control");
  formSearch.addEventListener("submit", (e) => {
    e.preventDefault();
    let url = new URL(window.location.href);
    const keyword = formSearch.elements.keyword.value;
    if (keyword) {
      url.searchParams.set("keyword", keyword);
    } else {
      url.searchParams.delete("keyword");
    }
    window.location.href = url.href;
  });
}
// end form search

//checkbox
const formChangeMulti = document.querySelector("[form-change-multi]");
const checkboxMulti = document.querySelector("[checkbox-multi]");
const checkAll = document.querySelector("#checkall");

/* ===== SUBMIT FORM ===== */
if (formChangeMulti && checkboxMulti) {
  formChangeMulti.addEventListener("submit", (e) => {
    e.preventDefault();

    const inputChecked = checkboxMulti.querySelectorAll(
      "input[name='checkbox']:checked",
    );
    const inputForm = formChangeMulti.querySelector("input[name='ids']");
    const typeChange = e.target.elements.type.value;

    if (typeChange === "delete-all") {
      if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này không")) return;
    }

    if (inputChecked.length > 0) {
      const ids = [];

      inputChecked.forEach((input) => {
        const id = input.value;

        if (typeChange === "change-position") {
          const position = input
            .closest("tr")
            .querySelector("input[name='position']").value;
          ids.push(`${id}-${position}`);
        } else {
          ids.push(id);
        }
      });

      inputForm.value = ids.join(", ");
      formChangeMulti.submit();
    }
  });
}

/* ===== CHECK ALL ===== */
if (checkAll && checkboxMulti) {
  const checkboxes = checkboxMulti.querySelectorAll("input[name='checkbox']");

  checkAll.addEventListener("change", () => {
    checkboxes.forEach((cb) => (cb.checked = checkAll.checked));
  });

  checkboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      const checkedCount = checkboxMulti.querySelectorAll(
        "input[name='checkbox']:checked",
      ).length;

      checkAll.checked = checkedCount === checkboxes.length;
    });
  });
}

// end checkbox
// checkbox
// const formChangeMulti = document.querySelector("[form-change-multi]");
// if (formChangeMulti) {
//   formChangeMulti.addEventListener("submit", (e) => {
//     e.preventDefault();
//     const checkboxMulti = document.querySelector("[checkbox-multi]");
//     const inputChecked = checkboxMulti.querySelectorAll(
//       "input[name='checkbox']:checked",
//     );
//     const inputForm = formChangeMulti.querySelector("input[name='ids']");
//     const typeChange = e.target.elements.type.value;
//     if (typeChange == "delete-all") {
//       const isConfirm = confirm("Bạn có chắc chắn muốn xóa sản phẩm này không");
//       if (!isConfirm) {
//         return;
//       }
//     }
//     if (inputChecked.length > 0) {
//       const ids = [];
//       inputChecked.forEach((input) => {
//         const id = input.value;
//         if (typeChange == "change-position") {
//           const position = input
//             .closest("tr")
//             .querySelector("input[name='position']").value;
//           ids.push(`${id}-${position}`);
//         } else {
//           ids.push(id);
//         }
//       });
//       inputForm.value = ids.join(", ");
//       formChangeMulti.submit();
//     }
//   });
// }
// end checkbox

// thanh thông báo
const showAlert = document.querySelector("[show-alert]");
if (showAlert) {
  const time = parseInt(showAlert.getAttribute("data-time"));
  const closeAlert = showAlert.querySelector("[close-alert]");
  console.log(closeAlert);
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

// thay đổi trạng thái đơn hàng
const dropdownList = document.querySelectorAll(".status-dropdown-item");

const statusClassMap = {
  "chờ xác nhận": "pending",
  "đã xác nhận": "confirmed",
  "đang giao": "shipping",
  "đã giao": "delivered",
  "đã hủy": "cancelled",
};

if (dropdownList.length > 0) {
  dropdownList.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();

      const status = this.dataset.status;

      const wrapper = this.closest(".status-dropdown-wrapper");
      const button = wrapper.querySelector(".status-dropdown-btn");
      const orderId = button.dataset.orderId;

      updateStatusOrder(orderId, status, button);
    });
  });
}

function updateStatusOrder(orderId, status, buttonElement) {
  // Disable button khi đang xử lý
  buttonElement.disabled = true;

  fetch(`/admin/order/update-status`, {
    method: "POST",
    headers: window.withCsrfHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      orderId: orderId,
      status: status,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        buttonElement.innerText = status;

        buttonElement.classList.remove(
          "pending",
          "confirmed",
          "shipping",
          "delivered",
          "cancelled",
        );

        buttonElement.classList.add(statusClassMap[status]);
      } else {
        alert("Cập nhật thất bại");
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Có lỗi xảy ra");
    })
    .finally(() => {
      buttonElement.disabled = false;
    });
}
// Thay đổi trạng thái đơn hàng (từ trang chi tiết)
const btnStatusUpdates = document.querySelectorAll("[status-update]");
if (btnStatusUpdates.length > 0) {
  btnStatusUpdates.forEach((btn) => {
    btn.addEventListener("click", () => {
      const orderId = btn.getAttribute("data-id");
      const status = btn.getAttribute("status-update");
      if (confirm(`Bạn có chắc muốn chuyển trạng thái đơn hàng thành "${status}"?`)) {
        btn.disabled = true;

        fetch(`/admin/order/update-status`, {
          method: "POST",
          headers: window.withCsrfHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            orderId: orderId,
            status: status,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              window.location.reload();
            } else {
              alert("Cập nhật thất bại");
              btn.disabled = false;
            }
          })
          .catch((err) => {
            console.error(err);
            alert("Có lỗi xảy ra");
            btn.disabled = false;
          });
      }
    });
  });
}

// end thay đổi trạng thái đơn hàng

//  xóa đơn hàng
const buttonDeleteOrder = document.querySelectorAll(".buttonDeleteOrder");

if (buttonDeleteOrder.length > 0) {
  buttonDeleteOrder.forEach((button) => {
    button.addEventListener("click", function () {
      const id = this.dataset.id;

      if (confirm("Bạn có chắc muốn xoá đơn hàng này không?")) {
        deletedOrder(id);
      }
    });
  });
}

function deletedOrder(id) {
  fetch("/admin/order/delete-order", {
    method: "PATCH",
    headers: window.withCsrfHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      id: id,
    }),
  })
    .then((res) => res.json()) // nhớ gọi hàm
    .then((data) => {
      if (data.success) {
        location.reload();
      }
    });
}
//  end xóa đơn hàng

// Tìm gợi ý  kiếm đơn hàng (xem thêm abort controller để xem cách bảo be ngừng gửi request)
const inputSearchOrder = document.querySelector("#searchInputOrderAdmin");
const suggestBox = document.getElementById("suggestBox");

if (inputSearchOrder) {
  function renderSuggest(orders) {
    if (!orders.length) {
      suggestBox.style.display = "none";
      return;
    }

    suggestBox.replaceChildren();

    orders.forEach((order) => {
      const item = document.createElement("div");
      item.className = "suggest-item";
      item.dataset.code = order.orderCode || "";

      const strong = document.createElement("strong");
      strong.textContent = order.orderCode || "";

      item.appendChild(strong);
      item.appendChild(
        document.createTextNode(
          ` - ${order.userInfo?.fullName || ""} - ${order.userInfo?.phone || ""}`,
        ),
      );

      suggestBox.appendChild(item);
    });

    suggestBox.style.display = "block";
  }

  suggestBox.addEventListener("click", function (e) {
    const item = e.target.closest(".suggest-item");
    if (!item) return;

    const code = item.dataset.code;

    inputSearchOrder.value = code;
    suggestBox.style.display = "none";
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".filter-item")) {
      suggestBox.style.display = "none";
    }
  });

  async function fetchSuggest(keyword) {
    if (!keyword || keyword.trim().length < 2) {
      suggestBox.style.display = "none";
      return;
    }

    const res = await fetch(
      `/admin/order/suggest?keyword=${encodeURIComponent(keyword)}`,
    );

    const data = await res.json();
    renderSuggest(data);
  }

  let timeout;

  inputSearchOrder.addEventListener("input", (e) => {
    clearTimeout(timeout);

    const keyword = e.target.value;

    timeout = setTimeout(() => {
      fetchSuggest(keyword);
    }, 100);
  });
}
// End gợi ý Tìm kiếm đơn hàng

// tìm kiếm in order
const buttonSearchOrder = document.querySelector("#btnSearchOrder");
// console.log(buttonSearchOrder);
if (buttonSearchOrder) {
  buttonSearchOrder.addEventListener("click", () => {
    const keyword = document
      .querySelector("#searchInputOrderAdmin")
      .value.trim();

    const status = document.querySelector("#filterStatus").value;

    const date = document.querySelector("#filterDate").value;

    let params = new URLSearchParams();

    if (keyword) params.append("keyword", keyword);
    if (status) params.append("status", status);
    if (date) params.append("date", date);

    window.location.href = `/admin/order?${params.toString()}`;
  });
}
// end tìm kiếm in order

// xem chi tiết order bên admin
const buttonDetailOrder = document.querySelectorAll("#detailOrderAdmin");
// console.log(buttonDetailOrder);
if (buttonDetailOrder) {
  buttonDetailOrder.forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      // console.log(id);
      const url = `/admin/order/detail?order_id=${id}`;
      window.location.href = url;
    });
  });
}
// end xem chi tiết order bên admin

// product-category
 // ← đóng DOMContentLoaded ở đây, không có gì nằm ngoài
