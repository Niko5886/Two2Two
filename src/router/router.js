import Navigo from 'navigo';
import { appRoutes } from './routeConfig.js';
import { createHeader } from '../components/header/header.js';
import { createFooter } from '../components/footer/footer.js';

const router = new Navigo('/');

function createComingSoon(path) {
  const section = document.createElement('section');
  section.innerHTML = `
    <h1>Coming Soon</h1>
    <p>The page <strong>${path}</strong> is mapped but not implemented yet.</p>
  `;
  return section;
}

function renderLayout(contentNode, activePath) {
  const app = document.querySelector('#app');
  app.innerHTML = '';

  const shell = document.createElement('div');
  shell.className = 'app-shell';

  shell.append(createHeader(router, activePath));

  const content = document.createElement('main');
  content.className = 'app-content';
  content.append(contentNode);
  shell.append(content);

  shell.append(createFooter());
  app.append(shell);
}

export function initializeRouter() {
  appRoutes.forEach((route) => {
    if (route.implemented && route.render) {
      router.on(route.path, () => {
        renderLayout(route.render(), route.path);
      });
      return;
    }

    router.on(route.path, () => {
      renderLayout(createComingSoon(route.path), route.path);
    });
  });

  router.notFound(() => {
    renderLayout(createComingSoon(window.location.pathname), window.location.pathname);
  });

  router.resolve();
}
