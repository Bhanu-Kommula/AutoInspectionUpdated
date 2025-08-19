import React, { createContext, useContext, useState, useEffect } from "react";

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for admin authentication
    const checkAdminAuth = () => {
      try {
        // Check if admin user already exists in localStorage
        const existingAdmin = localStorage.getItem("adminUser");
        if (existingAdmin) {
          const parsed = JSON.parse(existingAdmin);
          setAdminUser(parsed);
          setIsAuthenticated(true);
          return;
        }

        // No automatic login - require proper authentication
        setIsAuthenticated(false);
        console.log("🔒 Admin authentication required");
      } catch (error) {
        console.error("Error checking admin authentication:", error);
        setIsAuthenticated(false);
      }
    };

    checkAdminAuth();
  }, []);

  const login = (adminData) => {
    setAdminUser(adminData);
    setIsAuthenticated(true);
    localStorage.setItem("adminUser", JSON.stringify(adminData));
  };

  const logout = () => {
    setAdminUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("adminUser");
    localStorage.removeItem("currentUser");
  };

  const value = {
    adminUser,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
