import React from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../contexts/AdminAuthContext";

const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) {
    // Redirect to admin login if not authenticated
    return <Navigate to="/admin-login" replace />;
  }

  return children;
};

export default ProtectedAdminRoute;
