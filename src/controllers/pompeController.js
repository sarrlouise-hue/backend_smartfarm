import Kit from '../models/Kit.js';
import Notification from '../models/Notification.js';
import { publishPumpCommand } from '../config/mqtt.js';

const BATTERY_MIN_THRESHOLD = 20;
const WATER_MIN_THRESHOLD = 10;

export const controlPump = async (req, res) => {
  try {
    const { status } = req.body;
    const kit = await Kit.findOne({ _id: req.params.kitId, userId: req.user.id });

    if (!kit) return res.status(404).json({ error: 'Kit non trouvé' });

    if (status && kit.batteryLevel < BATTERY_MIN_THRESHOLD) {
      await Notification.create({
        userId: req.user.id,
        kitId: kit._id,
        title: 'Batterie faible',
        message: `Impossible d'allumer la pompe : batterie à ${kit.batteryLevel}% (minimum ${BATTERY_MIN_THRESHOLD}%)`,
        category: 'alert'
      });
      return res.status(400).json({ error: 'Impossible d\'allumer la pompe : batterie trop faible' });
    }

    if (status && kit.waterLevel < WATER_MIN_THRESHOLD) {
      await Notification.create({
        userId: req.user.id,
        kitId: kit._id,
        title: 'Niveau eau critique',
        message: `FORBID WORKING EMPTY : niveau eau à ${kit.waterLevel}% (minimum ${WATER_MIN_THRESHOLD}%)`,
        category: 'alert'
      });
      return res.status(400).json({ error: 'FORBID WORKING EMPTY : niveau d\'eau insuffisant' });
    }

    kit.pumpStatus = status;
    kit.updatedAt = Date.now();
    await kit.save();

    publishPumpCommand(kit.deviceId, status);

    await Notification.create({
      userId: req.user.id,
      kitId: kit._id,
      title: status ? 'Pompe activée' : 'Pompe désactivée',
      message: `La pompe a été ${status ? 'activée' : 'désactivée'} manuellement (MQTT publié)`,
      category: 'success'
    });

    res.json(kit);
  } catch (error) {
    console.error('Control pump error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
