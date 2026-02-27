# Authentication Setup Guide

This document explains how to set up authentication for the Couple2Couple application using Supabase Auth.

## Files Created/Modified

### New Files:
- `src/services/supabaseClient.js` - Supabase client initialization and auth functions
- `src/services/authState.js` - Global auth state management
- `src/pages/register/register.js` - Register page component
- `src/pages/register/register.html` - Register page template
- `src/pages/register/register.css` - Register page styles
- `.env.local` - Environment variables (template)

### Modified Files:
- `src/pages/login/login.js` - Updated with Supabase auth logic
- `src/pages/login/login.html` - Added link to register page
- `src/pages/login/login.css` - Enhanced styling
- `src/router/routeConfig.js` - Added register page to routes
- `src/components/header/header.js` - Added auth state awareness
- `src/components/header/header.html` - Added auth actions area
- `src/components/header/header.css` - Styled auth actions
- `src/main.js` - Initialize auth before router
- `package.json` - Added @supabase/supabase-js dependency

## Setup Instructions

### 1. Get Supabase Credentials

1. Go to [Supabase](https://app.supabase.com) and sign in or create an account
2. Create a new project or select an existing one
3. Navigate to **Settings > API**
4. Copy your **Project URL** and **anon/public API key**

### 2. Configure Environment Variables

1. Open `.env.local` in the project root
2. Replace the placeholder values:
   ```
   VITE_SUPABASE_URL=your_actual_project_url
   VITE_SUPABASE_ANON_KEY=your_actual_anon_key
   ```

### 3. Enable Email Authentication in Supabase

1. In your Supabase project, go to **Authentication > Providers**
2. Enable the **Email** provider
3. Configure email confirmation settings as needed

### 4. Update Auth User Metadata (Optional)

You can customize user metadata in the `signUp` function in `src/services/supabaseClient.js` if needed.

## Features Implemented

### Authentication Pages
- **Login Page** (`/login`) - Sign in with email and password
- **Register Page** (`/register`) - Create new account with validation
  - Password confirmation validation
  - Minimum password length checking (6 characters)
  - Email verification prompts

### Authentication State Management
- Global auth state tracking
- Auth state change listeners throughout the app
- Automatic header updates (Login/Register links vs. User email + Logout button)
- Persistent auth sessions

### Header Navigation
- Dynamic auth controls showing:
  - Login/Register links when not authenticated
  - User email and Logout button when authenticated

## Usage in Components

### Get Current User
```javascript
import { getAuthUser, isAuthenticated } from './services/authState.js';

const user = getAuthUser(); // Returns user object or null
const isAuth = isAuthenticated(); // Returns true/false
```

### Subscribe to Auth Changes
```javascript
import { onAuthStateChange } from './services/authState.js';

const unsubscribe = onAuthStateChange((user) => {
  console.log('Auth state changed:', user);
});

// Unsubscribe when done
unsubscribe();
```

### Sign Out
```javascript
import { signOut } from './services/supabaseClient.js';

const { error } = await signOut();
if (!error) {
  // User signed out successfully
}
```

## Security Considerations

1. **Never commit `.env.local`** - It's already in `.gitignore` but double-check
2. **Keep API keys secure** - The anon key is public, but should still be protected
3. **Enable RLS** - Set up Row Level Security policies in Supabase for user data
4. **Email verification** - Configure email confirmation for new accounts

## Next Steps

1. Set up Row Level Security (RLS) policies for your database tables
2. Customize user profile tables if needed
3. Add password reset functionality
4. Implement social authentication (Google, GitHub, etc.) if desired
5. Add email verification logic if not using Supabase's built-in

## Troubleshooting

### Login/Register buttons not working
- Check that `.env.local` has correct Supabase credentials
- Check browser console for error messages
- Verify Supabase project is active

### "Missing Supabase environment variables" error
- Ensure `.env.local` file exists in project root
- Verify variable names match exactly:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Restart development server after changing `.env.local`

### User session not persisting
- Supabase should persist sessions automatically in localStorage
- Check browser DevTools > Application > Local Storage for `sb-` prefixed keys
- Clear localStorage and try logging in again

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Email Authentication](https://supabase.com/docs/guides/auth/auth-email)
