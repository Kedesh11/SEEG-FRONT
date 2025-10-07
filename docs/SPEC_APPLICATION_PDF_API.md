# 📄 Spécification API - Téléchargement PDF de Candidature

**Fonctionnalité** : Génération et téléchargement de PDF pour les candidatures  
**Date** : 2025-10-03  
**Status** : ⚠️ **À IMPLÉMENTER** (fonctionnalité désactivée après suppression Supabase)  
**Priorité** : 🟡 Moyenne (fonctionnalité utilisateur appréciée mais non-critique)

---

## 🎯 Vue d'Ensemble

Le **PDF de Candidature** est un document formaté contenant toutes les informations d'une candidature :
- ✅ Informations personnelles du candidat
- ✅ Détails du poste
- ✅ Réponses MTP (Métier, Talent, Paradigme)
- ✅ Documents joints (CV, lettres, certificats)
- ✅ Statut de la candidature
- ✅ Date d'entretien (si programmé)

**Utilisation** :
- Candidat peut télécharger son dossier complet
- Recruteur peut imprimer/archiver une candidature
- Export pour partage avec managers/RH

---

## 📊 Modèle de Données

### Application Complete (Frontend)

```typescript
interface Application {
  id: string;
  candidate_id: string;
  job_offer_id: string;
  cover_letter: string | null;
  status: 'candidature' | 'incubation' | 'embauche' | 'refuse' | 'entretien_programme';
  motivation: string | null;
  availability_start: string | null;
  reference_contacts?: string | null;
  interview_date?: string | null;
  
  mtp_answers?: {
    metier?: string[];      // Max 3 choix
    talent?: string[];      // Max 3 choix
    paradigme?: string[];   // Max 3 choix
  } | null;
  
  created_at: string;
  updated_at: string;
  
  job_offers?: {
    title: string;
    location: string;
    contract_type: string;
    date_limite: string;
    recruiter_id?: string;
  } | null;
  
  users?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    date_of_birth?: string;
    
    candidate_profiles?: {
      gender: string;
      current_position: string;
      address: string;
      linkedin_profile: string;
      portfolio_url: string;
      
      experiences: Array<{
        title: string;
        company: string;
        location: string;
        start_date: string;
        end_date: string | null;
        description: string;
      }>;
      
      educations: Array<{
        institution: string;
        degree: string;
        field_of_study: string;
        start_date: string;
        end_date: string | null;
      }>;
      
      skills: Array<{
        name: string;
        level?: number;
      }>;
    } | null;
  } | null;
  
  // Documents joints
  cv?: { name: string; url: string } | null;
  integrity_letter?: { name: string; url: string } | null;
  project_idea?: { name: string; url: string } | null;
  certificates?: { name: string; url: string }[];
  recommendations?: { name: string; url: string }[];
}
```

---

## 🔌 Route API Backend

### **GET** `/api/v1/applications/{application_id}/export/pdf`

**Description** : Génère et retourne un PDF formaté de la candidature

**Path Parameters** :
```typescript
{
  application_id: string;  // UUID de la candidature
}
```

**Query Parameters (Optionnels)** :
```typescript
{
  include_documents?: boolean;  // Inclure les documents joints (CV, lettres) - Default: false
  format?: 'A4' | 'Letter';     // Format du PDF - Default: 'A4'
  language?: 'fr' | 'en';        // Langue du PDF - Default: 'fr'
}
```

**Headers** :
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response** :
- **Content-Type** : `application/pdf`
- **Content-Disposition** : `attachment; filename="Candidature_<NOM>_<PRENOM>_<JOB_TITLE>.pdf"`

---

## 📝 Contenu du PDF

### 1. En-tête du Document

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  [LOGO SEEG]                            DOSSIER DE CANDIDATURE║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

**Informations** :
- Logo de l'entreprise (SEEG)
- Date de génération du PDF
- Numéro de référence candidature (ID)

---

### 2. Section : Informations Personnelles

```
┌─────────────────────────────────────────────────────────────┐
│ INFORMATIONS PERSONNELLES                                   │
└─────────────────────────────────────────────────────────────┘

Nom complet    : [PRENOM] [NOM]
Email          : [EMAIL]
Téléphone      : [PHONE]
Date de naissance : [DATE_OF_BIRTH]
Genre          : [GENDER]
Adresse        : [ADDRESS]

Liens professionnels :
- LinkedIn     : [LINKEDIN_PROFILE]
- Portfolio    : [PORTFOLIO_URL]
```

