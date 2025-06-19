// Core user and role types
export interface UserProfile {
  id: string;
  email: string;
  role: 'analyst' | 'general_employee';
  preferences: UserPreferences;
  agentConfig: AgentConfiguration;
  createdAt: Date;
  lastActive: Date;
}

export interface UserPreferences {
  defaultAgentMode: 'quick' | 'deep';
  autoUpgradeToDeep: boolean;
  notificationChannels: string[];
  workingHours: {
    start: string;
    end: string;
    timezone: string;
  };
  favoriteDataSources: string[];
}

export interface AgentConfiguration {
  personality: 'professional' | 'friendly' | 'concise' | 'detailed';
  responseStyle: 'quick' | 'thorough' | 'balanced';
  creativityLevel: number; // 0-100 (user-friendly version of temperature)
  responseLength: 'brief' | 'standard' | 'comprehensive'; // user-friendly version of max_tokens
  customInstructions?: string;
}

// Agent system types
export interface AgentMode {
  type: 'quick' | 'deep';
  estimatedTime: string;
  capabilities: string[];
  limitations?: string[];
}

export interface QuickAgent {
  maxTurns: number; // 1-3 turns
  maxResponseTime: number; // <30 seconds
  dataSources: 'cached' | 'indexed' | 'realtime';
  complexity: 'simple' | 'moderate';
}

export interface DeepResearchAgent {
  estimatedDuration: number; // 5-10 minutes
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  dataSources: string[];
  analysisDepth: 'comprehensive' | 'expert';
}

// Track-specific types
export interface AnalystTrackConfig {
  bigQueryTables: BigQueryTable[];
  chartTemplates: ChartTemplate[];
  scheduledReports: ScheduledReport[];
  quickAnalysisPresets: AnalysisPreset[];
}

export interface GeneralEmployeeTrackConfig {
  notionWorkspaces: NotionWorkspace[];
  slackChannels: SlackChannel[];
  watchdogRules: WatchdogRule[];
  personalAssistantSettings: PersonalAssistantSettings;
}

// BigQuery and data types
export interface BigQueryTable {
  id: string;
  name: string;
  description: string;
  schema: TableSchema[];
  lastUpdated: Date;
  rowCount: number;
  dataFreshness: 'realtime' | 'hourly' | 'daily' | 'stale';
  queryComplexity: 'simple' | 'moderate' | 'complex';
  estimatedQueryTime: number;
}

export interface TableSchema {
  name: string;
  type: string;
  description?: string;
  nullable: boolean;
}

export interface ChartTemplate {
  id: string;
  name: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'table';
  config: ChartConfig;
  previewData?: any[];
  tags: string[];
}

export interface ChartConfig {
  title: string;
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
  filters?: FilterConfig[];
  aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min';
}

export interface FilterConfig {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: any;
}

// Scheduling types
export interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  frequency: ScheduleFrequency;
  nextRun: Date;
  enabled: boolean;
  recipients: NotificationRecipient[];
  template: ReportTemplate;
  conditions?: TriggerCondition[];
}

export interface ScheduleFrequency {
  type: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  interval?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone: string;
  cronExpression?: string;
}

export interface TriggerCondition {
  type: 'threshold' | 'change' | 'anomaly';
  field: string;
  operator: string;
  value: any;
  description: string;
}

export interface NotificationRecipient {
  type: 'slack_channel' | 'slack_dm' | 'email';
  address: string;
  name?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  sections: ReportSection[];
  format: 'markdown' | 'html' | 'pdf';
}

export interface ReportSection {
  type: 'text' | 'chart' | 'table' | 'metric';
  title: string;
  content: any;
  order: number;
}

// Notion integration types
export interface NotionWorkspace {
  id: string;
  name: string;
  databases: NotionDatabase[];
  pages: NotionPage[];
  lastSynced: Date;
  accessLevel: 'read' | 'write';
}

export interface NotionDatabase {
  id: string;
  name: string;
  properties: NotionProperty[];
  url: string;
}

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  lastModified: Date;
  tags: string[];
  content?: string;
}

