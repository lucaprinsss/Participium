import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { botConfig } from './botConfig';
import { ReportHandler } from './reportHandler';

let botInstance: Telegraf | null = null;
let reportHandler: ReportHandler | null = null;

export const initBot = () => {
  if (!botConfig.BOT_TOKEN) {
    console.log('TELEGRAM_BOT_TOKEN not set. Telegram bot will not be started.');
    return;
  }

  botInstance = new Telegraf(botConfig.BOT_TOKEN);
  reportHandler = new ReportHandler(botInstance);

  botInstance.start((ctx) => {
    ctx.reply(
      '🏛 *Welcome to Participium!*\n\n' +
      'Thank you for joining the official channel to improve the city of Turin!\n\n' +
      'With this bot you can:\n' +
      '• Quickly report issues in the city\n' +
      '• Help make Turin a better place for everyone\n\n' +
      'Type /help to discover all available commands and how to get started.',
      { parse_mode: 'Markdown' }
    );
  });

  botInstance.command('help', (ctx) => {
    ctx.reply(
      '🏛 *Participium Bot - Help*\n\n' +
      '*Available Commands:*\n\n' +
      '/link <code>\n' +
      'Link your Telegram account to Participium.\n' +
      'Generate the code from your profile on the website.\n\n' +
      '/newreport\n' +
      'Create a new report about an issue in the city.\n' +
      '*How to Report an Issue:*\n' +
      '1. Use /newreport command\n' +
      '2. Send the location or address\n' +
      '3. Provide a title and description\n' +
      '4. Select a category\n' +
      '5. Attach 1-3 photos\n' +
      '6. Choose privacy settings\n' +
      '7. Confirm and submit\n\n' +
      '/unlink\n' +
      'Unlink your Telegram account from Participium.\n' +
      'You can link again anytime with /link\n\n' +
      '/help\n' +
      'Display this help message.\n\n' +
      '━━━━━━━━━━━━━\n\n' +
      '*Need more help?*\n' +
      'Visit our website or contact support.',
      { parse_mode: 'Markdown' }
    );
  });

  botInstance.command('newreport', (ctx) => reportHandler!.startReport(ctx));
  botInstance.command('link', (ctx) => reportHandler!.linkAccount(ctx));
  botInstance.command('unlink', (ctx) => reportHandler!.unlinkAccount(ctx));
  botInstance.on(message('location'), (ctx) => reportHandler!.handleLocation(ctx));
  botInstance.on(message('photo'), (ctx) => reportHandler!.handlePhotos(ctx));
  botInstance.on(message('text'), (ctx) => reportHandler!.handleText(ctx));
  botInstance.on('callback_query', (ctx) => {
    const callbackQuery = ctx.callbackQuery as any;
    const data = callbackQuery?.data;
    
    // Handle unlink confirmation
    if (data === 'unlink_confirm' || data === 'unlink_cancel') {
      reportHandler!.handleUnlinkConfirmation(ctx);
    } else {
      reportHandler!.handleCallbackQuery(ctx);
    }
    ctx.answerCbQuery();
  });

  botInstance.launch().then(() => {
    console.log('Telegram bot started successfully.');
  }).catch((error) => {
    console.error('Error starting Telegram bot:', error);
  });
};

export const getBot = () => botInstance;