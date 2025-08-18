# Installation & Setup Guide

## Prerequisites

### Required Software

- **Java 17** or higher (OpenJDK or Oracle JDK)
- **Node.js 18** or higher with npm
- **MySQL 8.0** or higher
- **Maven 3.8** or higher
- **Git** for version control

### Development Tools

- **IDE**: IntelliJ IDEA, Eclipse, or VS Code
- **Database Client**: MySQL Workbench, DBeaver, or similar
- **API Testing**: Postman or Insomnia
- **Browser**: Chrome, Firefox, or Safari (latest versions)

### System Requirements

- **RAM**: Minimum 8GB, recommended 16GB
- **Storage**: 10GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Inspectioproject
```

### 2. Database Setup

#### Create Database

```sql
CREATE DATABASE inspection CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'inspectio_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON inspection.* TO 'inspectio_user'@'localhost';
FLUSH PRIVILEGES;
```

#### Run Database Migrations

```bash
cd Backend/chat-service
mysql -u root -p inspection < create-lightweight-chat-tables.sql
```

### 3. Backend Services Setup

#### Chat Service

```bash
cd Backend/chat-service
mvn clean install
mvn spring-boot:run
```

#### Posting Service

```bash
cd Backend/postings
mvn clean install
mvn spring-boot:run
```

#### Technician Service

```bash
cd Backend/techincian
mvn clean install
mvn spring-boot:run
```

#### Service Registry (Eureka)

```bash
cd Backend/serviceregistry
mvn clean install
mvn spring-boot:run
```

### 4. Frontend Setup

#### Dealer Frontend

```bash
cd dealer-frontend
npm install
npm start
```

#### Technician Dashboard

```bash
cd Backend/tech-dashboard
mvn clean install
mvn spring-boot:run
```

## Environment Variables

### Chat Service (.env)

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=inspection
DB_USERNAME=inspectio_user
DB_PASSWORD=your_secure_password

# Service Configuration
CHAT_SERVICE_PORT=8089
EUREKA_SERVER_URL=http://localhost:8761/eureka

# WebSocket Configuration
WS_ENDPOINT=/ws
WS_BROKER_PREFIX=/topic

# Security
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=86400000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/uploads/inspections
```

### Frontend Environment (.env)

```bash
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_WS_URL=ws://localhost:8089/ws
REACT_APP_CHAT_SERVICE_URL=http://localhost:8089

# Feature Flags
REACT_APP_ENABLE_VIDEO_CALLS=true
REACT_APP_ENABLE_FILE_UPLOAD=true
REACT_APP_ENABLE_NOTIFICATIONS=true

# External Services
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## Database Schema Creation

### Core Tables

```sql
-- Users table
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('DEALER', 'TECHNICIAN', 'ADMIN') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE posts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'OPEN',
    dealer_id BIGINT NOT NULL,
    technician_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dealer_id) REFERENCES users(id),
    FOREIGN KEY (technician_id) REFERENCES users(id)
);

-- Inspections table
CREATE TABLE inspections (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    report_data JSON,
    status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'SCHEDULED',
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id)
);
```



## Third-party API Integration

### Google Maps API

1. Create project in Google Cloud Console
2. Enable Maps JavaScript API
3. Generate API key
4. Add to frontend environment variables

### File Storage (Optional)

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=inspectio-uploads

# Local File Storage
UPLOAD_BASE_PATH=/var/inspectio/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
```

## Development Workflow

### Starting All Services

```bash
# Terminal 1: Service Registry
cd Backend/serviceregistry && mvn spring-boot:run

# Terminal 2: Chat Service
cd Backend/chat-service && mvn spring-boot:run

# Terminal 3: Posting Service
cd Backend/postings && mvn spring-boot:run

# Terminal 4: Frontend
cd dealer-frontend && npm start
```

### Database Reset

```bash
# Drop and recreate database
mysql -u root -p -e "DROP DATABASE IF EXISTS inspection; CREATE DATABASE inspection;"

# Run migrations
cd Backend/chat-service
mysql -u root -p inspection < create-lightweight-chat-tables.sql
```

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port
lsof -i :8089
# Kill process
kill -9 <PID>
```

#### Database Connection Failed

- Verify MySQL service is running
- Check credentials in application.properties
- Ensure database exists and user has permissions

#### Frontend Build Errors

```bash
# Clear npm cache
npm cache clean --force
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Maven Build Issues

```bash
# Clean and rebuild
mvn clean install -U
# Skip tests if needed
mvn clean install -DskipTests
```

## Next Steps

After successful setup:

1. Verify all services are running on expected ports
2. Test database connections
3. Access frontend at http://localhost:3000
4. Review API documentation for testing endpoints
5. Set up monitoring and logging