**Données** :
- `users.first_name`, `users.last_name`
- `users.email`, `users.phone`
- `users.candidate_profiles.gender`
- `users.candidate_profiles.date_of_birth`
- `users.candidate_profiles.address`
- `users.candidate_profiles.linkedin_profile`
- `users.candidate_profiles.portfolio_url`

---

### 3. Section : Détails du Poste

```
┌─────────────────────────────────────────────────────────────┐
│ POSTE VISÉ                                                  │
└─────────────────────────────────────────────────────────────┘

Titre du poste      : [JOB_TITLE]
Type de contrat     : [CONTRACT_TYPE]
Localisation        : [LOCATION]
Date limite de dépôt : [DATE_LIMITE]

Date de candidature : [CREATED_AT]
Statut actuel       : [STATUS] ✓
```

**Données** :
- `job_offers.title`
- `job_offers.contract_type`
- `job_offers.location`
- `job_offers.date_limite`
- `created_at` (date de soumission)
- `status` (candidature, incubation, embauche, refuse, entretien_programme)

**Badges de Statut** :
- 🔵 **Candidature** : Candidature reçue
- 🟡 **Incubation** : En évaluation
- 🟢 **Embauche** : Candidat retenu
- 🔴 **Refuse** : Candidature refusée
- 📅 **Entretien programmé** : Entretien en attente

---

### 4. Section : Parcours Professionnel

```
┌─────────────────────────────────────────────────────────────┐
│ EXPÉRIENCE PROFESSIONNELLE                                  │
└─────────────────────────────────────────────────────────────┘

Poste actuel : [CURRENT_POSITION]

─────────────────────────────────────────────────────────────

[TITRE DU POSTE]
[ENTREPRISE] • [LOCATION]
[START_DATE] - [END_DATE / En cours]

[DESCRIPTION]

─────────────────────────────────────────────────────────────
[... autres expériences]
```

**Données** :
- `users.candidate_profiles.current_position`
- `users.candidate_profiles.experiences[]`
  - `title`, `company`, `location`
  - `start_date`, `end_date`
  - `description`

---

### 5. Section : Formation

```
┌─────────────────────────────────────────────────────────────┐
│ FORMATION & ÉDUCATION                                       │
└─────────────────────────────────────────────────────────────┘

[DEGREE] en [FIELD_OF_STUDY]
[INSTITUTION]
[START_DATE] - [END_DATE]

─────────────────────────────────────────────────────────────
[... autres formations]
```

**Données** :
- `users.candidate_profiles.educations[]`
  - `institution`, `degree`, `field_of_study`
  - `start_date`, `end_date`

---

### 6. Section : Compétences

```
┌─────────────────────────────────────────────────────────────┐
│ COMPÉTENCES                                                 │
└─────────────────────────────────────────────────────────────┘

• [SKILL_NAME]     ████████░░ 80%
• [SKILL_NAME]     ██████████ 100%
• [SKILL_NAME]     ██████░░░░ 60%

[... autres compétences]
```

**Données** :
- `users.candidate_profiles.skills[]`
  - `name`
  - `level` (si disponible, barre de progression)

---

### 7. Section : Réponses MTP (Métier, Talent, Paradigme)

```
┌─────────────────────────────────────────────────────────────┐
│ PROFIL MTP                                                  │
└─────────────────────────────────────────────────────────────┘

MÉTIER (Choix prioritaires)
  1. [METIER_1]
  2. [METIER_2]
  3. [METIER_3]

TALENT (Atouts principaux)
  1. [TALENT_1]
  2. [TALENT_2]
  3. [TALENT_3]

PARADIGME (Valeurs & approches)
  1. [PARADIGME_1]
  2. [PARADIGME_2]
  3. [PARADIGME_3]
```

**Données** :
- `mtp_answers.metier[]` (max 3)
- `mtp_answers.talent[]` (max 3)
- `mtp_answers.paradigme[]` (max 3)

---

### 8. Section : Motivation & Disponibilité

```
┌─────────────────────────────────────────────────────────────┐
│ LETTRE DE MOTIVATION                                        │
└─────────────────────────────────────────────────────────────┘

[COVER_LETTER / MOTIVATION]

────────────────────────────────────────────────────────────

Disponibilité   : [AVAILABILITY_START]
Références      : [REFERENCE_CONTACTS]
```

