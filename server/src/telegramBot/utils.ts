import { Telegraf } from 'telegraf';

export const downloadPhoto = async (bot: Telegraf, fileId: string): Promise<Buffer> => {
  const fileLink = await bot.telegram.getFileLink(fileId);
  const response = await fetch(fileLink.href);
  return Buffer.from(await response.arrayBuffer());
};

export const bufferToDataUri = (buffer: Buffer, mimeType: string = 'image/jpeg'): string => {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
};