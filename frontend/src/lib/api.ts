import axios from 'axios';

// API configuration
const API_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Include cookies for session management
});

// Auth API configuration
const AUTH_API_URL = 'http://localhost:4000';

export const authApi = axios.create({
  baseURL: AUTH_API_URL,
  withCredentials: true, // Include cookies for session management
});

export interface UploadResponse {
  extracted_text: string;
  parsed_data?: string;
  candidate_id?: number;
}

export interface FileProcessingResult {
  filename: string;
  status: 'success' | 'error' | 'duplicate';
  candidate_id?: number;
  extracted_text?: string;
  parsed_data?: string;
  message?: string;
  existing_candidate_id?: number;
}

export interface BatchProcessingResponse {
  batch_id: string;
  total_files: number;
  successful: number;
  failed: number;
  duplicates: number;  results: FileProcessingResult[];
}

export type DuplicateHandling = 'strict' | 'allow_updates' | 'allow_all';

export interface Education {
  degree: string;
  institution: string;
  graduation_year: number | null;
  gpa: number | null;
}

export interface WorkExperience {
  company: string;
  position: string;
  start_date: string;
  end_date: string;
  duration: string;
  description: string | null;
}

export interface Candidate {
  candidate_id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  years_experience: number | null;
  status: string;
  created_at: string | null;
  resume_available: boolean;
  original_filename: string | null;
  skills: string[];
  education: Education[];
  work_experience: WorkExperience[];
}

export interface ParsedData {
  full_name: string;
  email?: string;
  phone?: string;
  location?: string;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  work_experience: Array<{
    company: string;
    position: string;
    duration: string;
  }>;
  skills: string[];
  years_experience?: number;
}

export interface CandidateScore {
  candidate_id: number;
  candidate_name: string;
  score: number;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
}

export interface ShortlistingResult {
  job_description: string;
  total_candidates: number;
  shortlisted_candidates: CandidateScore[];
  all_candidates: CandidateScore[];
  scoring_criteria: string;
}

// Authentication API response interfaces
export interface User {
  id: number;
  email: string;
  name: string;
  profilePicture?: string;
  lastLogin?: string;
}

export interface AuthResponse {
  authenticated: boolean;
  user: User | null;
}

export interface AuthError {
  error: string;
  message: string;
}

// Pagination interfaces
export interface PaginationInfo {
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface CandidatesResponse {
  candidates: Candidate[];
  pagination: PaginationInfo;
}

// Filter interface for candidate search
export interface CandidateFilters {
  page?: number;
  limit?: number;
  status?: string;
  minExperience?: number;
  maxExperience?: number;
  skills?: string[];
  location?: string;
  company?: string;
  position?: string;
  education?: string;
}

export interface ResumeValidationResult {
  is_resume: boolean;
  reasoning: string;
  missing_elements: string[];
}

// Chat interfaces
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    sources?: Array<{ type: string; count?: number }>;
    candidates_mentioned?: number[];
  };
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  user_id?: number;
}

export interface ChatResponse {
  response: string;
  session_id: string;
  sources: Array<{ type: string; count?: number }>;
  candidates_mentioned: number[];
}

export interface ChatHistory {
  session_id: string;
  messages: ChatMessage[];
  created_at: string;
  last_activity: string;
}

export interface ChatSession {
  session_id: string;
  created_at: string;
  last_activity: string;
  message_count: number;
}

