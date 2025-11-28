import express from 'express';
import { controlPump } from '../controllers/pompeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/:kitId/control', protect, controlPump);

export default router;
