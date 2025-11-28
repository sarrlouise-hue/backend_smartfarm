import express from 'express';
import { getAllKits, getKitById } from '../controllers/kitController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/', getAllKits);
router.get('/:kitId', getKitById);

export default router;
