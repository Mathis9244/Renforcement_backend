FROM node:24-alpine

ENV HOME=/home/app

WORKDIR $HOME

RUN npm install -g nodemon

WORKDIR $HOME/api-annonces

# Installer les dépendances du projet Node pendant le build Docker.
# (Le code lui-même sera monté en volume au runtime pour permettre le "hot reload".)
COPY api-annonces/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY api-annonces ./
EXPOSE 3000
