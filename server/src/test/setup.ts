/**
 * Jest Global Setup
 * Carica le variabili d'ambiente di test PRIMA di qualsiasi import
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carica .env.test PRIMA di qualsiasi altra cosa
if (process.env.NODE_ENV === 'test' || process.argv.some(arg => arg.includes('test'))) {
  const envPath = path.resolve(__dirname, '../../.env.test');
  const result = dotenv.config({ path: envPath, override: true });
  
  if (result.error) {
    console.error('Error loading .env.test:', result.error);
  } else {
    console.log('✓ Test environment variables loaded from .env.test');
    console.log(`✓ Database: ${process.env.DB_NAME} at ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  }
}
