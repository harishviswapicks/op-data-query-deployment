"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, LogIn, Lock, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { apiClient } from "@/lib/api";

interface LoginFormProps {
  onLogin: (email: string, token: string) => void;
  onRegister: (email: string) => void;
  onPasswordSetup: (email: string) => void;
}

export default function LoginForm({ onLogin, onRegister, onPasswordSetup }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const testBackendConnection = async () => {
    try {
      console.log('🔍 Testing backend connection...');
      const response = await apiClient.healthCheck();
      console.log('✅ Backend health check successful:', response);
      setError(`✅ Backend connected: ${response.status}`);
    } catch (error: any) {
      console.error('❌ Backend health check failed:', error);
      setError(`❌ Backend connection failed: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError("");

    // Client-side email domain validation
    if (!email.toLowerCase().endsWith('@prizepicks.com')) {
      setError('Only @prizepicks.com email addresses are allowed');
      setIsLoading(false);
      return;
    }

    console.log('🔍 Authentication attempt:', { email: email.trim(), hasPassword: !!password, requiresPassword });

    try {
      if (requiresPassword) {
        // User has been prompted for password, attempt login
        if (!password.trim()) {
          setError('Password is required');
          setIsLoading(false);
          return;
        }
        
        console.log('🔑 Attempting login with password');
        const data = await apiClient.login(email.trim(), password);
        console.log('✅ Login successful:', data);
        onLogin(email.trim(), data.access_token);
      } else {
        // First attempt - check user status by trying to login with empty password
        try {
          console.log('🔍 Checking user status');
          const data = await apiClient.login(email.trim(), '');
          console.log('✅ User authenticated (no password required):', data);
          onLogin(email.trim(), data.access_token);
        } catch (error: any) {
          const errorMessage = error.message || '';
          console.log('❌ Initial login attempt failed:', { errorMessage });
          
          if (errorMessage.includes('User not found') || errorMessage.includes('404')) {
            console.log('👤 User not found, redirecting to registration');
            onRegister(email.trim());
          } else if (errorMessage.includes('Password not set')) {
            console.log('⚙️ Password not set, redirecting to password setup');
            onPasswordSetup(email.trim());
          } else if (errorMessage.includes('Incorrect password') || errorMessage.includes('Password required') || errorMessage.includes('password')) {
            console.log('🔐 Password required, showing password field');
            setRequiresPassword(true);
            setError('Please enter your password');
          } else {
            console.log('🚨 Unknown error:', error);
            throw error;
          }
        }
      }
    } catch (error: any) {
      console.error('🚨 Authentication error:', error);
      setError(error.message || 'Authentication failed. Please try again.');
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
            Welcome Back
          </CardTitle>
          <p className="text-muted-foreground text-callout">
            Sign in to your AI Data Platform
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-footnote font-medium text-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your @prizepicks.com email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {requiresPassword && (
              <div className="space-y-2">
                <label htmlFor="password" className="text-footnote font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-500 text-footnote">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Continue
                </div>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={testBackendConnection}
            >
              Test Backend Connection
            </Button>
          </form>

          <div className="text-center">
            <p className="text-caption-1 text-muted-foreground">
              New users will be guided through setup automatically
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
