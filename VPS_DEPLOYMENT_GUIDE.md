# 🚀 VPS Deployment Guide - School Forum

## Step 1: Connect to your VPS
```bash
ssh username@your-vps-ip
# or use PuTTY if on Windows
```

## Step 2: Install Required Software
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx (Web Server)
sudo apt install nginx -y

# Install Git
sudo apt install git -y
```

## Step 3: Clone Your Project
```bash
# Navigate to web directory
cd /var/www

# Clone your repository
sudo git clone https://github.com/mj7635827-code/School_forum.git
sudo chown -R $USER:$USER School_forum
cd School_forum
```

## Step 4: Setup Database
```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE school_forum;
CREATE USER 'forum_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON school_forum.* TO 'forum_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 5: Configure Backend
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DB_HOST=localhost
DB_USER=forum_user
DB_PASSWORD=your_secure_password
DB_NAME=school_forum
DB_PORT=3306
JWT_SECRET=your-super-secret-jwt-key-make-it-very-long-and-random
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://your-vps-ip
EOF

# Run database setup
node create-users-table.js
node fix-database.js
```

## Step 6: Build and Configure Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Create production environment
cat > .env.production << EOF
REACT_APP_API_URL=http://your-vps-ip:5000
GENERATE_SOURCEMAP=false
CI=false
EOF

# Build frontend
npm run build
```

## Step 7: Start Backend with PM2
```bash
cd ../backend

# Start backend with PM2
pm2 start src/server.js --name "school-forum-backend"

# Save PM2 configuration
pm2 save
pm2 startup
```

## Step 8: Configure Nginx
```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/school-forum << EOF
server {
    listen 80;
    server_name your-vps-ip;

    # Serve frontend
    location / {
        root /var/www/School_forum/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy API requests to backend
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

# Enable the site
sudo ln -s /etc/nginx/sites-available/school-forum /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

## Step 9: Configure Firewall
```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Step 10: Test Your Deployment
```bash
# Check backend status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Test API
curl http://your-vps-ip/api/health

# Your site should be live at: http://your-vps-ip
```

## 🎯 Final URLs:
- **Frontend:** http://your-vps-ip
- **Backend API:** http://your-vps-ip/api
- **Health Check:** http://your-vps-ip/api/health

## 🔧 Useful Commands:
```bash
# View backend logs
pm2 logs school-forum-backend

# Restart backend
pm2 restart school-forum-backend

# Update code
cd /var/www/School_forum
git pull
cd backend && npm install
cd ../frontend && npm install && npm run build
pm2 restart school-forum-backend
sudo systemctl reload nginx
```

## 🚨 Replace These Values:
- `your-vps-ip` - Your actual VPS IP address
- `your_secure_password` - Strong MySQL password
- `username` - Your VPS username

## Demo Accounts (Already in database):
- Admin: admin@school.edu / AdminPass123!
- Moderator: moderator@school.edu / ModPass123!
- Student: student@gmail.com / StudentPass123!