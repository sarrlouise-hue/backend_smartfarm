# AGRO BOOST - Backend API + MQTT

Backend complet pour AGRO BOOST avec:
- ✅ **REST API** (17 endpoints)
- ✅ **MQTT Broker** intégré (LoRaWAN compatible)
- ✅ **MongoDB Atlas**
- ✅ **JWT Authentication**

## 🚀 Installation (3 commandes)

```bash
npm install          # Installer dépendances
npm run seed        # Créer données test
npm start           # Démarrer serveur
```

**Serveurs démarrés:**
- REST API: `http://localhost:3000`
- MQTT Broker: `localhost:1883`
- MongoDB: Atlas (smartfarm database)

## 📡 Architecture Complète

```
┌─────────────────── AGRO BOOST Backend ───────────────────┐
│                                                            │
│  REST API (3000)  ◄──► MongoDB Atlas ◄──► MQTT (1883)   │
│                                                            │
└────────────────────────────────────────────────────────────┘
         │                                      │
    Mobile App                            ESP32 + LoRaWAN
```

## 🗄️ REST API (17 Endpoints)

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/register`

### Kits Solaires
- `GET /api/kits`
- `GET /api/kits/:kitId`

### Contrôle Pompe (avec MQTT publish)
- `POST /api/pompes/:kitId/control`

### Programmation Irrigation
- `POST /api/schedules/:kitId`
- `PUT /api/schedules/:kitId/:index`
- `DELETE /api/schedules/:kitId/:index`

### Capteurs IoT
- `GET /api/sensors/:kitId?period=24h`
- `GET /api/sensors/:kitId/latest`
- `GET /api/sensors/:kitId/type?type=humidity`
- `POST /api/sensors/log` (PUBLIC - ESP32)

### Notifications
- `GET /api/notifications`
- `PATCH /api/notifications/:notifId/read`

## 📡 MQTT Broker

### Topics

1. **Sensor Data** (Subscribe)
   - Topic: `agroboost/sensors/{deviceId}`
   - ESP32 publie données capteurs
   - Auto-sauvegarde MongoDB
   - Alertes automatiques

2. **LoRaWAN** (Subscribe)
   - Topic: `agroboost/lorawan/{deviceId}`
   - Compatible TTN/Chirpstack
   - Conversion automatique

3. **Pump Control** (Publish)
   - Topic: `agroboost/pump/{deviceId}/control`
   - Publié quand utilisateur contrôle pompe via API
   - ESP32 s'abonne pour recevoir commandes

### Exemple ESP32

```cpp
#include <PubSubClient.h>

// Publier sensor data
client.publish("agroboost/sensors/ESP32-AGRO-001", 
  "{\"deviceId\":\"ESP32-AGRO-001\",\"battery\":85,\"waterLevel\":92}");

// Recevoir commandes pompe
client.subscribe("agroboost/pump/ESP32-AGRO-001/control");
```

## 🧪 Test Rapide

### 1. Démarrer

```bash
npm run seed    # Crée user: test@agroboost.com / 1234
npm start       # Démarre REST + MQTT
```

### 2. Login Postman

```bash
POST http://localhost:3000/api/auth/login
Body: {"username": "test@agroboost.com", "passwordHash": "1234"}
```

### 3. Test MQTT

```bash
# Installer mosquitto
sudo apt install mosquitto-clients

# Publier sensor data
mosquitto_pub -h localhost -p 1883 \
  -t "agroboost/sensors/ESP32-AGRO-001" \
  -m '{"deviceId":"ESP32-AGRO-001","battery":85,"waterLevel":92,"voltage":276,"current":0,"temperature":28,"humidity":76}'

# Écouter commandes pompe
mosquitto_sub -h localhost -p 1883 \
  -t "agroboost/pump/ESP32-AGRO-001/control"
```

### 4. Contrôler pompe via API

```bash
POST http://localhost:3000/api/pompes/{kitId}/control
Headers: Authorization: Bearer {token}
Body: {"status": true}

# La commande est publiée automatiquement sur MQTT!
```

## 💧 Sécurité Pompe Likou 4PSS17.0

**⚠️ FORBID WORKING EMPTY**

Validations automatiques:
- Batterie ≥ 20%
- Eau ≥ 10%
- Notifications auto si problème
- Logs complets

**Specs:**
- 280V DC / 2200W / 8A
- Débit: 17.2 m³/h
- Hauteur: 110m

## 🌐 LoRaWAN (TTN/Chirpstack)

Le broker MQTT accepte les payloads TTN directement:

```json
{
  "end_device_ids": {
    "device_id": "ESP32-AGRO-001"
  },
  "uplink_message": {
    "decoded_payload": {
      "battery": 85,
      "waterLevel": 92
    }
  }
}
```

Configuration TTN → Integrations → MQTT:
- Server: `VOTRE_SERVEUR`
- Port: `1883`
- Topic: `agroboost/lorawan/{device_id}`

## 📊 Données de Test

Après `npm run seed`:

```
👤 User: test@agroboost.com / 1234
🔧 Kit: ESP32-AGRO-001 (85% batt, 92% eau)
📊 Data: 144 mesures (24h) + 2 schedules + 2 notifs
```

## ⚙️ Configuration (.env)

```env
# Serveur
PORT=3000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=your_secret_key

# MQTT
MQTT_ENABLED=true
MQTT_PORT=1883

# Sécurité Pompe
PUMP_MIN_BATTERY_LEVEL=20
PUMP_MIN_WATER_LEVEL=10
```

## 📚 Documentation

- **README.md** - Ce fichier (démarrage)
- **MQTT_LORAWAN_GUIDE.md** - Guide complet MQTT/LoRaWAN + code ESP32
- **API_DOCUMENTATION.md** - Specs REST API complètes
- **GUIDE_TEST_POSTMAN.md** - Guide tests Postman
- **AGROBOOST_Postman_Collection.json** - Collection prête

## 🚀 Déploiement Production

### Railway

```bash
git push origin main
```

Variables env Railway:
- `MONGODB_URI`
- `JWT_SECRET`
- `MQTT_ENABLED=true`
- `MQTT_PORT=1883`

MongoDB Atlas fonctionne directement (déjà cloud).

## 🎯 Fonctionnalités Clés

### REST API
- ✅ 17 endpoints fonctionnels
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ CORS configuré
- ✅ Validations sécurité pompe

### MQTT Broker
- ✅ Port 1883 (configurable)
- ✅ Sensor data auto-save
- ✅ LoRaWAN TTN/Chirpstack compatible
- ✅ Pump control publish
- ✅ Alertes batterie/eau automatiques
- ✅ Logs complets

### MongoDB
- ✅ 4 collections optimisées
- ✅ Index pour performances
- ✅ Seed script données test

## 🐛 Troubleshooting

### MQTT ne démarre pas
```bash
# Vérifier port disponible
sudo lsof -i :1883

# Changer port si nécessaire
# .env: MQTT_PORT=1884
```

### ESP32 ne connecte pas
1. Vérifier IP serveur
2. Ping depuis ESP32
3. Firewall ouvert port 1883
4. MQTT_ENABLED=true dans .env

### Voir documentation complète
```bash
cat MQTT_LORAWAN_GUIDE.md
```

---

**Version**: 1.0.0
**Stack**: Node.js + Express + MongoDB Atlas + MQTT (Aedes)
**IoT**: ESP32 + LoRaWAN (TTN/Chirpstack)
**Pompe**: Likou 4PSS17.0 (280V DC, 2200W)
**Status**: ✅ PRODUCTION READY avec MQTT
