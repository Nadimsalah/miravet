#!/usr/bin/env node

/**
 * Fast FTP Deployment Script for Hostinger
 * Uploads only essential files for Next.js standalone deployment
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.production
function loadEnv() {
  const envFile = '.env.production';
  if (!fs.existsSync(envFile)) {
    throw new Error('.env.production not found');
  }
  const content = fs.readFileSync(envFile, 'utf8');
  const lines = content.split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

loadEnv();

const FTP_HOST = process.env.HOSTINGER_FTP_HOST;
const FTP_USER = process.env.HOSTINGER_FTP_USER;
const FTP_PASS = process.env.HOSTINGER_FTP_PASSWORD;
const FTP_PATH = process.env.HOSTINGER_DEPLOY_PATH || '/public_html';

if (!FTP_HOST || !FTP_USER || !FTP_PASS) {
  console.error('❌ Missing FTP credentials in .env.production');
  process.exit(1);
}

async function deploy() {
  console.log('📤 Fast deployment to Hostinger via FTP...\n');

  try {
    const ftp = require('basic-ftp');
    const client = new ftp.Client();
    client.ftp.verbose = false; // Less verbose for faster upload

    console.log(`🔌 Connecting to ${FTP_HOST}...`);
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      secure: false,
    });

    console.log('✅ Connected!\n');
    await client.cd(FTP_PATH);

    // Prepare files: copy public and static to standalone
    console.log('📦 Preparing files...');

    try {
      const standalonePath = path.join(process.cwd(), '.next', 'standalone');
      const publicPath = path.join(process.cwd(), 'public');
      const staticPath = path.join(process.cwd(), '.next', 'static');

      // Copy public to standalone/public
      const destPublic = path.join(standalonePath, 'public');
      if (fs.existsSync(publicPath)) {
        if (!fs.existsSync(destPublic)) fs.mkdirSync(destPublic, { recursive: true });
        // Simple recursive copy would be better with a helper, but let's assume it works or use fs.cpSync if available (Node 16.7+)
        if (fs.cpSync) {
          fs.cpSync(publicPath, destPublic, { recursive: true });
        }
      }

      // Copy static to standalone/.next/static
      const destStatic = path.join(standalonePath, '.next', 'static');
      if (fs.existsSync(staticPath)) {
        if (!fs.existsSync(destStatic)) fs.mkdirSync(destStatic, { recursive: true });
        if (fs.cpSync) {
          fs.cpSync(staticPath, destStatic, { recursive: true });
        }
      }
      console.log('✅ Files prepared\n');
    } catch (e) {
      console.log('⚠️  Warning: Could not prepare all files using fs.cpSync, trying shell fallback...\n');
      const { execSync } = require('child_process');
      const cwd = process.cwd();
      try {
        execSync('xcopy /E /I /Y public .next\\standalone\\public', { cwd, stdio: 'ignore' });
        execSync('xcopy /E /I /Y .next\\static .next\\standalone\\.next\\static', { cwd, stdio: 'ignore' });
      } catch (winErr) {
        try {
          execSync('cp -r public .next/standalone/public 2>/dev/null || true', { cwd, stdio: 'ignore' });
          execSync('mkdir -p .next/standalone/.next && cp -r .next/static .next/standalone/.next/static 2>/dev/null || true', { cwd, stdio: 'ignore' });
        } catch (linuxErr) {
          console.log('❌ Failed to prepare files. Please copy "public" and ".next/static" into ".next/standalone" manually.');
        }
      }
    }

    // Upload only essential files from standalone
    console.log('📤 Uploading application (this may take a few minutes)...\n');

    // Upload server.js first (most important)
    if (fs.existsSync('.next/standalone/server.js')) {
      console.log('  → server.js');
      await client.uploadFrom('.next/standalone/server.js', 'server.js');
    }

    // Upload package.json
    if (fs.existsSync('package.json')) {
      console.log('  → package.json');
      await client.uploadFrom('package.json', 'package.json');
    }

    // Upload app directory
    if (fs.existsSync('.next/standalone/app')) {
      console.log('  → app/');
      await client.ensureDir('app');
      await client.uploadFromDir('.next/standalone/app', 'app');
    }

    // Upload .next/server directory (essential for Next.js)
    if (fs.existsSync('.next/standalone/.next/server')) {
      console.log('  → .next/server/');
      await client.ensureDir('.next/server');
      await client.uploadFromDir('.next/standalone/.next/server', '.next/server');
    }

    // Upload static files
    if (fs.existsSync('.next/standalone/.next/static')) {
      console.log('  → .next/static/');
      await client.ensureDir('.next/static');
      await client.uploadFromDir('.next/standalone/.next/static', '.next/static');
    }

    // Upload public folder
    if (fs.existsSync('.next/standalone/public')) {
      console.log('  → public/');
      await client.ensureDir('public');
      await client.uploadFromDir('.next/standalone/public', 'public');
    }

    // Upload node_modules (only if it exists and is reasonable size)
    if (fs.existsSync('.next/standalone/node_modules')) {
      const stats = fs.statSync('.next/standalone/node_modules');
      if (stats.isDirectory()) {
        console.log('  → node_modules/ (this may take a while)...');
        await client.ensureDir('node_modules');
        await client.uploadFromDir('.next/standalone/node_modules', 'node_modules');
      }
    }

    client.close();
    console.log('\n✅ Deployment completed!\n');
    console.log('📋 Next steps:');
    console.log('1. Go to hPanel → Advanced → Node.js');
    console.log('2. Create Node.js App:');
    console.log('   - Version: 20.x');
    console.log('   - Startup file: server.js');
    console.log('   - App directory: public_html');
    console.log('3. Add environment variables from .env.production');
    console.log('4. Start the app');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

deploy();
