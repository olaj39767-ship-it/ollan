"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Function to check token expiration
 const checkTokenExpiration = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    if (user) setUser(null);
    return;
  }

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const decoded = JSON.parse(jsonPayload);

    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      return;
    }

    // Prefer full user from localStorage instead of rebuilding from JWT
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (!user || user.id !== parsedUser.id) {
        setUser(parsedUser);
        console.log('User loaded from localStorage:', parsedUser);
      }
      return;
    }

    // Fallback (rare)
    const userData: User = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      referralCode: decoded.referralCode,
      storeCredit: decoded.storeCredit,
    };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  } catch (error) {
    console.error('JWT decode error:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }
};

  useEffect(() => {
    // Initial check on mount
    const storedUser = localStorage.getItem('user');
    console.log('Token from localStorage:', localStorage.getItem('token') ? 'Present' : 'Missing');
    console.log('Stored user from localStorage:', storedUser);

    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        console.log('Parsed user from localStorage:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
      }
    }

    // Periodic check for token expiration every 60 seconds
    checkTokenExpiration();
    const interval = setInterval(checkTokenExpiration, 60 * 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    console.log('Logged out, user and token cleared');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};