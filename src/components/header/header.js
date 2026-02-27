import './header.css';
import headerTemplate from './header.html?raw';
import { getAuthUser, onAuthStateChange, userHasRole } from '../../services/authState.js';
import { signOut } from '../../services/supabaseClient.js';
import { openProfileModal } from '../profile-modal/profileModal.js';
import { fetchProfile } from '../../services/profileService.js';

export function createHeader(router, activePath) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = headerTemplate;

  const header = wrapper.querySelector('.app-header');
  const sidebar = wrapper.querySelector('.app-sidebar');
  const links = wrapper.querySelectorAll('[data-nav-link]');
  const authActions = wrapper.querySelector('[data-auth-actions]');
  const profileEditLink = wrapper.querySelector('[data-profile-edit]');

  // Handle regular navigation links
  links.forEach((link) => {
    if (link.getAttribute('href') === activePath) {
      link.classList.add('is-active');
    }

    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href?.startsWith('/')) {
        return;
      }

      event.preventDefault();
      router.navigate(href);
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
      // Update protected links visibility
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

      // Show/hide sidebar based on auth
      if (sidebar) {
        sidebar.style.display = user ? 'block' : 'none';
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
            
            // Make user info clickable to open profile modal
            userInfo.addEventListener('click', () => {
              openProfileModal(user.id, { title: 'Моят профил' });
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
            const emailSpan = document.createElement('span');
            emailSpan.className = 'auth-user-email';
            emailSpan.textContent = user.email || '';
            userName.appendChild(displayName);
            userName.appendChild(emailSpan);
            userInfo.appendChild(userName);
            
            authActions.append(userInfo);
          } catch (err) {
            // Fallback to email only if profile fetch fails
            const userEmail = document.createElement('span');
            userEmail.className = 'auth-user-email';
            userEmail.textContent = user.email;
            authActions.append(userEmail);
          }

          const logoutBtn = document.createElement('button');
          logoutBtn.className = 'auth-logout-btn';
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
          loginLink.className = 'auth-link';
          loginLink.href = '/login';
          loginLink.textContent = 'Login';
          loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            router.navigate('/login');
          });
          authActions.append(loginLink);

          const registerLink = document.createElement('a');
          registerLink.className = 'auth-link';
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

  // Subscribe to auth state changes for future updates
  onAuthStateChange((user) => {
    updateAuthActions(user);
  });

  if (profileEditLink) {
    profileEditLink.addEventListener('click', (e) => {
      e.preventDefault();
      const user = getAuthUser();
      if (!user) return;
      openProfileModal(user.id, { title: 'Моят профил' });
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
