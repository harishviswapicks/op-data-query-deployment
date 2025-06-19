"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, RefreshCw, Copy, Check, Calendar, Microscope, Clock, Zap, Database, FileText, HardDrive, BarChart3, Settings2 } from "lucide-react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  username?: string; // For user messages, store the username
  timestamp: Date;
}

interface Session {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}

interface ChatbotProps {
  user?: {
    username: string;
    isAuthenticated: boolean;
  };
}

// Mock session data
const mockSessions: Session[] = [];

export default function Chatbot({ user: propUser }: ChatbotProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [loginInput, setLoginInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [deepResearch, setDeepResearch] = useState(false);
  const [isRefreshingSessions, setIsRefreshingSessions] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isDeepResearch, setIsDeepResearch] = useState(false);
  const [researchProgress, setResearchProgress] = useState(0);
  const [researchTimeLeft, setResearchTimeLeft] = useState(0);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleMessageId, setScheduleMessageId] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState([
    { id: 'bigquery', name: 'BigQuery', icon: Database, enabled: true, color: 'bg-blue-500' },
    { id: 'notion', name: 'Notion', icon: FileText, enabled: false, color: 'bg-gray-500' },
    { id: 'drive', name: 'Drive', icon: HardDrive, enabled: true, color: 'bg-green-500' },
    { id: 'analytics', name: 'Analytics', icon: BarChart3, enabled: true, color: 'bg-purple-500' },
  ]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'r':
            e.preventDefault();
            setIsDeepResearch(!isDeepResearch);
            break;
          case 's':
            e.preventDefault();
            setShowScheduleModal(true);
            break;
          case 'k':
            e.preventDefault();
            // Focus on first data source toggle or input
            inputRef.current?.focus();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDeepResearch]);

  // Deep research simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDeepResearch) {
      setResearchProgress(0);
      setResearchTimeLeft(300); // 5 minutes
      
      interval = setInterval(() => {
        setResearchProgress(prev => {
          if (prev >= 100) {
            setIsDeepResearch(false);
            return 0;
          }
          return prev + 1;
        });
        
        setResearchTimeLeft(prev => {
          if (prev <= 0) {
            setIsDeepResearch(false);
            return 0;
          }
          return prev - 3; // 3 seconds per tick for 5 minute duration
        });
      }, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDeepResearch]);

  // Initialize component with user data if provided, or generate session ID
  useEffect(() => {
    const generateSessionId = () => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      return `session_${timestamp}_${random}`;
    };
    
    setSessionId(generateSessionId());

    // If user is provided via props, auto-login
    if (propUser?.isAuthenticated && propUser?.username) {
      setUsername(propUser.username);
      setIsLoggedIn(true);
      loadUserSessions(propUser.username);
    }
  }, [propUser]);

  // Handle session switching
  const handleSessionClick = (session: Session) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setSessionId(session.id);
  };

  // Create new session
  const createNewSession = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const newSession: Session = {
      id: newSessionId,
      title: "New Conversation",
      lastMessage: "",
      timestamp: new Date(),
      messages: []
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    setMessages(newSession.messages);
    setSessionId(newSessionId);
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Refresh sessions manually
  const handleRefreshSessions = async () => {
    if (!username || isRefreshingSessions) return;
    
    setIsRefreshingSessions(true);
    await loadUserSessions(username);
    setIsRefreshingSessions(false);
  };

  // Simplified - just create a new session for router agent
  const loadUserSessions = async (username: string) => {
    createNewSession();
  };

  const handleLogin = async () => {
    if (loginInput.trim()) {
      const user = loginInput.trim();
      setUsername(user);
      setIsLoggedIn(true);
      setLoginInput("");
      
      // Load user sessions after login
      await loadUserSessions(user);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
  };

  const handleLoginKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !isLoggedIn) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: "user",
      username: username,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Import API client dynamically to avoid SSR issues
      const { apiClient, checkBackendHealth, handleApiError } = await import('@/lib/api');
      
      // Check if backend is available
      const backendAvailable = await checkBackendHealth();
      
      if (backendAvailable) {
        // Use backend API
        console.log('Using backend API for chat');
        
        const response = await apiClient.sendMessage({
          message: userMessage.content,
          agent_mode: isDeepResearch ? 'deep' : 'quick',
          user_id: username, // Using username as user_id for now
          context: {
            dataSources: dataSources.filter(ds => ds.enabled).map(ds => ds.id),
            sessionId: sessionId,
          }
        });
        
        const botMessage: Message = {
          id: response.message.id,
          content: response.message.content,
          sender: "bot",
          timestamp: new Date(response.message.timestamp),
        };
        
        setMessages(prev => [...prev, botMessage]);
        
        // If deep research job was created, track it
        if (response.research_job_id) {
          console.log('Deep research job created:', response.research_job_id);
          // TODO: Add research job tracking
        }
        
      } else {
        // Fallback to mock response when backend is not available
        console.log('Backend not available, using mock response');
        
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        const mockResponse = `I understand you're asking about: "${userMessage.content}". 

${isDeepResearch ? 
  `🔬 **Deep Research Mode Active**
  
  I'm conducting a comprehensive analysis of your query. This includes:
  - Analyzing data from ${dataSources.filter(ds => ds.enabled).map(ds => ds.name).join(', ')}
  - Cross-referencing multiple data sources
  - Generating detailed insights and recommendations
  
  *Note: Backend API is not available. This is a mock response for demonstration.*` :
  `⚡ **Quick Response**
  
  Based on your query, here are some initial insights:
  - This appears to be related to data analysis
  - I would typically access ${dataSources.filter(ds => ds.enabled).map(ds => ds.name).join(', ')} for this type of question
  - For more detailed analysis, consider switching to Deep Research mode
  
  *Note: Backend API is not available. This is a mock response for demonstration.*`
}

Would you like me to elaborate on any specific aspect of this analysis?`;

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: mockResponse,
          sender: "bot",
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, botMessage]);
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
      const { handleApiError } = await import('@/lib/api');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error while processing your message: ${handleApiError(error)}. Please try again.`,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Copy message to clipboard
  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  // Show login screen if not logged in
  if (!isLoggedIn) {
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
                />
              </div>
              
              {/* Sign in button */}
              <Button
                onClick={handleLogin}
                disabled={!loginInput.trim()}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium text-body transition-all duration-200"
                size="lg"
              >
                Sign In
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

  // Show Apple-inspired chatbot interface if logged in
  return (
    <div className="flex h-full bg-background fade-in flex-col overflow-hidden">
      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="px-8 py-8 space-y-8 max-w-3xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-6 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender === "bot" && (
                  <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center flex-shrink-0 mt-1">
                    <Image
                      src="/demon.png"
                      alt="AI"
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] group transition-all duration-200 ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-lg px-4 py-3"
                      : "bg-muted/30 border border-border/10 text-foreground rounded-lg px-4 py-3 hover:bg-muted/40"
                  }`}
                >
                  {message.sender === "bot" ? (
                    <>
                      <div className="text-body leading-relaxed prose prose-sm max-w-none prose-headings:text-card-foreground prose-p:text-card-foreground prose-strong:text-card-foreground prose-code:text-card-foreground prose-pre:bg-muted/50 prose-pre:text-card-foreground prose-blockquote:text-card-foreground prose-ul:text-card-foreground prose-ol:text-card-foreground prose-li:text-card-foreground prose-headings:font-semibold prose-headings:mb-3 prose-p:mb-3 prose-ul:mb-3 prose-ol:mb-3">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                      
                      {/* Bot Message Actions */}
                      <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button
                          onClick={() => {
                            setScheduleMessageId(message.id);
                            setShowScheduleModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-2 py-1 text-caption-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-all duration-200"
                          title="Schedule this analysis"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Schedule</span>
                        </button>
                        <button
                          onClick={() => handleCopyMessage(message.id, message.content)}
                          className="inline-flex items-center gap-1.5 px-2 py-1 text-caption-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-all duration-200"
                          title="Copy response"
                        >
                          {copiedMessageId === message.id ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-body leading-relaxed flex-1">{message.content}</p>
                      <button
                        onClick={() => handleCopyMessage(message.id, message.content)}
                        className="opacity-0 group-hover:opacity-70 hover:opacity-100 transition-all duration-200 p-1.5 hover:bg-primary-foreground/10 rounded-full"
                        title="Copy message"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="w-3.5 h-3.5 text-primary-foreground/80" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-primary-foreground/80" />
                        )}
                      </button>
                    </div>
                  )}
                  <p className={`text-caption-1 mt-3 ${
                    message.sender === "user" 
                      ? "text-primary-foreground/60" 
                      : "text-muted-foreground/70"
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>

                {message.sender === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-6 justify-start">
                <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center flex-shrink-0 mt-1">
                  <Image
                    src="/demon.png"
                    alt="AI"
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                </div>
                <div className="bg-muted/30 border border-border/10 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Fixed Input Area */}
      <div className="flex-shrink-0 border-t border-border/10 bg-background/95 backdrop-blur-xl">
        <div className="px-6 py-4 space-y-4">
          {/* Data Source Toggle Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 flex-wrap">
              {dataSources.map((source) => {
                const IconComponent = source.icon;
                return (
                  <button
                    key={source.id}
                    onClick={() => {
                      setDataSources(prev => prev.map(ds => 
                        ds.id === source.id ? { ...ds, enabled: !ds.enabled } : ds
                      ));
                    }}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-caption-1 font-medium transition-all duration-200 hover:scale-105 ${
                      source.enabled 
                        ? `${source.color} text-white shadow-sm` 
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted/70'
                    }`}
                  >
                    <IconComponent className="w-3 h-3" />
                    <span>{source.name}</span>
                  </button>
                );
              })}
              <button className="inline-flex items-center gap-1 px-2 py-1.5 rounded-full text-caption-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-200">
                <Settings2 className="w-3 h-3" />
                <span>More</span>
              </button>
            </div>
          </div>

          {/* Deep Research Progress Bar */}
          {isDeepResearch && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-muted/30 rounded-lg p-3 border border-border/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Microscope className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-footnote font-medium text-foreground">Deep Research Active</p>
                      <p className="text-caption-1 text-muted-foreground">
                        {Math.floor(researchTimeLeft / 60)}:{(researchTimeLeft % 60).toString().padStart(2, '0')} left
                      </p>
                    </div>
                    <div className="w-full bg-muted/50 rounded-full h-1.5">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${researchProgress}%` }}
                      />
                    </div>
                    <p className="text-caption-2 text-muted-foreground mt-1">
                      Analyzing data sources and generating comprehensive insights...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input Field */}
          <div className="flex gap-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isDeepResearch ? "Deep research mode active..." : "Ask me anything..."}
                className="w-full bg-muted/20 border-border/20 rounded-lg px-4 py-3 text-body placeholder:text-muted-foreground/60 focus:bg-muted/30 focus:border-primary/30 transition-all duration-200"
                disabled={isLoading}
              />
            </div>
            
            {/* Deep Research Toggle */}
            <Button
              onClick={() => setIsDeepResearch(!isDeepResearch)}
              variant={isDeepResearch ? "default" : "outline"}
              className={`rounded-lg px-3 py-3 transition-all duration-200 ${
                isDeepResearch 
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                  : 'hover:bg-muted/50'
              }`}
              size="lg"
              title="Toggle Deep Research Mode"
            >
              <Microscope className="w-4 h-4" />
            </Button>

            {/* Schedule Button */}
            <Button
              onClick={() => setShowScheduleModal(true)}
              variant="outline"
              className="rounded-lg px-3 py-3 hover:bg-muted/50 transition-all duration-200"
              size="lg"
              title="Schedule Analysis"
            >
              <Calendar className="w-4 h-4" />
            </Button>

            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="rounded-lg px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
              size="lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Helper Text with Keyboard Shortcuts */}
          <div className="flex justify-center mt-3">
            <div className="flex items-center gap-4 text-caption-2 text-muted-foreground/50">
              <span>Press <kbd className="px-1 py-0.5 bg-muted/30 rounded">⏎</kbd> to send</span>
              <span>•</span>
              <span><kbd className="px-1 py-0.5 bg-muted/30 rounded">⌘R</kbd> for deep research</span>
              <span>•</span>
              <span><kbd className="px-1 py-0.5 bg-muted/30 rounded">⌘S</kbd> to schedule</span>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-card/95 backdrop-blur-xl rounded-2xl w-full max-w-md border border-border/20 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-title-3 text-foreground font-semibold">Schedule Analysis</h3>
                  <p className="text-caption-1 text-muted-foreground">Set up automated daily reports</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleMessageId(null);
                }}
                variant="ghost"
                size="icon"
                className="hover:bg-muted/50"
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Schedule Name */}
              <div className="space-y-2">
                <label className="text-footnote font-medium text-foreground">Report Name</label>
                <Input
                  placeholder="Daily KPI Analysis"
                  className="w-full bg-muted/20 border-border/30 rounded-lg"
                />
              </div>

              {/* Time Selection */}
              <div className="space-y-2">
                <label className="text-footnote font-medium text-foreground">Delivery Time</label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="time"
                    defaultValue="09:00"
                    className="bg-muted/20 border-border/30 rounded-lg"
                  />
                  <select className="bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-body">
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
              </div>

              {/* Slack Channel */}
              <div className="space-y-2">
                <label className="text-footnote font-medium text-foreground">Slack Channel</label>
                <select className="w-full bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-body">
                  <option>#data-insights</option>
                  <option>#executive-reports</option>
                  <option>#analytics</option>
                  <option>#general</option>
                </select>
              </div>

              {/* Data Sources */}
              <div className="space-y-2">
                <label className="text-footnote font-medium text-foreground">Include Data Sources</label>
                <div className="flex flex-wrap gap-2">
                  {dataSources.filter(ds => ds.enabled).map((source) => {
                    const IconComponent = source.icon;
                    return (
                      <div
                        key={source.id}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-caption-1 ${source.color} text-white`}
                      >
                        <IconComponent className="w-3 h-3" />
                        <span>{source.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-border/20">
              <Button
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleMessageId(null);
                }}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Here you would typically save the schedule
                  setShowScheduleModal(false);
                  setScheduleMessageId(null);
                  // Show success message or update UI
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Schedule Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
