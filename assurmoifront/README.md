# AssurMoi Front (Vite)

## Démarrage

1) Installer dépendances :

```bash
npm install
```

2) Démarrer le backend (port 3000)

Si tu utilises Docker (à la racine du repo) :

```bash
docker compose up -d app-assurmoi-db app-assurmoi-mailhog app-assurmoi-node
```

3) Démarrer le front :

```bash
npm run dev
```

### Proxy API

Le front est configuré pour appeler l’API via proxy Vite (évite le CORS) :

- `/api/*` → `http://localhost:3000`
- `/user/*` → `http://localhost:3000`

Voir `vite.config.ts`.

### Accès depuis un autre appareil sur le réseau

```bash
npm run dev:host
```