export interface NotionProperty {
  name: string;
  type: string;
  options?: string[];
}

// Slack integration types
export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount: number;
  lastActivity: Date;
  watchdogEnabled: boolean;
}

export interface WatchdogRule {
  id: string;
  channelId: string;
  keywords: string[];
  alertConditions: AlertCondition[];
  isActive: boolean;
  personalizedRules: PersonalizationRule[];
  cooldownPeriod: number; // minutes
}

export interface AlertCondition {
  type: 'keyword_match' | 'mention' | 'thread_activity' | 'sentiment_change';
  threshold?: number;
  timeWindow?: number; // minutes
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface PersonalizationRule {
  type: 'user_specific' | 'topic_specific' | 'time_based';
  condition: string;
  action: 'notify' | 'summarize' | 'ignore';
  parameters: Record<string, any>;
}

export interface PersonalAssistantSettings {
  proactiveMode: boolean;
  contextAwareness: 'basic' | 'advanced';
  integrations: {
    calendar: boolean;
    tasks: boolean;
    email: boolean;
  };
  responsePersonality: AgentConfiguration;
}

// Research job types
export interface ResearchJob {
  id: string;
  query: string;
  type: 'analyst' | 'general';
  agentMode: 'quick' | 'deep';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  estimatedDuration: number;
  actualDuration?: number;
  results?: ResearchResults;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  userId: string;
  priority: 'low' | 'normal' | 'high';
}

export interface ResearchResults {
  summary: string;
  detailedAnalysis?: string;
  charts?: ChartData[];
  tables?: TableData[];
  insights: Insight[];
  recommendations?: Recommendation[];
  sources: DataSource[];
  confidence: number; // 0-100
}

export interface ChartData {
  id: string;
  type: string;
  title: string;
  data: any[];
  config: ChartConfig;
}

export interface TableData {
  id: string;
  title: string;
  headers: string[];
  rows: any[][];
  metadata?: Record<string, any>;
}

export interface Insight {
  type: 'trend' | 'anomaly' | 'correlation' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeline: string;
}

export interface DataSource {
  name: string;
  type: 'bigquery' | 'notion' | 'slack' | 'api' | 'file';
  lastUpdated: Date;
  reliability: number; // 0-100
}

// Analysis presets for quick mode
export interface AnalysisPreset {
  id: string;
  name: string;
  description: string;
  category: 'kpi' | 'trend' | 'comparison' | 'forecast';
  query: string;
  parameters: PresetParameter[];
  estimatedTime: number;
  tags: string[];
}

export interface PresetParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'select';
  required: boolean;
  defaultValue?: any;
  options?: string[];
  description?: string;
}

// Message and conversation types
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'quick_agent' | 'deep_agent';
  agentType?: 'analyst' | 'general';
  username?: string;
  timestamp: Date;
  metadata?: MessageMetadata;
  attachments?: MessageAttachment[];
}

export interface MessageMetadata {
  agentMode: 'quick' | 'deep';
  processingTime: number;
  dataSources: string[];
  confidence?: number;
  researchJobId?: string;
  canUpgradeToDeep?: boolean;
}

export interface MessageAttachment {
  type: 'chart' | 'table' | 'file' | 'link';
  title: string;
  data: any;
  url?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  userRole: 'analyst' | 'general_employee';
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
  agentMode: 'quick' | 'deep';
  activeResearchJobs: string[];
}

// UI state types
export interface UIState {
  currentTrack: 'analyst' | 'general_employee';
  agentMode: 'quick' | 'deep';
  selectedDataSources: string[];
  showSettings: boolean;
  showScheduleModal: boolean;
  showAgentConfig: boolean;
  activeResearchJobs: ResearchJob[];
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface ChatResponse {
  message: string;
  agentType: 'quick' | 'deep';
  processingTime: number;
  dataSources: string[];
  confidence?: number;
  researchJobId?: string;
  canUpgradeToDeep?: boolean;
  attachments?: MessageAttachment[];
}
