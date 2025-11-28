# Guide de Test Postman - AGRO BOOST Backend

## 📋 Prérequis

1. ✅ Backend démarré (`npm start` ou `npm run dev`)
2. ✅ Supabase configuré (credentials dans `.env`)
3. ✅ Données de test créées (`npm run seed`)
4. ✅ Postman installé
5. ✅ Collection importée (`AGROBOOST_Postman_Collection.json`)

---

## 🚀 Étape 1: Configuration Postman

### Importer la collection
1. Ouvrir Postman
2. File → Import
3. Sélectionner `AGROBOOST_Postman_Collection.json`
4. Collection "AGRO BOOST API" apparaît dans la sidebar

### Configurer les variables
1. Cliquer sur la collection "AGRO BOOST API"
2. Onglet "Variables"
3. Vérifier/Modifier:
   - `base_url`: `http://localhost:3000/api`
   - `auth_token`: (sera auto-rempli)
   - `kit_id`: (sera auto-extrait)

---

## 🧪 Étape 2: Créer les données de test

```bash
cd backend
npm run seed
```

**Résultat attendu:**
```
🌱 Début du seeding des données de test AGRO BOOST...

1️⃣ Création utilisateur test...
✅ Utilisateur créé: test@agroboost.com

2️⃣ Création kit solaire test...
✅ Kit créé: ESP32-AGRO-001

3️⃣ Création schedules irrigation...
✅ Schedules créés: 2

4️⃣ Création données capteurs (dernières 24h)...
✅ Données capteurs créées: 144

5️⃣ Création notifications test...
✅ Notifications créées: 2

6️⃣ Création logs pompe...
✅ Pump logs créés: 2

============================================================
✅ SEEDING TERMINÉ AVEC SUCCÈS!
============================================================

📋 DONNÉES DE TEST CRÉÉES:

👤 Utilisateur:
   Email: test@agroboost.com
   Password: 1234

🔧 Kit:
   Device ID: ESP32-AGRO-001
   Batterie: 85.5%
   Eau: 92%
```

---

## 🔐 Étape 3: Authentification

### Test 1: Register (Optionnel)

**Collection:** 🔐 Authentication → Register

**Body:**
```json
{
  "username": "newuser@agroboost.com",
  "passwordHash": "1234"
}
```

**Résultat attendu (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "uuid-here",
    "username": "newuser@agroboost.com",
    "kits": []
  }
}
```

---

### Test 2: Login ⭐ (CRITIQUE)

**Collection:** 🔐 Authentication → Login

**Body:**
```json
{
  "username": "test@agroboost.com",
  "passwordHash": "1234"
}
```

**Résultat attendu (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "uuid-here",
    "username": "test@agroboost.com",
    "kits": ["kit-uuid"]
  }
}
```

**✅ Vérifications:**
- [ ] Status 200 OK
- [ ] Token JWT présent
- [ ] Variable `auth_token` auto-remplie
- [ ] User ID retourné
- [ ] Kits array présent

---

## 🔧 Étape 4: Kits Solaires

### Test 3: Get All Kits

**Collection:** 🔧 Kits Solaires → Get All Kits

**Headers:**
- `Authorization: Bearer {{auth_token}}` (automatique)

**Résultat attendu (200):**
```json
{
  "kits": [
    {
      "_id": "kit-uuid",
      "deviceId": "ESP32-AGRO-001",
      "pumpStatus": false,
      "batteryLevel": 85.5,
      "waterLevel": 92.0,
      "voltage": 276.8,
      "current": 0.0,
      "irrigationSchedules": [
        {
          "id": "schedule-uuid",
          "start_time": "2025-11-26T06:00:00Z",
          "duration_minutes": 30,
          "days_of_week": ["L","M","M","J","V"],
          "threshold_humidity": 35.0,
          "is_active": true
        }
      ]
    }
  ]
}
```

**✅ Vérifications:**
- [ ] Status 200 OK
- [ ] Array kits non vide
- [ ] Kit avec schedules
- [ ] Variable `kit_id` auto-extraite

