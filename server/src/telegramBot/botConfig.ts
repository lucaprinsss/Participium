const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ENABLED =
  process.env.TELEGRAM_BOT_ENABLED === 'true' ||
  (process.env.NODE_ENV === 'production' && !!BOT_TOKEN);

export const botConfig = {
  BOT_TOKEN,
  ENABLED,
};