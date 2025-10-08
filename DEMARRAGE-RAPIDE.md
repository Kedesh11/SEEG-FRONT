# 🚀 Démarrage Rapide

## ⚠️ IMPORTANT : Redémarrage Requis

Si vous rencontrez des erreurs CORS, vous DEVEZ redémarrer le serveur de développement pour que les changements de configuration prennent effet.

## 📋 Étapes de Configuration

### 1. Arrêter le Serveur Actuel

Dans le terminal où tourne le serveur de développement :
- Appuyez sur `Ctrl+C` (Windows/Linux) ou `Cmd+C` (Mac)
- Attendez que le processus se termine complètement

### 2. Nettoyer le Cache Vite (Recommandé)

**Sur Windows (PowerShell) :**
```powershell
Remove-Item -Recurse -Force node_modules\.vite
```

**Sur Linux/Mac :**
```bash
rm -rf node_modules/.vite
```

### 3. Redémarrer le Serveur

```bash
npm run dev
```

### 4. Vérifier le Bon Fonctionnement

Ouvrez votre navigateur et allez sur `http://localhost:8080`

**Ouvrez la console du navigateur** (F12) et vérifiez les messages :

✅ **Vous devriez voir :**
```
🔧 Mode développement détecté - utilisation du proxy Vite pour les requêtes API
```

Quand vous essayez de vous connecter :
```
🌐 API Request: /api/v1/auth/login → /api/v1/auth/login
```

❌ **Vous NE devez PAS voir :**
```
Access to fetch at 'https://seeg-backend-api.azurewebsites.net...' has been blocked by CORS
```

---

## 🔧 Configuration Effectuée

Les modifications suivantes ont été apportées pour résoudre les problèmes CORS :

### 1. Proxy Vite (`vite.config.ts`)
Un proxy a été configuré pour rediriger toutes les requêtes `/api/*` vers le backend Azure en développement.

### 2. Client API (`src/integrations/api/client.ts`)
Le client détecte automatiquement le mode développement et utilise des URLs relatives qui sont interceptées par le proxy.

### 3. Client Supabase (`src/integrations/supabase/client.ts`)
Créé avec des valeurs par défaut pour éviter les erreurs si Supabase n'est pas configuré.

---

## 📚 Documentation Disponible

- **CONFIGURATION.md** : Guide complet de configuration
- **TROUBLESHOOTING.md** : Solutions aux problèmes courants
- **src/integrations/api/README.md** : Documentation du client API

---

## ✅ Checklist de Vérification

Avant de commencer à utiliser l'application :

- [ ] Le serveur de développement a été redémarré
- [ ] Le cache Vite a été nettoyé (optionnel mais recommandé)
- [ ] Le message "🔧 Mode développement détecté" apparaît dans la console
- [ ] Les requêtes API utilisent des URLs relatives (`/api/v1/...`)
- [ ] Aucune erreur CORS dans la console

---

## 🆘 Besoin d'Aide ?

Si les problèmes persistent, consultez **TROUBLESHOOTING.md** pour des solutions détaillées.

### Logs Utiles pour le Débogage

Ouvrez la console du navigateur (F12 → Console) et cherchez :
- Messages préfixés par 🔧 (configuration)
- Messages préfixés par 🌐 (requêtes API)
- Erreurs en rouge

Ces informations sont essentielles pour diagnostiquer les problèmes.

