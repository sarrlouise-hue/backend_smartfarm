# 📁 STRUCTURE DU PROJET - AGRO BOOST BACKEND

## 🎯 Vue d'ensemble

Backend complet pour système d'irrigation solaire AGRO BOOST avec contrôle IoT via ESP32/LoRaWAN pour pompe Likou 4PSS17.0 (2200W, 280V DC).

```
backend/
├── src/
│   ├── config/
│   │   └── database.js                 # Configuration MongoDB Atlas
│   ├── models/
│   │   ├── User.js                     # Modèle utilisateur
│   │   ├── Kit.js                      # Modèle kit solaire + schedules
│   │   ├── SensorData.js               # Données capteurs IoT
│   │   └── Notification.js             # Système notifications
│   ├── controllers/
│   │   ├── authController.js           # Login/Register
│   │   ├── kitController.js            # Gestion kits
│   │   ├── pompeController.js          # Contrôle pompe (safety checks)
│   │   ├── scheduleController.js       # Programmation irrigation
│   │   ├── sensorController.js         # Endpoints capteurs + ESP32
│   │   └── notificationController.js   # Gestion notifications
│   ├── middleware/
│   │   └── auth.js                     # Protection JWT
│   ├── routes/
│   │   ├── authRoutes.js               # /api/auth
│   │   ├── kitRoutes.js                # /api/kits
│   │   ├── pompeRoutes.js              # /api/pompes
│   │   ├── scheduleRoutes.js           # /api/schedules
│   │   ├── sensorRoutes.js             # /api/sensors
│   │   └── notificationRoutes.js       # /api/notifications
│   └── server.js                       # Point d'entrée Express
├── .env                                # Configuration production
├── .env.example                        # Template configuration
├── package.json                        # Dépendances Node.js
├── API_DOCUMENTATION_COMPLETE.md       # Documentation API complète
├── AGROBOOST_Postman_Collection.json   # Tests Postman
├── README.md                           # Guide démarrage
└── STRUCTURE_PROJET.md                 # Ce fichier
```

---

## 🗄️ BASE DE DONNÉES - MongoDB Atlas

### Configuration
**Connection String:**
```
mongodb+srv://sarrlouise_db_user:<db_password>@cluster0.mh7bpkc.mongodb.net/?appName=Cluster0
```

**Database:** `agroboost`

### Collections

#### 1️⃣ users
```javascript
{
  _id: ObjectId,
  username: String (unique),        // Email utilisateur
  passwordHash: String,             // bcrypt hash
  kits: [ObjectId],                 // Références aux kits
  createdAt: Date
}
```

#### 2️⃣ kits
```javascript
{
  _id: ObjectId,
  deviceId: String (unique),        // ESP32-AGRO-001
  userId: ObjectId,                 // Propriétaire
  pumpStatus: Boolean,              // État pompe
  batteryLevel: Number,             // Niveau batterie (%)
  location: String,
  irrigationSchedules: [
    {
      startTime: Date,              // Heure début
      durationMinutes: Number,      // Durée irrigation
      daysOfWeek: [String],         // ['L','M','Me','J','V','S','D']
      thresholdHumidity: Number,    // Seuil humidité (%)
      isActive: Boolean,
      createdAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

#### 3️⃣ sensordatas
```javascript
{
  _id: ObjectId,
  kitId: ObjectId,
  deviceId: String,                 // ESP32-AGRO-001
  timestamp: Date,
  type: String,                     // 'humidity' | 'temp' | 'voltage' | 'current'
  value: Number,
  unit: String                      // '%' | '°C' | 'V' | 'A'
}
```
**Index:** `{ kitId: 1, timestamp: -1, type: 1 }`

#### 4️⃣ notifications
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  kitId: ObjectId,
  title: String,
  message: String,
  category: String,                 // 'info' | 'success' | 'warning' | 'alert' | 'error'
  isRead: Boolean,
  actionLabel: String,
  timestamp: Date
}
```
**Index:** `{ userId: 1, timestamp: -1 }`

---

## 🔐 AUTHENTIFICATION

**Système:** JWT (JSON Web Tokens)
**Durée:** 7 jours
**Hash:** bcrypt (10 rounds)

### Endpoints
```
POST /api/auth/register  → Création compte
POST /api/auth/login     → Connexion
```

### Middleware `auth.js`
```javascript
// Protection routes
const auth = (req, res, next) => {
  // Vérifie token JWT dans Authorization: Bearer <token>
  // Décode userId → req.user.id
}
```

---

## 🔧 ROUTES API

### Base URL: `http://localhost:3000/api`

