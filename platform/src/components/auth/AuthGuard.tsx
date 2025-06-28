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
  // 🚨 TEMPORARY: Bypass authentication for development
  // TODO: Remove this bypass and restore proper authentication
  
  console.log("🔓 AUTH BYPASS ENABLED - Skipping authentication checks");
  
  // Return the main app directly without any auth checks
  return <>{children}</>;
  
  /* 
  // 🔒 COMMENTED OUT: Original authentication logic
  // Uncomment this section to restore authentication
  
  const { user, isLoading } = useAuth();
  const [showSetup, setShowSetup] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [setupEmail, setSetupEmail] = useState("");

  const handleLogin = async (email: string, token?: string) => {
    // Refresh the auth context to get the updated user
    window.location.reload();
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
    window.location.reload();
  };

  const handleBackToLogin = () => {
    setShowPasswordSetup(false);
    setShowSetup(false);
    setSetupEmail("");
  };

  const handleSetupComplete = async (profile: UserProfile) => {
    // Check if this is a pending registration that needs password setup
    if ((profile as any).needsPasswordSetup) {
      setShowSetup(false);
      setSetupEmail(profile.email); // Make sure email is set for password setup
      setShowPasswordSetup(true);
      return;
    }
    
    setShowSetup(false);
    // Refresh the auth context to get the new user
    window.location.reload();
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

  return <>{children}</>;
  */
}
