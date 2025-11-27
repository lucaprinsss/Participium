/**
 * Storage configuration
 * Supports both local filesystem and Cloudflare R2 (S3-compatible)
 */

export const storageConfig = {
  /**
   * Storage provider: 'local' or 'r2'
   * - local: Files stored in uploads/ directory (development)
   * - r2: Files stored in Cloudflare R2 (production)
   */
  provider: process.env.STORAGE_PROVIDER || 'local',

  /**
   * Local storage configuration
   */
  local: {
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    reportsDir: 'reports',
  },

  /**
   * Cloudflare R2 configuration (S3-compatible)
   * Get credentials from: https://dash.cloudflare.com/
   */
  r2: {
    endpoint: process.env.R2_ENDPOINT || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET_NAME || 'participium-reports',
    region: 'auto', // R2 uses 'auto' as region
    publicUrl: process.env.R2_PUBLIC_URL || '', // Optional: for public CDN URL
  },
};

/**
 * Validates storage configuration
 * @throws Error if required config is missing
 */
export function validateStorageConfig(): void {
  if (storageConfig.provider === 'r2') {
    const { endpoint, accessKeyId, secretAccessKey, bucket } = storageConfig.r2;
    
    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        'Missing Cloudflare R2 configuration. Please set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME environment variables.'
      );
    }
  }
}
