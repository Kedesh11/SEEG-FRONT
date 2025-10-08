# 👔 Distinction Candidats Internes/Externes

## 🎯 Objectif

Permettre deux types de candidatures :
1. **Candidats Internes SEEG** - Employés actuels avec matricule
2. **Candidats Externes** - Candidats externes sans matricule

Chaque type aura accès à des offres d'emploi spécifiques à leur statut.

---

## ✅ Modifications Appliquées

### 1. **Formulaire d'Inscription**

#### Nouveau Champ : Type de Candidature

```tsx
<select id="status">
  <option value="interne">👔 Candidat Interne SEEG (avec matricule)</option>
  <option value="externe">🌍 Candidat Externe (sans matricule)</option>
</select>
```

**Comportement** :
- Par défaut : "Interne"
- Affiche un message contextuel selon le choix
- Masque/affiche automatiquement le champ matricule

#### Champ Matricule Conditionnel

```tsx
{signUpData.status === "interne" && (
  <Input 
    id="matricule"
    required={signUpData.status === "interne"}
  />
)}
```

**Règles** :
- ✅ **Interne** : Matricule **obligatoire** et **visible**
- ✅ **Externe** : Matricule **masqué** et **non requis**

---

### 2. **Validation du Matricule**

#### Logique de Validation

```typescript
const verifyMatricule = useCallback(async (): Promise<boolean> => {
  // Si externe, le matricule n'est pas requis
  if (signUpData.status === "externe") {
    setMatriculeError("");
    setIsMatriculeValid(true);
    return true;
  }
  
  // Si interne, validation normale du matricule
  const matricule = signUpData.matricule.trim();
  if (!matricule) {
    setMatriculeError("Le matricule est requis pour les candidats internes.");
    return false;
  }
  
  // ... validation du format et vérification backend
}, [signUpData]);
```

**Comportement** :
- **Externe** → Validation automatiquement OK (pas de matricule)
- **Interne** → Validation normale du matricule

---

### 3. **Données Envoyées à l'API**

#### Payload d'Inscription

```typescript
await signUp(email, password, {
  role: 'candidat',
  first_name: signUpData.firstName,
  last_name: signUpData.lastName,
  phone: signUpData.phone,
  matricule: signUpData.status === "interne" 
    ? signUpData.matricule 
    : "", // Vide pour externes
  gender: signUpData.gender,
  birth_date: signUpData.birthDate,
  candidate_status: signUpData.status, // "interne" ou "externe"
});
```

**Champ Ajouté** :
- `candidate_status`: `"interne"` | `"externe"`

---

## 📋 Interface Mise à Jour

### SignUpMetadata

```typescript
export interface SignUpMetadata {
  role: "candidat" | "recruteur" | "admin" | "observateur";
  first_name?: string;
  last_name?: string;
  phone?: string;
  matricule?: string;
  birth_date?: string;
  gender?: string;
  candidate_status?: "interne" | "externe"; // ✅ NOUVEAU
}
```

---

## 🎨 UI/UX

### Apparence du Formulaire

#### Candidat Interne
```
┌─────────────────────────────────────┐
│ Type de candidature *               │
│ 👔 Candidat Interne SEEG            │ ← Sélectionné
│                                     │
│ ✓ Vous êtes employé(e) de la SEEG  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Matricule SEEG *                    │
│ [____________________]              │ ← VISIBLE
└─────────────────────────────────────┘
```

#### Candidat Externe
```
┌─────────────────────────────────────┐
│ Type de candidature *               │
│ 🌍 Candidat Externe                 │ ← Sélectionné
│                                     │
│ ✓ Vous n'êtes pas employé(e) SEEG  │
└─────────────────────────────────────┘

[Matricule MASQUÉ]                    ← PAS VISIBLE
```

---

## 🔄 Workflow d'Inscription

### 1. **Candidat Interne**

```
1. Sélectionne "Candidat Interne"
   ↓
2. Champ matricule apparaît
   ↓
3. Saisit son matricule SEEG
   ↓
4. Validation du matricule (format + vérification backend)
   ↓
5. Remplit les autres champs
   ↓
6. Soumission → candidate_status: "interne"
```

### 2. **Candidat Externe**

```
1. Sélectionne "Candidat Externe"
   ↓
2. Champ matricule disparaît (vidé automatiquement)
   ↓
3. Remplit les autres champs (sans matricule)
   ↓
4. Soumission → candidate_status: "externe", matricule: ""
```

---

## 📊 Backend - Modifications Requises

### Base de Données

Ajouter le champ `candidate_status` à la table `users` :

```sql
ALTER TABLE users 
ADD COLUMN candidate_status VARCHAR(10) DEFAULT 'interne'
CHECK (candidate_status IN ('interne', 'externe'));
```

### API Endpoint `/auth/signup`

