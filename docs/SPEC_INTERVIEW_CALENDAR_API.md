# 📅 Spécification API - Calendrier d'Entretiens

**Fichier concerné** : `src/components/evaluation/InterviewCalendarModal.tsx`  
**Status** : ⚠️ Supabase retiré - Migration vers Backend API requise  
**Priorité** : 🟡 Moyenne (Modal optionnel)

---

## 🎯 Vue d'Ensemble

Le **Calendrier d'Entretiens** (InterviewCalendarModal) est un modal qui permet de :
- 📅 Visualiser tous les entretiens programmés dans un calendrier mensuel
- ➕ Créer de nouveaux entretiens en sélectionnant une date et un créneau horaire
- ✏️ Modifier la date/heure d'un entretien existant
- 🗑️ Annuler/supprimer un entretien
- 👁️ Voir les détails d'un entretien (candidat, poste, statut)

---

## 📊 Modèle de Données

### Interview Slot (Créneau d'Entretien)

```typescript
interface InterviewSlot {
  id: string;                          // UUID du créneau
  date: string;                        // Format: YYYY-MM-DD
  time: string;                        // Format: HH:mm:ss (ex: "09:00:00")
  application_id: string | null;      // ID de la candidature liée
  candidate_name: string | null;      // Nom complet du candidat
  job_title: string | null;           // Titre du poste
  status: 'scheduled' | 'completed' | 'cancelled';
  is_available: boolean;               // true = créneau libre, false = occupé
  location?: string;                   // Lieu de l'entretien (ex: "Libreville")
  notes?: string;                      // Notes supplémentaires
  created_at: string;                  // ISO 8601
  updated_at: string;                  // ISO 8601
}
```

---

## 🔌 Routes API Backend Requises

### 1. 📋 **GET** `/api/v1/interviews/slots` - Lister les Créneaux

**Description** : Récupère tous les créneaux d'entretien dans une période donnée

**Query Parameters** :
```typescript
{
  date_from?: string;      // Format: YYYY-MM-DD (ex: "2025-10-01")
  date_to?: string;        // Format: YYYY-MM-DD (ex: "2025-10-31")
  is_available?: boolean;  // Filtrer par disponibilité
  application_id?: string; // Filtrer par candidature
  status?: string;         // Filtrer par statut
  order?: string;          // Ex: "date:asc,time:asc"
}
```

**Utilisation Actuelle (Supabase)** :
```typescript
// Ligne 64-72
const { data: slots } = await supabase
  .from('interview_slots')
  .select('id, date, time, application_id, is_available, candidate_name, job_title, status, created_at, updated_at')
  .eq('is_available', false)          // Seulement les créneaux occupés
  .not('application_id', 'is', null)   // Avec une candidature liée
  .gte('date', monthStartStr)          // Date >= début du mois
  .lte('date', monthEndStr)            // Date <= fin du mois
  .order('date', { ascending: true })
  .order('time', { ascending: true });
```

**Implémentation Backend Requise** :
```http
GET /api/v1/interviews/slots?date_from=2025-10-01&date_to=2025-10-31&is_available=false&order=date:asc,time:asc

Response: 200 OK
{
  "data": [
    {
      "id": "uuid-1",
      "date": "2025-10-15",
      "time": "09:00:00",
      "application_id": "app-uuid-1",
      "candidate_name": "John Doe",
      "job_title": "Développeur Full Stack",
      "status": "scheduled",
      "is_available": false,
      "location": "Libreville",
      "notes": "Entretien programmé",
      "created_at": "2025-10-02T10:00:00Z",
      "updated_at": "2025-10-02T10:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "per_page": 50
}
```

**Comportements Spécifiques** :
1. ✅ Retourner **uniquement les créneaux occupés** (`is_available: false`)
2. ✅ Filtrer par **période** (date_from → date_to)
3. ✅ Trier par **date ASC, puis time ASC**
4. ✅ Inclure **candidate_name** et **job_title** (données dénormalisées pour performance)
5. ✅ Exclure les créneaux sans `application_id`

---

### 2. ➕ **POST** `/api/v1/interviews/slots` - Créer un Créneau

**Description** : Crée un nouveau créneau d'entretien

**Request Body** :
```typescript
{
  date: string;              // YYYY-MM-DD (ex: "2025-10-15")
  time: string;              // HH:mm:ss (ex: "09:00:00")
  application_id: string;    // UUID de la candidature
  candidate_name: string;    // Nom du candidat
  job_title: string;         // Titre du poste
  status?: string;           // Par défaut: "scheduled"
  location?: string;         // Lieu de l'entretien
  notes?: string;            // Notes supplémentaires
}
```

