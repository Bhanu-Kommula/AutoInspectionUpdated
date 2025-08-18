# All State Auto Inspection - Development Setup

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Modern web browser

### Installation & Setup

1. **Navigate to the frontend directory:**

   ```bash
   cd dealer-frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   # Option 1: Use the provided script (recommended)
   ./start-dev.sh

   # Option 2: Manual start
   npm start
   ```

4. **Access the application:**
   - Open your browser and go to: `http://localhost:3000`
   - The application will automatically reload when you make changes

## 🔧 Development Configuration

### Security Settings (Development Mode)

- **Security is DISABLED** for development/demo purposes
- All authentication checks are bypassed
- Mock data is returned for missing API endpoints
- WebSocket connections are disabled to prevent connection errors

### Environment Variables

The following environment variables are automatically set in development mode:

```bash
NODE_ENV=development
REACT_APP_SECURITY_DISABLED=true
REACT_APP_API_GATEWAY_URL=http://localhost:8080
REACT_APP_AUTH_BASE_URL=http://localhost:8080/api/v1/users/auth
REACT_APP_POSTS_BASE_URL=http://localhost:8080/api/v1/posts
REACT_APP_DEALER_BASE_URL=http://localhost:8080/api/v1/dealer
REACT_APP_TECHNICIAN_BASE_URL=http://localhost:8080/api/technicians
REACT_APP_ADMIN_BASE_URL=http://localhost:8080/api/v1/admin
REACT_APP_USER_BASE_URL=http://localhost:8080/api/v1/users
REACT_APP_WEBSOCKET_BASE_URL=http://localhost:8080
```

## 🎯 Application Features

### Available Routes

- `/` - Landing page
- `/login` or `/dealer/login` - Dealer login
- `/register` - Dealer registration
- `/tech-login` - Technician login
- `/tech-register` - Technician registration
- `/admin-login` - Admin login
- `/admin-register` - Admin registration
- `/postings` - Dealer dashboard (requires login)
- `/tech-feeds` - Technician dashboard (requires login)
- `/admin-dashboard` - Admin dashboard (requires login)

### Test Credentials

For development/demo purposes, you can use any email/password combination. The application will:

- Accept any valid email format
- Accept any password (minimum 6 characters)
- Automatically log you in with mock data

### Mock Data

When API endpoints are not available, the application returns mock data:

- **Profile Data**: Mock dealer profile with test information
- **Posts Data**: Empty array (no posts in development)
- **Pending Offers**: Empty array (no pending offers)

## 🐛 Troubleshooting

### Common Issues

1. **"No routes matched location" error**

   - ✅ **FIXED**: Added `/dealer/login` route to match the expected URL

2. **API endpoints returning 404**

   - ✅ **FIXED**: Added mock data responses for missing endpoints
   - The application will continue to work with mock data

3. **WebSocket connection errors**

   - ✅ **FIXED**: WebSocket connections are disabled in development mode
   - No real-time updates, but the application works normally

4. **Autocomplete warnings in browser console**

   - ✅ **FIXED**: Added proper autocomplete attributes to all form fields

5. **Authentication context errors**
   - ✅ **FIXED**: Security is disabled, authentication checks are bypassed

### Browser Console Messages

You may see these messages in the browser console (these are normal in development mode):

```
🔌 WebSocket: Skipping connection in development mode
Returning mock profile data for development
Returning mock pending offers data for development
```

### Performance Notes

- The application uses lazy loading for better performance
- Components are memoized to prevent unnecessary re-renders
- API calls are debounced to prevent excessive requests

## 📱 Testing the Application

### Dealer Flow

1. Go to `/register` and create a dealer account
2. Login at `/login` with your credentials
3. Access the dealer dashboard at `/postings`
4. Test profile management and other features

### Technician Flow

1. Go to `/tech-register` and create a technician account
2. Login at `/tech-login` with your credentials
3. Access the technician dashboard at `/tech-feeds`

### Admin Flow

1. Go to `/admin-register` and create an admin account
2. Login at `/admin-login` with your credentials
3. Access the admin dashboard at `/admin-dashboard`

## 🔄 Making Changes

### File Structure

```
dealer-frontend/
├── src/
│   ├── components/          # React components
│   ├── contexts/           # React contexts (AuthContext)
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── config/             # Configuration files
│   ├── data/               # Static data files
│   └── services/           # API service functions
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

### Key Files Modified for Development

- `src/config/security.js` - Security configuration
- `src/api.js` - API configuration and mock data
- `src/hooks/useWebSocket.js` - WebSocket handling
- `src/App.js` - Routing configuration
- Login/Register forms - Added autocomplete attributes

## 🚀 Production Deployment

When ready for production:

1. Set `SECURITY_DISABLED=false` in `src/config/security.js`
2. Configure proper API endpoints
3. Enable WebSocket connections
4. Set up proper authentication
5. Build the application: `npm run build`

## 📞 Support

For development issues or questions:

- Check the browser console for error messages
- Verify all environment variables are set correctly
- Ensure the backend services are running (if testing with real APIs)
- Review the troubleshooting section above

---

**Note**: This is a development/demo setup with security disabled. Do not use this configuration in production environments.
