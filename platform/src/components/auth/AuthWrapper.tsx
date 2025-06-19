"use client";

import { useState, useEffect } from "react";
import { UserProfile } from "@/types";
import LoginForm from "./LoginForm";
import UserProfileSetup from "../common/UserProfileSetup";

interface AuthWrapperProps {
  children: (user: UserProfile) => React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [setupEmail, setSetupEmail] = useState("");

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email: string) => {
    // Login successful, refresh user data
    await checkAuthStatus();
  };

  const handleRegister = (email: string) => {
    setSetupEmail(email);
    setShowSetup(true);
  };

  const handleSetupComplete = (profile: UserProfile) => {
    setUser(profile);
    setShowSetup(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (showSetup) {
    return (
      <UserProfileSetup
        email={setupEmail}
        onComplete={handleSetupComplete}
      />
    );
  }

  if (!user) {
    return (
      <LoginForm
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  return (
    <>
      {children(user)}
      {/* You can add a logout button or user menu here */}
    </>
  );
}
