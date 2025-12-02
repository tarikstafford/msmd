#!/usr/bin/env node

// Build script to inject environment variables into config.js
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config.js');
let config = fs.readFileSync(configPath, 'utf8');

// Replace placeholders with environment variables
config = config.replace('__SUPABASE_URL__', process.env.SUPABASE_URL || '');
config = config.replace('__SUPABASE_ANON_KEY__', process.env.SUPABASE_ANON_KEY || '');

// Write to a temp config file
const outputPath = path.join(__dirname, 'config.generated.js');
fs.writeFileSync(outputPath, config);

console.log('✓ Config generated with environment variables');
