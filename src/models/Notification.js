import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  kitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kit'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['info', 'success', 'warning', 'alert', 'error'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  actionLabel: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

notificationSchema.index({ userId: 1, timestamp: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
