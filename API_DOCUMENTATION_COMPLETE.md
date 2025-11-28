# 🌱 AGRO BOOST - Documentation API Complète

**Version:** 1.0.0
**Base URL:** `http://localhost:3000/api`
**Database:** MongoDB Atlas
**Application:** Irrigation solaire connectée - Kits solaires intelligents

---

## 📌 Vue d'ensemble

AGRO BOOST fournit une API REST sécurisée pour contrôler des kits de pompage solaire agricole avec:
- **Pompe:** Likou 4PSS17.0 (AC/DC Hybrid, 2200W, 280V DC)
- **Contrôle:** Via contrôleur hybride + ESP32/LoRaWAN
- **Capteurs:** Batterie, niveau d'eau, tension, courant
- **Programmation:** Créneaux d'irrigation automatiques
- **Notifications:** Alertes maintenance et sécurité

⚠️ **IMPORTANT**: La pompe ne peut JAMAIS fonctionner à vide (FORBID WORKING EMPTY)

---

## 🔐 AUTHENTIFICATION

### POST /api/auth/login
Connexion utilisateur

**Request:**
```json
{
  "username": "user@agroboost.com",
  "passwordHash": "1234"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "674638a1c2e4f5a6b7c8d9e0",
    "username": "user@agroboost.com",
    "kits": ["674638a2c2e4f5a6b7c8d9e1"]
  }
}
```

**Response 401:**
```json
{
  "error": "Nom d'utilisateur ou mot de passe incorrect"
}
```

---

### POST /api/auth/register
Inscription nouvel utilisateur

**Request:**
```json
{
  "username": "newuser@agroboost.com",
  "passwordHash": "1234"
}
```

**Response 200:** Même structure que /login

**Response 400:**
```json
{
  "error": "Nom d'utilisateur déjà utilisé"
}
```

---

## 🔧 KITS SOLAIRES

**Auth requise:** Bearer Token

### GET /api/kits
Liste tous les kits de l'utilisateur

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "kits": [
    {
      "_id": "674638a2c2e4f5a6b7c8d9e1",
      "deviceId": "ESP32-AGRO-001",
      "name": "Kit Tomates - Parcelle 1",
      "location": "Keur Moussa",
      "pumpStatus": true,
      "batteryLevel": 86,
      "waterLevel": 78,
      "voltage": 12.58,
      "current": 2.3,
      "pumpModel": "Likou 4PSS17.0",
      "pumpPower": 2200,
      "irrigationSchedules": [
        {
          "startTime": "2025-11-26T06:00:00Z",
          "durationMinutes": 30,
          "daysOfWeek": ["L", "M", "M", "J", "V"],
          "isActive": true
        }
      ],
      "lastActivity": "2025-11-26T11:30:00Z"
    }
  ]
}
```

---

### GET /api/kits/:kitId
Détails d'un kit spécifique

**Response 200:** Kit complet avec toutes les données

**Response 404:**
```json
{
  "error": "Kit non trouvé"
}
```

---

## 💧 CONTRÔLE POMPE

### POST /api/pompes/:kitId/control
Contrôler la pompe ON/OFF via contrôleur hybride

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "status": true
}
```

**Response 200:**
```json
{
  "_id": "674638a2c2e4f5a6b7c8d9e1",
  "deviceId": "ESP32-AGRO-001",
  "name": "Kit Tomates - Parcelle 1",
  "pumpStatus": true,
  "batteryLevel": 86,
  "waterLevel": 78,
  "lastActivity": "2025-11-26T11:35:00Z"
}
```

**Response 400 - Batterie faible:**
```json
{
  "error": "Impossible d'allumer la pompe : batterie trop faible"
}
```

**Response 400 - Eau faible:**
```json
{
  "error": "Impossible d'allumer la pompe : niveau d'eau trop bas (FORBID WORKING EMPTY)"
}
```

**Validations de sécurité:**
- ✅ Batterie ≥ 20%
- ✅ Niveau d'eau ≥ 10%
- ✅ Contrôleur hybride opérationnel
- ✅ Crée notification automatique

---

## 🗓️ PROGRAMMATION IRRIGATION

### POST /api/schedules/:kitId
Créer un nouveau créneau d'irrigation

**Request:**
```json
{
  "startTime": "2025-11-26T06:00:00Z",
  "durationMinutes": 30,
  "daysOfWeek": ["L", "M", "M", "J", "V"],
  "thresholdHumidity": 35.0
}
```

**Response 200:** Kit complet avec schedules mis à jour

---

### PUT /api/schedules/:kitId/:scheduleIndex
Modifier un créneau existant

**Params:**
- `kitId`: ID du kit
- `scheduleIndex`: Index du créneau (0, 1, 2...)