---

### Test 4: Get Kit by ID

**Collection:** 🔧 Kits Solaires → Get Kit by ID

**URL:** `/api/kits/{{kit_id}}` (automatique)

**Résultat attendu (200):**
```json
{
  "_id": "kit-uuid",
  "deviceId": "ESP32-AGRO-001",
  "pumpStatus": false,
  "batteryLevel": 85.5,
  "waterLevel": 92.0,
  "voltage": 276.8,
  "current": 0.0,
  "irrigationSchedules": [...]
}
```

**✅ Vérifications:**
- [ ] Status 200 OK
- [ ] Détails kit complets
- [ ] Schedules présents

---

## 💧 Étape 5: Contrôle Pompe

### Test 5: Turn Pump ON

**Collection:** 💧 Contrôle Pompe → Turn Pump ON

**Body:**
```json
{
  "status": true
}
```

**Résultat attendu (200):**
```json
{
  "_id": "kit-uuid",
  "deviceId": "ESP32-AGRO-001",
  "pumpStatus": true,
  "batteryLevel": 85.5,
  "waterLevel": 92.0,
  "voltage": 276.8,
  "current": 7.8,
  "irrigationSchedules": [...]
}
```

**✅ Vérifications:**
- [ ] Status 200 OK
- [ ] `pumpStatus: true`
- [ ] Batterie ≥ 20%
- [ ] Eau ≥ 10%

---

### Test 6: Turn Pump OFF

**Collection:** 💧 Contrôle Pompe → Turn Pump OFF

**Body:**
```json
{
  "status": false
}
```

**Résultat attendu (200):**
```json
{
  "_id": "kit-uuid",
  "deviceId": "ESP32-AGRO-001",
  "pumpStatus": false,
  ...
}
```

**✅ Vérifications:**
- [ ] Status 200 OK
- [ ] `pumpStatus: false`

---

## 🗓️ Étape 6: Programmation Irrigation

### Test 7: Create Schedule

**Collection:** 🗓️ Programmation Irrigation → Create Schedule

**Body:**
```json
{
  "startTime": "2025-11-26T14:00:00Z",
  "durationMinutes": 25,
  "daysOfWeek": ["L", "M", "V"],
  "thresholdHumidity": 40.0
}
```

**Résultat attendu (200):**
```json
{
  "_id": "kit-uuid",
  "deviceId": "ESP32-AGRO-001",
  "pumpStatus": false,
  "batteryLevel": 85.5,
  "waterLevel": 92.0,
  "voltage": 276.8,
  "current": 0.0,
  "irrigationSchedules": [
    {...},
    {...},
    {
      "id": "new-schedule-uuid",
      "start_time": "2025-11-26T14:00:00Z",
      "duration_minutes": 25,
      "days_of_week": ["L","M","V"],
      "threshold_humidity": 40.0,
      "is_active": true
    }
  ]
}
```

**✅ Vérifications:**
- [ ] Status 200 OK
- [ ] Nouveau schedule dans array
- [ ] 3 schedules au total

---

### Test 8: Update Schedule

**Collection:** 🗓️ Programmation Irrigation → Update Schedule

**URL:** `/api/schedules/{{kit_id}}/0` (index 0 = premier schedule)

**Body:**
```json
{
  "startTime": "2025-11-26T07:00:00Z",
  "durationMinutes": 35
}
```

**Résultat attendu (200):**
```json
{
  "_id": "kit-uuid",
  "irrigationSchedules": [
    {
      "start_time": "2025-11-26T07:00:00Z",
      "duration_minutes": 35,
      ...
    }
  ]
}
```

**✅ Vérifications:**
- [ ] Status 200 OK
- [ ] Schedule modifié
- [ ] Autres schedules inchangés

---

### Test 9: Delete Schedule

**Collection:** 🗓️ Programmation Irrigation → Delete Schedule

