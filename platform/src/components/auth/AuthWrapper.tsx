"use client";

import { useState, useEffect } from "react";
import { UserProfile } from "@/types";
import LoginForm from "./LoginForm";
import PasswordSetupForm from "./PasswordSetupForm";
import UserProfileSetup from "../common/UserProfileSetup";

interface AuthWrapperProps {
  children: (user: UserProfile) => React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
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

  const handlePasswordSetup = (email: string) => {
    setSetupEmail(email);
    setShowPasswordSetup(true);
  };

  const handlePasswordSetupComplete = async () => {
    // Password was set successfully, refresh user data
    setShowPasswordSetup(false);
    await checkAuthStatus();
  };

  const handleBackToLogin = () => {
    setShowPasswordSetup(false);
    setShowSetup(false);
    setSetupEmail("");
  };

  const handleSetupComplete = (profile: UserProfile) => {
    // Check if this is a pending registration that needs password setup
    if ((profile as any).needsPasswordSetup) {
      setShowSetup(false);
      setSetupEmail(profile.email); // Make sure email is set for password setup
      setShowPasswordSetup(true);
      return;
    }
    
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

  if (showPasswordSetup) {
    return (
      <PasswordSetupForm
        email={setupEmail}
        onPasswordSet={handlePasswordSetupComplete}
        onBack={handleBackToLogin}
      />
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
        onPasswordSetup={handlePasswordSetup}
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
