import { ReportWizard } from '@telegramBot/reportWizard';
import { WizardStep, UserSession } from '@telegramBot/types';
import { ReportCategory } from '@dto/ReportCategory';

// Mock dependencies
jest.mock('@services/reportService');
jest.mock('@repositories/userRepository');
jest.mock('@utils/geoValidationUtils');
jest.mock('@telegramBot/utils');

import { reportService } from '@services/reportService';
import { userRepository } from '@repositories/userRepository';
import { geocodeAddress, reverseGeocode, parseCoordinates } from '@utils/geoValidationUtils';
import { bufferToDataUri } from '@telegramBot/utils';
import { BadRequestError } from '@errors/BadRequestError';
import { UnauthorizedError } from '@errors/UnauthorizedError';
import { InsufficientRightsError } from '@errors/InsufficientRightsError';
import { NotFoundError } from '@errors/NotFoundError';

const mockReportService = reportService as jest.Mocked<typeof reportService>;
const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;
const mockGeocodeAddress = jest.mocked(geocodeAddress);
const mockReverseGeocode = jest.mocked(reverseGeocode);
const mockParseCoordinates = jest.mocked(parseCoordinates);
const mockBufferToDataUri = jest.mocked(bufferToDataUri);

describe('ReportWizard', () => {
  let wizard: ReportWizard;
  let mockBot: any;
  let mockRemoveSession: jest.Mock;
  let mockCtx: any;
  let session: UserSession;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBot = {
      telegram: {
        sendMessage: jest.fn(),
      },
    };
    mockRemoveSession = jest.fn();
    wizard = new ReportWizard(mockBot, mockRemoveSession);
    mockCtx = {
      chat: { id: 123 },
      from: { username: 'testuser' },
      reply: jest.fn(),
    };
    session = {
      step: WizardStep.WAITING_LOCATION,
      data: {},
    };
    
    // Setup default mocks
    mockReverseGeocode.mockResolvedValue('Test Address, Turin');
    mockGeocodeAddress.mockResolvedValue({
      location: { latitude: 45.0703, longitude: 7.6869 },
      address: 'Test Address, Turin'
    });
  });

  describe('handleLocation', () => {
    it('should handle valid location', async () => {
      const location = { latitude: 45.0703, longitude: 7.6869 };
      mockCtx.message = { location };
      mockReportService.validateLocation.mockReturnValue();

      await wizard.handleLocation(mockCtx, session);

      expect(session.data.location).toEqual(location);
      expect(session.data.address).toBe('Test Address, Turin');
      expect(session.step).toBe(WizardStep.WAITING_TITLE);
      expect(mockCtx.reply).toHaveBeenCalledWith('✅ Location confirmed\n\nPlease provide a title for your report.');
    });

    it('should handle invalid location', async () => {
      const location = { latitude: 999, longitude: 999 };
      mockCtx.message = { location };
      const error = new BadRequestError('Invalid location');
      mockReportService.validateLocation.mockImplementation(() => {
        throw error;
      });

      await wizard.handleLocation(mockCtx, session);

      expect(mockCtx.reply).toHaveBeenCalledWith('❌ Invalid location\n\nThe selected location must be within the city boundaries of Turin.\n\nPlease send a valid location.');
    });

    it('should handle location validation error', async () => {
      const location = { latitude: 45.0703, longitude: 7.6869 };
      mockCtx.message = { location };
      const error = new Error('Validation failed');
      mockReportService.validateLocation.mockImplementation(() => {
        throw error;
      });

      await wizard.handleLocation(mockCtx, session);

      expect(mockCtx.reply).toHaveBeenCalledWith('❌ Error\n\nUnable to validate the location. Please try again.');
    });
  });

  describe('handleText', () => {
    it('should handle coordinates input', async () => {
      const text = '45.0703, 7.6869';
      mockCtx.message = { text };
      mockParseCoordinates.mockReturnValue({ latitude: 45.0703, longitude: 7.6869 });
      mockReportService.validateLocation.mockReturnValue();

      await wizard.handleText(mockCtx, session);

      expect(session.data.location).toEqual({ latitude: 45.0703, longitude: 7.6869 });
      expect(session.data.address).toBe('Test Address, Turin');
      expect(session.step).toBe(WizardStep.WAITING_TITLE);
      expect(mockCtx.reply).toHaveBeenCalledWith('✅ Coordinates validated\n\nPlease provide a title for your report.');
    });

    it('should handle address input', async () => {
      const text = 'Test Address';
      mockCtx.message = { text };
      mockParseCoordinates.mockReturnValue(null);

      await wizard.handleText(mockCtx, session);

      expect(session.data.location).toEqual({ latitude: 45.0703, longitude: 7.6869 });
      expect(session.data.address).toBe('Test Address, Turin');
      expect(session.step).toBe(WizardStep.WAITING_TITLE);
    });

    it('should handle coordinates validation error', async () => {
      const text = '45.0703, 7.6869';
      mockCtx.message = { text };
      mockParseCoordinates.mockReturnValue({ latitude: 45.0703, longitude: 7.6869 });
      mockReportService.validateLocation.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      await wizard.handleText(mockCtx, session);

      expect(mockCtx.reply).toHaveBeenCalledWith('❌ Error\n\nUnable to validate the coordinates. Please verify the format and try again.');
    });

    it('should handle address geocoding error', async () => {
      const text = 'Invalid Address';
      mockCtx.message = { text };
      mockParseCoordinates.mockReturnValue(null);
      mockGeocodeAddress.mockRejectedValue(new Error('Address not found'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await wizard.handleText(mockCtx, session);

      expect(mockGeocodeAddress).toHaveBeenCalledWith('Invalid Address');
      expect(consoleSpy).toHaveBeenCalledWith('Error geocoding address:', expect.any(Error));
      expect(mockCtx.reply).toHaveBeenCalledWith('❌ Address not found\n\nUnable to locate the address in Turin.\n\nPlease try with:\n• Coordinates (e.g., 45.0703, 7.6869)\n• A different address\n• Location from map');

      consoleSpy.mockRestore();
    });

    it('should handle photos complete with Fatto command', () => {
      const text = 'Fatto';
      mockCtx.message = { text };
      session.step = WizardStep.WAITING_PHOTOS;
      session.data.photos = [Buffer.from('test')];

      wizard.handleText(mockCtx, session);

      expect(session.step).toBe(WizardStep.WAITING_ANONYMOUS);
      expect(mockCtx.reply).toHaveBeenCalledWith('👤 Privacy settings\n\nWould you like this report to be anonymous?', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Yes, keep it anonymous', callback_data: 'anon_yes' }],
            [{ text: 'No, show my name', callback_data: 'anon_no' }],
          ],
        },
      });
    });

    it('should handle photos complete with no photos', () => {
      const text = 'Fatto';
      mockCtx.message = { text };
      session.step = WizardStep.WAITING_PHOTOS;
      session.data.photos = [];

      wizard.handleText(mockCtx, session);

      expect(mockCtx.reply).toHaveBeenCalledWith('⚠️ Photo required\n\nPlease attach at least one photo before continuing.', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Done', callback_data: 'done' }]],
        },
      });
    });

    it('should handle title input', () => {
      session.step = WizardStep.WAITING_TITLE;
      const text = 'Test Title';
      mockCtx.message = { text };

      wizard.handleText(mockCtx, session);

      expect(session.data.title).toBe('Test Title');
      expect(session.step).toBe(WizardStep.WAITING_DESCRIPTION);
    });

    it('should handle empty title', () => {
      session.step = WizardStep.WAITING_TITLE;
      const text = '';
      mockCtx.message = { text };

      wizard.handleText(mockCtx, session);

      expect(mockCtx.reply).toHaveBeenCalledWith('⚠️ Title required\n\nPlease enter a descriptive title for your report.');
    });

    it('should handle description input', () => {
      session.step = WizardStep.WAITING_DESCRIPTION;
      const text = 'Test Description';
      mockCtx.message = { text };

      wizard.handleText(mockCtx, session);

      expect(session.data.description).toBe('Test Description');
      expect(session.step).toBe(WizardStep.WAITING_CATEGORY);
    });

    it('should handle empty description', () => {
      session.step = WizardStep.WAITING_DESCRIPTION;
      const text = '';
      mockCtx.message = { text };

      wizard.handleText(mockCtx, session);

      expect(mockCtx.reply).toHaveBeenCalledWith('⚠️ Description required\n\nPlease provide a description of the issue.');
    });
  });

  describe('handleCallbackQuery', () => {
    it('should handle category selection', async () => {
      session.step = WizardStep.WAITING_CATEGORY;
      mockCtx.callbackQuery = { data: 'cat_0' };

      await wizard.handleCallbackQuery(mockCtx, session);

      expect(session.data.category).toBe(ReportCategory.WATER_SUPPLY);
      expect(session.step).toBe(WizardStep.WAITING_PHOTOS);
    });

    it('should handle done without photos', async () => {
      session.step = WizardStep.WAITING_PHOTOS;
      mockCtx.callbackQuery = { data: 'done' };

      await wizard.handleCallbackQuery(mockCtx, session);

      expect(mockCtx.reply).toHaveBeenCalledWith('⚠️ Photo required\n\nPlease attach at least one photo before continuing.', expect.any(Object));
    });

    it('should handle anonymous yes', async () => {
      session.step = WizardStep.WAITING_ANONYMOUS;
      session.data = {
        title: 'Test',
        description: 'Test',
        category: ReportCategory.WATER_SUPPLY,
        location: { latitude: 45, longitude: 7 },
        photos: [Buffer.from('test')],
      };
      mockCtx.callbackQuery = { data: 'anon_yes' };

      await wizard.handleCallbackQuery(mockCtx, session);

      expect(session.data.isAnonymous).toBe(true);
      expect(session.step).toBe(WizardStep.WAITING_CONFIRMATION);
    });

    it('should handle anonymous no', async () => {
      session.step = WizardStep.WAITING_ANONYMOUS;
      session.data = {
        title: 'Test',
        description: 'Test',
        category: ReportCategory.WATER_SUPPLY,
        location: { latitude: 45, longitude: 7 },
        photos: [Buffer.from('test')],
      };
      mockCtx.callbackQuery = { data: 'anon_no' };

      await wizard.handleCallbackQuery(mockCtx, session);

      expect(session.data.isAnonymous).toBe(false);
      expect(session.step).toBe(WizardStep.WAITING_CONFIRMATION);
    });

    it('should ignore invalid anonymous callback data', async () => {
      session.step = WizardStep.WAITING_ANONYMOUS;
      session.data = {
        title: 'Test',
        description: 'Test',
        category: ReportCategory.WATER_SUPPLY,
        location: { latitude: 45, longitude: 7 },
        photos: [Buffer.from('test')],
      };
      mockCtx.callbackQuery = { data: 'invalid_anon' };

      await wizard.handleCallbackQuery(mockCtx, session);

      expect(session.step).toBe(WizardStep.WAITING_ANONYMOUS); // Should not change
      expect(session.data.isAnonymous).toBeUndefined();
    });

    it('should handle confirm yes', async () => {
      session.step = WizardStep.WAITING_CONFIRMATION;
      session.data = {
        title: 'Test',
        description: 'Test',
        category: ReportCategory.WATER_SUPPLY,
        location: { latitude: 45, longitude: 7 },
        photos: [Buffer.from('test')],
        isAnonymous: false,
      };
      mockCtx.callbackQuery = { data: 'confirm_yes' };
      const mockUser = { id: 1, telegramLinkConfirmed: true } as any;
      mockUserRepository.findUserByTelegramUsername.mockResolvedValue(mockUser);
      mockReportService.createReport.mockResolvedValue({ id: 123 } as any);
      mockBufferToDataUri.mockReturnValue('data:image/jpeg;base64,test');

      await wizard.handleCallbackQuery(mockCtx, session);

      expect(mockReportService.createReport).toHaveBeenCalled();
      expect(mockBot.telegram.sendMessage).toHaveBeenCalled();
      expect(mockRemoveSession).toHaveBeenCalledWith(123);
    });

    it('should handle confirm no', async () => {
      session.step = WizardStep.WAITING_CONFIRMATION;
      mockCtx.callbackQuery = { data: 'confirm_no' };

      await wizard.handleCallbackQuery(mockCtx, session);

      expect(mockCtx.reply).toHaveBeenCalledWith('❌ Report cancelled\n\nYou can create a new report at any time using /newreport');
      expect(mockRemoveSession).toHaveBeenCalledWith(123);
    });
  });

  describe('handlePhotos', () => {
    it('should handle photo upload', async () => {
      session.step = WizardStep.WAITING_PHOTOS;
      const photo = [{ file_id: 'test-file-id' }];
      mockCtx.message = { photo };
      mockBot.telegram.getFileLink = jest.fn().mockResolvedValue({ href: 'test-url' });
      globalThis.fetch = jest.fn().mockResolvedValue({
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      });

      await wizard.handlePhotos(mockCtx, session);

      expect(session.data.photos).toHaveLength(1);
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('✅ Photo received (1/3)'),
        expect.any(Object)
      );
    });

    it('should limit to 3 photos', async () => {
      session.step = WizardStep.WAITING_PHOTOS;
      session.data.photos = [Buffer.from('1'), Buffer.from('2'), Buffer.from('3')];
      const photo = [{ file_id: 'test-file-id' }];
      mockCtx.message = { photo };

      await wizard.handlePhotos(mockCtx, session);

      expect(session.data.photos).toHaveLength(3);
      expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('📸 Maximum 3 photos allowed'), {
        reply_markup: {
          inline_keyboard: [[{ text: 'Done', callback_data: 'done' }]],
        },
        parse_mode: 'Markdown'
      });
    });

    it('should handle text input during photo waiting', () => {
      session.step = WizardStep.WAITING_PHOTOS;
      session.data.photos = [Buffer.from('test')];
      mockCtx.message = { text: 'some text' };

      wizard.handlePhotos(mockCtx, session);

      expect(mockCtx.reply).toHaveBeenCalledWith('📸 Waiting for photos\n\nPlease send photos or press "Done" if finished.', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Done', callback_data: 'done' }]],
        },
        parse_mode: 'Markdown'
      });
    });
  });

  describe('handleSaveReportError', () => {
    let wizard: ReportWizard;
    let mockBot: any;

    beforeEach(() => {
      mockBot = {
        telegram: {
          sendMessage: jest.fn(),
        },
      };
      wizard = new ReportWizard(mockBot, jest.fn());
    });

    it('should handle BadRequestError with location validation message', async () => {
      // Arrange
      const chatId = 123;
      const error = new BadRequestError('Location is required');

      // Act
      (wizard as any).handleSaveReportError(error, chatId);

      // Assert
      expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(
        chatId,
        '❌ Invalid Location\n\nThe location data is missing or incomplete. Please try creating the report again.',
        { parse_mode: 'Markdown' }
      );
    });

    it('should handle BadRequestError with coordinates validation message', async () => {
      // Arrange
      const chatId = 123;
      const error = new BadRequestError('Invalid coordinates');

      // Act
      (wizard as any).handleSaveReportError(error, chatId);

      // Assert
      expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(
        chatId,
        '❌ Invalid Coordinates\n\nCoordinates must be valid:\n• Latitude: -90 to 90\n• Longitude: -180 to 180\n\nPlease try again.',
        { parse_mode: 'Markdown' }
      );
    });

    it('should handle BadRequestError with outside Turin boundaries message', async () => {
      // Arrange
      const chatId = 123;
      const error = new BadRequestError('outside Turin city boundaries');

      // Act
      (wizard as any).handleSaveReportError(error, chatId);

      // Assert
      expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(
        chatId,
        '❌ Location Outside Turin\n\nThe report location must be within the city boundaries of Turin. Please select a valid location.',
        { parse_mode: 'Markdown' }
      );
    });

    it('should handle BadRequestError with photos validation message', async () => {
      // Arrange
      const chatId = 123;
      const error = new BadRequestError('Photos must contain');

      // Act
      (wizard as any).handleSaveReportError(error, chatId);

      // Assert
      expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(
        chatId,
        '❌ Invalid Photos\n\nYou must attach between 1 and 3 valid photos. Please try again.',
        { parse_mode: 'Markdown' }
      );
    });

    it('should handle BadRequestError with unsupported format message', async () => {
      // Arrange
      const chatId = 123;
      const error = new BadRequestError('unsupported format');

      // Act
      (wizard as any).handleSaveReportError(error, chatId);

      // Assert
      expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(
        chatId,
        '❌ Unsupported Format\n\nPlease use one of the following formats:\n• JPEG\n• PNG\n• WebP',
        { parse_mode: 'Markdown' }
      );
    });

    it('should handle BadRequestError with invalid data URI message', async () => {
      // Arrange
      const chatId = 123;
      const error = new BadRequestError('not a valid image data URI');

      // Act
      (wizard as any).handleSaveReportError(error, chatId);

      // Assert
      expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(
        chatId,
        '❌ Invalid Photo\n\nThe photo could not be processed. Please try uploading it again.',
        { parse_mode: 'Markdown' }
      );
    });

    it('should handle UnauthorizedError', async () => {
      // Arrange
      const chatId = 123;
      const error = new UnauthorizedError('Not authorized');

      // Act
      (wizard as any).handleSaveReportError(error, chatId);

      // Assert
      expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(
        chatId,
        '❌ Unauthorized\n\nYou are not authorized to create reports. Please ensure your account is properly registered.',
        { parse_mode: 'Markdown' }
      );
    });

    it('should handle InsufficientRightsError', async () => {
      // Arrange
      const chatId = 123;
      const error = new InsufficientRightsError('Insufficient rights');

      // Act
      (wizard as any).handleSaveReportError(error, chatId);

      // Assert
      expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(
        chatId,
        '❌ Insufficient Permissions\n\nYour account does not have the required permissions to create reports.',
        { parse_mode: 'Markdown' }
      );
    });

    it('should handle NotFoundError', async () => {
      // Arrange
      const chatId = 123;
      const error = new NotFoundError('Resource not found');

      // Act
      (wizard as any).handleSaveReportError(error, chatId);

      // Assert
      expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(
        chatId,
        '❌ Resource Not Found\n\nRequired resources could not be located. Please try again.',
        { parse_mode: 'Markdown' }
      );
    });

    it('should handle generic errors', async () => {
      // Arrange
      const chatId = 123;
      const error = new Error('Generic error');

      // Act
      (wizard as any).handleSaveReportError(error, chatId);

      // Assert
      expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(
        chatId,
        '❌ Error Creating Report\n\nAn unexpected error occurred. Please try again later or contact support if the issue persists.',
        { parse_mode: 'Markdown' }
      );
    });
  });
});