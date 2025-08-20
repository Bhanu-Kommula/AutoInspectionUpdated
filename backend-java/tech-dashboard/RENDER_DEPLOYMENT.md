# Tech Dashboard Service - Render Deployment Guide

## Overview
This service has been configured specifically for Render deployment with proper health checks and environment variable handling.

## Key Changes Made for Render

### 1. Health Check Endpoints
- **Root Health Check**: `/health` - Accessible without context path
- **API Health Check**: `/api/v1/health` - Accessible with context path
- **Ping Endpoint**: `/ping` - Simple status check

### 2. Configuration Profiles
- **Default Profile**: Uses `/api/v1` context path (development)
- **Render Profile**: No context path, optimized for production

### 3. Environment Variables
The service expects these environment variables in Render:

```bash
# Required for production
SPRING_DATASOURCE_URL=jdbc:postgresql://your-db-host:5432/your-db-name?sslmode=require
SPRING_DATASOURCE_USERNAME=your-username
SPRING_DATASOURCE_PASSWORD=your-password

# Optional - will auto-detect production mode
SPRING_PROFILES_ACTIVE=render
PORT=8085
```

### 4. Health Check Configuration
Render should be configured with:
- **Health Check Path**: `/health`
- **Health Check Timeout**: 30 seconds
- **Port**: 8085 (or as set by Render)

## Deployment Steps

### 1. Build and Test Locally
```bash
cd backend-java/tech-dashboard
mvn clean package -DskipTests
```

### 2. Docker Build
```bash
docker build -t tech-dashboard-service .
```

### 3. Render Configuration
- **Build Command**: `mvn clean package -DskipTests`
- **Start Command**: `./startup.sh`
- **Health Check Path**: `/health`
- **Port**: 8085

### 4. Environment Variables in Render
Set these in your Render service configuration:
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`

## Health Check Behavior

### Success Response (200 OK)
```json
{
  "status": "UP",
  "service": "tech-dashboard-service",
  "timestamp": 1234567890,
  "endpoint": "root",
  "database": "UP",
  "version": "1.0.0"
}
```

### Failure Response (503 Service Unavailable)
```json
{
  "status": "DOWN",
  "service": "tech-dashboard-service",
  "timestamp": 1234567890,
  "endpoint": "root",
  "error": "Database connection failed",
  "database": "DOWN"
}
```

## Troubleshooting

### Health Check Timeout
1. Verify database connectivity
2. Check environment variables
3. Ensure proper port configuration
4. Review application logs

### Database Connection Issues
1. Verify `SPRING_DATASOURCE_URL` format
2. Check database credentials
3. Ensure database is accessible from Render
4. Verify SSL mode configuration

### Port Configuration
1. Ensure `PORT` environment variable is set
2. Verify Dockerfile exposes correct port
3. Check Render service port configuration

## Monitoring

The service provides several monitoring endpoints:
- `/health` - Comprehensive health check
- `/ping` - Simple status check
- `/actuator/health` - Spring Boot actuator health
- `/actuator/metrics` - Application metrics
- `/actuator/info` - Application information

## Performance Optimizations

- Database connection pooling configured
- JPA optimizations for production
- Lazy initialization disabled for faster startup
- Proper memory allocation with `JAVA_OPTS`
