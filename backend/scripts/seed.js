#!/usr/bin/env node
/* Loads MONGO_URI from backend/.env (or ENV_FILE) and runs mongo-init.js via mongosh */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Allow overriding which .env to load: ENV_FILE=.env.staging npm run db:seed:env
const envFile = process.env.ENV_FILE || '.env';
const envPath = path.resolve(__dirname, '..', envFile);

// Load env
require('dotenv').config({ path: envPath });

// Validate MONGO_URI
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error(`MONGO_URI is not set. Ensure it exists in ${envPath}`);
  process.exit(1);
}

// Resolve init script path (repo root)
const initScript = path.resolve(__dirname, '..', '..', 'mongo-init.js');
if (!fs.existsSync(initScript)) {
  console.error(`mongo-init.js not found at ${initScript}`);
  process.exit(1);
}

// Run mongosh
const child = spawn('mongosh', [uri, initScript], { stdio: 'inherit' });

child.on('error', (err) => {
  console.error('Failed to start mongosh:', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});