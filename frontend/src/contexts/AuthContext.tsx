import React, { createContext, useContext, useEffect, useState } from 'react';
import { mockAuth } from '../lib/mockAPI';

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
    mockAuth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = mockAuth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await mockAuth.signInWithPassword(email, password);
    if (error) throw error;
    // Store token for session persistence
    localStorage.setItem('mock-token', 'mock-access-token');
    // Update user state immediately
    setUser(data.user);
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await mockAuth.signUp(email, password);
    if (error) throw error;
    // Store token for session persistence
    localStorage.setItem('mock-token', 'mock-access-token');
    // Update user state immediately
    setUser(data.user);
  };

  const signInWithGoogle = async () => {
    const { data, error } = await mockAuth.signInWithOAuth();
    if (error) throw error;
    // Store token for session persistence
    localStorage.setItem('mock-token', 'mock-google-token');
    // Update user state immediately
    setUser(data.user);
  };

  const logout = async () => {
    const { error } = await mockAuth.signOut();
    if (error) throw error;
    // Clear stored token
    localStorage.removeItem('mock-token');
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
      {!loading && children}
    </AuthContext.Provider>
  );
};
