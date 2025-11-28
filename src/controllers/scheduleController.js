import Kit from '../models/Kit.js';

export const createSchedule = async (req, res) => {
  try {
    const { startTime, durationMinutes, thresholdHumidity, daysOfWeek } = req.body;
    if (!startTime || !durationMinutes) {
      return res.status(400).json({ error: 'Données invalides pour la création du schedule' });
    }

    const kit = await Kit.findOne({ _id: req.params.kitId, userId: req.user.id });
    if (!kit) return res.status(404).json({ error: 'Kit non trouvé' });

    kit.irrigationSchedules.push({ startTime, durationMinutes, thresholdHumidity, daysOfWeek, isActive: true });
    kit.updatedAt = Date.now();
    await kit.save();

    res.json(kit);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const kit = await Kit.findOne({ _id: req.params.kitId, userId: req.user.id });
    if (!kit) return res.status(404).json({ error: 'Kit non trouvé' });

    const index = parseInt(req.params.scheduleIndex);
    if (!kit.irrigationSchedules[index]) {
      return res.status(404).json({ error: 'Schedule non trouvé' });
    }

    Object.assign(kit.irrigationSchedules[index], req.body);
    kit.updatedAt = Date.now();
    await kit.save();

    res.json(kit);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const kit = await Kit.findOne({ _id: req.params.kitId, userId: req.user.id });
    if (!kit) return res.status(404).json({ error: 'Kit non trouvé' });

    const index = parseInt(req.params.scheduleIndex);
    if (!kit.irrigationSchedules[index]) {
      return res.status(404).json({ error: 'Schedule non trouvé' });
    }

    kit.irrigationSchedules.splice(index, 1);
    kit.updatedAt = Date.now();
    await kit.save();

    res.json(kit);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
