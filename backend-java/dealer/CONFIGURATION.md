# Dealer Service Configuration Guide

## Environment Variables

The dealer service now supports environment-based configuration for better security and flexibility. Here are the available environment variables:

### Server Configuration

- `SERVER_PORT` (default: 8080) - The port on which the server runs

### Database Configuration

⚠️ **Important**: Do not hardcode database credentials in application.properties

- `DB_URL` (default: jdbc:mysql://localhost:3306/inspection) - Database connection URL
- `DB_USERNAME` (default: root) - Database username
- `DB_PASSWORD` (required) - Database password

### JPA Configuration

- `DDL_AUTO` (default: update) - Hibernate DDL auto mode
- `SHOW_SQL` (default: false) - Whether to show SQL queries in logs

### Service Discovery

- `EUREKA_URL` (default: http://localhost:8761/eureka) - Eureka server URL

### CORS Configuration

- `CORS_ALLOWED_ORIGINS` (default: http://localhost:3000) - Comma-separated allowed origins

## Example Environment Setup

### For Development (.env file or environment variables):

```bash
export SERVER_PORT=8080
export DB_URL=jdbc:mysql://localhost:3306/inspection
export DB_USERNAME=root
export DB_PASSWORD=your_password_here
export DDL_AUTO=update
export SHOW_SQL=true
export EUREKA_URL=http://localhost:8761/eureka
export CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### For Production:

```bash
export SERVER_PORT=8080
export DB_URL=jdbc:mysql://prod-db-host:3306/inspection_prod
export DB_USERNAME=prod_user
export DB_PASSWORD=secure_production_password
export DDL_AUTO=validate
export SHOW_SQL=false
export EUREKA_URL=http://eureka-server:8761/eureka
export CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

## Updated API Endpoints

All endpoints now use the `/api/dealers` prefix for better API versioning:

- `POST /api/dealers/register` - Register a new dealer
- `POST /api/dealers/login` - Dealer login
- `PUT /api/dealers/update-profile` - Update dealer profile
- `GET /api/dealers/profile/{email}` - Get dealer profile by email
- `GET /api/dealers/profile/dealer-id/{dealerId}` - Get dealer profile by dealer ID
- `GET /api/dealers/audit-logs/{email}` - Get audit trail for a dealer

## Updated Data Model

The Dealer entity now includes the following fields:

```java
public class Dealer {
    private Long id;              // Auto-generated primary key
    private long dealerId;        // Unique business dealer ID
    private String name;          // Dealer name
    private String email;         // Unique email address
    private String password;      // Password (min 8 characters)
    private String location;      // City/location
    private String zipcode;       // Postal code (5-10 characters)
    private String phone;         // Phone number (validated format)
}
```

## Request/Response Examples

### Registration Request

```json
{
  "dealerId": 12345,
  "name": "John's Auto Dealer",
  "email": "john@autodealers.com",
  "password": "securePassword123",
  "location": "New York",
  "zipcode": "10001",
  "phone": "+1234567890"
}
```

### Login Request

```json
{
  "email": "john@autodealers.com",
  "password": "securePassword123"
}
```

### Login Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "dealerId": 12345,
    "email": "john@autodealers.com",
    "name": "John's Auto Dealer",
    "phone": "+1234567890"
  },
  "error": null
}
```

### Update Profile Request

```json
{
  "email": "john@autodealers.com",
  "dealerId": 12345,
  "name": "John's Premium Auto Dealer",
  "location": "Manhattan",
  "zipcode": "10002",
  "phone": "+1234567891",
  "updatedBy": "john@autodealers.com"
}
```

## Response Format

All endpoints now return a consistent response format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "error": null
}
```

## Validation Rules

### Dealer Registration/Update Validation:

- **dealerId**: Required, unique numeric value
- **name**: 2-100 characters, required
- **email**: Valid email format, unique, required
- **password**: Minimum 8 characters, required
- **location**: 2-100 characters, required
- **zipcode**: 5-10 characters, required
- **phone**: Valid phone number format (supports international), required

### Phone Number Format:

- Supports international format with optional country code
- Pattern: `^[\+]?[1-9]?[0-9]{7,15}$`
- Examples: `+1234567890`, `1234567890`, `234567890`

## Security Considerations

1. **Database Credentials**: Use environment variables, never hardcode
2. **CORS**: Configure specific allowed origins, avoid wildcards in production
3. **Password Hashing**: Implement proper password hashing before production
4. **Input Validation**: All DTOs now have comprehensive validation annotations
5. **Error Handling**: Improved error handling with proper logging
6. **Unique Constraints**: Both email and dealerId must be unique
7. **Audit Trail**: All profile changes are logged with timestamps and user info

## Database Schema Changes

The Dealer table now includes:

- `dealer_id` column (BIGINT, UNIQUE, NOT NULL)
- `phone` column (VARCHAR, NOT NULL)

Ensure your database migration scripts include:

```sql
ALTER TABLE Dealer ADD COLUMN dealer_id BIGINT UNIQUE NOT NULL;
ALTER TABLE Dealer ADD COLUMN phone VARCHAR(20) NOT NULL;
```
