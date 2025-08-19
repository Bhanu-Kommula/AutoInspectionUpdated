# Admin Dashboard - Dealer Management System

## Overview

The Admin Dashboard is a comprehensive management interface for administrators to monitor and manage dealers, posts, and system activities. It provides real-time statistics, bulk operations, and detailed audit trails.

## Features

### 🏠 Dashboard Overview
- **Real-time Statistics**: View total dealers, active dealers, pending verifications, and suspended dealers
- **Recent Activity**: Monitor recent dealer registrations and post activities
- **System Health**: Check database, cache, and service status

### 👥 Dealer Management
- **Comprehensive List**: View all dealers with pagination and search capabilities
- **Advanced Filtering**: Filter by status, location, and search keywords
- **Bulk Operations**: Perform actions on multiple dealers simultaneously
- **Individual Actions**: 
  - View detailed dealer information
  - Verify pending dealers
  - Suspend/activate dealers
  - Delete dealers with audit trail

### 📝 Post Management
- **Post Overview**: View all posts with dealer information
- **Content Management**: Approve, reject, or delete posts
- **Status Tracking**: Monitor post status and moderation actions

### 📊 Audit Trail
- **Change Tracking**: Monitor all dealer status changes and modifications
- **User Activity**: Track who performed what actions and when
- **Compliance**: Maintain audit logs for regulatory requirements

### ⚙️ System Settings
- **Configuration**: Adjust session timeouts, login attempts, and audit retention
- **Health Monitoring**: Real-time system status and performance metrics

## API Endpoints Used

The admin dashboard integrates with the following dealer service endpoints:

### Statistics & Overview
- `GET /api/dealers/statistics` - Get dealer statistics
- `GET /api/dealers/activity-summary` - Get activity summary

### Dealer Management
- `GET /api/dealers/list` - Get paginated dealer list with filters
- `PUT /api/dealers/{dealerId}/status` - Update dealer status
- `POST /api/dealers/{dealerId}/delete` - Delete dealer
- `POST /api/dealers/bulk-action` - Perform bulk operations
- `GET /api/dealers/export` - Export dealer data

### Audit & Monitoring
- `GET /api/dealers/audit-logs/{email}` - Get dealer audit logs
- `GET /api/dealers/by-registration-date` - Filter by registration date
- `GET /api/dealers/search` - Advanced search functionality

## Getting Started

### 1. Access the Dashboard
Navigate to `/admin-dashboard` in your application or click the "Admin Portal" link in the navigation.

### 2. Dashboard Overview
The overview tab displays:
- Total dealer count
- Active dealer count
- Pending verification count
- Suspended dealer count
- Recent dealer activity
- Recent post activity

### 3. Managing Dealers

#### View Dealers
1. Click on the "Dealer Management" tab
2. Use filters to search and filter dealers:
   - **Search**: Enter dealer name, email, or other keywords
   - **Status**: Filter by dealer status (Active, Suspended, Pending, etc.)
   - **Location**: Filter by specific location or zipcode

#### Individual Dealer Actions
- **View Details**: Click the eye icon to see complete dealer information
- **Verify**: For pending dealers, click the checkmark to approve
- **Suspend**: For active dealers, click the ban icon to suspend
- **Activate**: For suspended dealers, click the checkmark to reactivate
- **Delete**: Click the trash icon to permanently remove (with confirmation)

#### Bulk Operations
1. Select multiple dealers using checkboxes
2. Click "Bulk Actions" button
3. Choose action: Activate, Suspend, or Delete
4. Add optional reason for the action
5. Execute the bulk operation

### 4. Export Data
- Use the "Export" button to download dealer data as CSV
- Filter data before export to get specific subsets
- Export includes all dealer information and status

### 5. Monitoring & Audit
- **Audit Trail**: View all changes made to dealer accounts
- **Activity Summary**: Monitor registration trends and updates
- **System Health**: Check service status and performance

## User Interface Features

### Responsive Design
- Mobile-friendly interface
- Collapsible sidebar for smaller screens
- Adaptive table layouts

### Interactive Elements
- Hover effects on cards and buttons
- Smooth animations and transitions
- Real-time loading states

### Data Visualization
- Color-coded status badges
- Icon-based status indicators
- Progress indicators for bulk operations

## Security Features

### Audit Logging
- All actions are logged with user identification
- Timestamp tracking for compliance
- Reason documentation for status changes

### Confirmation Dialogs
- Critical actions require confirmation
- Bulk operations show affected dealer count
- Delete operations require explicit confirmation

### Access Control
- Admin-only functionality
- Session management
- Secure API communication

## Troubleshooting

### Common Issues

#### Data Not Loading
- Check API gateway connectivity
- Verify dealer service is running
- Check browser console for errors

#### Bulk Actions Failing
- Ensure dealers are selected
- Check action type is specified
- Verify network connectivity

#### Export Issues
- Check file permissions
- Ensure sufficient memory for large exports
- Verify CSV format compatibility

### Performance Tips

#### Large Datasets
- Use pagination (20 dealers per page)
- Apply filters to reduce data load
- Use search for specific dealers

#### Bulk Operations
- Limit bulk actions to reasonable numbers
- Use filters before bulk operations
- Monitor operation progress

## Configuration

### Environment Variables
```bash
REACT_APP_API_GATEWAY_URL=http://localhost:8088
REACT_APP_DEALER_BASE_URL=http://localhost:8088/dealer/api/dealers
```

### API Configuration
The dashboard automatically uses the configured API endpoints from `src/api.js`.

## Development

### Adding New Features
1. Update the AdminDashboard component
2. Add corresponding API calls
3. Update CSS for new UI elements
4. Test with different data scenarios

### Customization
- Modify color schemes in CSS
- Add new status types
- Extend bulk operations
- Customize export formats

## Support

For technical support or feature requests:
1. Check the browser console for error messages
2. Verify API endpoint availability
3. Review network requests in browser dev tools
4. Check dealer service logs

## Version History

- **v1.0.0**: Initial admin dashboard implementation
- **v1.1.0**: Added bulk operations and export functionality
- **v1.2.0**: Enhanced audit trail and monitoring features
- **v1.3.0**: Improved responsive design and performance optimizations

---

**Note**: This admin dashboard is designed to work with the dealer service backend. Ensure all required endpoints are available and properly configured before use.
