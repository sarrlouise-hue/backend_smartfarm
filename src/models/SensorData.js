import mongoose from 'mongoose';

const sensorDataSchema = new mongoose.Schema({
  kitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kit',
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    required: true,
    enum: ['humidity', 'temp', 'voltage', 'current', 'battery', 'water_level']
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  }
});

sensorDataSchema.index({ kitId: 1, timestamp: -1, type: 1 });

const SensorData = mongoose.model('SensorData', sensorDataSchema);

export default SensorData;
