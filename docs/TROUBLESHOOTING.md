# Troubleshooting Guide - LMS Universitas v1.0

Panduan untuk mengatasi masalah umum yang mungkin terjadi.

## Database Issues

### 1. Connection Refused

**Error:**
```
connection to server at "localhost" (127.0.0.1), port 5432 failed: Connection refused
```

**Solutions:**

1. **Check if PostgreSQL is running:**
   ```bash
   # Ubuntu/Debian
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   
   # macOS
   brew services list | grep postgresql
   brew services start postgresql
   ```

2. **Check PostgreSQL configuration:**
   ```bash
   sudo -u postgres psql -c "SHOW config_file;"
   # Edit the config file shown
   sudo nano /etc/postgresql/14/main/postgresql.conf
   
   # Ensure these settings:
   listen_addresses = 'localhost'
   port = 5432
   ```

3. **Restart PostgreSQL:**
   ```bash
   sudo systemctl restart postgresql
   ```

### 2. Authentication Failed

**Error:**
```
password authentication failed for user "lms_user"
```

**Solutions:**

1. **Reset user password:**
   ```bash
   sudo -u postgres psql
   ALTER USER lms_user WITH PASSWORD 'new_password';
   \q
   ```

2. **Check pg_hba.conf:**
   ```bash
   sudo nano /etc/postgresql/14/main/pg_hba.conf
   
   # Add or modify this line:
   local   all             lms_user                                md5
   
   # Restart PostgreSQL
   sudo systemctl restart postgresql
   ```

### 3. Database Does Not Exist

**Error:**
```
database "lms_db" does not exist
```

**Solution:**
```bash
# Recreate database
sudo -u postgres psql
CREATE DATABASE lms_db;
GRANT ALL PRIVILEGES ON DATABASE lms_db TO lms_user;
\q

# Run migrations
cd backend
npm run migration:run
npm run seed
```

## Application Issues

### 1. Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

1. **Find and kill the process:**
   ```bash
   # Find process using port 3000
   lsof -ti:3000
   
   # Kill the process
   kill -9 $(lsof -ti:3000)
   
   # Or for port 3001 (frontend)
   kill -9 $(lsof -ti:3001)
   ```

2. **Use different ports:**
   ```bash
   # Backend: Edit backend/.env
   PORT=3002
   
   # Frontend: Start with different port
   PORT=3003 npm start
   ```

### 2. Module Not Found

**Error:**
```
Cannot find module 'module-name'
```

**Solutions:**

1. **Reinstall dependencies:**
   ```bash
   # Backend
   cd backend
   rm -rf node_modules package-lock.json
   npm install
   
   # Frontend
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

### 3. Migration Failed

**Error:**
```
QueryFailedError: relation "users" already exists
```

**Solutions:**

1. **Reset database:**
   ```bash
   ./scripts/reset-db.sh
   ```

2. **Manual reset:**
   ```bash
   sudo -u postgres psql
   DROP DATABASE lms_db;
   CREATE DATABASE lms_db;
   GRANT ALL PRIVILEGES ON DATABASE lms_db TO lms_user;
   \q
   
   cd backend
   npm run migration:run
   npm run seed
   ```

## Frontend Issues

### 1. API Connection Failed

**Error:**
```
Network Error / CORS Error
```

**Solutions:**

1. **Check backend is running:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Check environment variables:**
   ```bash
   # frontend/.env
   REACT_APP_API_URL=http://localhost:3000/api
   ```

3. **Check CORS settings:**
   ```bash
   # backend/.env
   CORS_ORIGIN=http://localhost:3001
   ```

### 2. Build Failed

**Error:**
```
TreatWarningsAsErrors: true
```

**Solutions:**

1. **Fix warnings:**
   - Remove unused imports
   - Add missing dependencies
   - Fix TypeScript errors

2. **Disable warnings as errors (temporary):**
   ```bash
   # Add to frontend/.env
   GENERATE_SOURCEMAP=false
   DISABLE_ESLINT_PLUGIN=true
   ```

## Docker Issues

### 1. Docker Build Failed

**Error:**
```
failed to solve with frontend dockerfile.v0
```

**Solutions:**

1. **Clean Docker cache:**
   ```bash
   docker system prune -a
   docker builder prune
   ```

2. **Rebuild without cache:**
   ```bash
   docker-compose build --no-cache
   ```

### 2. Container Won't Start

**Error:**
```
container exited with code 1
```

**Solutions:**

1. **Check logs:**
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   docker-compose logs postgres
   ```

