/**
 * Jest Global Setup
 * Loads environment variables from .env.test before running tests
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

// Silenzia completamente i log di dotenv
process.env.DOTENV_CONFIG_DEBUG = 'false';

// Load .env.test BEFORE anything else
if (process.env.NODE_ENV === 'test' || process.argv.some(arg => arg.includes('test'))) {
  const envPath = path.resolve(__dirname, '../../.env.test');
  const result = dotenv.config({ path: envPath, override: true, debug: false });
  
  if (result.error) {
    console.error('Error loading .env.test:', result.error);
  }
  // Rimossi i log di successo per mantenere l'output pulito
}
