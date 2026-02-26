import { supabase, setAuthStateCallback, getCurrentUser } from './supabaseClient.js';

// Auth state
let currentUser = null;
let currentUserRoles = [];
let isAuthInitialized = false;

// Callbacks
const authStateListeners = [];

// Initialize auth state
export async function initializeAuth() {
  if (isAuthInitialized) return;

  const { user } = await getCurrentUser();
  currentUser = user;
  await refreshUserRoles();
  isAuthInitialized = true;

  // Set up listener for future changes
  setAuthStateCallback(async (event, session) => {
    currentUser = session?.user || null;
    await refreshUserRoles();
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

export function getAuthUserRoles() {
  return currentUserRoles;
}

export async function userHasRole(role) {
  if (!currentUser) {
    return false;
  }

  if (!currentUserRoles.length) {
    await refreshUserRoles();
  }

  return currentUserRoles.includes(role);
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
  await refreshUserRoles();
  notifyListeners();
  return currentUser;
}

async function refreshUserRoles() {
  if (!currentUser) {
    currentUserRoles = [];
    return currentUserRoles;
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', currentUser.id);

  if (error) {
    currentUserRoles = [];
    return currentUserRoles;
  }

  currentUserRoles = (data || []).map((item) => item.role);
  return currentUserRoles;
}