**Utilisation Actuelle (Supabase)** :
```typescript
// Ligne 275-288
const { error: insertError } = await supabase
  .from('interview_slots')
  .insert({
    date: draftDate,                    // "2025-10-15"
    time: draftTime,                    // "09:00:00"
    application_id: editingInterview.application_id,
    candidate_name: editingInterview.candidate_name,
    job_title: editingInterview.job_title,
    status: 'scheduled',
    is_available: false,
    notes: 'Entretien programmé',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
```

**Implémentation Backend Requise** :
```http
POST /api/v1/interviews/slots

Request Body:
{
  "date": "2025-10-15",
  "time": "09:00:00",
  "application_id": "app-uuid-1",
  "candidate_name": "John Doe",
  "job_title": "Développeur Full Stack",
  "status": "scheduled",
  "location": "Libreville",
  "notes": "Entretien technique"
}

Response: 201 Created
{
  "success": true,
  "message": "Créneau d'entretien créé avec succès",
  "data": {
    "id": "slot-uuid-new",
    "date": "2025-10-15",
    "time": "09:00:00",
    "application_id": "app-uuid-1",
    "candidate_name": "John Doe",
    "job_title": "Développeur Full Stack",
    "status": "scheduled",
    "is_available": false,
    "location": "Libreville",
    "notes": "Entretien technique",
    "created_at": "2025-10-02T14:30:00Z",
    "updated_at": "2025-10-02T14:30:00Z"
  }
}
```

**Validations Backend** :
1. ✅ **Vérifier que le créneau n'existe pas déjà** (date + time unique)
2. ✅ **Vérifier que le créneau n'est pas déjà occupé** par une autre candidature
3. ✅ **Valider le format de la date** (YYYY-MM-DD)
4. ✅ **Valider le format de l'heure** (HH:mm:ss)
5. ✅ **Vérifier que l'application_id existe** (FK constraint)
6. ✅ **Automatiquement set** `is_available: false` et `status: "scheduled"`
7. ✅ **Générer** `created_at` et `updated_at` automatiquement

**Erreurs Possibles** :
```http
409 Conflict - Créneau déjà occupé
{
  "success": false,
  "message": "Le créneau 2025-10-15 à 09:00 est déjà occupé",
  "error": "SLOT_ALREADY_TAKEN"
}

404 Not Found - Application inexistante
{
  "success": false,
  "message": "Candidature non trouvée",
  "error": "APPLICATION_NOT_FOUND"
}

400 Bad Request - Format invalide
{
  "success": false,
  "message": "Format de date invalide",
  "error": "INVALID_DATE_FORMAT"
}
```

---

### 3. ✏️ **PUT** `/api/v1/interviews/slots/{slot_id}` - Modifier un Créneau

**Description** : Met à jour un créneau d'entretien existant

**Path Parameter** :
- `slot_id` : UUID du créneau à modifier

**Request Body** (tous les champs sont optionnels) :
```typescript
{
  date?: string;              // YYYY-MM-DD
  time?: string;              // HH:mm:ss
  application_id?: string;    // Changer la candidature liée
  candidate_name?: string;
  job_title?: string;
  status?: string;            // "scheduled", "completed", "cancelled"
  location?: string;
  notes?: string;
}
```

**Utilisation Actuelle (Supabase)** :
```typescript
// CAS 1: Mise à jour simple (ligne 297-309)
const { error: updateError } = await supabase
  .from('interview_slots')
  .update({
    candidate_name: editingInterview.candidate_name,
    job_title: editingInterview.job_title,
    status: 'scheduled',
    updated_at: new Date().toISOString()
  })
  .eq('date', editingInterview.date)
  .eq('time', editingInterview.time)
  .eq('application_id', editingInterview.application_id);

// CAS 2: Mise à jour avec changement de date/heure (ligne 256-267)
const { error: updateError } = await supabase
  .from('interview_slots')
  .update({
    application_id: editingInterview.application_id,
    candidate_name: editingInterview.candidate_name,
    job_title: editingInterview.job_title,
    status: 'scheduled',
    is_available: false,
    notes: 'Entretien programmé',
    updated_at: new Date().toISOString()
  })
  .eq('id', existingSlot.id);
```

