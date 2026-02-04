# Al Saraya Butchery - Production Deployment Guide

## Prerequisites

### Required on Production Server:
- Node.js 18+ 
- npm (comes with Node.js)
- Git (optional, for version control)
- PM2 (for process management)

## Step 1: Prepare Files for Upload

### Files to Upload:
```
AlSaraya/
├── server/                      # Backend folder
│   ├── node_modules/           # Will install on server
│   ├── .env                    # Configure with production values
│   ├── package.json
│   ├── server.js
│   ├── auto-sync-products.js
│   └── (all other .js files)
│
├── index.html                   # All HTML files
├── shop.html
├── product-detail.html
├── checkout.html
├── admin.html
├── styles.css
├── app.js
├── admin.js
├── translations.js
├── iiko-integration.js
└── (all other frontend files)
```

## Step 2: Server Setup

### A. Install Node.js (if not installed)
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

### B. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### C. Upload Files
Using FTP/SFTP client (FileZilla, WinSCP):
- Upload entire project folder to server (e.g., `/var/www/alsaraya/`)

Or using Git:
```bash
cd /var/www/
git clone your-repository-url alsaraya
cd alsaraya
```

## Step 3: Configure Environment Variables

### Edit server/.env file on production:
```env
# iiko POS Configuration
IIKO_API_URL=https://api-eu.iiko.services
IIKO_ORG_ID=32d5187a-c03f-4b28-8c7f-901e91dc639c
IIKO_API_LOGIN=c9f9399858c240778b25dacfe2715b0a
IIKO_TERMINAL_ID=c7d35f12-dd03-c268-0173-09bb2e4900ce
IIKO_DELIVERY_ORDER_TYPE=76067ea3-356f-eb93-9d14-1fa00d082c4e
IIKO_COLLECTION_ORDER_TYPE=5b1508f9-fe5b-d6af-cb8d-043af587d5c2
IIKO_PAYMENT_TYPE_ID=0a573de9-37a8-462e-ac58-28a447a0249d
IIKO_MENU_ID=9321

# Server Configuration
PORT=3000

# Supabase Configuration
SUPABASE_URL=https://volqsrawddjdvykbgqgr.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbHFzcmF3ZGRqZHZ5a2JncWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDQ1MjgsImV4cCI6MjA4NTUyMDUyOH0.VCeo_gHgmHUl7qIsXymYBzkjqSPeS6dYCKqZYCv6itg

# Auto-sync Configuration
SYNC_INTERVAL_MINUTES=15
```

## Step 4: Install Dependencies

```bash
cd /var/www/alsaraya/server
npm install
```

## Step 5: Update Frontend API URLs

### Edit iiko-integration.js:
Change from `localhost` to your production domain:
```javascript
const IIKO_SERVER_URL = 'https://yourdomain.com'; // or 'http://your-server-ip:3000'
```

## Step 6: Start Services with PM2

### Start Backend Server:
```bash
cd /var/www/alsaraya/server
pm2 start server.js --name "alsaraya-backend"
```

### Start Auto-Sync Service:
```bash
pm2 start auto-sync-products.js --name "alsaraya-sync"
```

### Save PM2 Configuration:
```bash
pm2 save
pm2 startup
# Follow the command output to enable auto-start on server reboot
```

## Step 7: Configure Web Server (Nginx/Apache)

### Option A: Nginx Configuration

Create `/etc/nginx/sites-available/alsaraya`:
```nginx
# Frontend (Static Files)
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/alsaraya;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # Proxy API requests to Node.js backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/alsaraya /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option B: Apache Configuration

Create `/etc/apache2/sites-available/alsaraya.conf`:
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    DocumentRoot /var/www/alsaraya
    
    <Directory /var/www/alsaraya>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Proxy API requests to Node.js
    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:3000/api/
    ProxyPassReverse /api/ http://localhost:3000/api/
    
    ErrorLog ${APACHE_LOG_DIR}/alsaraya-error.log
    CustomLog ${APACHE_LOG_DIR}/alsaraya-access.log combined
</VirtualHost>
```

