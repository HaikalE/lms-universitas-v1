# 🌐 LMS Port Configuration Guide

## **FINAL PORT MAPPING**

### **🚀 Production (Docker)**
```bash
docker-compose up --build
```

**✅ Frontend LMS**: `http://localhost:3001`
**✅ Backend API**: `http://localhost:3000`

### **💻 Development Mode**
```bash
# Terminal 1
cd backend && npm start

# Terminal 2  
cd frontend && npm start
```

**Frontend**: `http://localhost:3000` (React dev server)
**Backend**: `http://localhost:3001` (NestJS API)

---

## **📋 Step-by-Step Deployment**

### **1. Build & Run dengan Docker**
```bash
# Clone repository
git clone https://github.com/HaikalE/lms-universitas-v1.git
cd lms-universitas-v1

# Build & run (akan build otomatis)
docker-compose up --build

# Background mode
docker-compose up --build -d
```

### **2. Akses Aplikasi**
- 🌐 **Frontend**: http://localhost:3001
- 🔧 **Backend API**: http://localhost:3000
- 📝 **API Docs**: http://localhost:3000/api (jika ada Swagger)

### **3. Login Admin (Default)**
```
Email: admin@university.edu
Password: admin123
```
*Pastikan seeder database sudah running*

---

## **🔧 Troubleshooting Ports**

### **Port Conflict**
```bash
# Check port usage
netstat -tulpn | grep :3001
lsof -i :3001

# Stop process using port
sudo kill -9 <PID>
```

### **Custom Port**
Edit `docker-compose.yml` untuk custom port:
```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Akses di http://localhost:8080
```

### **Development Port Change**
Edit `package.json` di frontend:
```json
{
  "scripts": {
    "start": "PORT=3002 react-scripts start"
  }
}
```

---

## **🎯 Quick Commands**

### **Start Services**
```bash
docker-compose up -d          # Background mode
docker-compose up --build     # Rebuild & start
docker-compose restart        # Restart services
```

### **Stop Services**
```bash
docker-compose down           # Stop & remove
docker-compose stop           # Stop only
```

### **Logs**
```bash
docker-compose logs -f frontend    # Frontend logs
docker-compose logs -f backend     # Backend logs
docker-compose logs -f             # All logs
```

---

## **📊 Service Health Check**

### **Check Status**
```bash
docker-compose ps
```

### **Test Endpoints**
```bash
# Frontend health
curl http://localhost:3001

# Backend health
curl http://localhost:3000/api/health
```

---

## **🔐 Environment Variables**

### **Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:3000/api
```

### **Backend (.env)**
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=lms_db
JWT_SECRET=your-secret-key
```

---

## **⚡ Performance Tips**

### **Build Optimization**
- Frontend menggunakan Nginx untuk production
- Backend menggunakan NestJS dengan optimasi
- Database PostgreSQL dengan connection pooling

### **Resource Allocation**
```yaml
# docker-compose.yml
services:
  frontend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

---

## **🎉 SUMMARY**

**✅ FRONTEND BERJALAN DI**: `http://localhost:3001`
**✅ BACKEND BERJALAN DI**: `http://localhost:3000`

**Command lengkap**:
```bash
git clone https://github.com/HaikalE/lms-universitas-v1.git
cd lms-universitas-v1
docker-compose up --build
```

**Tunggu hingga muncul**:
```
lms-frontend  | Server running on http://localhost:80
lms-backend   | Server running on http://localhost:3000
```

**Kemudian akses**: `http://localhost:3001` 🚀