**Implémentation Backend Requise** :
```http
PUT /api/v1/interviews/slots/slot-uuid-1

Request Body:
{
  "date": "2025-10-16",      // Changement de date
  "time": "10:00:00",        // Changement d'heure
  "status": "scheduled",
  "notes": "Entretien reporté"
}

Response: 200 OK
{
  "success": true,
  "message": "Créneau d'entretien mis à jour avec succès",
  "data": {
    "id": "slot-uuid-1",
    "date": "2025-10-16",
    "time": "10:00:00",
    "application_id": "app-uuid-1",
    "candidate_name": "John Doe",
    "job_title": "Développeur Full Stack",
    "status": "scheduled",
    "is_available": false,
    "location": "Libreville",
    "notes": "Entretien reporté",
    "created_at": "2025-10-02T14:30:00Z",
    "updated_at": "2025-10-02T15:45:00Z"
  }
}
```

**Logique Métier Complexe - Changement de Date/Heure** :

Lorsque la **date** ou **l'heure** change, il faut :

1. **Libérer l'ancien créneau** (ligne 214-234)
   ```typescript
   // Marquer l'ancien créneau comme disponible
   await supabase
     .from('interview_slots')
     .update({ 
       is_available: true,
       application_id: null,
       candidate_id: null,
       candidate_name: null,
       job_title: null,
       status: 'cancelled',
       notes: 'Créneau libéré lors de la modification',
       updated_at: new Date().toISOString()
     })
     .eq('date', editingInterview.date)    // Ancienne date
     .eq('time', editingInterview.time);   // Ancienne heure
   ```

2. **Vérifier si le nouveau créneau existe** (ligne 237-242)
   ```typescript
   const { data: existingSlot } = await supabase
     .from('interview_slots')
     .select('id, application_id, is_available')
     .eq('date', draftDate)      // Nouvelle date
     .eq('time', draftTime)      // Nouvelle heure
     .maybeSingle();
   ```

3. **Gérer 3 scénarios** :
   - ✅ **Créneau libre** → Créer un nouveau créneau
   - ✅ **Créneau existe et disponible** → Mettre à jour le créneau existant
   - ❌ **Créneau occupé par une autre application** → Erreur 409

**Recommandation Backend** :

Le backend devrait gérer cette logique complexe **automatiquement** dans le PUT :

```typescript
// Backend doit faire:
PUT /api/v1/interviews/slots/{slot_id}
{
  "date": "2025-10-16",
  "time": "10:00:00"
}

// Backend doit:
// 1. Vérifier si date/heure changent
// 2. Si oui, libérer l'ancien créneau automatiquement
// 3. Vérifier que le nouveau créneau est libre
// 4. Créer ou mettre à jour le nouveau créneau
// 5. Retourner le créneau mis à jour
```

**Erreurs Possibles** :
```http
409 Conflict - Nouveau créneau déjà occupé
{
  "success": false,
  "message": "Le créneau 2025-10-16 à 10:00 est déjà occupé par une autre candidature",
  "error": "NEW_SLOT_ALREADY_TAKEN",
  "details": {
    "occupied_by": "app-uuid-other",
    "candidate_name": "Jane Smith"
  }
}

404 Not Found - Créneau inexistant
{
  "success": false,
  "message": "Créneau d'entretien non trouvé",
  "error": "SLOT_NOT_FOUND"
}
```

---

### 4. 🗑️ **DELETE** `/api/v1/interviews/slots/{slot_id}` - Supprimer/Annuler un Créneau

**Description** : Annule un créneau d'entretien (soft delete recommandé)

**Path Parameter** :
- `slot_id` : UUID du créneau à supprimer/annuler

**Utilisation Actuelle (Supabase)** :
```typescript
// Pas d'implémentation DELETE dans le code actuel
// Mais logique de "libération" de créneau similaire:

// Libérer = marquer comme disponible
await supabase
  .from('interview_slots')
  .update({ 
    is_available: true,
    application_id: null,
    candidate_id: null,
    candidate_name: null,
    job_title: null,
    status: 'cancelled',
    notes: 'Créneau libéré',
    updated_at: new Date().toISOString()
  })
  .eq('id', slotId);
```

**Implémentation Backend Recommandée (Soft Delete)** :
```http
DELETE /api/v1/interviews/slots/slot-uuid-1

Response: 200 OK
{
  "success": true,
  "message": "Entretien annulé avec succès",
  "data": {
    "id": "slot-uuid-1",
    "status": "cancelled",
    "is_available": true,
    "application_id": null,
    "notes": "Entretien annulé",
    "updated_at": "2025-10-02T16:00:00Z"
  }
}
```

**Logique Backend** :
- ✅ **Soft delete** : Ne pas supprimer physiquement, juste mettre `status: "cancelled"`
- ✅ **Libérer le créneau** : `is_available: true`
- ✅ **Dissocier la candidature** : `application_id: null`
- ✅ **Garder l'historique** : Conserver les données pour audit

