"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, MessageCircle, Database, Bot, Calendar, BarChart3, Activity, CheckCircle, ArrowLeft, Settings, X } from "lucide-react";
import Image from "next/image";
import Chatbot from "./chatbot";
import { BackendStatus } from "./common/BackendStatus";

interface User {
  username: string;
  isAuthenticated: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

interface DataSource {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
}

interface Schedule {
  id: string;
  name: string;
  frequency: string;
  nextRun: Date;
  enabled: boolean;
}

export default function Platform() {
  const [user, setUser] = useState<User | null>(null);
  const [loginInput, setLoginInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'chat'>('chat');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsPosition, setSettingsPosition] = useState({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: "1",
      title: "NBA Player Analytics",
      lastMessage: "Show me LeBron James stats for this season",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: "2", 
      title: "Deposit Trends Analysis",
      lastMessage: "What are the deposit trends for Q4?",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    },
    {
      id: "3",
      title: "User Verification Metrics",
      lastMessage: "Show verification success rates by state",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
  ]);
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: "1",
      name: "Executive KPI Agent",
      enabled: true,
      description: "MAU, NGR, GGR & business KPIs"
    },
    {
      id: "2",
      name: "NBA Agent",
      enabled: true,
      description: "Complete NBA statistics and player analytics"
    },
    {
      id: "3",
      name: "Deposits Agent",
      enabled: true,
      description: "Deposit trends, volumes, and performance metrics"
    },
    {
      id: "4",
      name: "Base Prediction Set Agent",
      enabled: false,
      description: "User prediction accuracy and ranking insights"
    },
    {
      id: "5",
      name: "First Time Deposit Agent",
      enabled: true,
      description: "FTD conversion rates and acquisition metrics"
    },
    {
      id: "6",
      name: "State Level Agent",
      enabled: false,
      description: "Geographic performance and state-by-state analytics"
    },
    {
      id: "7",
      name: "Verification Agent",
      enabled: true,
      description: "User verification success rates and trends"
    },
    {
      id: "8",
      name: "Notion Agent",
      enabled: false,
      description: "Runbooks, documentation, and operational guides"
    },
  ]);
  const [schedules, setSchedules] = useState<Schedule[]>([
    {
      id: "1",
      name: "Daily KPI Report",
      frequency: "Daily at 9:00 AM",
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
      enabled: true,
    },
    {
      id: "2",
      name: "Weekly Deposit Analysis",
      frequency: "Weekly on Monday",
      nextRun: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      enabled: false,
    },
  ]);

  const handleLogin = async () => {
    if (!loginInput.trim() || isLoading) return;
    
    setIsLoading(true);
    
    // Simulate login process
    setTimeout(() => {
      const userData: User = {
        username: loginInput.trim(),
        isAuthenticated: true,
      };
      setUser(userData);
      setLoginInput("");
      setIsLoading(false);
    }, 500);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('dashboard');
  };

  const handleChatClick = () => {
    setCurrentView('chat');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleLoginKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  };

  // Show login screen if not authenticated
  if (!user?.isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        {/* Main login card */}
        <div className="w-full max-w-md">
          <Card className="bg-card/50 backdrop-blur-xl border border-border/20">
            <CardHeader className="text-center pb-6 pt-8">
              {/* Logo */}
              <div className="flex justify-center mb-8">
                <Image
                  src="/prizepicks.svg"
                  alt="PrizePicks Logo"
                  width={120}
                  height={120}
                  className="rounded-xl"
                />
              </div>
              
              {/* Welcome text */}
              <div className="space-y-3">
                <CardTitle className="text-title-2 text-foreground font-semibold">
                  Welcome Back
                </CardTitle>
                <p className="text-muted-foreground text-callout">
                  Sign in to access your AI-powered data analysis platform
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 pb-8">
              {/* Input field */}
              <div className="space-y-3">
                <label htmlFor="username" className="block text-footnote font-medium text-foreground">
                  Email Address
                </label>
                <Input
                  id="username"
                  type="email"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  onKeyPress={handleLoginKeyPress}
                  placeholder="Enter your email address"
                  className="w-full h-12 bg-muted/20 border-border/30 rounded-lg px-4 text-body placeholder:text-muted-foreground/60 focus:bg-muted/30 focus:border-primary/50 transition-all duration-200"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              
              {/* Sign in button */}
              <Button
                onClick={handleLogin}
                disabled={!loginInput.trim() || isLoading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium text-body transition-all duration-200"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    <span>Signing you in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
              
              {/* Demo notice */}
              <div className="text-center pt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-lg border border-border/20">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                  <p className="text-caption-1 text-muted-foreground">
                    Demo Mode • Enter any email to continue
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-caption-2 text-muted-foreground/60">
              © 2024 PrizePicks AI Platform
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show main platform interface if authenticated
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Platform Header - Fixed */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur-xl border-b border-border/10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Image
                src="/prizepicks.svg"
                alt="PrizePicks Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-title-3 text-foreground font-semibold">AI Data Platform</h1>
                <p className="text-footnote text-muted-foreground">
                  Comprehensive data analysis and insights
                </p>
              </div>
            </div>
            
            {/* User Section */}
            <div className="flex items-center gap-3">
              <BackendStatus />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-footnote font-medium text-foreground">{user.username}</span>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-footnote h-8 px-3"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Platform Content - Flexible */}
      <div className="flex flex-1 overflow-hidden">
        {/* Modern Left Sidebar */}
        <div className="w-72 bg-background/50 backdrop-blur-xl border-r border-border/10 flex flex-col">
          {/* Navigation Header - Fixed */}
          <div className="flex-shrink-0 p-4 border-b border-border/10">
            <div className="flex items-center justify-between">
              <h2 className="text-subheadline font-semibold text-foreground">Conversations</h2>
              <Button 
                onClick={handleChatClick}
                variant="ghost"
                size="sm"
                className="text-footnote h-7 px-2"
              >
                New
              </Button>
            </div>
          </div>

          {/* Recent Chat Sessions - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {chatSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={handleChatClick}
                  className="w-full group relative overflow-hidden rounded-lg hover:bg-muted/50 p-3 text-left transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium text-footnote truncate">{session.title}</p>
                      <p className="text-muted-foreground text-caption-1 truncate mt-0.5">{session.lastMessage}</p>
                      <p className="text-muted-foreground/60 text-caption-2 mt-1">
                        {session.timestamp.toLocaleDateString() === new Date().toLocaleDateString() 
                          ? session.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : session.timestamp.toLocaleDateString()
                        }
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area - Always Chat */}
        <div className="flex-1 overflow-hidden">
          <Chatbot user={user} />
        </div>
      </div>

      {/* Apple-inspired Floating Settings Button */}
      <button
        onClick={(e) => {
          if (!isDragging) {
            setShowSettings(true);
          }
        }}
        onMouseDown={(e) => {
          setIsDragging(false);
          const rect = e.currentTarget.getBoundingClientRect();
          setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });

          const handleMouseMove = (e: MouseEvent) => {
            setIsDragging(true);
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            
            // Keep button within viewport bounds
            const maxX = window.innerWidth - 56; // 56px = button width
            const maxY = window.innerHeight - 56; // 56px = button height
            
            setSettingsPosition({
              x: Math.max(16, Math.min(newX, maxX)),
              y: Math.max(16, Math.min(newY, maxY)),
            });
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            // Reset dragging state after a short delay to prevent click event
            setTimeout(() => setIsDragging(false), 100);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
        style={{
          left: `${settingsPosition.x}px`,
          top: `${settingsPosition.y}px`,
        }}
        className="fixed w-14 h-14 rounded-full shadow-apple-lg hover:shadow-apple-xl transition-all duration-300 flex items-center justify-center z-50 cursor-move bg-card/60 backdrop-blur-xl border border-border/20 hover:bg-card/80 hover:border-primary/30 hover:scale-105 active:scale-95"
      >
        <Settings className="w-6 h-6 text-foreground/70 hover:text-primary transition-colors duration-200" />
      </button>

      {/* Apple-inspired Settings Panel Overlay */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 scale-in">
          <div className="glass-heavy rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-apple-xl border border-border/30">
            {/* Settings Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/20">
              <div className="flex items-center gap-4">
                <Image
                  src="/demon.png"
                  alt="Settings"
                  width={40}
                  height={40}
                  className="rounded-full shadow-apple-sm"
                />
                <div>
                  <h2 className="text-title-2 text-foreground">Settings</h2>
                  <p className="text-footnote text-muted-foreground">Configure your AI agents and schedules</p>
                </div>
              </div>
              <Button
                onClick={() => setShowSettings(false)}
                variant="ghost"
                size="icon"
                className="hover-lift"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Settings Content */}
            <div className="p-6 space-y-8 overflow-y-auto max-h-[calc(80vh-120px)]">
              {/* Data Sources Section */}
              <div>
                <h3 className="text-title-3 text-foreground mb-4">Data Sources</h3>
                <div className="space-y-3">
                  {dataSources.map((source) => (
                    <div key={source.id} className="flex items-center justify-between p-4 glass rounded-xl border border-border/20 hover:bg-card/60 transition-all duration-200 hover-lift shadow-apple-sm">
                      <div className="flex-1">
                        <p className="text-foreground font-medium text-subheadline">{source.name}</p>
                        <p className="text-muted-foreground text-footnote mt-1">{source.description}</p>
                      </div>
                      <button
                        onClick={() => {
                          setDataSources(prev => prev.map(ds => 
                            ds.id === source.id ? { ...ds, enabled: !ds.enabled } : ds
                          ));
                        }}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 focus-ring-apple ${
                          source.enabled ? 'bg-primary shadow-apple-sm' : 'bg-secondary'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-apple-sm transition-transform duration-200 ${
                            source.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedules Section */}
              <div>
                <h3 className="text-title-3 text-foreground mb-4">Active Schedules</h3>
                {schedules.length > 0 ? (
                  <div className="space-y-3">
                    {schedules.map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between p-4 glass rounded-xl border border-border/20 hover:bg-card/60 transition-all duration-200 hover-lift shadow-apple-sm">
                        <div className="flex-1">
                          <p className="text-foreground font-medium text-subheadline">{schedule.name}</p>
                          <p className="text-muted-foreground text-footnote mt-1">{schedule.frequency}</p>
                          <p className="text-muted-foreground/70 text-caption-1 mt-1">
                            Next run: {schedule.nextRun.toLocaleDateString()} at {schedule.nextRun.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${schedule.enabled ? 'bg-accent' : 'bg-muted-foreground/50'}`}></span>
                          <button
                            onClick={() => {
                              setSchedules(prev => prev.map(s => 
                                s.id === schedule.id ? { ...s, enabled: !s.enabled } : s
                              ));
                            }}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 focus-ring-apple ${
                              schedule.enabled ? 'bg-accent shadow-apple-sm' : 'bg-secondary'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-apple-sm transition-transform duration-200 ${
                                schedule.enabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 glass rounded-xl text-center border border-border/20">
                    <p className="text-muted-foreground text-callout">No active schedules</p>
                    <p className="text-muted-foreground/70 text-footnote mt-1">Create schedules from chat conversations</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
