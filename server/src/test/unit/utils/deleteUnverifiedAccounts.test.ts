import cron from 'node-cron';
import { userRepository } from '../../../repositories/userRepository';

// Mock dependencies
jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

jest.mock('../../../repositories/userRepository', () => ({
  userRepository: {
    deleteUnverifiedUsers: jest.fn(),
    clearExpiredTelegramLinkCodes: jest.fn(),
  },
}));

describe('deleteUnverifiedAccounts cron job', () => {
  let scheduledTask: () => Promise<void>;

  beforeAll(() => {
    // Import the cron job setup after mocks are in place
    require('../../../utils/deleteUnverifiedAccounts');
    // The task is the function passed to cron.schedule
    scheduledTask = (cron.schedule as jest.Mock).mock.calls[0][1];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call deleteUnverifiedUsers and log completion', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Mock the repository methods to resolve successfully
    (userRepository.deleteUnverifiedUsers as jest.Mock).mockResolvedValue(undefined);
    (userRepository.clearExpiredTelegramLinkCodes as jest.Mock).mockResolvedValue(undefined);

    await scheduledTask();

    expect(console.log).toHaveBeenCalledWith('Running cleanup tasks...');
    expect(userRepository.deleteUnverifiedUsers).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith('Deleted unverified users.');
    expect(userRepository.clearExpiredTelegramLinkCodes).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith('Cleared expired Telegram link codes.');
    expect(console.log).toHaveBeenCalledWith('Cleanup completed.');
    
    consoleLogSpy.mockRestore();
  });

  it('should log an error if deleteUnverifiedUsers fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockError = new Error('Database error');
    
    // Mock the repository methods
    (userRepository.deleteUnverifiedUsers as jest.Mock).mockRejectedValue(mockError);
    (userRepository.clearExpiredTelegramLinkCodes as jest.Mock).mockResolvedValue(undefined);

    await scheduledTask();

    expect(userRepository.deleteUnverifiedUsers).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('Error during cleanup:', mockError);

    consoleErrorSpy.mockRestore();
  });
});
