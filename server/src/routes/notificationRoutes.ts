import express from 'express';
import { notificationController } from '../controllers/notificationController';
import { isLoggedIn } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', isLoggedIn, notificationController.getNotifications);
router.patch('/:id/read', isLoggedIn, notificationController.markAsRead);
router.patch('/read-all', isLoggedIn, notificationController.markAllAsRead);

export default router;
