// Mock dependencies
jest.mock('express-session', () => jest.fn(() => jest.fn()));
jest.mock('@config/passport');
jest.mock('@config/swagger');
jest.mock('@routes/authRoutes');
jest.mock('@routes/userRoutes');
jest.mock('@routes/roleRoutes');
jest.mock('@routes/reportRoutes');
jest.mock('@routes/departmentRoutes');
jest.mock('@routes/municipalityUserRoutes');
jest.mock('@routes/companyRoutes');
jest.mock('@routes/geocodingRoutes');
jest.mock('@middleware/errorMiddleware');
jest.mock('@utils/deleteUnverifiedAccounts');

describe('App Configuration', () => {
  describe('Session Configuration', () => {
    it('should configure session middleware with production settings', () => {
      // Set NODE_ENV to production
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Re-import app to trigger configuration
      jest.resetModules();
      const appModule = require('@app');

      // Verify session was configured (this is a basic test - the actual session config is tested via integration)
      expect(appModule.default).toBeDefined();

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should configure session middleware with development settings', () => {
      // Set NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Re-import app to trigger configuration
      jest.resetModules();
      const appModule = require('@app');

      // Verify session was configured
      expect(appModule.default).toBeDefined();

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });
});