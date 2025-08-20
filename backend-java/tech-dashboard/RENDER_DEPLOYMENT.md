# Tech Dashboard Service - Render Deployment Guide

## Overview

This service has been configured specifically for Render deployment with proper health checks and environment variable handling.

## Key Changes Made for Render

### 1. Health Check Endpoints

- **Root Health Check**: `/health` - Accessible without context path
- **API Health Check**: `/api/v1/health` - Accessible with context path
- **Ping Endpoint**: `/ping` - Simple status check
- **Ready Endpoint**: `/ready` - Basic readiness check without database dependency

### 2. Configuration Profiles

- **Default Profile**: Uses `/api/v1` context path (development)
- **Render Profile**: No context path, optimized for production

### 3. Environment Variables

The service expects these environment variables in Render:

```bash
# Required for production
SPRING_DATASOURCE_URL=postgresql://user:password@host/dbname
SPRING_DATASOURCE_USERNAME=your-username
SPRING_DATASOURCE_PASSWORD=your-password

# Optional - will auto-detect production mode
SPRING_PROFILES_ACTIVE=render
PORT=8085
```

**Important**: The service automatically converts Render's `postgresql://` format to proper JDBC format.

### 4. Health Check Configuration

Render should be configured with:

- **Health Check Path**: `/health`
- **Health Check Timeout**: 30 seconds
- **Port**: 8085 (or as set by Render)

## Database URL Auto-Fix

The service automatically detects and fixes Render's database URL format:

**Input (Render format):**
```
postgresql://autoinspect_db_user:password@dpg-d2ic5d3uibrs73euu120-a/autoinspect_db
```

**Output (JDBC format):**
```
jdbc:postgresql://dpg-d2ic5d3uibrs73euu120-a:5432/autoinspect_db?sslmode=require
```

This ensures proper database connectivity without manual configuration.

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

- `SPRING_DATASOURCE_URL` (Render will provide this automatically)
- `SPRING_DATASOURCE_USERNAME` (optional, auto-extracted from URL)
- `SPRING_DATASOURCE_PASSWORD` (optional, auto-extracted from URL)

## Health Check Behavior

### Success Response (200 OK)

```json
{
  "status": "UP",
  "service": "tech-dashboard-service",
  "timestamp": 1234567890,
  "endpoint": "root",
  "database": "UP",
  "version": "1.0.0",
  "port": "10000",
  "profiles": "render"
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
  "database": "DOWN",
  "port": "10000",
  "profiles": "render"
}
```

## Available Health Endpoints

| Endpoint | Purpose | Database Dependency |
|----------|---------|-------------------|
| `/health` | Full health check | Yes |
| `/api/v1/health` | API health check | Yes |
| `/ping` | Basic status | No |
| `/ready` | Readiness check | No |

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
- `/ready` - Readiness check
- `/actuator/health` - Spring Boot actuator health
- `/actuator/metrics` - Application metrics
- `/actuator/info` - Application information

## Performance Optimizations

- Database connection pooling configured
- JPA optimizations for production
- Lazy initialization disabled for faster startup
- Proper memory allocation with `JAVA_OPTS`
- Database connection retry and timeout settings
- Flyway migration with error tolerance
