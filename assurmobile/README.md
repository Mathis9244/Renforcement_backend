# AssurMoi Mobile (Expo)

## Prérequis

- Node.js + npm
- Backend API qui tourne sur `http://localhost:3000`

Si tu utilises Docker (recommandé) à la racine du repo :

```bash
docker compose up -d app-assurmoi-db app-assurmoi-mailhog app-assurmoi-node
```

## Démarrage (le plus simple sur Windows) — Émulateur Android

1) Installer dépendances :

```bash
npm install
```

2) Lancer un émulateur Android dans Android Studio (Device Manager).

3) Démarrer Expo et ouvrir sur l’émulateur :

```bash
npm run start:android
```

### API sur l’émulateur Android

Par défaut l’app utilise `http://10.0.2.2:3000` (loopback de la machine hôte vu depuis l’émulateur).
Tu peux surcharger via la variable d’environnement :

```bash
setx EXPO_PUBLIC_API_BASE_URL "http://10.0.2.2:3000"
```

Puis relancer Expo.

## Démarrage LAN (réseau local)

```bash
npm run start:lan
```

> Sur iPhone (Expo Go), `10.0.2.2` ne marche pas. Il faut utiliser l’IP du PC (ex: `http://192.168.x.x:3000`)
> ou un tunnel.

