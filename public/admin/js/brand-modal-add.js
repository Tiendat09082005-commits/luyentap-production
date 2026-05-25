(function () {
  'use strict';

  /* ── Selectors ──────────────────────────────────────────────── */
  const BACKDROP_ID   = 'modal-add-brand';
  const FORM_ID       = 'form-add-brand';
  const TRIGGER_SEL   = '[data-open-add-brand]';   // nút "+ Thêm thương hiệu"
  const CLOSE_SEL     = '[data-bm-close]';          // nút ×, nút Hủy

  /* ── DOM refs (lazy, resolved on DOMContentLoaded) ─────────── */
  let backdrop, form, titleInput, logoInput, logoImg, emptyState,
      removeLogoBtn;

  /* ── Open ───────────────────────────────────────────────────── */
  function openModal() {
    if (!backdrop) return;
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus first input after transition
    setTimeout(function () {
      if (titleInput) titleInput.focus();
    }, 220);
  }

  /* ── Close ──────────────────────────────────────────────────── */
  function closeModal() {
    if (!backdrop) return;
    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Reset sau khi transition xong
    setTimeout(resetForm, 220);
  }

  /* ── Reset form + preview ───────────────────────────────────── */
  function resetForm() {
    if (form)  form.reset();
    clearErrors();
    resetLogoPreview();
  }

  /* ── Logo preview ────────────────────────────────────────────── */
  function handleLogoChange(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({ icon: 'warning', text: 'Ảnh quá lớn. Vui lòng chọn ảnh dưới 2 MB.' });
      e.target.value = '';
      return;
    }

    var allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      Swal.fire({ icon: 'warning', text: 'Định dạng không hỗ trợ. Vui lòng chọn PNG, JPG, WEBP hoặc SVG.' });
      e.target.value = '';
      return;
    }

    var reader = new FileReader();
    reader.onload = function (ev) {
      if (!logoImg) return;
      logoImg.src = ev.target.result;
      logoImg.style.display = 'block';
      if (emptyState)    emptyState.style.display  = 'none';
      if (removeLogoBtn) removeLogoBtn.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }

  function resetLogoPreview() {
    if (logoInput)    logoInput.value    = '';
    if (logoImg)    { logoImg.src = '';  logoImg.style.display   = 'none'; }
    if (emptyState)   emptyState.style.display  = 'flex';
    if (removeLogoBtn) removeLogoBtn.style.display = 'none';
  }

  function handleRemoveLogo() {
    resetLogoPreview();
  }

  /* ── Basic client-side validation ───────────────────────────── */
  function validateForm() {
    clearErrors();
    var valid = true;

    if (!titleInput || !titleInput.value.trim()) {
      showError(titleInput, 'title');
      valid = false;
    }

    return valid;
  }

  function showError(input, key) {
    if (input) input.classList.add('is-invalid');
    var errEl = form && form.querySelector('[data-error="' + key + '"]');
    if (errEl) errEl.classList.add('is-visible');
  }

  function clearErrors() {
    if (!form) return;
    form.querySelectorAll('.is-invalid').forEach(function (el) {
      el.classList.remove('is-invalid');
    });
    form.querySelectorAll('.bm-error.is-visible').forEach(function (el) {
      el.classList.remove('is-visible');
    });
  }

  /* ── Keyboard trap (Escape) ─────────────────────────────────── */
  function handleKeyDown(e) {
    if (e.key === 'Escape' && backdrop && backdrop.classList.contains('is-open')) {
      closeModal();
    }
  }

  /* ── Click outside (backdrop) ───────────────────────────────── */
  function handleBackdropClick(e) {
    if (e.target === backdrop) closeModal();
  }

  /* ── Init ───────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    backdrop       = document.getElementById(BACKDROP_ID);
    form           = document.getElementById(FORM_ID);
    console.log(form);
    titleInput     = form && form.querySelector('#bm-title-input');
    logoInput      = form && form.querySelector('#bm-logo-input');
    logoImg        = form && form.querySelector('#bm-logo-img');
    emptyState     = form && form.querySelector('#bm-empty-state');
    removeLogoBtn  = form && form.querySelector('#bm-remove-logo');

    if (!backdrop) return; // guard: modal not on page

    /* Open triggers */
    document.querySelectorAll(TRIGGER_SEL).forEach(function (btn) {
      btn.addEventListener('click', openModal);
    });

    /* Close triggers (×, Hủy) */
    backdrop.querySelectorAll(CLOSE_SEL).forEach(function (el) {
      el.addEventListener('click', closeModal);
    });

    /* Backdrop click */
    backdrop.addEventListener('click', handleBackdropClick);

    /* Keyboard */
    document.addEventListener('keydown', handleKeyDown);

    /* Logo input change */
    if (logoInput) logoInput.addEventListener('change', handleLogoChange);

    /* Remove logo */
    if (removeLogoBtn) removeLogoBtn.addEventListener('click', handleRemoveLogo);

    /* Form submit — validate trước khi gửi */
    if (form) {
      form.addEventListener('submit', function (e) {
        if (!validateForm()) {
          e.preventDefault();
        }
      });
    }

    /* Clear error on input */
    if (titleInput) {
      titleInput.addEventListener('input', function () {
        titleInput.classList.remove('is-invalid');
        var errEl = form.querySelector('[data-error="title"]');
        if (errEl) errEl.classList.remove('is-visible');
      });
    }
  });

})();