**Données** :
- `cover_letter` ou `motivation`
- `availability_start`
- `reference_contacts`

---

### 9. Section : Documents Joints

```
┌─────────────────────────────────────────────────────────────┐
│ DOCUMENTS JOINTS                                            │
└─────────────────────────────────────────────────────────────┘

✓ CV                    : [CV_NAME] (téléchargé le [DATE])
✓ Lettre d'intégrité    : [INTEGRITY_LETTER_NAME]
✓ Idée de projet        : [PROJECT_IDEA_NAME]

Certificats (3) :
  • [CERTIFICATE_1_NAME]
  • [CERTIFICATE_2_NAME]
  • [CERTIFICATE_3_NAME]

Recommandations (2) :
  • [RECOMMENDATION_1_NAME]
  • [RECOMMENDATION_2_NAME]
```

**Données** :
- `cv` (name, url)
- `integrity_letter` (name, url)
- `project_idea` (name, url)
- `certificates[]` (name, url)
- `recommendations[]` (name, url)

**Note** : Si `include_documents=true`, les fichiers PDF peuvent être **fusionnés** au PDF principal.

---

### 10. Section : Entretien (si programmé)

```
┌─────────────────────────────────────────────────────────────┐
│ ENTRETIEN PROGRAMMÉ                                         │
└─────────────────────────────────────────────────────────────┘

📅 Date & Heure : [INTERVIEW_DATE]
📍 Lieu         : Libreville (à confirmer)
⏰ Durée        : 1h00 (estimée)

Instructions :
- Apporter une pièce d'identité
- Arriver 10 minutes en avance
- Documents originaux requis
```

**Données** :
- `interview_date` (format : "2025-10-15 10:00:00")

---

### 11. Pied de Page

```
─────────────────────────────────────────────────────────────
Document généré le [DATE] à [TIME]
Référence candidature : [APPLICATION_ID]
SEEG - Société d'Énergie et d'Eau du Gabon
─────────────────────────────────────────────────────────────
                                                    Page 1/3
```

---

## 🛠️ Implémentation Backend Recommandée

### Technologies Suggérées

#### Option 1 : **Python + ReportLab** (Recommandé)

```python
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm

def generate_application_pdf(application_id: str, include_documents: bool = False):
    # 1. Récupérer les données de l'application depuis la DB
    application = get_application_with_relations(application_id)
    
    # 2. Créer le document PDF
    filename = f"Candidature_{application.user.last_name}_{application.user.first_name}.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4)
    
    # 3. Construire le contenu
    story = []
    styles = getSampleStyleSheet()
    
    # Header
    story.append(Paragraph("DOSSIER DE CANDIDATURE", styles['Title']))
    story.append(Spacer(1, 1*cm))
    
    # Informations personnelles
    story.append(Paragraph("INFORMATIONS PERSONNELLES", styles['Heading2']))
    personal_data = [
        ["Nom complet", f"{application.user.first_name} {application.user.last_name}"],
        ["Email", application.user.email],
        ["Téléphone", application.user.phone or "N/A"],
    ]
    story.append(Table(personal_data))
    
    # ... (ajouter toutes les sections)
    
    # 4. Générer le PDF
    doc.build(story)
    
    return filename
```

#### Option 2 : **Node.js + PDFKit**

```javascript
const PDFDocument = require('pdfkit');
const fs = require('fs');

async function generateApplicationPDF(applicationId, includeDocuments = false) {
  // 1. Récupérer les données
  const application = await getApplicationWithRelations(applicationId);
  
  // 2. Créer le document
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const filename = `Candidature_${application.user.lastName}_${application.user.firstName}.pdf`;
  const stream = fs.createWriteStream(filename);
  doc.pipe(stream);
  
  // 3. En-tête
  doc.fontSize(20).text('DOSSIER DE CANDIDATURE', { align: 'center' });
  doc.moveDown();
  
  // 4. Informations personnelles
  doc.fontSize(14).text('INFORMATIONS PERSONNELLES');
  doc.fontSize(10)
     .text(`Nom complet: ${application.user.firstName} ${application.user.lastName}`)
     .text(`Email: ${application.user.email}`)
     .text(`Téléphone: ${application.user.phone || 'N/A'}`);
  
  // ... (ajouter toutes les sections)
  
  // 5. Finaliser
  doc.end();
  
  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filename));
    stream.on('error', reject);
  });
}
```