**Request:**
```json
{
  "startTime": "2025-11-26T18:30:00Z",
  "durationMinutes": 45
}
```

---

### DELETE /api/schedules/:kitId/:scheduleIndex
Supprimer un créneau

**Response 200:** Kit sans le créneau supprimé

---

## 📊 CAPTEURS IoT

### GET /api/sensors/:kitId?period=24h
Données capteurs sur une période

**Query Params:**
- `period`: `24h` | `7d` | `30d` (défaut: 24h)

**Response 200:**
```json
{
  "data": [
    {
      "_id": "674638a3c2e4f5a6b7c8d9e2",
      "kitId": "674638a2c2e4f5a6b7c8d9e1",
      "type": "humidity",
      "value": 76,
      "unit": "%",
      "timestamp": "2025-11-26T11:00:00Z"
    },
    {
      "type": "temp",
      "value": 28.5,
      "unit": "°C",
      "timestamp": "2025-11-26T11:00:00Z"
    },
    {
      "type": "voltage",
      "value": 12.58,
      "unit": "V",
      "timestamp": "2025-11-26T11:00:00Z"
    },
    {
      "type": "current",
      "value": 2.3,
      "unit": "A",
      "timestamp": "2025-11-26T11:00:00Z"
    }
  ]
}
```

**Types de capteurs:**
- `humidity`: Humidité sol (%)
- `temp`: Température (°C)
- `voltage`: Tension batterie (V)
- `current`: Courant pompe (A)

---

### GET /api/sensors/:kitId/latest
4 dernières lectures (une par type)

**Response 200:** Array de 4 capteurs

---

### GET /api/sensors/:kitId/type?type=humidity&period=24h
Données d'un capteur spécifique

**Query Params:**
- `type`: `humidity` | `temp` | `voltage` | `current`
- `period`: `24h` | `7d` | `30d`

---

### POST /api/sensors/log
Logger données depuis ESP32/LoRaWAN

**Request (depuis ESP32):**
```json
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

**Response 201:**
```json
{
  "success": true,
  "message": "Données capteurs enregistrées"
}
```

---

## 🔔 NOTIFICATIONS

### GET /api/notifications
Liste toutes les notifications

**Response 200:**
```json
{
  "notifications": [
    {
      "id": "674638a4c2e4f5a6b7c8d9e3",
      "title": "Batterie faible",
      "message": "Le niveau de batterie est à 18% sur Kit Tomates",
      "timestamp": "2025-11-26T09:30:00Z",
      "category": "alert",
      "isRead": false,
      "kitId": "674638a2c2e4f5a6b7c8d9e1",
      "actionLabel": "Voir le kit"
    },
    {
      "title": "Pompe allumée",
      "message": "La pompe du Kit Tomates a été allumée",
      "category": "info",
      "isRead": false
    }
  ]
}
```

**Catégories:**
- `alert`: Alerte urgente (batterie/eau faible)
- `warning`: Avertissement (maintenance)
- `info`: Information (pompe ON/OFF)
- `success`: Succès (action réussie)

---

### PATCH /api/notifications/:notifId/read
Marquer comme lue

---

## 🏗️ ARCHITECTURE IoT

### Schéma Système

```
┌─────────────────┐
│  APPLICATION    │
│  FLUTTER/MOBILE │
└────────┬────────┘
         │ HTTPS/REST
         ▼
┌─────────────────┐
│  BACKEND API    │
│  Node.js/Express│
│  MongoDB Atlas  │
└────────┬────────┘
         │ MQTT/LoRaWAN
         ▼
┌─────────────────┐
│     ESP32       │
│  + LoRaWAN      │
│  + Capteurs     │
└────────┬────────┘
         │ Dry Contact / 12V Signal
         ▼
┌─────────────────┐
│  CONTRÔLEUR     │
│   HYBRIDE       │
│  (Likou Driver) │
└────────┬────────┘
         │ 280V DC / 220V AC
         ▼
┌─────────────────┐
│  POMPE LIKOU    │
│  4PSS17.0       │
│  2200W / 280V   │
└─────────────────┘
```

### Contrôle Pompe via Contrôleur

⚠️ **CRITIQUE**: Ne JAMAIS contrôler la pompe directement

**Méthode correcte:**
1. Backend envoie commande MQTT → ESP32
2. ESP32 active relais 12V / Dry Contact
3. Signal → Entrée "Remote Control" du contrôleur hybride
4. Contrôleur → Active/désactive la pompe 280V

**Connexions ESP32:**
- GPIO → Relais 5V (commande)
- Relais COM/NO → Entrée "Remote" du contrôleur (12V ou dry contact)
- Capteurs:
  - Niveau batterie → ADC (lecture tension)
  - Niveau eau → Capteur flotteur/ultrason
  - Température → DS18B20
  - Courant → ACS712

---

## 🔒 SÉCURITÉ

### Validations Pompe
```javascript
// Avant d'allumer la pompe
if (batteryLevel < 20) {
  throw new Error("Batterie trop faible");
}

