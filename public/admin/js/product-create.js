/**
 * Product Create Page - JavaScript
 * Handles: Modals, Category Selector, Slug Auto-gen, Toggles, Attributes, Specs, Visuals
 */

(function () {
  "use strict";

  function initModals() {
    document.querySelectorAll("[data-modal]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-modal");
        var overlay = document.getElementById("modal-" + id);
        if (overlay) overlay.classList.add("open");
      });
    });

    document.querySelectorAll("[data-close]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        btn.closest(".pc-modal-overlay").classList.remove("open");
      });
    });

    document.querySelectorAll(".pc-modal-overlay").forEach(function (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) overlay.classList.remove("open");
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        document
          .querySelectorAll(".pc-modal-overlay.open")
          .forEach(function (o) {
            o.classList.remove("open");
          });
      }
    });
  }

  /* ================================================================
     CATEGORY SELECTOR
     ================================================================ */
  function initCategorySelector() {
    var brandOptionsByRoot = window.__BRAND_CATEGORY_OPTIONS__ || {};

    function populateBrandOptions(rootCategoryId, selectedBrandId) {
      var brandSelect = document.getElementById("brandSelect");
      if (!brandSelect) return;

      var options = brandOptionsByRoot[String(rootCategoryId || "")] || [];
      brandSelect.innerHTML = "";

      if (!rootCategoryId) {
        brandSelect.disabled = true;
        brandSelect.innerHTML =
          '<option value="" selected>Chon danh muc cap 1 truoc</option>';
        return;
      }

      if (!options.length) {
        brandSelect.disabled = true;
        brandSelect.innerHTML =
          '<option value="" selected>Khong co thuong hieu cap 3 trong nhanh nay</option>';
        return;
      }

      brandSelect.disabled = false;

      var placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Chon thuong hieu";
      placeholder.disabled = true;
      placeholder.selected = !selectedBrandId;
      brandSelect.appendChild(placeholder);

      options.forEach(function (optionData) {
        var option = document.createElement("option");
        option.value = optionData._id;
        option.textContent = optionData.title;
        if (selectedBrandId && String(selectedBrandId) === String(optionData._id)) {
          option.selected = true;
        }
        brandSelect.appendChild(option);
      });
    }

    window.__populateBrandOptionsFromRootCategory = populateBrandOptions;

    document
      .querySelectorAll(".pc-category-selector")
      .forEach(function (selector) {
        var display = selector.querySelector(".pc-category-selector__display");
        var pathEl = selector.querySelector(".pc-category-path");
        var overlay = document.createElement("div");
        overlay.className = "pc-category-overlay";
        selector.appendChild(overlay);

        display.addEventListener("click", function (e) {
          e.stopPropagation();
          document
            .querySelectorAll(".pc-category-selector.open")
            .forEach(function (s) {
              if (s !== selector) s.classList.remove("open");
            });
          selector.classList.toggle("open");
        });

        overlay.addEventListener("click", function () {
          selector.classList.remove("open");
        });

        selector.querySelectorAll(".pc-category-item").forEach(function (item) {
          item.addEventListener("click", function (e) {
            e.stopPropagation();
            selector
              .querySelectorAll(".pc-category-item")
              .forEach(function (i) {
                i.classList.remove("selected");
              });
            item.classList.add("selected");

            var span = item.querySelector("span");
            var categoryName = span
              ? span.textContent.trim()
              : item.textContent.trim();

            pathEl.innerHTML =
              '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">' +
              '<path d="M1 3h12M1 7h8M1 11h5"/>' +
              "</svg>" +
              categoryName;
            pathEl.classList.add("selected");

            // [FIX] dùng dataset.categoryId
            var categoryIdInput = document.getElementById("categoryIdInput");
            if (categoryIdInput) {
              categoryIdInput.value = item.dataset.categoryId || "";
            }

            populateBrandOptions(item.dataset.categoryId || "", "");

            selector.classList.remove("open");
            updateChecklist();
          });
        });

        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape" && selector.classList.contains("open")) {
            selector.classList.remove("open");
          }
        });
      });

    populateBrandOptions(
      document.getElementById("categoryIdInput")
        ? document.getElementById("categoryIdInput").value
        : "",
      document.getElementById("brandSelect")
        ? document.getElementById("brandSelect").value
        : ""
    );
  }

  /* ================================================================
     SLUG AUTO-GENERATION
     ================================================================ */
  function initSlug() {
    var productNameInput = document.getElementById("productName");
    var slugInput = document.getElementById("slugInput");
    var urlSlugPreview = document.querySelector(".pc-url-preview__slug");

    function toSlug(str) {
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    }

    if (productNameInput && slugInput) {
      productNameInput.addEventListener("input", function () {
        var slug = toSlug(productNameInput.value);
        slugInput.value = slug;
        if (urlSlugPreview) urlSlugPreview.textContent = slug;
        updateChecklist();
      });
      slugInput.addEventListener("input", function () {
        if (urlSlugPreview) urlSlugPreview.textContent = slugInput.value;
      });
    }

    var refreshBtn = document.querySelector(".pc-slug-refresh");
    if (refreshBtn && productNameInput && slugInput) {
      refreshBtn.addEventListener("click", function () {
        var slug = toSlug(productNameInput.value);
        slugInput.value = slug;
        if (urlSlugPreview) urlSlugPreview.textContent = slug;
      });
    }
  }

  /* ================================================================
     CHAR COUNT
     ================================================================ */
  function initCharCount() {
    document.querySelectorAll(".pc-char-count").forEach(function (counter) {
      var field = counter.previousElementSibling;
      if (!field) return;
      var numEl = counter.querySelector(".pc-char-count__num");
      if (!numEl) return;
      var limitText = counter.textContent.match(/\/\s*(\d+)/);
      var limit = limitText ? parseInt(limitText[1]) : null;
      field.addEventListener("input", function () {
        var len = field.value.length;
        numEl.textContent = len;
        numEl.style.color = limit && len > limit ? "#ef4444" : "";
      });
    });
  }

  /* ================================================================
     UPLOAD ZONES (sidebar drag styles)
     ================================================================ */
  function initUploadZones() {
    document
      .querySelectorAll(".pc-upload-zone, .pc-thumb-upload")
      .forEach(function (zone) {
        zone.addEventListener("dragover", function (e) {
          e.preventDefault();
          zone.style.borderColor = "var(--pc-accent)";
          zone.style.background = "var(--pc-accent-dim)";
        });
        zone.addEventListener("dragleave", function () {
          zone.style.borderColor = "";
          zone.style.background = "";
        });
        zone.addEventListener("drop", function (e) {
          e.preventDefault();
          zone.style.borderColor = "";
          zone.style.background = "";
        });
      });
  }

  /* ================================================================
     CHECKLIST PROGRESS
     ================================================================ */
  function updateChecklist() {
    var total = document.querySelectorAll(".pc-checklist__item").length;
    var done = document.querySelectorAll(".pc-checklist__item--done").length;
    var pct = total ? Math.round((done / total) * 100) : 0;
    var fill = document.querySelector(".pc-progress-bar__fill");
    var label = document.querySelector(".pc-progress-bar__label");
    if (fill) fill.style.width = pct + "%";
    if (label) label.textContent = done + " / " + total + " hoàn thành";
  }

  /* ================================================================
     VARIANT COUNT
     ================================================================ */
  function updateVariantCount() {
    var attrCards = document.querySelectorAll(".pc-attr-card");
    var total = 1;
    var hasAttr = false;

    attrCards.forEach(function (card) {
      var variantToggle = card.querySelector(
        '.pc-attr-card__toggles input[name$="[useForVariant]"]',
      );
      if (variantToggle && variantToggle.checked) {
        var checkedCount = card.querySelectorAll(
          ".js-val-checkbox:checked",
        ).length;
        if (checkedCount > 0) {
          total *= checkedCount;
          hasAttr = true;
        }
      }
    });

    var counter = document.querySelector(".pc-variant-counter__num");
    if (counter) counter.textContent = hasAttr ? total : 0;

    rebuildVariants();
  }

  /* ================================================================
     SECTION 3 – ATTRIBUTE CARDS
     ================================================================ */
  function initAttributes() {
    var container = document.getElementById("attr-cards-container");
    var btnAdd = document.getElementById("btnAddAttr");
    var template = document.getElementById("attr-card-template");

    if (!container || !btnAdd || !template) return;

    var cardIndex = 0;

    btnAdd.addEventListener("click", function () {
      var idx = cardIndex++;
      var html = template.innerHTML.replaceAll("__INDEX__", idx);
      var wrap = document.createElement("div");
      wrap.innerHTML = html;
      var card = wrap.firstElementChild;

      card.style.opacity = "0";
      card.style.transform = "translateY(8px)";
      container.appendChild(card);
      requestAnimationFrame(function () {
        card.style.transition = "opacity 0.2s ease, transform 0.2s ease";
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      });

      initCard(card, idx);
    });

    document.addEventListener("click", function () {
      document
        .querySelectorAll(".js-values-dropdown.is-open")
        .forEach(function (d) {
          d.classList.remove("is-open");
        });
    });
  }

  function initCard(card, idx) {
    var attrSelect = card.querySelector(".js-attr-select");
    var codeInput = card.querySelector(".js-attr-code");
    var nameInput = card.querySelector(".js-attr-name");
    var dropdown = card.querySelector(".js-values-dropdown");
    var trigger = dropdown.querySelector(".pc-dropdown-select__trigger");
    var btnRemove = card.querySelector(".pc-attr-card__remove");

    attrSelect.addEventListener("change", function () {
      var opt = attrSelect.selectedOptions[0];
      if (nameInput) nameInput.value = opt.dataset.name || "";
      codeInput.value = opt.dataset.code || "";
      var vals = opt.dataset.values
        ? opt.dataset.values.split(",").filter(Boolean)
        : [];
      buildValuesDropdown(dropdown, trigger, vals, idx);
    });

    btnRemove.addEventListener("click", function () {
      card.remove();
      updateVariantCount();
      rebuildVisuals();
    });

    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      document
        .querySelectorAll(".js-values-dropdown.is-open")
        .forEach(function (d) {
          if (d !== dropdown) d.classList.remove("is-open");
        });
      dropdown.classList.toggle("is-open");
    });

    card
      .querySelectorAll('.pc-attr-card__toggles input[type="checkbox"]')
      .forEach(function (toggle) {
        toggle.addEventListener("change", function () {
          updateVariantCount();
          rebuildVisuals();
        });
      });
  }

  function buildValuesDropdown(dropdown, trigger, values, idx) {
    var panel = dropdown.querySelector(".pc-dropdown-select__panel");
    var container = dropdown.closest(".pc-attr-card");
    updateTriggerLabel(trigger, []);

    if (container) {
      container
        .querySelectorAll('input[type="hidden"].js-selected-value-hidden')
        .forEach(function (el) {
          el.remove();
        });
    }

    if (!values.length) {
      panel.innerHTML =
        '<div class="pc-dropdown-select__empty">Thuộc tính này chưa có giá trị</div>';
      return;
    }

    panel.innerHTML = values
      .map(function (val) {
        return (
          '<label class="pc-dropdown-option">' +
          '<input type="checkbox" class="js-val-checkbox"' +
          ' name="attributes[' +
          idx +
          '][selectedValues][]"' +
          ' value="' +
          val +
          '"/>' +
          '<span class="pc-dropdown-option__check"></span>' +
          '<span class="pc-dropdown-option__label">' +
          val +
          "</span>" +
          "</label>"
        );
      })
      .join("");

    panel.querySelectorAll(".js-val-checkbox").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var checked = Array.from(
          panel.querySelectorAll(".js-val-checkbox:checked"),
        ).map(function (c) {
          return c.value;
        });
        updateTriggerLabel(trigger, checked);
        updateVariantCount();
        rebuildVisuals();
      });
    });
  }

  function updateTriggerLabel(trigger, selected) {
    var placeholder = trigger.querySelector(".pc-dropdown-select__placeholder");
    if (!placeholder) return;
    if (!selected.length) {
      placeholder.textContent = "Chọn giá trị...";
      placeholder.classList.remove("has-value");
    } else {
      placeholder.textContent = selected.join(", ");
      placeholder.classList.add("has-value");
    }
  }

  /* ================================================================
     SECTION 4 – SPECIFICATIONS
     ================================================================ */
  function getSpecGroupCount() {
    return document.querySelectorAll("#section-specs .pc-spec-group").length;
  }

  function reindexAllGroups() {
    document
      .querySelectorAll("#section-specs .pc-spec-group")
      .forEach(function (group, i) {
        group.setAttribute("data-group-index", i);
        var nameInput = group.querySelector(".pc-spec-group__name-input");
        if (nameInput)
          nameInput.setAttribute(
            "name",
            "specifications[" + i + "][groupName]",
          );
        group.querySelectorAll(".pc-spec-row").forEach(function (row, j) {
          var keyInput = row.querySelector(".pc-spec-row__name input");
          var valInput = row.querySelector(".pc-spec-row__value input");
          if (keyInput)
            keyInput.setAttribute(
              "name",
              "specifications[" + i + "][items][" + j + "][key]",
            );
          if (valInput)
            valInput.setAttribute(
              "name",
              "specifications[" + i + "][items][" + j + "][value]",
            );
        });
      });
  }

  function createSpecRow(groupIndex, rowIndex) {
    var row = document.createElement("div");
    row.className = "pc-spec-row";
    row.innerHTML =
      '<div class="pc-spec-row__name">' +
      '<input class="pc-input pc-input--spec" type="text"' +
      ' name="specifications[' +
      groupIndex +
      "][items][" +
      rowIndex +
      '][key]"' +
      ' placeholder="Tên thông số"/>' +
      "</div>" +
      '<div class="pc-spec-row__value">' +
      '<input class="pc-input pc-input--spec" type="text"' +
      ' name="specifications[' +
      groupIndex +
      "][items][" +
      rowIndex +
      '][value]"' +
      ' placeholder="Giá trị"/>' +
      "</div>" +
      '<button class="pc-spec-row__remove" type="button">' +
      '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<path d="M2 2l10 10M12 2L2 12"/></svg>' +
      "</button>";
    return row;
  }

  function createSpecGroup(groupIndex) {
    var group = document.createElement("div");
    group.className = "pc-spec-group";
    group.setAttribute("data-group-index", groupIndex);

    var head = document.createElement("div");
    head.className = "pc-spec-group__head";

    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "pc-spec-group__name-input";
    nameInput.placeholder = "Tên nhóm...";
    nameInput.name = "specifications[" + groupIndex + "][groupName]";
    nameInput.autocomplete = "off";

    var actions = document.createElement("div");
    actions.className = "pc-spec-group__actions";

    var addRowBtn = document.createElement("button");
    addRowBtn.type = "button";
    addRowBtn.className = "pc-spec-group__add-row";
    addRowBtn.title = "Thêm hàng";
    addRowBtn.innerHTML =
      '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 1v12M1 7h12" stroke-linecap="round"/></svg>';

    var collapseBtn = document.createElement("button");
    collapseBtn.type = "button";
    collapseBtn.className = "pc-spec-group__collapse";
    collapseBtn.title = "Thu gọn";
    collapseBtn.innerHTML =
      '<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4l3 3 3-3"/></svg>';

    var removeGrpBtn = document.createElement("button");
    removeGrpBtn.type = "button";
    removeGrpBtn.className = "pc-spec-group__remove";
    removeGrpBtn.title = "Xoá nhóm";
    removeGrpBtn.innerHTML =
      '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 2l10 10M12 2L2 12"/></svg>';

    actions.appendChild(addRowBtn);
    actions.appendChild(collapseBtn);
    actions.appendChild(removeGrpBtn);
    head.appendChild(nameInput);
    head.appendChild(actions);
    group.appendChild(head);

    var firstRow = createSpecRow(groupIndex, 0);
    group.appendChild(firstRow);
    return group;
  }

  function bindRowEvents(row, group) {
    var removeBtn = row.querySelector(".pc-spec-row__remove");
    if (!removeBtn) return;
    removeBtn.addEventListener("click", function () {
      var allRows = group.querySelectorAll(".pc-spec-row");
      if (allRows.length <= 1) return;
      row.style.transition = "opacity 0.12s ease";
      row.style.opacity = "0";
      setTimeout(function () {
        row.remove();
        reindexAllGroups();
      }, 130);
    });
  }

  function bindGroupEvents(group) {
    var collapseBtn = group.querySelector(".pc-spec-group__collapse");
    var addRowBtn = group.querySelector(".pc-spec-group__add-row");
    var removeGrpBtn = group.querySelector(".pc-spec-group__remove");

    if (collapseBtn) {
      collapseBtn.addEventListener("click", function () {
        var rows = group.querySelectorAll(".pc-spec-row");
        var svg = collapseBtn.querySelector("svg");
        var isCollapsed = collapseBtn.getAttribute("data-collapsed") === "true";
        if (isCollapsed) {
          rows.forEach(function (r) {
            r.style.display = "";
          });
          svg.style.transform = "";
          collapseBtn.setAttribute("data-collapsed", "false");
        } else {
          rows.forEach(function (r) {
            r.style.display = "none";
          });
          svg.style.transform = "rotate(-90deg)";
          collapseBtn.setAttribute("data-collapsed", "true");
        }
      });
    }

    if (addRowBtn) {
      addRowBtn.addEventListener("click", function () {
        var groupIndex = parseInt(group.getAttribute("data-group-index")) || 0;
        var rowIndex = group.querySelectorAll(".pc-spec-row").length;
        var row = createSpecRow(groupIndex, rowIndex);
        row.style.opacity = "0";
        row.style.transform = "translateX(-6px)";
        group.appendChild(row);
        requestAnimationFrame(function () {
          row.style.transition = "opacity 0.15s ease, transform 0.15s ease";
          row.style.opacity = "1";
          row.style.transform = "translateX(0)";
        });
        bindRowEvents(row, group);
        var keyInput = row.querySelector(".pc-spec-row__name input");
        if (keyInput) keyInput.focus();
      });
    }

    if (removeGrpBtn) {
      removeGrpBtn.addEventListener("click", function () {
        group.style.transition = "opacity 0.15s ease, transform 0.15s ease";
        group.style.opacity = "0";
        group.style.transform = "translateY(-6px)";
        setTimeout(function () {
          group.remove();
          reindexAllGroups();
        }, 160);
      });
    }

    group.querySelectorAll(".pc-spec-row").forEach(function (row) {
      bindRowEvents(row, group);
    });
  }

  function initSpecs() {
    document
      .querySelectorAll("#section-specs .pc-spec-group")
      .forEach(function (group) {
        bindGroupEvents(group);
      });

    var addGroupBtn = document.querySelector(".pc-btn-add-spec");
    if (!addGroupBtn) return;

    addGroupBtn.addEventListener("click", function () {
      var groupIndex = getSpecGroupCount();
      var group = createSpecGroup(groupIndex);
      var body = document.querySelector("#section-specs .pc-card__body");

      group.style.opacity = "0";
      group.style.transform = "translateY(8px)";
      body.insertBefore(group, addGroupBtn);
      requestAnimationFrame(function () {
        group.style.transition = "opacity 0.2s ease, transform 0.2s ease";
        group.style.opacity = "1";
        group.style.transform = "translateY(0)";
      });

      bindGroupEvents(group);
      var defaultRow = group.querySelector(".pc-spec-row");
      if (defaultRow) bindRowEvents(defaultRow, group);
      var nameInput = group.querySelector(".pc-spec-group__name-input");
      if (nameInput) nameInput.focus();
    });
  }

  /* ================================================================
     SCOPE-LEVEL DECLARATIONS
     ================================================================ */
  var rebuildVisuals = function () {};
  var rebuildVariants = function () {};

  /* ================================================================
     SECTION 5 – HÌNH ẢNH BIẾN THỂ
     ================================================================ */
  function initVisuals() {
    var grid = document.getElementById("visual-grid");
    var infoText = document.getElementById("visual-info-text");
    var emptyState = document.getElementById("visual-empty");
    var thumbInput = document.getElementById("upload-thumb-input");
    var galleryInput = document.getElementById("upload-gallery-input");

    if (!grid || !infoText || !emptyState || !thumbInput || !galleryInput)
      return;

    rebuildVisuals = function () {
      var attrCards = document.querySelectorAll(".pc-attr-card");
      var targetAttr = null;

      attrCards.forEach(function (card) {
        if (targetAttr) return;
        var affectsToggle = card.querySelector('input[name$="[affectsImage]"]');
        if (!affectsToggle || !affectsToggle.checked) return;
        var attrSelect = card.querySelector(".js-attr-select");
        var opt = attrSelect && attrSelect.selectedOptions[0];
        var attrName = opt && opt.value ? opt.text : null;
        if (!attrName || attrName === "Chọn thuộc tính...") return;
        var attrCode = opt.dataset.code || "";
        var checked = Array.from(
          card.querySelectorAll(".js-val-checkbox:checked"),
        ).map(function (cb) {
          return cb.value;
        });
        if (!checked.length) return;
        targetAttr = { name: attrName, code: attrCode, values: checked };
      });

      grid.innerHTML = "";

      if (!targetAttr) {
        emptyState.style.display = "";
        grid.style.display = "none";
        infoText.textContent =
          "Chưa có thuộc tính nào được chọn làm ảnh hưởng hình ảnh";
        return;
      }

      emptyState.style.display = "none";
      grid.style.display = "";
      infoText.innerHTML =
        "Hiển thị theo thuộc tính: <strong>" + targetAttr.name + "</strong>";

      targetAttr.values.forEach(function (val) {
        grid.appendChild(buildVisualCard(val, targetAttr.code));
      });
    };

    function buildVisualCard(val, attrCode) {
      var card = document.createElement("div");
      card.className = "pc-visual-card";
      card.innerHTML =
        '<div class="pc-visual-card__label">' +
        '<span class="pc-dot pc-dot--neutral"></span>' +
        '<span class="pc-visual-card__val">' +
        val +
        "</span>" +
        "</div>" +
        '<div class="pc-upload-zone pc-upload-zone--thumb js-thumb-zone">' +
        '<div class="pc-thumb-preview" style="display:none">' +
        '<img class="pc-thumb-img" src="" alt=""/>' +
        '<button class="pc-thumb-clear" type="button" title="Xoá ảnh">' +
        '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">' +
        '<path d="M2 2l10 10M12 2L2 12"/></svg></button>' +
        "</div>" +
        '<div class="pc-thumb-placeholder">' +
        '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1">' +
        '<rect x="3" y="5" width="26" height="22" rx="3"/>' +
        '<circle cx="11" cy="12" r="3"/>' +
        '<path d="M3 22l7-7 5 5 4-4 8 8"/></svg>' +
        "<span>Ảnh đại diện</span>" +
        '<span class="pc-upload-zone__hint">Click để chọn</span>' +
        "</div>" +
        '<input type="file" class="js-visual-thumb-file" accept="image/*"' +
        ' name="variantImages[' +
        attrCode +
        "][" +
        val +
        '][thumb]" style="display:none"/>' +
        "</div>" +
        '<div class="pc-upload-zone pc-upload-zone--gallery js-gallery-zone">' +
        '<div class="pc-gallery-grid js-gallery-grid" style="display:none"></div>' +
        '<div class="pc-gallery-placeholder">' +
        '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1">' +
        '<rect x="2" y="4" width="28" height="24" rx="3"/>' +
        '<path d="M2 20l8-8 6 6 5-5 9 9"/></svg>' +
        "<span>Thư viện ảnh</span>" +
        '<span class="pc-upload-zone__hint">Click để chọn nhiều ảnh</span>' +
        "</div>" +
        '<input type="file" class="js-visual-gallery-file" accept="image/*" multiple' +
        ' name="variantImages[' +
        attrCode +
        "][" +
        val +
        '][gallery][]" style="display:none"/>' +
        "</div>";
      initCardEvents(card);
      return card;
    }

    function initCardEvents(card) {
      var thumbZone = card.querySelector(".js-thumb-zone");
      var thumbPreview = card.querySelector(".pc-thumb-preview");
      var thumbImg = card.querySelector(".pc-thumb-img");
      var thumbPlaceholder = card.querySelector(".pc-thumb-placeholder");
      var thumbClear = card.querySelector(".pc-thumb-clear");
      var galleryZone = card.querySelector(".js-gallery-zone");
      var galleryGrid = card.querySelector(".js-gallery-grid");
      var galleryPlaceholder = card.querySelector(".pc-gallery-placeholder");
      var thumbFileInput = card.querySelector(".js-visual-thumb-file");
      var galleryFileInput = card.querySelector(".js-visual-gallery-file");

      thumbZone.addEventListener("click", function (e) {
        if (e.target.closest(".pc-thumb-clear")) return;
        thumbFileInput.value = "";
        thumbFileInput.click();
      });

      thumbClear.addEventListener("click", function (e) {
        e.stopPropagation();
        thumbImg.src = "";
        thumbPreview.style.display = "none";
        thumbPlaceholder.style.display = "";
        thumbFileInput.value = "";
      });

      galleryZone.addEventListener("click", function (e) {
        if (e.target.closest(".pc-gallery-item-remove")) return;
        galleryFileInput.value = "";
        galleryFileInput.click();
      });

      thumbFileInput.addEventListener("change", function () {
        if (!thumbFileInput.files.length) return;
        var reader = new FileReader();
        reader.onload = function (e) {
          thumbImg.src = e.target.result;
          thumbPreview.style.display = "";
          thumbPlaceholder.style.display = "none";
        };
        reader.readAsDataURL(thumbFileInput.files[0]);
      });

      galleryFileInput.addEventListener("change", function () {
        if (!galleryFileInput.files.length) return;
        applyGalleryFiles(
          Array.from(galleryFileInput.files),
          galleryGrid,
          galleryPlaceholder,
        );
      });

      setupDrop(thumbZone, function (files) {
        if (!files.length) return;
        var reader = new FileReader();
        reader.onload = function (e) {
          thumbImg.src = e.target.result;
          thumbPreview.style.display = "";
          thumbPlaceholder.style.display = "none";
        };
        reader.readAsDataURL(files[0]);
      });

      setupDrop(galleryZone, function (files) {
        if (!files.length) return;
        applyGalleryFiles(files, galleryGrid, galleryPlaceholder);
      });
    }

    thumbInput.addEventListener("change", function () {});
    galleryInput.addEventListener("change", function () {});

    function applyGalleryFiles(files, galleryGrid, galleryPlaceholder) {
      files.forEach(function (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
          addGalleryItem(galleryGrid, galleryPlaceholder, e.target.result);
        };
        reader.readAsDataURL(file);
      });
    }

    function addGalleryItem(galleryGrid, galleryPlaceholder, src) {
      galleryPlaceholder.style.display = "none";
      galleryGrid.style.display = "";
      var item = document.createElement("div");
      item.className = "pc-gallery-item";
      item.innerHTML =
        '<img src="' +
        src +
        '" alt=""/>' +
        '<button class="pc-gallery-item-remove" type="button" title="Xoá">' +
        '<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5">' +
        '<path d="M2 2l6 6M8 2L2 8"/></svg></button>';
      item
        .querySelector(".pc-gallery-item-remove")
        .addEventListener("click", function (e) {
          e.stopPropagation();
          item.remove();
          if (!galleryGrid.children.length) {
            galleryGrid.style.display = "none";
            galleryPlaceholder.style.display = "";
          }
        });
      galleryGrid.appendChild(item);
    }

    function setupDrop(zone, cb) {
      zone.addEventListener("dragover", function (e) {
        e.preventDefault();
        zone.classList.add("is-dragover");
      });
      zone.addEventListener("dragleave", function () {
        zone.classList.remove("is-dragover");
      });
      zone.addEventListener("drop", function (e) {
        e.preventDefault();
        zone.classList.remove("is-dragover");
        var files = Array.from(e.dataTransfer.files).filter(function (f) {
          return f.type.startsWith("image/");
        });
        cb(files);
      });
    }

    rebuildVisuals();
  }

  /* ================================================================
     SECTION 6 – BIẾN THỂ SẢN PHẨM
     ================================================================ */
  function initVariants() {
    var summary = document.getElementById("variant-summary");
    var summaryFormula = document.getElementById("variant-summary-formula");
    var summaryCount = document.getElementById("variant-summary-count");
    var toolbar = document.getElementById("variant-bulk-toolbar");
    var tableWrap = document.getElementById("variant-table-wrap");
    var tbody = document.getElementById("variant-tbody");
    var emptyState = document.getElementById("variant-empty");
    var checkAll = document.getElementById("variant-check-all");
    var btnApply = document.getElementById("btn-bulk-apply");

    if (!tbody || !emptyState) return;

    var DOT_COLORS = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
      "#84cc16",
    ];

    function cartesian(arrays) {
      if (!arrays.length) return [];
      return arrays.reduce(
        function (acc, arr) {
          var result = [];
          acc.forEach(function (prev) {
            arr.forEach(function (val) {
              result.push(prev.concat([val]));
            });
          });
          return result;
        },
        [[]],
      );
    }

    function getVariantAttrs() {
      var attrs = [];
      document.querySelectorAll(".pc-attr-card").forEach(function (card) {
        var toggle = card.querySelector('input[name$="[useForVariant]"]');
        if (!toggle || !toggle.checked) return;
        var select = card.querySelector(".js-attr-select");
        var opt = select && select.selectedOptions[0];
        if (!opt || !opt.value) return;
        var attrCode =
          opt.dataset.code ||
          opt.text.trim().toLowerCase().replace(/\s+/g, "_");
        var values = Array.from(
          card.querySelectorAll(".js-val-checkbox:checked"),
        ).map(function (cb) {
          return cb.value;
        });
        if (!values.length) return;
        attrs.push({ name: opt.text.trim(), code: attrCode, values: values });
      });
      return attrs;
    }

    function buildInputTd(name, type, placeholder, value) {
      var td = document.createElement("td");
      td.innerHTML =
        '<input class="pc-input pc-input--table" type="' +
        type +
        '"' +
        ' name="' +
        name +
        '"' +
        ' placeholder="' +
        placeholder +
        '"' +
        (value ? ' value="' + value + '"' : "") +
        ">";
      return td;
    }

    function setInput(el, selector, val) {
      var input = el.querySelector(selector);
      if (input) input.value = val;
    }

    function bindInlineEditor(tr) {
      var comboLabel = tr.querySelector(".pc-combo-label");
      var comboName = comboLabel ? comboLabel.textContent.trim() : "";
      var firstDot = tr.querySelector(".pc-combo-dot");
      var dotColor = firstDot ? firstDot.style.background : "#6b7280";

      var editor = document.createElement("div");
      editor.className = "pc-variant-inline-editor";
      editor.innerHTML =
        '<div class="pc-variant-inline-editor__header">' +
        '<div class="pc-variant-inline-editor__title">' +
        '<span class="pc-combo-dot" style="background:' +
        dotColor +
        '"></span>' +
        "<span>Chỉnh nhanh —</span>" +
        '<span class="pc-variant-inline-editor__combo-name">' +
        comboName +
        "</span>" +
        "</div>" +
        '<button type="button" class="pc-variant-inline-editor__close" title="Đóng">' +
        '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">' +
        '<path d="M2 2l10 10M12 2L2 12"/></svg></button>' +
        "</div>" +
        '<div class="pc-variant-inline-editor__fields">' +
        '<div class="pc-variant-inline-editor__field"><label>Giá gốc</label>' +
        '<input type="text" class="js-ie-price" placeholder="0 ₫"/></div>' +
        '<div class="pc-variant-inline-editor__field"><label>Giảm giá %</label>' +
        '<input type="text" class="js-ie-discount" placeholder="0%"/></div>' +
        '<div class="pc-variant-inline-editor__field"><label>Tồn kho</label>' +
        '<input type="number" class="js-ie-stock" placeholder="0"/></div>' +
        '<div class="pc-variant-inline-editor__field"><label>SKU</label>' +
        '<input type="text" class="js-ie-sku" placeholder="SKU"/></div>' +
        "</div>" +
        '<div class="pc-variant-inline-editor__actions">' +
        '<button type="button" class="pc-btn-cancel-inline">Huỷ</button>' +
        '<button type="button" class="pc-btn-confirm">' +
        '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">' +
        '<path d="M2 7l4 4 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        "Xác nhận</button>" +
        "</div>";

      var rowPrice = tr.querySelector('[name$="[price]"]');
      var rowDiscount = tr.querySelector('[name$="[discount]"]');
      var rowStock = tr.querySelector('[name$="[stock]"]');
      var rowSku = tr.querySelector('[name$="[sku]"]');

      var iePrice = editor.querySelector(".js-ie-price");
      var ieDiscount = editor.querySelector(".js-ie-discount");
      var ieStock = editor.querySelector(".js-ie-stock");
      var ieSku = editor.querySelector(".js-ie-sku");

      function openEditor() {
        document
          .querySelectorAll(".pc-variant-inline-editor.is-open")
          .forEach(function (e) {
            e.classList.remove("is-open");
          });
        document
          .querySelectorAll(".pc-table tbody tr.is-editing")
          .forEach(function (r) {
            r.classList.remove("is-editing");
          });
        iePrice.value = rowPrice ? rowPrice.value : "";
        ieDiscount.value = rowDiscount ? rowDiscount.value : "";
        ieStock.value = rowStock ? rowStock.value : "";
        ieSku.value = rowSku ? rowSku.value : "";
        editor.classList.add("is-open");
        tr.classList.add("is-editing");
        setTimeout(function () {
          iePrice.focus();
          iePrice.select();
        }, 50);
      }

      function closeEditor() {
        editor.classList.remove("is-open");
        tr.classList.remove("is-editing");
      }

      function confirmEditor() {
        if (rowPrice) rowPrice.value = iePrice.value;
        if (rowDiscount) rowDiscount.value = ieDiscount.value;
        if (rowStock) rowStock.value = ieStock.value;
        if (rowSku) rowSku.value = ieSku.value;
        var confirmBtn = editor.querySelector(".pc-btn-confirm");
        confirmBtn.classList.add("is-saved");
        confirmBtn.innerHTML =
          '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">' +
          '<path d="M2 7l4 4 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg> Đã lưu';
        setTimeout(function () {
          closeEditor();
          confirmBtn.classList.remove("is-saved");
          confirmBtn.innerHTML =
            '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">' +
            '<path d="M2 7l4 4 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg> Xác nhận';
        }, 700);
      }

      tr.addEventListener("click", function (e) {
        if (e.target.closest("input, button, .pc-variant-inline-editor"))
          return;
        if (editor.classList.contains("is-open")) return;
        openEditor();
      });

      editor
        .querySelector(".pc-variant-inline-editor__close")
        .addEventListener("click", closeEditor);
      editor
        .querySelector(".pc-btn-cancel-inline")
        .addEventListener("click", closeEditor);
      editor
        .querySelector(".pc-btn-confirm")
        .addEventListener("click", confirmEditor);

      editor.addEventListener("keydown", function (e) {
        if (e.key === "Enter") confirmEditor();
        if (e.key === "Escape") closeEditor();
      });

      document.addEventListener("click", function (e) {
        if (!editor.classList.contains("is-open")) return;
        if (!tr.contains(e.target) && !editor.contains(e.target)) closeEditor();
      });

      tr._editorEl = editor;
    }

    function createEditorRow(editorEl) {
      var editorTr = document.createElement("tr");
      editorTr.className = "pc-variant-editor-row";
      editorTr.style.cssText = "padding:0;border:none;background:transparent;";
      var td = document.createElement("td");
      td.colSpan = 9;
      td.style.cssText = "padding:0 8px 8px;border:none;";

      // [FIX] Xoá name + disable inputs trong editor để không submit
      editorEl.querySelectorAll("input").forEach(function (inp) {
        inp.removeAttribute("name");
        inp.disabled = true;
      });

      td.appendChild(editorEl);
      editorTr.appendChild(td);
      return editorTr;
    }

    function buildRow(combo, attrs, index) {
      var tr = document.createElement("tr");

      var tdCheck = document.createElement("td");
      tdCheck.className = "pc-table__check";
      tdCheck.innerHTML = '<input type="checkbox" class="js-variant-check">';
      tr.appendChild(tdCheck);

      var tdCombo = document.createElement("td");
      tdCombo.className = "pc-table__combo";
      var comboHTML = "";
      combo.forEach(function (val, i) {
        comboHTML +=
          '<span class="pc-combo-dot" style="background:' +
          DOT_COLORS[i % DOT_COLORS.length] +
          '"></span>';
      });
      comboHTML +=
        '<span class="pc-combo-label">' + combo.join(" · ") + "</span>";
      tdCombo.innerHTML = comboHTML;
      tr.appendChild(tdCombo);

      var namePfx = "variants[" + index + "]";

      tr.appendChild(buildInputTd(namePfx + "[price]", "text", "0 ₫"));
      tr.appendChild(buildInputTd(namePfx + "[discount]", "text", "0%"));
      tr.appendChild(buildInputTd(namePfx + "[stock]", "number", "0"));

      var titleInput = document.querySelector('input[name="title"]');
      var titleText = titleInput ? titleInput.value.trim() : "";
      var prefix = "";
      if (titleText) {
         var words = titleText.split(/\s+/);
         words.forEach(function(w) {
            var wordStr = w.replace(/[^0-9a-zA-Z]/g, "");
            if (!wordStr) return;
            var numMatch = wordStr.match(/^(\d+)/);
            if (numMatch) {
               prefix += numMatch[1];
               if (wordStr.length > numMatch[1].length) {
                 prefix += wordStr.charAt(numMatch[1].length).toUpperCase();
               }
            } else {
               var uppers = wordStr.substring(1).match(/[A-Z]/g);
               prefix += wordStr.charAt(0).toUpperCase();
               if (uppers && uppers.length > 0) {
                 prefix += uppers.join('');
               }
            }
         });
      }
      var prefixStr = prefix ? prefix + "-" : "";

      var skuSuffix = combo
        .map(function (v) {
          return v
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/gi, "D")
            .replace(/[^A-Z0-9]/g, "");
        })
        .join("-");
        
      var finalSku = prefixStr + skuSuffix;
      tr.appendChild(buildInputTd(namePfx + "[sku]", "text", "", finalSku));

      var tdThumb = document.createElement("td");
      tdThumb.className = "pc-table__thumb";
      tdThumb.innerHTML =
        '<div class="pc-thumb-upload js-variant-thumb" data-index="' +
        index +
        '">' +
        '<div class="pc-variant-thumb-preview" style="display:none">' +
        '<img src="" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:4px;">' +
        '<button type="button" class="pc-thumb-clear" title="Xoá ảnh">' +
        '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">' +
        '<path d="M2 2l10 10M12 2L2 12"/></svg></button></div>' +
        '<div class="pc-variant-thumb-placeholder">' +
        '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">' +
        '<path d="M8 3v10M3 8h10" stroke-linecap="round"/></svg></div>' +
        '<input type="file" class="js-variant-thumb-file" accept="image/*"' +
        ' name="variantThumbnail[' +
        index +
        ']" style="display:none"/>' +
        "</div>";
      tr.appendChild(tdThumb);
      bindThumbEvents(tdThumb);

      var tdStatus = document.createElement("td");
      tdStatus.innerHTML =
        '<label class="pc-variant-status-toggle">' +
        '<input type="hidden" name="' +
        namePfx +
        '[status]" value="active" class="js-variant-status-val">' +
        '<input type="checkbox" class="js-variant-active" checked>' +
        '<span class="pc-status-dot pc-status-dot--active">Hoạt động</span></label>';
      tdStatus
        .querySelector(".js-variant-active")
        .addEventListener("change", function () {
          var dot = tdStatus.querySelector(".pc-status-dot");
          var statusVal = tdStatus.querySelector(".js-variant-status-val");
          if (this.checked) {
            dot.className = "pc-status-dot pc-status-dot--active";
            dot.textContent = "Hoạt động";
            statusVal.value = "active";
          } else {
            dot.className = "pc-status-dot pc-status-dot--inactive";
            dot.textContent = "Tắt";
            statusVal.value = "inactive";
          }
        });
      tr.appendChild(tdStatus);

      var tdAct = document.createElement("td");
      tdAct.className = "pc-table__actions";
      tdAct.innerHTML =
        '<button class="pc-icon-btn" type="button" title="Chi tiết">' +
        '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">' +
        '<path d="M1 1h12v2H1zM1 6h12v2H1zM1 11h8v2H1z"/></svg></button>';
      tr.appendChild(tdAct);

      combo.forEach(function (val, i) {
        var attrCode = attrs[i] ? attrs[i].code : String(i);
        var hid = document.createElement("input");
        hid.type = "hidden";
        hid.name = namePfx + "[attributes][" + attrCode + "]";
        hid.value = val;
        tr.appendChild(hid);
      });

      bindInlineEditor(tr);
      return tr;
    }

    function bindThumbEvents(tdThumb) {
      var zone = tdThumb.querySelector(".js-variant-thumb");
      var preview = tdThumb.querySelector(".pc-variant-thumb-preview");
      var img = tdThumb.querySelector("img");
      var placeholder = tdThumb.querySelector(".pc-variant-thumb-placeholder");
      var clearBtn = tdThumb.querySelector(".pc-thumb-clear");
      var fileInput = tdThumb.querySelector(".js-variant-thumb-file");

      zone.addEventListener("click", function (e) {
        if (e.target.closest(".pc-thumb-clear")) return;
        fileInput.value = "";
        fileInput.click();
      });

      fileInput.addEventListener("change", function () {
        if (!fileInput.files.length) return;
        var reader = new FileReader();
        reader.onload = function (e) {
          img.src = e.target.result;
          preview.style.display = "";
          placeholder.style.display = "none";
        };
        reader.readAsDataURL(fileInput.files[0]);
      });

      if (clearBtn) {
        clearBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          img.src = "";
          preview.style.display = "none";
          placeholder.style.display = "";
          fileInput.value = "";
        });
      }
    }

    if (checkAll) {
      checkAll.addEventListener("change", function () {
        tbody.querySelectorAll(".js-variant-check").forEach(function (cb) {
          cb.checked = checkAll.checked;
        });
      });
    }

    if (btnApply) {
      btnApply.addEventListener("click", function () {
        var price = document.getElementById("bulk-price").value.trim();
        var discount = document.getElementById("bulk-discount").value.trim();
        var stock = document.getElementById("bulk-stock").value.trim();
        var skuPfx = document.getElementById("bulk-sku-prefix").value.trim();

        var anyChecked = Array.from(tbody.querySelectorAll("tr.pc-variant-data-row")).some(function(tr) {
           var cb = tr.querySelector(".js-variant-check");
           return cb && cb.checked;
        });

        tbody.querySelectorAll("tr.pc-variant-data-row").forEach(function (tr) {
          var checked = tr.querySelector(".js-variant-check");
          if (anyChecked && !(checked && checked.checked)) return;
          if (price) setInput(tr, '[name$="[price]"]', price);
          if (discount) setInput(tr, '[name$="[discount]"]', discount);
          if (stock) setInput(tr, '[name$="[stock]"]', stock);
          if (skuPfx) {
            var skuInput = tr.querySelector('[name$="[sku]"]');
            if (skuInput) {
              var parts = (skuInput.value || skuInput.placeholder || "").split(
                "-",
              );
              parts[0] = skuPfx;
              skuInput.value = parts.join("-");
            }
          }
        });
      });
    }

    rebuildVariants = function () {
      var attrs = getVariantAttrs();
      var combos = cartesian(
        attrs.map(function (a) {
          return a.values;
        }),
      );
      var hasVariants = combos.length > 0;

      if (summary) summary.style.display = hasVariants ? "" : "none";
      if (toolbar) toolbar.style.display = hasVariants ? "" : "none";
      if (tableWrap) tableWrap.style.display = hasVariants ? "" : "none";
      if (emptyState) emptyState.style.display = hasVariants ? "none" : "";

      if (!hasVariants) return;

      if (summaryFormula) {
        summaryFormula.innerHTML = attrs
          .map(function (a) {
            return "<strong>" + a.name + "</strong>";
          })
          .join(" <span>×</span> ");
      }
      if (summaryCount) summaryCount.textContent = combos.length;

      var existingData = {};
      tbody.querySelectorAll("tr.pc-variant-data-row").forEach(function (tr) {
        var comboEl = tr.querySelector(".pc-combo-label");
        if (!comboEl) return;
        var key = comboEl.textContent.trim();
        var prevImg = tr.querySelector(".pc-variant-thumb-preview img");
        var thumbUrl = "";
        if (prevImg && prevImg.src && /^https?:\/\//i.test(prevImg.src)) {
          thumbUrl = prevImg.src;
        }
        existingData[key] = {
          price: (tr.querySelector('[name$="[price]"]') || {}).value || "",
          discount:
            (tr.querySelector('[name$="[discount]"]') || {}).value || "",
          stock: (tr.querySelector('[name$="[stock]"]') || {}).value || "",
          sku: (tr.querySelector('[name$="[sku]"]') || {}).value || "",
          thumbUrl: thumbUrl,
        };
      });

      tbody.innerHTML = "";

      combos.forEach(function (combo, i) {
        var row = buildRow(combo, attrs, i);
        row.classList.add("pc-variant-data-row");

        var key = combo.join(" · ");
        if (existingData[key]) {
          var d = existingData[key];
          if (d.price) setInput(row, '[name$="[price]"]', d.price);
          if (d.discount) setInput(row, '[name$="[discount]"]', d.discount);
          if (d.stock) setInput(row, '[name$="[stock]"]', d.stock);
          if (d.sku) setInput(row, '[name$="[sku]"]', d.sku);
          if (d.thumbUrl) {
            var z = row.querySelector(".js-variant-thumb");
            var pv = row.querySelector(".pc-variant-thumb-preview");
            var im = row.querySelector(".pc-variant-thumb-preview img");
            var ph = row.querySelector(".pc-variant-thumb-placeholder");
            if (im && pv && ph) {
              im.src = d.thumbUrl;
              pv.style.display = "";
              ph.style.display = "none";
              row.setAttribute("data-existing-variant-thumb", d.thumbUrl);
            }
          }
        }

        tbody.appendChild(row);
        if (row._editorEl) {
          tbody.appendChild(createEditorRow(row._editorEl));
        }
      });
    };

    rebuildVariants();
  }

  /* ================================================================
     SIDEBAR IMAGE UPLOADS
     ================================================================ */
  function initSidebarUploads() {
    var thumbZone = document.getElementById("sidebar-thumb-zone");
    var thumbInput = document.getElementById("sidebar-thumb-input");

    if (!thumbZone || !thumbInput) {
      console.warn("⚠️ Sidebar thumb elements not found");
      return;
    }

    var thumbPreview = thumbZone.querySelector(".pc-sidebar-thumb-preview");
    var thumbPlaceholder = thumbZone.querySelector(
      ".pc-sidebar-thumb-placeholder",
    );
    var thumbImg = document.getElementById("sidebar-thumb-img");
    var thumbClear = thumbZone.querySelector(".pc-sidebar-thumb-clear");

    var initThumb = window.__PC_INITIAL_THUMB__;
    if (initThumb && /^https?:\/\//i.test(String(initThumb))) {
      thumbImg.src = initThumb;
      thumbPreview.style.display = "block";
      thumbPlaceholder.style.display = "none";
    }
    delete window.__PC_INITIAL_THUMB__;

    thumbZone.addEventListener("click", function (e) {
      if (e.target.closest(".pc-sidebar-thumb-clear")) return;
      thumbInput.click();
    });

    thumbInput.addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (file && file.type.startsWith("image/")) {
        var te = document.getElementById("thumbnailExistingField");
        if (te) te.value = "";
        var reader = new FileReader();
        reader.onload = function (e) {
          thumbImg.src = e.target.result;
          thumbPreview.style.display = "block";
          thumbPlaceholder.style.display = "none";
        };
        reader.readAsDataURL(file);
      }
    });

    if (thumbClear) {
      thumbClear.addEventListener("click", function (e) {
        e.stopPropagation();
        thumbImg.src = "";
        thumbPreview.style.display = "none";
        thumbPlaceholder.style.display = "flex";
        thumbInput.value = "";
        var te = document.getElementById("thumbnailExistingField");
        if (te) te.value = "";
      });
    }

    thumbZone.addEventListener("dragover", function (e) {
      e.preventDefault();
      thumbZone.style.borderColor = "var(--pc-accent)";
      thumbZone.style.background = "var(--pc-accent-dim)";
    });
    thumbZone.addEventListener("dragleave", function () {
      thumbZone.style.borderColor = "";
      thumbZone.style.background = "";
    });
    thumbZone.addEventListener("drop", function (e) {
      e.preventDefault();
      thumbZone.style.borderColor = "";
      thumbZone.style.background = "";
      var file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        var reader = new FileReader();
        reader.onload = function (e) {
          thumbImg.src = e.target.result;
          thumbPreview.style.display = "block";
          thumbPlaceholder.style.display = "none";
        };
        reader.readAsDataURL(file);
      }
    });

    var galleryZone = document.getElementById("sidebar-gallery-zone");
    var galleryInput = document.getElementById("sidebar-gallery-input");
    var galleryGrid = document.getElementById("sidebar-gallery-grid");
    var galleryAdd = document.getElementById("sidebar-gallery-add");
    var galleryCount = document.getElementById("sidebar-gallery-count");

    if (
      !galleryZone ||
      !galleryInput ||
      !galleryGrid ||
      !galleryAdd ||
      !galleryCount
    ) {
      console.warn("⚠️ Sidebar gallery elements not found");
      return;
    }

    var images = [];
    window.__pcSidebarGalleryImagesRef = images;

    function updateGalleryDisplay() {
      // Sync actual files to the galleryInput so they get submitted
      var dt = new DataTransfer();
      images.forEach(function (obj) {
        if (obj.file) dt.items.add(obj.file);
      });
      galleryInput.files = dt.files;

      var count = images.length;
      galleryCount.textContent = count + " / 20";
      if (count > 0) {
        galleryGrid.style.display = "grid";
        galleryAdd.style.display = "flex";
        galleryZone.style.display = "none";
      } else {
        galleryGrid.style.display = "none";
        galleryAdd.style.display = "none";
        galleryZone.style.display = "flex";
      }
      galleryGrid.innerHTML = "";
      images.forEach(function (obj, index) {
        var item = document.createElement("div");
        item.className = "pc-gallery-item";
        item.innerHTML =
          '<img src="' +
          obj.url +
          '" alt="Gallery ' +
          (index + 1) +
          '">' +
          '<button class="pc-gallery-item-remove" type="button" data-index="' +
          index +
          '">' +
          '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">' +
          '<path d="M2 2l10 10M12 2L2 12"/></svg></button>';
        item
          .querySelector(".pc-gallery-item-remove")
          .addEventListener("click", function (e) {
            e.stopPropagation();
            images.splice(index, 1);
            updateGalleryDisplay();
          });
        galleryGrid.appendChild(item);
      });
    }

    galleryZone.addEventListener("click", function () {
      if (images.length >= 20) {
        Swal.fire({ icon: 'warning', text: 'Đã đạt giới hạn 20 ảnh' });
        return;
      }
      galleryInput.click();
    });
    galleryAdd.addEventListener("click", function () {
      if (images.length >= 20) {
        Swal.fire({ icon: 'warning', text: 'Đã đạt giới hạn 20 ảnh' });
        return;
      }
      galleryInput.click();
    });
    galleryInput.addEventListener("change", function (e) {
      if (!e.target.files.length) return;
      var files = Array.from(e.target.files);
      var remaining = 20 - images.length;
      if (remaining <= 0) {
        Swal.fire({ icon: 'warning', text: 'Đã đạt giới hạn 20 ảnh' });
        return;
      }
      files.slice(0, remaining).forEach(function (file) {
        if (file.type.startsWith("image/")) {
          var reader = new FileReader();
          reader.onload = function (e) {
            images.push({ file: file, url: e.target.result, isExisting: false });
            updateGalleryDisplay();
          };
          reader.readAsDataURL(file);
        }
      });
    });

    galleryZone.addEventListener("dragover", function (e) {
      e.preventDefault();
      galleryZone.style.borderColor = "var(--pc-accent)";
      galleryZone.style.background = "var(--pc-accent-dim)";
    });
    galleryZone.addEventListener("dragleave", function () {
      galleryZone.style.borderColor = "";
      galleryZone.style.background = "";
    });
    galleryZone.addEventListener("drop", function (e) {
      e.preventDefault();
      galleryZone.style.borderColor = "";
      galleryZone.style.background = "";
      if (!e.dataTransfer || !e.dataTransfer.files.length) return;
      var files = Array.from(e.dataTransfer.files).filter(function (f) {
        return f.type.startsWith("image/");
      });
      var remaining = 20 - images.length;
      files.slice(0, remaining).forEach(function (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
          images.push({ file: file, url: e.target.result, isExisting: false });
          updateGalleryDisplay();
        };
        reader.readAsDataURL(file);
      });
    });

    var initUrls = window.__PC_INITIAL_GALLERY__;
    if (Array.isArray(initUrls) && initUrls.length) {
      initUrls.slice(0, 20).forEach(function (u) {
        if (u && typeof u === "string") {
          images.push({ file: null, url: u, isExisting: true });
        }
      });
      updateGalleryDisplay();
    }
    delete window.__PC_INITIAL_GALLERY__;
  }

  /* ================================================================
     FORM SUBMIT – SYNC TRƯỚC KHI GỬI
     ================================================================ */
  function initFormSubmit() {
    var form =
      document.getElementById("product-create-form") ||
      document.getElementById("product-edit-form");
    if (!form) return;

    // [FIX] Dùng document.querySelector thay vì form.querySelector
    // để tránh trường hợp scope miss
    var statusToggle = document.getElementById("statusToggle");
    var statusToggle = document.getElementById("statusToggle");
    var statusHidden = document.querySelector('input[name="status"]');
    var statusWrapper = document.querySelector(".pc-status-toggle");

    // [FIX] Hàm sync status tập trung, gọi ở nhiều nơi
    function syncStatus() {
      if (statusToggle && statusHidden) {
        statusHidden.value = statusToggle.checked ? "active" : "inactive";
        if (statusWrapper) {
          statusWrapper.classList.toggle("is-active", statusToggle.checked);
        }
        if (statusWrapper) {
          statusWrapper.classList.toggle("is-active", statusToggle.checked);
        }
        var labelNode = document.querySelector(".pc-status-toggle__label");
        if (labelNode) {
          labelNode.textContent = statusToggle.checked
            ? "Đang hoạt động"
            : "Dừng hoạt động";
        }
      }
    }

    // Sync ngay khi load
    syncStatus();

    // Lắng nghe cả change lẫn click để chắc chắn bắt được
    if (statusToggle) {
      statusToggle.addEventListener("change", syncStatus);
      statusToggle.addEventListener("click", syncStatus);
    }

    form.addEventListener("submit", function (e) {
      // [FIX] Sync status lần cuối trước khi gửi
      syncStatus();

      // Sync description từ contenteditable → hidden input
      var editor = document.getElementById("descriptionEditor");
      var hiddenDesc = document.getElementById("descriptionInput");
      if (editor && hiddenDesc) {
        hiddenDesc.value = editor.innerHTML.trim();
      }

      if (form.id === "product-edit-form") {
        form.querySelectorAll('input[name="imagesExisting"].js-pc-dynamic').forEach(function (n) {
          n.remove();
        });
        var gref = window.__pcSidebarGalleryImagesRef;
        if (gref && gref.length) {
          gref.forEach(function (obj) {
            if (obj.isExisting && obj.url) {
              var h = document.createElement("input");
              h.type = "hidden";
              h.name = "imagesExisting";
              h.value = obj.url;
              h.className = "js-pc-dynamic";
              form.appendChild(h);
            }
          });
        }

        form.querySelectorAll('input[name^="variants["].js-pc-variant-thumb-persist').forEach(function (n) {
          n.remove();
        });
        var vidx = 0;
        form.querySelectorAll("tr.pc-variant-data-row").forEach(function (tr) {
          var fileInp = tr.querySelector(".js-variant-thumb-file");
          var existing = tr.getAttribute("data-existing-variant-thumb");
          if (
            fileInp &&
            (!fileInp.files || !fileInp.files.length) &&
            existing
          ) {
            var h2 = document.createElement("input");
            h2.type = "hidden";
            h2.className = "js-pc-variant-thumb-persist";
            h2.name = "variants[" + vidx + "][thumbnail]";
            h2.value = existing;
            form.appendChild(h2);
          }
          vidx++;
        });
      }

      // Disable inputs trong editor rows để không submit
      document
        .querySelectorAll(".pc-variant-editor-row input")
        .forEach(function (inp) {
          inp.disabled = true;
        });

      // Disable unchecked checkboxes trong attr dropdowns
      document.querySelectorAll(".pc-attr-card").forEach(function (card) {
        var panel = card.querySelector(".pc-dropdown-select__panel");
        if (!panel) return;
        card
          .querySelectorAll('input[name$="[selectedValues][]"]')
          .forEach(function (inp) {
            if (!panel.contains(inp)) inp.disabled = true;
          });
        panel
          .querySelectorAll(".js-val-checkbox:not(:checked)")
          .forEach(function (cb) {
            cb.disabled = true;
          });
      });

      // Validate title (ưu tiên #productName — tránh trùng name="title" trong DOM lạ)
      var title =
        document.getElementById("productName") ||
        form.querySelector('[name="title"]');
      if (title && !String(title.value || "").trim()) {
        e.preventDefault();
        title.focus();
        title.classList.add("pc-input--error");
        Swal.fire({ icon: 'warning', text: 'Vui lòng nhập tên sản phẩm' });
        return;
      }

      // Validate brand
      var brandId = form.querySelector('[name="brand_id"]');
      if (brandId && !brandId.value) {
        e.preventDefault();
        brandId.focus();
        Swal.fire({ icon: 'warning', text: 'Vui lòng chọn thương hiệu' });
        return;
      }
    });

    form.querySelectorAll(".pc-input").forEach(function (input) {
      input.addEventListener("input", function () {
        input.classList.remove("pc-input--error");
      });
    });
  }

  function hydrateProductEdit(payload) {
    var product = payload.product;
    if (!product) return;

    var editor = document.getElementById("descriptionEditor");
    var hiddenDesc = document.getElementById("descriptionInput");
    if (editor) {
      editor.innerHTML = product.description || "";
    }
    if (hiddenDesc) {
      hiddenDesc.value = (product.description || "").trim();
    }

    var cid = product.category_id;
    var bid = product.brand_id;
    if (cid) {
      var idStr = String(cid);
      var item = document.querySelector(
        '.pc-category-item[data-category-id="' + idStr + '"]',
      );
      if (item) {
        item.click();
      }
    }

    if (
      typeof window.__populateBrandOptionsFromRootCategory === "function" &&
      cid
    ) {
      window.__populateBrandOptionsFromRootCategory(String(cid), bid ? String(bid) : "");
    }

    var specs = product.specifications || [];
    var btnSpec = document.getElementById("btnAddSpec");
    specs.forEach(function (spec) {
      if (btnSpec) btnSpec.click();
      var groups = document.querySelectorAll("#section-specs .pc-spec-group");
      var g = groups[groups.length - 1];
      if (!g) return;
      var nameInput = g.querySelector(".pc-spec-group__name-input");
      if (nameInput) nameInput.value = spec.groupName || "";
      var items = spec.items || [];
      items.forEach(function (it, idx) {
        if (idx > 0) {
          var addRow = g.querySelector(".pc-spec-group__add-row");
          if (addRow) addRow.click();
        }
        var rows = g.querySelectorAll(".pc-spec-row");
        var row = rows[rows.length - 1];
        if (!row) return;
        var keyIn = row.querySelector(".pc-spec-row__name input");
        var valIn = row.querySelector(".pc-spec-row__value input");
        if (keyIn) keyIn.value = it.key || "";
        if (valIn) valIn.value = it.value || "";
      });
    });

    var attrs = product.attributes || [];
    var btnAttr = document.getElementById("btnAddAttr");
    attrs.forEach(function (attr) {
      if (btnAttr) btnAttr.click();
      var container = document.getElementById("attr-cards-container");
      if (!container) return;
      var cards = container.querySelectorAll(".pc-attr-card");
      var card = cards[cards.length - 1];
      if (!card) return;
      var sel = card.querySelector(".js-attr-select");
      var aid = attr.attribute_id;
      var aidStr = aid != null && aid.toString ? aid.toString() : String(aid || "");
      if (sel && aidStr) {
        sel.value = aidStr;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
      (attr.selectedValues || []).forEach(function (val) {
        var cbs = card.querySelectorAll(".js-val-checkbox");
        for (var i = 0; i < cbs.length; i++) {
          if (cbs[i].value === val) {
            cbs[i].checked = true;
            cbs[i].dispatchEvent(new Event("change", { bubbles: true }));
            break;
          }
        }
      });
      var ufv = card.querySelector('input[name$="[useForVariant]"]');
      var afi = card.querySelector('input[name$="[affectsImage]"]');
      if (ufv) ufv.checked = !!attr.useForVariant;
      if (afi) afi.checked = !!attr.affectsImage;
    });
  }

  function applySavedVariants(variants) {
    if (!variants || !variants.length) return;

    function orderedVariantAttrCodes() {
      var codes = [];
      document.querySelectorAll(".pc-attr-card").forEach(function (card) {
        var toggle = card.querySelector('input[name$="[useForVariant]"]');
        if (!toggle || !toggle.checked) return;
        var sel = card.querySelector(".js-attr-select");
        var opt = sel && sel.selectedOptions[0];
        if (!opt || !opt.value) return;
        codes.push(opt.dataset.code || "");
      });
      return codes;
    }

    function comboKey(v, codes) {
      var at = v.attributes || {};
      return codes
        .map(function (code) {
          return at[code] != null ? String(at[code]) : "";
        })
        .join(" · ");
    }

    var codes = orderedVariantAttrCodes();
    document.querySelectorAll("tr.pc-variant-data-row").forEach(function (tr) {
      var labelEl = tr.querySelector(".pc-combo-label");
      if (!labelEl) return;
      var key = labelEl.textContent.trim();
      var match = null;
      for (var i = 0; i < variants.length; i++) {
        if (comboKey(variants[i], codes) === key) {
          match = variants[i];
          break;
        }
      }
      if (!match) return;

      var pi = tr.querySelector('[name$="[price]"]');
      var di = tr.querySelector('[name$="[discount]"]');
      var si = tr.querySelector('[name$="[stock]"]');
      var ki = tr.querySelector('[name$="[sku]"]');
      if (pi) pi.value = match.price != null ? String(match.price) : "";
      if (di) di.value = match.discount != null ? String(match.discount) : "";
      if (si) si.value = match.stock != null ? String(match.stock) : "";
      if (ki) ki.value = match.sku || "";

      var activeCb = tr.querySelector(".js-variant-active");
      var statusVal = tr.querySelector(".js-variant-status-val");
      var dot = tr.querySelector(".pc-status-dot");
      var isActive = match.status !== "inactive";
      if (activeCb) activeCb.checked = isActive;
      if (statusVal) statusVal.value = isActive ? "active" : "inactive";
      if (dot) {
        dot.className =
          "pc-status-dot " +
          (isActive ? "pc-status-dot--active" : "pc-status-dot--inactive");
        dot.textContent = isActive ? "Hoạt động" : "Tắt";
      }

      if (match.thumbnail && /^https?:\/\//i.test(match.thumbnail)) {
        var pv = tr.querySelector(".pc-variant-thumb-preview");
        var im = tr.querySelector(".pc-variant-thumb-preview img");
        var ph = tr.querySelector(".pc-variant-thumb-placeholder");
        if (im && pv && ph) {
          im.src = match.thumbnail;
          pv.style.display = "";
          ph.style.display = "none";
          tr.setAttribute("data-existing-variant-thumb", match.thumbnail);
        }
      }
    });
  }

  /* ================================================================
     INIT ALL
     ================================================================ */
  function init() {
    initModals();
    initCategorySelector();
    initSlug();
    initCharCount();
    initUploadZones();

    if (window.__PRODUCT_EDIT__) {
      window.__PC_INITIAL_THUMB__ =
        window.__PRODUCT_EDIT__.product.thumbnail || "";
      window.__PC_INITIAL_GALLERY__ = (
        window.__PRODUCT_EDIT__.product.images || []
      ).slice(0, 20);
    }

    initAttributes();
    initSpecs();

    if (window.__PRODUCT_EDIT__) {
      hydrateProductEdit(window.__PRODUCT_EDIT__);
    }

    initVisuals();
    initVariants();

    if (window.__PRODUCT_EDIT__) {
      rebuildVisuals();
      rebuildVariants();
      applySavedVariants(window.__PRODUCT_EDIT__.variants);
      delete window.__PRODUCT_EDIT__;
    } else {
      updateVariantCount();
    }

    initSidebarUploads();
    delete window.__PC_INITIAL_THUMB__;
    delete window.__PC_INITIAL_GALLERY__;
    initFormSubmit();
    updateChecklist();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
