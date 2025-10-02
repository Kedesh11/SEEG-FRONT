# 🔌 API Endpoints - Documentation Complète

## 🌐 Base URL

```
https://seeg-backend-api.azurewebsites.net
```

---

## 🔐 Authentification

Toutes les requêtes authentifiées nécessitent un header :
```http
Authorization: Bearer {JWT_TOKEN}
```

Le token est stocké dans `localStorage` sous la clé `hcm_access_token`.

---

## 📋 Table des Matières

- [Authentication](#authentication)
- [Users](#users)
- [Jobs](#jobs)
- [Applications](#applications)
- [Evaluations](#evaluations)
- [Interviews](#interviews)
- [Notifications](#notifications)
- [Emails](#emails)
- [Optimized](#optimized)
- [Webhooks](#webhooks)

---

## 🔑 Authentication

### POST `/api/v1/auth/login`
Connexion utilisateur.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": { ... }
}
```

### POST `/api/v1/auth/signup`
Inscription nouvel utilisateur.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "candidate"
}
```

### POST `/api/v1/auth/refresh-token`
Rafraîchir le token JWT.

### POST `/api/v1/auth/logout`
Déconnexion utilisateur.

### POST `/api/v1/auth/forgot-password`
Demande de réinitialisation de mot de passe.

### POST `/api/v1/auth/reset-password`
Réinitialiser le mot de passe.

### POST `/api/v1/auth/create-first-admin`
Créer le premier administrateur (si aucun admin n'existe).

---

## 👥 Users

### GET `/api/v1/users/`
Liste tous les utilisateurs (Admin/Observer uniquement).

**Query Params:**
- `role` : Filtrer par rôle
- `page` : Numéro de page
- `per_page` : Éléments par page

### GET `/api/v1/users/{id}`
Détails d'un utilisateur spécifique.

### DELETE `/api/v1/users/{id}`
Supprimer un utilisateur (Admin uniquement).

### GET `/api/v1/users/me`
Informations de l'utilisateur connecté.

### PUT `/api/v1/users/me`
Mettre à jour les informations de l'utilisateur connecté.

**Request:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+241 01 23 45 67"
}
```

### GET `/api/v1/users/me/profile`
Profil complet de l'utilisateur connecté.

---

## 💼 Jobs

### GET `/api/v1/jobs/`
Liste toutes les offres d'emploi.

**Query Params:**
- `status` : active, closed, draft
- `department` : Filtrer par département
- `recruiter_id` : Filtrer par recruteur

### GET `/api/v1/jobs/{id}`
Détails d'une offre d'emploi.

### POST `/api/v1/jobs/`
Créer une nouvelle offre d'emploi (Recruiter/Admin).

**Request:**
```json
{
  "title": "Développeur Full Stack",
  "description": "...",
  "location": "Libreville",
  "contract_type": "CDI",
  "department": "IT",
  "requirements": ["React", "Node.js"],
  "benefits": ["Assurance", "Télétravail"],
  "salary_min": 800000,
  "salary_max": 1200000
}
```

### PUT `/api/v1/jobs/{id}`
Mettre à jour une offre d'emploi.

### DELETE `/api/v1/jobs/{id}`
Supprimer une offre d'emploi.

### GET `/api/v1/jobs/{id}/applications`
Candidatures pour une offre spécifique.

### GET `/api/v1/jobs/recruiter/my-jobs`
Mes offres d'emploi (Recruiter).

### GET `/api/v1/jobs/recruiter/statistics`
Statistiques du recruteur ⭐ **Route Recommandée**.

**Response:**
```json
{
  "total_jobs": 25,
  "active_jobs": 18,
  "total_applications": 142,
  "new_applications": 12,
  "applications_by_status": {
    "candidature": 45,
    "incubation": 30,
    "embauche": 15,
    "refuse": 52
  },
  "applications_by_job": {
    "job-uuid-1": 25,
    "job-uuid-2": 18
  }
}
```

---

## 📝 Applications

### GET `/api/v1/applications/`
Liste toutes les candidatures.

**Query Params:**
- `job_offer_id` : Filtrer par offre
- `candidate_id` : Filtrer par candidat
- `status` : pending, shortlisted, rejected, hired

### GET `/api/v1/applications/{id}`
Détails d'une candidature.

### POST `/api/v1/applications/`
Créer une nouvelle candidature.

**Request:**
```json
{
  "job_offer_id": "uuid",
  "candidate_id": "uuid",
  "reference_contacts": "John Doe, +241...",
  "availability_start": "2025-11-01"
}
```

### PUT `/api/v1/applications/{id}`
Mettre à jour une candidature.

### DELETE `/api/v1/applications/{id}`
Supprimer une candidature.

### GET `/api/v1/applications/{id}/documents`
Documents d'une candidature.

### POST `/api/v1/applications/{id}/documents`
Uploader un document.

**Request:** FormData
```
file: (PDF, DOCX, max 10MB)
document_type: cv, cover_letter, diploma
```

### POST `/api/v1/applications/{id}/documents/multiple`
Uploader plusieurs documents.

### GET `/api/v1/applications/{id}/documents/{doc_id}/download`
Télécharger un document.

### DELETE `/api/v1/applications/{id}/documents/{doc_id}`
Supprimer un document.

### GET `/api/v1/applications/{id}/history`
Historique des modifications d'une candidature.

### POST `/api/v1/applications/drafts/`
Créer un brouillon de candidature.

### GET `/api/v1/applications/drafts/{id}`
Récupérer un brouillon.

### PUT `/api/v1/applications/drafts/{id}`
Mettre à jour un brouillon.

### DELETE `/api/v1/applications/drafts/{id}`
Supprimer un brouillon.

### POST `/api/v1/applications/drafts/{id}/submit`
Soumettre un brouillon (le convertir en candidature).

### GET `/api/v1/applications/stats/overview`
Statistiques générales des candidatures.

### GET `/api/v1/applications/stats/advanced`
Statistiques avancées des candidatures.

**Response:**
```json
{
  "total": 142,
  "by_job": {
    "job-uuid-1": 25,
    "job-uuid-2": 18
  },
  "by_period": {
    "2025-10-01": 5,
    "2025-10-02": 7
  },
  "conversion_rates": {
    "candidature_to_incubation": 0.35,
    "incubation_to_embauche": 0.45
  }
}
```

---

## 📊 Evaluations

### GET `/api/v1/evaluations/protocol-1/`
Liste des évaluations Protocole 1.

### GET `/api/v1/evaluations/protocol-1/{id}`
Détails d'une évaluation Protocole 1.

### POST `/api/v1/evaluations/protocol-1/`
Créer une évaluation Protocole 1.

### PUT `/api/v1/evaluations/protocol-1/{id}`
Mettre à jour une évaluation Protocole 1.

### DELETE `/api/v1/evaluations/protocol-1/{id}`
Supprimer une évaluation Protocole 1.

### GET `/api/v1/evaluations/protocol-2/`
Liste des évaluations Protocole 2.

### GET `/api/v1/evaluations/protocol-2/{id}`
Détails d'une évaluation Protocole 2.

### POST `/api/v1/evaluations/protocol-2/`
Créer une évaluation Protocole 2.

### PUT `/api/v1/evaluations/protocol-2/{id}`
Mettre à jour une évaluation Protocole 2.

### DELETE `/api/v1/evaluations/protocol-2/{id}`
Supprimer une évaluation Protocole 2.

### GET `/api/v1/evaluations/stats`
Statistiques des évaluations.

---

## 📅 Interviews

### GET `/api/v1/interviews/slots/`
Liste des créneaux d'entretien.

### GET `/api/v1/interviews/slots/{id}`
Détails d'un créneau.

### POST `/api/v1/interviews/slots/`
Créer un créneau d'entretien.

**Request:**
```json
{
  "application_id": "uuid",
  "scheduled_at": "2025-10-15T10:00:00Z",
  "location": "Bureau RH",
  "interview_type": "technique"
}
```

### PUT `/api/v1/interviews/slots/{id}`
Mettre à jour un créneau.

### DELETE `/api/v1/interviews/slots/{id}`
Supprimer un créneau.

### GET `/api/v1/interviews/stats`
Statistiques des entretiens.

---

## 🔔 Notifications

### GET `/api/v1/notifications/`
Liste des notifications de l'utilisateur connecté.

### GET `/api/v1/notifications/{id}`
Détails d'une notification.

### POST `/api/v1/notifications/`
Créer une notification (Admin/System).

### PUT `/api/v1/notifications/{id}/read`
Marquer une notification comme lue.

### PUT `/api/v1/notifications/read-all`
Marquer toutes les notifications comme lues.

### DELETE `/api/v1/notifications/{id}`
Supprimer une notification.

### GET `/api/v1/notifications/stats`
Statistiques des notifications.

---

## 📧 Emails

### POST `/api/v1/emails/send`
Envoyer un email générique.

**Request:**
```json
{
  "to": "candidate@example.com",
  "subject": "Confirmation de candidature",
  "body": "Votre candidature a été reçue..."
}
```

### POST `/api/v1/emails/send-interview`
Envoyer un email d'invitation à l'entretien.

**Request:**
```json
{
  "application_id": "uuid",
  "interview_date": "2025-10-15T10:00:00Z",
  "location": "Bureau RH",
  "additional_info": "Apporter CV et diplômes"
}
```

---

## ⚡ Optimized

### GET `/api/v1/optimized/dashboard/stats/optimized`
Dashboard optimisé (toutes les stats pré-calculées).

**Response:**
```json
{
  "stats": {
    "totalJobs": 25,
    "totalCandidates": 142,
    "newCandidates": 12,
    "interviewsScheduled": 8
  },
  "activeJobs": [...],
  "jobCoverage": [...],
  "statusEvolution": [...],
  "applicationsPerJob": [...]
}
```

### GET `/api/v1/optimized/applications/optimized`
Candidatures optimisées avec données enrichies.

---

## 🪝 Webhooks

### POST `/api/v1/webhooks/application-submitted`
Webhook déclenché lors de la soumission d'une candidature.

**Payload:**
```json
{
  "application_id": "uuid",
  "job_offer_id": "uuid",
  "candidate_id": "uuid",
  "timestamp": "2025-10-02T10:00:00Z"
}
```

---

## 🚨 Codes d'Erreur

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Créé |
| 204 | Succès sans contenu |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Non trouvé |
| 409 | Conflit |
| 422 | Entité non traitable |
| 500 | Erreur serveur |

---

## 📚 Ressources

- **API Docs (Swagger)** : https://seeg-backend-api.azurewebsites.net/docs
- **Frontend Repo** : https://github.com/seeg/frontend
- **Support** : support@seeg.ga

---

**Dernière mise à jour** : 2025-10-02  
**Version API** : v1

