# Guide de Dépannage

## Problème: Erreurs CORS en Développement

### Symptômes
```
Access to fetch at 'https://seeg-backend-api.azurewebsites.net/api/v1/auth/login' 
from origin 'http://localhost:8080' has been blocked by CORS policy
```

### Diagnostic

1. **Vérifier les logs dans la console du navigateur**
   
   Vous devriez voir ces messages lors du démarrage :
   ```
   🔧 Mode développement détecté - utilisation du proxy Vite pour les requêtes API
   ```
   
   Et pour chaque requête API :
   ```
   🌐 API Request: /api/v1/auth/login → /api/v1/auth/login
   ```

2. **Vérifier que le serveur de développement est bien redémarré**
   
   Les changements dans `vite.config.ts` nécessitent un redémarrage complet :
   ```bash
   # Arrêter le serveur (Ctrl+C dans le terminal)
   # Puis redémarrer
   npm run dev
   ```

### Solutions

#### Solution 1 : Redémarrage Complet
```bash
# 1. Arrêter le serveur de développement (Ctrl+C)

# 2. Nettoyer le cache de Vite (optionnel mais recommandé)
rm -rf node_modules/.vite
# Ou sur Windows PowerShell
Remove-Item -Recurse -Force node_modules\.vite

# 3. Redémarrer le serveur
npm run dev
```

#### Solution 2 : Vérifier la Configuration du Proxy

Ouvrez `vite.config.ts` et vérifiez que le proxy est bien configuré :

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

#### Solution 3 : Forcer l'Utilisation du Proxy

Si le proxy ne fonctionne toujours pas, vous pouvez forcer l'URL locale dans un fichier `.env` :

```env
VITE_API_BASE_URL=
```

⚠️ **Important** : Ne mettez aucune valeur après le `=`, laissez-le vide pour utiliser les URLs relatives.

### Vérification du Fonctionnement

Une fois le serveur redémarré, essayez de vous connecter. Dans la console :

1. ✅ **Fonctionnement correct** :
   ```
   🔧 Mode développement détecté - utilisation du proxy Vite pour les requêtes API
   🌐 API Request: /api/v1/auth/login → /api/v1/auth/login
   ```

2. ❌ **Problème persistant** :
   ```
   🌐 API Request: /api/v1/auth/login → https://seeg-backend-api.azurewebsites.net/api/v1/auth/login
   ```
   
   Si vous voyez l'URL complète, le proxy n'est pas utilisé.

---

## Problème: Variables d'Environnement Supabase Manquantes

### Symptômes
```
Error: supabaseUrl is required
⚠️ Variables d'environnement Supabase manquantes
```

### Solution

C'est normal si vous n'utilisez pas Supabase. L'application fonctionne sans Supabase pour la plupart des fonctionnalités.

Si vous voulez activer Supabase, créez un fichier `.env` :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_key
```

---

## Problème: Le Serveur ne Démarre Pas

### Symptômes
```
Error: Cannot find module ...
```

### Solution

Réinstaller les dépendances :

```bash
# Supprimer node_modules et le lock file
rm -rf node_modules package-lock.json
# Ou sur Windows PowerShell
Remove-Item -Recurse -Force node_modules, package-lock.json

# Réinstaller
npm install

# Redémarrer
npm run dev
```

---

## Problème: Le Build Échoue

### Symptômes
```
Build failed with errors
```

### Vérifications

1. **Linter**
   ```bash
   npm run lint
   ```

2. **TypeScript**
   ```bash
   npx tsc --noEmit
   ```

3. **Nettoyer et rebuilder**
   ```bash
   # Nettoyer le dossier dist
   rm -rf dist
   
   # Rebuilder
   npm run build
   ```

---

## Obtenir de l'Aide

Si les problèmes persistent :

1. **Vérifier les logs complets** dans la console du navigateur
2. **Vérifier les logs du serveur** dans le terminal
3. **Vérifier la documentation** dans `CONFIGURATION.md`
4. **Contacter le support technique** avec :
   - Les logs d'erreur complets
   - La version de Node.js (`node --version`)
   - Le système d'exploitation
   - Les étapes pour reproduire le problème

