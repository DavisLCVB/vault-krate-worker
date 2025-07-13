import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { 
  FileMetadata, 
  SupabaseResponse, 
  DeletionResult, 
  DeletionResponse, 
  HealthResponse, 
  ErrorResponse 
} from './types';

const app = express();
const port = process.env.PORT || 8080;

// Configuraci�n de Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// URL del balancer
const balancerUrl = process.env.BALANCER_URL || '';

app.use(express.json());

// Endpoint de health check
app.get('/health', (_req: Request, res: Response<HealthResponse>) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint para eliminar archivos
app.post('/delete', async (_req: Request, res: Response<DeletionResponse | ErrorResponse>): Promise<void> => {
  try {
    console.log('Starting deletion process...');
    
    // Obtener archivos para eliminación
    const { data, error } = await supabase.rpc('get_files_for_deletion');
    
    if (error) {
      console.error('Error calling get_files_for_deletion:', error);
      res.status(500).json({ 
        error: 'Failed to get files for deletion', 
        details: error.message 
      } as ErrorResponse);
      return;
    }

    const supabaseResponse = data as SupabaseResponse<FileMetadata[]>;
    const filesToDelete: FileMetadata[] = supabaseResponse?.data || [];
    console.log(`Found ${filesToDelete.length} files for deletion`);

    if (filesToDelete.length === 0) {
      res.json({
        success: true,
        message: 'No files to delete',
        deletedFiles: [],
        errors: [],
        timestamp: new Date().toISOString()
      } as DeletionResponse);
      return;
    }

    // Procesar eliminación de archivos
    const deletionResults: DeletionResult[] = [];
    const errors: DeletionResult[] = [];

    for (const file of filesToDelete) {
      try {
        console.log(`Deleting file: ${file.file_id}`);
        
        // Hacer petición al balancer para eliminar el archivo
        const response = await fetch(`${balancerUrl}/delete?file_id=${file.file_id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result: unknown = await response.json();
          deletionResults.push({
            file_id: file.file_id,
            status: 'success',
            result
          });
          console.log(`Successfully deleted file: ${file.file_id}`);
        } else {
          const errorText = await response.text();
          errors.push({
            file_id: file.file_id,
            status: 'error',
            error: `HTTP ${response.status}: ${errorText}`
          });
          console.error(`Failed to delete file ${file.file_id}: ${response.status} ${errorText}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          file_id: file.file_id,
          status: 'error',
          error: errorMsg
        });
        console.error(`Error deleting file ${file.file_id}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Processed ${filesToDelete.length} files`,
      deletedFiles: deletionResults,
      errors: errors,
      timestamp: new Date().toISOString()
    } as DeletionResponse);
    
  } catch (error) {
    console.error('Unexpected error in deletion process:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    } as ErrorResponse);
  }
});

app.listen(port, () => {
  console.log(`Worker server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Delete files: http://localhost:${port}/delete`);
  console.log(`Balancer URL: ${balancerUrl || 'NOT SET'}`);
});

export default app;