if (waterLevel < 10) {
  throw new Error("Niveau d'eau trop bas (FORBID WORKING EMPTY)");
}

if (!controllerOperational) {
  throw new Error("Contrôleur hybride non opérationnel");
}
```

### Protection Hardware
- ✅ Relais isolation galvanique
- ✅ Fusible sur ligne contrôleur
- ✅ Float switch anti-dry
- ✅ Disjoncteur différentiel
- ✅ Mise à la terre

---

## 📱 INTÉGRATION ESP32

### Code Arduino/ESP32

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

#define PUMP_RELAY_PIN 27
#define BATTERY_ADC_PIN 34
#define WATER_LEVEL_PIN 35

WiFiClient espClient;
PubSubClient mqtt(espClient);

void setup() {
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  digitalWrite(PUMP_RELAY_PIN, LOW);

  connectWiFi();
  mqtt.setServer("mqtt.agroboost.com", 1883);
  mqtt.setCallback(mqttCallback);
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  if (String(topic) == "agroboost/pump/control") {
    if (message == "ON") {
      // Vérifier sécurité avant d'activer
      if (checkSafety()) {
        digitalWrite(PUMP_RELAY_PIN, HIGH);
        sendStatus("ON");
      }
    } else {
      digitalWrite(PUMP_RELAY_PIN, LOW);
      sendStatus("OFF");
    }
  }
}

bool checkSafety() {
  int battery = readBatteryLevel();
  int water = readWaterLevel();

  if (battery < 20 || water < 10) {
    return false;
  }
  return true;
}

void sendSensorData() {
  String payload = "{";
  payload += "\"deviceId\":\"ESP32-AGRO-001\",";
  payload += "\"battery\":" + String(readBatteryLevel()) + ",";
  payload += "\"waterLevel\":" + String(readWaterLevel()) + ",";
  payload += "\"voltage\":" + String(readVoltage()) + ",";
  payload += "\"temperature\":" + String(readTemperature());
  payload += "}";

  mqtt.publish("agroboost/sensors/data", payload.c_str());
}
```

---

## 🧪 TESTS POSTMAN

### Collection Incluse
`AGROBOOST_Postman_Collection.json`

### Séquence de Test

1. **Register**
```
POST /api/auth/register
Body: {"username": "test@agroboost.com", "passwordHash": "1234"}
```

2. **Login** → Copier token

3. **Get Kits** → Copier kitId

4. **Control Pump ON**
```
POST /api/pompes/:kitId/control
Body: {"status": true}
```

5. **Create Schedule**
```
POST /api/schedules/:kitId
Body: {
  "startTime": "2025-11-26T06:00:00Z",
  "durationMinutes": 30,
  "daysOfWeek": ["L","M","M","J","V"]
}
```

6. **Get Sensors**
```
GET /api/sensors/:kitId?period=24h
```

7. **Get Notifications**

---

## 🎨 INTERFACE (Référence Images)

### Écran Login
- Logo AGRO BOOST circulaire vert
- Champ Téléphone
- Champ Mot de passe
- Bouton "Se connecter" (vert #4A8B5C)

### Mes kits solaires
- Liste kits (Kit Tomates - Parcelle 1, Kit Arachide)
- Statut pompe: ON/OFF toggle
- Batterie: 86% (Bonne/Faible)
- Niveau d'eau: OK (70%+)
- LoRaWAN + MQTT indicators
- Bouton "Éteindre la pompe" (bleu)

### Programmation
- Jours semaine: L M M M J V S D
- Heure début: 06:00
- Durée: 30 min
- Bouton "+ Ajouter une programmation"

### Capteurs
- Tension: 12.58V
- Niveau d'eau: 86%
- Gateway connecté (MQTT)
- Batterie: 82%
- Bouton "Rafraîchir les capteurs"

---

## 🚀 DÉPLOIEMENT

### Railway/Render

```bash
# Variables environnement
MONGODB_URI=your_production_uri
JWT_SECRET=production_secret_64_chars
NODE_ENV=production
MQTT_BROKER_URL=mqtt://production-broker:1883
```

---

## 📞 Support

**Pompe:** Likou 4PSS17.0 (2200W, 280V DC, 17.2m³/h, 110m head)
**Contrôle:** Via contrôleur hybride + ESP32
**Capteurs:** LoRaWAN/MQTT
**Sécurité:** FORBID WORKING EMPTY

---

**AGRO BOOST - Innovations au service de l'agriculture** 🌱
Version 1.0.0
