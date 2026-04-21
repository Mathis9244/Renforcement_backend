# Schéma relationnel — AssurMoi (gestion des sinistres)

Ce document décrit le **schéma relationnel minimal** permettant de répondre aux besoins fonctionnels (gestion sinistres + dossiers de prise en charge + validations + audit + réinitialisation MDP).

## Tables (avec clés et relations)

### `User`
- **PK**: `id` (int)
- **Champs**:
  - `username` (string, NN)
  - `password` (string hashé, NN)
  - `firstname` (string, NULL)
  - `lastname` (string, NULL)
  - `email` (string, NULL)
  - `role` (string, NN) ∈ {`admin`, `gestionnaire_portefeuille`, `charge_suivi`, `charge_clientele`, `assure`}
  - `isActive` (bool, NN) — permet la désactivation sans suppression
  - `twoFactorEnabled` (bool, NN)
  - `twoFactorSecret` (string, NULL) — secret/clé (si solution OTP)
- **Relations**:
  - 1 `User` **crée** 0..n `Claim` via `Claim.createdById`
  - 1 `User` **crée** 0..n `CaseFile` via `CaseFile.createdById`
  - 1 `User` **est assigné** à 0..n `CaseFile` via `CaseFile.assignedToId`
  - 1 `User` **valide** 0..n `ClaimDocument` via `ClaimDocument.validatedById`
  - 1 `User` **demande** 0..n `Approval` via `Approval.requesterId`
  - 1 `User` **approuve** 0..n `Approval` via `Approval.approverId`
  - 1 `User` **émet** 0..n `AuditLog` via `AuditLog.userId`

### `Claim` (sinistre)
- **PK**: `id` (int)
- **Champs**:
  - `vehicleRegistration` (string, NN)
  - `driverFirstName` (string, NN)
  - `driverLastName` (string, NN)
  - `driverIsInsured` (bool, NN)
  - `callAt` (datetime, NN)
  - `accidentAt` (datetime, NN)
  - `contextText` (text, NN)
  - `liabilityAccepted` (bool, NN)
  - `liabilityPercent` (int, NN) ∈ {0, 50, 100}
    - **Règle**: si `liabilityAccepted=false` ⇒ `liabilityPercent=0` automatiquement
  - `status` (string, NN) ∈ {`draft`, `complete`}
  - `createdById` (FK NULL vers `User.id`)
  - `createdAt`, `updatedAt`
- **Relations**:
  - 1 `Claim` **possède** 0..n `ClaimDocument`
  - 1 `Claim` **génère** 0..1 `CaseFile` (contrainte `CaseFile.claimId` UNIQUE)

### `ClaimDocument` (pièces jointes)
- **PK**: `id` (int)
- **Champs**:
  - `claimId` (FK NN vers `Claim.id`)
  - `caseFileId` (FK NULL vers `CaseFile.id`) — rattachement optionnel au dossier
  - `docType` (string, NN) ex. `attestation_assurance`, `carte_grise`, `piece_identite_conducteur`, `other`
  - `fileUrl` (string, NN) — stockage externe (S3/MinIO/Blob) ou URL signée
  - `validationStatus` (string, NN) ∈ {`pending`, `approved`, `rejected`}
  - `validatedById` (FK NULL vers `User.id`)
  - `createdAt`, `updatedAt`
- **Relations**:
  - n `ClaimDocument` → 1 `Claim`
  - n `ClaimDocument` → 0..1 `CaseFile`
  - n `ClaimDocument` → 0..1 `User` (validator)

### `CaseFile` (dossier de prise en charge)
- **PK**: `id` (int)
- **Champs**:
  - `caseNumber` (string, NN, UNIQUE) — numéro fonctionnel du dossier
  - `claimId` (FK NN vers `Claim.id`, UNIQUE) — 1 dossier par sinistre
  - `scenario` (string, NN) ∈ {`reparable`, `total_loss`}
  - `currentState` (string, NN) — état courant (machine à états)
  - `assignedToId` (FK NULL vers `User.id`) — chargé de suivi
  - `createdById` (FK NULL vers `User.id`) — créateur (souvent chargé clientèle / gestionnaire)
  - `createdAt`, `updatedAt`
- **Relations**:
  - 1 `CaseFile` **a** 0..n `CaseTransition`
  - 1 `CaseFile` **a** 0..n `Approval`

### `CaseTransition` (historique d’avancement dossier)
- **PK**: `id` (int)
- **Champs**:
  - `caseFileId` (FK NN vers `CaseFile.id`)
  - `fromState` (string, NULL)
  - `toState` (string, NN)
  - `userId` (FK NULL vers `User.id`) — auteur du changement
  - `comment` (text, NULL)
  - `createdAt` (datetime, NN)
- **Relations**:
  - n `CaseTransition` → 1 `CaseFile`
  - n `CaseTransition` → 0..1 `User`

### `Approval` (validation hiérarchique)
- **PK**: `id` (int)
- **Champs**:
  - `caseFileId` (FK NN vers `CaseFile.id`)
  - `stepKey` (string, NN) — clé/étape demandée (souvent = `toState`)
  - `requesterId` (FK NULL vers `User.id`)
  - `approverId` (FK NULL vers `User.id`)
  - `status` (string, NN) ∈ {`pending`, `approved`, `rejected`}
  - `createdAt`, `updatedAt`
- **Relations**:
  - n `Approval` → 1 `CaseFile`
  - n `Approval` → 0..1 `User` (requester)
  - n `Approval` → 0..1 `User` (approver)

### `AuditLog` (journal d’audit transversal)
- **PK**: `id` (int)
- **Champs**:
  - `entityType` (string, NN) ex. `Claim`, `CaseFile`, `Approval`, `User`, `ClaimDocument`
  - `entityId` (string, NN) — identifiant (string pour être agnostique)
  - `action` (string, NN) ex. `CLAIM_CREATED`, `CASE_TRANSITION`, ...
  - `userId` (FK NULL vers `User.id`)
  - `metadata` (text, NULL) — JSON sérialisé (à typer/normaliser si besoin)
  - `createdAt` (datetime, NN)
- **Relations**:
  - n `AuditLog` → 0..1 `User`

### `PasswordResetToken` (réinitialisation MDP)
- **PK**: `id` (int)
- **Champs**:
  - `userId` (FK NN vers `User.id`)
  - `tokenHash` (string, NN) — **hash** du token (le token brut ne doit pas être stocké)
  - `expiresAt` (datetime, NN)
  - `createdAt` (datetime, NN)
- **Relations**:
  - n `PasswordResetToken` → 1 `User`

## Contraintes et règles métier (à formaliser)
- **Unicité dossier/sinistre**: `CaseFile.claimId` UNIQUE
- **Statuts**:
  - `Claim.status=draft` tant que le sinistre n’est pas “complet”
  - passage en `complete` lors de la création du `CaseFile`
- **Pièces requises** (avant génération dossier):
  - `attestation_assurance`
  - `carte_grise`
  - `piece_identite_conducteur`
- **Validation hiérarchique**:
  - certaines transitions de `CaseFile` déclenchent une `Approval` si l’utilisateur n’a pas un rôle “manager” (`admin` / `gestionnaire_portefeuille`)
- **RGPD** (recommandations d’implémentation):
  - limiter les données stockées, tracer les accès (audit), chiffrer au repos si possible
  - stockage fichiers en UE/FR (ex. OVH Object Storage, Scaleway, Outscale), URLs signées à durée courte

