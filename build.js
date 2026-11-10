#!/usr/bin/env node
const { execSync } = require('child_process');
console.log('🚀 Building Prompt Polisher...');
execSync('tsc', { stdio: 'inherit' });
console.log('✅ Build complete!');
