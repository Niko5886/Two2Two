import './header.css';
import headerTemplate from './header.html?raw';
import { getAuthUser, onAuthStateChange, userHasRole } from '../../services/authState.js';
import { signOut } from '../../services/supabaseClient.js';
import { fetchProfile } from '../../services/profileService.js';
import { fetchConversations } from '../../services/messageService.js';

const unreadBadgeElements = new Set();
let unreadListenersBound = false;

function setUnreadBadgeValue(badgeElement, count = 0) {
  if (!badgeElement) return;

  const safeCount = Math.max(0, Number(count) || 0);
  badgeElement.textContent = safeCount > 99 ? '99+' : String(safeCount);
  badgeElement.hidden = safeCount <= 0;
}

function renderUnreadCount(count = 0) {
  unreadBadgeElements.forEach((badgeElement) => {
    if (!badgeElement?.isConnected) {
      unreadBadgeElements.delete(badgeElement);
      return;
    }

    setUnreadBadgeValue(badgeElement, count);
  });
}

async function refreshUnreadBadges() {
  const user = getAuthUser();
  if (!user) {
    renderUnreadCount(0);
    return;
  }

  try {
    const conversations = await fetchConversations();
    const totalUnread = (conversations || []).reduce((sum, convo) => sum + (Number(convo.unread_count) || 0), 0);
    renderUnreadCount(totalUnread);
  } catch (error) {
    console.error('Failed to refresh unread badge:', error);
  }
}

function bindUnreadListenersOnce() {
  if (unreadListenersBound) return;
  unreadListenersBound = true;

  window.addEventListener('messages:incoming', refreshUnreadBadges);
  window.addEventListener('messages:read-updated', refreshUnreadBadges);
  onAuthStateChange(() => {
    refreshUnreadBadges();
  });
}

