# MQTT & LoRaWAN Integration Guide - AGRO BOOST

## 📡 Vue d'ensemble

Le backend AGRO BOOST intègre un **broker MQTT complet** pour communication IoT temps réel avec les kits ESP32 et compatibilité **LoRaWAN via TTN/Chirpstack**.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AGRO BOOST Backend                        │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   REST API   │         │ MQTT Broker  │                 │
│  │   Port 3000  │         │  Port 1883   │                 │
│  └──────────────┘         └──────────────┘                 │
│         │                        │                          │
│         │                        │                          │
│    ┌────▼────────────────────────▼────┐                    │
│    │        MongoDB Atlas              │                    │
│    │     Database: smartfarm           │                    │
│    └───────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                 │                    │
                 │                    │
        ┌────────▼────────┐  ┌────────▼──────────┐
        │   Mobile App    │  │    ESP32 Kits     │
        │   (REST API)    │  │   (MQTT Direct)   │
        └─────────────────┘  └───────────────────┘
                                      │
                             ┌────────▼──────────┐
                             │  LoRaWAN Gateway  │
                             │  TTN/Chirpstack   │
                             └───────────────────┘
```

## 🚀 Démarrage Rapide

### Configuration

Le broker MQTT démarre automatiquement avec le serveur:

```bash
# Dans backend/.env
MQTT_ENABLED=true
MQTT_PORT=1883
```

### Démarrer le serveur

```bash
npm start
```

Logs:
```
═══════════════════════════════════════════════════════════
📡 MQTT Broker started - AGRO BOOST
═══════════════════════════════════════════════════════════
🌐 Port: 1883
📊 Topics:
   SUB  agroboost/sensors/{deviceId}     - Sensor data
   SUB  agroboost/lorawan/{deviceId}     - LoRaWAN TTN/Chirpstack
   PUB  agroboost/pump/{deviceId}/control - Pump commands
═══════════════════════════════════════════════════════════
```

## 📊 Topics MQTT

### 1. Sensors Data (SUBSCRIBE)

**Topic**: `agroboost/sensors/{deviceId}`

**Format**: JSON

**Exemple**:
```json
{
  "deviceId": "ESP32-AGRO-001",
  "battery": 85.5,
  "waterLevel": 92.0,
  "voltage": 276.8,
  "current": 0.0,
  "temperature": 28.5,
  "humidity": 76.3,
  "pumpStatus": "OFF"
}
```

**Traitement automatique**:
- ✅ Sauvegarde dans MongoDB (`sensordatas` collection)
- ✅ Mise à jour du kit en temps réel
- ✅ Notification si batterie < 20%
- ✅ Notification si eau < 10%

### 2. LoRaWAN Data (SUBSCRIBE)

**Topic**: `agroboost/lorawan/{deviceId}`

**Format**: TTN/Chirpstack standard

**Exemple TTN**:
```json
{
  "end_device_ids": {
    "device_id": "ESP32-AGRO-001",
    "application_ids": {
      "application_id": "agroboost-app"
    }
  },
  "uplink_message": {
    "decoded_payload": {
      "battery": 85.5,
      "waterLevel": 92.0,
      "voltage": 276.8,
      "current": 0.0,
      "temperature": 28.5,
      "humidity": 76.3
    }
  }
}
```

**Traitement**: Automatiquement converti et traité comme sensor data

### 3. Pump Control (PUBLISH)

**Topic**: `agroboost/pump/{deviceId}/control`

**Format**: JSON

**Publié automatiquement** quand l'utilisateur contrôle la pompe via REST API:

```json
{
  "command": "ON",
  "timestamp": "2025-11-27T00:00:00.000Z"
}
```

ou

```json
{
  "command": "OFF",
  "timestamp": "2025-11-27T00:00:00.000Z"
}
```

## 🔌 Intégration ESP32

### Code Arduino (MQTT Direct)

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* ssid = "VOTRE_WIFI";
const char* password = "VOTRE_PASSWORD";
const char* mqtt_server = "VOTRE_SERVEUR";  // IP ou domaine
const int mqtt_port = 1883;

const char* deviceId = "ESP32-AGRO-001";
char sensorTopic[50];
char pumpTopic[50];

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  
  // Topics
  sprintf(sensorTopic, "agroboost/sensors/%s", deviceId);
  sprintf(pumpTopic, "agroboost/pump/%s/control", deviceId);
  
  // WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  
  // MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
  
  reconnect();
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect(deviceId)) {
      Serial.println("connected");
      client.subscribe(pumpTopic);
    } else {
      Serial.print("failed, rc=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<200> doc;
  deserializeJson(doc, payload, length);
  
  String command = doc["command"];
  Serial.print("Pump command: ");
  Serial.println(command);
  
  if (command == "ON") {
    digitalWrite(RELAY_PIN, HIGH);
  } else if (command == "OFF") {
    digitalWrite(RELAY_PIN, LOW);
  }
}

void publishSensorData() {
  StaticJsonDocument<300> doc;
  
  doc["deviceId"] = deviceId;
  doc["battery"] = readBattery();
  doc["waterLevel"] = readWaterLevel();
  doc["voltage"] = readVoltage();
  doc["current"] = readCurrent();
  doc["temperature"] = readTemperature();
  doc["humidity"] = readHumidity();
  doc["pumpStatus"] = digitalRead(RELAY_PIN) ? "ON" : "OFF";
  
  char buffer[300];
  serializeJson(doc, buffer);
  
  client.publish(sensorTopic, buffer);
  Serial.println("Sensor data published");
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Publier toutes les 5 minutes
  static unsigned long lastPublish = 0;
  if (millis() - lastPublish > 300000) {
    publishSensorData();
    lastPublish = millis();
  }
}
```

