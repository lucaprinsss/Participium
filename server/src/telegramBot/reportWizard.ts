import { Context } from 'telegraf';
import { UserSession, ReportData, WizardStep } from './types';
import { reportService } from '@services/reportService';
import { userRepository } from '@repositories/userRepository';
import { bufferToDataUri, downloadPhoto } from './utils';
import { CreateReportRequest } from '@dto/input/CreateReportRequest';
import { ReportCategory } from '@dto/ReportCategory';
import { BadRequestError } from '@errors/BadRequestError';
import { UnauthorizedError } from '@errors/UnauthorizedError';
import { InsufficientRightsError } from '@errors/InsufficientRightsError';
import { NotFoundError } from '@errors/NotFoundError';
import { geocodeAddress, reverseGeocode, parseCoordinates } from '@utils/geoValidationUtils';

export class ReportWizard {
  constructor(readonly bot: any, readonly removeSession: (chatId: number) => void) {}

  async handleLocation(ctx: Context, session: UserSession) {
    const message = ctx.message as any;
    const location = message?.location;
    if (!location) return ctx.reply('❌ Invalid location.');

    try {
      reportService.validateLocation({ latitude: location.latitude, longitude: location.longitude });
      session.data.location = { latitude: location.latitude, longitude: location.longitude };
      session.data.address = await reverseGeocode(session.data.location);
      session.step = WizardStep.WAITING_TITLE;
      ctx.reply('✅ Location confirmed\n\nPlease provide a title for your report.');
    } catch (error) {
      if (error instanceof BadRequestError) {
        return ctx.reply('❌ Invalid location\n\nThe selected location must be within the city boundaries of Turin.\n\nPlease send a valid location.');
      }
      return ctx.reply('❌ Error\n\nUnable to validate the location. Please try again.');
    }
  }

  async handleText(ctx: Context, session: UserSession) {
    const message = ctx.message as any;
    const text = message?.text;
    if (text === undefined) return;

    if (session.step === WizardStep.WAITING_LOCATION) {
      await this.handleLocationInput(ctx, session, text);
      return;
    }

    if (session.step === WizardStep.WAITING_TITLE) {
      this.handleTitleInput(ctx, session, text);
    } else if (session.step === WizardStep.WAITING_DESCRIPTION) {
      this.handleDescriptionInput(ctx, session, text);
    } else if (session.step === WizardStep.WAITING_PHOTOS && text === 'Fatto') {
      this.handlePhotosComplete(ctx, session);
    }
  }

  private async handleLocationInput(ctx: Context, session: UserSession, text: string) {
    const coords = parseCoordinates(text);
    if (coords) {
      await this.processCoordinates(ctx, session, coords);
    } else {
      await this.processAddress(ctx, session, text);
    }
  }

  private async processCoordinates(ctx: Context, session: UserSession, coords: { latitude: number; longitude: number }) {
    try {
      reportService.validateLocation(coords);
      session.data.location = coords;
      session.data.address = await reverseGeocode(coords);
      session.step = WizardStep.WAITING_TITLE;
      ctx.reply('✅ Coordinates validated\n\nPlease provide a title for your report.');
    } catch (error) {
      if (error instanceof BadRequestError) {
        ctx.reply('❌ Invalid coordinates\n\nThe location must be within the city boundaries of Turin.\n\nPlease enter valid coordinates or send a location from the map.');
      } else {
        ctx.reply('❌ Error\n\nUnable to validate the coordinates. Please verify the format and try again.');
      }
    }
  }

  private async processAddress(ctx: Context, session: UserSession, text: string) {
    try {
      const geocoded = await geocodeAddress(text.trim());
      session.data.location = geocoded.location;
      session.data.address = geocoded.address;
      session.step = WizardStep.WAITING_TITLE;
      ctx.reply('✅ Address found\n\nPlease provide a title for your report.');
    } catch (error) {
      console.error('Error geocoding address:', error);
      ctx.reply('❌ Address not found\n\nUnable to locate the address in Turin.\n\nPlease try with:\n• Coordinates (e.g., 45.0703, 7.6869)\n• A different address\n• Location from map');
    }
  }

  private handleTitleInput(ctx: Context, session: UserSession, text: string) {
    if (!text || text.trim().length === 0) {
      return ctx.reply('⚠️ Title required\n\nPlease enter a descriptive title for your report.');
    }
    session.data.title = text;
    session.step = WizardStep.WAITING_DESCRIPTION;
    ctx.reply('📝 Describe the issue\n\nProvide a detailed description of the problem.');
  }

