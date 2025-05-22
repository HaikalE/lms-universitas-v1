# Deployment Guide - LMS Universitas v1.0

Panduan deployment untuk production environment.

## Server Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **OS**: Ubuntu 20.04 LTS atau lebih baru

### Recommended Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **OS**: Ubuntu 22.04 LTS

## 1. Server Setup

### Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Install Dependencies

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 for process management
npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

## 2. Database Setup

### Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE lms_db;
CREATE USER lms_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE lms_db TO lms_user;

# Exit PostgreSQL
\q
```

### Secure PostgreSQL

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf

# Update these settings:
# listen_addresses = 'localhost'
# port = 5432

# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Ensure this line exists:
# local   all             lms_user                                md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## 3. Application Deployment

### Clone Repository

```bash
# Create app directory
sudo mkdir -p /var/www/lms
sudo chown $USER:$USER /var/www/lms

# Clone repository
git clone https://github.com/HaikalE/lms-universitas-v1.git /var/www/lms
cd /var/www/lms
```

### Backend Setup

```bash
cd /var/www/lms/backend

# Install dependencies
npm ci --only=production

# Create production environment file
cp .env.example .env.production

# Edit environment variables
nano .env.production
```

### Production Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=lms_user
DB_PASSWORD=your_secure_password
DB_DATABASE=lms_db

# JWT - Generate a strong secret!
JWT_SECRET=your-super-secure-jwt-secret-for-production
JWT_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=production
APP_URL=https://yourdomain.com

# File Upload
UPLOAD_DEST=/var/www/lms/uploads
MAX_FILE_SIZE=10485760

# Cors
CORS_ORIGIN=https://yourdomain.com
```

### Build and Run Backend

```bash
# Build application
npm run build

# Run migrations
npm run migration:run

# Run seed (optional for production)
npm run seed

# Create uploads directory
mkdir -p /var/www/lms/uploads
chmod 755 /var/www/lms/uploads
```

### Frontend Setup

```bash
cd /var/www/lms/frontend

# Install dependencies
npm ci

# Create production environment
echo "REACT_APP_API_URL=https://yourdomain.com/api" > .env.production

# Build for production
npm run build
```

## 4. PM2 Process Management

### Create PM2 Configuration

```bash
# Create PM2 ecosystem file
nano /var/www/lms/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'lms-backend',
    script: './dist/main.js',
    cwd: '/var/www/lms/backend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env.production',
    error_file: '/var/log/lms/backend-error.log',
    out_file: '/var/log/lms/backend-out.log',
    log_file: '/var/log/lms/backend.log',
    max_memory_restart: '1G'
  }]
};
```

### Start Application with PM2

```bash
# Create log directory
sudo mkdir -p /var/log/lms
sudo chown $USER:$USER /var/log/lms

# Start application
cd /var/www/lms
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Generate startup script
pm2 startup
# Follow the instructions printed by the command above
```

## 5. Nginx Configuration

### Create Nginx Site Configuration

```bash
sudo nano /etc/nginx/sites-available/lms
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (will be configured by certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Root directory for frontend
    root /var/www/lms/frontend/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # API requests
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # File uploads
    location /uploads {
        alias /var/www/lms/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend routing
    location / {
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable Site

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/lms /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 6. SSL Certificate

### Install SSL Certificate

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

## 7. Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Check status
sudo ufw status
```

## 8. Monitoring and Logging

### Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/lms
```

```
/var/log/lms/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reload all
    endscript
}
```

### PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs

# Restart application
pm2 restart all

# Reload application (zero downtime)
pm2 reload all
```

## 9. Backup Strategy

### Database Backup

```bash
# Create backup script
sudo nano /usr/local/bin/backup-lms.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/lms"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -h localhost -U lms_user -d lms_db > $BACKUP_DIR/lms_db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/lms/uploads

# Remove backups older than 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/backup-lms.sh

# Add to crontab (daily backup at 2 AM)
sudo crontab -e
# Add this line:
# 0 2 * * * /usr/local/bin/backup-lms.sh
```

## 10. Maintenance

### Update Application

```bash
cd /var/www/lms

# Pull latest changes
git pull origin main

# Update backend
cd backend
npm ci --only=production
npm run build
npm run migration:run

# Update frontend
cd ../frontend
npm ci
npm run build

# Restart application
pm2 reload all
```

### Health Checks

```bash
# Check application status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check PostgreSQL status
sudo systemctl status postgresql

# Check disk usage
df -h

# Check memory usage
free -h

# Check application logs
pm2 logs --lines 100
```

## Security Considerations

1. **Regular Updates**: Keep system and dependencies updated
2. **Strong Passwords**: Use strong passwords for database and JWT secret
3. **Firewall**: Only open necessary ports
4. **SSL/TLS**: Always use HTTPS in production
5. **Backup**: Regular automated backups
6. **Monitoring**: Set up monitoring and alerting
7. **Access Control**: Limit SSH access and use key-based authentication

## Troubleshooting

### Application Not Starting

```bash
# Check PM2 logs
pm2 logs

# Check system logs
sudo journalctl -u nginx
sudo journalctl -u postgresql
```

### Database Connection Issues

```bash
# Test database connection
psql -h localhost -U lms_user -d lms_db

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Performance Issues

```bash
# Check resource usage
top
htop
iotop

# Check application performance
pm2 monit
```

Untuk bantuan lebih lanjut, silakan hubungi tim development atau buat issue di repository GitHub.
