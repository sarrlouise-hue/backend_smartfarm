import express from 'express';
import { getSensorData, getLatestSensorData, getSensorDataByType, logSensorData } from '../controllers/sensorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/log', logSensorData);
router.get('/:kitId', protect, getSensorData);
router.get('/:kitId/latest', protect, getLatestSensorData);
router.get('/:kitId/type', protect, getSensorDataByType);

export default router;