  private handleDescriptionInput(ctx: Context, session: UserSession, text: string) {
    if (!text || text.trim().length === 0) {
      return ctx.reply('⚠️ Description required\n\nPlease provide a description of the issue.');
    }
    session.data.description = text;
    session.step = WizardStep.WAITING_CATEGORY;
    const categories = Object.values(ReportCategory);
    const keyboard = categories.map((cat, index) => [{ text: cat, callback_data: `cat_${index}` }]);
    ctx.reply('🏷️ Select a category\n\nChoose the category that best describes your report:', {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  }

  private handlePhotosComplete(ctx: Context, session: UserSession) {
    if (!session.data.photos || session.data.photos.length === 0) {
      return ctx.reply('⚠️ Photo required\n\nPlease attach at least one photo before continuing.', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Done', callback_data: 'done' }]],
        },
      });
    }

    session.step = WizardStep.WAITING_ANONYMOUS;
    ctx.reply('👤 Privacy settings\n\nWould you like this report to be anonymous?', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Yes, keep it anonymous', callback_data: 'anon_yes' }],
          [{ text: 'No, show my name', callback_data: 'anon_no' }],
        ],
      },
    });
  }

  async handleCallbackQuery(ctx: Context, session: UserSession) {
    const callbackQuery = ctx.callbackQuery as any;
    const data = callbackQuery?.data;

    if (data?.startsWith('cat_') && session.step === WizardStep.WAITING_CATEGORY) {
      const index = Number.parseInt(data.split('_')[1]);
      const categories = Object.values(ReportCategory);
      session.data.category = categories[index];
      session.step = WizardStep.WAITING_PHOTOS;
      ctx.reply('📸 Attach photos\n\nSend up to 3 photos of the issue.\nPress "Done" when finished.', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Done', callback_data: 'done' }]],
        },
      });
    } else if (data === 'done' && session.step === WizardStep.WAITING_PHOTOS) {
      if (!session.data.photos || session.data.photos.length === 0) {
        return ctx.reply('⚠️ Photo required\n\nPlease attach at least one photo before continuing.', {
          reply_markup: {
            inline_keyboard: [[{ text: 'Done', callback_data: 'done' }]],
          },
        });
      }

      session.step = WizardStep.WAITING_ANONYMOUS;
      ctx.reply('👤 Privacy settings\n\nWould you like this report to be anonymous?', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Yes, keep it anonymous', callback_data: 'anon_yes' }],
            [{ text: 'No, show my name', callback_data: 'anon_no' }],
          ],
        },
      });
    } else if (data?.startsWith('anon_') && session.step === WizardStep.WAITING_ANONYMOUS) {
      this.handleAnonymous(ctx, session);
    } else if (data?.startsWith('confirm_') && session.step === WizardStep.WAITING_CONFIRMATION) {
      await this.handleConfirmation(ctx, session);
    }
  }

  private handleAnonymous(ctx: Context, session: UserSession) {
    const callbackQuery = ctx.callbackQuery as any;
    const data = callbackQuery?.data;

    if (data === 'anon_yes') {
      session.data.isAnonymous = true;
    } else if (data === 'anon_no') {
      session.data.isAnonymous = false;
    } else {
      return;
    }

    session.step = WizardStep.WAITING_CONFIRMATION;
    this.showConfirmation(ctx, session.data);
  }

  private async handleConfirmation(ctx: Context, session: UserSession) {
    const callbackQuery = ctx.callbackQuery as any;
    const data = callbackQuery?.data;

    if (data === 'confirm_yes') {
      const telegramUsername = ctx.from?.username!;
      await this.saveReport(session.data, ctx.chat!.id, telegramUsername.toLowerCase());
    } else if (data === 'confirm_no') {
      ctx.reply('❌ Report cancelled\n\nYou can create a new report at any time using /newreport');
      this.removeSession(ctx.chat!.id);
    }
  }

  private showConfirmation(ctx: Context, data: ReportData) {
    const categoryNames: Record<string, string> = {
      ROADS: 'Roads',
      LIGHTING: 'Lighting',
      CLEANING: 'Cleaning',
      GREEN_AREAS: 'Green Areas',
      TRAFFIC: 'Traffic',
      OTHER: 'Other'
    };

    const summary = `
📋 *Report Summary*

Location: ${data.location!.latitude.toFixed(6)}, ${data.location!.longitude.toFixed(6)}

Address: ${data.address || 'Not available'}

Title: ${data.title}

Description: ${data.description}

Category: ${categoryNames[data.category!] || data.category}

Photos: ${data.photos?.length || 0} attached

${data.isAnonymous ? 'Privacy: Anonymous' : 'Privacy: Public'}

━━━━━━━━━━━━━━━━━━

Review the information above and confirm to submit your report.
    `.trim();

    ctx.reply(summary, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Confirm and Submit', callback_data: 'confirm_yes' }],
          [{ text: 'Cancel', callback_data: 'confirm_no' }]
        ]
      }
    });
  }

  private async saveReport(data: ReportData, chatId: number, telegramUsername: string) {
    try {
      const user = await userRepository.findUserByTelegramUsername(telegramUsername);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.telegramLinkConfirmed) {
        this.bot.telegram.sendMessage(chatId, '⏳ Link not confirmed. Please open the Participium app and tap "I sent the code" before submitting reports.', { parse_mode: 'Markdown' });
        return;
      }

      const photosDataUris = data.photos?.map(buffer => bufferToDataUri(buffer)) || [];

      const createRequest: CreateReportRequest = {
        title: data.title!.trim(),
        description: data.description!.trim(),
        category: data.category! as ReportCategory,
        location: data.location!,
        address: data.address,
        photos: photosDataUris,
        isAnonymous: data.isAnonymous || false,
      };

      const report = await reportService.createReport(createRequest, user.id);
      this.bot.telegram.sendMessage(
        chatId,
        `✅ Report successfully created!\n\n📋 Report ID: #${report.id}\n\nYour report has been submitted and will be reviewed by the municipality team. You will receive updates on its status.\n\nThank you for contributing to improve our city!`,
        { parse_mode: 'Markdown' }
      );
      this.removeSession(chatId);
    } catch (error) {
      this.handleSaveReportError(error, chatId);
    }
  }

  private handleSaveReportError(error: unknown, chatId: number) {
    if (error instanceof BadRequestError) {
      const message = error.message;
      if (message.includes('Location is required') || message.includes('Location must include')) {
        this.bot.telegram.sendMessage(chatId, '❌ Invalid Location\n\nThe location data is missing or incomplete. Please try creating the report again.', { parse_mode: 'Markdown' });
      } else if (message.includes('Invalid coordinates')) {
        this.bot.telegram.sendMessage(chatId, '❌ Invalid Coordinates\n\nCoordinates must be valid:\n• Latitude: -90 to 90\n• Longitude: -180 to 180\n\nPlease try again.', { parse_mode: 'Markdown' });
      } else if (message.includes('outside Turin city boundaries')) {
        this.bot.telegram.sendMessage(chatId, '❌ Location Outside Turin\n\nThe report location must be within the city boundaries of Turin. Please select a valid location.', { parse_mode: 'Markdown' });
      } else if (message.includes('Photos must contain')) {
        this.bot.telegram.sendMessage(chatId, '❌ Invalid Photos\n\nYou must attach between 1 and 3 valid photos. Please try again.', { parse_mode: 'Markdown' });
      } else if (message.includes('unsupported format')) {
        this.bot.telegram.sendMessage(chatId, '❌ Unsupported Format\n\nPlease use one of the following formats:\n• JPEG\n• PNG\n• WebP', { parse_mode: 'Markdown' });
      } else if (message.includes('not a valid image data URI')) {
        this.bot.telegram.sendMessage(chatId, '❌ Invalid Photo\n\nThe photo could not be processed. Please try uploading it again.', { parse_mode: 'Markdown' });
      } else {
        this.bot.telegram.sendMessage(chatId, `❌ Error\n\n${message}\n\nPlease try again or contact support if the problem persists.`, { parse_mode: 'Markdown' });
      }
    } else if (error instanceof UnauthorizedError) {
      this.bot.telegram.sendMessage(chatId, '❌ Unauthorized\n\nYou are not authorized to create reports. Please ensure your account is properly registered.', { parse_mode: 'Markdown' });
    } else if (error instanceof InsufficientRightsError) {
      this.bot.telegram.sendMessage(chatId, '❌ Insufficient Permissions\n\nYour account does not have the required permissions to create reports.', { parse_mode: 'Markdown' });
    } else if (error instanceof NotFoundError) {
      this.bot.telegram.sendMessage(chatId, '❌ Resource Not Found\n\nRequired resources could not be located. Please try again.', { parse_mode: 'Markdown' });
    } else {
      this.bot.telegram.sendMessage(chatId, '❌ Error Creating Report\n\nAn unexpected error occurred. Please try again later or contact support if the issue persists.', { parse_mode: 'Markdown' });
    }
  }

  async handlePhotos(ctx: Context, session: UserSession) {
    const message = ctx.message as any;
    const photos = message?.photo;
    const text = message?.text;

    if (photos) {
      const photo = photos[photos.length - 1];
      session.data.photos = session.data.photos || [];
      
      if (session.data.photos.length >= 3) {
        return ctx.reply('📸 Maximum 3 photos allowed.\nPress "Done" when finished.', {
          reply_markup: {
            inline_keyboard: [[{ text: 'Done', callback_data: 'done' }]],
          },
          parse_mode: 'Markdown'
        });
      }
      
      const buffer = await downloadPhoto(this.bot, photo.file_id);
      session.data.photos.push(buffer);

      if (session.data.photos.length >= 3) {
        ctx.reply('✅ Maximum photos reached (3/3)\n\nPress "Done" to continue with the next step.', {
          reply_markup: {
            inline_keyboard: [[{ text: 'Done', callback_data: 'done' }]],
          },
          parse_mode: 'Markdown'
        });
      } else {
        ctx.reply(`✅ Photo received (${session.data.photos.length}/3)\n\nYou can send ${3 - session.data.photos.length} more photo${3 - session.data.photos.length > 1 ? 's' : ''} or press "Done" to continue.`, {
          reply_markup: {
            inline_keyboard: [[{ text: 'Done', callback_data: 'done' }]],
          },
          parse_mode: 'Markdown'
        });
      }
    } else if (text) {
      ctx.reply('📸 Waiting for photos\n\nPlease send photos or press "Done" if finished.', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Done', callback_data: 'done' }]],
        },
        parse_mode: 'Markdown'
      });
    }
  }
}