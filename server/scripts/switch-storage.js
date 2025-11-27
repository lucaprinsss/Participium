#!/usr/bin/env node

/**
 * Script to easily switch storage provider between local and R2
 * Usage: npm run storage:local or npm run storage:r2
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env');
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
📦 Storage Provider Switcher

Usage:
  npm run storage:local    # Switch to local filesystem storage
  npm run storage:r2       # Switch to Cloudflare R2 storage
  npm run storage:status   # Show current storage provider

Current provider: ${getCurrentProvider()}
  `);
  process.exit(0);
}

const command = args[0];

switch (command) {
  case 'local':
    switchToLocal();
    break;
  case 'r2':
    switchToR2();
    break;
  case 'status':
    showStatus();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.log('Valid commands: local, r2, status');
    process.exit(1);
}

function getCurrentProvider() {
  try {
    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    const match = envContent.match(/STORAGE_PROVIDER=(\w+)/);
    return match ? match[1] : 'local';
  } catch (error) {
    return 'local';
  }
}

function switchToLocal() {
  updateEnvFile('local');
  console.log(`
Switched to LOCAL storage

Files will be stored in: server/uploads/reports/
Restart the server to apply changes: npm run dev
  `);
}

function switchToR2() {
  updateEnvFile('r2');
  console.log(`
Switched to CLOUDFLARE R2 storage

Make sure you have configured R2 credentials in .env:
   - R2_ENDPOINT
   - R2_ACCESS_KEY_ID
   - R2_SECRET_ACCESS_KEY
   - R2_BUCKET_NAME

See CLOUDFLARE_R2_SETUP.md for setup instructions
Restart the server to apply changes: npm run dev
  `);
}

function showStatus() {
  const provider = getCurrentProvider();
  console.log(`
Current Storage Configuration

Provider: ${provider.toUpperCase()}
${provider === 'local' 
  ? 'Files stored in: server/uploads/reports/'
  : 'Files uploaded to: Cloudflare R2'
}

To switch providers:
  npm run storage:local    # Switch to local
  npm run storage:r2       # Switch to R2
  `);
}

function updateEnvFile(provider) {
  try {
    let envContent = fs.readFileSync(ENV_FILE, 'utf8');
    
    // Update STORAGE_PROVIDER line
    if (envContent.includes('STORAGE_PROVIDER=')) {
      envContent = envContent.replace(
        /STORAGE_PROVIDER=\w+/,
        `STORAGE_PROVIDER=${provider}`
      );
    } else {
      // Add if doesn't exist
      envContent += `\nSTORAGE_PROVIDER=${provider}\n`;
    }
    
    fs.writeFileSync(ENV_FILE, envContent, 'utf8');
  } catch (error) {
    console.error('Error updating .env file:', error.message);
    process.exit(1);
  }
}
