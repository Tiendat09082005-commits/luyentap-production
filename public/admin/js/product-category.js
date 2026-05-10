const INITIAL_ICON_LIMIT = 40;
const SEARCH_ICON_LIMIT = 50;
const LOAD_MORE_STEP = 40;
const ICON_SEARCH_DEBOUNCE_MS = 180;

const categoryIconState = {
  allIcons: [],
  filteredIcons: [],
  visibleLimit: INITIAL_ICON_LIMIT,
  selectedIcon: null,
  searchKeyword: "",
};

document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("modal-them-danh-muc");
  const btnOpen = document.getElementById("btn-open-modal");
  const btnClose = document.getElementById("btn-close-modal");
  const btnCancel = document.getElementById("btn-huy-modal");
  const btnSubmit = document.getElementById("btn-submit-modal");
  const btnToggleIconDropdown = document.getElementById("btn-toggle-icon-dropdown");
  const iconPickerList = document.getElementById("icon-picker-list");
  const inputTitle = document.getElementById("input-ten-danh-muc");
  const inputSlug = document.getElementById("input-slug");
  const inputIconSearch = document.getElementById("input-icon-search");
  const toggleInput = document.getElementById("toggle-hoat-dong");
  const toggleTrack = document.querySelector(".toggle__track");
  const selectParent = document.getElementById("select-parent");
  const btnChooseThumbnail = document.getElementById("btn-choose-thumbnail");
  const inputThumbnail = document.getElementById("input-thumbnail");
  const btnRemoveThumbnail = document.getElementById("btn-remove-thumbnail");
  const filterSearchInput = document.querySelector(".filter-bar__input");

  if (modal) {
    document.body.appendChild(modal);
  }

  initializeIconCatalog();
  bindIconGrid();
  bindEditButtons();
  bindAddChildButtons();
  bindDeleteButtons();
  bindToggleButtons();
  bindThumbnailInput();
  bindCategorySearch();
  renderLucideIcons(document);
  updateSelectedIconPreview();
  updateCategoryMediaMode();

  if (btnOpen) {
    btnOpen.addEventListener("click", function () {
      openModal("");
    });
  }

  if (btnClose) btnClose.addEventListener("click", closeModal);
  if (btnCancel) btnCancel.addEventListener("click", closeModal);

  if (btnToggleIconDropdown) {
    btnToggleIconDropdown.addEventListener("click", function () {
      const nextOpen = !isIconDropdownOpen();
      setIconDropdownOpen(nextOpen);
      if (nextOpen) {
        inputIconSearch?.focus();
      }
    });
  }

  if (iconPickerList) {
    iconPickerList.addEventListener("scroll", function () {
      const nearBottom =
        iconPickerList.scrollTop + iconPickerList.clientHeight >=
        iconPickerList.scrollHeight - 80;

      if (!nearBottom) return;
      if (categoryIconState.visibleLimit >= categoryIconState.filteredIcons.length) {
        return;
      }

      categoryIconState.visibleLimit += LOAD_MORE_STEP;
      renderIconPicker();
    });
  }

  if (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeModal();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (!modal?.classList.contains("is-open")) return;

    if (isIconDropdownOpen()) {
      setIconDropdownOpen(false);
      return;
    }

    closeModal();
  });

  document.addEventListener("click", function (event) {
    if (event.target.closest(".icon-dropdown")) return;
    if (isIconDropdownOpen()) {
      setIconDropdownOpen(false);
    }
  });

  if (inputTitle && inputSlug) {
    inputTitle.addEventListener("input", function () {
      inputSlug.value = slugify(inputTitle.value);
    });
  }

  if (toggleInput && toggleTrack) {
    toggleTrack.classList.toggle("toggle__track--on", toggleInput.checked);
    toggleInput.addEventListener("change", function () {
      toggleTrack.classList.toggle("toggle__track--on", this.checked);
    });
  }

  if (selectParent) {
    selectParent.addEventListener("change", function () {
      updateCategoryMediaMode();
    });
  }

  if (btnChooseThumbnail && inputThumbnail) {
    btnChooseThumbnail.addEventListener("click", function () {
      inputThumbnail.click();
    });
  }

  if (btnRemoveThumbnail) {
    btnRemoveThumbnail.addEventListener("click", clearThumbnailSelection);
  }

  if (btnSubmit) {
    btnSubmit.addEventListener("click", function () {
      const categoryId = document.getElementById("input-category-id")?.value || "";
      if (categoryId) {
        handleUpdateCategory(categoryId);
        return;
      }

      handleCreateCategory();
    });
  }

  if (inputIconSearch) {
    inputIconSearch.addEventListener(
      "input",
      debounce(function () {
        categoryIconState.searchKeyword = inputIconSearch.value.trim().toLowerCase();
        categoryIconState.visibleLimit = categoryIconState.searchKeyword
          ? SEARCH_ICON_LIMIT
          : INITIAL_ICON_LIMIT;
        renderIconPicker();
      }, ICON_SEARCH_DEBOUNCE_MS),
    );
  }
});

