import './header.css';
import headerTemplate from './header.html?raw';
import { getAuthUser, onAuthStateChange, userHasRole } from '../../services/authState.js';
import { signOut } from '../../services/supabaseClient.js';

export function createHeader(router, activePath) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = headerTemplate;

  const header = wrapper.firstElementChild;
  const links = header.querySelectorAll('[data-nav-link]');
  const authActions = header.querySelector('[data-auth-actions]');

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
    const protectedLinks = header.querySelectorAll('[data-protected]:not([data-admin-only])');
    protectedLinks.forEach((link) => {
      link.style.display = user ? 'inline-block' : 'none';
    });

    const adminOnlyLinks = header.querySelectorAll('[data-admin-only]');
    if (user) {
      const isAdmin = await userHasRole('admin');
      adminOnlyLinks.forEach((link) => {
        link.style.display = isAdmin ? 'inline-block' : 'none';
      });
    } else {
      adminOnlyLinks.forEach((link) => {
        link.style.display = 'none';
      });
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

  return header;
}
