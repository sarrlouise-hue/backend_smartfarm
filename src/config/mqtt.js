import aedes from 'aedes';
import { createServer } from 'net';
import Kit from '../models/Kit.js';
import SensorData from '../models/SensorData.js';
import Notification from '../models/Notification.js';

const MQTT_PORT = process.env.MQTT_PORT || 1883;
const BATTERY_MIN_THRESHOLD = 20;
const WATER_MIN_THRESHOLD = 10;

const broker = aedes();
const server = createServer(broker.handle);

broker.on('client', (client) => {
  console.log(`📡 MQTT Client connected: ${client.id}`);
});

broker.on('clientDisconnect', (client) => {
  console.log(`📡 MQTT Client disconnected: ${client.id}`);
});

broker.on('publish', async (packet, client) => {
  if (!client) return;
  
  const topic = packet.topic;
  
  try {
    if (topic.startsWith('agroboost/sensors/')) {
      await handleSensorData(topic, packet.payload);
    } else if (topic.startsWith('agroboost/lorawan/')) {
      await handleLoRaWANData(topic, packet.payload);
    }
  } catch (error) {
    console.error('❌ MQTT publish error:', error.message);
  }
});

async function handleSensorData(topic, payload) {
  try {
    const data = JSON.parse(payload.toString());
    const { deviceId, battery, waterLevel, voltage, current, temperature, humidity, pumpStatus } = data;

    if (!deviceId) {
      console.error('❌ Missing deviceId in sensor data');
      return;
    }

    const kit = await Kit.findOne({ deviceId });
    if (!kit) {
      console.error(`❌ Kit not found for deviceId: ${deviceId}`);
      return;
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

      if (battery < BATTERY_MIN_THRESHOLD) {
        await Notification.create({
          userId: kit.userId,
          kitId: kit._id,
          title: 'Batterie faible (MQTT)',
          message: `Batterie du kit ${deviceId} à ${battery}% (MQTT)`,
          category: 'alert'
        });
        console.log(`⚠️  Low battery alert: ${deviceId} - ${battery}%`);
      }
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

      if (waterLevel < WATER_MIN_THRESHOLD) {
        await Notification.create({
          userId: kit.userId,
          kitId: kit._id,
          title: 'Niveau eau critique (MQTT)',
          message: `FORBID WORKING EMPTY: niveau eau ${deviceId} à ${waterLevel}% (MQTT)`,
          category: 'alert'
        });
        console.log(`⚠️  Low water alert: ${deviceId} - ${waterLevel}%`);
      }
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

    console.log(`✅ MQTT sensor data saved: ${deviceId} (${sensorEntries.length} entries)`);

  } catch (error) {
    console.error('❌ Error handling sensor data:', error.message);
  }
}

async function handleLoRaWANData(topic, payload) {
  try {
    const data = JSON.parse(payload.toString());
    
    if (data.uplink_message && data.end_device_ids) {
      const deviceId = data.end_device_ids.device_id;
      const decodedPayload = data.uplink_message.decoded_payload;

      await handleSensorData(topic, JSON.stringify({
        deviceId,
        ...decodedPayload
      }));

      console.log(`✅ LoRaWAN data processed: ${deviceId}`);
    }
  } catch (error) {
    console.error('❌ Error handling LoRaWAN data:', error.message);
  }
}

export function publishPumpCommand(deviceId, status) {
  const topic = `agroboost/pump/${deviceId}/control`;
  const message = JSON.stringify({
    command: status ? 'ON' : 'OFF',
    timestamp: new Date().toISOString()
  });

  broker.publish({
    topic,
    payload: Buffer.from(message),
    qos: 1,
    retain: false
  }, (err) => {
    if (err) {
      console.error(`❌ Failed to publish pump command: ${err.message}`);
    } else {
      console.log(`✅ Pump command published: ${deviceId} -> ${status ? 'ON' : 'OFF'}`);
    }
  });
}

export function startMQTTBroker() {
  server.listen(MQTT_PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📡 MQTT Broker started - AGRO BOOST');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🌐 Port: ${MQTT_PORT}`);
    console.log('📊 Topics:');
    console.log('   SUB  agroboost/sensors/{deviceId}     - Sensor data');
    console.log('   SUB  agroboost/lorawan/{deviceId}     - LoRaWAN TTN/Chirpstack');
    console.log('   PUB  agroboost/pump/{deviceId}/control - Pump commands');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  });

  server.on('error', (err) => {
    console.error('❌ MQTT Server error:', err.message);
  });
}

export default broker;