**Alternative - Hard Delete** :
```http
DELETE /api/v1/interviews/slots/slot-uuid-1?permanent=true

Response: 204 No Content
```

---

## 🔄 Logique de Filtrage Spécifique

### Filtrage "Dernier Entretien par Candidat"

**Problème** : Un candidat peut avoir plusieurs entretiens (programmés, annulés, reportés).  
**Solution** : Afficher **uniquement le dernier entretien** par candidat.

**Code Actuel (Frontend)** - Lignes 132-151 :
```typescript
// 4) Grouper par application_id
const interviewsByApplication = allInterviews.reduce((acc, interview) => {
  if (interview.application_id) {
    if (!acc[interview.application_id]) {
      acc[interview.application_id] = [];
    }
    acc[interview.application_id].push(interview);
  }
  return acc;
}, {});

// 5) Pour chaque application, garder seulement le plus récent
const formattedInterviews = Object.values(interviewsByApplication).map(applicationInterviews => {
  return applicationInterviews.sort((a, b) => {
    const dateA = new Date(a.updated_at || a.created_at || 0);
    const dateB = new Date(b.updated_at || b.created_at || 0);
    return dateB.getTime() - dateA.getTime(); // Plus récent en premier
  })[0]; // Prendre le premier (le plus récent)
});
```

**Recommandation Backend** :

Ajouter un **query parameter** `latest_per_application` :

```http
GET /api/v1/interviews/slots?date_from=2025-10-01&date_to=2025-10-31&latest_per_application=true

// Backend doit retourner uniquement le dernier entretien par application_id
// Tri: updated_at DESC ou created_at DESC
```

**SQL Backend (exemple PostgreSQL)** :
```sql
WITH ranked_slots AS (
  SELECT *,
         ROW_NUMBER() OVER (
           PARTITION BY application_id 
           ORDER BY updated_at DESC, created_at DESC
         ) as rn
  FROM interview_slots
  WHERE date >= '2025-10-01' 
    AND date <= '2025-10-31'
    AND is_available = false
    AND application_id IS NOT NULL
)
SELECT * FROM ranked_slots WHERE rn = 1
ORDER BY date ASC, time ASC;
```

---

## 📊 Enrichissement des Données

### Jointure avec Applications et Users

**Code Actuel (Supabase)** - Lignes 92-108 :
```typescript
// Récupérer les applications liées avec les infos utilisateur et offre
const { data: apps } = await supabase
  .from('applications')
  .select(`
    id,
    job_offers ( title ),
    users ( first_name, last_name )
  `)
  .in('id', applicationIds);

// Fusionner avec les slots
const candidate_name = slot.candidate_name || `${firstName} ${lastName}`.trim();
const job_title = slot.job_title || jobTitle;
```

**Recommandation Backend** :

### Option 1 : Dénormalisation (Recommandé pour performance)

Stocker directement `candidate_name` et `job_title` dans `interview_slots` lors de la création :

```typescript
POST /api/v1/interviews/slots
{
  "application_id": "app-uuid-1",
  "candidate_name": "John Doe",    // ✅ Pré-rempli depuis l'application
  "job_title": "Développeur",      // ✅ Pré-rempli depuis l'application
  "date": "2025-10-15",
  "time": "09:00:00"
}
```

**Avantages** :
- ✅ Pas de jointure nécessaire
- ✅ Performance optimale
- ✅ Données disponibles même si l'application est supprimée

### Option 2 : Endpoint avec jointure automatique

```http
GET /api/v1/interviews/slots?include=application,candidate,job

Response:
{
  "data": [
    {
      "id": "slot-uuid-1",
      "date": "2025-10-15",
      "time": "09:00:00",
      "application_id": "app-uuid-1",
      "candidate_name": "John Doe",
      "job_title": "Développeur",
      "application": {           // ✅ Inclus si ?include=application
        "id": "app-uuid-1",
        "status": "incubation",
        "candidate": {           // ✅ Inclus si ?include=candidate
          "first_name": "John",
          "last_name": "Doe",
          "email": "john@example.com"
        },
        "job_offer": {           // ✅ Inclus si ?include=job
          "title": "Développeur Full Stack",
          "department": "IT"
        }
      }
    }
  ]
}
```

**Recommandation** : **Option 1 (Dénormalisation)** pour ce cas d'usage (calendrier).

---

## 🎨 Créneaux Horaires Prédéfinis

**Code Actuel** - Ligne 47 :
```typescript
const timeSlots = ['08:00:00','09:00:00','10:00:00','11:00:00','13:00:00','14:00:00','15:00:00','16:00:00','17:00:00'];
```

**Recommandation Backend** :

