"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { UserProfile } from "@/types";
import LoginForm from "./LoginForm";
import PasswordSetupForm from "./PasswordSetupForm";
import UserProfileSetup from "../common/UserProfileSetup";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  // 🔒 AUTHENTICATION ENABLED
  const { user, isLoading, needsProfileSetup, pendingEmail, completeProfileSetup } = useAuth();
  const [showSetup, setShowSetup] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [setupEmail, setSetupEmail] = useState("");

  const handleLogin = async (email: string, token?: string) => {
    console.log('🎯 AuthGuard handleLogin called with token:', !!token);
    // Token should already be stored by apiClient, just refresh auth context
    await completeProfileSetup();
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
    await completeProfileSetup();
  };

  const handleBackToLogin = () => {
    setShowPasswordSetup(false);
    setShowSetup(false);
    setSetupEmail("");
  };

  const handleSetupComplete = async (profile: UserProfile) => {
    console.log('🎯 Profile setup completed, refreshing authentication');
    // Profile setup is complete, refresh the auth context
    await completeProfileSetup();
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

  if (needsProfileSetup && pendingEmail) {
    return (
      <UserProfileSetup
        email={pendingEmail}
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

  return <>{children}</>;
}