#### Option 3 : **HTML → PDF (wkhtmltopdf, Puppeteer)**

```javascript
const puppeteer = require('puppeteer');

async function generateApplicationPDF(applicationId) {
  // 1. Récupérer les données
  const application = await getApplicationWithRelations(applicationId);
  
  // 2. Générer le HTML
  const html = renderApplicationHTML(application);
  
  // 3. Convertir en PDF avec Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
  });
  
  await browser.close();
  
  return pdfBuffer;
}
```

---

## 🚀 Endpoint Backend Complet

### Implémentation Recommandée

```python
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

router = APIRouter()

@router.get("/applications/{application_id}/export/pdf")
async def export_application_pdf(
    application_id: str,
    include_documents: bool = False,
    format: str = "A4",
    language: str = "fr",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Génère et retourne un PDF de la candidature
    
    Permissions:
    - Candidat: Seulement ses propres candidatures
    - Recruteur/Admin: Toutes les candidatures
    """
    
    # 1. Récupérer l'application avec toutes les relations
    application = db.query(Application).filter(
        Application.id == application_id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Candidature non trouvée")
    
    # 2. Vérifier les permissions
    if not current_user.is_admin and not current_user.is_recruiter:
        if application.candidate_id != current_user.id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # 3. Générer le PDF
    try:
        pdf_buffer = generate_application_pdf(
            application=application,
            include_documents=include_documents,
            format=format,
            language=language
        )
        
        # 4. Construire le nom du fichier
        filename = f"Candidature_{application.user.last_name}_{application.user.first_name}_{application.job_offer.title.replace(' ', '_')}.pdf"
        
        # 5. Retourner le PDF
        return StreamingResponse(
            io.BytesIO(pdf_buffer),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur génération PDF: {str(e)}")
```

---

## 🔐 Permissions & Sécurité

### Règles d'Accès

| Rôle | Accès | Restrictions |
|------|-------|--------------|
| **Candidat** | ✅ Ses candidatures uniquement | `application.candidate_id == user.id` |
| **Recruteur** | ✅ Candidatures de ses offres | `application.job_offer.recruiter_id == user.id` |
| **Admin** | ✅ Toutes les candidatures | Aucune |
| **Observeur** | ✅ Toutes les candidatures (lecture) | Lecture seule |

### Validation Backend

```python
def check_pdf_access(application: Application, user: User) -> bool:
    # Admin: Accès total
    if user.is_admin or user.is_observer:
        return True
    
    # Recruteur: Seulement ses offres
    if user.is_recruiter:
        return application.job_offer.recruiter_id == user.id
    
    # Candidat: Seulement sa candidature
    return application.candidate_id == user.id
```

---

## 🎨 Exemple de Rendu PDF

### Première Page

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  [LOGO SEEG]                            DOSSIER DE CANDIDATURE║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────┐
│ INFORMATIONS PERSONNELLES                                   │
└─────────────────────────────────────────────────────────────┘

Nom complet        : Jean DUPONT
Email              : jean.dupont@example.com
Téléphone          : +241 01 23 45 67
Date de naissance  : 15/08/1990
Genre              : Homme
Adresse            : Libreville, Gabon

Liens professionnels :
- LinkedIn : linkedin.com/in/jeandupont
- Portfolio : jeandupont.dev

┌─────────────────────────────────────────────────────────────┐
│ POSTE VISÉ                                                  │
└─────────────────────────────────────────────────────────────┘

Titre du poste       : Développeur Full Stack
Type de contrat      : CDI
Localisation         : Libreville
Date limite de dépôt : 30/10/2025

Date de candidature  : 15/10/2025
Statut actuel        : 🟡 En évaluation

[... suite sur pages suivantes]

─────────────────────────────────────────────────────────────
Document généré le 03/10/2025 à 14:30
Référence candidature : 123e4567-e89b-12d3-a456-426614174000
SEEG - Société d'Énergie et d'Eau du Gabon
─────────────────────────────────────────────────────────────
                                                    Page 1/3
```

---

## 🧪 Tests Backend Recommandés

### Test 1 : Génération PDF Candidat

```http
GET /api/v1/applications/123e4567-e89b-12d3-a456-426614174000/export/pdf
Authorization: Bearer <CANDIDAT_TOKEN>