### Option 1 : Générer dynamiquement les créneaux disponibles

```http
GET /api/v1/interviews/slots/available?date=2025-10-15

Response:
{
  "date": "2025-10-15",
  "available_slots": [
    {
      "time": "08:00:00",
      "is_available": true,
      "slot_id": null
    },
    {
      "time": "09:00:00",
      "is_available": false,
      "slot_id": "slot-uuid-1",
      "occupied_by": "John Doe"
    },
    {
      "time": "10:00:00",
      "is_available": true,
      "slot_id": null
    }
  ]
}
```

### Option 2 : Configuration côté backend

Stocker les créneaux horaires dans une table de configuration :

```sql
CREATE TABLE interview_time_config (
  time VARCHAR(8) PRIMARY KEY,  -- "09:00:00"
  is_enabled BOOLEAN DEFAULT true,
  display_order INTEGER
);
```

---

## 🔐 Permissions et Sécurité

### Règles de Permissions

| Rôle | GET | POST | PUT | DELETE |
|------|-----|------|-----|--------|
| **Admin** | ✅ Tous | ✅ Tous | ✅ Tous | ✅ Tous |
| **Recruiter** | ✅ Ses applications | ✅ Ses applications | ✅ Ses créneaux | ✅ Ses créneaux |
| **Observer** | ✅ Tous (lecture) | ❌ | ❌ | ❌ |
| **Candidate** | ✅ Ses entretiens | ❌ | ❌ | ❌ |

**Backend doit vérifier** :
- ✅ Le recruteur ne peut modifier que les entretiens de **ses propres offres**
- ✅ Le candidat ne peut voir que **ses propres entretiens**
- ✅ L'observateur peut **tout voir** mais **rien modifier**

**Filtrage Automatique par Rôle** :
```http
GET /api/v1/interviews/slots

// Si user = Recruiter → Filtrer automatiquement par ses offres
// Si user = Candidate → Filtrer par ses candidatures
// Si user = Observer/Admin → Voir tout
```

---

## 🧪 Tests Backend Recommandés

### Test 1 : Créer un créneau
```http
POST /api/v1/interviews/slots
{
  "date": "2025-10-15",
  "time": "09:00:00",
  "application_id": "app-1"
}
→ 201 Created ✅
```

### Test 2 : Créer un créneau déjà occupé
```http
POST /api/v1/interviews/slots
{
  "date": "2025-10-15",
  "time": "09:00:00",    // Déjà occupé
  "application_id": "app-2"
}
→ 409 Conflict ❌
```

### Test 3 : Modifier la date d'un entretien
```http
PUT /api/v1/interviews/slots/slot-1
{
  "date": "2025-10-16"   // Changement de date
}
→ 200 OK ✅
→ Ancien créneau libéré automatiquement
```

### Test 4 : Lister les créneaux du mois
```http
GET /api/v1/interviews/slots?date_from=2025-10-01&date_to=2025-10-31
→ 200 OK ✅
→ Liste triée par date ASC, time ASC
```

### Test 5 : Annuler un entretien
```http
DELETE /api/v1/interviews/slots/slot-1
→ 200 OK ✅
→ Status = "cancelled", is_available = true
```

---

## 📝 Résumé - Routes à Implémenter

| Méthode | Route | Description | Priorité |
|---------|-------|-------------|----------|
| **GET** | `/api/v1/interviews/slots` | Lister créneaux avec filtres | 🔴 Haute |
| **POST** | `/api/v1/interviews/slots` | Créer un créneau | 🔴 Haute |
| **PUT** | `/api/v1/interviews/slots/{id}` | Modifier un créneau | 🔴 Haute |
| **DELETE** | `/api/v1/interviews/slots/{id}` | Annuler un créneau | 🟡 Moyenne |
| **GET** | `/api/v1/interviews/slots/available` | Créneaux disponibles (bonus) | 🟢 Basse |

---

## 🚀 Migration Frontend

Une fois les routes Backend implémentées, mettre à jour `InterviewCalendarModal.tsx` :

```typescript
// Remplacer
import { supabase } from '@/integrations/supabase/client';

// Par
import { 
  listSlots, 
  createSlot, 
  updateSlot, 
  deleteSlot 
} from '@/integrations/api/interviews';

// Puis remplacer les appels Supabase par les appels API Backend
const slots = await listSlots({
  date_from: monthStartStr,
  date_to: monthEndStr,
  is_available: false
});
```

---

**Date de spécification** : 2025-10-02  
**Fichier source** : `src/components/evaluation/InterviewCalendarModal.tsx`  
**Status** : ⚠️ En attente d'implémentation Backend

