"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, LogIn } from "lucide-react";
import Image from "next/image";

interface LoginFormProps {
  onLogin: (email: string) => void;
  onRegister: (email: string) => void;
}

export default function LoginForm({ onLogin, onRegister }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

    try {
      // Try to login first
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (loginResponse.ok) {
        onLogin(email.trim());
      } else if (loginResponse.status === 404) {
        // User doesn't exist, redirect to registration
        onRegister(email.trim());
      } else {
        const data = await loginResponse.json();
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
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
