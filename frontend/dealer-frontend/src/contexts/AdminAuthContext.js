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

        // Set up default admin user for testing
        const defaultAdmin = {
          id: 1,
          email: "admin@example.com",
          name: "System Administrator",
          role: "ADMIN",
        };

        setAdminUser(defaultAdmin);
        setIsAuthenticated(true);

        // Store in localStorage for persistence
        localStorage.setItem("adminUser", JSON.stringify(defaultAdmin));

        // Also set currentUser for compatibility with other parts of the app
        localStorage.setItem("currentUser", defaultAdmin.email);

        console.log("✅ Admin user set up successfully:", defaultAdmin.email);
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
