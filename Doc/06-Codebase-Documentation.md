# Codebase Documentation

## Project Structure

### Root Directory Layout

```
Inspectioproject/
├── Backend/                    # Backend services
│   ├── chat-service/          # Real-time chat functionality
│   ├── dealer/                # Dealer management service
│   ├── gateway/               # API gateway service
│   ├── postings/              # Service posting management
│   ├── serviceregistry/       # Eureka service registry
│   ├── tech-dashboard/        # Technician dashboard service
│   └── techincian/            # Technician management service
├── dealer-frontend/            # React-based dealer interface
├── temp/                      # Temporary services and logs
└── Doc/                       # This documentation package
```

### Backend Services Structure

#### Chat Service (`Backend/chat-service/`)

```
src/
├── main/
│   ├── java/com/auto/chat/
│   │   ├── controller/        # REST API endpoints
│   │   ├── service/           # Business logic
│   │   ├── repository/        # Data access layer
│   │   ├── entity/            # JPA entities
│   │   ├── dto/               # Data transfer objects
│   │   └── config/            # Configuration classes
│   └── resources/
│       ├── application.properties
│       └── db/migration/      # Flyway migrations
```

#### Dealer Frontend (`dealer-frontend/`)

```
src/
├── components/                 # React components
│   ├── chat/                  # Chat-related components
│   ├── PostingsPage/          # Posting management
│   └── common/                # Shared components
├── services/                   # API service layer
├── hooks/                      # Custom React hooks
├── utils/                      # Utility functions
└── config/                     # Configuration files
```

## Technology Stack Details

### Backend Technologies

#### Spring Boot 3.5.3

- **Java Version**: 17 (LTS)
- **Spring Framework**: 6.x
- **Build Tool**: Maven 3.8+
- **Database**: MySQL 8.0 with JPA/Hibernate

#### Key Dependencies

```xml
<!-- Core Spring Boot -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- WebSocket Support -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>

<!-- Database -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<!-- Service Discovery -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

### Frontend Technologies

#### React 18.3.1

- **Build Tool**: Create React App 5.0.1
- **Package Manager**: npm 8+
- **State Management**: React Hooks + Context
- **Styling**: Bootstrap 5.3.7 + CSS modules

#### Key Dependencies

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^7.6.3",
  "bootstrap": "^5.3.7",
  "axios": "^1.10.0",
  "@stomp/stompjs": "^7.1.1"
}
```

## Coding Conventions

### Java Backend

#### Naming Conventions

