# 🚀 Final Deployment Checklist for AutoInspect on Render

## ✅ **COMPLETED ITEMS**

### 1. **Versions & Consistency** ✅

- [x] **Java**: Updated all Dockerfiles to use `eclipse-temurin:17-jre` (runtime) and `maven:3.9-eclipse-temurin-17` (build)
- [x] **Node**: Pinned to Node.js 18.x in `package.json` and `.nvmrc`
- [x] **Multi-stage builds**: Optimized Docker images for production

### 2. **Environment Profiles & Config** ✅

- [x] **SPRING_PROFILES_ACTIVE=production**: Set in all Java services in `render.yaml`
- [x] **Reverse-proxy awareness**: Added `server.forward-headers-strategy=framework` and `server.use-forward-headers=true`
- [x] **Database SSL**: Added `sslmode=require` in production configs

### 3. **Connection Pooling** ✅

- [x] **Java services**: Limited to `maximum-pool-size=5` for free Postgres
- [x] **Node.js chat**: Limited to `max: 5` connections with proper timeouts

### 4. **Health Checks** ✅

- [x] **Java services**: `/actuator/health` endpoints configured in `render.yaml`
- [x] **Chat service**: `/health` endpoint already exists and configured
- [x] **Actuator**: Limited to `health,info` only (production secure)

### 5. **Gateway & CORS** ✅

- [x] **CORS**: Configured in Gateway only (following project rules)
- [x] **Frontend origin**: Set `FRONTEND_ORIGIN` environment variable
- [x] **WebSocket**: Added WebSocket route configuration for chat service

### 6. **Eureka Configuration** ✅

- [x] **Service URLs**: Set to public Render URLs in `render.yaml`
- [x] **Hostnames**: Configured for production deployment

### 7. **Static Site Environment** ✅

- [x] **Environment template**: Created `env.production.template` with API URLs
- [x] **Build-time vars**: Ready for Render environment variable injection

### 8. **Database Migrations** ✅

- [x] **Flyway**: Enabled in production configs
- [x] **Schema**: Will run automatically on first service startup

### 9. **Security & Logging** ✅

- [x] **Secrets**: All sensitive data moved to Render environment variables
- [x] **Actuator**: Limited exposure to `health,info` only
- [x] **Security headers**: Added secure cookie and content-type options

### 10. **Free-tier Optimization** ✅

- [x] **Connection limits**: Optimized for free Postgres constraints
- [x] **Cold starts**: Services configured for Render's free tier behavior

---

## 🔧 **DEPLOYMENT STEPS**

### **Phase 1: Database Setup**

1. [ ] Create PostgreSQL database on Render (`autoinspect-db`)
2. [ ] Note connection details (URL, username, password)

### **Phase 2: Backend Services**

1. [ ] Deploy Service Registry first
2. [ ] Deploy API Gateway
3. [ ] Deploy individual microservices (dealer, postings, tech-dashboard)
4. [ ] Deploy Chat Service

### **Phase 3: Frontend**

1. [ ] Deploy React frontend as static site
2. [ ] Set environment variables with live API URLs
3. [ ] Redeploy frontend to bake in the URLs

### **Phase 4: Testing**

1. [ ] Test all health endpoints return 200
2. [ ] Verify database connections
3. [ ] Test API calls from frontend
4. [ ] Test WebSocket chat functionality
5. [ ] Check CORS is working properly

---

## 🧪 **SMOKE TESTS TO RUN**

### **Local Testing (Before Deploy)**

```bash
# Run the deployment script
./deploy-to-render.sh

# Test Docker builds
docker build -t test-gateway ./backend-java/gateway
docker build -t test-dealer ./backend-java/dealer
# ... repeat for all services
```

### **Post-Deployment Testing**

```bash
# Health checks
curl https://api-gateway.onrender.com/actuator/health
curl https://dealer-service.onrender.com/actuator/health
curl https://chat-service.onrender.com/health

# Frontend integration
# Load https://dealer-frontend.onrender.com
# Check browser console for CORS errors
# Test API calls in Network tab
# Verify WebSocket connection (101 Switching Protocols)
```

---

## 🚨 **CRITICAL REMINDERS**

### **Environment Variables**

- [ ] Set `SPRING_PROFILES_ACTIVE=production` on ALL Java services
- [ ] Configure database connection strings with SSL
- [ ] Set `FRONTEND_ORIGIN` in API Gateway
- [ ] Configure Eureka URLs for production

### **Database**

- [ ] Free Postgres expires after 30 days
- [ ] Limited to 1 GB storage
- [ ] Plan for upgrade or data export

### **Monitoring**

- [ ] Check service logs in Render dashboard
- [ ] Monitor health check endpoints
- [ ] Watch for connection pool exhaustion

---

## 📋 **FINAL VERIFICATION**

Before going live:

- [ ] All services return 200 on health checks
- [ ] Frontend loads without errors
- [ ] API calls succeed (Network tab shows 200s)
- [ ] WebSocket connects successfully
- [ ] No CORS errors in browser console
- [ ] Database migrations completed successfully

---

## 🆘 **TROUBLESHOOTING**

### **Common Issues**

1. **CORS errors**: Check Gateway CORS configuration
2. **Database connection**: Verify SSL and connection limits
3. **Service discovery**: Check Eureka configuration
4. **Health check failures**: Verify Actuator endpoints

### **Support Resources**

- [Render Documentation](https://render.com/docs)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)
- [Spring Cloud Gateway](https://spring.io/projects/spring-cloud-gateway)

---

## 🎯 **SUCCESS CRITERIA**

Your deployment is successful when:

- ✅ All 8 services are running on Render
- ✅ Frontend loads and functions properly
- ✅ All API endpoints respond correctly
- ✅ Real-time chat works via WebSocket
- ✅ No CORS or security errors
- ✅ Health checks all return UP status

**Ready to deploy! 🚀**
