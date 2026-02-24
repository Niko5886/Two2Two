import { renderHomePage } from '../pages/index/index.js';
import { renderDashboardPage } from '../pages/dashboard/dashboard.js';

export const appRoutes = [
  {
    path: '/',
    render: renderHomePage,
    implemented: true
  },
  {
    path: '/dashboard',
    render: renderDashboardPage,
    implemented: true
  },
  { path: '/login', implemented: false },
  { path: '/register', implemented: false },
  { path: '/list-of-users', implemented: false },
  { path: '/messages', implemented: false },
  { path: '/search', implemented: false },
  { path: '/private-messages', implemented: false },
  { path: '/friends', implemented: false },
  { path: '/admin', implemented: false }
];