Enable modules and site:
```bash
sudo a2enmod proxy proxy_http rewrite
sudo a2ensite alsaraya
sudo systemctl restart apache2
```

## Step 8: Configure Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# If accessing backend directly (not recommended for production)
sudo ufw allow 3000/tcp

sudo ufw enable
```

## Step 9: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx  # For Nginx
# OR
sudo apt install certbot python3-certbot-apache  # For Apache

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
# OR
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already enabled by default)
sudo certbot renew --dry-run
```

## Step 10: Verify Deployment

### Check Services:
```bash
pm2 status
pm2 logs alsaraya-backend
pm2 logs alsaraya-sync
```

### Test Endpoints:
```bash
# Health check
curl http://localhost:3000/api/health

# Test from browser
https://yourdomain.com
https://yourdomain.com/api/iiko/test
```

## Step 11: Monitoring & Maintenance

### View Logs:
```bash
# Backend logs
pm2 logs alsaraya-backend

# Sync logs
pm2 logs alsaraya-sync

# All logs
pm2 logs

# Web server logs
sudo tail -f /var/log/nginx/error.log  # Nginx
sudo tail -f /var/log/apache2/error.log  # Apache
```

### Restart Services:
```bash
pm2 restart alsaraya-backend
pm2 restart alsaraya-sync
pm2 restart all
```

### Update Application:
```bash
cd /var/www/alsaraya
git pull  # If using Git
cd server
npm install  # If package.json changed
pm2 restart all
```

## Common Deployment Platforms

### 1. VPS (DigitalOcean, Linode, Vultr)
- Full control
- Follow guide above
- Recommended for production

### 2. Shared Hosting (cPanel)
- Upload via File Manager or FTP
- Use Node.js selector in cPanel
- Set up as Node.js application
- Configure application startup file: `server/server.js`
- Set environment variables in cPanel interface

### 3. Cloud Platforms

#### Heroku:
- Add `Procfile`:
  ```
  web: cd server && npm start
  worker: cd server && node auto-sync-products.js
  ```
- Configure environment variables in Heroku dashboard

#### Railway/Render:
- Connect GitHub repository
- Configure build command: `cd server && npm install`
- Configure start command: `cd server && npm start`
- Add environment variables in dashboard

#### AWS EC2:
- Follow VPS guide above
- Configure security groups for ports 80, 443, 3000

## Troubleshooting

### Backend won't start:
```bash
# Check logs
pm2 logs alsaraya-backend --lines 50

# Check if port is in use
sudo lsof -i :3000

# Restart
pm2 restart alsaraya-backend
```

### Frontend can't reach backend:
- Check `iiko-integration.js` has correct server URL
- Verify firewall allows port 3000 or proxy is configured
- Check CORS settings in `server.js`

### Auto-sync not working:
```bash
pm2 logs alsaraya-sync
# Check .env file has correct Supabase credentials
```

### Permission issues:
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/alsaraya

# Fix permissions
chmod -R 755 /var/www/alsaraya
```

## Security Checklist

- [ ] Use HTTPS (SSL certificate)
- [ ] Keep `.env` file secure (not in public_html)
- [ ] Set proper file permissions (755 for folders, 644 for files)
- [ ] Keep Node.js and dependencies updated
- [ ] Use firewall to restrict ports
- [ ] Regular backups of database
- [ ] Monitor PM2 logs for errors
- [ ] Use strong Supabase RLS policies

## Backup Strategy

```bash
# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
tar -czf alsaraya-backup-$DATE.tar.gz /var/www/alsaraya
# Upload to cloud storage or keep multiple versions
```

## Support

For issues:
1. Check PM2 logs: `pm2 logs`
2. Check web server logs
3. Verify all environment variables are set
4. Test backend directly: `curl http://localhost:3000/api/health`
