import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });

export const login = async (req, res) => {
  try {
    const { username, passwordHash } = req.body;
    const user = await User.findOne({ username }).populate('kits');

    if (!user || !(await bcrypt.compare(passwordHash, user.passwordHash))) {
      return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }

    const token = generateToken(user._id);
    res.json({ token, user: { _id: user._id, username: user.username, kits: user.kits.map(k => k._id) } });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const register = async (req, res) => {
  try {
    const { username, passwordHash } = req.body;

    if (await User.findOne({ username })) {
      return res.status(400).json({ error: 'Nom d\'utilisateur déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(passwordHash, 10);
    const user = await User.create({ username, passwordHash: hashedPassword, kits: [] });
    const token = generateToken(user._id);

    res.json({ token, user: { _id: user._id, username: user.username, kits: [] } });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
