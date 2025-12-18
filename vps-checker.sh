#!/bin/bash

echo "🔍 VPS Requirements Checker for School Forum"
echo "============================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_installed() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 is installed${NC}"
        if [ "$1" = "node" ]; then
            echo "   Version: $(node --version)"
        elif [ "$1" = "npm" ]; then
            echo "   Version: $(npm --version)"
        elif [ "$1" = "mysql" ]; then
            echo "   Version: $(mysql --version)"
        elif [ "$1" = "nginx" ]; then
            echo "   Version: $(nginx -v 2>&1)"
        elif [ "$1" = "pm2" ]; then
            echo "   Version: $(pm2 --version)"
        fi
        return 0
    else
        echo -e "${RED}❌ $1 is NOT installed${NC}"
        return 1
    fi
}

check_service() {
    if systemctl is-active --quiet $1; then
        echo -e "${GREEN}✅ $1 service is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 service is NOT running${NC}"
        return 1
    fi
}

check_port() {
    if netstat -tuln | grep -q ":$1 "; then
        echo -e "${GREEN}✅ Port $1 is in use${NC}"
        return 0
    else
        echo -e "${RED}❌ Port $1 is NOT in use${NC}"
        return 1
    fi
}

echo
echo "📦 Checking Required Software..."
echo "--------------------------------"

# Check Node.js
check_installed "node"
NODE_OK=$?

# Check NPM
check_installed "npm"
NPM_OK=$?

# Check MySQL
check_installed "mysql"
MYSQL_OK=$?

# Check Nginx
check_installed "nginx"
NGINX_OK=$?

# Check PM2
check_installed "pm2"
PM2_OK=$?

# Check Git
check_installed "git"
GIT_OK=$?

echo
echo "🔧 Checking Services..."
echo "----------------------"

# Check MySQL service
check_service "mysql"
MYSQL_SERVICE_OK=$?

# Check Nginx service
check_service "nginx"
NGINX_SERVICE_OK=$?

echo
echo "🌐 Checking Ports..."
echo "-------------------"

# Check if MySQL port is open
check_port "3306"
MYSQL_PORT_OK=$?

# Check if HTTP port is open
check_port "80"
HTTP_PORT_OK=$?

echo
echo "📁 Checking Project Files..."
echo "----------------------------"

# Check if project exists
if [ -d "/var/www/School_forum" ]; then
    echo -e "${GREEN}✅ Project directory exists: /var/www/School_forum${NC}"
    PROJECT_EXISTS=0
    
    # Check backend
    if [ -d "/var/www/School_forum/backend" ]; then
        echo -e "${GREEN}✅ Backend directory exists${NC}"
        
        # Check package.json
        if [ -f "/var/www/School_forum/backend/package.json" ]; then
            echo -e "${GREEN}✅ Backend package.json exists${NC}"
        else
            echo -e "${RED}❌ Backend package.json missing${NC}"
        fi
        
        # Check .env
        if [ -f "/var/www/School_forum/backend/.env" ]; then
            echo -e "${GREEN}✅ Backend .env exists${NC}"
        else
            echo -e "${RED}❌ Backend .env missing${NC}"
        fi
        
        # Check node_modules
        if [ -d "/var/www/School_forum/backend/node_modules" ]; then
            echo -e "${GREEN}✅ Backend dependencies installed${NC}"
        else
            echo -e "${RED}❌ Backend dependencies NOT installed${NC}"
        fi
    else
        echo -e "${RED}❌ Backend directory missing${NC}"
    fi
    
    # Check frontend
    if [ -d "/var/www/School_forum/frontend" ]; then
        echo -e "${GREEN}✅ Frontend directory exists${NC}"
        
        # Check if built
        if [ -d "/var/www/School_forum/frontend/build" ]; then
            echo -e "${GREEN}✅ Frontend is built${NC}"
        else
            echo -e "${RED}❌ Frontend is NOT built${NC}"
        fi
    else
        echo -e "${RED}❌ Frontend directory missing${NC}"
    fi
else
    echo -e "${RED}❌ Project directory missing: /var/www/School_forum${NC}"
    PROJECT_EXISTS=1
fi

echo
echo "🗄️ Checking Database..."
echo "-----------------------"

# Check if we can connect to MySQL
if mysql -u root -e "SELECT 1;" &> /dev/null; then
    echo -e "${GREEN}✅ MySQL root access works${NC}"
    
    # Check if school_forum database exists
    if mysql -u root -e "USE school_forum; SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}✅ school_forum database exists${NC}"
        
        # Check if users table exists
        if mysql -u root -e "USE school_forum; DESCRIBE users;" &> /dev/null; then
            echo -e "${GREEN}✅ users table exists${NC}"
        else
            echo -e "${RED}❌ users table missing${NC}"
        fi
    else
        echo -e "${RED}❌ school_forum database missing${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Cannot connect to MySQL as root (might need password)${NC}"
fi

echo
echo "🚀 Checking Running Processes..."
echo "-------------------------------"

# Check if PM2 processes are running
if pm2 list | grep -q "school-forum"; then
    echo -e "${GREEN}✅ School Forum backend is running in PM2${NC}"
    pm2 list | grep school-forum
else
    echo -e "${RED}❌ School Forum backend is NOT running in PM2${NC}"
fi

echo
echo "📊 SUMMARY"
echo "=========="

TOTAL_CHECKS=0
PASSED_CHECKS=0

# Count checks
if [ $NODE_OK -eq 0 ]; then ((PASSED_CHECKS++)); fi; ((TOTAL_CHECKS++))
if [ $NPM_OK -eq 0 ]; then ((PASSED_CHECKS++)); fi; ((TOTAL_CHECKS++))
if [ $MYSQL_OK -eq 0 ]; then ((PASSED_CHECKS++)); fi; ((TOTAL_CHECKS++))
if [ $NGINX_OK -eq 0 ]; then ((PASSED_CHECKS++)); fi; ((TOTAL_CHECKS++))
if [ $PM2_OK -eq 0 ]; then ((PASSED_CHECKS++)); fi; ((TOTAL_CHECKS++))
if [ $GIT_OK -eq 0 ]; then ((PASSED_CHECKS++)); fi; ((TOTAL_CHECKS++))

echo "Passed: $PASSED_CHECKS/$TOTAL_CHECKS checks"

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
    echo -e "${GREEN}🎉 Your VPS is ready for School Forum deployment!${NC}"
else
    echo -e "${YELLOW}⚠️ Some requirements are missing. Check the details above.${NC}"
fi

echo
echo "💡 Quick Fix Commands:"
echo "---------------------"
echo "Install missing software:"
echo "sudo apt update && sudo apt install -y nodejs npm mysql-server nginx git"
echo "sudo npm install -g pm2"
echo
echo "Start services:"
echo "sudo systemctl start mysql nginx"
echo "sudo systemctl enable mysql nginx"
echo
echo "Clone/update project:"
echo "cd /var/www && sudo git clone https://github.com/mj7635827-code/School_forum.git"
echo "cd School_forum && git pull"