| Route | Méthode | Auth | Description |
|-------|---------|------|-------------|
| `/auth/login` | POST | ❌ | Connexion utilisateur |
| `/auth/register` | POST | ❌ | Création compte |
| `/kits` | GET | ✅ | Liste kits utilisateur |
| `/kits/:kitId` | GET | ✅ | Détails kit |
| `/pompes/:kitId/control` | POST | ✅ | ON/OFF pompe |
| `/schedules/:kitId` | POST | ✅ | Créer créneau |
| `/schedules/:kitId/:index` | PUT | ✅ | Modifier créneau |
| `/schedules/:kitId/:index` | DELETE | ✅ | Supprimer créneau |
| `/sensors/:kitId` | GET | ✅ | Données période |
| `/sensors/:kitId/latest` | GET | ✅ | Dernières valeurs |
| `/sensors/:kitId/type` | GET | ✅ | Filtrer par type |
| `/sensors/log` | POST | ❌ | ESP32 → Backend |
| `/notifications` | GET | ✅ | Liste notifications |
| `/notifications/:id/read` | PATCH | ✅ | Marquer lu |

---

## 💧 CONTRÔLE POMPE - Sécurité

### Caractéristiques Pompe Likou 4PSS17.0
```
Modèle:    4PSS17.0 / 100-280 / 2200-H
Type:      AC/DC Hybrid Solar Pump
Voltage:   280V DC
Puissance: 2200W
Débit:     17.2 m³/h
Hauteur:   110m
Sortie:    2 pouces
```

### ⚠️ RÈGLES DE SÉCURITÉ
```javascript
// FORBID WORKING EMPTY - NE JAMAIS FONCTIONNER À VIDE
if (pumpStatus === true) {
  if (batteryLevel < 20) {
    return error('Batterie trop faible');
  }
  if (waterLevel < 10) {
    return error('Niveau d\'eau insuffisant');
  }
}
```

### Architecture IoT
```
[ESP32/LoRaWAN]
     ↓
[Relais 12V/24V] → [Contrôleur Hybride] → [Pompe 280V DC]
     ↓                    ↓
[Dry Contact]     [Remote Control Input]
```

**❌ INTERDIT:** Contrôler directement la pompe 280V avec relais ESP32
**✅ CORRECT:** Contrôler l'entrée basse tension du contrôleur hybride

---

## 📡 INTÉGRATION IoT ESP32/LoRaWAN

### Endpoint Data Logging
```http
POST /api/sensors/log
Content-Type: application/json

{
  "deviceId": "ESP32-AGRO-001",
  "battery": 82,
  "waterLevel": 76,
  "voltage": 12.58,
  "current": 2.3,
  "temperature": 28.5,
  "humidity": 76,
  "pumpStatus": "ON"
}
```

### Traitement Backend
1. Trouve le kit via `deviceId`
2. Crée 4 `SensorData` (humidity, temp, voltage, current)
3. Met à jour `kit.batteryLevel` et `kit.pumpStatus`
4. Retourne confirmation

### Code ESP32 (Exemple)
```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* serverUrl = "http://your-server.com/api/sensors/log";
const char* deviceId = "ESP32-AGRO-001";

void sendSensorData() {
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  String payload = "{";
  payload += "\"deviceId\":\"" + String(deviceId) + "\",";
  payload += "\"battery\":" + String(batteryLevel) + ",";
  payload += "\"waterLevel\":" + String(waterLevel) + ",";
  payload += "\"voltage\":" + String(voltage) + ",";
  payload += "\"current\":" + String(current) + ",";
  payload += "\"temperature\":" + String(temp) + ",";
  payload += "\"humidity\":" + String(humidity) + ",";
  payload += "\"pumpStatus\":\"" + String(pumpOn ? "ON" : "OFF") + "\"";
  payload += "}";

  int httpCode = http.POST(payload);
  http.end();
}
```

---

## 📅 PROGRAMMATION IRRIGATION

### Fonctionnalités
- **Créneaux multiples** par kit
- **Jours de la semaine** : L, M, Me, J, V, S, D
- **Durée** : en minutes
- **Seuil humidité** : irrigation conditionnelle

### Exemple Schedule
```json
{
  "startTime": "2025-11-26T06:00:00Z",
  "durationMinutes": 30,
  "daysOfWeek": ["L", "M", "Me", "J", "V"],
  "thresholdHumidity": 35.0,
  "isActive": true
}
```

**Logique:**
- Si `thresholdHumidity` défini → irrigation uniquement si humidité < seuil
- Sinon → irrigation automatique selon horaire

---

## 🔔 SYSTÈME NOTIFICATIONS

### Catégories
- `info` : Informations générales
- `success` : Actions réussies
- `warning` : Avertissements
- `alert` : Alertes critiques
- `error` : Erreurs système

### Déclencheurs Automatiques
```javascript
// Batterie faible
if (batteryLevel < 20) {
  createNotification({
    title: 'Batterie faible',
    message: `Niveau: ${batteryLevel}%`,
    category: 'alert'
  });
}

// Pompe activée/désactivée
createNotification({
  title: pumpStatus ? 'Pompe activée' : 'Pompe désactivée',
  category: 'success'
});
```

---

## 🚀 DÉMARRAGE

### 1. Installation
```bash
cd backend
npm install
```

### 2. Configuration
```bash
# Copier .env.example → .env
cp .env.example .env

# Éditer .env
nano .env
```

