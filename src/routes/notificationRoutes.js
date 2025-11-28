import express from 'express';
import { getAllNotifications, markAsRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getAllNotifications);
router.patch('/:notifId/read', protect, markAsRead);

export default router;
