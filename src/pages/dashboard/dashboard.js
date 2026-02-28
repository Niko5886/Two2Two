import './dashboard.css';
import dashboardTemplate from './dashboard.html?raw';
import { supabase } from '../../services/supabaseClient.js';

const AVATAR_EMOJIS = ['👨', '👩', '🧑', '👨‍🦱', '👩‍🦱', '🧑‍🦱'];

function getAvatarEmoji(userId) {
  const seed = userId.charCodeAt(0) + userId.charCodeAt(1);
  return AVATAR_EMOJIS[seed % AVATAR_EMOJIS.length];
}

function createUserCard(user, navigateToProfile) {
  const card = document.createElement('div');
  card.className = 'user-card';
  card.style.cursor = 'pointer';
  card.dataset.userId = user.id;

  const statusClass = user.is_online ? 'online' : 'offline';
  
  // Try to create string for age and gender like "37+43 Jahre ⚥"
  const ageStr = user.age ? `${user.age} Years` : 'Age unknown';
  let genderSymbol = '';
  if (user.gender === 'male') genderSymbol = '♂';
  else if (user.gender === 'female') genderSymbol = '♀';
  else if (user.gender === 'couple') genderSymbol = '⚥';
  
  const locationStr = user.city ? `<div class="user-location">${user.city}</div>` : '';

  card.innerHTML = `
    <div class="user-card-image">
      ${user.avatar_url ? `<img src="${user.avatar_url}" alt="${user.username}" loading="lazy">` : `<div class="user-avatar-placeholder">${getAvatarEmoji(user.id)}</div>`}
    </div>
    <div class="user-card-info">
      <div class="user-name">
        ${user.username || 'User'}
        ${user.is_online ? `<span class="status-dot tooltip" title="Online"></span>` : ''}
      </div>
      <div class="user-details">
        <span>${ageStr} ${genderSymbol}</span>
      </div>
      ${locationStr}
    </div>
  `;

  card.addEventListener('click', () => {
    navigateToProfile(user.id);
  });

  return card;
}

async function loadUsers(page, navigateToProfile) {
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
      const card = createUserCard(user, navigateToProfile);
      grid.append(card);
    });
  } catch (error) {
    console.error('Error loading users:', error);
    grid.innerHTML = '<div class="loading-message">Error loading users. Please try again.</div>';
  }
}

function setupRealtimeUpdates(page, navigateToProfile) {
  return supabase
    .channel('profiles-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
      loadUsers(page, navigateToProfile);
    })
    .subscribe();
}

export function renderDashboardPage(context = {}) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = dashboardTemplate;
  const page = wrapper.firstElementChild;
  const navigateToProfile = (userId) => {
    if (context?.router) {
      context.router.navigate(`/profile/${userId}`);
    }
  };

  setTimeout(() => {
    loadUsers(page, navigateToProfile);
    setupRealtimeUpdates(page, navigateToProfile);
  }, 0);

  return page;
}