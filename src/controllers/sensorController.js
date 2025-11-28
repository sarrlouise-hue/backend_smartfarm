import SensorData from '../models/SensorData.js';
import Kit from '../models/Kit.js';
import Notification from '../models/Notification.js';

const periodMap = { '24h': 24, '7d': 168, '30d': 720 };

export const getSensorData = async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    if (!periodMap[period]) return res.status(400).json({ error: 'Paramètre period invalide' });

    const kit = await Kit.findOne({ _id: req.params.kitId, userId: req.user.id });
    if (!kit) return res.status(404).json({ error: 'Kit non trouvé' });

    const hours = periodMap[period];
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    const data = await SensorData.find({ kitId: req.params.kitId, timestamp: { $gte: startDate } }).sort({ timestamp: -1 });
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getLatestSensorData = async (req, res) => {
  try {
    const kit = await Kit.findOne({ _id: req.params.kitId, userId: req.user.id });
    if (!kit) return res.status(404).json({ error: 'Kit non trouvé' });

    const types = ['humidity', 'temp', 'voltage', 'current'];
    const data = await Promise.all(types.map(type => SensorData.findOne({ kitId: req.params.kitId, type }).sort({ timestamp: -1 })));

    if (data.every(d => !d)) return res.status(404).json({ error: 'Aucune donnée capteur trouvée' });

    res.json({ data: data.filter(d => d) });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getSensorDataByType = async (req, res) => {
  try {
    const { type, period = '24h' } = req.query;
    if (!['humidity', 'temp', 'voltage', 'current', 'battery', 'water_level'].includes(type) || !periodMap[period]) {
      return res.status(400).json({ error: 'Type ou période invalide' });
    }

    const kit = await Kit.findOne({ _id: req.params.kitId, userId: req.user.id });
    if (!kit) return res.status(404).json({ error: 'Kit non trouvé' });

    const hours = periodMap[period];
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    const data = await SensorData.find({ kitId: req.params.kitId, type, timestamp: { $gte: startDate } }).sort({ timestamp: -1 });
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const logSensorData = async (req, res) => {
  try {
    const { deviceId, battery, waterLevel, voltage, current, temperature, humidity, pumpStatus } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId requis' });
    }

    const kit = await Kit.findOne({ deviceId });
    if (!kit) {
      return res.status(404).json({ error: 'Kit non trouvé pour ce deviceId' });
    }

    const timestamp = new Date();
    const sensorEntries = [];

    if (battery !== undefined) {
      sensorEntries.push({
        kitId: kit._id,
        deviceId,
        timestamp,
        type: 'battery',
        value: battery,
        unit: '%'
      });
      kit.batteryLevel = battery;
    }

    if (waterLevel !== undefined) {
      sensorEntries.push({
        kitId: kit._id,
        deviceId,
        timestamp,
        type: 'water_level',
        value: waterLevel,
        unit: '%'
      });
      kit.waterLevel = waterLevel;
    }

    if (voltage !== undefined) {
      sensorEntries.push({
        kitId: kit._id,
        deviceId,
        timestamp,
        type: 'voltage',
        value: voltage,
        unit: 'V'
      });
      kit.voltage = voltage;
    }

    if (current !== undefined) {
      sensorEntries.push({
        kitId: kit._id,
        deviceId,
        timestamp,
        type: 'current',
        value: current,
        unit: 'A'
      });
      kit.current = current;
    }

    if (temperature !== undefined) {
      sensorEntries.push({
        kitId: kit._id,
        deviceId,
        timestamp,
        type: 'temp',
        value: temperature,
        unit: '°C'
      });
    }

    if (humidity !== undefined) {
      sensorEntries.push({
        kitId: kit._id,
        deviceId,
        timestamp,
        type: 'humidity',
        value: humidity,
        unit: '%'
      });
    }

    if (sensorEntries.length > 0) {
      await SensorData.insertMany(sensorEntries);
    }

    if (pumpStatus !== undefined) {
      kit.pumpStatus = pumpStatus === 'ON' || pumpStatus === true;
    }

    kit.updatedAt = timestamp;
    await kit.save();

    if (battery !== undefined && battery < 20) {
      await Notification.create({
        userId: kit.userId,
        kitId: kit._id,
        title: 'Batterie faible',
        message: `Batterie du kit ${deviceId} à ${battery}%`,
        category: 'alert'
      });
    }

    if (waterLevel !== undefined && waterLevel < 10) {
      await Notification.create({
        userId: kit.userId,
        kitId: kit._id,
        title: 'Niveau eau critique',
        message: `FORBID WORKING EMPTY : niveau eau du kit ${deviceId} à ${waterLevel}%`,
        category: 'alert'
      });
    }

    res.status(201).json({
      message: 'Données enregistrées avec succès',
      count: sensorEntries.length,
      timestamp
    });
  } catch (error) {
    console.error('Log sensor data error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
