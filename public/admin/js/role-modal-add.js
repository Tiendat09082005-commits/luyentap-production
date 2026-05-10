(function () {
  'use strict';

  /* ── Selectors ──────────────────────────────────────────────── */
  const BACKDROP_ID   = 'modal-add-role';
  const FORM_ID       = 'form-add-role';
  const TRIGGER_SEL   = '[data-open-add-role]';   // nút "+ Thêm nhóm quyền"
  const CLOSE_SEL     = '[data-bm-close]';          // nút ×, nút Hủy

  /* ── DOM refs ─────────────────────────────────────────────── */
  let backdrop, form, titleInput;

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

  /* ── Reset form ─────────────────────────────────────────────── */
  function resetForm() {
    if (form) form.reset();
    clearErrors();
  }

  /* ── Basic client-side validation ───────────────────────────── */
  function validateForm() {
    clearErrors();
    let valid = true;

    if (!titleInput || !titleInput.value.trim()) {
      showError(titleInput, 'title');
      valid = false;
    }

    return valid;
  }

  function showError(input, key) {
    if (input) input.classList.add('is-invalid');
    const errEl = form && form.querySelector('[data-error="' + key + '"]');
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
    backdrop   = document.getElementById(BACKDROP_ID);
    form       = document.getElementById(FORM_ID);
    titleInput = form && form.querySelector('#bm-title-input');

    if (!backdrop) return;

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
        const errEl = form.querySelector('[data-error="title"]');
        if (errEl) errEl.classList.remove('is-visible');
      });
    }
  });

})();
