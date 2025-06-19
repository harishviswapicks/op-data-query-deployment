"use client";

import { useState, useRef, useEffect } from "react";
import { UserProfile, UIState, Message, SlackChannel, WatchdogRule, ResearchJob } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  MessageSquare, 
  FileText, 
  Bell, 
  Microscope, 
  Zap, 
  Copy, 
  Check, 
  ArrowUp,
  Search,
  BookOpen,
  Users,
  Settings2,
  Eye,
  AlertTriangle
} from "lucide-react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import NotionInterface from "./NotionInterface";
import SlackWatchdog from "./SlackWatchdog";
import PersonalAssistant from "./PersonalAssistant";

interface GeneralEmployeeTrackProps {
  userProfile: UserProfile;
  uiState: UIState;
  onUIStateChange: (state: UIState | ((prev: UIState) => UIState)) => void;
}

export default function GeneralEmployeeTrack({ userProfile, uiState, onUIStateChange }: GeneralEmployeeTrackProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showNotionInterface, setShowNotionInterface] = useState(false);
  const [showSlackWatchdog, setShowSlackWatchdog] = useState(false);
  const [activeResearchJobs, setActiveResearchJobs] = useState<ResearchJob[]>([]);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock Slack channels for demo
  const [slackChannels] = useState<SlackChannel[]>([
    {
      id: "general",
      name: "general",
      isPrivate: false,
      memberCount: 245,
      lastActivity: new Date(Date.now() - 30 * 60 * 1000),
      watchdogEnabled: true
    },
    {
      id: "engineering",
      name: "engineering",
      isPrivate: false,
      memberCount: 42,
      lastActivity: new Date(Date.now() - 15 * 60 * 1000),
      watchdogEnabled: true
    },
    {
      id: "product",
      name: "product",
      isPrivate: false,
      memberCount: 18,
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
      watchdogEnabled: false
    },
    {
      id: "support",
      name: "customer-support",
      isPrivate: false,
      memberCount: 12,
      lastActivity: new Date(Date.now() - 45 * 60 * 1000),
      watchdogEnabled: true
    }
  ]);

  // Quick action presets for general employees
  const quickPresets = [
    { id: "notion_search", name: "Search Docs", query: "Find documentation about user onboarding process", icon: Search },
    { id: "slack_summary", name: "Channel Summary", query: "Summarize what happened in #engineering today", icon: MessageSquare },
    { id: "policy_check", name: "Policy Check", query: "What's our policy on remote work?", icon: BookOpen },
    { id: "team_updates", name: "Team Updates", query: "Any important updates I missed this week?", icon: Users }
  ];

  // Mock watchdog alerts
  const [watchdogAlerts] = useState([
    {
      id: "1",
      channel: "#engineering",
      keyword: "deployment",
      message: "New deployment scheduled for tonight",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      priority: "medium" as const
    },
    {
      id: "2",
      channel: "#general",
      keyword: "meeting",
      message: "All-hands meeting moved to 3 PM",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      priority: "high" as const
    }
  ]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Simulate research job progress
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveResearchJobs(prev => prev.map(job => {
        if (job.status === 'running' && job.progress < 100) {
          const newProgress = Math.min(job.progress + Math.random() * 15, 100);
          if (newProgress >= 100) {
            // Job completed
            const completedJob = { ...job, status: 'completed' as const, progress: 100, completedAt: new Date() };
            
            // Add completion message
            setTimeout(() => {
              const completionMessage: Message = {
                id: `completion_${Date.now()}`,
                content: `🎉 **Deep Research Complete!**\n\nYour research on "${job.query}" has finished.\n\n**Key Findings:**\n- Comprehensive analysis across Notion and Slack\n- 12 relevant documents found\n- 8 important conversations identified\n- 3 actionable recommendations\n\n*Results have been sent to your Slack DM.*`,
                sender: 'deep_agent',
                agentType: 'general',
                timestamp: new Date(),
                metadata: {
                  agentMode: 'deep',
                  processingTime: job.estimatedDuration * 1000,
                  dataSources: ['notion', 'slack'],
                  confidence: 92,
                  researchJobId: job.id
                }
              };
              setMessages(prev => [...prev, completionMessage]);
            }, 1000);
            
            return completedJob;
          }
          return { ...job, progress: newProgress };
        }
        return job;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: "user",
      username: userProfile.email,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    try {
      // Simulate different response times based on agent mode
      const isDeepMode = uiState.agentMode === 'deep';
      const processingTime = isDeepMode ? Math.random() * 2000 + 1000 : Math.random() * 1000 + 500;

      if (isDeepMode) {
        // Create research job for deep mode
        const researchJob: ResearchJob = {
          id: `research_${Date.now()}`,
          query: currentInput,
          type: 'general',
          agentMode: 'deep',
          status: 'running',
          progress: 0,
          estimatedDuration: 180 + Math.random() * 240, // 3-7 minutes (faster than analyst)
          createdAt: new Date(),
          userId: userProfile.id,
          priority: 'normal'
        };

        setActiveResearchJobs(prev => [...prev, researchJob]);
        onUIStateChange(prev => ({
          ...prev,
          activeResearchJobs: [...prev.activeResearchJobs, researchJob]
        }));

        // Immediate acknowledgment for deep research
        const ackMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `🔍 **Deep Research Started**\n\nI'm conducting a thorough investigation of your query: "${currentInput}"\n\n**What I'm doing:**\n- Searching all Notion workspaces\n- Analyzing Slack conversations\n- Cross-referencing documentation\n- Identifying relevant team discussions\n\n**Estimated completion:** ${Math.ceil(researchJob.estimatedDuration / 60)} minutes\n\nI'll send you a DM when the research is complete. Feel free to continue working!`,
          sender: "deep_agent",
          agentType: "general",
          timestamp: new Date(),
          metadata: {
            agentMode: 'deep',
            processingTime: 1000,
            dataSources: ['notion', 'slack'],
            researchJobId: researchJob.id
          }
        };

        setTimeout(() => {
          setMessages(prev => [...prev, ackMessage]);
          setIsLoading(false);
        }, processingTime);
      } else {
        // Quick mode response
        setTimeout(() => {
          const quickResponse = generateQuickResponse(currentInput);
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: quickResponse,
            sender: "quick_agent",
            agentType: "general",
            timestamp: new Date(),
            metadata: {
              agentMode: 'quick',
              processingTime,
              dataSources: ['notion', 'slack'],
              confidence: 88,
              canUpgradeToDeep: true
            }
          };
          setMessages(prev => [...prev, botMessage]);
          setIsLoading(false);
        }, processingTime);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error processing your request. Please try again.`,
        sender: uiState.agentMode === 'deep' ? "deep_agent" : "quick_agent",
        agentType: "general",
        timestamp: new Date(),
        metadata: {
          agentMode: uiState.agentMode,
          processingTime: 0,
          dataSources: []
        }
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }

    inputRef.current?.focus();
  };

  const generateQuickResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('notion') || lowerQuery.includes('doc') || lowerQuery.includes('documentation')) {
      return `📚 **Quick Documentation Search**\n\n**Found in Notion:**\n- User Onboarding Guide (updated 2 days ago)\n- Remote Work Policy (v2.1)\n- Engineering Runbooks (15 pages)\n- Product Requirements (Q4 2024)\n\n**Quick Links:**\n- [Onboarding Checklist](notion://page/123)\n- [Team Directory](notion://page/456)\n- [FAQ Database](notion://page/789)\n\n*For comprehensive search across all workspaces, try Deep Research mode.*`;
    }
    
    if (lowerQuery.includes('slack') || lowerQuery.includes('channel') || lowerQuery.includes('conversation')) {
      return `💬 **Slack Channel Summary**\n\n**Recent Activity:**\n- #engineering: 23 messages (deployment discussion)\n- #general: 15 messages (meeting updates)\n- #product: 8 messages (feature planning)\n- #support: 12 messages (customer issues)\n\n**Key Mentions:**\n- Your name mentioned 3 times today\n- 2 action items assigned to you\n- 1 meeting invitation pending\n\n*Switch to Deep Research for detailed conversation analysis.*`;
    }
    
    if (lowerQuery.includes('policy') || lowerQuery.includes('rule') || lowerQuery.includes('guideline')) {
      return `📋 **Policy Quick Reference**\n\n**Common Policies:**\n- Remote Work: Flexible, 2 days in office/week\n- PTO: Unlimited with manager approval\n- Equipment: $2000 annual budget\n- Travel: Pre-approval required >$500\n\n**Recent Updates:**\n- Security policy updated (Dec 2024)\n- Expense policy clarified\n- New hiring guidelines\n\n*For detailed policy documents, use Deep Research mode.*`;
    }
    
    if (lowerQuery.includes('meeting') || lowerQuery.includes('calendar') || lowerQuery.includes('schedule')) {
      return `📅 **Meeting & Schedule Info**\n\n**Today's Meetings:**\n- 10:00 AM - Team Standup (30 min)\n- 2:00 PM - Product Review (60 min)\n- 4:00 PM - 1:1 with Manager (30 min)\n\n**This Week:**\n- All-hands meeting moved to Friday 3 PM\n- Engineering retrospective Thursday\n- Product planning session Wednesday\n\n*For comprehensive calendar analysis, try Deep Research.*`;
    }
    
    if (lowerQuery.includes('team') || lowerQuery.includes('colleague') || lowerQuery.includes('who')) {
      return `👥 **Team Directory**\n\n**Your Team:**\n- Sarah Chen (Engineering Manager)\n- Mike Rodriguez (Senior Developer)\n- Lisa Park (Product Designer)\n- Alex Kim (QA Engineer)\n\n**Contact Info:**\n- Slack: All active in #engineering\n- Email: team-eng@company.com\n- Office: Floor 3, West Wing\n\n*For detailed org chart and contact info, use Deep Research.*`;
    }
    
    return `🤖 **Quick Assistant Response**\n\nI've processed your query: "${query}"\n\n**Quick Findings:**\n- Searched recent Notion pages\n- Checked active Slack channels\n- Reviewed team communications\n- Found relevant documentation\n\n**Summary:**\nBased on available information, I can provide immediate assistance with your workplace question. The information appears to be readily available in our knowledge base.\n\n**Next Steps:**\n- Check the suggested resources above\n- For deeper analysis, switch to Deep Research mode\n- Set up watchdog alerts for ongoing monitoring\n\n*This is a quick response. For comprehensive research across all sources, try Deep Research mode.*`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleUpgradeToDeep = (originalQuery: string) => {
    // Switch to deep mode and reprocess the query
    onUIStateChange(prev => ({ ...prev, agentMode: 'deep' }));
    setInputValue(originalQuery);
    setTimeout(() => handleSendMessage(), 100);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Left Sidebar - Workplace Tools & Watchdog */}
      <div className="w-80 bg-background/50 backdrop-blur-xl border-r border-border/10 flex flex-col">
        {/* Tools Header */}
        <div className="flex-shrink-0 p-4 border-b border-border/10">
          <h2 className="text-subheadline font-semibold text-foreground mb-3">Workplace Assistant</h2>
          
          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button
              onClick={() => setShowNotionInterface(!showNotionInterface)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-footnote h-8"
            >
              <FileText className="w-3 h-3" />
              Notion
            </Button>
            <Button
              onClick={() => setShowSlackWatchdog(!showSlackWatchdog)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-footnote h-8"
            >
              <Eye className="w-3 h-3" />
              Watchdog
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Quick Presets */}
            <div>
              <h3 className="text-footnote font-medium text-foreground mb-2">Quick Actions</h3>
              <div className="space-y-2">
                {quickPresets.map((preset) => {
                  const IconComponent = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setInputValue(preset.query)}
                      className="w-full p-3 rounded-lg bg-muted/20 hover:bg-muted/40 border border-border/10 text-left transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <IconComponent className="w-3 h-3 text-accent" />
                        <span className="text-footnote font-medium text-foreground">
                          {preset.name}
                        </span>
                      </div>
                      <p className="text-caption-1 text-muted-foreground">
                        {preset.query}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Watchdog Alerts */}
            {watchdogAlerts.length > 0 && (
              <div>
                <h3 className="text-footnote font-medium text-foreground mb-2">Recent Alerts</h3>
                <div className="space-y-2">
                  {watchdogAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 rounded-lg bg-muted/20 border border-border/10"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="w-3 h-3 text-accent" />
                        <span className="text-footnote font-medium text-foreground">
                          {alert.channel}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${
                          alert.priority === 'high' ? 'bg-destructive' :
                          alert.priority === 'medium' ? 'bg-warning' : 'bg-muted-foreground'
                        }`} />
                      </div>
                      <p className="text-caption-1 text-muted-foreground mb-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center justify-between text-caption-2 text-muted-foreground">
                        <span>Keyword: {alert.keyword}</span>
                        <span>{formatTime(alert.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monitored Channels */}
            <div>
              <h3 className="text-footnote font-medium text-foreground mb-2">Monitored Channels</h3>
              <div className="space-y-2">
                {slackChannels.filter(ch => ch.watchdogEnabled).map((channel) => (
                  <div
                    key={channel.id}
                    className="p-3 rounded-lg bg-muted/10 border border-border/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-footnote font-medium text-foreground">
                        #{channel.name}
                      </span>
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                    </div>
                    <div className="flex items-center justify-between text-caption-2 text-muted-foreground">
                      <span>{channel.memberCount} members</span>
                      <span>{formatTime(channel.lastActivity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Research Jobs */}
            {activeResearchJobs.length > 0 && (
              <div>
                <h3 className="text-footnote font-medium text-foreground mb-2">Research Jobs</h3>
                <div className="space-y-2">
                  {activeResearchJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-3 rounded-lg bg-muted/20 border border-border/10"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Microscope className="w-3 h-3 text-accent" />
                        <span className="text-footnote font-medium text-foreground">
                          Deep Research
                        </span>
                        {job.status === 'running' && (
                          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                        )}
                      </div>
                      <p className="text-caption-1 text-muted-foreground mb-2 line-clamp-2">
                        {job.query}
                      </p>
                      {job.status === 'running' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-caption-2 text-muted-foreground">
                            <span>Progress</span>
                            <span>{Math.round(job.progress)}%</span>
                          </div>
                          <div className="w-full bg-muted/50 rounded-full h-1">
                            <div 
                              className="bg-accent h-1 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {job.status === 'completed' && (
                        <div className="flex items-center gap-1 text-accent">
                          <Check className="w-3 h-3" />
                          <span className="text-caption-1">Complete</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="h-full">
            <div className="px-8 py-8 space-y-8 max-w-4xl mx-auto">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-title-3 text-foreground font-semibold mb-2">
                    Welcome to General Employee Mode
                  </h3>
                  <p className="text-muted-foreground text-callout mb-6">
                    Ask questions about Notion docs, Slack channels, or workplace policies
                  </p>
                  <div className="flex items-center justify-center gap-4 text-caption-1 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>Quick Mode: Instant answers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Microscope className="w-3 h-3" />
                      <span>Deep Mode: Comprehensive research</span>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-6 ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.sender !== "user" && (
                    <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center flex-shrink-0 mt-1">
                      {message.sender === 'deep_agent' ? (
                        <Microscope className="w-4 h-4 text-accent" />
                      ) : (
                        <Zap className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] group transition-all duration-200 ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-lg px-4 py-3"
                        : "bg-muted/30 border border-border/10 text-foreground rounded-lg px-4 py-3 hover:bg-muted/40"
                    }`}
                  >
                    {message.sender !== "user" ? (
                      <>
                        <div className="text-body leading-relaxed prose prose-sm max-w-none prose-headings:text-card-foreground prose-p:text-card-foreground prose-strong:text-card-foreground prose-code:text-card-foreground prose-pre:bg-muted/50 prose-pre:text-card-foreground prose-blockquote:text-card-foreground prose-ul:text-card-foreground prose-ol:text-card-foreground prose-li:text-card-foreground prose-headings:font-semibold prose-headings:mb-3 prose-p:mb-3 prose-ul:mb-3 prose-ol:mb-3">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                        
                        {/* Agent Message Actions */}
                        <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          {message.metadata?.canUpgradeToDeep && (
                            <button
                              onClick={() => handleUpgradeToDeep(message.content)}
                              className="inline-flex items-center gap-1.5 px-2 py-1 text-caption-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-all duration-200"
                              title="Upgrade to Deep Research"
                            >
                              <ArrowUp className="w-3 h-3" />
                              <span>Deep Research</span>
                            </button>
                          )}
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
                    
                    <div className="flex items-center justify-between mt-3">
                      <p className={`text-caption-1 ${
                        message.sender === "user" 
                          ? "text-primary-foreground/60" 
                          : "text-muted-foreground/70"
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                      
                      {message.metadata && (
                        <div className="flex items-center gap-2">
                          {message.metadata.agentMode === 'deep' && (
                            <span className="text-caption-2 text-accent">Deep Research</span>
                          )}
                          {message.metadata.confidence && (
                            <span className="text-caption-2 text-muted-foreground">
                              {message.metadata.confidence}% confidence
                            </span>
                          )}
                          {message.metadata.processingTime && (
                            <span className="text-caption-2 text-muted-foreground">
                              {(message.metadata.processingTime / 1000).toFixed(1)}s
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {message.sender === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <MessageSquare className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-6 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center flex-shrink-0 mt-1">
                    {uiState.agentMode === 'deep' ? (
                      <Microscope className="w-4 h-4 text-accent" />
                    ) : (
                      <Zap className="w-4 h-4 text-primary" />
                    )}
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

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-border/10 bg-background/95 backdrop-blur-xl">
          <div className="px-6 py-4">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={uiState.agentMode === 'deep' ? "Deep research mode - comprehensive investigation..." : "Ask about Notion docs, Slack, or workplace questions..."}
                  className="w-full bg-muted/20 border-border/20 rounded-lg px-4 py-3 text-body placeholder:text-muted-foreground/60 focus:bg-muted/30 focus:border-primary/30 transition-all duration-200"
                  disabled={isLoading}
                />
              </div>
              
              <Button
                onClick={() => onUIStateChange(prev => ({ ...prev, showSlackWatchdog: true }))}
                variant="outline"
                className="rounded-lg px-3 py-3 hover:bg-muted/50 transition-all duration-200"
                size="lg"
                title="Configure Watchdog"
              >
                <Eye className="w-4 h-4" />
              </Button>

              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="rounded-lg px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
                size="lg"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Helper Text */}
            <div className="flex justify-center mt-3">
              <div className="flex items-center gap-4 text-caption-2 text-muted-foreground/50">
                <span>Press <kbd className="px-1 py-0.5 bg-muted/30 rounded">⏎</kbd> to send</span>
                <span>•</span>
                <span>
                  {uiState.agentMode === 'quick' ? 'Quick responses' : 'Deep research mode active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
