import mongoose from 'mongoose';

const irrigationScheduleSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 1
  },
  daysOfWeek: {
    type: [String],
    default: []
  },
  thresholdHumidity: {
    type: Number,
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const kitSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pumpStatus: {
    type: Boolean,
    default: false
  },
  batteryLevel: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  waterLevel: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  voltage: {
    type: Number,
    default: 0
  },
  current: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    default: ''
  },
  irrigationSchedules: [irrigationScheduleSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

kitSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Kit = mongoose.model('Kit', kitSchema);

export default Kit;
