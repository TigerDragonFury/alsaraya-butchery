# Production Deployment Checklist

## Before Upload
- [ ] Backup current website (if any)
- [ ] Test everything works locally
- [ ] Note down all credentials
- [ ] Have domain name ready
- [ ] Have server access (SSH/FTP)

## Files to Upload
- [ ] All HTML files (index.html, shop.html, checkout.html, admin.html, etc.)
- [ ] CSS file (styles.css)
- [ ] JavaScript files (app.js, admin.js, iiko-integration.js, translations.js)
- [ ] server/ folder with all backend files
- [ ] server/.env file (configured with production values)
- [ ] server/package.json

## Server Setup
- [ ] Node.js 18+ installed
- [ ] PM2 installed globally
- [ ] Files uploaded to server
- [ ] Run: `cd server && npm install`
- [ ] Configure .env file with production values

## Update Frontend
- [ ] Edit iiko-integration.js
- [ ] Change `IIKO_SERVER_URL` from localhost to your domain
  ```javascript
  const IIKO_SERVER_URL = 'https://yourdomain.com';
  ```

## Start Services
- [ ] Run: `pm2 start server/server.js --name alsaraya-backend`
- [ ] Run: `pm2 start server/auto-sync-products.js --name alsaraya-sync`
- [ ] Run: `pm2 save`
- [ ] Run: `pm2 startup` (follow instructions)

## Web Server Configuration
- [ ] Configure Nginx or Apache
- [ ] Point document root to project folder
- [ ] Setup proxy for /api/ to localhost:3000
- [ ] Test configuration
- [ ] Restart web server

## SSL Certificate
- [ ] Install certbot
- [ ] Run: `sudo certbot --nginx -d yourdomain.com`
- [ ] Verify HTTPS works

## Firewall
- [ ] Allow port 80 (HTTP)
- [ ] Allow port 443 (HTTPS)
- [ ] Enable firewall

## Testing
- [ ] Visit https://yourdomain.com
- [ ] Test product browsing
- [ ] Test checkout process
- [ ] Verify orders reach iiko
- [ ] Check PM2 logs for errors
- [ ] Test admin panel

## Monitoring
- [ ] Setup: `pm2 monit` for live monitoring
- [ ] Check logs: `pm2 logs`
- [ ] Verify auto-sync is working

## Optional Enhancements
- [ ] Setup automated backups
- [ ] Configure monitoring/alerting
- [ ] Setup log rotation
- [ ] Configure CDN for assets
- [ ] Setup staging environment

## Quick Commands Reference
```bash
# View service status
pm2 status

# View logs
pm2 logs
pm2 logs alsaraya-backend
pm2 logs alsaraya-sync

# Restart services
pm2 restart alsaraya-backend
pm2 restart alsaraya-sync
pm2 restart all

# Stop services
pm2 stop all

# Monitor resources
pm2 monit

# Update application
cd /var/www/alsaraya
git pull  # or upload new files
cd server
npm install
pm2 restart all
```

## Troubleshooting
- Backend not starting? Check: `pm2 logs alsaraya-backend`
- Frontend can't reach backend? Update iiko-integration.js URL
- Orders not syncing? Check: `pm2 logs alsaraya-sync`
- Permission errors? Run: `chmod -R 755 /var/www/alsaraya`

## Support Contacts
- iiko Support: For Back Office access and Menu ID 9321 setup
- Hosting Provider: For server access and configuration help
- Domain Registrar: For DNS configuration

## Important Notes
- Keep .env file secure (never expose publicly)
- Regular backups recommended
- Monitor PM2 logs daily initially
- Update dependencies periodically: `npm update`
