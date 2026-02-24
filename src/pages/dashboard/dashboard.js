import './dashboard.css';
import dashboardTemplate from './dashboard.html?raw';

export function renderDashboardPage() {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = dashboardTemplate;
  return wrapper.firstElementChild;
}