**Variables critiques:**
```env
MONGODB_URI=mongodb+srv://sarrlouise_db_user:<db_password>@cluster0.mh7bpkc.mongodb.net/?appName=Cluster0
DB_PASSWORD=VOTRE_MOT_DE_PASSE_ICI
JWT_SECRET=votre_secret_jwt_32_caracteres_minimum
```

### 3. Démarrage
```bash
# Développement
npm run dev

# Production
npm start
```

### 4. Tests Postman
```bash
# Importer AGROBOOST_Postman_Collection.json
# Configurer variables:
# - base_url: http://localhost:3000/api
# - Exécuter "Register" puis "Login"
# - Token JWT auto-sauvegardé
```

---

## 🛡️ SÉCURITÉ

### Mesures Implémentées
✅ **JWT** : Authentification sécurisée
✅ **bcrypt** : Hash passwords (10 rounds)
✅ **Helmet** : Headers HTTP sécurisés
✅ **CORS** : Configuration origins
✅ **Rate Limiting** : 100 req/15min
✅ **Validation** : Tous les inputs
✅ **Pump Safety** : Vérifications batterie/eau

### Validations Pompe
```javascript
// Avant allumage
const MIN_BATTERY = 20;  // %
const MIN_WATER = 10;    // %

if (status === true) {
  if (battery < MIN_BATTERY) throw Error('Batterie faible');
  if (water < MIN_WATER) throw Error('Eau insuffisante');
}
```

---

## 📊 MONITORING

### Logs Serveur
```bash
# Console logs
✅ MongoDB Atlas connected - AGRO BOOST
📊 Database: agroboost
🚀 Server running on port 3000
```

### Données Capteurs
```javascript
// Périodes disponibles
'24h'  → Dernières 24 heures
'7d'   → 7 derniers jours
'30d'  → 30 derniers jours
```

### Types Capteurs
```javascript
'humidity'  → Humidité sol (%)
'temp'      → Température (°C)
'voltage'   → Voltage batterie (V)
'current'   → Courant (A)
```

---

## 🔧 MAINTENANCE

### Commandes NPM
```bash
npm start        # Production
npm run dev      # Développement (nodemon)
npm run build    # Vérification build
```

### Nettoyage Données
```javascript
// Supprimer anciennes données capteurs (> 30 jours)
SensorData.deleteMany({
  timestamp: { $lt: new Date(Date.now() - 30*24*60*60*1000) }
});
```

### Backup MongoDB
```bash
# Via MongoDB Compass ou CLI
mongodump --uri="mongodb+srv://..." --db=agroboost --out=./backup
```

---

## 📖 DOCUMENTATION

### Fichiers Disponibles
1. **README.md** → Guide démarrage rapide
2. **API_DOCUMENTATION_COMPLETE.md** → Specs API détaillées + exemples
3. **STRUCTURE_PROJET.md** → Ce fichier
4. **AGROBOOST_Postman_Collection.json** → Tests Postman

### Ressources Externes
- [MongoDB Atlas](https://cloud.mongodb.com)
- [Express.js](https://expressjs.com)
- [JWT](https://jwt.io)
- [ESP32 Docs](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/)

---

## 🌐 DÉPLOIEMENT PRODUCTION

### Railway (Recommandé)
```bash
# 1. Créer projet Railway
# 2. Connecter repo GitHub
# 3. Variables d'environnement:
MONGODB_URI=...
DB_PASSWORD=...
JWT_SECRET=...
NODE_ENV=production
PORT=3000

# 4. Deploy automatique
```

### Alternatives
- **Heroku** : Dyno + MongoDB Atlas
- **DigitalOcean** : App Platform
- **AWS** : Elastic Beanstalk + DocumentDB
- **Render** : Web Service + MongoDB

---

## 🐛 TROUBLESHOOTING

### Problème: MongoDB connection failed
```bash
# Vérifier .env
echo $MONGODB_URI
# Tester connection
node -e "require('./src/config/database.js')"
```

### Problème: JWT invalid token
```bash
# Régénérer token via /login
# Vérifier JWT_SECRET dans .env
```

### Problème: Pompe ne s'active pas
```bash
# Vérifier batteryLevel >= 20%
# Vérifier waterLevel >= 10%
# Check logs notifications
```

---

## 📞 SUPPORT

**Version:** 1.0.0
**Date:** Novembre 2025
**Projet:** AGRO BOOST - Smart Agricultural Irrigation System

---

## 📝 TODO / AMÉLIORATIONS FUTURES

- [ ] MQTT Broker integration (Mosquitto)
- [ ] WebSocket real-time updates
- [ ] Dashboard analytics
- [ ] Multi-utilisateurs admin panel
- [ ] Email/SMS notifications
- [ ] LoRaWAN gateway integration
- [ ] Machine Learning predictions irrigation
- [ ] Mobile app (React Native)
- [ ] Weather API integration
- [ ] Backup automatique MongoDB

---

**🎯 BACKEND 100% FONCTIONNEL - PRÊT POUR PRODUCTION**