function initializeIconCatalog() {
  const lucideIcons = window.lucide?.icons || {};
  const allIconNames = Object.keys(lucideIcons).sort((left, right) =>
    left.localeCompare(right),
  );
  const presets = Array.isArray(window.categoryIconPresets)
    ? window.categoryIconPresets
    : [];

  const presetMap = presets.reduce((accumulator, item) => {
    if (item?.name) {
      accumulator[item.name] = item;
    }
    return accumulator;
  }, {});

  const presetNames = new Set(Object.keys(presetMap));
  const preferredIcons = presets
    .map((item) => item.name)
    .filter((name) => allIconNames.includes(name));
  const remainingIcons = allIconNames.filter((name) => !presetNames.has(name));
  const orderedNames = [...preferredIcons, ...remainingIcons];

  categoryIconState.allIcons = orderedNames.map((name) => {
    const preset = presetMap[name];
    return {
      name,
      label: preset?.label || humanizeIconName(name),
      searchText: [name, preset?.label || "", name.replaceAll("-", " ")]
        .join(" ")
        .toLowerCase(),
    };
  });

  categoryIconState.selectedIcon = getDefaultIconKey();
  categoryIconState.filteredIcons = categoryIconState.allIcons;
  renderIconPicker();
}

function getDefaultIconKey() {
  return window.defaultCategoryIcon || "smartphone";
}

function normalizeIconName(iconName) {
  const value = String(iconName || "").trim().toLowerCase();
  return value || getDefaultIconKey();
}

function getSelectedIconKey() {
  return document.getElementById("input-icon")?.value || getDefaultIconKey();
}

