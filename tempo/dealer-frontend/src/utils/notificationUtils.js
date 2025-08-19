// Notification utility functions to replace toast messages
export const addNotification = (setNotifications, setUnreadCount, message, type = 'info') => {
  const notification = {
    id: Date.now(),
    message,
    type, // 'success', 'error', 'warning', 'info'
    timestamp: new Date().toLocaleTimeString(),
    read: false
  };

  setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Keep max 20 notifications
  setUnreadCount(prev => prev + 1);
};

export const addSuccessNotification = (setNotifications, setUnreadCount, message) => {
  addNotification(setNotifications, setUnreadCount, `✅ ${message}`, 'success');
};

export const addErrorNotification = (setNotifications, setUnreadCount, message) => {
  addNotification(setNotifications, setUnreadCount, `❌ ${message}`, 'error');
};

export const addWarningNotification = (setNotifications, setUnreadCount, message) => {
  addNotification(setNotifications, setUnreadCount, `⚠️ ${message}`, 'warning');
};

export const addInfoNotification = (setNotifications, setUnreadCount, message) => {
  addNotification(setNotifications, setUnreadCount, `ℹ️ ${message}`, 'info');
};

export const markNotificationAsRead = (setNotifications, notificationId) => {
  setNotifications(prev => 
    prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    )
  );
};

export const markAllNotificationsAsRead = (setNotifications, setUnreadCount) => {
  setNotifications(prev => 
    prev.map(notification => ({ ...notification, read: true }))
  );
  setUnreadCount(0);
};

export const clearNotifications = (setNotifications, setUnreadCount) => {
  setNotifications([]);
  setUnreadCount(0);
}; 