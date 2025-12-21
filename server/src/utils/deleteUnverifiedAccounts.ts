import cron from 'node-cron';
import { userRepository } from '../repositories/userRepository'; 

// Every 10 minutes the server will delete unverified accounts and clear expired telegram link codes
cron.schedule('*/10 * * * *', async () => {
  console.log('Running cleanup tasks...');
  
  try {
    await userRepository.deleteUnverifiedUsers();
    console.log('Deleted unverified users.');
    
    await userRepository.clearExpiredTelegramLinkCodes();
    console.log('Cleared expired Telegram link codes.');
    
    console.log('Cleanup completed.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
});