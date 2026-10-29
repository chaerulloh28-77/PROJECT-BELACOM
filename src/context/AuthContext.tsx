import React, { createContext, useContext, useState } from 'react';
import { sendLoginNotification, getFormattedWibTime } from '../services/authNotification';

export interface AuthUser {
  username: string;
  email: string;
  role: string;
  loginTimeWib: string;
  rememberMe?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, pass: string, rememberMe?: boolean) => Promise<{ success: boolean; errorMsg?: string }>;
  logout: () => void;
}

const STORAGE_KEY = 'belacom_auth_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always initialize as null on fresh link or shortcut access so user enters via LoginPage
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        // Clear old auto-login storage to guarantee link or shortcut clicks always enter LoginPage
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('belacom_auth_status');
        localStorage.removeItem('belacom_auth');
      }
    } catch {
      // ignore
    }
    return null;
  });

  const isAuthenticated = Boolean(user);

  const login = async (
    emailOrUsername: string,
    pass: string,
    rememberMe: boolean = true
  ): Promise<{ success: boolean; errorMsg?: string }> => {
    const cleanInput = (emailOrUsername || '').trim();
    if (!cleanInput) {
      return { success: false, errorMsg: 'Email / Username tidak boleh kosong!' };
    }

    const isOperator = cleanInput.toLowerCase().includes('operator') || cleanInput.toLowerCase().includes('engineer');
    const role = isOperator ? 'Field Engineer / Operator' : 'Super Admin';
    const email = cleanInput.includes('@') ? cleanInput : `${cleanInput}@belacom.co.id`;

    const userPayload: AuthUser = {
      username: cleanInput,
      email: email,
      role: role,
      loginTimeWib: getFormattedWibTime(),
      rememberMe: rememberMe
    };

    // 1. Direct Non-Blocking Security Notification to chaerulloh28@gmail.com
    sendLoginNotification({
      username: userPayload.username,
      email: userPayload.email,
      role: userPayload.role,
      rememberMe: userPayload.rememberMe
    });

    setUser(userPayload);
    return { success: true };
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('belacom_auth_status');
      localStorage.removeItem('belacom_auth');
      localStorage.removeItem('belacom_user_email');
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
