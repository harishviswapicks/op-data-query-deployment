"use client";

import { useState, useRef, useEffect } from "react";
import { UserProfile, UIState, Message, BigQueryTable, ChartTemplate, ResearchJob } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Database, 
  BarChart3, 
  Calendar, 
  Microscope, 
  Zap, 
  Copy, 
  Check, 
  ArrowUp,
  Table,
  TrendingUp,
  Clock,
  Settings2
} from "lucide-react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import BigQueryInterface from "./BigQueryInterface";
import ChartRenderer from "./ChartRenderer";
import SchedulingPanel from "./SchedulingPanel";

interface AnalystTrackProps {
  userProfile: UserProfile;
  uiState: UIState;
  onUIStateChange: (state: UIState | ((prev: UIState) => UIState)) => void;
}

export default function AnalystTrack({ userProfile, uiState, onUIStateChange }: AnalystTrackProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<BigQueryTable | null>(null);
  const [showBigQueryInterface, setShowBigQueryInterface] = useState(false);
  const [showChartBuilder, setShowChartBuilder] = useState(false);
  const [activeResearchJobs, setActiveResearchJobs] = useState<ResearchJob[]>([]);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock BigQuery tables for demo
  const [bigQueryTables] = useState<BigQueryTable[]>([
    {
      id: "kpi_dashboard",
      name: "KPI Dashboard",
      description: "Executive KPIs including MAU, NGR, GGR",
      schema: [
        { name: "date", type: "DATE", nullable: false },
        { name: "mau", type: "INTEGER", nullable: false },
        { name: "ngr", type: "FLOAT", nullable: false },
        { name: "ggr", type: "FLOAT", nullable: false }
      ],
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
      rowCount: 1250000,
      dataFreshness: "hourly",
      queryComplexity: "simple",
      estimatedQueryTime: 2
    },
    {
      id: "nba_stats",
      name: "NBA Player Statistics",
      description: "Complete NBA player stats and analytics",
      schema: [
        { name: "player_id", type: "STRING", nullable: false },
        { name: "player_name", type: "STRING", nullable: false },
        { name: "points", type: "FLOAT", nullable: true },
        { name: "rebounds", type: "FLOAT", nullable: true },
        { name: "assists", type: "FLOAT", nullable: true }
      ],
      lastUpdated: new Date(Date.now() - 30 * 60 * 1000),
      rowCount: 850000,
      dataFreshness: "realtime",
      queryComplexity: "moderate",
      estimatedQueryTime: 5
    },
    {
      id: "deposits",
      name: "Deposit Analytics",
      description: "Deposit trends, volumes, and performance",
      schema: [
        { name: "deposit_id", type: "STRING", nullable: false },
        { name: "user_id", type: "STRING", nullable: false },
        { name: "amount", type: "FLOAT", nullable: false },
        { name: "timestamp", type: "TIMESTAMP", nullable: false }
      ],
      lastUpdated: new Date(Date.now() - 15 * 60 * 1000),
      rowCount: 2100000,
      dataFreshness: "realtime",
      queryComplexity: "complex",
      estimatedQueryTime: 8
    }
  ]);

  // Quick analysis presets
  const quickPresets = [
    { id: "daily_kpis", name: "Daily KPIs", query: "Show me today's key performance indicators", icon: TrendingUp },
    { id: "user_growth", name: "User Growth", query: "Analyze user growth trends this month", icon: BarChart3 },
    { id: "revenue_analysis", name: "Revenue Analysis", query: "Break down revenue by source", icon: Database },
    { id: "top_performers", name: "Top Performers", query: "Show top performing players this week", icon: TrendingUp }
  ];

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
          const newProgress = Math.min(job.progress + Math.random() * 10, 100);
          if (newProgress >= 100) {
            // Job completed
            const completedJob = { ...job, status: 'completed' as const, progress: 100, completedAt: new Date() };
            
            // Add completion message
            setTimeout(() => {
              const completionMessage: Message = {
                id: `completion_${Date.now()}`,
                content: `🎉 **Deep Research Complete!**\n\nYour analysis "${job.query}" has finished processing.\n\n**Key Findings:**\n- Comprehensive data analysis completed\n- 3 charts generated\n- 5 actionable insights identified\n- Confidence score: 94%\n\n*Results have been sent to your Slack channel.*`,
                sender: 'deep_agent',
                agentType: 'analyst',
                timestamp: new Date(),
                metadata: {
                  agentMode: 'deep',
                  processingTime: job.estimatedDuration * 1000,
                  dataSources: ['bigquery', 'analytics'],
                  confidence: 94,
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
      // Import API client dynamically to avoid SSR issues
      const { apiClient, checkBackendHealth, handleApiError } = await import('@/lib/api');
      
      // Check if backend is available
      const backendAvailable = await checkBackendHealth();
      
      if (backendAvailable) {
        // Use backend API
        console.log('Using backend API for chat');
        
        const response = await apiClient.sendMessage({
          message: currentInput,
          agent_mode: uiState.agentMode,
          user_id: userProfile.id,
          context: {
            dataSources: ['bigquery', 'analytics'],
            sessionId: `analyst_${Date.now()}`,
          }
        });
        
        const botMessage: Message = {
          id: response.message.id,
          content: response.message.content,
          sender: uiState.agentMode === 'deep' ? "deep_agent" : "quick_agent",
          agentType: "analyst",
          timestamp: new Date(response.message.timestamp),
          metadata: {
            agentMode: uiState.agentMode,
            processingTime: response.message.metadata?.processingTime || 0,
            dataSources: response.message.metadata?.dataSources || ['bigquery'],
            confidence: response.message.metadata?.confidence,
            researchJobId: response.message.metadata?.researchJobId,
            canUpgradeToDeep: response.message.metadata?.canUpgradeToDeep
          }
        };
        
        setMessages(prev => [...prev, botMessage]);
        
        // If deep research job was created, track it
        if (response.research_job_id) {
          console.log('Deep research job created:', response.research_job_id);
          // Create research job tracking
          const researchJob: ResearchJob = {
            id: response.research_job_id,
            query: currentInput,
            type: 'analyst',
            agentMode: 'deep',
            status: 'running',
            progress: 0,
            estimatedDuration: 300,
            createdAt: new Date(),
            userId: userProfile.id,
            priority: 'normal'
          };
          setActiveResearchJobs(prev => [...prev, researchJob]);
        }
        
      } else {
        // Fallback to simplified mock when backend is not available
        console.log('Backend not available, using simplified fallback');
        
        const fallbackResponse = `🚫 **Backend Connection Issue**
        
I'm unable to connect to the backend API to process your request: "${currentInput}"

**Please check:**
- Backend service is running
- Network connectivity
- API configuration

**For testing:** You can verify the backend at:
https://operational-data-querying-production.up.railway.app/health

*This is a fallback response when the backend is unavailable.*`;

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: fallbackResponse,
          sender: uiState.agentMode === 'deep' ? "deep_agent" : "quick_agent",
          agentType: "analyst",
          timestamp: new Date(),
          metadata: {
            agentMode: uiState.agentMode,
            processingTime: 0,
            dataSources: []
          }
        };
        
        setMessages(prev => [...prev, botMessage]);
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
      const { handleApiError } = await import('@/lib/api');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `❌ **API Error**\n\nSorry, I encountered an error while processing your message: ${handleApiError(error)}\n\n**Request:** "${currentInput}"\n\nPlease try again or check if the backend service is running.`,
        sender: uiState.agentMode === 'deep' ? "deep_agent" : "quick_agent",
        agentType: "analyst",
        timestamp: new Date(),
        metadata: {
          agentMode: uiState.agentMode,
          processingTime: 0,
          dataSources: []
        }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const generateQuickResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('kpi') || lowerQuery.includes('performance')) {
      return `📊 **Quick KPI Overview**\n\n**Today's Key Metrics:**\n- MAU: 2.4M (+3.2% vs yesterday)\n- NGR: $1.2M (+5.1%)\n- GGR: $890K (+2.8%)\n- Conversion Rate: 12.3% (+0.4%)\n\n**Quick Insights:**\n- Strong performance across all metrics\n- User engagement trending upward\n- Revenue growth accelerating\n\n*Want deeper analysis? Switch to Deep Research mode for comprehensive insights.*`;
    }
    
    if (lowerQuery.includes('user') || lowerQuery.includes('growth')) {
      return `👥 **User Growth Summary**\n\n**This Month:**\n- New Users: 45,230 (+12% vs last month)\n- Active Users: 2.4M (+8%)\n- Retention Rate: 78% (+2%)\n\n**Top Acquisition Channels:**\n1. Organic Search (35%)\n2. Social Media (28%)\n3. Referrals (22%)\n4. Paid Ads (15%)\n\n*For detailed cohort analysis and predictions, try Deep Research mode.*`;
    }
    
    if (lowerQuery.includes('revenue') || lowerQuery.includes('money')) {
      return `💰 **Revenue Breakdown**\n\n**This Week:**\n- Total Revenue: $8.4M\n- Average per User: $3.50\n- Top Revenue Source: Sports Betting (65%)\n\n**Trending:**\n- Mobile revenue up 15%\n- Premium features adoption +8%\n- International markets growing 22%\n\n*Switch to Deep Research for detailed financial modeling and forecasts.*`;
    }
    
    if (lowerQuery.includes('nba') || lowerQuery.includes('player') || lowerQuery.includes('sport')) {
      return `🏀 **NBA Quick Stats**\n\n**Top Performers This Week:**\n- Luka Dončić: 31.2 PPG, 8.1 RPG, 9.8 APG\n- Jayson Tatum: 28.7 PPG, 7.9 RPG, 4.6 APG\n- Giannis: 29.1 PPG, 11.2 RPG, 6.1 APG\n\n**Trending:**\n- 3-point shooting up 4% league-wide\n- Pace of play increasing\n- Defensive ratings improving\n\n*For advanced analytics and player comparisons, use Deep Research mode.*`;
    }
    
    return `🤖 **Quick Analysis**\n\nI've processed your query: "${query}"\n\n**Initial Findings:**\n- Data sources accessed: BigQuery tables\n- Processing time: <30 seconds\n- Confidence level: 85%\n\n**Summary:**\nBased on the available data, I can provide you with immediate insights. The current metrics show positive trends across key performance indicators.\n\n**Next Steps:**\n- For more detailed analysis, switch to Deep Research mode\n- Consider scheduling this as a recurring report\n- Export results to your preferred format\n\n*This is a quick response. For comprehensive analysis with charts and detailed insights, try Deep Research mode.*`;
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

  return (
    <div className="flex h-full bg-background">
      {/* Left Sidebar - BigQuery Tables & Tools */}
      <div className="w-80 bg-background/50 backdrop-blur-xl border-r border-border/10 flex flex-col">
        {/* Tools Header */}
        <div className="flex-shrink-0 p-4 border-b border-border/10">
          <h2 className="text-subheadline font-semibold text-foreground mb-3">Analyst Tools</h2>
          
          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button
              onClick={() => setShowBigQueryInterface(!showBigQueryInterface)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-footnote h-8"
            >
              <Database className="w-3 h-3" />
              Tables
            </Button>
            <Button
              onClick={() => setShowChartBuilder(!showChartBuilder)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-footnote h-8"
            >
              <BarChart3 className="w-3 h-3" />
              Charts
            </Button>
          </div>
        </div>

        {/* BigQuery Tables */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Quick Presets */}
            <div>
              <h3 className="text-footnote font-medium text-foreground mb-2">Quick Analysis</h3>
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
                        <IconComponent className="w-3 h-3 text-primary" />
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

            {/* Available Tables */}
            <div>
              <h3 className="text-footnote font-medium text-foreground mb-2">BigQuery Tables</h3>
              <div className="space-y-2">
                {bigQueryTables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTable(table)}
                    className={`w-full p-3 rounded-lg border text-left transition-all duration-200 hover:scale-105 ${
                      selectedTable?.id === table.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border/20 hover:border-primary/50 bg-muted/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-footnote font-medium text-foreground">
                        {table.name}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${
                        table.dataFreshness === 'realtime' ? 'bg-accent' :
                        table.dataFreshness === 'hourly' ? 'bg-primary' : 'bg-warning'
                      }`} />
                    </div>
                    <p className="text-caption-1 text-muted-foreground mb-2">
                      {table.description}
                    </p>
                    <div className="flex items-center justify-between text-caption-2 text-muted-foreground">
                      <span>{(table.rowCount / 1000000).toFixed(1)}M rows</span>
                      <span>~{table.estimatedQueryTime}s</span>
                    </div>
                  </button>
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
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-title-3 text-foreground font-semibold mb-2">
                    Welcome to Analyst Mode
                  </h3>
                  <p className="text-muted-foreground text-callout mb-6">
                    Ask questions about your data, create charts, or schedule reports
                  </p>
                  <div className="flex items-center justify-center gap-4 text-caption-1 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>Quick Mode: Fast responses</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Microscope className="w-3 h-3" />
                      <span>Deep Mode: Comprehensive analysis</span>
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
                              <span>Deep Analysis</span>
                            </button>
                          )}
                          <button
                            onClick={() => onUIStateChange(prev => ({ ...prev, showScheduleModal: true }))}
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
                      <Database className="w-4 h-4 text-primary" />
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
                  placeholder={uiState.agentMode === 'deep' ? "Deep research mode - comprehensive analysis..." : "Ask about your data..."}
                  className="w-full bg-muted/20 border-border/20 rounded-lg px-4 py-3 text-body placeholder:text-muted-foreground/60 focus:bg-muted/30 focus:border-primary/30 transition-all duration-200"
                  disabled={isLoading}
                />
              </div>
              
              <Button
                onClick={() => onUIStateChange(prev => ({ ...prev, showScheduleModal: true }))}
                variant="outline"
                className="rounded-lg px-3 py-3 hover:bg-muted/50 transition-all duration-200"
                size="lg"
                title="Schedule Analysis"
              >
                <Calendar className="w-4 h-4" />
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
