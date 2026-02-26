import './admin.css';
import adminTemplate from './admin.html?raw';
import { getAuthUser, userHasRole } from '../../services/authState.js';
import { router } from '../../router/router.js';

async function initializeAdminPanel(container) {
  const status = container.querySelector('[data-admin-status]');
  const content = container.querySelector('[data-admin-content]');
  const adminEmail = container.querySelector('[data-admin-email]');

  const currentUser = getAuthUser();

  if (!currentUser) {
    router.navigate('/login');
    return;
  }

  const isAdmin = await userHasRole('admin');
  if (!isAdmin) {
    router.navigate('/dashboard');
    return;
  }

  adminEmail.textContent = currentUser.email || 'unknown';
  status.textContent = 'Admin access verified.';
  status.className = 'admin-status admin-status--success';
  content.hidden = false;
}

export function renderAdminPage() {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = adminTemplate;
  const page = wrapper.firstElementChild;

  initializeAdminPanel(page);
  return page;
}
