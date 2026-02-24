import './footer.css';
import footerTemplate from './footer.html?raw';

export function createFooter() {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = footerTemplate;
  return wrapper.firstElementChild;
}
