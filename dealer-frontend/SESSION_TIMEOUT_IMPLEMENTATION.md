# Session Timeout Implementation - Automatic Logout

## 🎯 **Overview**

Implemented automatic session timeout and logout functionality for both dealers and technicians. When sessions expire due to inactivity, users are automatically logged out and redirected to the landing page.

## 🔧 **Key Features**

### **1. Automatic Session Monitoring**

- **30-minute session timeout** (configurable)
- **5-minute warning** before expiry
- **User activity tracking** (mouse, keyboard, touch, scroll)
- **Page visibility detection** (handles tab switching)

### **2. Smart Session Management**

- **Session extension** on API calls
- **Automatic cleanup** on logout
- **Cross-browser session isolation**
- **Real-time activity monitoring**

### **3. User Experience**

- **Warning modal** 5 minutes before expiry
- **Session expiry notification**
- **Automatic redirect** to landing page
- **Smooth logout process**

## 📁 **Files Created/Modified**

### **New Files:**

1. `src/utils/sessionTimeoutManager.js` - Core timeout management
2. `src/hooks/useSessionTimeout.js` - React hook for protected pages
3. `src/components/SessionTimeoutTest.js` - Test component (optional)

### **Modified Files:**

1. `src/utils/sessionManager.js` - Enhanced with timeout integration
2. `src/components/DealerLogin.js` - Uses new session management
3. `src/components/TechnicianLogin.js` - Uses new session management
4. `src/components/PostingsPage/PostingsPage.jsx` - Added session monitoring
5. `src/TechnicianFeedApp.js` - Added session monitoring
6. `src/TechnicianDashboardPage.js` - Added session monitoring
7. `src/utils/technicianApiUtils.js` - Session extension on API calls

## ⚙️ **Configuration**

### **Session Timeout Settings:**

```javascript
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIMEOUT = 5 * 60 * 1000; // 5 minutes before expiry
```

### **Activity Events Monitored:**

- `mousedown`, `mousemove`, `keypress`, `scroll`, `touchstart`, `click`

## 🔄 **How It Works**

### **1. Login Process**

```javascript
// Dealer Login
initializeDealerSession(dealerData); // Starts timeout monitoring

// Technician Login
storeTechnicianData(technicianData); // Starts timeout monitoring
```

### **2. Protected Pages**

```javascript
// Automatically added to protected pages
useSessionTimeout(); // Checks login status + starts monitoring
```

### **3. API Activity**

```javascript
// Automatically extends session on API calls
extendSession(); // Resets timeout timer
```

### **4. Session Expiry**

```javascript
// Automatic process:
1. Show warning modal (5 min before)
2. Clear all session data
3. Show expiry notification
4. Redirect to landing page
```

## 🛡️ **Security Features**

### **1. Session Isolation**

- **Browser-specific sessions** for technicians
- **Cross-tab protection**
- **Automatic cleanup** on logout

### **2. Data Protection**

- **Complete session clearing** on expiry
- **No data persistence** after timeout
- **Secure redirect** to landing page

### **3. Activity Validation**

- **Real-time monitoring** of user activity
- **Page visibility detection**
- **API call validation**

## 🎨 **User Interface**

### **Warning Modal:**

- Appears 5 minutes before session expiry
- Shows remaining time
- "Continue Session" button
- Auto-dismisses after 10 seconds

### **Expiry Notification:**

- Red notification in top-right corner
- "Session Expired" message
- Auto-removes after 5 seconds

## 🧪 **Testing**

### **Test Component:**

```javascript
// Add to any page for testing
import SessionTimeoutTest from "./components/SessionTimeoutTest";
<SessionTimeoutTest />;
```

### **Manual Testing:**

1. Login as dealer or technician
2. Wait for warning modal (or reduce timeout for testing)
3. Verify automatic logout and redirect
4. Check session data is cleared

## 🚀 **Usage**

### **For Developers:**

1. **Protected pages** automatically get session monitoring
2. **API calls** automatically extend sessions
3. **No additional code** needed for basic functionality

### **For Users:**

1. **Login normally** - session monitoring starts automatically
2. **Stay active** - sessions extend automatically
3. **Get warnings** - 5 minutes before expiry
4. **Automatic logout** - when session expires

## 🔧 **Customization**

### **Change Timeout Duration:**

```javascript
// In sessionTimeoutManager.js
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour
const WARNING_TIMEOUT = 10 * 60 * 1000; // 10 minutes
```

### **Add Custom Activity Events:**

```javascript
// In sessionTimeoutManager.js
const activityEvents = [
  "mousedown",
  "mousemove",
  "keypress",
  "scroll",
  "touchstart",
  "click",
  "customEvent",
];
```

### **Custom Warning Modal:**

```javascript
// Modify showSessionWarning() function in sessionTimeoutManager.js
```

## ✅ **Benefits**

1. **Enhanced Security** - Automatic logout prevents unauthorized access
2. **Better UX** - Clear warnings and smooth logout process
3. **Resource Management** - Frees up server resources
4. **Compliance** - Meets security requirements
5. **Easy Implementation** - Minimal code changes required

## 🔍 **Monitoring**

### **Console Logs:**

- Session initialization
- Activity updates
- Warning triggers
- Session expiry
- Cleanup operations

### **Debug Information:**

- Session ID tracking
- Activity timestamps
- Remaining time calculations
- Event monitoring status

## 🎯 **Next Steps**

1. **Test thoroughly** in different browsers
2. **Monitor performance** impact
3. **Gather user feedback** on timeout duration
4. **Consider adding** session recovery options
5. **Implement analytics** for session patterns
