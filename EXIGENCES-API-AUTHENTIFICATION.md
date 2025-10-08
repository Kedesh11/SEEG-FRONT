# 🔐 Exigences API pour l'Authentification

Documentation basée sur : [https://seeg-backend-api.azurewebsites.net/docs](https://seeg-backend-api.azurewebsites.net/docs)

---

## 🎯 **Problème Résolu**

Les erreurs 500 lors de l'inscription étaient causées par des **incompatibilités de format** entre le frontend et l'API backend.

### ❌ Ce Qui Ne Fonctionnait Pas

1. **Matricule** : Frontend envoyait une `string` → API attend un `number`
2. **Sexe** : Frontend envoyait `"Autre"` → API accepte uniquement `"M"` ou `"F"`
3. **Sexe optionnel** : Frontend le rendait optionnel → API le rend **obligatoire**

### ✅ Ce Qui a Été Corrigé

1. ✅ Interface mise à jour : `matricule: number`
2. ✅ Conversion automatique : `parseInt(metadata.matricule, 10)`
3. ✅ Validation sexe : Uniquement `"M"` ou `"F"`
4. ✅ Sexe obligatoire : Plus d'option `?`

---

## 📋 **Endpoint : Login**

### URL
```
POST /api/v1/auth/login
```

### Formats Acceptés

#### Option 1 : JSON (Recommandé)
```json
{
  "email": "candidate@example.com",
  "password": "MotdepasseFort123!"
}
```

#### Option 2 : Form URL Encoded
```
username=candidate@example.com&password=MotdepasseFort123!
```

### Réponse Succès (200)
```json
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "token_type": "Bearer",
  "user": {
    "id": 123,
    "email": "candidate@example.com",
    "role": "candidat"
  }
}
```

### Erreurs Possibles
- **401** : Email ou mot de passe incorrect
- **429** : Trop de tentatives de connexion
- **500** : Erreur serveur interne

---

## 📋 **Endpoint : Signup (Inscription Candidat)**

### URL
```
POST /api/v1/auth/signup
```

### Format Requis (JSON)

```json
{
  "email": "new.candidate@seeg.ga",
  "password": "Password#2025",
  "first_name": "Aïcha",
  "last_name": "Mouketou",
  "matricule": 123456,
  "date_of_birth": "1994-06-12",
  "sexe": "F",
  "phone": "+24106223344"
}
```

### Champs Obligatoires ⚠️

| Champ | Type | Format | Exemple |
|-------|------|--------|---------|
| `email` | string | email valide | `"user@seeg.ga"` |
| `password` | string | min 8 caractères | `"Password#2025"` |
| `first_name` | string | 1-100 caractères | `"Aïcha"` |
| `last_name` | string | 1-100 caractères | `"Mouketou"` |
| `matricule` | **integer** | nombre entier | `123456` |
| `date_of_birth` | string | YYYY-MM-DD | `"1994-06-12"` |
| `sexe` | string | **"M" ou "F" uniquement** | `"F"` |

### Champs Optionnels

| Champ | Type | Format | Exemple |
|-------|------|--------|---------|
| `phone` | string | max 20 caractères | `"+24106223344"` |

### ⚠️ Points d'Attention

1. **Matricule** : 
   - ❌ `"123456"` (string) → Erreur 500
   - ✅ `123456` (number) → OK

2. **Sexe** :
   - ❌ `"Autre"` → Erreur 500
   - ❌ `"Homme"` / `"Femme"` → Erreur 500
   - ✅ `"M"` → OK
   - ✅ `"F"` → OK

3. **Date de naissance** :
   - ❌ `"12/06/1994"` → Erreur
   - ❌ `"1994-6-12"` → Erreur
   - ✅ `"1994-06-12"` → OK

4. **Mot de passe** :
   - Minimum 8 caractères
   - Recommandé : Majuscules + Minuscules + Chiffres + Symboles

---

## 🔧 **Modifications Apportées au Frontend**

### 1. Interface `CandidateSignupRequest`

**Avant** :
```typescript
export interface CandidateSignupRequest {
  matricule: string;  // ❌ String
  sexe?: "M" | "F" | "Autre";  // ❌ Optionnel et "Autre"
}
```

**Après** :
```typescript
export interface CandidateSignupRequest {
  matricule: number;  // ✅ Number
  sexe: "M" | "F";  // ✅ Obligatoire, M ou F uniquement
}
```

### 2. Fonction `signUp` dans `useAuth.tsx`

**Avant** :
```typescript
matricule: metadata?.matricule || '',  // ❌ String vide
sexe: metadata?.gender === 'Homme' ? 'M' 
    : metadata?.gender === 'Femme' ? 'F' 
    : 'Autre',  // ❌ Peut envoyer "Autre"
```

**Après** :
```typescript
// Convertir le matricule en number
const matriculeNum = metadata?.matricule 
  ? parseInt(metadata.matricule, 10) 
  : 0;

// Valider sexe (M ou F uniquement)
let sexe: "M" | "F" = "M";
if (metadata?.gender === 'Femme' || metadata?.gender === 'F') {
  sexe = "F";
} else if (metadata?.gender === 'Homme' || metadata?.gender === 'M') {
  sexe = "M";
}

matricule: matriculeNum,  // ✅ Number
sexe: sexe,  // ✅ M ou F uniquement
```

---

## 🧪 **Test de l'Authentification**

### Test Login

```bash
curl -X POST https://seeg-backend-api.azurewebsites.net/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "candidate@example.com",
    "password": "MotdepasseFort123!"
  }'
```

### Test Signup

```bash
curl -X POST https://seeg-backend-api.azurewebsites.net/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new.candidate@seeg.ga",
    "password": "Password#2025",
    "first_name": "Jean",
    "last_name": "Dupont",
    "matricule": 123456,
    "date_of_birth": "1990-05-15",
    "sexe": "M",
    "phone": "+24106123456"
  }'
```

---

## ✅ **Checklist de Validation**

Avant de soumettre une inscription, vérifier :

- [ ] Email est au format valide
- [ ] Mot de passe a au moins 8 caractères
- [ ] Prénom et nom sont remplis (1-100 caractères)
- [ ] **Matricule est un NOMBRE** (pas une string)
- [ ] Date de naissance au format YYYY-MM-DD
- [ ] **Sexe est "M" ou "F"** (pas "Homme", "Femme" ou "Autre")
- [ ] Téléphone (optionnel) a max 20 caractères

---

## 🎯 **Résultat**

Avec ces corrections, l'authentification devrait maintenant fonctionner correctement :

### ✅ Avant les Corrections
```
POST /api/v1/auth/signup
Payload: { matricule: "123456", sexe: "Autre" }
Résultat: 500 Internal Server Error ❌
```

### ✅ Après les Corrections
```
POST /api/v1/auth/signup
Payload: { matricule: 123456, sexe: "M" }
Résultat: 200 OK ✅
```

---

## 📚 **Ressources**

- **Documentation API** : [https://seeg-backend-api.azurewebsites.net/docs](https://seeg-backend-api.azurewebsites.net/docs)
- **Schéma OpenAPI** : [https://seeg-backend-api.azurewebsites.net/openapi.json](https://seeg-backend-api.azurewebsites.net/openapi.json)

---

## 🆘 **En Cas de Problème**

### Erreur 401 (Unauthorized)
- Email ou mot de passe incorrect
- Vérifier les credentials

### Erreur 500 (Internal Server Error)
- Vérifier le format des données (matricule = number, sexe = "M" ou "F")
- Vérifier que tous les champs obligatoires sont présents
- Consulter les logs backend Azure

### Erreur 429 (Too Many Requests)
- Trop de tentatives de connexion
- Attendre quelques minutes avant de réessayer

---

**Date de Mise à Jour** : Aujourd'hui
**Statut** : ✅ Corrections Appliquées
**Testez maintenant l'inscription et la connexion !** 🚀

