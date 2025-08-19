// Activity Log utility functions for system-level activities
export const addActivityLog = (setActivityLog, message, type = 'info') => {
  const activity = {
    id: Date.now(),
    message,
    type, // 'system', 'user', 'background'
    timestamp: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString()
  };

  setActivityLog(prev => [activity, ...prev.slice(0, 49)]); // Keep max 50 activities
};

export const addSystemActivity = (setActivityLog, message) => {
  addActivityLog(setActivityLog, `🔧 ${message}`, 'system');
};

export const addBackgroundActivity = (setActivityLog, message) => {
  addActivityLog(setActivityLog, `⚙️ ${message}`, 'background');
};

export const addUserActivity = (setActivityLog, message) => {
  addActivityLog(setActivityLog, `👤 ${message}`, 'user');
};

export const clearActivityLog = (setActivityLog) => {
  setActivityLog([]);
}; 