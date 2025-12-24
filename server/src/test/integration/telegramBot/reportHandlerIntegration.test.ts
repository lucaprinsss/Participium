import { ReportHandler } from '@telegramBot/reportHandler';
import { Telegraf, Context } from 'telegraf';
import { userRepository } from '@repositories/userRepository';

// Mock all dependencies
jest.mock('telegraf');
jest.mock('@repositories/userRepository');
jest.mock('@services/reportService');
jest.mock('@telegramBot/reportWizard');

const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;

describe('ReportHandler Integration Tests', () => {
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
      answerCbQuery: jest.fn(),
    } as any;
  });

  describe('Complete report creation flow', () => {
    it('should handle successful account linking', async () => {
      // Setup
      mockCtx.message = { text: '/link 123456' };
      mockUserRepository.verifyAndLinkTelegram.mockResolvedValue({
        success: true,
        message: 'Account linked successfully'
      });

      // Execute
      await reportHandler.linkAccount(mockCtx);

      // Verify
      expect(mockUserRepository.verifyAndLinkTelegram).toHaveBeenCalledWith('testuser', '123456');
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('✅ *Account linked successfully*'),
        expect.any(Object)
      );
    });

    it('should handle account linking failure', async () => {
      // Setup
      mockCtx.message = { text: '/link 123456' };
      mockUserRepository.verifyAndLinkTelegram.mockRejectedValue(new Error('Invalid code'));

      // Execute
      await reportHandler.linkAccount(mockCtx);

      // Verify
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('❌ *Linking Failed*'),
        expect.any(Object)
      );
    });

    it('should handle unlink confirmation flow', async () => {
      // Setup
      mockCtx.callbackQuery = { data: 'unlink_confirm' };
      const mockUser = { id: 1 } as any;
      mockUserRepository.findUserByTelegramUsername.mockResolvedValue(mockUser);
      mockUserRepository.unlinkTelegramAccount.mockResolvedValue({
        success: true,
        message: 'Unlinked successfully'
      });

      // Execute
      await reportHandler.handleUnlinkConfirmation(mockCtx);

      // Verify
      expect(mockUserRepository.findUserByTelegramUsername).toHaveBeenCalledWith('testuser');
      expect(mockUserRepository.unlinkTelegramAccount).toHaveBeenCalledWith(1);
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('✅ *Account Unlinked*'),
        expect.any(Object)
      );
    });

    it('should handle unlink failure', async () => {
      // Setup
      mockCtx.callbackQuery = { data: 'unlink_confirm' };
      const mockUser = { id: 1 } as any;
      mockUserRepository.findUserByTelegramUsername.mockResolvedValue(mockUser);
      mockUserRepository.unlinkTelegramAccount.mockResolvedValue({
        success: false,
        message: 'Unlink failed'
      });

      // Execute
      await reportHandler.handleUnlinkConfirmation(mockCtx);

      // Verify
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('❌ *Unlink Failed*'),
        expect.any(Object)
      );
    });
  });

  describe('Error handling', () => {
    it('should handle missing username in various operations', async () => {
      mockCtx.from = {};

      await reportHandler.startReport(mockCtx);
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Username Required'),
        expect.any(Object)
      );

      await reportHandler.linkAccount(mockCtx);
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Username Required'),
        expect.any(Object)
      );

      await reportHandler.unlinkAccount(mockCtx);
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Username Required'),
        expect.any(Object)
      );

      await reportHandler.handleUnlinkConfirmation(mockCtx);
      expect(mockCtx.reply).toHaveBeenCalledWith('⚠️ Username required.');
    });

    it('should handle invalid link command format', async () => {
      mockCtx.message = { text: '/link' };

      await reportHandler.linkAccount(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('*Usage:* /link <code>'),
        expect.any(Object)
      );
    });

    it('should handle invalid verification code', async () => {
      mockCtx.message = { text: '/link 123' };

      await reportHandler.linkAccount(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('must be exactly 6 digits'),
        expect.any(Object)
      );
    });
  });
});