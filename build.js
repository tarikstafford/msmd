#!/usr/bin/env node

// Build script to inject environment variables into config.js
const fs = require('fs');
const path = require('path');

// Check if we have environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️  Environment variables not set. Using placeholder values for local development.');
    console.log('   Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel dashboard for production.');
}

const configPath = path.join(__dirname, 'config.js');
let config = fs.readFileSync(configPath, 'utf8');

// Replace placeholders with environment variables
config = config.replace('__SUPABASE_URL__', supabaseUrl || 'YOUR_SUPABASE_URL');
config = config.replace('__SUPABASE_ANON_KEY__', supabaseKey || 'YOUR_SUPABASE_ANON_KEY');

// Write to the generated config file
const outputPath = path.join(__dirname, 'config.generated.js');
fs.writeFileSync(outputPath, config);

console.log('✓ Config generated successfully');
if (supabaseUrl && supabaseKey) {
    console.log('✓ Using environment variables from Vercel');
}
