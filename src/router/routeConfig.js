import { renderHomePage } from '../pages/index/index.js';
import { renderDashboardPage } from '../pages/dashboard/dashboard.js';
import { renderLoginPage } from '../pages/login/login.js';
import { renderRegisterPage } from '../pages/register/register.js';
import { renderAdminPage } from '../pages/admin/admin.js';

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
  {
    path: '/login',
    render: renderLoginPage,
    implemented: true
  },
  {
    path: '/register',
    render: renderRegisterPage,
    implemented: true
  },
  { path: '/list-of-users', implemented: false },
  { path: '/messages', implemented: false },
  { path: '/search', implemented: false },
  { path: '/private-messages', implemented: false },
  { path: '/friends', implemented: false },
  {
    path: '/admin',
    render: renderAdminPage,
    implemented: true
  }
];
