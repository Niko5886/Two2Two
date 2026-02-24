import { supabase, setAuthStateCallback, getCurrentUser } from './supabaseClient.js';

// Auth state
let currentUser = null;
let isAuthInitialized = false;

// Callbacks
const authStateListeners = [];

// Initialize auth state
export async function initializeAuth() {
  if (isAuthInitialized) return;

  const { user } = await getCurrentUser();
  currentUser = user;
  isAuthInitialized = true;

  // Set up listener for future changes
  setAuthStateCallback((event, session) => {
    currentUser = session?.user || null;
    notifyListeners();
  });

  notifyListeners();
}

// Get current user
export function getAuthUser() {
  return currentUser;
}

// Check if user is authenticated
export function isAuthenticated() {
  return currentUser !== null;
}

// Subscribe to auth changes
export function onAuthStateChange(callback) {
  authStateListeners.push(callback);
  // Call immediately with current state
  callback(currentUser);
  // Return unsubscribe function
  return () => {
    const index = authStateListeners.indexOf(callback);
    if (index > -1) {
      authStateListeners.splice(index, 1);
    }
  };
}

// Notify all listeners of auth state change
function notifyListeners() {
  authStateListeners.forEach(callback => {
    callback(currentUser);
  });
}

// Refresh user from session
export async function refreshUser() {
  const { user } = await getCurrentUser();
  currentUser = user;
  notifyListeners();
  return currentUser;
}
