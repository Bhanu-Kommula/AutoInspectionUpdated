# Centralized Configuration Usage Guide

## Overview

All common configuration values are now stored in `Backend/application-common.properties` to avoid duplication and ensure consistency across all microservices.

## Current Configuration Includes

- **Database settings** (URL, credentials, connection pool)
- **Service ports** for all microservices
- **Eureka/Service discovery** settings
- **CORS configuration**
- **Logging levels**
- **Validation patterns**
- **Jackson JSON settings**
- **Security settings** (JWT, session timeout)

## How to Use in Other Services

### 1. Import in application.properties

Add this line to any service's `application.properties`:

```properties
spring.config.import=file:../../../application-common.properties
```

### 2. Reference Common Values

Instead of hardcoding values, reference the centralized ones:

**Before:**

```properties
spring.datasource.password=Aa123123@
server.port=8081
```

**After:**

```properties
spring.datasource.password=${common.datasource.password}
server.port=${postings.server.port}
```

### 3. Service-Specific Overrides

You can still override values for specific services:

```properties
# Use common database config
spring.datasource.url=${common.datasource.url}
spring.datasource.password=${common.datasource.password}

# But override logging for this service only
logging.level.com.auto.postings=DEBUG
```

## Available Common Properties

### Database

- `${common.datasource.url}`
- `${common.datasource.username}`
- `${common.datasource.password}`
- `${common.datasource.driver-class-name}`

### Service Ports

- `${dealer.server.port}` - 8080
- `${postings.server.port}` - 8081
- `${technician.server.port}` - 8082
- `${tech-dashboard.server.port}` - 8083
- `${gateway.server.port}` - 8084
- `${service-registry.server.port}` - 8761

### CORS

- `${common.cors.allowed-origins}`
- `${common.cors.allowed-methods}`
- `${common.cors.max-age}`

### Validation Patterns

- `${common.validation.phone.pattern}`
- `${common.validation.password.min-length}`
- `${common.validation.name.min-length}`
- `${common.validation.name.max-length}`

## Already Applied To

✅ **Dealer Service** - Fully configured with centralized config

## To Apply To

🔄 **Postings Service**
🔄 **Technician Service**
🔄 **Tech Dashboard Service**
🔄 **Gateway Service**
🔄 **Service Registry**

## Benefits

- **Single source of truth** for common settings
- **Easy updates** - change once, applies everywhere
- **Consistency** across all services
- **Reduced duplication** and maintenance
- **Environment-specific** deployments simplified
