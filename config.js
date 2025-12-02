// ====================
// SUPABASE CONFIGURATION
// ====================

// IMPORTANT: Replace these with your actual Supabase credentials
// Get these from: https://app.supabase.com/project/_/settings/api

const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL', // e.g. https://xxxxx.supabase.co
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
};

// Export for use in app
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
