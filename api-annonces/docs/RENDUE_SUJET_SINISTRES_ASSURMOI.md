## Rendu — Sujet type “Gestion des sinistres” (AssurMoi) — Web / Back-office uniquement

### 1) Contexte & objectif
AssurMoi (assureur auto) souhaite digitaliser la **gestion des sinistres** et le **suivi des dossiers de prise en charge** afin de fluidifier le traitement (constitution du sinistre, création du dossier, avancement par étapes, validations hiérarchiques, audit).

**Périmètre traité**: plateforme web/back-office (API + base) pour les collaborateurs.  
**Périmètre non traité**: application mobile assurés (explicitement exclu).

---

### 2) Notions métier couvertes
#### **Sinistre (`Claim`)**
Champs gérés (conformes au sujet):
- Immatriculation (`vehicleRegistration`)
- Nom / prénom conducteur (`driverFirstName`, `driverLastName`)
- Conducteur = assuré ? (`driverIsInsured`)
- Date/heure appel (`callAt`)
- Date/heure accident (`accidentAt`)
- Contexte (`contextText`)
- Responsabilité engagée ? (`liabilityAccepted`)
- Si oui, % (`liabilityPercent` = 50 ou 100), sinon **0% auto**
- Documents requis: attestation, carte grise, pièce d’identité

Statut sinistre:
- `draft`: saisie en cours
- `complete`: sinistre “complet” (pièces requises présentes) ⇒ création du dossier

#### **Dossier de prise en charge (`CaseFile`)**
Un dossier est généré à partir d’un sinistre complet.
- Numéro de dossier (`caseNumber`, unique)
- Référence du sinistre (`claimId`, **unique** ⇒ 1 dossier max par sinistre)
- Scénario:
  - `reparable` (véhicule réparable)
  - `total_loss` (VE / réparation > argus)
- Machine à états: `currentState`
- Affectation: `assignedToId` (chargé de suivi)

#### **Avancement & historique**
- `CaseTransition`: journal des transitions de dossier (from/to + utilisateur + date)
- `AuditLog`: audit transverse de toutes les actions (Claim, CaseFile, Document, Approval, User)

#### **Validations hiérarchiques**
Certaines étapes peuvent nécessiter une validation d’un rôle “manager”.
- `Approval`: demande de validation (pending/approved/rejected)
- En cas de transition non autorisée sans manager, la route renvoie **202** et crée une `Approval`.

---

### 3) Rôles & droits (RBAC)
Rôles supportés:
- `admin` (accès à tout)
- `gestionnaire_portefeuille` (superviseur global)
- `charge_suivi` (suivi des dossiers affectés)
- `charge_clientele` (constitution sinistre + complétion)
- `assure` (prévu pour extension, **mobile non traité**)

Principes:
- Authentification JWT (Bearer).
- `admin` bypass des restrictions de rôles.
- Filtrage:
  - Un `charge_clientele` ne liste/voit que ses `Claim` (créés par lui).
  - Un `charge_suivi` ne voit que les `CaseFile` qui lui sont affectés.

---

### 4) Sécurité & exigences transverses
#### Authentification + désactivation
- Users avec `isActive` (désactivation sans suppression, vérifiée au login)

#### Réinitialisation mot de passe
- `PasswordResetToken` (stocke **hash** du token + expiration)
- Flux:
  - `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/auth/reset-password`

#### 2FA (SMS / e-mail)
Présent sous forme de **stubs** d’API (à brancher sur un fournisseur SMS/email).
- `POST /api/v1/auth/2fa/setup`
- `POST /api/v1/auth/2fa/verify`

#### Signature électronique (DocuSign)
Présente sous forme de **stub** côté dossier:
- `POST /api/v1/case-files/{id}/esign`
Recommandation RGPD: fournisseur UE/FR (ex. options européennes), données hébergées en UE/FR.

#### RGPD (préconisations)
- Données minimisées, audit des actions, accès restreints par rôle.
- Stockage documents via URL (à remplacer par stockage objet en UE/FR avec URL signées).

---

### 5) Schéma relationnel (livrable “fin de matinée”)
Le schéma relationnel est décrit dans:
- `api-annonces/docs/schema-relationnel.md`

Tables principales:
- `User`, `Claim`, `CaseFile`, `ClaimDocument`, `CaseTransition`, `Approval`, `AuditLog`, `PasswordResetToken`

Contraintes clés:
- **1 dossier par sinistre**: `CaseFile.claimId` unique
- **Numéro de dossier unique**: `CaseFile.caseNumber` unique

---

### 6) Contrat d’interface / Swagger (livrable “fin de journée”)
OpenAPI 3.0 est disponible ici:
- **Fichier**: `api-annonces/docs/openapi.yaml`
- **Route**: `GET /api/v1/docs/openapi.yaml`

Endpoints couverts (extraits):
- Auth: login, reset password, 2FA stubs
- Users (admin): création / mise à jour / désactivation
- Claims: list/get/create/update/complete
- CaseFiles: list/get/assign/transition/esign stub
- Documents: upload + validation
- Approvals: pending + decide
- Audit: logs

---

### 7) Checklist “Créer une route API”
Document livrable:
- `api-annonces/docs/api-route-checklist.md`

---

### 8) Tests réalisés (preuves fonctionnelles)
#### Prérequis
- Services Docker démarrés (API, MariaDB, Adminer, Mailhog)
- Migrations/seed exécutés avec succès

#### Compte admin (seeder)
- `username`: `admin`
- `password`: `Admin123!`

#### Scénario de test exécuté (bout en bout)
1) Login admin ⇒ obtention JWT  
2) `GET /api/v1/claims` ⇒ OK  
3) `POST /api/v1/claims` ⇒ création sinistre (id=1)  
4) Ajout des 3 documents requis ⇒ OK  
5) `POST /api/v1/claims/{id}/complete` ⇒ création dossier (caseFile id=1)  
6) Transition dossier `DOSSIER_INITIALISE` → `EXPERTISE_EN_ATTENTE` ⇒ OK  
7) `GET /api/v1/audit/logs` ⇒ toutes les actions apparaissent (LOGIN, CLAIM_CREATED, DOCUMENT_UPLOADED, CLAIM_COMPLETED, CASE_FILE_CREATED, CASE_TRANSITION)

Remarque:
- Le test d’approbation hiérarchique n’a pas été déclenché sur ce run car l’utilisateur était `admin` (rôle manager). Pour tester le **202 + Approval**, il faut effectuer une transition marquée `requiresManagerApproval` avec un rôle non manager (ex. `charge_suivi`).

---

### 9) Correspondance “User Stories” (synthèse)
- **Administrateur**:
  - Accès global (bypass RBAC), création/màj/désactivation users (routes `/user`)
- **Gestionnaire portefeuille**:
  - Accès global sinistres/dossiers, validations documents, validations approvals, transitions
- **Chargé de suivi**:
  - Liste de ses dossiers, transitions autorisées, demande d’approbation quand requis
- **Chargé de clientèle**:
  - Création sinistre, mise à jour tant que `draft`, complétion (génération dossier) quand pièces requises

