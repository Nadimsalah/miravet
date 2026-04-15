# Quick Start: Hostinger Deployment

## 🚀 Fastest Way to Deploy (GitHub Actions)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Setup Hostinger deployment"
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

### Step 2: Add GitHub Secrets

Go to: **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**FTP Credentials:**
- `HOSTINGER_FTP_HOST` (e.g., `ftp.yourdomain.com`)
- `HOSTINGER_FTP_USER`
- `HOSTINGER_FTP_PASSWORD`
- `HOSTINGER_DEPLOY_PATH` (usually `/public_html`)

### Step 3: Deploy!

Just push to main branch:
```bash
git push origin main
```

Or manually trigger: **Actions tab → Deploy to Hostinger → Run workflow**

---

## 📝 Manual Deployment

### Option A: Using Script
```bash
# 1. Copy environment template
cp env.production.template .env.production

# 2. Edit .env.production with your credentials

# 3. Deploy
pnpm deploy
```

### Option B: Using Script (SSH)
```bash
# Set DEPLOY_METHOD=ssh in .env.production
pnpm deploy:ssh
```

---

## 🔧 Hostinger Setup

### 1. Enable Node.js in hPanel
- Go to **hPanel → Advanced → Node.js**
- Click **Create Node.js App**
- Set:
  - Node.js version: **20.x**
  - App directory: `public_html`
  - Startup file: `server.js`

### 2. Set Environment Variables
- In **Node.js App → Environment Variables**
- Add all variables from `.env.production`

### 3. Point Your Domain
- **hPanel → Domains → Manage**
- Point domain to your Node.js app

### 4. Enable SSL
- **hPanel → SSL**
- Enable Let's Encrypt SSL

---

## ✅ Verify Deployment

1. Visit your domain
2. Check that pages load
3. Test API routes
4. Verify Supabase connection

---

## 📚 Full Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions and troubleshooting.
