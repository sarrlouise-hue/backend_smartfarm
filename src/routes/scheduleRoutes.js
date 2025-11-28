import express from 'express';
import { createSchedule, updateSchedule, deleteSchedule } from '../controllers/scheduleController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/:kitId', protect, createSchedule);
router.put('/:kitId/:scheduleIndex', protect, updateSchedule);
router.delete('/:kitId/:scheduleIndex', protect, deleteSchedule);

export default router;
