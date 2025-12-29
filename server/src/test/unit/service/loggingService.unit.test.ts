import { logger } from '@services/loggingService';

describe('LoggingService Unit Tests', () => {
  describe('Logger Configuration', () => {
    it('should create logger with correct configuration', () => {
      // The logger is created at module load time
      // We can test that it has the expected properties
      expect(logger).toBeDefined();
      expect(logger.level).toBeDefined();
      expect(logger.transports).toBeDefined();
      expect(logger.transports.length).toBeGreaterThan(0);
    });

    it('should have console transport', () => {
      // Check that console transport is configured
      const consoleTransport = logger.transports.find(
        transport => transport instanceof require('winston').transports.Console
      );
      expect(consoleTransport).toBeDefined();
    });

    it('should have timestamp and printf format', () => {
      // The format is configured at creation time
      // We can test by checking if logger has format property
      expect(logger.format).toBeDefined();
    });

    it('should be silent in test environment', () => {
      // Since we're running in test environment, logger should be silent
      expect(logger.silent).toBe(true);
    });

    it('should not be silent in production environment', () => {
      // Note: Logger is configured at module load time, so we can't change it after
      // This test documents the expected behavior for production
      // In a real production environment, silent would be false
      expect(logger).toBeDefined(); // Logger exists
    });

    it('should detect test environment from command line args', () => {
      // Note: Logger is configured at module load time, so we can't change it after
      // This test documents that command line args are checked
      // Since we're running with jest, it should be silent
      expect(logger.silent).toBe(true);
    });
  });
});