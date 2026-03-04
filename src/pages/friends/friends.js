import './friends.css';
import friendsTemplate from './friends.html?raw';
import { getFriendsWithProfiles, removeFriend } from '../../services/friendService.js';
import { calculateAge, formatLastSeen } from '../../services/profileService.js';
import { router } from '../../router/router.js';
import toast from '../../components/toast/toast.js';
import { showConfirm } from '../../components/dialog/dialog.js';

function getGenderSymbol(gender) {
  const normalized = String(gender || '').toLowerCase();
  if (normalized === 'male') return '♂';
  if (normalized === 'female') return '♀';
  if (normalized === 'couple') return '⚥';
  return '';
}

function formatCoupleMeta(profile) {
  const age1 = calculateAge(profile.partner1_birth_date || profile.birth_date);
  const age2 = calculateAge(profile.partner2_birth_date);

  if (age1 && age2) {
    const p1 = `${age1}${getGenderSymbol(profile.partner1_gender)}`;
    const p2 = `${age2}${getGenderSymbol(profile.partner2_gender)}`;
    return `${p1} + ${p2}`;
  }

  if (age1) {
    return `${age1}${getGenderSymbol(profile.partner1_gender || profile.gender)} г.`;
  }

  return '';
}

function createFriendCard(friend) {
  const card = document.createElement('div');
  card.className = 'friend-card';
  card.dataset.userId = friend.id;

  const avatarUrl = friend.avatar_url || 'https://placehold.co/100x100/182436/8eb7f1?text=U';
  const username = friend.username || 'Неизвестен';
  const city = friend.city || 'Неизвестно';
  const coupleMeta = formatCoupleMeta(friend);
  const isOnline = friend.is_online;
  const onlineBadge = isOnline ? '<div class="friend-card__online-badge" title="Онлайн"></div>' : '';

  const friendshipDate = friend.friendship_created_at
    ? new Date(friend.friendship_created_at).toLocaleDateString('bg-BG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '';

  card.innerHTML = `
    <div class="friend-card__header">
      <div class="friend-card__avatar">
        <img src="${avatarUrl}" alt="${username}" loading="lazy" />
        ${onlineBadge}
      </div>
      <h3 class="friend-card__username">${username}</h3>
      <p class="friend-card__meta">${coupleMeta || '—'}</p>
      <p class="friend-card__location">
        <i class="bi bi-geo-alt-fill"></i>
        <span>${city}</span>
      </p>
    </div>
    <div class="friend-card__body">
      <div class="friend-card__actions">
        <button type="button" class="btn btn-sm btn-outline-info" data-action="profile">
          <i class="bi bi-person me-1"></i>Профил
        </button>
        <button type="button" class="btn btn-sm btn-outline-primary" data-action="message">
          <i class="bi bi-chat-dots me-1"></i>Съобщение
        </button>
        <button type="button" class="btn btn-sm btn-outline-danger" data-action="remove">
          <i class="bi bi-person-x"></i>
        </button>
      </div>
      ${friendshipDate ? `<p class="friend-card__friendship-date">Приятели от ${friendshipDate}</p>` : ''}
    </div>
  `;

  return card;
}

export function renderFriendsPage() {
  const container = document.createElement('div');
  container.className = 'w-100';
  container.innerHTML = friendsTemplate;

  const grid = container.querySelector('[data-friends-grid]');
  const noFriendsMsg = container.querySelector('.no-friends-message');
  const friendsCountBadge = container.querySelector('[data-friends-count]');

  loadFriends();

  async function loadFriends() {
    try {
      grid.innerHTML = `
        <div class="loading-message text-center text-muted p-5">
          <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
          <p>Зареждане на приятели...</p>
        </div>
      `;
      noFriendsMsg.hidden = true;

      const friends = await getFriendsWithProfiles();

      if (!friends || friends.length === 0) {
        grid.innerHTML = '';
        noFriendsMsg.hidden = false;
        friendsCountBadge.textContent = '0';
        return;
      }

      friendsCountBadge.textContent = friends.length.toString();
      grid.innerHTML = '';
      noFriendsMsg.hidden = true;

      friends.forEach((friend) => {
        const card = createFriendCard(friend);
        grid.appendChild(card);
      });
    } catch (error) {
      console.error('Error loading friends:', error);
      grid.innerHTML = `
        <div class="text-center text-danger p-5">
          <i class="bi bi-exclamation-triangle fs-1 mb-3 d-block"></i>
          <p>Грешка при зареждане на приятели.</p>
        </div>
      `;
    }
  }

  // Event delegation for friend card actions
  grid.addEventListener('click', async (event) => {
    const card = event.target.closest('.friend-card');
    if (!card) return;

    const actionBtn = event.target.closest('[data-action]');
    const action = actionBtn?.dataset?.action;
    const userId = card.dataset.userId;
    const username = card.querySelector('.friend-card__username')?.textContent || 'този потребител';

    if (!action || !userId) {
      // Click on card itself (not a button) - go to profile
      router.navigate(`/profile/${userId}`);
      return;
    }

    if (action === 'profile') {
      router.navigate(`/profile/${userId}`);
    } else if (action === 'message') {
      router.navigate(`/messages?userId=${userId}`);
    } else if (action === 'remove') {
      const confirmed = await showConfirm(
        `Сигурни ли сте, че искате да премахнете ${username} от приятели?`,
        {
          title: 'Премахване на приятел',
          confirmText: 'Премахни',
          cancelText: 'Отказ',
          confirmClass: 'btn-danger'
        }
      );

      if (!confirmed) return;

      try {
        actionBtn.disabled = true;
        await removeFriend(userId);
        toast.success(`${username} е премахнат/а от приятели.`, { title: 'Приятелство' });
        // Reload friends
        await loadFriends();
      } catch (error) {
        console.error('Error removing friend:', error);
        toast.error(error.message || 'Грешка при премахване на приятел.', { title: 'Грешка' });
        actionBtn.disabled = false;
      }
    }
  });

  return container;
}
