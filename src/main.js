import './styles/global.css';
import { initializeRouter } from './router/router.js';
import { initializeAuth } from './services/authState.js';

// Initialize authentication state first
await initializeAuth();

// Then initialize router
initializeRouter();