- **Classes**: PascalCase (e.g., `ChatController`, `MessageService`)
- **Methods**: camelCase (e.g., `getMessages()`, `saveMessage()`)
- **Variables**: camelCase (e.g., `roomId`, `messageCount`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_MESSAGE_LENGTH`)
- **Packages**: lowercase (e.g., `com.auto.chat.controller`)

#### Code Structure

```java
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<ChatMessage>> getMessages(
            @PathVariable String roomId,
            @RequestParam(defaultValue = "50") int limit) {

        try {
            log.info("Getting messages for room: {}", roomId);
            List<ChatMessage> messages = chatService.getMessages(roomId, limit);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Error getting messages: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
```

#### Exception Handling

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e) {
        log.error("Unexpected error: {}", e.getMessage(), e);
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse("Internal server error"));
    }
}
```

### React Frontend

#### Component Structure

```jsx
// Functional component with hooks
const ChatComponent = ({ roomId, onMessageSend }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [roomId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await chatService.getMessages(roomId);
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      {loading ? <LoadingSpinner /> : <MessageList messages={messages} />}
    </div>
  );
};
```

#### File Naming

- **Components**: PascalCase (e.g., `ChatComponent.jsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useWebSocket.js`)
- **Services**: camelCase (e.g., `chatService.js`)
- **Utilities**: camelCase (e.g., `dateUtils.js`)

#### Import Organization

```javascript
// External libraries
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Internal components
import ChatMessage from "./ChatMessage";
import MessageInput from "./MessageInput";

// Services and utilities
import { chatService } from "../services/chatService";
import { formatDate } from "../utils/dateUtils";
```

## Build Commands

### Backend Services

#### Maven Commands

```bash
# Clean and compile
mvn clean compile

# Run tests
mvn test

# Package application
mvn clean package

# Run application
mvn spring-boot:run

# Install dependencies
mvn clean install

# Skip tests during build
mvn clean package -DskipTests
```

#### Service-Specific Builds

```bash
# Chat Service
cd Backend/chat-service
mvn clean package

# Posting Service
cd Backend/postings
mvn clean package

# Technician Service
cd Backend/techincian
mvn clean package
```

### Frontend

#### npm Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject from Create React App (irreversible)
npm run eject
```

#### Development Workflow

```bash
# Install dependencies
npm install

# Start development server
npm start

# In another terminal, start backend services
cd Backend/chat-service && mvn spring-boot:run
```

## Database Management

### Flyway Migrations

#### Migration Files

```sql
-- V1__Create_inspection_tables.sql
CREATE TABLE inspection_reports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id VARCHAR(64) NOT NULL,
    technician_id VARCHAR(128) NOT NULL,
    status ENUM('DRAFT', 'SUBMITTED', 'APPROVED') DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Running Migrations

```bash
# Automatic (on application startup)
# Flyway runs automatically when spring.flyway.enabled=true

# Manual execution
mvn flyway:migrate

# Check migration status
mvn flyway:info

# Clean database (development only)
mvn flyway:clean
```

### Database Schema

#### Core Tables

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
    status ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'OPEN',
    dealer_id BIGINT NOT NULL,
    technician_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dealer_id) REFERENCES users(id),
    FOREIGN KEY (technician_id) REFERENCES users(id)
);
```

## Testing Guide

### Backend Testing

#### Unit Tests

```java
@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private MessageRepository messageRepository;

    @InjectMocks
    private ChatService chatService;

    @Test
    void getMessages_ShouldReturnMessages() {
        // Given
        String roomId = "room-123";
        List<Message> expectedMessages = Arrays.asList(
            new Message("msg1", roomId, "sender1", "Hello"),
            new Message("msg2", roomId, "sender2", "Hi")
        );

        when(messageRepository.findByRoomIdOrderByCreatedAtDesc(roomId, any()))
            .thenReturn(expectedMessages);

        // When
        List<Message> actualMessages = chatService.getMessages(roomId, 10);

        // Then
        assertEquals(expectedMessages.size(), actualMessages.size());
        verify(messageRepository).findByRoomIdOrderByCreatedAtDesc(roomId, 10);
    }
}
```

#### Integration Tests

```java
@SpringBootTest
@AutoConfigureTestDatabase
class ChatControllerIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void getMessages_ShouldReturnOk() {
        // Given
        String roomId = "room-123";

        // When
        ResponseEntity<String> response = restTemplate
            .getForEntity("/api/chat/" + roomId + "/messages", String.class);

        // Then
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}
```

#### Running Tests

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=ChatServiceTest

# Run tests with coverage
mvn clean test jacoco:report

# Skip tests during build
mvn clean package -DskipTests
```

### Frontend Testing

#### Component Testing

```jsx
import { render, screen, fireEvent } from "@testing-library/react";
import ChatComponent from "./ChatComponent";

describe("ChatComponent", () => {
  test("renders chat messages", () => {
    const messages = [
      { id: 1, content: "Hello", sender: "user1" },
      { id: 2, content: "Hi there", sender: "user2" },
    ];

    render(<ChatComponent messages={messages} />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi there")).toBeInTheDocument();
  });

  test("sends message on submit", () => {
    const onMessageSend = jest.fn();
    render(<ChatComponent onMessageSend={onMessageSend} />);

    const input = screen.getByPlaceholderText("Type a message...");
    const sendButton = screen.getByText("Send");

    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.click(sendButton);

    expect(onMessageSend).toHaveBeenCalledWith("Test message");
  });
});
```

#### Running Frontend Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run tests in CI mode
npm test -- --ci --coverage --watchAll=false
```

## Code Quality Tools

### Backend Quality

#### Checkstyle Configuration

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-checkstyle-plugin</artifactId>
    <version>3.2.1</version>
    <configuration>
        <configLocation>checkstyle.xml</configLocation>
        <failOnViolation>true</failOnViolation>
    </configuration>
</plugin>
```

