export interface UploadUrlResult {
    available: boolean;
    uploadUrl?: string;
    path?: string;
    message?: string;
  }
  
  export interface SignedUrlResult {
    available: boolean;
    url?: string;
    message?: string;
  }
  
  export interface StorageAdapter {
    getUploadUrl(path: string, mimeType: string): Promise<UploadUrlResult>;
    getSignedUrl(path: string, expiresInSeconds: number): Promise<SignedUrlResult>;
    deleteObject(path: string): Promise<void>;
    uploadBuffer(path: string, buffer: Buffer, mimeType: string): Promise<void>;
  }

  export interface UploadUrlResult {
    available: boolean;
    uploadUrl?: string;
    path?: string;
    message?: string;
  }
  

  
