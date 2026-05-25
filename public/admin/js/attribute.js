// ── ELEMENTS ──
const modal      = document.getElementById('attributeModal');
const openBtn    = document.querySelector('a[href="/admin/attribute/create"]');
const closeBtn   = document.getElementById('modalClose');
const cancelBtn  = document.getElementById('modalCancel');
const modalTitle = document.querySelector('.modal-box__title');
const modalSub   = document.querySelector('.modal-box__sub');
const submitSpan = document.querySelector('.modal-box__footer .btn--primary span');
const statusSel  = document.querySelector('select[name="status"]');
const titleInput = document.getElementById('attrTitle');
const slugPreview= document.getElementById('slugPreview');
const valInput   = document.getElementById('valInput');
const addValBtn  = document.getElementById('addValBtn');
const tagsWrap   = document.getElementById('tagsWrap');
const valuesHidden = document.getElementById('valuesHidden');

let editingSlug = null;

// ── HELPERS ──
function getValues() {
  return Array.from(tagsWrap.querySelectorAll('.tag'))
    .map(t => t.querySelector('.tag-label').textContent.trim());
}

function updateHidden() {
  valuesHidden.value = getValues().join(',');
}

function addTag(val) {
  val = val.trim();
  if (!val || getValues().includes(val)) { valInput.value = ''; return; }
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.innerHTML = `<span class="tag-label">${val}</span><span class="tag-remove">×</span>`;
  tag.querySelector('.tag-remove').addEventListener('click', () => {
    tag.remove(); updateHidden();
  });
  tagsWrap.appendChild(tag);
  valInput.value = '';
  valInput.focus();
  updateHidden();
}

function resetModal() {
  editingSlug            = null;
  modalTitle.textContent = 'Thêm thuộc tính mới';
  modalSub.textContent   = 'Điền thông tin và các giá trị cho thuộc tính';
  submitSpan.textContent = 'Lưu thuộc tính';
  document.getElementById('attributeForm').reset();
  tagsWrap.innerHTML     = '';
  slugPreview.textContent= '-';
}

function openModal() {
  modal.classList.add('is-open');
}

function closeModal() {
  modal.classList.remove('is-open');
  resetModal();
}

// ── OPEN / CLOSE ──
if (openBtn) {
  openBtn.addEventListener('click', e => {
    e.preventDefault();
    resetModal();
    openModal();
  });
}

closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

// ── AUTO SLUG ──
titleInput.addEventListener('input', () => {
  const slug = titleInput.value.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-');
  slugPreview.textContent = slug || '-';
});

// ── ADD TAG ──
addValBtn.addEventListener('click', () => addTag(valInput.value));
valInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); addTag(valInput.value); }
});

// ── MỞ MODAL SỬA (đọc từ data-* không cần fetch) ──
document.querySelectorAll('.action-btn--edit').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();

    editingSlug            = btn.dataset.slug;
    modalTitle.textContent = 'Chỉnh sửa thuộc tính';
    modalSub.textContent   = 'Cập nhật thông tin cho thuộc tính';
    submitSpan.textContent = 'Cập nhật';

    titleInput.value                           = btn.dataset.title;
    document.getElementById('attrCode').value  = btn.dataset.code;
    slugPreview.textContent                    = btn.dataset.slug;
    statusSel.value                            = btn.dataset.status;

    tagsWrap.innerHTML = '';
    const values = btn.dataset.values ? btn.dataset.values.split(',') : [];
    values.forEach(val => addTag(val.trim()));
    updateHidden();

    openModal();
  });
});

// ── DELETE ──
document.querySelectorAll('.action-btn--delete').forEach(btn => {
  btn.addEventListener('click', () => {
    const row   = btn.closest('tr');
    const slug  = row.querySelector('.attr-slug').textContent.trim();
    const title = row.querySelector('.attr-title').textContent.trim();

    Swal.fire({
      icon: 'warning',
      title: 'Xác nhận xóa',
      text: `Bạn có chắc muốn xóa thuộc tính "${title}" không?`,
      showCancelButton: true,
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#FFFFFF'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/admin/attribute/delete/${slug}`, {
            method: 'DELETE',
            headers: window.withCsrfHeaders({ 'Content-Type': 'application/json' })
          });

          if (res.ok) {
            row.style.transition = 'opacity 0.25s ease';
            row.style.opacity    = '0';
            setTimeout(() => row.remove(), 250);
          } else {
            const err = await res.json();
            Swal.fire({ icon: 'error', text: err.message || 'Xóa thất bại.' });
          }
        } catch (err) {
          console.error(err);
          Swal.fire({ icon: 'error', text: 'Không thể kết nối server.' });
        }
      }
    });
  });
});

// ── SUBMIT (thêm mới + cập nhật) ──
document.getElementById('attributeForm').addEventListener('submit', async e => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const code  = document.getElementById('attrCode').value.trim();

  if (!title) { titleInput.style.borderColor = '#e24b4a'; titleInput.focus(); return; }
  if (!code)  { document.getElementById('attrCode').style.borderColor = '#e24b4a'; document.getElementById('attrCode').focus(); return; }
  titleInput.style.borderColor = '';
  document.getElementById('attrCode').style.borderColor = '';

  updateHidden();

  const url    = editingSlug ? `/admin/attribute/edit/${editingSlug}` : '/admin/attribute/create';
  const method = editingSlug ? 'PATCH' : 'POST';
  const formData = new FormData(document.getElementById('attributeForm'));

  try {
    const res = await fetch(url, {
      method,
      headers: window.withCsrfHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(Object.fromEntries(formData))
    });

    if (res.ok) {
      closeModal();
      window.location.reload();
    } else {
      const err = await res.json();
      Swal.fire({ icon: 'error', text: err.message || 'Có lỗi xảy ra.' });
    }
  } catch (err) {
    console.error(err);
    Swal.fire({ icon: 'error', text: 'Không thể kết nối server.' });
  }
});

// ── RESET BORDER KHI GÕ LẠI ──
['attrTitle', 'attrCode'].forEach(id => {
  document.getElementById(id).addEventListener('input', function () {
    this.style.borderColor = '';
  });
});
