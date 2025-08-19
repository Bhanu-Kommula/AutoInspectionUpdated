# Admin Dashboard Test Guide

## 🧪 Testing the Admin Dashboard

The admin dashboard is now running successfully! Here's how to test all the features:

### 🌐 **Access the Dashboard**

1. **Open your browser** and navigate to: `http://localhost:3000/admin-dashboard`
2. **Alternative**: Go to `http://localhost:3000` and click "Admin Portal" in the navigation

### ✅ **Test Checklist**

#### 🏠 **Overview Tab (Default)**
- [ ] **Statistics Cards Load**: Check if dealer statistics are displayed
  - Total Dealers count
  - Active Dealers count  
  - Pending Verification count
  - Suspended Dealers count
- [ ] **Recent Dealers Section**: Verify recent dealer activity is shown
- [ ] **Recent Posts Section**: Check if recent posts are displayed
- [ ] **Refresh Button**: Click refresh to reload all data

#### 👥 **Dealer Management Tab**
- [ ] **Dealer List Loads**: Verify dealer table displays with data
- [ ] **Search Functionality**: 
  - Type in search box to filter dealers
  - Test with dealer names, emails, or partial text
- [ ] **Status Filtering**: 
  - Select different statuses from dropdown
  - Verify filtered results
- [ ] **Location Filtering**: 
  - Enter location text
  - Check filtered results
- [ ] **Pagination**: 
  - Navigate between pages if multiple pages exist
  - Check page size controls
- [ ] **Individual Actions**:
  - **View Details**: Click eye icon on any dealer
  - **Verify Dealer**: For pending dealers, click checkmark
  - **Suspend Dealer**: For active dealers, click ban icon
  - **Activate Dealer**: For suspended dealers, click checkmark
  - **Delete Dealer**: Click trash icon (requires confirmation)
- [ ] **Bulk Operations**:
  - Select multiple dealers using checkboxes
  - Click "Bulk Actions" button
  - Choose action (Activate, Suspend, Delete)
  - Add reason and execute
- [ ] **Export Functionality**: 
  - Click "Export" button
  - Verify CSV file downloads

#### 📝 **Post Management Tab**
- [ ] **Posts List**: Verify posts table loads with data
- [ ] **Post Actions**:
  - View post details (eye icon)
  - Approve posts (checkmark icon)
  - Reject posts (times icon)
  - Delete posts (trash icon)

#### 📊 **Audit Trail Tab**
- [ ] **Audit Display**: Check if audit information is shown
- [ ] **Note**: This is currently a placeholder for future implementation

#### ⚙️ **Settings Tab**
- [ ] **System Settings**: Verify configuration options are displayed
- [ ] **System Health**: Check health status indicators

### 🔍 **Expected Behavior**

#### **Loading States**
- [ ] Spinners appear during data loading
- [ ] Loading states are properly managed
- [ ] Error states are handled gracefully

#### **Responsive Design**
- [ ] **Desktop**: Full sidebar and content layout
- [ ] **Tablet**: Collapsible sidebar works
- [ ] **Mobile**: Responsive table and controls

#### **User Interactions**
- [ ] **Hover Effects**: Buttons and cards respond to hover
- [ ] **Animations**: Smooth transitions between tabs
- [ ] **Toast Notifications**: Success/error messages appear
- [ ] **Confirmation Dialogs**: Critical actions require confirmation

### 🚨 **Common Issues & Solutions**

#### **Data Not Loading**
- **Symptom**: Empty tables or loading spinners that never complete
- **Check**: Browser console for API errors
- **Solution**: Verify backend services are running

#### **API Errors**
- **Symptom**: Console shows network errors
- **Check**: API endpoint configuration in `src/api.js`
- **Solution**: Ensure correct backend URLs

#### **Styling Issues**
- **Symptom**: Broken layout or missing styles
- **Check**: CSS file is properly imported
- **Solution**: Verify `AdminDashboard.css` exists

### 📱 **Mobile Testing**

1. **Open Developer Tools** (F12)
2. **Toggle Device Toolbar** (mobile icon)
3. **Test Different Screen Sizes**:
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - iPad (768x1024)
4. **Verify Responsive Behavior**:
   - Sidebar collapses properly
   - Tables scroll horizontally
   - Buttons remain accessible

### 🎯 **Performance Testing**

1. **Large Data Sets**: 
   - Test with many dealers (100+)
   - Verify pagination works smoothly
   - Check search performance

2. **Bulk Operations**:
   - Select 50+ dealers
   - Perform bulk actions
   - Monitor response times

3. **Memory Usage**:
   - Open browser dev tools
   - Monitor memory usage during operations
   - Check for memory leaks

### 🔧 **Backend Integration Testing**

#### **Required Services**
- [ ] **API Gateway**: `http://localhost:8088`
- [ ] **Dealer Service**: `http://localhost:8088/dealer/api/dealers`
- [ ] **Posts Service**: `http://localhost:8081`

#### **Test Endpoints**
```bash
# Test dealer statistics
curl http://localhost:8088/dealer/api/dealers/statistics

# Test dealer list
curl http://localhost:8088/dealer/api/dealers/list?page=0&size=20

# Test posts service
curl http://localhost:8081
```

### 📊 **Success Criteria**

The admin dashboard is working correctly when:

✅ **All tabs load without errors**  
✅ **Data displays correctly**  
✅ **Search and filtering work**  
✅ **Actions execute successfully**  
✅ **Responsive design functions**  
✅ **No console errors**  
✅ **Performance is acceptable**  

### 🚀 **Ready for Production**

Once all tests pass:
1. **Build the application**: `npm run build`
2. **Deploy to production server**
3. **Configure production API endpoints**
4. **Set up monitoring and logging**

---

**Happy Testing! 🎉**

If you encounter any issues, check the browser console for error messages and refer to the troubleshooting section in the main README.
