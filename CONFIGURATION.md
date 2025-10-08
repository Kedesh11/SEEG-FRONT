# Configuration de l'Application

## Variables d'Environnement

Pour configurer l'application, créez un fichier `.env` à la racine du dossier `SEEG-FRONT` avec les variables suivantes :

### ⚠️ Note sur Supabase

**L'application n'utilise PLUS Supabase.** Toutes les fonctionnalités communiquent directement avec l'API backend Azure.

Les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` ne sont plus nécessaires et peuvent être supprimées si elles existent.

### Configuration de l'API Backend

L'application utilise un backend API Azure par défaut :

```env
VITE_API_BASE_URL=https://seeg-backend-api.azurewebsites.net
```

Cette variable est optionnelle. Si elle n'est pas définie :
- **En développement** : Un proxy Vite redirige automatiquement les requêtes `/api/*` vers le backend Azure (contournement CORS)
- **En production** : L'URL par défaut du backend Azure est utilisée

#### Résolution des Problèmes CORS

Pour éviter les erreurs CORS en développement, l'application utilise un proxy Vite configuré dans `vite.config.ts`. Ce proxy :
- Intercepte toutes les requêtes vers `/api/*`
- Les redirige vers `https://seeg-backend-api.azurewebsites.net`
- Ajoute automatiquement les en-têtes CORS nécessaires

**Aucune configuration supplémentaire n'est nécessaire pour le développement local.**

## Architecture

L'application utilise une architecture moderne avec :
- **Frontend** : React + TypeScript + Vite
- **Backend API** : Azure Web Services
- **Communication** : REST API avec proxy Vite en développement
- **Authentification** : JWT tokens via l'API backend
- **Stockage** : Base de données backend (pas de Supabase)

## Démarrage de l'Application

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Construire pour la production
npm run build
```

## Fonctionnalités Disponibles

Toutes les fonctionnalités utilisent l'API backend :

- ✅ Authentification et gestion des comptes
- ✅ Gestion des offres d'emploi
- ✅ Soumission et suivi des candidatures
- ✅ Tableau de bord recruteur
- ✅ Tableau de bord candidat
- ✅ Notifications en temps réel
- ✅ Planification des entretiens
- ✅ Évaluations des candidats
- ✅ Gestion des documents
- ✅ Statistiques et rapports

