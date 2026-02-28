import './profile.css';
import profileTemplate from './profile.html?raw';
import toast from '../../components/toast/toast.js';
import { fetchProfileWithPhotos, calculateAge, formatLastSeen } from '../../services/profileService.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatGender(value) {
  if (!value) return '—';
  const normalized = String(value).toLowerCase();
  if (normalized === 'male') return 'Мъж';
  if (normalized === 'female') return 'Жена';
  if (normalized === 'couple') return 'Двойка';
  return value;
}

function renderFact(label, value) {
  return `<div class="public-profile-fact"><span class="public-profile-fact__label">${label}</span><span class="public-profile-fact__value">${escapeHtml(value || '—')}</span></div>`;
}

function renderTags(container, items) {
  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = '<p class="public-profile-empty">Няма добавени тагове.</p>';
    return;
  }

  container.innerHTML = items
    .map((item) => `<span class="public-profile-tag">${escapeHtml(item)}</span>`)
    .join('');
}

function renderGallery(container, photos) {
  if (!Array.isArray(photos) || photos.length === 0) {
    container.innerHTML = '<p class="public-profile-empty">Няма видими снимки.</p>';
    return;
  }

  container.innerHTML = photos
    .map(
      (photo) =>
        `<img class="public-profile-photo" src="${escapeHtml(photo.photo_url)}" alt="Профилна снимка" loading="lazy" />`
    )
    .join('');
}

function setupActions(page, profileName) {
  page.addEventListener('click', (event) => {
    const action = event.target?.dataset?.action;
    if (!action) return;

    if (action === 'message') {
      toast.info('Модулът за съобщения ще се свърже в следваща стъпка.', { title: `Съобщение до ${profileName}` });
      return;
    }

    if (action === 'friend') {
      toast.info('Добавянето в приятели ще се свърже в следваща стъпка.', { title: `Приятелство с ${profileName}` });
      return;
    }

    if (action === 'like') {
      toast.success('Профилът е харесан.', { title: 'Харесване' });
    }
  });
}

async function loadPublicProfile(page, userId) {
  const statusEl = page.querySelector('[data-status]');
  const nameEl = page.querySelector('[data-name]');
  const metaEl = page.querySelector('[data-meta]');
  const avatarEl = page.querySelector('[data-avatar]');
  const coverEl = page.querySelector('[data-cover]');
  const factsEl = page.querySelector('[data-facts]');
  const aboutEl = page.querySelector('[data-about]');
  const lookingForEl = page.querySelector('[data-looking-for]');
  const fetishesEl = page.querySelector('[data-fetishes]');
  const galleryEl = page.querySelector('[data-gallery]');

  statusEl.textContent = 'Зареждане на профила...';
  statusEl.classList.remove('error');

  try {
    const { profile, photos } = await fetchProfileWithPhotos(userId);

    if (!profile) {
      statusEl.textContent = 'Профилът не е намерен.';
      statusEl.classList.add('error');
      return;
    }

    const age = calculateAge(profile.birth_date);
    const approvedPhotos = (photos || []).filter((photo) => (photo.approval_status || 'approved') === 'approved');
    const primaryPhoto = approvedPhotos.find((photo) => photo.is_primary) || approvedPhotos[0] || null;

    const profileName = profile.username || 'Профил';
    const city = profile.city || '—';

    nameEl.textContent = profileName;
    metaEl.textContent = `${city}${age ? `, ${age} г.` : ''}`;
    statusEl.textContent = profile.is_online ? 'Онлайн' : 'Профилът е зареден';

    if (primaryPhoto?.photo_url || profile.avatar_url) {
      const avatarUrl = primaryPhoto?.photo_url || profile.avatar_url;
      avatarEl.innerHTML = `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(profileName)}" />`;
      coverEl.style.backgroundImage = `url('${avatarUrl.replace(/'/g, "\\'")}')`;
      coverEl.classList.add('has-image');
    } else {
      avatarEl.textContent = profileName.charAt(0).toUpperCase();
    }

    factsEl.innerHTML = [
      renderFact('Потребител', profile.username || '—'),
      renderFact('Възраст', age ? `${age} г.` : '—'),
      renderFact('Пол', formatGender(profile.gender)),
      renderFact('Град', profile.city || '—'),
      renderFact('Ръст', profile.height_cm ? `${profile.height_cm} см` : '—'),
      renderFact('Тегло', profile.weight_kg ? `${profile.weight_kg} кг` : '—'),
      renderFact('18+ верификация', profile.is_verified_18_plus ? 'Да' : 'Не'),
      renderFact('Последно онлайн', formatLastSeen(profile.last_seen_at))
    ].join('');

    aboutEl.textContent = profile.bio || profile.about || 'Потребителят все още не е добавил описание.';
    renderTags(lookingForEl, profile.looking_for || []);
    renderTags(fetishesEl, profile.fetishes || []);
    renderGallery(galleryEl, approvedPhotos);
    setupActions(page, profileName);
  } catch (error) {
    statusEl.textContent = error?.message || 'Възникна грешка при зареждането на профила.';
    statusEl.classList.add('error');
  }
}

export function renderPublicProfilePage(context = {}) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = profileTemplate;
  const page = wrapper.firstElementChild;

  const userId = context?.params?.id;
  if (!userId) {
    const statusEl = page.querySelector('[data-status]');
    statusEl.textContent = 'Липсва идентификатор на профил.';
    statusEl.classList.add('error');
    return page;
  }

  loadPublicProfile(page, userId);
  return page;
}
