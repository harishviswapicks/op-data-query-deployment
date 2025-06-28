"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserProfile } from "@/types";
import { apiClient, checkBackendHealth, handleApiError } from "@/lib/api";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, token?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // 🔒 AUTHENTICATION ENABLED
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      // Check for stored token
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken) {
        console.log('🔍 No stored token found');
        setUser(null);
        return;
      }

      console.log('🔑 Found stored token, attempting to restore session');
      apiClient.setToken(storedToken);
      
      // Try to get current user from backend
      const backendUser = await apiClient.getCurrentUser();
      
      // Convert backend user format to frontend UserProfile format
      const userProfile: UserProfile = {
        id: backendUser.id,
        email: backendUser.email,
        role: backendUser.role,
        createdAt: new Date(),
        lastActive: new Date(),
        preferences: {
          defaultAgentMode: 'quick',
          autoUpgradeToDeep: false,
          notificationChannels: ['slack'],
          workingHours: {
            start: '09:00',
            end: '17:00',
            timezone: 'America/New_York',
          },
          favoriteDataSources: [],
        },
        agentConfig: {
          personality: 'professional',
          responseStyle: 'balanced',
          creativityLevel: 50,
          responseLength: 'standard',
        }
      };
      setUser(userProfile);
      console.log('✅ Restored user session successfully:', userProfile);
    } catch (error) {
      console.error('Auth check failed, clearing stored token:', error);
      // Clear invalid token
      localStorage.removeItem('auth_token');
      apiClient.clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, token?: string) => {
    if (!token) {
      throw new Error('Login token is required');
    }

    // Store token and get user info
    console.log('✅ Login successful, storing token and getting user info');
    apiClient.setToken(token);
    
    try {
      const backendUser = await apiClient.getCurrentUser();
      // Convert backend user format to frontend UserProfile format
      const userProfile: UserProfile = {
        id: backendUser.id,
        email: backendUser.email,
        role: backendUser.role,
        createdAt: new Date(),
        lastActive: new Date(),
        preferences: {
          defaultAgentMode: 'quick',
          autoUpgradeToDeep: false,
          notificationChannels: ['slack'],
          workingHours: {
            start: '09:00',
            end: '17:00',
            timezone: 'America/New_York',
          },
          favoriteDataSources: [],
        },
        agentConfig: {
          personality: 'professional',
          responseStyle: 'balanced',
          creativityLevel: 50,
          responseLength: 'standard',
        }
      };
      setUser(userProfile);
      console.log('✅ User authenticated successfully:', userProfile);
    } catch (error) {
      console.error('Failed to get user info with token:', error);
      apiClient.clearToken();
      localStorage.removeItem('auth_token');
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear backend token and stored token
      apiClient.clearToken();
      localStorage.removeItem('auth_token');
      console.log('🔓 User logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setUser(null);
  };

  const refreshUser = async () => {
    await checkAuthStatus();
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
