/*
A protected route checks if the user is logged in and has the right role
before showing a page. If not, it sends them to the login page.
*/

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth();

  // If no user is logged in, send to login page
  if (!user) {
    return <Navigate to="/login" replace />;
    // "replace" means the login page replaces this in browser history
    // so clicking back won't loop
  }

  // If user exists but has wrong role, send to login
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  // User is logged in and has correct role - show the page
  return children;
}

export default ProtectedRoute;
