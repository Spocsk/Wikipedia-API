# Wikipedia API

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Description

Wikipedia API est une application serveur développée avec le framework [NestJS](https://nestjs.com/) qui permet d'effectuer des recherches sur Wikipédia en récupérant des résumés et des extraits d'articles.

## Installation

Clonez le dépôt et installez les dépendances :

```bash
$ git clone <repository-url>
$ cd wikipedia-api
$ yarn install
```

## Démarrage du projet

Lancez le projet en mode développement :

```bash
$ yarn run start:dev
```

Pour exécuter l'application en mode production :

```bash
$ yarn run build
$ yarn run start:prod
```

## API Endpoints

L'API propose les endpoints suivants :

### Recherche d'un article Wikipédia

```http
GET /wikipedia/search?query=<terme>
```

#### Paramètres
- `query` (string, requis) : Terme de recherche.

#### Réponse
```json
{
  "title": "Internet",
  "description": "Réseau informatique mondial",
  "extract": "Internet est le réseau informatique mondial ...",
  "thumbnail": "https://upload.wikimedia.org/...",
  "url": "https://fr.wikipedia.org/wiki/Internet",
  "firstParagraphs": ["Paragraphe 1", "Paragraphe 2", ...]
}
```

## Tests

Exécutez les tests unitaires et end-to-end :

```bash
$ yarn run test
$ yarn run test:e2e
```

## Déploiement

Pour déployer l'application sur un serveur de production :

```bash
$ yarn run build
$ yarn run start:prod
```

## Technologies utilisées
- NestJS
- Axios
- RxJS
- TypeScript

## Auteur
Développé par Spock.

## Licence
Ce projet n'est pas sous license.

