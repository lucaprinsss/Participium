/**
 * Jest Global Teardown
 * Cleans up test artifacts after all tests complete
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Recursively delete a directory and all its contents
 */
function deleteDirectory(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`✓ Cleaned up test uploads: ${dirPath}`);
  }
}

/**
 * Global teardown function
 * Called once after all test suites have completed
 */
export default async function globalTeardown(): Promise<void> {
  // Clean up uploads directory created during tests
  const uploadsDir = path.join(process.cwd(), 'uploads');
  deleteDirectory(uploadsDir);
}