export const resumeApi = {
  validateResumeContent: async (file: File): Promise<ResumeValidationResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<ResumeValidationResult>('/validate-resume-content/', formData);
    return response.data;
  },

  uploadResume: async (file: File, parse: boolean = true, saveToDb: boolean = true, duplicateHandling: DuplicateHandling = 'strict'): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('parse', String(parse));
    formData.append('save_to_db', String(saveToDb));
    formData.append('duplicate_handling', duplicateHandling);
    
    const response = await api.post<UploadResponse>('/upload-resume/', formData);
    return response.data;
  },
  uploadResumesBatch: async (files: File[], parse: boolean = true, saveToDb: boolean = true, duplicateHandling: DuplicateHandling = 'strict'): Promise<BatchProcessingResponse> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('parse', String(parse));
    formData.append('save_to_db', String(saveToDb));
    formData.append('duplicate_handling', duplicateHandling);
    
    const response = await api.post<BatchProcessingResponse>('/upload-resumes-batch/', formData);
    return response.data;
  },

  parseText: async (text: string): Promise<{ parsed_data: string }> => {
    const formData = new FormData();
    formData.append('text', text);
    const response = await api.post<{ parsed_data: string }>('/parse-text/', formData);
    return response.data;
  },
  getCandidates: async (filters: CandidateFilters = {}): Promise<CandidatesResponse> => {
    const params = new URLSearchParams();
    
    // Add pagination params
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    
    // Add basic filters
    if (filters.status) params.append('status', filters.status);
    
    // Add experience filters
    if (filters.minExperience !== undefined) params.append('min_experience', String(filters.minExperience));
    if (filters.maxExperience !== undefined) params.append('max_experience', String(filters.maxExperience));
    
    // Add text-based filters
    if (filters.location) params.append('location', filters.location);
    if (filters.company) params.append('company', filters.company);
    if (filters.position) params.append('position', filters.position);
    if (filters.education) params.append('education', filters.education);
    
    // Add skills filter (convert array to comma-separated string)
    if (filters.skills && filters.skills.length > 0) {
      params.append('skills', filters.skills.join(','));
    }
    
    const response = await api.get<CandidatesResponse>('/candidates/?' + params.toString());
    return response.data;
  },

  shortlistCandidate: async (candidateId: number): Promise<Candidate> => {
    const response = await api.post(`/candidates/${candidateId}/shortlist`);
    return response.data;
  },

  updateCandidateStatus: async (candidateId: number, status: string): Promise<Candidate> => {
    const formData = new FormData();
    formData.append('status', status);
    const response = await api.patch(`/candidates/${candidateId}/status`, formData);
    return response.data;
  },

  viewResume: async (candidateId: number): Promise<{
    resume_url: string;
    filename: string;
    file_type?: string;
  }> => {
    const response = await api.get(`/resumes/${candidateId}/view`);
    return response.data;
  },

  initDb: async (): Promise<{ message: string }> => {
    const response = await api.post('/init-db');
    return response.data;
  },

  shortlistByDescription: async (
    jobDescription: string, 
    minScore: number = 70, 
    limit?: number
  ): Promise<ShortlistingResult> => {
    const formData = new FormData();
    formData.append('job_description', jobDescription);
    formData.append('min_score', String(minScore));
    if (limit) formData.append('limit', String(limit));
    
    const response = await api.post<ShortlistingResult>('/shortlist-by-description/', formData);
    return response.data;
  },

  shortlistByFile: async (
    file: File, 
    minScore: number = 70, 
    limit?: number
  ): Promise<ShortlistingResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('min_score', String(minScore));
    if (limit) formData.append('limit', String(limit));
    
    const response = await api.post<ShortlistingResult>('/shortlist-by-file/', formData);
    return response.data;
  },

  getShortlistingHistory: async (): Promise<{ message: string }> => {
    const response = await api.get('/shortlisting-history/');
    return response.data;
  },
};

// Authentication API functions
export const authApiClient = {
  // Check authentication status
  checkAuthStatus: async (): Promise<AuthResponse> => {
    const response = await authApi.get<AuthResponse>('/auth/status');
    return response.data;
  },

  // Get current user profile
  getUserProfile: async (): Promise<{ success: boolean; user: User }> => {
    const response = await authApi.get('/auth/profile');
    return response.data;
  },

  // Logout user
  logout: async (): Promise<{ success: boolean; message: string }> => {
    const response = await authApi.post('/auth/logout');
    return response.data;
  },

  // Get Google OAuth login URL
  getGoogleLoginUrl: (): string => {
    return `${AUTH_API_URL}/auth/google`;
  },

  // Health check for auth service
  healthCheck: async (): Promise<{ status: string; authenticated: boolean }> => {
    const response = await authApi.get('/health');
    return response.data;
  }
};

// Chat API
export const chatApi = {
  // Start a new chat session
  startSession: async (): Promise<{ session_id: string; message: string }> => {
    const response = await api.post('/chat/start');
    return response.data;
  },

  // Send a message to the chatbot
  sendMessage: async (chatRequest: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post('/chat/message', chatRequest);
    return response.data;
  },

  // Get chat history for a session
  getHistory: async (sessionId: string): Promise<ChatHistory> => {
    const response = await api.get(`/chat/history/${sessionId}`);
    return response.data;
  },

  // Get all chat sessions for the user
  getSessions: async (): Promise<ChatSession[]> => {
    const response = await api.get('/chat/sessions');
    return response.data;
  }
};
