import './index.css';
import homeTemplate from './index.html?raw';
import { getAuthUser } from '../../services/authState.js';

export function renderHomePage() {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = homeTemplate;
  const page = wrapper.firstElementChild;
  
  // Скрий Register/Login бутоните и текста ако потребителят е логнат
  const user = getAuthUser();
  if (user) {
    const authCta = page.querySelector('[data-auth-cta]');
    const authNote = page.querySelector('[data-auth-note]');
    if (authCta) authCta.hidden = true;
    if (authNote) authNote.hidden = true;
  }
  
  return page;
}
