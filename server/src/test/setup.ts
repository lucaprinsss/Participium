/**
 * Jest Global Setup
 * Loads environment variables from .env.test before running tests
 */
import * as dotenv from 'dotenv';
import * as path from 'node:path';

process.env.DOTENV_CONFIG_DEBUG = 'false';

// Load .env.test BEFORE anything else
if (process.env.NODE_ENV === 'test' || process.argv.some(arg => arg.includes('test'))) {
  const envPath = path.resolve(__dirname, '../../.env.test');
  const result = dotenv.config({ path: envPath, override: true, debug: false });
  
  if (result.error) {
    console.error('Error loading .env.test:', result.error);
  }
  // Removed success logs to keep the output clean
}