Mettre à jour le schéma pour accepter `candidate_status` :

```python
class CandidateSignupRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    matricule: Optional[int] = None  # Optionnel pour externes
    date_of_birth: str
    sexe: str
    phone: Optional[str] = None
    candidate_status: str = "interne"  # NOUVEAU
```

**Validation** :
```python
if candidate_status == "interne" and not matricule:
    raise ValueError("Le matricule est requis pour les candidats internes")
```

---

## 🎯 Filtrage des Offres par Statut

### Frontend - Page des Offres

```typescript
// Filtrer les offres selon le statut du candidat
const filteredOffers = useMemo(() => {
  if (!user) return allOffers;
  
  const userStatus = user.candidate_status || "interne";
  
  return allOffers.filter(offer => {
    // Si l'offre est pour internes uniquement
    if (offer.target_audience === "interne") {
      return userStatus === "interne";
    }
    
    // Si l'offre est pour externes uniquement
    if (offer.target_audience === "externe") {
      return userStatus === "externe";
    }
    
    // Si l'offre est pour tous
    if (offer.target_audience === "tous") {
      return true;
    }
    
    return true;
  });
}, [allOffers, user]);
```

### Backend - Table `job_offers`

Ajouter le champ `target_audience` :

```sql
ALTER TABLE job_offers
ADD COLUMN target_audience VARCHAR(10) DEFAULT 'tous'
CHECK (target_audience IN ('interne', 'externe', 'tous'));
```

---

## 🧪 Tests

### Test 1 : Inscription Interne

**Données** :
```
Type: Interne
Matricule: 123456
Nom: Dupont
Prénom: Jean
...
```

**Résultat Attendu** :
```json
{
  "candidate_status": "interne",
  "matricule": 123456
}
```

### Test 2 : Inscription Externe

**Données** :
```
Type: Externe
[Pas de matricule]
Nom: Martin
Prénom: Sophie
...
```

**Résultat Attendu** :
```json
{
  "candidate_status": "externe",
  "matricule": null
}
```

### Test 3 : Changement de Statut

**Actions** :
1. Sélectionne "Interne" → Champ matricule apparaît
2. Saisit un matricule
3. Change pour "Externe" → Champ matricule disparaît et se vide
4. Change pour "Interne" → Champ matricule réapparaît (vide)

**Résultat Attendu** : Transitions fluides sans erreurs

---

## 📝 Messages Utilisateur

### Messages Contextuels

| Statut | Message |
|--------|---------|
| Interne | "✓ Vous êtes employé(e) de la SEEG" |
| Externe | "✓ Vous n'êtes pas employé(e) de la SEEG" |

### Messages d'Erreur

| Situation | Message |
|-----------|---------|
| Interne sans matricule | "Le matricule est requis pour les candidats internes" |
| Format matricule invalide | "Le matricule doit contenir uniquement des chiffres" |

---

## 🚀 Déploiement

### Checklist Frontend

- [x] Ajout du champ `status` au formulaire
- [x] Logique de masquage du matricule
- [x] Validation conditionnelle
- [x] Interface `SignUpMetadata` mise à jour
- [x] Messages contextuels
- [ ] Filtrage des offres (à implémenter)

### Checklist Backend

- [ ] Ajout colonne `candidate_status` en base
- [ ] Mise à jour schéma API `/auth/signup`
- [ ] Validation conditionnelle du matricule
- [ ] Ajout colonne `target_audience` à `job_offers`
- [ ] Endpoint filtrage des offres par statut

---

## 🎉 Avantages

1. ✅ **Flexibilité** : Ouvre la plateforme aux candidats externes
2. ✅ **UX Optimale** : Formulaire adapté au type de candidat
3. ✅ **Validation Intelligente** : Matricule requis uniquement si pertinent
4. ✅ **Filtrage Ciblé** : Chaque candidat voit les offres appropriées
5. ✅ **Évolutif** : Facile d'ajouter d'autres types de candidats

---

## 📞 Points d'Attention

### Pour le Backend

1. **Migration de données** : Tous les utilisateurs existants doivent avoir un `candidate_status`
2. **Validation** : S'assurer que les internes ont toujours un matricule
3. **Filtrage** : Implémenter la logique de filtrage des offres
4. **Documentation API** : Mettre à jour Swagger/OpenAPI

### Pour le Frontend

1. **Affichage des offres** : Implémenter le filtrage côté client
2. **Dashboard** : Adapter l'UI selon le statut
3. **Messages** : Afficher des messages appropriés à chaque type
4. **Tests** : Tester tous les scénarios de navigation

---

**Date de Mise à Jour** : Aujourd'hui  
**Statut** : ✅ Frontend Implémenté, ⏳ Backend En Attente  
**Prêt pour Test** : Oui (Frontend uniquement)

