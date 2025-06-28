"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserProfile } from "@/types";
import { apiClient, checkBackendHealth, handleApiError } from "@/lib/api";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  backendAvailable: boolean;
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
  // 🚨 TEMPORARY: Bypass authentication for development
  // TODO: Remove this bypass and restore proper authentication
  
  console.log("🔓 AUTH PROVIDER BYPASS ENABLED - Using mock user");
  
  // Mock user for development
  const mockUser: UserProfile = {
    id: "dev-user-123",
    email: "harish.viswanathan@prizepicks.com",
    role: "analyst",
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

  const value: AuthContextType = {
    user: mockUser,
    isLoading: false,
    backendAvailable: true,
    login: async () => { console.log("🔓 Mock login - bypassed"); },
    logout: async () => { console.log("🔓 Mock logout - bypassed"); },
    refreshUser: async () => { console.log("🔓 Mock refresh - bypassed"); },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
  
  /* 
  // 🔒 COMMENTED OUT: Original authentication logic
  // Uncomment this section to restore authentication
  
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
        // Check for stored token
        const storedToken = localStorage.getItem('auth_token');
        if (storedToken) {
          console.log('🔑 Found stored token, attempting to restore session');
          apiClient.setToken(storedToken);
        }
        
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
          console.log('✅ Restored user session from backend:', userProfile);
        } catch (error) {
          console.log('Backend auth check failed, clearing stored token and falling back to local auth');
          // Clear invalid token
          localStorage.removeItem('auth_token');
          apiClient.clearToken();
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

  const login = async (email: string, token?: string) => {
    // Check if backend is available first
    const isBackendUp = await checkBackendStatus();
    
    if (isBackendUp && token) {
      // Backend authentication successful - store token and get user info
      console.log('Using backend authentication with token');
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
        console.log('✅ Backend user authenticated:', userProfile);
        return;
      } catch (error) {
        console.error('Failed to get user info with backend token:', error);
        // Fall through to local auth
      }
    }
    
    if (isBackendUp && !token) {
      // Backend is available but no token provided - this shouldn't happen in normal flow
      console.log('Backend available but no token provided - falling back to local auth');
    }
    
    // Fall back to local auth system
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
      
      // Clear stored token
      localStorage.removeItem('auth_token');
      
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
  */
}
