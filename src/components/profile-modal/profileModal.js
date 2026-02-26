import './profileModal.css';
import { getAuthUser } from '../../services/authState.js';
import {
  fetchProfileWithPhotos,
  uploadProfilePhoto,
  setPrimaryPhoto,
  deletePhoto,
  calculateAge,
  formatLastSeen
} from '../../services/profileService.js';

let activeModal = null;

function renderTags(tags) {
  if (!tags || !tags.length) return '<span>—</span>';
  return tags.map((t) => `<span class="profile-tag">${t}</span>`).join('');
}

function renderGallery(photos, isOwner) {
  if (!photos || !photos.length) {
    return '<p>Няма снимки.</p>';
  }

  return photos
    .map((photo) => {
      const primaryClass = photo.is_primary ? 'is-primary' : '';
      const controls = isOwner
        ? `<div class="profile-photo__actions">
             <button data-action="set-primary" data-photo-id="${photo.id}">Primary</button>
             <button data-action="delete-photo" data-photo-id="${photo.id}">Delete</button>
           </div>`
        : '';
      return `<div>
        <img src="${photo.photo_url}" class="profile-photo ${primaryClass}" alt="Profile photo" />
        ${controls}
      </div>`;
    })
    .join('');
}

function renderProfileContent({ profile, photos }, isOwner) {
  const age = calculateAge(profile?.birth_date);
  return `
    <div class="profile-meta">
      <div class="profile-field"><label>Град</label><span>${profile?.city || '—'}</span></div>
      <div class="profile-field"><label>Пол</label><span>${profile?.gender || '—'}</span></div>
      <div class="profile-field"><label>Години</label><span>${age || '—'}</span></div>
      <div class="profile-field"><label>Тегло</label><span>${profile?.weight_kg ? profile.weight_kg + ' кг' : '—'}</span></div>
      <div class="profile-field"><label>Ръст</label><span>${profile?.height_cm ? profile.height_cm + ' см' : '—'}</span></div>
      <div class="profile-field"><label>Какво търси</label><div class="profile-tags">${renderTags(profile?.looking_for)}</div></div>
      <div class="profile-field"><label>Фетиши</label><div class="profile-tags">${renderTags(profile?.fetishes)}</div></div>
      <div class="profile-field"><label>Последно онлайн</label><span>${formatLastSeen(profile?.last_seen_at)}</span></div>
      <div class="profile-field"><label>18+ верификация</label><span>${profile?.is_verified_18_plus ? 'Да' : 'Не'}</span></div>
    </div>
    <div class="profile-gallery">
      ${renderGallery(photos, isOwner)}
    </div>
    ${isOwner ? '<div class="profile-upload"><input type="file" accept="image/*" data-photo-upload /><button data-action="upload-photo">Качи снимка</button><small>Макс 5MB</small></div>' : ''}
  `;
}

async function loadProfile(modalEl, userId, isOwner) {
  const statusEl = modalEl.querySelector('[data-status]');
  const contentEl = modalEl.querySelector('[data-content]');
  statusEl.textContent = 'Зареждане...';
  statusEl.classList.remove('profile-status--error');
  try {
    const data = await fetchProfileWithPhotos(userId);
    statusEl.textContent = 'Профилът е зареден';
    contentEl.innerHTML = renderProfileContent(data, isOwner);
  } catch (err) {
    statusEl.textContent = err.message || 'Грешка при зареждане на профила';
    statusEl.classList.add('profile-status--error');
  }
}

async function handleActions(modalEl, userId) {
  const isOwner = getAuthUser()?.id === userId;
  modalEl.addEventListener('click', async (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    try {
      if (action === 'upload-photo') {
        const fileInput = modalEl.querySelector('[data-photo-upload]');
        const file = fileInput?.files?.[0];
        if (!file) return;
        await uploadProfilePhoto(userId, file, { setPrimary: true });
        await loadProfile(modalEl, userId, isOwner);
      }
      if (action === 'set-primary') {
        const photoId = e.target.dataset.photoId;
        await setPrimaryPhoto(userId, photoId);
        await loadProfile(modalEl, userId, isOwner);
      }
      if (action === 'delete-photo') {
        const photoId = e.target.dataset.photoId;
        await deletePhoto(userId, photoId);
        await loadProfile(modalEl, userId, isOwner);
      }
    } catch (err) {
      const statusEl = modalEl.querySelector('[data-status]');
      statusEl.textContent = err.message || 'Грешка при действие';
      statusEl.classList.add('profile-status--error');
    }
  });
}

export async function openProfileModal(userId, { title = 'Профил', closable = true } = {}) {
  if (activeModal) {
    activeModal.remove();
    activeModal = null;
  }

  const currentUser = getAuthUser();
  const isOwner = currentUser && currentUser.id === userId;

  const backdrop = document.createElement('div');
  backdrop.className = 'profile-modal__backdrop';
  backdrop.innerHTML = `
    <div class="profile-modal">
      <div class="profile-modal__header">
        <h2 class="profile-modal__title">${title}</h2>
        ${closable ? '<button class="profile-modal__close" aria-label="Close">×</button>' : ''}
      </div>
      <p class="profile-status" data-status>Зареждане...</p>
      <div data-content></div>
    </div>
  `;

  if (closable) {
    backdrop.querySelector('.profile-modal__close').addEventListener('click', () => {
      backdrop.remove();
      activeModal = null;
    });
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.remove();
        activeModal = null;
      }
    });
  }

  document.body.append(backdrop);
  activeModal = backdrop;

  await loadProfile(backdrop.querySelector('.profile-modal'), userId, isOwner);
  handleActions(backdrop.querySelector('.profile-modal'), userId);
}
