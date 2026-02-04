# iiko POS Integration Server

Backend server for integrating Al Saraya Butchery website with iiko POS system.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and add your iiko credentials:
```bash
cp .env.example .env
```

Edit `.env` with your actual credentials.

### 3. Start Server

**Windows:**
```bash
start-server.bat
```

**Linux/Mac:**
```bash
npm start
```

## API Endpoints

### Health Check
```
GET /api/health
```
Returns server status.

### Test iiko Connection
```
GET /api/iiko/test
```
Tests connection to iiko API and authentication.

### Get iiko Menu
```
GET /api/iiko/menu
```
Retrieves menu/nomenclature from iiko.

### Create Order
```
POST /api/iiko/create-order
Content-Type: application/json

{
  "customerName": "John Doe",
  "customerPhone": "+971501234567",
  "customerEmail": "john@example.com",
  "address": "123 Street, Dubai",
  "notes": "Please call before delivery",
  "items": [
    {
      "id": "prod-1",
      "name": "Premium Beef",
      "quantity": 2,
      "price": 45.00,
      "iikoProductId": "iiko-product-id-here"
    }
  ],
  "total": 90.00,
  "paymentMethod": "cash"
}
```

## Configuration

All configuration is done via environment variables in `.env`:

- `IIKO_API_URL` - iiko API endpoint
- `IIKO_ORG_ID` - Your organization ID
- `IIKO_API_LOGIN` - API login
- `IIKO_API_KEY` - API key
- `IIKO_TERMINAL_ID` - Terminal/location ID
- `PORT` - Server port (default: 3000)

## Development

### Watch Mode
```bash
npm run dev
```
Uses nodemon for auto-restart on file changes.

### Logs
Server logs are printed to console. In production, consider using:
- PM2 for process management
- Winston for structured logging
- Sentry for error tracking

## Production Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start server.js --name iiko-integration
pm2 save
pm2 startup
```

### Using Docker
```bash
docker build -t alsaraya-iiko .
docker run -p 3000:3000 --env-file .env alsaraya-iiko
```

### Deploy to Cloud
- Heroku: `git push heroku main`
- Railway: Connect GitHub repo
- AWS: Use Elastic Beanstalk or ECS

## Security

- Never commit `.env` file
- Use HTTPS in production
- Implement rate limiting
- Add request validation
- Monitor API usage

## Troubleshooting

**Server won't start:**
- Check Node.js is installed: `node --version`
- Verify `.env` file exists
- Check port 3000 is available

**iiko API errors:**
- Verify credentials in `.env`
- Check organization ID is correct
- Ensure API access is enabled
- Contact iiko support

**Orders not appearing:**
- Verify terminal ID is correct
- Check product IDs are mapped
- Review server logs
- Test with `/api/iiko/test`

## Support

For issues:
1. Check server logs
2. Test API endpoints
3. Review [IIKO_SETUP_GUIDE.md](../IIKO_SETUP_GUIDE.md)
4. Contact iiko support

## License

Proprietary - Al Saraya Butchery
