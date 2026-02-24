import '../login/login.css';
import './admin.css';
import adminTemplate from './admin.html?raw';

function bindAuthForm(container) {
  const form = container.querySelector('[data-auth-form]');
  const status = container.querySelector('[data-auth-status]');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');

    if (!email || !password) {
      status.textContent = 'Please enter both admin email and password.';
      return;
    }

    status.textContent = 'Admin login submitted. Verifying access...';
  });
}

export function renderAdminPage() {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = adminTemplate;
  const page = wrapper.firstElementChild;
  bindAuthForm(page);
  return page;
}