2. **Check environment variables:**
   ```bash
   # Edit docker-compose.yml
   # Ensure all required environment variables are set
   ```

## Performance Issues

### 1. Slow Database Queries

**Solutions:**

1. **Check database performance:**
   ```bash
   sudo -u postgres psql lms_db
   
   # Enable query logging
   ALTER SYSTEM SET log_statement = 'all';
   SELECT pg_reload_conf();
   
   # Check slow queries
   SELECT query, calls, total_time, mean_time 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC;
   ```

2. **Add database indexes:**
   ```sql
   -- Example: Add index for frequently queried columns
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_courses_semester ON courses(semester);
   ```

### 2. High Memory Usage

**Solutions:**

1. **Monitor memory usage:**
   ```bash
   # Check system memory
   free -h
   
   # Check process memory
   ps aux --sort=-%mem | head
   
   # Check Node.js memory
   node --max-old-space-size=4096 dist/main.js
   ```

2. **Optimize application:**
   - Enable gzip compression
   - Implement pagination
   - Add database connection pooling
   - Use CDN for static assets

## SSL/Security Issues

### 1. SSL Certificate Error

**Error:**
```
SSL certificate verification failed
```

**Solutions:**

1. **Renew SSL certificate:**
   ```bash
   sudo certbot renew
   sudo systemctl reload nginx
   ```

2. **Check certificate validity:**
   ```bash
   openssl x509 -in /etc/letsencrypt/live/domain.com/fullchain.pem -text -noout
   ```

### 2. CORS Issues in Production

**Solutions:**

1. **Update CORS settings:**
   ```bash
   # backend/.env.production
   CORS_ORIGIN=https://yourdomain.com
   ```

2. **Check Nginx configuration:**
   ```nginx
   # Add to nginx config
   add_header Access-Control-Allow-Origin "https://yourdomain.com";
   add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
   add_header Access-Control-Allow-Headers "Content-Type, Authorization";
   ```

## File Upload Issues

### 1. File Upload Failed

**Error:**
```
Multer error: File too large
```

**Solutions:**

1. **Increase file size limit:**
   ```bash
   # backend/.env
   MAX_FILE_SIZE=52428800  # 50MB
   ```

2. **Check disk space:**
   ```bash
   df -h
   # Ensure sufficient space in upload directory
   ```

3. **Check permissions:**
   ```bash
   chmod 755 backend/uploads
   chown -R $USER:$USER backend/uploads
   ```

## Getting Help

### 1. Enable Debug Logging

```bash
# Backend debug
DEBUG=* npm run start:dev

# Database query logging
echo "log_statement = 'all'" >> /etc/postgresql/14/main/postgresql.conf
sudo systemctl restart postgresql
```

### 2. Check System Resources

```bash
# CPU usage
top
htop

# Memory usage
free -h

# Disk usage
df -h

# Network connections
netstat -tulpn
```

### 3. Application Health Check

```bash
# Check all services
curl http://localhost:3000/api/health
curl http://localhost:3001

# Check database connection
psql -h localhost -U lms_user -d lms_db -c "SELECT version();"
```

### 4. Collect Information for Support

When reporting issues, include:

1. **System information:**
   ```bash
   uname -a
   node --version
   npm --version
   psql --version
   ```

2. **Error logs:**
   ```bash
   # Application logs
   npm run start:dev 2>&1 | tee app.log
   
   # System logs
   sudo journalctl -u postgresql
   sudo journalctl -u nginx
   ```

3. **Configuration files:**
   - backend/.env (remove sensitive data)
   - docker-compose.yml
   - nginx configuration

### 5. Reset Everything

If all else fails, complete reset:

```bash
# Stop all services
docker-compose down
pkill -f "node"

# Clean database
./scripts/reset-db.sh

# Clean dependencies
rm -rf backend/node_modules frontend/node_modules
rm -f backend/package-lock.json frontend/package-lock.json

# Reinstall everything
./scripts/setup.sh
```

## Contact Support

If you're still experiencing issues:

1. **GitHub Issues**: Create an issue with detailed error logs
2. **Documentation**: Check docs/SETUP.md and docs/DEPLOYMENT.md
3. **Community**: Join our community discussions

Remember to remove sensitive information (passwords, secrets) before sharing logs or configuration files.
