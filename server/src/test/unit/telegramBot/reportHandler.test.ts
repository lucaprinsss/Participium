// Create mock userSessions
const mockUserSessions = new Map<number, any>();

// Mock the module
jest.mock('@telegramBot/reportHandler', () => {
  const actual = jest.requireActual('@telegramBot/reportHandler');
  actual.userSessions = mockUserSessions;
  return actual;
});

import { ReportHandler } from '@telegramBot/reportHandler';
import { Telegraf } from 'telegraf';
import { userRepository } from '@repositories/userRepository';
import { WizardStep } from '@telegramBot/types';

// Mock dependencies
jest.mock('telegraf');
jest.mock('@repositories/userRepository');
jest.mock('@telegramBot/reportWizard');

const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;

// Mock ReportWizard
const mockReportWizard = {
  handleLocation: jest.fn(),
  handleText: jest.fn(),
  handleCallbackQuery: jest.fn(),
  handlePhotos: jest.fn(),
};

jest.mock('@telegramBot/reportWizard', () => ({
  ReportWizard: jest.fn().mockImplementation(() => mockReportWizard),
}));

describe('ReportHandler', () => {
  let mockBot: Telegraf;
  let reportHandler: ReportHandler;
  let mockCtx: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBot = new Telegraf('test-token');
    reportHandler = new ReportHandler(mockBot);
    mockCtx = {
      chat: { id: 123 },
      from: { username: 'testuser' },
      reply: jest.fn(),
    } as any;
  });

  describe('startReport', () => {
    it('should reply with username required when no username', async () => {
      mockCtx.from = {};

      await reportHandler.startReport(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Username Required'),
        expect.any(Object)
      );
    });

    it('should reply with access denied when user not found', async () => {
      mockUserRepository.findUserByTelegramUsername.mockResolvedValue(null);

      await reportHandler.startReport(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Access Denied'),
        expect.any(Object)
      );
    });

    it('should start report wizard when user exists', async () => {
      const mockUser = { id: 1, username: 'testuser' } as any;
      mockUserRepository.findUserByTelegramUsername.mockResolvedValue(mockUser);

      await reportHandler.startReport(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Report Location'),
        expect.any(Object)
      );
    });
  });

  describe('linkAccount', () => {
    it('should reply with username required when no username', async () => {
      mockCtx.from = {};

      await reportHandler.linkAccount(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Username Required'),
        expect.any(Object)
      );
    });

    it('should reply with usage instructions when no code provided', async () => {
      mockCtx.message = { text: '/link' };

      await reportHandler.linkAccount(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Link Your Account'),
        expect.any(Object)
      );
    });

    it('should reply with invalid code when code is not 6 digits', async () => {
      mockCtx.message = { text: '/link 123' };

      await reportHandler.linkAccount(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Invalid Code'),
        expect.any(Object)
      );
    });

    it('should successfully link account with valid code', async () => {
      mockCtx.message = { text: '/link 123456' };
      mockUserRepository.verifyAndLinkTelegram.mockResolvedValue({
        success: true,
        message: 'Account linked successfully'
      });

      await reportHandler.linkAccount(mockCtx);

      expect(mockUserRepository.verifyAndLinkTelegram).toHaveBeenCalledWith('testuser', '123456');
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Account linked successfully'),
        expect.any(Object)
      );
    });

    it('should handle linking failure', async () => {
      mockCtx.message = { text: '/link 123456' };
      mockUserRepository.verifyAndLinkTelegram.mockRejectedValue(new Error('Invalid code'));

      await reportHandler.linkAccount(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Linking Failed'),
        expect.any(Object)
      );
    });
  });

  describe('unlinkAccount', () => {
    it('should reply with username required when no username', async () => {
      mockCtx.from = {};

      await reportHandler.unlinkAccount(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Username Required'),
        expect.any(Object)
      );
    });

    it('should reply with account not linked when user not found', async () => {
      mockUserRepository.findUserByTelegramUsername.mockResolvedValue(null);

      await reportHandler.unlinkAccount(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Account Not Linked'),
        expect.any(Object)
      );
    });

    it('should show confirmation dialog when user exists', async () => {
      const mockUser = { id: 1, username: 'testuser' } as any;
      mockUserRepository.findUserByTelegramUsername.mockResolvedValue(mockUser);

      await reportHandler.unlinkAccount(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Unlink Account'),
        expect.objectContaining({
          reply_markup: expect.any(Object)
        })
      );
    });

    it('should handle error when finding user fails', async () => {
      mockUserRepository.findUserByTelegramUsername.mockRejectedValue(new Error('Database error'));

      await reportHandler.unlinkAccount(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Unlink Failed'),
        expect.any(Object)
      );
    });
  });

  describe('handleUnlinkConfirmation', () => {
    it('should reply with username required when no username', async () => {
      mockCtx.from = {};
      mockCtx.callbackQuery = { data: 'unlink_confirm' };

      await reportHandler.handleUnlinkConfirmation(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith('⚠️ Username required.');
    });

    it('should successfully unlink account on confirm', async () => {
      const mockUser = { id: 1 } as any;
      mockCtx.callbackQuery = { data: 'unlink_confirm' };
      mockUserRepository.findUserByTelegramUsername.mockResolvedValue(mockUser);
      mockUserRepository.unlinkTelegramAccount.mockResolvedValue({
        success: true,
        message: 'Unlinked successfully'
      });

      await reportHandler.handleUnlinkConfirmation(mockCtx);

      expect(mockUserRepository.unlinkTelegramAccount).toHaveBeenCalledWith(1);
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Account Unlinked'),
        expect.any(Object)
      );
    });

    it('should handle error when unlinking account fails', async () => {
      const mockUser = { id: 1 } as any;
      mockCtx.callbackQuery = { data: 'unlink_confirm' };
      mockUserRepository.findUserByTelegramUsername.mockResolvedValue(mockUser);
      mockUserRepository.unlinkTelegramAccount.mockRejectedValue(new Error('Unlink failed'));

      await reportHandler.handleUnlinkConfirmation(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith('❌ Failed to unlink account. Please try again later.');
    });

    it('should cancel unlink on cancel', async () => {
      mockCtx.callbackQuery = { data: 'unlink_cancel' };

      await reportHandler.handleUnlinkConfirmation(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Cancelled'),
        expect.any(Object)
      );
    });
  });

  describe('handleLocation', () => {
    it('should do nothing when no session exists', async () => {
      await reportHandler.handleLocation(mockCtx);

      // Should not throw or do anything
    });
  });

  describe('handleText', () => {
    it('should do nothing when no session exists', async () => {
      mockCtx.message = { text: 'test' };

      await reportHandler.handleText(mockCtx);

      // Should not throw or do anything
    });
  });

  describe('handleCallbackQuery', () => {
    it('should do nothing when no session exists', () => {
      mockCtx.callbackQuery = { data: 'test' };

      reportHandler.handleCallbackQuery(mockCtx);

      // Should not throw or do anything
    });
  });

  describe('handlePhotos', () => {
    it('should do nothing when no session exists', async () => {
      mockCtx.message = { photo: [] };

      await reportHandler.handlePhotos(mockCtx);

      expect(reportHandler.wizard.handlePhotos).not.toHaveBeenCalled();
    });

    it('should do nothing when session step is not WAITING_PHOTOS', async () => {
      const mockSession = { step: 'OTHER_STEP' };
      mockUserSessions.set(123, mockSession);
      mockCtx.message = { photo: [] };

      await reportHandler.handlePhotos(mockCtx);

      expect(reportHandler.wizard.handlePhotos).not.toHaveBeenCalled();
    });
  });
});