## 🌐 Intégration LoRaWAN (TTN)

### 1. Configuration TTN

1. Créer application sur [The Things Network](https://console.thethingsnetwork.org)
2. Ajouter device (ESP32 avec module LoRa)
3. Configurer Payload Decoder:

```javascript
function decodeUplink(input) {
  var bytes = input.bytes;
  
  return {
    data: {
      battery: (bytes[0] << 8 | bytes[1]) / 10,
      waterLevel: (bytes[2] << 8 | bytes[3]) / 10,
      voltage: (bytes[4] << 8 | bytes[5]) / 10,
      current: (bytes[6] << 8 | bytes[7]) / 100,
      temperature: (bytes[8] << 8 | bytes[9]) / 10,
      humidity: (bytes[10] << 8 | bytes[11]) / 10
    }
  };
}
```

### 2. MQTT Integration TTN

Dans TTN Console → Integrations → MQTT:

```
Server: VOTRE_SERVEUR_BACKEND
Port: 1883
Username: <TTN username>
Password: <TTN API key>

Topic: agroboost/lorawan/{device_id}
```

### 3. Code ESP32 LoRaWAN

```cpp
#include <lmic.h>
#include <hal/hal.h>

static const u1_t PROGMEM APPEUI[8] = { YOUR_APPEUI };
static const u1_t PROGMEM DEVEUI[8] = { YOUR_DEVEUI };
static const u1_t PROGMEM APPKEY[16] = { YOUR_APPKEY };

void do_send(osjob_t* j) {
  uint8_t payload[12];
  
  // Battery (2 bytes)
  uint16_t battery = readBattery() * 10;
  payload[0] = battery >> 8;
  payload[1] = battery & 0xFF;
  
  // Water level (2 bytes)
  uint16_t water = readWaterLevel() * 10;
  payload[2] = water >> 8;
  payload[3] = water & 0xFF;
  
  // Voltage (2 bytes)
  uint16_t voltage = readVoltage() * 10;
  payload[4] = voltage >> 8;
  payload[5] = voltage & 0xFF;
  
  // Current (2 bytes)
  uint16_t current = readCurrent() * 100;
  payload[6] = current >> 8;
  payload[7] = current & 0xFF;
  
  // Temperature (2 bytes)
  uint16_t temp = readTemperature() * 10;
  payload[8] = temp >> 8;
  payload[9] = temp & 0xFF;
  
  // Humidity (2 bytes)
  uint16_t humidity = readHumidity() * 10;
  payload[10] = humidity >> 8;
  payload[11] = humidity & 0xFF;
  
  LMIC_setTxData2(1, payload, sizeof(payload), 0);
}
```

## 🧪 Tests avec MQTT Client

### mosquitto_pub (Simuler ESP32)

```bash
# Publier sensor data
mosquitto_pub -h localhost -p 1883 \
  -t "agroboost/sensors/ESP32-AGRO-001" \
  -m '{"deviceId":"ESP32-AGRO-001","battery":85.5,"waterLevel":92.0,"voltage":276.8,"current":0.0,"temperature":28.5,"humidity":76.3,"pumpStatus":"OFF"}'
```

### mosquitto_sub (Écouter commandes pompe)

```bash
# Écouter les commandes
mosquitto_sub -h localhost -p 1883 \
  -t "agroboost/pump/ESP32-AGRO-001/control"
```

### MQTT.fx ou MQTTX (GUI)

1. Télécharger [MQTTX](https://mqttx.app)
2. Créer connexion:
   - Host: `localhost`
   - Port: `1883`
3. Subscribe: `agroboost/pump/+/control`
4. Publish test: `agroboost/sensors/ESP32-AGRO-001`

## 🔒 Sécurité

### Actuellement (v1.0)

- ✅ MQTT sans authentification (réseau local)
- ✅ Validations backend (batterie, eau)
- ✅ Logs complets

### Production (recommandé)

1. **TLS/SSL**:
```javascript
// mqtt.js
import { readFileSync } from 'fs';
const server = createServer({
  cert: readFileSync('./certs/server-cert.pem'),
  key: readFileSync('./certs/server-key.pem')
}, broker.handle);
```

2. **Authentication**:
```javascript
broker.authenticate = (client, username, password, callback) => {
  const authorized = (
    username === 'esp32' &&
    password.toString() === process.env.MQTT_PASSWORD
  );
  callback(null, authorized);
};
```

## 📈 Monitoring

### Logs MQTT

Le broker log automatiquement:
- ✅ Connexions clients
- ✅ Déconnexions
- ✅ Messages reçus
- ✅ Erreurs
- ✅ Alertes (batterie/eau)

```
📡 MQTT Client connected: ESP32-AGRO-001
✅ MQTT sensor data saved: ESP32-AGRO-001 (6 entries)
⚠️  Low battery alert: ESP32-AGRO-001 - 18%
✅ Pump command published: ESP32-AGRO-001 -> ON
```

## 🐛 Troubleshooting

### MQTT ne démarre pas

```bash
# Vérifier .env
cat .env | grep MQTT

# Devrait afficher:
MQTT_ENABLED=true
MQTT_PORT=1883
```

### Port 1883 déjà utilisé

```bash
# Trouver processus
sudo lsof -i :1883

# Tuer processus
sudo kill -9 <PID>

# Ou changer port dans .env
MQTT_PORT=1884
```

### ESP32 ne se connecte pas

1. Vérifier IP serveur
2. Ping serveur depuis ESP32
3. Vérifier firewall (port 1883 ouvert)
4. Activer logs debug MQTT sur ESP32

### Messages non reçus

1. Vérifier topic exact (case sensitive)
2. Vérifier JSON valide
3. Vérifier deviceId existe dans MongoDB
4. Consulter logs backend

## 📚 Ressources

- **MQTT**: https://mqtt.org
- **Aedes Broker**: https://github.com/moscajs/aedes
- **TTN**: https://www.thethingsnetwork.org
- **ESP32 MQTT**: https://github.com/knolleary/pubsubclient
- **LoRaWAN**: https://lora-alliance.org

---

**Version**: 1.0.0
**MQTT Broker**: Aedes
**Protocoles**: MQTT 3.1.1, LoRaWAN (via TTN/Chirpstack)
**Port**: 1883 (configurable)
