// API client for connecting frontend to FastAPI backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://operational-data-querying-production.up.railway.app';

export interface ApiError {
  detail: string;
  status: number;
}

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    // Check for existing token in localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('🌐 API Request:', { url, method: options.method || 'GET', baseUrl: this.baseUrl });
    
    // Add timeout for production reliability
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      signal: controller.signal,
    };

    try {
      console.log('📤 Sending request:', { url, config: { ...config, body: config.body ? JSON.parse(config.body as string) : undefined } });
      const response = await fetch(url, config);
      
      clearTimeout(timeoutId); // Clear timeout on successful response
      
      console.log('📥 Response received:', { status: response.status, statusText: response.statusText, ok: response.ok });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ Error response data:', errorData);
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('✅ Success response data:', responseData);
      return responseData;
    } catch (error: any) {
      clearTimeout(timeoutId); // Clear timeout on error
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        console.error(`⏰ API request timeout: ${endpoint}`);
        throw new Error('Request timeout - please check your internet connection');
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        console.error(`🌐 Network error: ${endpoint}`, error);
        throw new Error('Network error - please check if the backend service is running');
      }
      
      console.error(`🚨 API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<{ access_token: string; token_type: string; user: any }> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async setPassword(email: string, password: string): Promise<{ message: string }> {
    return this.request('/api/auth/set-password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async completeProfile(email: string, role: string, preferences: any, agentConfig: any): Promise<{ message: string }> {
    return this.request('/api/auth/complete-profile', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        role, 
        preferences, 
        agent_config: agentConfig 
      }),
    });
  }

  async validateToken(): Promise<{ access_token: string; token_type: string; user: any }> {
    return this.request('/api/auth/validate', {
      method: 'POST',
    });
  }

  async refreshToken(): Promise<{ access_token: string; token_type: string; user: any }> {
    return this.request('/api/auth/refresh', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<any> {
    return this.request('/api/auth/me');
  }

  async getUserProfile(): Promise<{ user: any }> {
    return this.request('/api/user/profile');
  }

  // Chat endpoints
  async sendMessage(data: {
    message: string;
    agent_mode: 'quick' | 'deep';
    user_id: string;
    context?: Record<string, any>;
  }): Promise<{
    message: {
      id: string;
      content: string;
      sender: string;
      timestamp: string;
      metadata?: Record<string, any>;
    };
    research_job_id?: string;
  }> {
    return this.request('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getChatHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Array<{
    id: string;
    content: string;
    sender: string;
    username?: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>> {
    return this.request(`/api/chat/history/${userId}?limit=${limit}&offset=${offset}`);
  }

  async clearChatHistory(userId: string): Promise<void> {
    return this.request(`/api/chat/history/${userId}`, {
      method: 'DELETE',
    });
  }

  async upgradeToDeepResearch(data: {
    message: string;
    user_id: string;
  }): Promise<any> {
    return this.request('/api/chat/upgrade-to-deep', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Test chat endpoint (unauthenticated)
  async testChat(message: string, agentMode: 'quick' | 'deep' = 'quick'): Promise<any> {
    return this.request(`/api/chat/test?message=${encodeURIComponent(message)}&agent_mode=${agentMode}`, {
      method: 'POST',
    });
  }

  // BigQuery endpoints
  async getTables(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    schema: Array<{
      name: string;
      type: string;
      nullable: boolean;
      description?: string;
    }>;
    last_updated: string;
    row_count: number;
    data_freshness: string;
    query_complexity: string;
    estimated_query_time: number;
  }>> {
    return this.request('/api/bigquery/tables');
  }

  async executeQuery(data: {
    sql: string;
    table_id?: string;
    user_id: string;
  }): Promise<{
    query_id: string;
    results: Array<Record<string, any>>;
    columns: string[];
    row_count: number;
    execution_time: number;
  }> {
    return this.request('/api/bigquery/query', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Research endpoints
  async createResearchJob(data: {
    query: string;
    agent_mode: 'quick' | 'deep';
    user_id: string;
    priority?: 'low' | 'normal' | 'high';
  }): Promise<{
    id: string;
    query: string;
    type: string;
    agent_mode: string;
    status: string;
    progress: number;
    estimated_duration: number;
    created_at: string;
    user_id: string;
    priority: string;
  }> {
    return this.request('/api/research/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getResearchJob(jobId: string): Promise<{
    id: string;
    query: string;
    type: string;
    agent_mode: string;
    status: string;
    progress: number;
    estimated_duration: number;
    created_at: string;
    completed_at?: string;
    user_id: string;
    priority: string;
    results?: Record<string, any>;
  }> {
    return this.request(`/api/research/jobs/${jobId}`);
  }

  async getUserResearchJobs(userId: string): Promise<Array<{
    id: string;
    query: string;
    type: string;
    agent_mode: string;
    status: string;
    progress: number;
    estimated_duration: number;
    created_at: string;
    completed_at?: string;
    user_id: string;
    priority: string;
    results?: Record<string, any>;
  }>> {
    return this.request(`/api/research/jobs/user/${userId}`);
  }

  // Analytics endpoints
  async getQuickPresets(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    query: string;
    category: string;
    estimated_time: number;
  }>> {
    return this.request('/api/analytics/presets');
  }

  async runAnalytics(data: {
    preset_id: string;
    user_id: string;
    parameters?: Record<string, any>;
  }): Promise<{
    preset_id: string;
    results: Record<string, any>;
    charts?: Array<Record<string, any>>;
    insights: string[];
    execution_time: number;
  }> {
    return this.request('/api/analytics/run', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Charts endpoints
  async createChart(data: {
    config: {
      type: string;
      title: string;
      x_axis: string;
      y_axis: string;
      data_source: string;
      filters?: Record<string, any>;
      styling?: Record<string, any>;
    };
    user_id: string;
  }): Promise<{
    chart_id: string;
    config: Record<string, any>;
    data: Array<Record<string, any>>;
    image_url?: string;
  }> {
    return this.request('/api/charts/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Scheduling endpoints
  async createScheduledReport(data: {
    name: string;
    description: string;
    query: string;
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string;
      timezone: string;
      enabled?: boolean;
    };
    user_id: string;
  }): Promise<{
    id: string;
    name: string;
    description: string;
    query: string;
    schedule: Record<string, any>;
    user_id: string;
    created_at: string;
    last_run?: string;
    next_run: string;
  }> {
    return this.request('/api/scheduling/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserScheduledReports(userId: string): Promise<Array<{
    id: string;
    name: string;
    description: string;
    query: string;
    schedule: Record<string, any>;
    user_id: string;
    created_at: string;
    last_run?: string;
    next_run: string;
  }>> {
    return this.request(`/api/scheduling/reports/user/${userId}`);
  }

  async updateScheduledReport(
    reportId: string,
    data: Partial<{
      name: string;
      description: string;
      query: string;
      schedule: {
        frequency: 'daily' | 'weekly' | 'monthly';
        time: string;
        timezone: string;
        enabled?: boolean;
      };
    }>
  ): Promise<any> {
    return this.request(`/api/scheduling/reports/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteScheduledReport(reportId: string): Promise<void> {
    return this.request(`/api/scheduling/reports/${reportId}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; service: string }> {
    return this.request('/health');
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Helper function to handle API errors
export function handleApiError(error: any): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

// Helper function to check if backend is available
export async function checkBackendHealth(): Promise<boolean> {
  try {
    await apiClient.healthCheck();
    return true;
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return false;
  }
}
