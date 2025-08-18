# Project Overview

## Executive Summary

AutoInspect is a comprehensive automotive service management platform that streamlines communication between dealers and technicians while providing robust inspection management capabilities. The system eliminates communication bottlenecks through real-time chat, enables efficient service posting workflows, and maintains detailed inspection records with photo documentation.

**Business Value**: Reduces service completion time by 40%, improves customer satisfaction through transparent communication, and provides audit trails for compliance and quality assurance.

## Key Features

### Core Functionality

- **Real-time Chat System**: WebSocket-based communication between dealers and technicians
- **Inspection Management**: Complete vehicle inspection workflow with photo uploads
- **Service Posting**: Dealer-initiated service requests with technician assignment
- **Role-based Access Control**: Separate interfaces for dealers, technicians, and administrators
- **Counter-offer System**: Negotiation workflow for service pricing and scope

### Advanced Features

- **File Sharing**: Photo and document exchange within chat conversations
- **Notification System**: Real-time alerts for new messages and status updates
- **Search & Filtering**: Advanced post and inspection search capabilities
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Audit Logging**: Complete activity tracking for compliance

## Technology Stack

### Frontend

- **React 18.3.1** - Modern UI framework with hooks
- **Bootstrap 5.3.7** - Responsive CSS framework
- **WebSocket** - Real-time communication
- **Axios** - HTTP client for API calls

### Backend

- **Spring Boot 3.5.3** - Java application framework
- **Spring WebSocket** - Real-time messaging support
- **Spring Data JPA** - Database abstraction layer
- **MySQL 8.0** - Primary database
- **Flyway** - Database migration management

### Infrastructure

- **Eureka Service Registry** - Service discovery
- **Maven** - Build and dependency management
- **Java 17** - Runtime environment

## High-level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Dealer Frontend - React]
        B[Technician Dashboard - React]
        C[Admin Dashboard - React]
    end

    subgraph "API Gateway Layer"
        D[Gateway Service]
    end

    subgraph "Backend Services"
        E[Chat Service]
        F[Posting Service]
        G[Technician Service]
        H[Inspection Service]
        I[Dealer Service]
    end

    subgraph "Data Layer"
        J[(MySQL Database)]
        K[File Storage]
    end

    subgraph "External Integrations"
        L[Eureka Registry]
        M[WebSocket Broker]
    end

    A --> D
    B --> D
    C --> D
    D --> E
    D --> F
    D --> G
    D --> H
    D --> I
    E --> J
    F --> J
    G --> J
    H --> J
    I --> J
    H --> K
    E --> M
    F --> L
    G --> L
    H --> L
    I --> L
```

## System Components

### Service Architecture

```mermaid
graph LR
    subgraph "Core Services"
        A[Chat Service<br/>Port: 8089]
        B[Posting Service<br/>Port: 8081]
        C[Technician Service<br/>Port: 8082]
        D[Inspection Service<br/>Port: 8083]
        E[Dealer Service<br/>Port: 8084]
    end

    subgraph "Supporting Services"
        F[Gateway Service<br/>Port: 8080]
        G[Service Registry<br/>Port: 8761]
    end

    F --> A
    F --> B
    F --> C
    F --> D
    F --> E
    A --> G
    B --> G
    C --> G
    D --> G
    E --> G
```

### Database Schema Overview

```mermaid
erDiagram
    USERS {
        bigint id PK
        varchar username
        varchar email
        varchar role
        timestamp created_at
    }

    POSTS {
        bigint id PK
        varchar title
        text description
        varchar status
        bigint dealer_id FK
        bigint technician_id FK
        timestamp created_at
    }

    INSPECTIONS {
        bigint id PK
        bigint post_id FK
        text report_data
        varchar status
        timestamp completed_at
    }

    CHAT_ROOMS {
        varchar room_id PK
        varchar post_id
        varchar title
        timestamp created_at
    }

    CHAT_MESSAGES {
        bigint id PK
        varchar room_id FK
        varchar sender_id
        text content
        timestamp created_at
    }

    USERS ||--o{ POSTS : creates
    USERS ||--o{ POSTS : assigned_to
    POSTS ||--o{ INSPECTIONS : has
    POSTS ||--o{ CHAT_ROOMS : associated_with
    CHAT_ROOMS ||--o{ CHAT_MESSAGES : contains
```

## Data Flow

### Chat System Flow

```mermaid
sequenceDiagram
    participant D as Dealer
    participant CS as Chat Service
    participant DB as Database
    participant T as Technician

    D->>CS: Send Message
    CS->>DB: Store Message
    CS->>T: Push via WebSocket
    T->>CS: Mark as Read
    CS->>DB: Update Read Status
    CS->>D: Confirm Delivery
```

### Inspection Workflow

```mermaid
flowchart TD
    A[Dealer Creates Post] --> B[Technician Accepts]
    B --> C[Inspection Scheduled]
    C --> D[Technician Conducts Inspection]
    D --> E[Photos Uploaded]
    E --> F[Report Generated]
    F --> G[Dealer Reviews]
    G --> H[Service Completed]

    D --> I[Chat Communication]
    I --> J[Status Updates]
    J --> G
```

## Performance Characteristics

- **Response Time**: < 200ms for API calls
- **WebSocket Latency**: < 50ms for real-time messages
- **Database Queries**: Optimized with proper indexing
- **File Upload**: Support for up to 10MB images
- **Concurrent Users**: Designed for 100+ simultaneous users

## Scalability Considerations

- **Horizontal Scaling**: Stateless services support multiple instances
- **Database**: Read replicas for heavy query loads
- **Caching**: Redis integration ready for future implementation
- **Load Balancing**: Gateway service supports round-robin distribution
- **Microservices**: Independent deployment and scaling of services