#### SpotBugs Configuration

```xml
<plugin>
    <groupId>com.github.spotbugs</groupId>
    <artifactId>spotbugs-maven-plugin</artifactId>
    <version>4.7.3.0</version>
    <configuration>
        <effort>Max</effort>
        <threshold>Low</threshold>
    </configuration>
</plugin>
```

### Frontend Quality

#### ESLint Configuration

```json
{
  "extends": ["react-app", "react-app/jest"],
  "rules": {
    "no-console": "warn",
    "prefer-const": "error",
    "no-unused-vars": "warn"
  }
}
```

#### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## Development Workflow

### Git Workflow

#### Branch Strategy

```bash
# Main development branch
git checkout main

# Create feature branch
git checkout -b feature/chat-notifications

# Create bugfix branch
git checkout -b bugfix/message-sending-issue

# Create release branch
git checkout -b release/v1.2.0
```

#### Commit Convention

```
feat: add real-time chat notifications
fix: resolve message sending timeout issue
docs: update API documentation
style: format code according to style guide
refactor: restructure chat service architecture
test: add integration tests for chat endpoints
chore: update dependencies
```

### Code Review Process

#### Review Checklist

- [ ] Code follows established conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Error handling is appropriate

#### Review Tools

- **GitHub Pull Requests**: Code review and discussion
- **SonarQube**: Code quality analysis
- **Code Coverage**: Ensure adequate test coverage
- **Security Scanning**: Identify potential vulnerabilities

## Performance Considerations

### Backend Optimization

#### Database Optimization

```java
// Use pagination for large datasets
@Query("SELECT m FROM Message m WHERE m.roomId = :roomId ORDER BY m.createdAt DESC")
Page<Message> findByRoomId(@Param("roomId") String roomId, Pageable pageable);

// Implement caching for frequently accessed data
@Cacheable("roomStats")
public RoomStats getRoomStats(String roomId) {
    // Implementation
}
```

#### Connection Pooling

```properties
# Optimize database connections
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=20000
```

### Frontend Optimization

#### Code Splitting

```jsx
// Lazy load components
const ChatComponent = lazy(() => import("./ChatComponent"));

// Use React.memo for expensive components
const MessageList = React.memo(({ messages }) => {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </div>
  );
});
```

#### Bundle Optimization

```bash
# Analyze bundle size
npm run build
npx webpack-bundle-analyzer build/static/js/*.js

# Optimize images
npm install --save-dev imagemin-webpack-plugin
```

## Deployment Configuration

### Environment-Specific Configs

#### Development

```properties
# application-dev.properties
spring.profiles.active=dev
logging.level.com.auto.chat=DEBUG
spring.jpa.show-sql=true
```

#### Production

```properties
# application-prod.properties
spring.profiles.active=prod
logging.level.com.auto.chat=WARN
spring.jpa.show-sql=false
```

### Docker Configuration

#### Dockerfile Example

```dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/chat-service-1.0.jar app.jar

EXPOSE 8089

ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### Docker Compose

```yaml
version: "3.8"
services:
  chat-service:
    build: ./Backend/chat-service
    ports:
      - "8089:8089"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
    depends_on:
      - mysql
      - eureka

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: inspection
    ports:
      - "3306:3306"
```

## Monitoring and Logging

### Application Monitoring

#### Health Checks

```java
@Component
public class ChatServiceHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
        try {
            // Check service health
            return Health.up()
                .withDetail("message", "Chat service is running")
                .withDetail("timestamp", System.currentTimeMillis())
                .build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("error", e.getMessage())
                .build();
        }
    }
}
```

#### Metrics Collection

```java
@RestController
public class MetricsController {

    @Autowired
    private MeterRegistry meterRegistry;

    @PostMapping("/api/metrics/message-sent")
    public void recordMessageSent() {
        meterRegistry.counter("chat.messages.sent").increment();
    }
}
```

### Logging Configuration

#### Logback Configuration

```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/chat-service.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/chat-service.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
    </appender>

    <root level="INFO">
        <appender-ref ref="STDOUT" />
        <appender-ref ref="FILE" />
    </root>
</configuration>
```