**URL:** `/api/schedules/{{kit_id}}/2` (supprimer le 3ème)

**Résultat attendu (200):**
```json
{
  "_id": "kit-uuid",
  "irrigationSchedules": [
    {...},
    {...}
  ]
}
```

**✅ Vérifications:**
- [ ] Status 200 OK
- [ ] Schedule supprimé
- [ ] 2 schedules restants

---

## 📊 Étape 7: Capteurs IoT

### Test 10: Get All Sensor Data (24h)

**Collection:** 📊 Capteurs IoT → Get All Sensor Data (24h)

**URL:** `/api/sensors/{{kit_id}}?period=24h`

**Résultat attendu (200):**
```json
{
  "data": [
    {
      "_id": "sensor-uuid",
      "kitId": "kit-uuid",
      "timestamp": "2025-11-26T12:00:00Z",
      "type": "humidity",
      "value": 45.3,
      "unit": "%"
    },
    {
      "_id": "sensor-uuid-2",
      "kitId": "kit-uuid",
      "timestamp": "2025-11-26T12:00:00Z",
      "type": "temp",
      "value": 28.5,
      "unit": "°C"
    },
    ...
  ]
}
```

**✅ Vérifications:**
- [ ] Status 200 OK
- [ ] Array data non vide
- [ ] 144 entrées (24h × 6 types)

---

### Test 11: Get Latest Sensor Data

**Collection:** 📊 Capteurs IoT → Get Latest Sensor Data

**URL:** `/api/sensors/{{kit_id}}/latest`

**Résultat attendu (200):**
```json
{
  "data": [
    {
      "_id": "sensor-uuid-1",
      "type": "humidity",
      "value": 45.3,
      "unit": "%"
    },
    {
      "_id": "sensor-uuid-2",
      "type": "temp",
      "value": 28.5,
      "unit": "°C"
    },
    {
      "_id": "sensor-uuid-3",
      "type": "voltage",
      "value": 275.3,
      "unit": "V"
    },
    {
      "_id": "sensor-uuid-4",
      "type": "current",
      "value": 7.8,
      "unit": "A"
    }
  ]
}
```

**✅ Vérifications:**
- [ ] Status 200 OK
- [ ] 4 capteurs (humidity, temp, voltage, current)

---

### Test 12: Get Humidity Data

**Collection:** 📊 Capteurs IoT → Get Humidity Data

**URL:** `/api/sensors/{{kit_id}}/type?type=humidity&period=24h`

**Résultat attendu (200):**
```json
{
  "data": [
    {
      "_id": "sensor-uuid",
      "type": "humidity",
      "value": 45.3,
      "unit": "%"
    },
    ...
  ]
}
```

**✅ Vérifications:**
- [ ] Status 200 OK
- [ ] Toutes données type "humidity"

---

### Test 13: Log Sensor Data (ESP32) ⭐

**Collection:** 📊 Capteurs IoT → Log Sensor Data (ESP32)

**⚠️ PAS D'AUTHENTIFICATION REQUISE**

**Body:**
```json
{
  "deviceId": "ESP32-AGRO-001",
  "battery": 87,
  "waterLevel": 93,
  "voltage": 278.5,
  "current": 1.5,
  "temperature": 29.5,
  "humidity": 48,
  "pumpStatus": "OFF"
}
```

**Résultat attendu (201):**
```json
{
  "message": "Données enregistrées avec succès",
  "count": 6,
  "timestamp": "2025-11-26T12:34:56.789Z"
}
```

**✅ Vérifications:**
- [ ] Status 201 Created
- [ ] 6 mesures enregistrées
- [ ] Timestamp retourné

---

## 🔔 Étape 8: Notifications

### Test 14: Get All Notifications

**Collection:** 🔔 Notifications → Get All Notifications

