# Deployment Guide

## Server Requirements

### Production Server Specifications

#### Minimum Requirements

- **CPU**: 4 cores (2.4 GHz or higher)
- **RAM**: 16GB DDR4
- **Storage**: 100GB SSD (NVMe preferred)
- **Network**: 1Gbps connection
- **OS**: Ubuntu 22.04 LTS or CentOS 8+

#### Recommended Requirements

- **CPU**: 8 cores (3.0 GHz or higher)
- **RAM**: 32GB DDR4
- **Storage**: 500GB NVMe SSD
- **Network**: 10Gbps connection
- **OS**: Ubuntu 22.04 LTS

### Infrastructure Components

#### Database Server

- **MySQL 8.0+** with InnoDB engine
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 200GB+ with RAID 1 or better
- **Backup**: Automated daily backups

#### Application Servers

- **Java 17** runtime environment
- **Node.js 18+** for frontend builds
- **Nginx** for reverse proxy and load balancing
- **Redis** for session management (optional)

## Production Deployment

### 1. Server Preparation

#### Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y openjdk-17-jdk maven nginx mysql-server
```

#### Create Application User

```bash
sudo useradd -m -s /bin/bash inspectio
sudo usermod -aG sudo inspectio
sudo passwd inspectio
```

#### Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3306/tcp
sudo ufw enable
```

### 2. Database Setup

#### Install and Configure MySQL

```bash
sudo mysql_secure_installation
sudo mysql -u root -p
```

```sql
CREATE DATABASE inspection CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'inspectio_prod'@'localhost' IDENTIFIED BY 'strong_production_password';
GRANT ALL PRIVILEGES ON inspection.* TO 'inspectio_prod'@'localhost';
FLUSH PRIVILEGES;
```

#### Optimize MySQL Configuration

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

```ini
[mysqld]
innodb_buffer_pool_size = 4G
innodb_log_file_size = 512M
max_connections = 200
query_cache_size = 128M
```

### 3. Application Deployment

#### Deploy Backend Services

```bash
# Create deployment directory
sudo mkdir -p /opt/inspectio
sudo chown inspectio:inspectio /opt/inspectio

# Build and package services
cd Backend/chat-service
mvn clean package -DskipTests
cp target/chat-service-1.0.jar /opt/inspectio/

cd ../postings
mvn clean package -DskipTests
cp target/postings-service-1.0.jar /opt/inspectio/

cd ../techincian
mvn clean package -DskipTests
cp target/technician-service-1.0.jar /opt/inspectio/
```

#### Create Systemd Services

```bash
sudo nano /etc/systemd/system/inspectio-chat.service
```

```ini
[Unit]
Description=Inspectio Chat Service
After=network.target mysql.service

[Service]
Type=simple
User=inspectio
WorkingDirectory=/opt/inspectio
ExecStart=/usr/bin/java -jar chat-service-1.0.jar
Restart=always
RestartSec=10
Environment="SPRING_PROFILES_ACTIVE=prod"
Environment="JAVA_OPTS=-Xmx2g -Xms1g"

[Install]
WantedBy=multi-user.target
```

#### Start Services

```bash
sudo systemctl daemon-reload
sudo systemctl enable inspectio-chat
sudo systemctl start inspectio-chat
sudo systemctl status inspectio-chat
```

### 4. Frontend Deployment

#### Build Production Frontend

```bash
cd dealer-frontend
npm install
npm run build
```

#### Deploy to Nginx

```bash
sudo cp -r build/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
```

#### Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/inspectio
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass http://localhost:8089;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/inspectio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Configuration

#### Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### Auto-renewal

```bash
sudo crontab -e
# Add line: 0 12 * * * /usr/bin/certbot renew --quiet
```

## CI/CD Pipeline

### GitHub Actions Workflow

#### Backend CI/CD

```yaml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: "17"
          distribution: "temurin"

      - name: Cache Maven packages
        uses: actions/cache@v3
        with:
          path: ~/.m2
          key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}
          restore-keys: ${{ runner.os }}-m2

      - name: Build with Maven
        run: mvn clean install

      - name: Run tests
        run: mvn test

      - name: Build JAR
        run: mvn clean package -DskipTests

      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: chat-service-jar
          path: target/*.jar
```

