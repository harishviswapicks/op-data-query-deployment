"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserProfile } from "@/types";
import { apiClient, checkBackendHealth, handleApiError } from "@/lib/api";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  backendAvailable: boolean;
  login: (email: string) => Promise<void>;
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(false);

  const checkBackendStatus = async () => {
    const isAvailable = await checkBackendHealth();
    setBackendAvailable(isAvailable);
    return isAvailable;
  };

  const checkAuthStatus = async () => {
    try {
      // First check if backend is available
      const isBackendUp = await checkBackendStatus();
      
      if (isBackendUp) {
        // Try to get current user from backend
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
        } catch (error) {
          console.log('Backend auth check failed, falling back to local auth');
          // Fall back to local auth system
          await checkLocalAuthStatus();
        }
      } else {
        // Backend not available, use local auth
        await checkLocalAuthStatus();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const checkLocalAuthStatus = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Local auth check failed:', error);
      setUser(null);
    }
  };

  const login = async (email: string) => {
    // Check if backend is available first
    const isBackendUp = await checkBackendStatus();
    
    if (isBackendUp) {
      // For now, we'll use local auth but prepare for backend integration
      // TODO: Implement backend login when auth endpoints are ready
      console.log('Backend available but using local auth for now');
    }
    
    // Use local auth system
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      await checkAuthStatus();
    } else {
      const data = await response.json();
      throw new Error(data.error || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      // Clear backend token if available
      if (backendAvailable) {
        apiClient.clearToken();
      }
      
      // Clear local session
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setUser(null);
    setIsLoading(false);
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
    backendAvailable,
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
