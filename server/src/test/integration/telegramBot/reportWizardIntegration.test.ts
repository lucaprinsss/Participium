import { ReportWizard } from '@telegramBot/reportWizard';
import { WizardStep, UserSession } from '@telegramBot/types';
import { ReportCategory } from '@dto/ReportCategory';

// Mock all dependencies
jest.mock('@services/reportService');
jest.mock('@repositories/userRepository');
jest.mock('@utils/geoValidationUtils');
jest.mock('@telegramBot/utils');
jest.mock('@errors/BadRequestError');

import { reportService } from '@services/reportService';
import { userRepository } from '@repositories/userRepository';
import { geocodeAddress, reverseGeocode, parseCoordinates } from '@utils/geoValidationUtils';
import { bufferToDataUri } from '@telegramBot/utils';
import { BadRequestError } from '@errors/BadRequestError';

const mockReportService = reportService as jest.Mocked<typeof reportService>;
const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;
const mockGeocodeAddress = jest.mocked(geocodeAddress);
const mockReverseGeocode = jest.mocked(reverseGeocode);
const mockParseCoordinates = jest.mocked(parseCoordinates);
const mockBufferToDataUri = jest.mocked(bufferToDataUri);

describe('ReportWizard Integration Tests', () => {
  let wizard: ReportWizard;
  let mockBot: any;
  let mockRemoveSession: jest.Mock;
  let mockCtx: any;
  let session: UserSession;
  let sendMessageMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    sendMessageMock = jest.fn().mockResolvedValue(true);
    mockBot = {
      telegram: {
        sendMessage: sendMessageMock,
        getFileLink: jest.fn().mockResolvedValue({ href: 'test-url' }),
      },
    };
    mockRemoveSession = jest.fn();
    wizard = new ReportWizard(mockBot, mockRemoveSession);
    mockCtx = {
      chat: { id: 123 },
      from: { username: 'testuser' },
      reply: jest.fn().mockResolvedValue(true),
      callbackQuery: undefined,
      message: undefined,
    };
    session = {
      step: WizardStep.WAITING_LOCATION,
      data: {},
    };

    // Setup default mocks
    mockReportService.validateLocation.mockReturnValue(undefined);
    mockReverseGeocode.mockResolvedValue('Test Address, Turin');
    mockGeocodeAddress.mockResolvedValue({
      location: { latitude: 45.0703, longitude: 7.6869 },
      address: 'Test Address, Turin'
    });
    mockParseCoordinates.mockReturnValue(null);
    mockBufferToDataUri.mockReturnValue('data:image/jpeg;base64,test');
  });

  describe('Complete report creation workflow', () => {
    it('should complete full report creation flow', async () => {
      session = { step: WizardStep.WAITING_LOCATION, data: {} };

      // Step 1: Handle location
      mockCtx.message = { location: { latitude: 45.0703, longitude: 7.6869 } };
      await wizard.handleLocation(mockCtx, session);
      expect(session.step).toBe(WizardStep.WAITING_TITLE);
      expect(session.data.location).toEqual({ latitude: 45.0703, longitude: 7.6869 });

      // Step 2: Handle title
      session.step = WizardStep.WAITING_TITLE;
      mockCtx.message = { text: 'Test Report Title' };
      mockCtx.reply = jest.fn().mockResolvedValue(true);
      wizard.handleText(mockCtx, session);
      expect(session.step).toBe(WizardStep.WAITING_DESCRIPTION);
      expect(session.data.title).toBe('Test Report Title');

      // Step 3: Handle description
      session.step = WizardStep.WAITING_DESCRIPTION;
      mockCtx.message = { text: 'Test report description' };
      mockCtx.reply = jest.fn().mockResolvedValue(true);
      wizard.handleText(mockCtx, session);
      expect(session.step).toBe(WizardStep.WAITING_CATEGORY);
      expect(session.data.description).toBe('Test report description');

      // Step 4: Handle category selection
      session.step = WizardStep.WAITING_CATEGORY;
      mockCtx.callbackQuery = { data: 'cat_0' }; // WATER_SUPPLY
      mockCtx.reply = jest.fn().mockResolvedValue(true);
      await wizard.handleCallbackQuery(mockCtx, session);
      expect(session.step).toBe(WizardStep.WAITING_PHOTOS);
      expect(session.data.category).toBe(ReportCategory.WATER_SUPPLY);

      // Step 5: Handle photo upload
      session.step = WizardStep.WAITING_PHOTOS;
      mockCtx.message = { photo: [{ file_id: 'test-file-id' }] };
      globalThis.fetch = jest.fn().mockResolvedValue({
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      });
      await wizard.handlePhotos(mockCtx, session);
      expect(session.data.photos).toHaveLength(1);

      // Step 6: Handle done
      mockCtx.callbackQuery = { data: 'done' };
      mockCtx.reply = jest.fn().mockResolvedValue(true);
      await wizard.handleCallbackQuery(mockCtx, session);
      expect(session.step).toBe(WizardStep.WAITING_ANONYMOUS);

      // Step 7: Handle anonymous choice
      mockCtx.callbackQuery = { data: 'anon_no' };
      mockCtx.reply = jest.fn().mockResolvedValue(true);
      await wizard.handleCallbackQuery(mockCtx, session);
      expect(session.step).toBe(WizardStep.WAITING_CONFIRMATION);
      expect(session.data.isAnonymous).toBe(false);

      // Step 8: Handle confirmation
      mockCtx.callbackQuery = { data: 'confirm_yes' };
      mockCtx.reply = jest.fn().mockResolvedValue(true);
      const mockUser = { id: 1 } as any;
      mockUserRepository.findUserByTelegramUsername.mockResolvedValue(mockUser);
      mockReportService.createReport.mockResolvedValue({ id: 123 } as any);
      await wizard.handleCallbackQuery(mockCtx, session);

      expect(mockReportService.createReport).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Report Title',
          description: 'Test report description',
          category: ReportCategory.WATER_SUPPLY,
          location: { latitude: 45.0703, longitude: 7.6869 },
          isAnonymous: false,
        }),
        1
      );
      expect(sendMessageMock).toHaveBeenCalledWith(
        123,
        expect.stringContaining('✅ Report successfully created!'),
        { parse_mode: 'Markdown' }
      );
      expect(mockRemoveSession).toHaveBeenCalledWith(123);
    });
  });

  describe('Error scenarios', () => {
    it('should handle invalid location coordinates', async () => {
      session = { step: WizardStep.WAITING_LOCATION, data: {} };
      mockCtx.message = { location: { latitude: 999, longitude: 999 } };
      const error = new BadRequestError('Invalid location');
      mockReportService.validateLocation.mockImplementation(() => {
        throw error;
      });

      await wizard.handleLocation(mockCtx, session);

      expect(mockCtx.reply).toHaveBeenCalledWith('❌ Invalid location\n\nThe selected location must be within the city boundaries of Turin.\n\nPlease send a valid location.');
      expect(session.step).toBe(WizardStep.WAITING_LOCATION);
    });

    it('should handle geocoding failure for address input', async () => {
      session = { step: WizardStep.WAITING_LOCATION, data: {} };
      mockCtx.message = { text: 'Invalid Address' };
      mockGeocodeAddress.mockRejectedValue(new Error('Address not found'));

      await wizard.handleText(mockCtx, session);

      expect(mockCtx.reply).toHaveBeenCalledWith('❌ Address not found\n\nUnable to locate the address in Turin.\n\nPlease try with:\n• Coordinates (e.g., 45.0703, 7.6869)\n• A different address\n• Location from map');
    });

    it('should handle empty title', () => {
      session = { step: WizardStep.WAITING_TITLE, data: {} };
      mockCtx.message = { text: '' };

      wizard.handleText(mockCtx, session);

      expect(mockCtx.reply).toHaveBeenCalledWith('⚠️ Title required\n\nPlease enter a descriptive title for your report.');
      expect(session.step).toBe(WizardStep.WAITING_TITLE);
    });

    it('should handle empty description', () => {
      session = { step: WizardStep.WAITING_DESCRIPTION, data: {} };
      mockCtx.message = { text: '' };

      wizard.handleText(mockCtx, session);

      expect(mockCtx.reply).toHaveBeenCalledWith('⚠️ Description required\n\nPlease provide a description of the issue.');
      expect(session.step).toBe(WizardStep.WAITING_DESCRIPTION);
    });

    it('should prevent confirmation without photos', async () => {
      session = {
        step: WizardStep.WAITING_PHOTOS,
        data: { title: 'Test', description: 'Test', category: ReportCategory.ROADS, location: { latitude: 45, longitude: 7 } }
      };
      mockCtx.callbackQuery = { data: 'done' };

      await wizard.handleCallbackQuery(mockCtx, session);

      expect(mockCtx.reply).toHaveBeenCalledWith('⚠️ Photo required\n\nPlease attach at least one photo before continuing.', expect.any(Object));
      expect(session.step).toBe(WizardStep.WAITING_PHOTOS);
    });

    it('should handle report creation failure', async () => {
      session = {
        step: WizardStep.WAITING_CONFIRMATION,
        data: {
          title: 'Test',
          description: 'Test',
          category: ReportCategory.WATER_SUPPLY,
          location: { latitude: 45, longitude: 7 },
          photos: [Buffer.from('test')],
          isAnonymous: false,
        }
      };
      mockCtx.callbackQuery = { data: 'confirm_yes' };
      const mockUser = { id: 1 } as any;
      mockUserRepository.findUserByTelegramUsername.mockResolvedValue(mockUser);
      mockReportService.createReport.mockRejectedValue(new Error('Creation failed'));

      await wizard.handleCallbackQuery(mockCtx, session);

      expect(mockReportService.createReport).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test',
          description: 'Test',
          category: ReportCategory.WATER_SUPPLY,
          location: { latitude: 45, longitude: 7 },
          isAnonymous: false,
        }),
        1
      );
      expect(sendMessageMock).toHaveBeenCalledWith(
        123,
        expect.stringContaining('❌ Error Creating Report'),
        { parse_mode: 'Markdown' }
      );
    });
  });

  describe('Photo handling', () => {
    it('should handle multiple photo uploads up to limit', async () => {
      session = { step: WizardStep.WAITING_PHOTOS, data: { photos: [] } };
      mockBot.telegram.getFileLink = jest.fn().mockResolvedValue({ href: 'test-url' });
      globalThis.fetch = jest.fn().mockResolvedValue({
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      });

      // Upload 3 photos
      for (let i = 0; i < 3; i++) {
        mockCtx.message = { photo: [{ file_id: `file-${i}` }] };
        await wizard.handlePhotos(mockCtx, session);
      }

      expect(session.data.photos).toHaveLength(3);

      // Try to upload 4th photo
      mockCtx.message = { photo: [{ file_id: 'file-4' }] };
      await wizard.handlePhotos(mockCtx, session);

      expect(session.data.photos).toHaveLength(3);
      expect(mockCtx.reply).toHaveBeenNthCalledWith(4, expect.stringContaining('📸 Maximum 3 photos allowed'), {
        reply_markup: {
          inline_keyboard: [[{ text: 'Done', callback_data: 'done' }]],
        },
        parse_mode: 'Markdown'
      });
    });
  });
});