#### Frontend CI/CD

```yaml
name: Frontend CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.KEY }}
          script: |
            cd /opt/inspectio
            sudo systemctl stop inspectio-frontend
            sudo cp -r /tmp/build/* /var/www/html/
            sudo chown -R www-data:www-data /var/www/html/
            sudo systemctl start inspectio-frontend
```

## Scaling & Performance

### Horizontal Scaling

#### Load Balancer Configuration

```nginx
upstream backend_servers {
    server 192.168.1.10:8080 weight=1;
    server 192.168.1.11:8080 weight=1;
    server 192.168.1.12:8080 weight=1;
}

server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://backend_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Database Scaling

```sql
-- Read replica setup
CREATE USER 'inspectio_readonly'@'%' IDENTIFIED BY 'password';
GRANT SELECT ON inspection.* TO 'inspectio_readonly'@'%';

-- Connection pooling configuration
spring.datasource.hikari.maximum-pool-size=50
spring.datasource.hikari.minimum-idle=10
spring.datasource.hikari.connection-timeout=30000
```

### Performance Optimization

#### JVM Tuning

```bash
JAVA_OPTS="-Xms2g -Xmx4g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

#### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_posts_status_dealer ON posts(status, dealer_id);
CREATE INDEX idx_messages_room_created ON chat_messages(room_id, created_at);
CREATE INDEX idx_inspections_post_status ON inspections(post_id, status);

-- Partition large tables
ALTER TABLE chat_messages PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026)
);
```

## Monitoring & Logging

### Application Monitoring

```bash
# Install Prometheus
sudo apt install -y prometheus

# Configure Spring Boot Actuator
management.endpoints.web.exposure.include=health,info,metrics,prometheus
management.metrics.export.prometheus.enabled=true
```

### Log Management

```bash
# Configure log rotation
sudo nano /etc/logrotate.d/inspectio

/opt/inspectio/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 inspectio inspectio
}
```

### Health Checks

```bash
# Health check endpoint
curl http://localhost:8080/actuator/health

# Database connectivity
mysql -u inspectio_prod -p -e "SELECT 1"

# Service status
sudo systemctl status inspectio-chat
sudo systemctl status nginx
sudo systemctl status mysql
```

## Backup & Recovery

### Automated Backups

```bash
#!/bin/bash
# /opt/inspectio/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
DB_NAME="inspection"

# Database backup
mysqldump -u inspectio_prod -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /opt/inspectio

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### Recovery Procedures

```bash
# Database recovery
mysql -u inspectio_prod -p inspection < backup_file.sql

# Application recovery
sudo systemctl stop inspectio-chat
sudo tar -xzf app_backup.tar.gz -C /
sudo systemctl start inspectio-chat
```

## Security Hardening

### Network Security

```bash
# Configure fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Restrict SSH access
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no
# PasswordAuthentication no
```

### Application Security

```bash
# Environment variable security
sudo chmod 600 /opt/inspectio/.env
sudo chown inspectio:inspectio /opt/inspectio/.env

# File permissions
sudo find /opt/inspectio -type f -exec chmod 644 {} \;
sudo find /opt/inspectio -type d -exec chmod 755 {} \;
```

## Post-Deployment Verification

### Functional Testing

1. **User Authentication**: Test login/logout flows
2. **Chat Functionality**: Verify real-time messaging
3. **File Uploads**: Test inspection photo uploads
4. **API Endpoints**: Validate all REST endpoints
5. **Database Operations**: Confirm CRUD operations

### Performance Testing

```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 http://your-domain.com/api/health

# Database performance
mysql -u inspectio_prod -p -e "SHOW PROCESSLIST;"
mysql -u inspectio_prod -p -e "SHOW STATUS LIKE 'Slow_queries';"
```

### Security Testing

1. **SSL Configuration**: Verify HTTPS enforcement
2. **Authentication**: Test unauthorized access attempts
3. **Input Validation**: Test SQL injection prevention
4. **File Upload Security**: Validate file type restrictions
