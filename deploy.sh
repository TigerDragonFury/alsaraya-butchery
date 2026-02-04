#!/bin/bash

# Al Saraya Butchery - Auto Deployment Script
# Run this script on your production server after uploading files

echo "🚀 Al Saraya Butchery - Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${YELLOW}⚠️  Please don't run as root. Run as your regular user.${NC}"
    exit 1
fi

# Get current directory
DEPLOY_DIR=$(pwd)
echo "📁 Deployment directory: $DEPLOY_DIR"
echo ""

# Step 1: Check Node.js installation
echo "🔍 Step 1: Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}✅ Node.js $(node --version) installed${NC}"
fi
echo ""

# Step 2: Check PM2 installation
echo "🔍 Step 2: Checking PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
else
    echo -e "${GREEN}✅ PM2 installed${NC}"
fi
echo ""

# Step 3: Install dependencies
echo "📦 Step 3: Installing dependencies..."
cd "$DEPLOY_DIR/server" || exit 1
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo ""

# Step 4: Check .env file
echo "🔍 Step 4: Checking environment variables..."
if [ -f "$DEPLOY_DIR/server/.env" ]; then
    echo -e "${GREEN}✅ .env file found${NC}"
    
    # Check required variables
    required_vars=("IIKO_API_URL" "IIKO_ORG_ID" "IIKO_API_LOGIN" "SUPABASE_URL" "SUPABASE_KEY")
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" "$DEPLOY_DIR/server/.env"; then
            echo "  ✓ $var configured"
        else
            echo -e "${RED}  ✗ $var missing${NC}"
        fi
    done
else
    echo -e "${YELLOW}⚠️  .env file not found. Creating template...${NC}"
    cp "$DEPLOY_DIR/server/.env.example" "$DEPLOY_DIR/server/.env" 2>/dev/null || echo "Please create .env file manually"
fi
echo ""

# Step 5: Stop existing PM2 processes
echo "🛑 Step 5: Stopping existing processes..."
pm2 stop alsaraya-backend 2>/dev/null || true
pm2 stop alsaraya-sync 2>/dev/null || true
pm2 delete alsaraya-backend 2>/dev/null || true
pm2 delete alsaraya-sync 2>/dev/null || true
echo ""

# Step 6: Start services with PM2
echo "🚀 Step 6: Starting services..."
cd "$DEPLOY_DIR/server" || exit 1

# Start backend
pm2 start server.js --name "alsaraya-backend" --time
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend started${NC}"
else
    echo -e "${RED}❌ Failed to start backend${NC}"
    exit 1
fi

# Start auto-sync
pm2 start auto-sync-products.js --name "alsaraya-sync" --time
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Auto-sync started${NC}"
else
    echo -e "${RED}❌ Failed to start auto-sync${NC}"
fi
echo ""

# Step 7: Save PM2 configuration
echo "💾 Step 7: Saving PM2 configuration..."
pm2 save
echo ""

# Step 8: Setup PM2 startup
echo "⚙️  Step 8: Configuring auto-startup..."
echo "Run this command to enable auto-start on server reboot:"
echo ""
pm2 startup | grep "sudo"
echo ""

# Step 9: Display status
echo "📊 Step 9: Service Status"
echo "=========================="
pm2 status
echo ""

# Step 10: Check if services are running
echo "🔍 Step 10: Health Check..."
sleep 3
if pm2 list | grep -q "alsaraya-backend.*online"; then
    echo -e "${GREEN}✅ Backend is running${NC}"
    
    # Test health endpoint
    if command -v curl &> /dev/null; then
        echo "Testing backend endpoint..."
        curl -s http://localhost:3000/api/health > /dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Backend responding to requests${NC}"
        else
            echo -e "${YELLOW}⚠️  Backend not responding yet (may need time to start)${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Backend is not running${NC}"
    echo "Check logs with: pm2 logs alsaraya-backend"
fi

if pm2 list | grep -q "alsaraya-sync.*online"; then
    echo -e "${GREEN}✅ Auto-sync is running${NC}"
else
    echo -e "${YELLOW}⚠️  Auto-sync is not running${NC}"
    echo "Check logs with: pm2 logs alsaraya-sync"
fi
echo ""

# Summary
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Configure your web server (Nginx/Apache) to serve:"
echo "   - Frontend: $DEPLOY_DIR"
echo "   - Backend API: Proxy to http://localhost:3000"
echo ""
echo "2. Update frontend API URL in iiko-integration.js:"
echo "   Change localhost to your production domain"
echo ""
echo "3. Setup SSL certificate:"
echo "   sudo certbot --nginx -d yourdomain.com"
echo ""
echo "4. View logs:"
echo "   pm2 logs                    # All logs"
echo "   pm2 logs alsaraya-backend   # Backend only"
echo "   pm2 logs alsaraya-sync      # Sync only"
echo ""
echo "5. Restart services:"
echo "   pm2 restart all"
echo ""
echo "📚 Full guide: See DEPLOYMENT-GUIDE.md"
echo ""
