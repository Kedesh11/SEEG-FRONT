# ✅ Guide de Vérification - Communication API Backend

Ce guide vous permet de vérifier que l'application communique correctement avec l'API backend.

---

## 🔍 Vérification Rapide (2 minutes)

### Étape 1 : Ouvrir la Console du Navigateur

1. Ouvrez votre navigateur
2. Allez sur `http://localhost:8080`
3. Appuyez sur **F12** pour ouvrir les DevTools
4. Cliquez sur l'onglet **Console**

### Étape 2 : Vérifier les Messages de Démarrage

Recherchez ces messages dans la console :

```
✅ 🔧 Mode développement détecté - utilisation du proxy Vite pour les requêtes API
```

Si vous voyez ce message → **Proxy configuré correctement ✅**

### Étape 3 : Tester une Connexion

1. Cliquez sur **Se connecter** dans l'application
2. Entrez des identifiants (même incorrects)
3. Regardez la console

**Vous devriez voir :**
```
✅ 🌐 API Request: /api/v1/auth/login → /api/v1/auth/login
```

**Vous NE devez PAS voir :**
```
❌ Access to fetch at 'https://seeg-backend-api...' blocked by CORS
❌ Error: supabaseUrl is required
```

---

## 📊 Vérification Détaillée

### Test 1 : Authentification
- [ ] Aller sur la page de connexion
- [ ] Essayer de se connecter
- [ ] Vérifier dans la console : requête vers `/api/v1/auth/login`
- [ ] Pas d'erreur CORS

### Test 2 : Liste des Offres
- [ ] Aller sur la page d'accueil
- [ ] Vérifier que les offres d'emploi s'affichent
- [ ] Vérifier dans la console : requête vers `/api/v1/jobs`
- [ ] Pas d'erreur CORS

### Test 3 : Inscription (Optionnel)
- [ ] Cliquer sur "S'inscrire"
- [ ] Remplir le formulaire
- [ ] Soumettre
- [ ] Vérifier dans la console : requête vers `/api/v1/auth/signup`
- [ ] Pas d'erreur CORS

---

## 🔧 Vérification Technique

### Vérifier le Proxy Vite

1. Ouvrez `vite.config.ts`
2. Vérifiez la présence de cette configuration :

```typescript
server: {
  host: "::",
  port: 8080,
  proxy: {
    '/api': {
      target: 'https://seeg-backend-api.azurewebsites.net',
      changeOrigin: true,
      secure: true,
      rewrite: (path) => path,
    },
  },
}
```

### Vérifier l'Absence de Supabase

1. Recherchez dans le code :

```bash
# Rechercher les imports Supabase (doit retourner 0 résultats)
grep -r "from '@/integrations/supabase" src/

# Rechercher les appels Supabase actifs (doit retourner 0 résultats)
grep -r "supabase\." src/ --include="*.ts" --include="*.tsx"
```

---

## 📸 Capture d'Écran de la Console

### ✅ Console Correcte (Bon fonctionnement)

```
🔧 Mode développement détecté - utilisation du proxy Vite pour les requêtes API
🌐 API Request: /api/v1/jobs → /api/v1/jobs
🌐 API Request: /api/v1/auth/login → /api/v1/auth/login
```

### ❌ Console Incorrecte (Problème à résoudre)

```
Access to fetch at 'https://seeg-backend-api.azurewebsites.net/api/v1/auth/login' 
from origin 'http://localhost:8080' has been blocked by CORS policy
```

Si vous voyez ça → Consultez `TROUBLESHOOTING.md`

---

## 🌐 Vérification Réseau (Avancé)

### Ouvrir l'Onglet Network

1. F12 → Onglet **Network**
2. Filtrer par **Fetch/XHR**
3. Effectuer une action (connexion, chargement offres, etc.)
4. Observer les requêtes

### Ce Que Vous Devriez Voir :

```
Method   Status   URL
------   ------   ---
POST     200      /api/v1/auth/login
GET      200      /api/v1/jobs
GET      200      /api/v1/users/me
```

### Headers de Requête à Vérifier :

- ✅ `Authorization: Bearer <token>` (pour les requêtes authentifiées)
- ✅ `Content-Type: application/json`
- ✅ `Accept: application/json`

---

## ❓ Que Faire en Cas de Problème

### Problème : Erreurs CORS

**Solution :**
1. Arrêter le serveur (Ctrl+C)
2. Nettoyer le cache : `Remove-Item -Recurse -Force node_modules\.vite`
3. Redémarrer : `npm run dev`

### Problème : Requêtes vers l'URL complète Azure

**Symptôme :** 
```
🌐 API Request: /api/v1/auth/login → https://seeg-backend-api.azurewebsites.net/api/v1/auth/login
```

**Solution :**
Le proxy ne fonctionne pas. Redémarrez complètement le serveur.

### Problème : Erreur Supabase

**Symptôme :**
```
Error: supabaseUrl is required
```

**Solution :**
Des fichiers Supabase existent encore. Consultez `MIGRATION-API-BACKEND.md` pour la liste des fichiers à vérifier.

---

## ✅ Checklist Finale

- [ ] Message "🔧 Mode développement détecté" visible
- [ ] Toutes les requêtes API sont relatives (`/api/v1/*`)
- [ ] Aucune erreur CORS dans la console
- [ ] Aucune référence à Supabase dans les erreurs
- [ ] L'authentification fonctionne
- [ ] Les offres d'emploi se chargent
- [ ] Les candidatures peuvent être soumises

---

## 📞 Support

Si tous les tests passent → **🎉 L'application communique correctement avec l'API backend !**

Si des tests échouent → Consultez :
1. `TROUBLESHOOTING.md` - Solutions aux problèmes courants
2. `DEMARRAGE-RAPIDE.md` - Guide de redémarrage
3. `MIGRATION-API-BACKEND.md` - Documentation complète de la migration

