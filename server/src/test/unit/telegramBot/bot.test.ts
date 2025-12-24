import { initBot, getBot } from '@telegramBot/bot';
import { Telegraf } from 'telegraf';

let mockBot: any;

// Mock Telegraf
jest.mock('telegraf', () => ({
  Telegraf: jest.fn(),
}));

// Mock telegraf/filters
jest.mock('telegraf/filters', () => ({
  message: jest.fn((type: string) => type),
}));

// Mock ReportHandler
jest.mock('@telegramBot/reportHandler', () => ({
  ReportHandler: jest.fn().mockImplementation(() => ({
    startReport: jest.fn(),
    linkAccount: jest.fn(),
    unlinkAccount: jest.fn(),
    handleLocation: jest.fn(),
    handlePhotos: jest.fn(),
    handleText: jest.fn(),
    handleCallbackQuery: jest.fn(),
    handleUnlinkConfirmation: jest.fn(),
  })),
}));

// Mock botConfig with default value
jest.mock('@telegramBot/botConfig', () => ({
  botConfig: {
    BOT_TOKEN: 'test-token',
  },
}));

describe('Telegram Bot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock bot instance
    mockBot = {
      start: jest.fn(),
      command: jest.fn(),
      on: jest.fn(),
      launch: jest.fn().mockResolvedValue(undefined),
    };
    
    (Telegraf as jest.MockedClass<typeof Telegraf>).mockImplementation(() => mockBot);
  });

  describe('initBot', () => {
    it('should not initialize bot when BOT_TOKEN is not set', () => {
      // Reset and mock botConfig without token
      jest.resetModules();
      jest.doMock('@telegramBot/botConfig', () => ({
        botConfig: {},
      }));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Re-import to get new module with mocked config
      const botModule = require('@telegramBot/bot');
      botModule.initBot();

      expect(consoleSpy).toHaveBeenCalledWith('TELEGRAM_BOT_TOKEN not set. Telegram bot will not be started.');

      consoleSpy.mockRestore();
    });

    it('should initialize bot with BOT_TOKEN', () => {
      initBot();

      expect(Telegraf).toHaveBeenCalledWith('test-token');
      expect(mockBot.start).toHaveBeenCalled();
      expect(mockBot.command).toHaveBeenCalledWith('help', expect.any(Function));
      expect(mockBot.command).toHaveBeenCalledWith('newreport', expect.any(Function));
      expect(mockBot.command).toHaveBeenCalledWith('link', expect.any(Function));
      expect(mockBot.command).toHaveBeenCalledWith('unlink', expect.any(Function));
      expect(mockBot.on).toHaveBeenCalledWith('location', expect.any(Function));
      expect(mockBot.on).toHaveBeenCalledWith('photo', expect.any(Function));
      expect(mockBot.on).toHaveBeenCalledWith('text', expect.any(Function));
      expect(mockBot.on).toHaveBeenCalledWith('callback_query', expect.any(Function));
      expect(mockBot.launch).toHaveBeenCalled();
    });

    it('should handle start command', () => {
      initBot();

      expect(mockBot.start).toHaveBeenCalledWith(expect.any(Function));
      
      // Get the start handler and test it
      const startCalls = mockBot.start.mock.calls;
      expect(startCalls.length).toBe(1);
      expect(typeof startCalls[0][0]).toBe('function');
      
      // Test the start handler
      const startHandler = startCalls[0][0];
      const mockCtx = { reply: jest.fn() };

      startHandler(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        '🏛 *Welcome to Participium!*\n\n' +
        'Thank you for joining the official channel to improve the city of Turin!\n\n' +
        'With this bot you can:\n' +
        '• Quickly report issues in the city\n' +
        '• Help make Turin a better place for everyone\n\n' +
        'Type /help to discover all available commands and how to get started.',
        { parse_mode: 'Markdown' }
      );
    });

    it('should handle callback_query with unlink confirmation', () => {
      initBot();

      const callbackHandler = mockBot.on.mock.calls.find((call: any) => call[0] === 'callback_query')[1];
      const mockCtx = {
        callbackQuery: { data: 'unlink_confirm' },
        answerCbQuery: jest.fn()
      };

      callbackHandler(mockCtx);

      expect(mockCtx.answerCbQuery).toHaveBeenCalled();
    });
    it('should handle location events', () => {
      initBot();

      const locationHandler = mockBot.on.mock.calls.find((call: any) => call[0] === 'location')[1];
      const mockCtx = {};

      locationHandler(mockCtx);

      // The handler delegates to reportHandler.handleLocation
      // This is tested in the ReportHandler tests
    });

    it('should handle photo events', () => {
      initBot();

      const photoHandler = mockBot.on.mock.calls.find((call: any) => call[0] === 'photo')[1];
      const mockCtx = {};

      photoHandler(mockCtx);

      // The handler delegates to reportHandler.handlePhotos
      // This is tested in the ReportHandler tests
    });

    it('should handle text events', () => {
      initBot();

      const textHandler = mockBot.on.mock.calls.find((call: any) => call[0] === 'text')[1];
      const mockCtx = {};

      textHandler(mockCtx);

      // The handler delegates to reportHandler.handleText
      // This is tested in the ReportHandler tests
    });
    it('should handle callback_query with regular callback', () => {
      initBot();

      const callbackHandler = mockBot.on.mock.calls.find((call: any) => call[0] === 'callback_query')[1];
      const mockCtx = {
        callbackQuery: { data: 'some_other_data' },
        answerCbQuery: jest.fn()
      };

      callbackHandler(mockCtx);

      expect(mockCtx.answerCbQuery).toHaveBeenCalled();
    });

    it('should handle help command', () => {
      initBot();

      const helpHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'help')[1];
      const mockCtx = { reply: jest.fn() };

      helpHandler(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        '🏛 *Participium Bot - Help*\n\n' +
        '*Available Commands:*\n\n' +
        '🔗 /link <code>\n' +
        'Link your Telegram account to Participium.\n' +
        'Generate the code from your profile on the website.\n\n' +
        '📝 /newreport\n' +
        'Create a new report about an issue in the city.\n' +
        'You will be guided through the process step by step.\n\n' +
        ' /unlink\n' +
        'Unlink your Telegram account from Participium.\n' +
        'You can link again anytime with /link\n\n' +
        '❓ /help\n' +
        'Display this help message.\n\n' +
        '━━━━━━━━━━━━━\n\n' +
        '*How to Report an Issue:*\n' +
        '1️⃣ Use /newreport command\n' +
        '2️⃣ Send the location or address\n' +
        '3️⃣ Provide a title and description\n' +
        '4️⃣ Select a category\n' +
        '5️⃣ Attach 1-3 photos\n' +
        '6️⃣ Choose privacy settings\n' +
        '7️⃣ Confirm and submit\n\n' +
        '💡 *Need more help?*\n' +
        'Visit our website or contact support.',
        { parse_mode: 'Markdown' }
      );
    });

    it('should handle newreport command', () => {
      initBot();

      const newreportHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'newreport')[1];
      const mockCtx = {};

      newreportHandler(mockCtx);

      // The handler delegates to reportHandler.startReport
      // This is tested in the ReportHandler tests
    });

    it('should handle link command', () => {
      initBot();

      const linkHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'link')[1];
      const mockCtx = {};

      linkHandler(mockCtx);

      // The handler delegates to reportHandler.linkAccount
      // This is tested in the ReportHandler tests
    });

    it('should handle unlink command', () => {
      initBot();

      const unlinkHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'unlink')[1];
      const mockCtx = {};

      unlinkHandler(mockCtx);

      // The handler delegates to reportHandler.unlinkAccount
      // This is tested in the ReportHandler tests
    });

    it('should handle bot launch error gracefully', async () => {
      jest.clearAllMocks();
      mockBot.launch = jest.fn().mockRejectedValue(new Error('Launch failed'));
      (Telegraf as jest.MockedClass<typeof Telegraf>).mockImplementation(() => mockBot);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      initBot();

      // Wait for the promise to reject
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith('Error starting Telegram bot:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle bot launch that resolves successfully', async () => {
      jest.clearAllMocks();
      mockBot.launch = jest.fn().mockResolvedValue(undefined);
      (Telegraf as jest.MockedClass<typeof Telegraf>).mockImplementation(() => mockBot);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      initBot();

      // Wait for the promise to resolve
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith('Telegram bot started successfully.');

      consoleSpy.mockRestore();
    });
  });

  describe('getBot', () => {
    it('should return the bot instance after initialization', () => {
      initBot();

      const bot = getBot();

      expect(bot).toBeTruthy();
    });

    it('should return null when bot is not initialized', () => {
      // Import a fresh module without initializing
      jest.resetModules();
      jest.doMock('@telegramBot/botConfig', () => ({
        botConfig: {},
      }));
      
      const botModule = require('@telegramBot/bot');
      const bot = botModule.getBot();

      expect(bot).toBeNull();
    });
  });
});