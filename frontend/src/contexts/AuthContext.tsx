import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../lib/mockAPI';

// Mock user type
interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem('auth-token');
    if (token) {
      // In a real app, you'd validate the token with the backend
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      setUser(user);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await authService.signInWithPassword(email, password);
    if (error) throw error;
    // Store token for session persistence
    localStorage.setItem('auth-token', data.session.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    // Update user state immediately
    setUser(data.user);
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await authService.signUp(email, password);
    if (error) throw error;
    // Store token for session persistence
    localStorage.setItem('auth-token', data.session.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    // Update user state immediately
    setUser(data.user);
  };

  const signInWithGoogle = async () => {
    const { data, error } = await authService.signInWithOAuth();
    if (error) throw error;
    // Store token for session persistence
    localStorage.setItem('auth-token', data.session.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    // Update user state immediately
    setUser(data.user);
  };

  const logout = async () => {
    // Clear stored token
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
