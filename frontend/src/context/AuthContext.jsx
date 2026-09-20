/*
Context is like a global variable that any component in the app can read without passing it through props.
This AuthContext stores the logged-in user for the whole FlowCare app.
*/

import React, { createContext, useContext, useEffect, useState } from "react";
import { AUTH_TOKEN_KEY } from "../utils/constants";

// Step 1: Create the context - this is the "container" for our global state
const AuthContext = createContext(null);

// Step 2: Create the Provider component - this wraps our whole app
export function AuthProvider({ children }) {
  // user state: null means not logged in
  // { id, full_name, role, email } means logged in
  const [user, setUser] = useState(null);

  // loading state: true while we check if user is already logged in
  const [loading, setLoading] = useState(true);

  // useEffect runs once when app loads
  // It calls the /api/auth/me.php endpoint to check if session exists
  useEffect(() => {
    // call checkSession function defined below
    checkSession();
  }, []);

  // checkSession: asks the backend "is anyone logged in on this tab?"
  async function checkSession() {
    try {
      const token = typeof window !== "undefined" ? sessionStorage.getItem(AUTH_TOKEN_KEY) : null;
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/me.php", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
        return;
      }

      const data = await response.json();
      if (data && data.success && data.user) {
        setUser(data.user);
      } else {
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  // login: called after successful login form submit
  // receives user object and optional token, saves token to sessionStorage and user to state
  function login(userData, token = null) {
    if (token) {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    }
    setUser(userData);
  }

  // logout: clears state and calls backend logout endpoint
  async function logout() {
    try {
      const token = typeof window !== "undefined" ? sessionStorage.getItem(AUTH_TOKEN_KEY) : null;
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      await fetch("/api/auth/logout.php", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } finally {
      setUser(null);
    }
  }

  // isRole: helper to check if current user has a specific role
  function isRole(role) {
    return user?.role === role;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isRole }}>
      {/* Only render children after loading is done */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Step 3: Custom hook - instead of writing useContext(AuthContext) everywhere,
// we write useAuth() which is much cleaner
export function useAuth() {
  return useContext(AuthContext);
}
