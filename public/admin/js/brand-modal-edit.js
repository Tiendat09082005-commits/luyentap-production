(function () {
  'use strict';

  const BACKDROP_ID = 'modal-edit-brand';
  const FORM_ID     = 'form-edit-brand';
  const CLOSE_SEL   = '[data-bem-close]';

  let backdrop, form, titleInput, descInput, logoInput,
      logoImg, emptyState, removeLogoBtn;

  /* ── Open & populate data ── */
  window.openEditModal = function (btn) {
    const id          = btn.dataset.id;
    const title       = btn.dataset.title       || '';
    const description = btn.dataset.description || '';
    const logo        = btn.dataset.logo        || '';
    const status      = btn.dataset.status      || 'active';

    // Set action URL
    form.action = `/admin/brands/edit/${id}`;

    // Populate fields
    titleInput.value = title;
    descInput.value  = description;

    // Set status radio
    form.querySelectorAll('input[name="status"]').forEach(function (radio) {
      radio.checked = (radio.value === status);
    });

    // Logo preview
    if (logo) {
      logoImg.src          = logo;
      logoImg.style.display    = 'block';
      emptyState.style.display = 'none';
      removeLogoBtn.style.display = 'flex';
    } else {
      resetLogoPreview();
    }

    // Open
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { titleInput.focus(); }, 220);
  };

  function closeModal() {
    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(resetForm, 220);
  }

  function resetForm() {
    form.reset();
    clearErrors();
    resetLogoPreview();
  }

  function resetLogoPreview() {
    if (logoInput)    logoInput.value = '';
    if (logoImg)    { logoImg.src = ''; logoImg.style.display = 'none'; }
    if (emptyState)   emptyState.style.display = 'flex';
    if (removeLogoBtn) removeLogoBtn.style.display = 'none';
  }

  function handleLogoChange(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Ảnh quá lớn. Vui lòng chọn ảnh dưới 2 MB.');
      e.target.value = '';
      return;
    }
    var reader = new FileReader();
    reader.onload = function (ev) {
      logoImg.src = ev.target.result;
      logoImg.style.display    = 'block';
      emptyState.style.display = 'none';
      removeLogoBtn.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }

  function validateForm() {
    clearErrors();
    if (!titleInput.value.trim()) {
      titleInput.classList.add('is-invalid');
      var errEl = form.querySelector('[data-error="title"]');
      if (errEl) errEl.classList.add('is-visible');
      return false;
    }
    return true;
  }

  function clearErrors() {
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    form.querySelectorAll('.bm-error.is-visible').forEach(el => el.classList.remove('is-visible'));
  }

  document.addEventListener('DOMContentLoaded', function () {
    backdrop      = document.getElementById(BACKDROP_ID);
    form          = document.getElementById(FORM_ID);
    titleInput    = form && form.querySelector('#bem-title-input');
    descInput     = form && form.querySelector('#bem-desc-input');
    logoInput     = form && form.querySelector('#bem-logo-input');
    logoImg       = form && form.querySelector('#bem-logo-img');
    emptyState    = form && form.querySelector('#bem-empty-state');
    removeLogoBtn = form && form.querySelector('#bem-remove-logo');

    if (!backdrop) return;

    backdrop.querySelectorAll(CLOSE_SEL).forEach(el => el.addEventListener('click', closeModal));
    backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && backdrop.classList.contains('is-open')) closeModal();
    });

    if (logoInput)    logoInput.addEventListener('change', handleLogoChange);
    if (removeLogoBtn) removeLogoBtn.addEventListener('click', resetLogoPreview);

    if (form) {
      form.addEventListener('submit', function (e) {
        if (!validateForm()) e.preventDefault();
      });
    }

    if (titleInput) {
      titleInput.addEventListener('input', function () {
        titleInput.classList.remove('is-invalid');
        var errEl = form.querySelector('[data-error="title"]');
        if (errEl) errEl.classList.remove('is-visible');
      });
    }
  });

})();   