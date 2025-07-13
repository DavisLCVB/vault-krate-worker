export interface FileMetadata {
  file_id: string;
  mime_type: string;
  size: number;
  file_name: string;
  description: string | null;
  user_id: string | null;
  server_id: string;
  uploaded_at: string;
  download_count: number;
  last_access: string | null;
  delete_at: string | null;
  is_temporary: boolean;
}

export interface SupabaseResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DeletionResult {
  file_id: string;
  status: 'success' | 'error';
  result?: unknown;
  error?: string;
}

export interface DeletionResponse {
  success: boolean;
  message: string;
  deletedFiles: DeletionResult[];
  errors: DeletionResult[];
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
  details: string;
}