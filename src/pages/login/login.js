import './login.css';
import loginTemplate from './login.html?raw';

function bindAuthForm(container, contextLabel) {
  const form = container.querySelector('[data-auth-form]');
  const status = container.querySelector('[data-auth-status]');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');

    if (!email || !password) {
      status.textContent = 'Please enter both email and password.';
      return;
    }

    status.textContent = `${contextLabel} submitted. Connecting to Supabase...`;
  });
}

export function renderLoginPage() {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = loginTemplate;
  const page = wrapper.firstElementChild;
  bindAuthForm(page, 'Login');
  return page;
}
