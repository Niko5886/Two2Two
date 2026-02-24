import './index.css';
import homeTemplate from './index.html?raw';

export function renderHomePage() {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = homeTemplate;
  return wrapper.firstElementChild;
}
