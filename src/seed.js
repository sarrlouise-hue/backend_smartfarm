import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Kit from './models/Kit.js';
import SensorData from './models/SensorData.js';
import Notification from './models/Notification.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://pndiogouniang:mess2909@cluster0.eiw5wsu.mongodb.net/smartfarm?retryWrites=true&w=majority&appName=Cluster0';

async function seed() {
  try {
    console.log('\n🌱 Début du seeding des données de test AGRO BOOST...\n');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('\n🗑️  Nettoyage des données existantes...');
    await User.deleteMany({});
    await Kit.deleteMany({});
    await SensorData.deleteMany({});
    await Notification.deleteMany({});
    console.log('✅ Données nettoyées');

    console.log('\n1️⃣ Création utilisateur test...');
    const testPassword = await bcrypt.hash('1234', 10);
    const user = await User.create({
      username: 'test@agroboost.com',
      passwordHash: testPassword,
      kits: []
    });
    console.log('✅ Utilisateur créé:', user.username);
    console.log('   ID:', user._id);

    console.log('\n2️⃣ Création kit solaire test...');
    const kit = await Kit.create({
      deviceId: 'ESP32-AGRO-001',
      userId: user._id,
      pumpStatus: false,
      batteryLevel: 85.5,
      waterLevel: 92.0,
      voltage: 276.8,
      current: 0.0,
      location: 'Champ Nord',
      irrigationSchedules: [
        {
          startTime: new Date('2025-11-26T06:00:00Z'),
          durationMinutes: 30,
          daysOfWeek: ['L', 'M', 'M', 'J', 'V'],
          thresholdHumidity: 35.0,
          isActive: true
        },
        {
          startTime: new Date('2025-11-26T18:00:00Z'),
          durationMinutes: 20,
          daysOfWeek: ['L', 'M', 'V'],
          thresholdHumidity: null,
          isActive: true
        }
      ]
    });
    console.log('✅ Kit créé:', kit.deviceId);
    console.log('   ID:', kit._id);
    console.log('   Batterie:', kit.batteryLevel + '%');
    console.log('   Eau:', kit.waterLevel + '%');
    console.log('   Schedules:', kit.irrigationSchedules.length);

    user.kits.push(kit._id);
    await user.save();

    console.log('\n3️⃣ Création données capteurs (dernières 24h)...');
    const sensorData = [];
    const now = new Date();

    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);

      sensorData.push(
        {
          kitId: kit._id,
          deviceId: kit.deviceId,
          timestamp,
          type: 'humidity',
          value: 40 + Math.random() * 20,
          unit: '%'
        },
        {
          kitId: kit._id,
          deviceId: kit.deviceId,
          timestamp,
          type: 'temp',
          value: 25 + Math.random() * 10,
          unit: '°C'
        },
        {
          kitId: kit._id,
          deviceId: kit.deviceId,
          timestamp,
          type: 'voltage',
          value: 270 + Math.random() * 10,
          unit: 'V'
        },
        {
          kitId: kit._id,
          deviceId: kit.deviceId,
          timestamp,
          type: 'current',
          value: Math.random() * 2,
          unit: 'A'
        },
        {
          kitId: kit._id,
          deviceId: kit.deviceId,
          timestamp,
          type: 'battery',
          value: 80 + Math.random() * 10,
          unit: '%'
        },
        {
          kitId: kit._id,
          deviceId: kit.deviceId,
          timestamp,
          type: 'water_level',
          value: 85 + Math.random() * 10,
          unit: '%'
        }
      );
    }

    await SensorData.insertMany(sensorData);
    console.log('✅ Données capteurs créées:', sensorData.length);

    console.log('\n4️⃣ Création notifications test...');
    const notifications = await Notification.create([
      {
        userId: user._id,
        kitId: kit._id,
        title: 'Kit connecté',
        message: 'Le kit ESP32-AGRO-001 est maintenant connecté',
        category: 'success',
        isRead: false
      },
      {
        userId: user._id,
        kitId: kit._id,
        title: 'Irrigation programmée',
        message: 'Nouveau créneau d\'irrigation créé pour 6h00',
        category: 'info',
        isRead: false
      }
    ]);
    console.log('✅ Notifications créées:', notifications.length);

    console.log('\n' + '='.repeat(60));
    console.log('✅ SEEDING TERMINÉ AVEC SUCCÈS!');
    console.log('='.repeat(60));
    console.log('\n📋 DONNÉES DE TEST CRÉÉES:\n');
    console.log('👤 Utilisateur:');
    console.log('   Email: test@agroboost.com');
    console.log('   Password: 1234');
    console.log('   User ID:', user._id.toString());
    console.log('\n🔧 Kit:');
    console.log('   Device ID: ESP32-AGRO-001');
    console.log('   Kit ID:', kit._id.toString());
    console.log('   Batterie: 85.5%');
    console.log('   Eau: 92%');
    console.log('\n📊 Données:');
    console.log('   - 2 schedules irrigation');
    console.log('   - 144 mesures capteurs (24h)');
    console.log('   - 2 notifications');
    console.log('\n🚀 PRÊT POUR TESTS POSTMAN!');
    console.log('\n1. POST /api/auth/login');
    console.log('   Body: {"username": "test@agroboost.com", "passwordHash": "1234"}');
    console.log('\n2. Copier le token JWT');
    console.log('\n3. Tester tous les autres endpoints avec le token\n');

    await mongoose.disconnect();
    console.log('✅ Déconnecté de MongoDB\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERREUR:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
