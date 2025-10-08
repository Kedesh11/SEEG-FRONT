# Client API

## Vue d'ensemble

Le client API est un wrapper léger autour de `fetch` qui gère :
- Les en-têtes HTTP automatiques (Authorization, Content-Type, Accept)
- La configuration de l'URL de base (développement vs production)
- Le contournement CORS en développement via proxy Vite
- La gestion des erreurs et des réponses

## Utilisation

```typescript
import { api } from "@/integrations/api/client";

// GET request
const { data } = await api.get("/api/v1/users");

// POST request
const { data } = await api.post("/api/v1/auth/signup", {
  email: "user@example.com",
  password: "password123"
});

// PUT request
const { data } = await api.put("/api/v1/users/123", {
  first_name: "John"
});

// DELETE request
const { data } = await api.delete("/api/v1/users/123");

// Download file (blob)
const { data: blob } = await api.get("/api/v1/export/pdf", {
  responseType: "blob"
});
```

## Authentification

Le client API lit automatiquement le token JWT depuis `localStorage.getItem("hcm_access_token")` et l'ajoute à chaque requête dans l'en-tête `Authorization: Bearer <token>`.

## Configuration des URLs

### Développement (localhost)
- Les requêtes sont faites vers le chemin relatif (ex: `/api/v1/users`)
- Le proxy Vite (configuré dans `vite.config.ts`) les redirige vers le backend Azure
- Cela évite les problèmes CORS

### Production
- Les requêtes sont faites directement vers `https://seeg-backend-api.azurewebsites.net`
- Ou vers l'URL définie dans `VITE_API_BASE_URL`

## Gestion des Erreurs

Le client lance une `Error` si la réponse HTTP n'est pas OK (status >= 400) :

```typescript
try {
  const { data } = await api.post("/api/v1/auth/login", credentials);
} catch (error) {
  console.error("Login failed:", error.message);
  // error.message contient le message d'erreur du serveur
}
```

## Types de Réponse

Par défaut, le client attend une réponse JSON, mais vous pouvez spécifier d'autres types :

```typescript
// JSON (par défaut)
const { data } = await api.get("/api/v1/users");

// Blob (fichiers)
const { data } = await api.get("/api/v1/export/pdf", {
  responseType: "blob"
});

// Texte brut
const { data } = await api.get("/api/v1/logs", {
  responseType: "text"
});
```

## En-têtes Personnalisés

Vous pouvez ajouter des en-têtes personnalisés à chaque requête :

```typescript
const { data } = await api.post("/api/v1/upload", formData, {
  headers: {
    "X-Custom-Header": "value"
  }
});
```

## Annulation de Requête

Utilisez `AbortController` pour annuler une requête :

```typescript
const controller = new AbortController();

const { data } = await api.get("/api/v1/users", {
  signal: controller.signal
});

// Pour annuler la requête
controller.abort();
```

## FormData

Le client détecte automatiquement les données `FormData` et n'ajoute pas l'en-tête `Content-Type` (laissant le navigateur le gérer) :

```typescript
const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("name", "My File");

const { data } = await api.post("/api/v1/upload", formData);
```

