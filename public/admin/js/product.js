// change status
const buttonsChangeStatus = document.querySelectorAll("[button-change-status]");
if (buttonsChangeStatus.length > 0) {
  const formChangeStatus = document.querySelector("#form-change-status");
  const modal = document.getElementById("modal-product-status");
  const modalDesc = document.getElementById("modal-product-status-desc");

  let pending = null;

  function openProductStatusModal(nextStatus) {
    if (!modal) return;
    if (modalDesc) {
      modalDesc.textContent =
        nextStatus === "active"
          ? "Sản phẩm sẽ được chuyển sang Hoạt động."
          : "Sản phẩm sẽ được chuyển sang Dừng hoạt động.";
    }
    modal.style.display = "flex";
  }

  window.closeProductStatusModal = function () {
    if (!modal) return;
    modal.style.display = "none";
    pending = null;
  };

  window.confirmProductStatusChange = function () {
    if (!pending || !formChangeStatus) return;
    const action = pending.path + `/${pending.statusChange}/${pending.id}?_method=PATCH`;
    formChangeStatus.action = action;
    formChangeStatus.submit();
  };

  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) window.closeProductStatusModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.style.display !== "none") {
        window.closeProductStatusModal();
      }
    });
  }

  buttonsChangeStatus.forEach((button) => {
    button.addEventListener("click", () => {
      const statusCurrent = button.getAttribute("data-status");
      const id = button.getAttribute("data-id");
      const statusChange = statusCurrent == "active" ? "inactive" : "active";
      const path = formChangeStatus.getAttribute("data-path");
      pending = { id, statusChange, path };
      // Fallback: nếu modal không tồn tại thì đổi trạng thái ngay (như cũ)
      if (!modal) {
        const action = path + `/${statusChange}/${id}?_method=PATCH`;
        formChangeStatus.action = action;
        formChangeStatus.submit();
        return;
      }
      openProductStatusModal(statusChange);
    });
  });
}
//end change status

// delete items
const buttonDelete = document.querySelectorAll("[button-delete]");
if (buttonDelete.length > 0) {
  const formDelete = document.querySelector("#form-delete-item");
  const path = formDelete.getAttribute("data-path");
  buttonDelete.forEach((button) => {
    button.addEventListener("click", () => {
      const isconfirm = confirm("Bạn có chắc chắc muốn xóa không !!");
      if (isconfirm) {
        const id = button.getAttribute("data-id");
        const action = `${path}/${id}?_method=DELETE`;
        formDelete.action = action;
        formDelete.submit();
      }
    });
  });
}

// phát triển thêm mới sản phẩm
// ô giá sản phẩm
const inputGia = document.querySelector("#price");
if (inputGia) {
  inputGia.addEventListener("focus", () => {
    inputGia.value = "";
  });
  inputGia.addEventListener("blur", () => {
    if (inputGia.value == "") {
      inputGia.value = 0;
    }
  });
}
// end ô giá sản phẩm
// ô số lượng
const inputSoLuong = document.querySelector("#stock");
if (inputSoLuong) {
  inputSoLuong.addEventListener("focus", () => {
    inputSoLuong.value = "";
  });
  inputSoLuong.addEventListener("blur", () => {
    if (inputSoLuong.value == "") {
      inputSoLuong.value = 0;
    }
  });
}
// end ô số lượng


