import './header.css';
import headerTemplate from './header.html?raw';
import { getAuthUser, onAuthStateChange, userHasRole } from '../../services/authState.js';
import { signOut } from '../../services/supabaseClient.js';
import { openProfileModal } from '../profile-modal/profileModal.js';

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
        // User is authenticated
        const userEmail = document.createElement('span');
        userEmail.className = 'auth-user-email';
        userEmail.textContent = user.email;
        authActions.append(userEmail);

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
  }

  // Subscribe to auth state changes
  onAuthStateChange((user) => {
    updateAuthActions(user);
  });
  updateAuthActions(getAuthUser());

  if (profileEditLink) {
    profileEditLink.addEventListener('click', (e) => {
      e.preventDefault();
      const user = getAuthUser();
      if (!user) return;
      openProfileModal(user.id, { title: 'My Profile' });
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
