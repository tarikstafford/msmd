#!/usr/bin/env node

// Build script to inject environment variables and prepare deployment
const fs = require('fs');
const path = require('path');

console.log('🔨 Starting build...');

// Check if we have environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️  Environment variables not set. Using placeholder values for local development.');
    console.log('   Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel dashboard for production.');
}

// Create public directory
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
    console.log('✓ Created public directory');
}

// Read and process config
const configPath = path.join(__dirname, 'config.js');
let config = fs.readFileSync(configPath, 'utf8');

// Replace placeholders with environment variables
config = config.replace('__SUPABASE_URL__', supabaseUrl || 'YOUR_SUPABASE_URL');
config = config.replace('__SUPABASE_ANON_KEY__', supabaseKey || 'YOUR_SUPABASE_ANON_KEY');

// Write config to public directory
const configOutputPath = path.join(publicDir, 'config.generated.js');
fs.writeFileSync(configOutputPath, config);
console.log('✓ Generated config.generated.js');

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
if (supabaseUrl && supabaseKey) {
    console.log('✓ Using environment variables from Vercel');
}
