import Notification from '../models/Notification.js';

export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ timestamp: -1 });

    const formattedNotifications = notifications.map(n => ({
      id: n._id,
      title: n.title,
      message: n.message,
      timestamp: n.timestamp,
      category: n.category,
      isRead: n.isRead,
      kitId: n.kitId,
      actionLabel: n.actionLabel
    }));

    res.json({ notifications: formattedNotifications });
  } catch (error) {
    res.status(500).json({ error: 'Impossible de récupérer les notifications' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notifId, userId: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) return res.status(404).json({ error: 'Notification non trouvée' });

    res.json({
      id: notification._id,
      title: notification.title,
      message: notification.message,
      timestamp: notification.timestamp,
      category: notification.category,
      isRead: notification.isRead,
      kitId: notification.kitId,
      actionLabel: notification.actionLabel
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
