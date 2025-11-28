import Kit from '../models/Kit.js';

export const getAllKits = async (req, res) => {
  try {
    const kits = await Kit.find({ userId: req.user.id });
    res.json({ kits });
  } catch (error) {
    res.status(500).json({ error: 'Impossible de récupérer les kits' });
  }
};

export const getKitById = async (req, res) => {
  try {
    const kit = await Kit.findOne({ _id: req.params.kitId, userId: req.user.id });
    if (!kit) return res.status(404).json({ error: 'Kit non trouvé' });
    res.json(kit);
  } catch (error) {
    res.status(500).json({ error: 'Impossible de récupérer le kit' });
  }
};
