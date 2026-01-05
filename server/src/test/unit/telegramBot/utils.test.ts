import { downloadPhoto, bufferToDataUri } from '@telegramBot/utils';
import { Telegraf } from 'telegraf';

// Mock Telegraf
jest.mock('telegraf', () => ({
  Telegraf: jest.fn().mockImplementation(() => ({
    telegram: {
      getFileLink: jest.fn(),
    },
  })),
}));

// Mock fetch
globalThis.fetch = jest.fn();

describe('Telegram Bot Utils', () => {
  let mockBot: Telegraf;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBot = new Telegraf('test-token');
  });

  describe('downloadPhoto', () => {
    it('should download photo and return buffer', async () => {
      const fileId = 'test-file-id';
      const mockFileLink = { href: 'https://api.telegram.org/file/test' };
      const mockResponse = {
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      };

      (mockBot.telegram.getFileLink as jest.Mock).mockResolvedValue(mockFileLink);
      (globalThis.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await downloadPhoto(mockBot, fileId);

      expect(mockBot.telegram.getFileLink).toHaveBeenCalledWith(fileId);
      expect(globalThis.fetch).toHaveBeenCalledWith('https://api.telegram.org/file/test');
      expect(mockResponse.arrayBuffer).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle fetch errors', async () => {
      const fileId = 'test-file-id';
      const mockFileLink = { href: 'https://api.telegram.org/file/test' };

      (mockBot.telegram.getFileLink as jest.Mock).mockResolvedValue(mockFileLink);
      (globalThis.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(downloadPhoto(mockBot, fileId)).rejects.toThrow('Network error');
    });
  });

  describe('bufferToDataUri', () => {
    it('should convert buffer to data URI with default mime type', () => {
      const buffer = Buffer.from('test data');
      const result = bufferToDataUri(buffer);

      expect(result).toBe('data:image/jpeg;base64,dGVzdCBkYXRh');
    });

    it('should convert buffer to data URI with custom mime type', () => {
      const buffer = Buffer.from('test data');
      const result = bufferToDataUri(buffer, 'image/png');

      expect(result).toBe('data:image/png;base64,dGVzdCBkYXRh');
    });

    it('should handle empty buffer', () => {
      const buffer = Buffer.from('');
      const result = bufferToDataUri(buffer);

      expect(result).toBe('data:image/jpeg;base64,');
    });
  });
});