#!/bin/bash

echo "🚀 School Forum VPS Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root"
    exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js
print_status "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
print_status "Installing MySQL..."
sudo apt install mysql-server -y

# Install other dependencies
print_status "Installing additional packages..."
sudo npm install -g pm2
sudo apt install nginx git -y

# Clone repository
print_status "Cloning repository..."
cd /var/www
sudo git clone https://github.com/mj7635827-code/School_forum.git
sudo chown -R $USER:$USER School_forum
cd School_forum

# Setup backend
print_status "Setting up backend..."
cd backend
npm install

# Prompt for database password
echo -n "Enter MySQL password for forum_user: "
read -s DB_PASSWORD
echo

# Create .env file
cat > .env << EOF
DB_HOST=localhost
DB_USER=forum_user
DB_PASSWORD=$DB_PASSWORD
DB_NAME=school_forum
DB_PORT=3306
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://$(curl -s ifconfig.me)
EOF

print_status "Backend configured"

# Setup frontend
print_status "Setting up frontend..."
cd ../frontend
npm install

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

cat > .env.production << EOF
REACT_APP_API_URL=http://$SERVER_IP:5000
GENERATE_SOURCEMAP=false
CI=false
EOF

npm run build
print_status "Frontend built successfully"

# Start backend with PM2
print_status "Starting backend with PM2..."
cd ../backend
pm2 start src/server.js --name "school-forum-backend"
pm2 save
pm2 startup

# Configure Nginx
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/school-forum << EOF
server {
    listen 80;
    server_name $SERVER_IP;

    location / {
        root /var/www/School_forum/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/school-forum /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

print_status "Deployment completed!"
echo
echo "🎉 Your School Forum is now live!"
echo "📱 Frontend: http://$SERVER_IP"
echo "🔌 Backend API: http://$SERVER_IP/api"
echo "🏥 Health Check: http://$SERVER_IP/api/health"
echo
echo "📋 Demo Accounts:"
echo "   Admin: admin@school.edu / AdminPass123!"
echo "   Moderator: moderator@school.edu / ModPass123!"
echo "   Student: student@gmail.com / StudentPass123!"
echo
print_warning "Don't forget to setup the MySQL database manually:"
echo "sudo mysql -u root -p"
echo "CREATE DATABASE school_forum;"
echo "CREATE USER 'forum_user'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
echo "GRANT ALL PRIVILEGES ON school_forum.* TO 'forum_user'@'localhost';"
echo "FLUSH PRIVILEGES;"
echo "EXIT;"