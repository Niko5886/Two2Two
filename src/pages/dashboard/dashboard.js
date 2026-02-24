import './dashboard.css';
import dashboardTemplate from './dashboard.html?raw';
import { supabase } from '../../services/supabaseClient.js';

const AVATAR_EMOJIS = ['👨', '👩', '🧑', '👨‍🦱', '👩‍🦱', '🧑‍🦱'];

function getAvatarEmoji(userId) {
  const seed = userId.charCodeAt(0) + userId.charCodeAt(1);
  return AVATAR_EMOJIS[seed % AVATAR_EMOJIS.length];
}

function createUserCard(user) {
  const card = document.createElement('div');
  card.className = 'user-card';

  const statusClass = user.is_online ? 'online' : 'offline';
  const statusText = user.is_online ? 'Online' : 'Offline';

  card.innerHTML = `
    <div class="user-card-header">
      <div class="user-avatar-container">
        <div class="user-avatar">
          ${user.avatar_url ? `<img src="${user.avatar_url}" alt="${user.username}">` : getAvatarEmoji(user.id)}
        </div>
        <div class="status-indicator ${statusClass}"></div>
      </div>
    </div>
    <div class="user-card-body">
      <h3 class="user-name">${user.username || 'User'}</h3>
      <p class="user-age"><strong>${user.age || '?'}</strong> years old</p>
      <div class="user-status-text">
        <span class="status-dot ${statusClass}"></span>
        <span class="status-text ${statusClass}">${statusText}</span>
      </div>
    </div>
  `;

  return card;
}

async function loadUsers(page) {
  const grid = page.querySelector('[data-users-grid]');
  const noUsersMsg = page.querySelector('.no-users-message');

  try {
    grid.innerHTML = '<div class="loading-message">Loading users...</div>';

    const { data, error } = await supabase.rpc('get_registered_users');

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      grid.innerHTML = '';
      noUsersMsg.style.display = 'block';
      return;
    }

    grid.innerHTML = '';
    noUsersMsg.style.display = 'none';

    data.forEach((user) => {
      const card = createUserCard(user);
      grid.append(card);
    });
  } catch (error) {
    console.error('Error loading users:', error);
    grid.innerHTML = '<div class="loading-message">Error loading users. Please try again.</div>';
  }
}

function setupRealtimeUpdates(page) {
  return supabase
    .channel('profiles-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
      loadUsers(page);
    })
    .subscribe();
}

export function renderDashboardPage() {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = dashboardTemplate;
  const page = wrapper.firstElementChild;

  setTimeout(() => {
    loadUsers(page);
    setupRealtimeUpdates(page);
  }, 0);

  return page;
}