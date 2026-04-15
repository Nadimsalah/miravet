# Deploy to Hostinger - Step by Step Guide

## Quick Deployment Options

### Option 1: Using MCP Server (If Connected) 🤖

If your MCP server is connected, you can simply ask:
- "Deploy this app to my Hostinger account"
- "Push the latest build to Hostinger"

The MCP server will handle the deployment automatically!

---

### Option 2: Interactive Deployment Script 🚀

Run the interactive deployment script:

```bash
pnpm run deploy:interactive
# or
bash scripts/deploy-now.sh
```

This will:
1. Check your configuration
2. Build your app
3. Deploy to Hostinger

---

### Option 3: Manual Deployment 📝

#### Step 1: Get Your Credentials

**From Hostinger hPanel:**
1. Go to https://hpanel.hostinger.com/
2. Navigate to **Files** → **FTP Accounts**
3. Note your:
   - FTP Host (e.g., `ftp.yourdomain.com`)
   - FTP Username
   - FTP Password
   - Deployment path (usually `/public_html`)

**From Supabase:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - Project URL
   - `anon` public key
   - `service_role` key (keep this secret!)

#### Step 2: Create .env.production

```bash
cp env.production.template .env.production
```

Then edit `.env.production` and fill in:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Hostinger FTP
HOSTINGER_FTP_HOST=ftp.yourdomain.com
HOSTINGER_FTP_USER=your_ftp_username
HOSTINGER_FTP_PASSWORD=your_ftp_password
HOSTINGER_DEPLOY_PATH=/public_html

# Deployment
DEPLOY_METHOD=ftp
NODE_ENV=production
```

#### Step 3: Deploy

```bash
pnpm deploy
```

---

## After Deployment

### 1. Set Up Node.js App in Hostinger

1. **Go to hPanel** → **Advanced** → **Node.js**
2. **Click "Create Node.js App"**
3. **Configure:**
   - Node.js version: **20.x**
   - App directory: `public_html`
   - Startup file: `server.js`
   - Port: `3000` (or your custom port)

### 2. Add Environment Variables

In the Node.js app settings:
1. Go to **Environment Variables**
2. Add all variables from your `.env.production`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NODE_ENV=production`
   - `PORT=3000`

### 3. Point Your Domain

1. Go to **hPanel** → **Domains** → **Manage**
2. Point your domain to the Node.js app
3. Wait for DNS propagation (can take up to 24 hours)

### 4. Enable SSL

1. Go to **hPanel** → **SSL**
2. Enable **Let's Encrypt SSL**
3. Wait for certificate activation

### 5. Start the App

The app should start automatically. If not:
1. Go to **Node.js** → Your App
2. Click **Start** or **Restart**

---

## Verify Deployment

1. ✅ Visit your domain - should see your app
2. ✅ Check all pages load correctly
3. ✅ Test API routes
4. ✅ Verify Supabase connection works
5. ✅ Check SSL is active (HTTPS)

---

## Troubleshooting

### Build Fails
- Check all environment variables are set
- Ensure Node.js 20+ is installed
- Check build logs for errors

### Deployment Fails
- Verify FTP credentials are correct
- Check deployment path exists
- Ensure you have write permissions

### App Not Starting
- Check Node.js app is created in hPanel
- Verify environment variables are set
- Check server logs in hPanel
- Ensure port 3000 is accessible

### Static Files Not Loading
- Verify `.next/static` and `public` folders were uploaded
- Check file permissions (755 for dirs, 644 for files)

---

## Need Help?

- 📖 Full documentation: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 🚀 Quick start: [QUICK_START_DEPLOYMENT.md](./QUICK_START_DEPLOYMENT.md)
- 🤖 MCP setup: [HOSTINGER_MCP_SETUP.md](./HOSTINGER_MCP_SETUP.md)
