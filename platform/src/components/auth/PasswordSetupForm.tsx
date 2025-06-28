"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import { apiClient } from "@/lib/api";

interface PasswordSetupFormProps {
  email: string;
  onPasswordSet: () => void;
  onBack: () => void;
}

export default function PasswordSetupForm({ email, onPasswordSet, onBack }: PasswordSetupFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Password validation
  const validatePassword = (pwd: string) => {
    const minLength = pwd.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    
    return {
      minLength,
      hasLetter,
      hasNumber,
      isValid: minLength && hasLetter && hasNumber
    };
  };

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordValidation.isValid) {
      setError('Password does not meet requirements');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Use apiClient to set password (works for both new registration and existing users)
      await apiClient.setPassword(email, password);
      onPasswordSet();
    } catch (error: any) {
      console.error('Password setup error:', error);
      setError(error.message || 'Failed to set password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-xl border border-border/20">
        <CardHeader className="text-center pb-6 pt-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/prizepicks.svg"
              alt="PrizePicks Logo"
              width={80}
              height={80}
              className="rounded-xl"
            />
          </div>
          <CardTitle className="text-title-2 text-foreground font-semibold">
            Set Your Password
          </CardTitle>
          <p className="text-muted-foreground text-callout">
            Welcome {email}! Please create a password to secure your account.
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-footnote font-medium text-foreground">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-footnote font-medium text-foreground">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {password && (
              <div className="space-y-2">
                <p className="text-footnote font-medium text-foreground">Password Requirements:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {passwordValidation.minLength ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-caption-1 ${passwordValidation.minLength ? 'text-green-500' : 'text-red-500'}`}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.hasLetter ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-caption-1 ${passwordValidation.hasLetter ? 'text-green-500' : 'text-red-500'}`}>
                      At least one letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.hasNumber ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-caption-1 ${passwordValidation.hasNumber ? 'text-green-500' : 'text-red-500'}`}>
                      At least one number
                    </span>
                  </div>
                  {confirmPassword && (
                    <div className="flex items-center gap-2">
                      {passwordsMatch ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-caption-1 ${passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
                        Passwords match
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-500 text-footnote">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !passwordValidation.isValid || !passwordsMatch}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Setting Password...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Set Password
                  </div>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onBack}
                disabled={isLoading}
              >
                Back to Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
