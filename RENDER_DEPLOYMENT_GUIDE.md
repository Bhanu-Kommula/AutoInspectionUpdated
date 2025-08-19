# Render Deployment Guide for AutoInspect Project

## Overview

This guide will help you deploy your AutoInspect project on Render, a cloud platform that supports full-stack applications.

## Project Architecture

- **Frontend**: React application (dealer-frontend)
- **Backend Services**: Multiple Spring Boot microservices
- **Database**: PostgreSQL
- **Chat Service**: Node.js service
- **API Gateway**: Spring Cloud Gateway

## Prerequisites

1. A Render account (sign up at [render.com](https://render.com))
2. Your project code pushed to a Git repository (GitHub, GitLab, etc.)
3. Maven and Node.js installed locally for testing

## Step-by-Step Deployment

### 1. Database Setup

First, create a PostgreSQL database:

1. Go to your Render dashboard
2. Click "New" → "PostgreSQL"
3. Name: `autoinspect-db`
4. Plan: Free (for development)
5. Note down the connection details

### 2. Frontend Deployment

1. Go to your Render dashboard
2. Click "New" → "Static Site"
3. Connect your Git repository
4. Configure:
   - **Name**: `dealer-frontend`
   - **Build Command**: `cd frontend/dealer-frontend && npm ci && npm run build`
   - **Publish Directory**: `frontend/dealer-frontend/build`
   - **Environment Variables**: None needed for static site

### 3. Backend Services Deployment

#### API Gateway

1. Click "New" → "Web Service"
2. Connect your Git repository
3. Configure:
   - **Name**: `api-gateway`
   - **Runtime**: Docker
   - **Root Directory**: `backend-java/gateway`
   - **Build Command**: `./mvnw clean package -DskipTests`
   - **Start Command**: `java -jar target/gateway-*.jar`
   - **Environment Variables**:
     ```
     SPRING_PROFILES_ACTIVE=production
     SPRING_DATASOURCE_URL=<from database>
     SPRING_DATASOURCE_USERNAME=<from database>
     SPRING_DATASOURCE_PASSWORD=<from database>
     ```

#### Dealer Service

1. Click "New" → "Web Service"
2. Configure:
   - **Name**: `dealer-service`
   - **Runtime**: Docker
   - **Root Directory**: `backend-java/dealer`
   - **Build Command**: `./mvnw clean package -DskipTests`
   - **Start Command**: `java -jar target/dealer-*.jar`
   - **Environment Variables**:
     ```
     SPRING_PROFILES_ACTIVE=production
     SPRING_DATASOURCE_URL=<from database>
     SPRING_DATASOURCE_USERNAME=<from database>
     SPRING_DATASOURCE_PASSWORD=<from database>
     EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=https://api-gateway.onrender.com/eureka/
     ```

#### Postings Service

1. Click "New" → "Web Service"
2. Configure:
   - **Name**: `postings-service`
   - **Runtime**: Docker
   - **Root Directory**: `backend-java/postings`
   - **Build Command**: `./mvnw clean package -DskipTests`
   - **Start Command**: `java -jar target/postings-*.jar`
   - **Environment Variables**: Same as dealer service

#### Tech Dashboard Service

1. Click "New" → "Web Service"
2. Configure:
   - **Name**: `tech-dashboard-service`
   - **Runtime**: Docker
   - **Root Directory**: `backend-java/tech-dashboard`
   - **Build Command**: `./mvnw clean package -DskipTests`
   - **Start Command**: `java -jar target/tech-dashboard-*.jar`
   - **Environment Variables**: Same as dealer service

#### Service Registry

1. Click "New" → "Web Service"
2. Configure:
   - **Name**: `service-registry`
   - **Runtime**: Docker
   - **Root Directory**: `backend-java/serviceregistry`
   - **Build Command**: `./mvnw clean package -DskipTests`
   - **Start Command**: `java -jar target/serviceregistry-*.jar`
   - **Environment Variables**:
     ```
     SPRING_PROFILES_ACTIVE=production
     ```

### 4. Chat Service Deployment

1. Click "New" → "Web Service"
2. Configure:
   - **Name**: `chat-service`
   - **Runtime**: Node
   - **Root Directory**: `backend-node/chat-service`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**:
     ```
     DB_HOST=<from database>
     DB_USER=<from database>
     DB_PASSWORD=<from database>
     DB_NAME=inspection
     DB_PORT=5432
     ```

## Required Dockerfiles

Since we're using Docker runtime for Java services, we need to create Dockerfiles for each service.

### Create Dockerfile for Java Services

Create `Dockerfile` in each Java service directory:

```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY . .
RUN chmod +x ./mvnw
RUN ./mvnw clean package -DskipTests
EXPOSE 8080
CMD ["java", "-jar", "target/*.jar"]
```

## Environment Variables Setup

### Database Connection

For each service that needs database access, use these environment variables:

- `SPRING_DATASOURCE_URL`: `postgresql://host:port/database`
- `SPRING_DATASOURCE_USERNAME`: Database username
- `SPRING_DATASOURCE_PASSWORD`: Database password

### Service Discovery

For microservices that need to register with Eureka:

- `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE`: `https://api-gateway.onrender.com/eureka/`

## Deployment Order

1. Database first
2. Service Registry
3. API Gateway
4. Individual microservices
5. Frontend last

## Post-Deployment

1. Test each service endpoint
2. Verify database connections
3. Check service discovery
4. Test frontend functionality

## Troubleshooting

- Check build logs for compilation errors
- Verify environment variables are set correctly
- Ensure database is accessible from services
- Check service startup logs for runtime errors

## Cost Considerations

- Free tier: 750 hours/month per service
- Database: Free tier available
- Static sites: Always free
- Consider upgrading to paid plans for production use

## Next Steps

1. Create Dockerfiles for Java services
2. Set up environment variables
3. Deploy services in order
4. Test and monitor
5. Set up custom domains if needed
