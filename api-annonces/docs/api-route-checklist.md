# Liste des éléments à construire pour une route API (Express / Sequelize)

Cette checklist sert de “template” pour créer une nouvelle route API de façon propre, sécurisée et testable.

## 1) Définir le contrat (avant de coder)
- **Endpoint**: méthode + chemin + versioning (ex. `POST /api/v1/...`)
- **But métier**: ce que la route fait (verbe + ressource)
- **Rôles autorisés**: RBAC (qui a le droit)
- **Idempotence**: est-ce répétable sans effet (GET/PUT) ou non (POST)
- **Erreurs attendues**: `400/401/403/404/409/422/500` + messages
- **Réponses**: structure JSON stable (ex. `{ entity: ... }`), pagination si liste

## 2) Route + middleware
- **Router**: ajouter dans `routes/*.js`
- **Auth**: `requireAuth` (JWT)
- **RBAC**: `requireRoles(...)` (admin override si prévu)
- **Validation**: valider `params`, `query`, `body` (présence, formats, enums)
  - refuser explicitement les champs non supportés (whitelist) si pertinent

## 3) Service (logique métier)
- **Accès DB**: Sequelize models (find/create/update) + transactions si multi-écritures
- **Règles métier**: statuts, invariants, pré-conditions
- **Concurrence**: vérifier “double action” (ex. création duplicata) → 409 si besoin
- **Sécurité**: filtrer par rôle/ownership (ex. un chargé clientèle ne voit que ses sinistres)

## 4) Journalisation / audit
- **AuditLog**: écrire un événement horodaté (entityType/entityId/action/userId/metadata)
- **Traçabilité**: inclure les IDs utiles dans `metadata` (pas de données sensibles)

## 5) Réponse HTTP
- **Codes**:
  - `200` succès (lecture / update)
  - `201` création
  - `202` traitement différé / attente validation
  - `400` input invalide
  - `401` non authentifié
  - `403` non autorisé
  - `404` ressource inexistante
  - `409` conflit (déjà existant, transition impossible, etc.)
  - `500` erreur inattendue
- **Payload**: toujours JSON, champs cohérents

## 6) Documentation Swagger/OpenAPI
- **Path** + **requestBody** + **schemas** + **responses**
- **Security**: `bearerAuth`
- **Exemples** (facultatif mais utile): sample requests/responses

## 7) Tests (si demandés / si repo en contient)
- **Tests unitaires** de la logique métier (service)
- **Tests d’intégration** route (auth + RBAC + validation + DB)