→ 200 OK
→ Content-Type: application/pdf
→ Content-Disposition: attachment; filename="Candidature_DUPONT_Jean_Developpeur_Full_Stack.pdf"
→ PDF généré avec toutes les sections
```

### Test 2 : Génération PDF avec Documents

```http
GET /api/v1/applications/123e4567-e89b-12d3-a456-426614174000/export/pdf?include_documents=true
Authorization: Bearer <CANDIDAT_TOKEN>

→ 200 OK
→ PDF fusionné avec CV + lettres + certificats
```

### Test 3 : Accès Non Autorisé

```http
GET /api/v1/applications/autre-candidature-id/export/pdf
Authorization: Bearer <CANDIDAT_TOKEN>

→ 403 Forbidden
{
  "detail": "Accès non autorisé"
}
```

### Test 4 : Candidature Inexistante

```http
GET /api/v1/applications/invalid-id/export/pdf
Authorization: Bearer <ADMIN_TOKEN>

→ 404 Not Found
{
  "detail": "Candidature non trouvée"
}
```

---

## 📝 Migration Frontend

### Fonction API Client

**Fichier** : `src/integrations/api/applications.ts`

```typescript
/**
 * Télécharge le PDF d'une candidature
 */
export async function downloadApplicationPdf(
  applicationId: string,
  options?: {
    includeDocuments?: boolean;
    format?: 'A4' | 'Letter';
    language?: 'fr' | 'en';
  }
): Promise<Blob> {
  const params = new URLSearchParams();
  if (options?.includeDocuments) params.append('include_documents', 'true');
  if (options?.format) params.append('format', options.format);
  if (options?.language) params.append('language', options.language);
  
  const url = `/api/v1/applications/${applicationId}/export/pdf?${params}`;
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Erreur téléchargement PDF: ${response.statusText}`);
  }
  
  return await response.blob();
}
```

### Utilisation dans les Composants

```typescript
// ApplicationActionsMenu.tsx
const handleExportPdf = async () => {
  try {
    setIsLoading(true);
    
    // Télécharger le PDF
    const pdfBlob = await downloadApplicationPdf(application.id, {
      includeDocuments: false,
      format: 'A4',
      language: 'fr'
    });
    
    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Candidature_${application.job_offers?.title || 'Application'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('PDF téléchargé avec succès !');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    toast.error('Erreur lors du téléchargement du PDF');
  } finally {
    setIsLoading(false);
  }
};
```

---

## 📈 Améliorations Futures (Optionnelles)

### 1. Génération Asynchrone

Pour les PDF volumineux avec documents joints :

```http
POST /api/v1/applications/{id}/export/pdf/async
→ 202 Accepted
{
  "job_id": "pdf-gen-123",
  "status": "processing"
}

GET /api/v1/applications/{id}/export/pdf/status/{job_id}
→ 200 OK
{
  "status": "completed",
  "download_url": "/api/v1/applications/{id}/export/pdf/download/{job_id}"
}
```

### 2. Templates Personnalisés

```http
GET /api/v1/applications/{id}/export/pdf?template=minimal
GET /api/v1/applications/{id}/export/pdf?template=detailed
GET /api/v1/applications/{id}/export/pdf?template=official
```

### 3. Watermark pour Statut

- **Candidature** : Pas de watermark
- **Incubation** : "EN ÉVALUATION" (diagonal, transparent)
- **Embauche** : "CANDIDAT RETENU" (vert)
- **Refuse** : "NON RETENU" (rouge, transparent)

---

## 🎯 Résumé - Migration

### Backend à Implémenter

1. ✅ Route `GET /api/v1/applications/{id}/export/pdf`
2. ✅ Bibliothèque PDF (ReportLab, PDFKit, Puppeteer)
3. ✅ Template HTML ou génération programmatique
4. ✅ Permissions (candidat, recruteur, admin)
5. ✅ Gestion des erreurs (404, 403, 500)

### Frontend à Migrer

1. ✅ Fonction `downloadApplicationPdf()` dans `applications.ts`
2. ✅ Remplacer les appels `exportApplicationPdf` par `downloadApplicationPdf`
3. ✅ Gestion du téléchargement (Blob → fichier)
4. ✅ Notifications de succès/erreur

**Temps estimé** : 3-5 jours Backend + 1 jour Frontend

---

**Date de spécification** : 2025-10-03  
**Status** : ⚠️ En attente d'implémentation Backend  
**Priorité** : 🟡 Moyenne (amélioration UX appréciée)

