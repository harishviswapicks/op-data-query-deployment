"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { UserProfile } from "@/types";
import LoginForm from "./LoginForm";
import UserProfileSetup from "../common/UserProfileSetup";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const [showSetup, setShowSetup] = useState(false);
  const [setupEmail, setSetupEmail] = useState("");

  const handleLogin = async (email: string) => {
    // Refresh the auth context to get the updated user
    window.location.reload();
  };

  const handleRegister = (email: string) => {
    setSetupEmail(email);
    setShowSetup(true);
  };

  const handleSetupComplete = async (profile: UserProfile) => {
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

  return <>{children}</>;
}