function setSelectedIconKey(iconName) {
  const resolvedIcon = normalizeIconName(iconName);
  const hiddenInput = document.getElementById("input-icon");
  if (hiddenInput) {
    hiddenInput.value = resolvedIcon;
  }

  categoryIconState.selectedIcon = resolvedIcon;

  document.querySelectorAll(".icon-picker__item").forEach((button) => {
    const isSelected = button.dataset.iconKey === resolvedIcon;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  updateSelectedIconPreview();
}

function filterIcons() {
  const keyword = categoryIconState.searchKeyword;
  if (!keyword) {
    return categoryIconState.allIcons;
  }

  return categoryIconState.allIcons.filter((item) =>
    item.searchText.includes(keyword),
  );
}

function renderIconPicker() {
  const grid = document.getElementById("icon-picker-grid");
  const meta = document.getElementById("icon-picker-meta");

  if (!grid) return;

  categoryIconState.filteredIcons = filterIcons();

  let visibleItems = categoryIconState.filteredIcons.slice(
    0,
    categoryIconState.visibleLimit,
  );

  const selectedItem = categoryIconState.filteredIcons.find(
    (item) => item.name === categoryIconState.selectedIcon,
  );

  if (
    selectedItem &&
    !visibleItems.some((item) => item.name === selectedItem.name)
  ) {
    visibleItems = [
      selectedItem,
      ...visibleItems.filter((item) => item.name !== selectedItem.name),
    ].slice(0, Math.max(1, categoryIconState.visibleLimit));
  }

  grid.innerHTML = visibleItems
    .map(
      (item) => `
        <button
          type="button"
          class="icon-picker__item ${item.name === categoryIconState.selectedIcon ? "is-selected" : ""}"
          data-icon-key="${escapeHtml(item.name)}"
          aria-pressed="${item.name === categoryIconState.selectedIcon ? "true" : "false"}"
        >
          <span class="icon-picker__preview">
            <i data-lucide="${escapeHtml(item.name)}" aria-hidden="true"></i>
          </span>
          <span class="icon-picker__label">${escapeHtml(item.label)}</span>
        </button>
      `,
    )
    .join("");

  if (meta) {
    const hasMore = categoryIconState.filteredIcons.length > visibleItems.length;
    meta.textContent = hasMore
      ? `${visibleItems.length}/${categoryIconState.filteredIcons.length} icon - cuon de xem them`
      : `${visibleItems.length}/${categoryIconState.filteredIcons.length} icon`;
  }

  renderLucideIcons(grid);
}

function bindIconGrid() {
  const grid = document.getElementById("icon-picker-grid");
  if (!grid) return;

  grid.addEventListener("click", function (event) {
    const button = event.target.closest(".icon-picker__item");
    if (!button) return;

    setSelectedIconKey(button.dataset.iconKey);
    renderIconPicker();
    setIconDropdownOpen(false);
  });
}

function bindThumbnailInput() {
  const inputThumbnail = document.getElementById("input-thumbnail");
  if (!inputThumbnail) return;

  inputThumbnail.addEventListener("change", function () {
    const file = inputThumbnail.files?.[0];
    if (!file) {
      syncThumbnailPreview("", false);
      return;
    }

    document.getElementById("input-thumbnail-existing").value = "";
    syncThumbnailPreview(URL.createObjectURL(file), true);
  });
}

function syncThumbnailPreview(src, hasImage) {
  const preview = document.getElementById("thumbnail-preview");
  const placeholder = document.getElementById("thumbnail-placeholder");
  const btnRemove = document.getElementById("btn-remove-thumbnail");

  if (!preview || !placeholder || !btnRemove) return;

  if (hasImage && src) {
    preview.src = src;
    preview.style.display = "block";
    placeholder.style.display = "none";
    btnRemove.style.display = "inline-flex";
    return;
  }

  preview.src = "";
  preview.style.display = "none";
  placeholder.style.display = "";
  btnRemove.style.display = "none";
}

function clearThumbnailSelection() {
  const inputThumbnail = document.getElementById("input-thumbnail");
  const inputThumbnailExisting = document.getElementById("input-thumbnail-existing");

  if (inputThumbnail) inputThumbnail.value = "";
  if (inputThumbnailExisting) inputThumbnailExisting.value = "";
  syncThumbnailPreview("", false);
}

function getSelectedParentLevel() {
  const selectParent = document.getElementById("select-parent");
  if (!selectParent) return 0;

  const selectedOption =
    selectParent.selectedOptions?.[0] ||
    Array.from(selectParent.options || []).find(
      (option) => option.value === selectParent.value,
    );
  return Number(selectedOption?.dataset.level || 0);
}

function getTargetCategoryLevel() {
  const parentLevel = getSelectedParentLevel();
  return parentLevel ? parentLevel + 1 : 1;
}

function isRootCategorySelection() {
  return getTargetCategoryLevel() === 1;
}

function getCategoryMediaMode() {
  return isRootCategorySelection() ? "icon" : "thumbnail";
}

function updateCategoryMediaMode() {
  const iconSection = document.getElementById("icon-picker-section");
  const thumbnailSection = document.getElementById("thumbnail-upload-section");
  const mediaLabel = document.getElementById("category-media-label");
  const mediaHelp = document.getElementById("category-media-help");
  const mediaMode = getCategoryMediaMode();
  const rootCategory = mediaMode === "icon";

  if (iconSection) iconSection.hidden = !rootCategory;
  if (thumbnailSection) thumbnailSection.hidden = rootCategory;

  if (mediaLabel) {
    mediaLabel.textContent = rootCategory ? "Icon" : "Anh danh muc";
  }

  if (mediaHelp) {
    mediaHelp.textContent = rootCategory
      ? "Chi danh muc cap 1 moi dung icon."
      : "Danh muc cap 2-3 o moi nhanh deu dung anh, khong dung logo/icon.";
  }

  if (rootCategory) {
    setIconDropdownOpen(false);
    clearThumbnailSelection();
  }
}

function buildCategoryFormData() {
  const title = document.getElementById("input-ten-danh-muc")?.value.trim() || "";
  const slugInput = document.getElementById("input-slug");
  const selectParent = document.getElementById("select-parent");
  const toggleStatus = document.getElementById("toggle-hoat-dong");
  const inputThumbnail = document.getElementById("input-thumbnail");
  const inputThumbnailExisting = document.getElementById("input-thumbnail-existing");

  const slug = (slugInput?.value || "").trim() || slugify(title);
  const parentId = selectParent?.value || "";
  const status = toggleStatus?.checked ? "active" : "inactive";
  const icon = getSelectedIconKey();
  const formData = new FormData();

  formData.append("title", title);
  formData.append("slug", slug);
  formData.append("parent_id", parentId);
  formData.append("status", status);
  formData.append("icon", icon);
  formData.append("thumbnailExisting", inputThumbnailExisting?.value || "");

  if (inputThumbnail?.files?.[0]) {
    formData.append("thumbnail", inputThumbnail.files[0]);
  }

  return {
    title,
    parentId,
    formData,
  };
}

async function handleCreateCategory() {
  const btnSubmit = document.getElementById("btn-submit-modal");
  if (!btnSubmit || btnSubmit.disabled) return;

  const { title, formData } = buildCategoryFormData();

  if (!title) {
    showToast("Vui lòng nhập tên danh mục", "error");
    return;
  }

  if (!isRootCategorySelection() && !hasThumbnailInputValue()) {
    showToast("Danh mục cấp 2-3 cần upload ảnh", "error");
    return;
  }

  btnSubmit.disabled = true;
  const oldText = btnSubmit.textContent;
  btnSubmit.textContent = "Đang thêm...";

  try {
    const res = await fetch("/admin/products-category/create", {
      method: "POST",
      headers: window.withCsrfHeaders(),
      body: formData,
    });

    const result = await res.json();
    if (!res.ok || !result.success || !result.data) {
      showToast(result.message || "Có lỗi xảy ra", "error");
      return;
    }

    addCategoryToUI(result.data);
    resetCategoryForm();
    closeModal();
    showToast("Thêm danh mục thành công", "success");
  } catch (error) {
    console.error(error);
    showToast("Lỗi server", "error");
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = oldText;
  }
}

async function handleUpdateCategory(id) {
  const btnSubmit = document.getElementById("btn-submit-modal");
  if (!btnSubmit || btnSubmit.disabled) return;

  const { title, formData } = buildCategoryFormData();

  if (!title) {
    showToast("Vui lòng nhập tên danh mục", "error");
    return;
  }

  if (!isRootCategorySelection() && !hasThumbnailInputValue()) {
    showToast("Danh mục cấp 2-3 cần upload ảnh", "error");
    return;
  }

  btnSubmit.disabled = true;
  const oldText = btnSubmit.textContent;
  btnSubmit.textContent = "Đang cập nhật...";

  try {
    const res = await fetch(`/admin/products-category/edit/${id}`, {
      method: "PATCH",
      headers: window.withCsrfHeaders(),
      body: formData,
    });

    const result = await res.json();
    if (!res.ok || !result.success || !result.data) {
      showToast(result.message || "Có lỗi xảy ra", "error");
      return;
    }

    updateRowInUI(result.data);
    closeModal();
    showToast("Cập nhật danh mục thành công", "success");
  } catch (error) {
    console.error(error);
    showToast("Lỗi server khi cập nhật", "error");
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = oldText;
  }
}

function hasThumbnailInputValue() {
  const inputThumbnail = document.getElementById("input-thumbnail");
  const inputThumbnailExisting = document.getElementById("input-thumbnail-existing");
  return Boolean(inputThumbnail?.files?.[0] || inputThumbnailExisting?.value);
}

function addCategoryToUI(category) {
  const tree = document.getElementById("category-tree");
  if (!tree) return;

  const id = String(category._id || category.id);
  const parentId = category.parent_id ? String(category.parent_id) : "";
  const title = category.title || "";
  const slug = category.slug || "";
  const status = category.status || "inactive";
  const icon = normalizeIconName(category.icon);
  const thumbnail = category.thumbnail || "";

  let level = 1;
  if (parentId) {
    const parentRow = tree.querySelector(`.tree-row[data-id="${parentId}"]`);
    if (!parentRow) return;
    level = Number(parentRow.dataset.level || 1) + 1;
  }

  const newRow = createCategoryRowHTML({
    id,
    parentId,
    title,
    slug,
    status,
    icon,
    thumbnail,
    level,
  });

  if (!parentId) {
    tree.insertAdjacentHTML("beforeend", newRow);
  } else {
    insertChildAfterDescendants(parentId, newRow);
    updateParentToggle(parentId);
  }

  removeEmptyMessage();
  bindEditButtons();
  bindAddChildButtons();
  bindDeleteButtons();
  bindToggleButtons();
  renderLucideIcons(tree);
}

function createCategoryRowHTML({
  id,
  parentId,
  title,
  slug,
  status,
  icon,
  thumbnail,
  level,
}) {
  const statusBadge =
    status === "active"
      ? `<span class="badge badge--active">Hoat dong</span>`
      : `<span class="badge badge--hidden">An</span>`;

  const addButton =
    level < 3
      ? `
        <button class="tree-action-btn tree-action-btn--add" title="Them danh muc con">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      `
      : "";

  const mediaMarkup =
    level === 1
      ? `<span class="category-icon-render tree-item__icon">${renderIconMarkup(icon)}</span>`
      : thumbnail
        ? `<img class="tree-item__thumb-image" src="${escapeHtml(thumbnail)}" alt="${escapeHtml(title)}">`
        : `<span class="tree-item__thumb-placeholder">No img</span>`;

  return `
    <div class="tree-row tree-row--level-${level}"
         data-id="${escapeHtml(id)}"
         data-parent-id="${escapeHtml(parentId)}"
         data-level="${level}"
         data-icon="${escapeHtml(icon)}"
         data-thumbnail="${escapeHtml(thumbnail)}">
      <button class="tree-toggle tree-toggle--no-children is-collapsed" disabled>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 6 15 12 9 18"></polyline>
        </svg>
      </button>

      <div class="tree-item">
        <div class="tree-item__thumb">
          ${mediaMarkup}
        </div>

        <div class="tree-item__info">
          <div class="tree-item__name">
            <span>${escapeHtml(title)}</span>
            ${statusBadge}
            <span class="badge badge--level">Cap ${level}</span>
          </div>

          <span class="tree-item__slug">/${escapeHtml(slug)}</span>
        </div>
      </div>

      <div class="tree-actions">
        ${addButton}

        <button
          class="tree-action-btn tree-action-btn--edit"
          title="Chinh sua"
          data-id="${escapeHtml(id)}"
          data-title="${escapeHtml(title)}"
          data-slug="${escapeHtml(slug)}"
          data-parent-id="${escapeHtml(parentId)}"
          data-status="${escapeHtml(status)}"
          data-icon="${escapeHtml(icon)}"
          data-thumbnail="${escapeHtml(thumbnail)}"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>

        <button class="tree-action-btn tree-action-btn--delete" title="Xoa">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
            <path d="M10 11v6"></path>
            <path d="M14 11v6"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
}

function insertChildAfterDescendants(parentId, childHTML) {
  const tree = document.getElementById("category-tree");
  if (!tree) return;

  const rows = [...tree.querySelectorAll(".tree-row")];
  const parentIndex = rows.findIndex((row) => row.dataset.id === parentId);
  if (parentIndex === -1) return;

  const parentLevel = Number(rows[parentIndex].dataset.level || 1);
  let insertAfterIndex = parentIndex;

  for (let index = parentIndex + 1; index < rows.length; index++) {
    const currentLevel = Number(rows[index].dataset.level || 1);
    if (currentLevel <= parentLevel) break;
    insertAfterIndex = index;
  }

  rows[insertAfterIndex].insertAdjacentHTML("afterend", childHTML);
}

function updateParentToggle(parentId) {
  const tree = document.getElementById("category-tree");
  const parentRow = tree?.querySelector(`.tree-row[data-id="${parentId}"]`);
  if (!parentRow) return;

  const toggleBtn = parentRow.querySelector(".tree-toggle");
  if (toggleBtn && toggleBtn.classList.contains("tree-toggle--no-children")) {
    toggleBtn.classList.remove("tree-toggle--no-children", "is-collapsed");
    toggleBtn.removeAttribute("disabled");
    toggleBtn.setAttribute("data-has-children", "true");
    bindToggleButtons();
  }
}

function removeEmptyMessage() {
  document.querySelector(".category-tree__empty")?.remove();
}

function openModal(parentId = "", mode = "add", data = null) {
  const overlay = document.getElementById("modal-them-danh-muc");
  const selectParent = document.getElementById("select-parent");
  const modalTitle = document.querySelector(".dm-modal__title");
  const btnSubmit = document.getElementById("btn-submit-modal");
  const inputId = document.getElementById("input-category-id");

  if (!overlay) return;

  resetCategoryForm();

  if (mode === "edit" && data) {
    if (modalTitle) modalTitle.textContent = "Chinh sua danh muc";
    if (btnSubmit) btnSubmit.textContent = "Cap nhat danh muc";
    if (inputId) inputId.value = data.id;
    document.getElementById("input-ten-danh-muc").value = data.title || "";
    document.getElementById("input-slug").value = data.slug || "";
    if (selectParent) selectParent.value = data.parentId || "";

    const toggleInput = document.getElementById("toggle-hoat-dong");
    const toggleTrack = document.querySelector(".toggle__track");
    if (toggleInput && toggleTrack) {
      toggleInput.checked = data.status === "active";
      toggleTrack.classList.toggle("toggle__track--on", toggleInput.checked);
    }

    setSelectedIconKey(data.icon || getDefaultIconKey());
    setExistingThumbnail(data.thumbnail || "");
  } else {
    if (modalTitle) modalTitle.textContent = "Them moi danh muc";
    if (btnSubmit) btnSubmit.textContent = "Them danh muc";
    if (inputId) inputId.value = "";
    if (selectParent) selectParent.value = String(parentId || "");
    setSelectedIconKey(getDefaultIconKey());
    setExistingThumbnail("");
  }

  updateCategoryMediaMode();
  renderIconPicker();
  setIconDropdownOpen(false);
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  document.getElementById("input-ten-danh-muc")?.focus();
}

function setExistingThumbnail(thumbnail) {
  const inputExisting = document.getElementById("input-thumbnail-existing");
  const inputThumbnail = document.getElementById("input-thumbnail");
  if (inputExisting) inputExisting.value = thumbnail || "";
  if (inputThumbnail) inputThumbnail.value = "";
  syncThumbnailPreview(thumbnail || "", Boolean(thumbnail));
}

function closeModal() {
  const modal = document.getElementById("modal-them-danh-muc");
  if (!modal) return;

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  setIconDropdownOpen(false);
}

function updateRowInUI(data) {
  const row = document.querySelector(`.tree-row[data-id="${data._id}"]`);
  if (!row) {
    window.location.reload();
    return;
  }

  const nextParentId = data.parent_id ? String(data.parent_id) : "";
  if ((row.dataset.parentId || "") !== nextParentId) {
    window.location.reload();
    return;
  }

  const level = Number(row.dataset.level || 1);
  const icon = normalizeIconName(data.icon);
  const thumbnail = data.thumbnail || "";

  row.dataset.icon = icon;
  row.dataset.thumbnail = thumbnail;

  const nameSpan = row.querySelector(".tree-item__name > span");
  if (nameSpan) nameSpan.textContent = data.title;

  const slugSpan = row.querySelector(".tree-item__slug");
  if (slugSpan) slugSpan.textContent = `/${data.slug}`;

  const badge = row.querySelector(".badge--active, .badge--hidden");
  if (badge) {
    if (data.status === "active") {
      badge.className = "badge badge--active";
      badge.textContent = "Hoat dong";
    } else {
      badge.className = "badge badge--hidden";
      badge.textContent = "An";
    }
  }

  const thumbWrap = row.querySelector(".tree-item__thumb");
  if (thumbWrap) {
    thumbWrap.innerHTML =
      level === 1
        ? `<span class="category-icon-render tree-item__icon">${renderIconMarkup(icon)}</span>`
        : thumbnail
          ? `<img class="tree-item__thumb-image" src="${escapeHtml(thumbnail)}" alt="${escapeHtml(data.title || "")}">`
          : `<span class="tree-item__thumb-placeholder">No img</span>`;
    renderLucideIcons(thumbWrap);
  }

  const editBtn = row.querySelector(".tree-action-btn--edit");
  if (editBtn) {
    editBtn.dataset.title = data.title || "";
    editBtn.dataset.slug = data.slug || "";
    editBtn.dataset.status = data.status || "";
    editBtn.dataset.parentId = nextParentId;
    editBtn.dataset.icon = icon;
    editBtn.dataset.thumbnail = thumbnail;
  }
}

function resetCategoryForm() {
  const inputTitle = document.getElementById("input-ten-danh-muc");
  const inputSlug = document.getElementById("input-slug");
  const selectParent = document.getElementById("select-parent");
  const toggleStatus = document.getElementById("toggle-hoat-dong");
  const toggleTrack = document.querySelector(".toggle__track");
  const inputId = document.getElementById("input-category-id");
  const inputIconSearch = document.getElementById("input-icon-search");

  if (inputTitle) inputTitle.value = "";
  if (inputSlug) inputSlug.value = "";
  if (selectParent) selectParent.value = "";
  if (toggleStatus) toggleStatus.checked = true;
  if (toggleTrack) toggleTrack.classList.add("toggle__track--on");
  if (inputId) inputId.value = "";
  if (inputIconSearch) inputIconSearch.value = "";

  categoryIconState.searchKeyword = "";
  categoryIconState.visibleLimit = INITIAL_ICON_LIMIT;
  setSelectedIconKey(getDefaultIconKey());
  setExistingThumbnail("");
  updateCategoryMediaMode();
  renderIconPicker();
  setIconDropdownOpen(false);
}

function updateSelectedIconPreview() {
  const iconName = getSelectedIconKey();
  const preview = document.getElementById("selected-icon-preview");
  const label = document.getElementById("selected-icon-label");

  if (preview) {
    preview.innerHTML = renderIconMarkup(iconName);
    renderLucideIcons(preview);
  }

  if (label) {
    label.textContent = humanizeIconName(iconName);
  }
}

function isIconDropdownOpen() {
  return (
    document.getElementById("btn-toggle-icon-dropdown")?.getAttribute("aria-expanded") ===
    "true"
  );
}

function setIconDropdownOpen(isOpen) {
  const trigger = document.getElementById("btn-toggle-icon-dropdown");
  const panel = document.getElementById("icon-dropdown-panel");
  if (!trigger || !panel) return;

  trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  panel.hidden = !isOpen;
}

function renderIconMarkup(iconName) {
  return `<i data-lucide="${escapeHtml(normalizeIconName(iconName))}" aria-hidden="true"></i>`;
}

function renderLucideIcons() {
  if (!window.lucide || typeof window.lucide.createIcons !== "function") {
    return;
  }

  window.lucide.createIcons({
    icons: window.lucide.icons,
    attrs: {
      "stroke-width": 1.8,
    },
  });
}

function bindEditButtons() {
  document.querySelectorAll(".tree-action-btn--edit").forEach((button) => {
    if (button.dataset.boundEdit === "true") return;
    button.dataset.boundEdit = "true";

    button.addEventListener("click", function () {
      openModal("", "edit", {
        id: button.dataset.id,
        title: button.dataset.title,
        slug: button.dataset.slug,
        parentId: button.dataset.parentId,
        status: button.dataset.status,
        icon: button.dataset.icon,
        thumbnail: button.dataset.thumbnail,
      });
    });
  });
}

function bindToggleButtons() {
  document
    .querySelectorAll(".tree-toggle[data-has-children='true']")
    .forEach((button) => {
      if (button.dataset.bound === "true") return;
      button.dataset.bound = "true";

      button.addEventListener("click", function () {
        const row = button.closest(".tree-row");
        const tree = document.getElementById("category-tree");
        if (!row || !tree) return;

        const parentId = row.dataset.id;
        const parentLevel = Number(row.dataset.level || 1);
        const isCollapsed = button.classList.contains("is-collapsed");

        button.classList.toggle("is-collapsed", !isCollapsed);

        const allRows = [...tree.querySelectorAll(".tree-row")];
        const parentIndex = allRows.findIndex((item) => item.dataset.id === parentId);

        for (let index = parentIndex + 1; index < allRows.length; index++) {
          const childRow = allRows[index];
          const childLevel = Number(childRow.dataset.level || 1);

          if (childLevel <= parentLevel) break;

          if (!isCollapsed) {
            childRow.style.display = "none";
            childRow.querySelector(".tree-toggle")?.classList.add("is-collapsed");
          } else if (childLevel === parentLevel + 1) {
            childRow.style.display = "";
          }
        }
      });
    });
}

function bindAddChildButtons() {
  document.querySelectorAll(".tree-action-btn--add").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";

    button.addEventListener("click", function () {
      const row = button.closest(".tree-row");
      if (!row) return;

      const parentId = row.dataset.id || "";
      const parentLevel = Number(row.dataset.level || 1);

      if (parentLevel >= 3) {
        showToast("Chỉ được thêm tối đa 3 cấp danh mục", "error");
        return;
      }

      openModal(parentId);
    });
  });
}

function bindDeleteButtons() {
  document.querySelectorAll(".tree-action-btn--delete").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";

    button.addEventListener("click", async function () {
      const row = button.closest(".tree-row");
      if (!row) return;

      const id = row.dataset.id;
      const parentId = row.dataset.parentId || "";
      const name =
        row.querySelector(".tree-item__name > span")?.textContent.trim() ||
        "danh muc nay";

      if (!confirm(`Ban co chac muon xoa danh muc "${name}" khong?`)) {
        return;
      }

      button.disabled = true;

      try {
        const res = await fetch(`/admin/products-category/delete/${id}`, {
          method: "DELETE",
          headers: window.withCsrfHeaders(),
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
          // Issue 4 Fix: hiển thị lỗi thay vì im lặng
          showToast(result.message || "Xóa danh mục thất bại", "error");
          return;
        }

        // Issue 8 Fix: đọc data trước khi xóa DOM node
        const deletedLevel  = Number(row.dataset.level || 1);
        const deletedStatus = row.querySelector(".badge--active") ? "active" : "inactive";

        row.remove();
        updateStatCards({ level: deletedLevel, status: deletedStatus, delta: -1 });

        if (parentId) {
          const tree = document.getElementById("category-tree");
          const parentRow = tree?.querySelector(`.tree-row[data-id="${parentId}"]`);
          const sibling = tree?.querySelector(`.tree-row[data-parent-id="${parentId}"]`);

          if (parentRow && !sibling) {
            const toggleBtn = parentRow.querySelector(".tree-toggle");
            if (toggleBtn) {
              toggleBtn.classList.add("tree-toggle--no-children", "is-collapsed");
              toggleBtn.setAttribute("disabled", "true");
              toggleBtn.removeAttribute("data-has-children");
              toggleBtn.dataset.bound = "";
            }
          }
        }

        const tree = document.getElementById("category-tree");
        if (tree && !tree.querySelector(".tree-row")) {
          tree.innerHTML = `<p class="category-tree__empty">Không có danh mục nào</p>`;
        }

        showToast(`Đã xóa danh mục "${name}"`, "success");
      } catch (error) {
        console.error("Loi xoa danh muc:", error);
        showToast("Lỗi kết nối khi xóa danh mục", "error");
      } finally {
        button.disabled = false;
      }
    });
  });
}

// ── Issue 4 Fix: Toast notification helper ────────────────────────────────────
function showToast(message, type = "success") {
  // Xóa toast cũ nếu còn
  document.querySelector(".dm-toast")?.remove();

  const icon =
    type === "success"
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

  const toast = document.createElement("div");
  toast.className = `dm-toast dm-toast--${type}`;
  toast.innerHTML = `${icon}<span>${message}</span>`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("is-visible"));

  setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Issue 8 Fix: cập nhật stat cards real-time ────────────────────────────────
function updateStatCards({ level, status, delta }) {
  function adjustStat(selector, amount) {
    const el = document.querySelector(selector);
    if (!el) return;
    const current = parseInt(el.textContent, 10);
    if (!isNaN(current)) el.textContent = Math.max(0, current + amount);
  }

  // Tổng danh mục
  adjustStat(".stats-grid .stat-card:nth-child(1) .stat-card__value", delta);

  // Đang hoạt động
  if (status === "active") {
    adjustStat(".stats-grid .stat-card:nth-child(2) .stat-card__value", delta);
  }

  // Cấp 1 / 2 / 3
  if (level === 1) adjustStat(".stats-grid .stat-card:nth-child(3) .stat-card__value", delta);
  else if (level === 2) adjustStat(".stats-grid .stat-card:nth-child(4) .stat-card__value", delta);
  else if (level === 3) adjustStat(".stats-grid .stat-card:nth-child(5) .stat-card__value", delta);
}

function humanizeIconName(name) {
  return String(name)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function debounce(callback, waitMs) {
  let timeoutId = null;

  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback.apply(this, args), waitMs);
  };
}

// ── Issue 3 Fix: Search bar logic ─────────────────────────────────────────────
function bindCategorySearch() {
  const input = document.querySelector(".filter-bar__input");
  if (!input) return;

  input.addEventListener(
    "input",
    debounce(function () {
      const keyword = input.value.trim().toLowerCase();
      const tree = document.getElementById("category-tree");
      if (!tree) return;

      const allRows = [...tree.querySelectorAll(".tree-row")];

      if (!keyword) {
        // Hiển thị lại trạng thái ban đầu: chỉ cấp 1 hiện, cấp 2-3 ẩn
        allRows.forEach((row) => {
          const level = Number(row.dataset.level || 1);
          row.style.display = level === 1 ? "" : "none";
        });
        return;
      }

      // Tập hợp các id match + toàn bộ ancestor của chúng
      const matchedIds = new Set();
      const visibleIds = new Set();

      allRows.forEach((row) => {
        const titleEl = row.querySelector(".tree-item__name > span");
        const titleText = titleEl?.textContent.trim().toLowerCase() || "";
        if (titleText.includes(keyword)) {
          matchedIds.add(row.dataset.id);
        }
      });

      // Với mỗi match, bubble lên để lộ parent
      matchedIds.forEach((id) => {
        let row = tree.querySelector(`.tree-row[data-id="${id}"]`);
        while (row) {
          visibleIds.add(row.dataset.id);
          const parentId = row.dataset.parentId;
          if (!parentId) break;
          row = tree.querySelector(`.tree-row[data-id="${parentId}"]`);
        }
      });

      // Áp dụng hiển thị
      allRows.forEach((row) => {
        const id = row.dataset.id;
        if (visibleIds.has(id)) {
          row.style.display = "";
          // Đánh dấu highlight nếu là row match trực tiếp
          row.classList.toggle("tree-row--highlight", matchedIds.has(id));
        } else {
          row.style.display = "none";
          row.classList.remove("tree-row--highlight");
        }
      });

      // Hiển thị thông báo nếu không có kết quả
      const emptyMsg = tree.querySelector(".category-tree__empty");
      const hasVisible = allRows.some((r) => r.style.display !== "none");
      if (!hasVisible && !emptyMsg) {
        tree.insertAdjacentHTML(
          "beforeend",
          `<p class="category-tree__empty category-tree__empty--search">Không tìm thấy danh mục nào</p>`
        );
      } else if (hasVisible && emptyMsg?.classList.contains("category-tree__empty--search")) {
        emptyMsg.remove();
      }
    }, 200)
  );
}
