import cron from 'node-cron';
import { userRepository } from '../repositories/userRepository'; 

// Every 10 minutes the server will delete unverified accounts
cron.schedule('*/10 * * * *', async () => {
  console.log('Deleting unverified users...');
  
  try {
    await userRepository.deleteUnverifiedUsers();
    console.log('Cleanup completed.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
});