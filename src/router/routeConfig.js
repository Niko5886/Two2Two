import { renderHomePage } from '../pages/index/index.js';
import { renderDashboardPage } from '../pages/dashboard/dashboard.js';
import { renderLoginPage } from '../pages/login/login.js';
import { renderRegisterPage } from '../pages/register/register.js';
import { renderAdminPage } from '../pages/admin/admin.js';

export const appRoutes = [
  {
    path: '/',
    render: renderHomePage,
    implemented: true,
    protected: true
  },
  {
    path: '/dashboard',
    render: renderDashboardPage,
    implemented: true,
    protected: true
  },
  {
    path: '/login',
    render: renderLoginPage,
    implemented: true,
    protected: false
  },
  {
    path: '/register',
    render: renderRegisterPage,
    implemented: true,
    protected: false
  },
  { path: '/list-of-users', implemented: false, protected: true },
  { path: '/messages', implemented: false, protected: true },
  { path: '/search', implemented: false, protected: true },
  { path: '/private-messages', implemented: false, protected: true },
  { path: '/friends', implemented: false, protected: true },
  {
    path: '/admin',
    render: renderAdminPage,
    implemented: true,
    protected: true
  }
];
