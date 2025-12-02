#!/usr/bin/env node

// Build script to inject environment variables and prepare deployment
const fs = require('fs');
const path = require('path');

console.log('🔨 Starting build...');
console.log('Environment check:');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Set' : '✗ Not set');
console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✓ Set' : '✗ Not set');

// Check if we have environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Environment variables not set!');
    console.error('   Please set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel dashboard.');
    console.error('   Settings → Environment Variables');
    process.exit(1);
}

// Create public directory
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
    console.log('✓ Created public directory');
}

// Generate config with actual values - use JSON.stringify to properly escape strings
const configContent = `// ====================
// SUPABASE CONFIGURATION
// ====================

// Configuration injected at build time from Vercel environment variables

const SUPABASE_CONFIG = {
    url: ${JSON.stringify(supabaseUrl)},
    anonKey: ${JSON.stringify(supabaseKey)}
};

// Export for use in app
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
`;

// Write config to public directory
const configOutputPath = path.join(publicDir, 'config.generated.js');
fs.writeFileSync(configOutputPath, configContent);
console.log('✓ Generated config.generated.js with environment variables');

// Copy static files to public directory
const filesToCopy = ['index.html', 'app.js', 'styles.css', 'vercel.json'];

for (const file of filesToCopy) {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(publicDir, file);

    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✓ Copied ${file}`);
    }
}

console.log('✅ Build complete!');
console.log('✓ Supabase credentials injected from environment variables');