export function createHeader(router, activePath) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = headerTemplate;

  const header = wrapper.querySelector('.app-header');
  const sidebar = wrapper.querySelector('.app-sidebar');
  const sidebarToggle = wrapper.querySelector('[data-sidebar-toggle]');
  const links = wrapper.querySelectorAll('[data-nav-link]');
  const authActions = wrapper.querySelector('[data-auth-actions]');
  const profileEditLink = wrapper.querySelector('[data-profile-edit]');
  const unreadMessagesBadge = wrapper.querySelector('[data-unread-messages]');

  if (unreadMessagesBadge) {
    unreadBadgeElements.add(unreadMessagesBadge);
    setUnreadBadgeValue(unreadMessagesBadge, 0);
  }
  bindUnreadListenersOnce();

  // Handle regular navigation links
  links.forEach((link) => {
    if (link.getAttribute('href') === activePath) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }

    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href?.startsWith('/')) {
        return;
      }

      event.preventDefault();
      router.navigate(href);

      if (sidebar && window.bootstrap?.Offcanvas) {
        const offcanvas = window.bootstrap.Offcanvas.getInstance(sidebar);
        if (offcanvas) {
          offcanvas.hide();
        }
      }
    });
  });

  // Update auth actions based on auth state
  async function updateAuthActions(user) {
    // Prevent duplicate updates
    if (authActions.dataset.updating === 'true') {
      return;
    }

    authActions.dataset.updating = 'true';

    try {
      // Покажи protected линкове само при логнат потребител
      const protectedLinks = wrapper.querySelectorAll('[data-protected]:not([data-admin-only])');
      protectedLinks.forEach((link) => {
        link.style.display = user ? 'flex' : 'none';
      });

      const adminOnlyLinks = wrapper.querySelectorAll('[data-admin-only]');
      if (user) {
        const isAdmin = await userHasRole('admin');
        adminOnlyLinks.forEach((link) => {
          link.style.display = isAdmin ? 'flex' : 'none';
        });
      } else {
        adminOnlyLinks.forEach((link) => {
          link.style.display = 'none';
        });
      }

      // Sidebar и бутон видими само при логнат потребител
      if (sidebar) {
        sidebar.style.display = user ? 'flex' : 'none';
      }

      if (sidebarToggle) {
        sidebarToggle.style.display = user ? 'inline-flex' : 'none';
      }

      if (authActions) {
        authActions.innerHTML = '';

        if (user) {
          // User is authenticated - fetch profile info
          try {
            const profile = await fetchProfile(user.id);
            
            // Create user info container
            const userInfo = document.createElement('div');
            userInfo.className = 'auth-user-info';
            userInfo.style.cursor = 'pointer';
            userInfo.title = 'Виж профила';
            userInfo.tabIndex = 0;
            userInfo.setAttribute('role', 'link');
            userInfo.setAttribute('aria-label', 'Отвори моя профил');
            
            // Make user info clickable to open profile modal
            userInfo.addEventListener('click', () => {
              router.navigate(`/profile/${user.id}`);
            });

            userInfo.addEventListener('keydown', (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                router.navigate(`/profile/${user.id}`);
              }
            });
            
            // Avatar
            const avatar = document.createElement('div');
            avatar.className = 'auth-user-avatar';
            if (profile?.avatar_url) {
              const img = document.createElement('img');
              img.src = profile.avatar_url;
              img.alt = profile.username || 'User';
              img.className = 'auth-user-avatar__img';
              avatar.appendChild(img);
            } else {
              avatar.innerHTML = '<div class="auth-user-avatar__placeholder">👤</div>';
            }
            userInfo.appendChild(avatar);
            
            // Name/Username
            const userName = document.createElement('div');
            userName.className = 'auth-user-details';
            const displayName = document.createElement('span');
            displayName.className = 'auth-user-name';
            displayName.textContent = profile?.username || 'Потребител';
            userName.appendChild(displayName);
            userInfo.appendChild(userName);
            
            authActions.append(userInfo);
          } catch (err) {
            // Fallback to generic name if profile fetch fails
            const fallbackName = document.createElement('span');
            fallbackName.className = 'auth-user-name';
            fallbackName.textContent = 'Потребител';
            authActions.append(fallbackName);
          }

          const logoutBtn = document.createElement('button');
          logoutBtn.className = 'auth-logout-btn btn btn-danger btn-sm';
          logoutBtn.textContent = 'Logout';
          logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const { error } = await signOut();
            if (!error) {
              router.navigate('/login');
            }
          });
          authActions.append(logoutBtn);
        } else {
          // User is not authenticated
          const loginLink = document.createElement('a');
          loginLink.className = 'auth-link btn btn-outline-light btn-sm';
          loginLink.href = '/login';
          loginLink.textContent = 'Login';
          loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            router.navigate('/login');
          });
          authActions.append(loginLink);

          const registerLink = document.createElement('a');
          registerLink.className = 'auth-link btn btn-primary btn-sm';
          registerLink.href = '/register';
          registerLink.textContent = 'Register';
          registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            router.navigate('/register');
          });
          authActions.append(registerLink);
        }
      }
    } finally {
      authActions.dataset.updating = 'false';
    }
  }

  // Initialize auth actions immediately with current user
  const currentUser = getAuthUser();
  updateAuthActions(currentUser);
  refreshUnreadBadges();

  // Subscribe to auth state changes for future updates
  onAuthStateChange((user) => {
    updateAuthActions(user);
  });

  if (profileEditLink) {
    profileEditLink.addEventListener('click', (e) => {
      e.preventDefault();
      const user = getAuthUser();
      if (!user) return;

      if (sidebar && window.bootstrap?.Offcanvas) {
        const offcanvas = window.bootstrap.Offcanvas.getInstance(sidebar);
        if (offcanvas) {
          offcanvas.hide();
        }
      }

      router.navigate(`/profile/${user.id}`);
    });
  }

  // Return a fragment with both header and sidebar
  const fragment = document.createDocumentFragment();
  fragment.append(header);
  if (sidebar) {
    fragment.append(sidebar);
  }
  return fragment;
}