**Résultat attendu (200):**
```json
{
  "notifications": [
    {
      "id": "notif-uuid",
      "title": "Kit connecté",
      "message": "Le kit ESP32-AGRO-001 est maintenant connecté",
      "timestamp": "2025-11-26T10:00:00Z",
      "category": "success",
      "isRead": false,
      "kitId": "kit-uuid",
      "actionLabel": null
    },
    ...
  ]
}
```

**✅ Vérifications:**
- [ ] Status 200 OK
- [ ] Au moins 2 notifications
- [ ] Catégories: success, info, alert

---

### Test 15: Mark Notification as Read

**Collection:** 🔔 Notifications → Mark Notification as Read

**URL:** `/api/notifications/{{notification_id}}/read`

**Résultat attendu (200):**
```json
{
  "id": "notif-uuid",
  "title": "Kit connecté",
  "message": "...",
  "isRead": true,
  ...
}
```

**✅ Vérifications:**
- [ ] Status 200 OK
- [ ] `isRead: true`

---

## ✅ Checklist Complète des Tests

### Authentication (2/2)
- [ ] ✅ POST /auth/register
- [ ] ✅ POST /auth/login

### Kits (2/2)
- [ ] ✅ GET /kits
- [ ] ✅ GET /kits/:kitId

### Pompe (2/2)
- [ ] ✅ POST /pompes/:kitId/control (ON)
- [ ] ✅ POST /pompes/:kitId/control (OFF)

### Schedules (3/3)
- [ ] ✅ POST /schedules/:kitId
- [ ] ✅ PUT /schedules/:kitId/:index
- [ ] ✅ DELETE /schedules/:kitId/:index

### Sensors (6/6)
- [ ] ✅ GET /sensors/:kitId?period=24h
- [ ] ✅ GET /sensors/:kitId?period=7d
- [ ] ✅ GET /sensors/:kitId/latest
- [ ] ✅ GET /sensors/:kitId/type?type=humidity
- [ ] ✅ GET /sensors/:kitId/type?type=temp
- [ ] ✅ POST /sensors/log (ESP32)

### Notifications (2/2)
- [ ] ✅ GET /notifications
- [ ] ✅ PATCH /notifications/:id/read

**Total: 17/17 endpoints testés ✅**

---

## 🐛 Troubleshooting

### Erreur 401 Unauthorized
```json
{"error": "Token invalide ou expiré"}
```
**Solution:** Refaire POST /auth/login pour obtenir nouveau token

---

### Erreur 404 Kit non trouvé
```json
{"error": "Kit non trouvé"}
```
**Solution:**
1. Vérifier que `npm run seed` a été exécuté
2. Vérifier variable `{{kit_id}}` dans Postman

---

### Erreur 400 Batterie faible
```json
{"error": "Impossible d'allumer la pompe : batterie trop faible"}
```
**C'est normal!** La validation de sécurité fonctionne.
**Solution:** Augmenter batteryLevel dans Supabase (>20%)

---

### Erreur 500 Erreur serveur
**Solutions:**
1. Vérifier que le serveur est démarré
2. Check console logs backend
3. Vérifier .env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

---

## 📞 Pour le Développeur Frontend

Une fois tous les tests Postman réussis, le développeur frontend peut:

1. **Utiliser la collection Postman** comme référence API
2. **Consulter API_DOCUMENTATION.md** pour détails complets
3. **Utiliser les mêmes endpoints** avec fetch/axios
4. **Copier les exemples de requêtes/réponses** pour TypeScript types

### Exemple fetch pour frontend:

```typescript
// Login
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'test@agroboost.com',
    passwordHash: '1234'
  })
});
const data = await response.json();
const token = data.token;

// Get kits (avec auth)
const kitsResponse = await fetch('http://localhost:3000/api/kits', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const kits = await kitsResponse.json();
```

---

## 🎯 Résultat Attendu

Si tous les tests passent:
- ✅ Backend 100% fonctionnel
- ✅ Toutes routes testées et validées
- ✅ Prêt pour intégration frontend
- ✅ Prêt pour déploiement production

**🎉 BACKEND AGRO BOOST VALIDÉ ET PRÊT!**
