# Hostinger Deployment Guide

This guide will help you deploy your Next.js e-commerce landing page to Hostinger.

## Prerequisites

- Hostinger hosting account with FTP/SSH access
- GitHub account (for automated deployments)
- Node.js 20+ installed locally (for manual deployments)

## Deployment Methods

### Method 1: MCP Server Integration (AI-Assisted) 🆕

Use Cursor's MCP (Model Context Protocol) server for AI-assisted deployments and server management.

**Benefits:**
- Natural language commands (e.g., "Deploy this app to Hostinger")
- Direct API integration with Hostinger
- Automated server management
- Real-time status monitoring

**Setup:**
```bash
# Run the setup script
pnpm setup:mcp

# Or manually configure .cursor/mcp.json
```

See [HOSTINGER_MCP_SETUP.md](./HOSTINGER_MCP_SETUP.md) for detailed instructions.

**Usage Examples:**
- "Deploy this app to my Hostinger account"
- "List my Hostinger domains"
- "Check my server status"
- "Update environment variables on Hostinger"

### Method 2: Automated Deployment via GitHub Actions (Recommended)

This method automatically deploys your application whenever you push to the main branch.

#### Setup Steps:

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

2. **Configure GitHub Secrets**
   
   Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret
   
   Add the following secrets:
   
   **Required:**
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   
   **For FTP Deployment:**
   - `HOSTINGER_FTP_HOST` - Your FTP host (e.g., `ftp.yourdomain.com`)
   - `HOSTINGER_FTP_USER` - Your FTP username
   - `HOSTINGER_FTP_PASSWORD` - Your FTP password
   - `HOSTINGER_DEPLOY_PATH` - Deployment path (usually `/public_html`)
   
   **For SSH Deployment (Alternative):**
   - `HOSTINGER_SSH_HOST` - Your SSH host
   - `HOSTINGER_SSH_USER` - Your SSH username
   - `HOSTINGER_SSH_KEY` - Your SSH private key
   - `HOSTINGER_SSH_PORT` - SSH port (usually `22`)
   - `HOSTINGER_DEPLOY_PATH` - Deployment path

3. **Choose Your Workflow**
   
   - **FTP Deployment**: Uses `.github/workflows/deploy-hostinger.yml` (default)
   - **SSH Deployment**: Uses `.github/workflows/deploy-hostinger-ssh.yml`
   
   To use SSH deployment, rename or modify the workflow file.

4. **Deploy**
   
   Push to the main branch or manually trigger the workflow:
   ```bash
   git push origin main
   ```
   
   Or go to Actions tab → Deploy to Hostinger → Run workflow

### Method 3: Manual Deployment via Script

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Create production environment file**
   ```bash
   cp .env.production.example .env.production
   ```
   
   Edit `.env.production` with your actual credentials.

3. **Run deployment script**
   
   **Using Bash script:**
   ```bash
   chmod +x scripts/deploy-hostinger.sh
   ./scripts/deploy-hostinger.sh
   ```
   
   **Using Node.js script:**
   ```bash
   node scripts/deploy-hostinger.js
   ```

### Method 4: Manual FTP Deployment

1. **Build your application**
   ```bash
   pnpm build
   ```

2. **Upload files via FTP client**
   
   Upload the following directories to your Hostinger hosting:
   - `.next/standalone` → `/public_html`
   - `.next/static` → `/public_html/.next/static`
   - `public` → `/public_html/public`
   - `package.json` and `pnpm-lock.yaml` → `/public_html`

3. **SSH into your server and install dependencies**
   ```bash
   ssh username@yourdomain.com
   cd public_html
   pnpm install --prod --frozen-lockfile
   ```

4. **Start the application**
   
   Using PM2 (recommended):
   ```bash
   pm2 start npm --name "nextjs" -- start
   pm2 save
   pm2 startup
   ```
   
   Or using Node directly:
   ```bash
   node server.js
   ```

## Hostinger-Specific Configuration

### Setting Up Node.js on Hostinger

1. **Access hPanel**
   - Log in to your Hostinger account
   - Go to hPanel → Advanced → Node.js

2. **Create Node.js App**
   - Click "Create Node.js App"
   - Set Node.js version to 20.x
   - Set app directory to `public_html`
   - Set startup file to `server.js` (from `.next/standalone`)

3. **Configure Environment Variables**
   - In hPanel → Node.js → Your App → Environment Variables
   - Add all variables from `.env.production`

### Setting Up PM2 (Process Manager)

If you have SSH access, install PM2 for process management:

```bash
npm install -g pm2
pm2 start npm --name "nextjs" -- start
pm2 save
pm2 startup
```

### Domain Configuration

1. **Point your domain**
   - In hPanel → Domains → Manage
   - Point your domain to the Node.js app

2. **SSL Certificate**
   - Enable SSL in hPanel → SSL
   - Or use Let's Encrypt free SSL

## Troubleshooting

### Build Fails

- Check that all environment variables are set correctly
- Ensure Node.js version is 20+
- Check build logs for specific errors

### Deployment Fails

- Verify FTP/SSH credentials are correct
- Check that deployment path exists
- Ensure you have write permissions

### Application Not Starting

- Check Node.js app is running in hPanel
- Verify environment variables are set
- Check server logs in hPanel → Node.js → Logs
- Ensure port 3000 is accessible (or configure custom port)

### Static Files Not Loading

- Verify `.next/static` and `public` folders are uploaded
- Check file permissions (should be 755 for directories, 644 for files)
- Clear browser cache

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for server-side operations)

Optional but recommended:
- `NODE_ENV=production`
- `PORT=3000` (if using custom port)

## Post-Deployment Checklist

- [ ] Verify application is accessible via domain
- [ ] Check that all pages load correctly
- [ ] Test API routes
- [ ] Verify Supabase connection
- [ ] Check SSL certificate is active
- [ ] Monitor application logs
- [ ] Set up monitoring/alerting (optional)

## Support

For Hostinger-specific issues:
- Hostinger Support: https://www.hostinger.com/contact
- Hostinger Documentation: https://support.hostinger.com/

For application issues:
- Check GitHub Issues
- Review Next.js documentation: https://nextjs.org/docs
