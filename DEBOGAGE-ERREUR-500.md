# 🐛 Débogage de l'Erreur 500

## 🔍 Logs de Débogage Ajoutés

J'ai ajouté des logs détaillés pour identifier précisément le problème.

---

## 📋 **Actions à Effectuer**

### Étape 1 : Essayer de S'inscrire

1. Ouvrez la console du navigateur (F12 → Console)
2. Essayez de vous inscrire avec le formulaire
3. **Regardez les logs dans la console**

### Étape 2 : Vérifier les Logs

Vous devriez voir ces logs dans la console :

```
📤 [SIGNUP] Payload envoyé à l'API: {
  "email": "...",
  "password": "...",
  "first_name": "...",
  "last_name": "...",
  "matricule": ???,
  "date_of_birth": "...",
  "sexe": "...",
  "phone": "..."
}
📤 [SIGNUP] Type de matricule: number - Valeur: 123456
📤 [SIGNUP] Valeur de sexe: M
```

**Questions importantes :**

1. **Le matricule** :
   - Le type est-il bien `number` ?
   - La valeur est-elle un nombre valide (pas 0, pas NaN) ?

2. **Le sexe** :
   - La valeur est-elle `"M"` ou `"F"` ?
   - Pas `"Homme"`, `"Femme"` ou `"Autre"` ?

3. **L'erreur backend** :
   ```
   ❌ [API ERROR] Status 500: ...
   ❌ [API ERROR] Détails: {...}
   ```
   - Quel est le message d'erreur exact ?

---

## 🔍 **Vérification Alternative : Onglet Network**

### Voir la Requête Exacte

1. **F12** → Onglet **Network** (Réseau)
2. Filtrer par **Fetch/XHR**
3. Cliquer sur **signup** dans la liste
4. Aller dans **Payload** ou **Request**

**Vérifier :**
- Le `matricule` est-il un nombre (`123456`) ou une string (`"123456"`) ?
- Le `sexe` est-il `"M"` ou `"F"` ?

### Voir la Réponse Backend

Dans le même onglet **Network** :
1. Cliquer sur **Response**
2. Voir le message d'erreur du backend

---

## 🎯 **Problèmes Possibles**

### Problème 1 : Matricule Invalide

Si le log montre :
```
Type de matricule: number - Valeur: 0
```

**Cause** : Le matricule n'a pas été saisi ou est vide
**Solution** : Vérifier que le formulaire envoie bien le matricule

### Problème 2 : Matricule NaN

Si le log montre :
```
Type de matricule: number - Valeur: NaN
```

**Cause** : La conversion `parseInt()` a échoué
**Solution** : Vérifier le format du matricule dans le formulaire

### Problème 3 : Sexe Incorrect

Si le log montre :
```
Valeur de sexe: Homme
```
ou
```
Valeur de sexe: Femme
```

**Cause** : La conversion n'a pas fonctionné
**Solution** : Vérifier la valeur de `metadata?.gender`

### Problème 4 : Champ Manquant

Si l'erreur backend dit :
```
Field required: ...
```

**Cause** : Un champ obligatoire est vide
**Solution** : Vérifier tous les champs obligatoires

### Problème 5 : Format de Date Incorrect

Si l'erreur backend mentionne `date_of_birth` :

**Cause** : Format de date incorrect
**Solution** : Doit être exactement `YYYY-MM-DD` (ex: `1990-05-15`)

---

## 📊 **Checklist de Vérification**

Copiez et remplissez cette checklist avec les valeurs réelles des logs :

```
☐ Type de matricule: ___________
☐ Valeur de matricule: ___________
☐ Valeur de sexe: ___________
☐ Format de date_of_birth: ___________
☐ Tous les champs obligatoires remplis: Oui / Non
☐ Message d'erreur backend: ___________
```

---

## 🛠️ **Solutions en Fonction de l'Erreur**

### Si "Field required"
→ Un champ obligatoire manque (first_name, last_name, etc.)

### Si "Invalid type"
→ Le type d'un champ est incorrect (matricule doit être number)

### Si "Invalid format"
→ Le format d'un champ est incorrect (date_of_birth doit être YYYY-MM-DD)

### Si "Value error"
→ Une valeur n'est pas acceptée (sexe doit être "M" ou "F")

### Si "Database error"
→ Problème backend (base de données, configuration, etc.)

---

## 🚀 **Test Direct avec curl**

Pour tester si c'est un problème frontend ou backend :

```bash
curl -X POST https://seeg-backend-api.azurewebsites.net/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.candidat@seeg.ga",
    "password": "TestPassword123!",
    "first_name": "Jean",
    "last_name": "Dupont",
    "matricule": 123456,
    "date_of_birth": "1990-05-15",
    "sexe": "M",
    "phone": "+24106123456"
  }'
```

**Si ça fonctionne** → Problème dans le frontend
**Si ça ne fonctionne pas** → Problème backend

---

## 📝 **Informations à Fournir**

Pour que je puisse vous aider, copiez-collez :

1. **Les logs de la console** (📤 [SIGNUP] ...)
2. **L'erreur backend** (❌ [API ERROR] ...)
3. **La payload depuis l'onglet Network**
4. **La réponse backend depuis l'onglet Network**

---

## 🎯 **Prochaine Étape**

1. ✅ Essayez de vous inscrire
2. ✅ Copiez tous les logs de la console
3. ✅ Vérifiez l'onglet Network → Request/Response
4. ✅ Partagez ces informations

Avec ces informations, je pourrai identifier exactement le problème ! 🔍

