// ====================
// SUPABASE CONFIGURATION
// ====================

// Configuration loaded from environment variables in Vercel
// Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel dashboard

const SUPABASE_CONFIG = {
    url: '__SUPABASE_URL__',
    anonKey: '__SUPABASE_ANON_KEY__'
};

// Export for use in app
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
