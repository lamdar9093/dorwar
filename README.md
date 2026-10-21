# Dorwar — prototype de démonstration

Dorwar présente aux familles des personnes **rencontrées, vérifiées et suivies sur le terrain** pour la maison et le quotidien. Ce dépôt contient le prototype de démonstration décrit dans [`dorwar-brief.md`](dorwar-brief.md) et planifié dans [`PLAN.md`](PLAN.md).

- **Toutes les données sont fictives.** Aucun SMS n'est envoyé (le code de connexion s'affiche à l'écran), aucun paiement n'est traité.
- Ce qui reste à valider juridiquement avant un vrai lancement : [`CONFORMITE.md`](CONFORMITE.md).

## Sommaire

1. [Essayer la démo](#1-essayer-la-démo)
2. [Déployer sur un VPS](#2-déployer-sur-un-vps)
3. [Exploiter au quotidien](#3-exploiter-au-quotidien)
4. [Variables d'environnement](#4-variables-denvironnement)
5. [Développer en local](#5-développer-en-local)
6. [Ajouter un service par configuration](#6-ajouter-un-service-par-configuration)
7. [Architecture](#7-architecture)
8. [Choix techniques et écarts au plan](#8-choix-techniques-et-écarts-au-plan)

---

## 1. Essayer la démo

Une fois le site déployé et les données de démonstration chargées (étape 2.6), connectez-vous depuis `/connexion` avec l'un de ces numéros. Le code est `123456` (variable `DEMO_OTP`). La page de connexion propose aussi ces comptes en un geste.

| Rôle                                          | Numéro            | Ce qu'on peut montrer                                                                                                           |
| --------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Famille (Famille Diallo, Mermoz)              | +221 77 000 00 01 | Une demande ouverte avec ses profils, une mission avec rencontre fixée (conditions à accepter), un placement confirmé avec avis |
| Intendante vérifiée (Aminata)                 | +221 77 000 00 02 | Suivi du dossier, carte Dorwar avec QR code, missions et avis                                                                   |
| Intendante en cours de vérification (Mariama) | +221 77 000 00 05 | Dossier à 3 étapes sur 6                                                                                                        |
| Agent de terrain (Ndèye)                      | +221 77 000 00 03 | Dossiers à traiter, vérification étape par étape, suivis, appel de la première semaine                                          |
| Administration                                | +221 77 000 00 04 | Tableau de bord, zones, signalements, paramètres, journal des accès                                                             |

Quelques scénarios qui parlent :

- **Sans compte** : sur l'accueil, faites glisser la rangée de profils, puis « Voir les 15 profils vérifiés » et choisissez un quartier. Ouvrez une fiche (par exemple Yacine D., aux Mamelles) et touchez « Rencontrer Yacine ». Connectez-vous avec un numéro inconnu (par exemple +221 76 123 45 67) : le formulaire rappelle la personne remarquée. Demandez une mission ponctuelle aux Mamelles : vous arrivez directement sur sa fiche, prête pour la demande de rencontre. Si la personne ne correspond pas à la demande, vous voyez celles qui y correspondent, avec une explication.
- **La carte Dorwar** : connectez-vous comme Aminata, ouvrez « Ma carte », scannez le QR code avec un téléphone. La page `/v/DW-7K3M-Q2XP` confirme que la carte est active. Suspendez la carte depuis l'espace agent : la même page affiche « carte inactive ».
- **La zone pilote** : la Famille Kane (+221 77 000 00 15) cherche à Dagana, zone encore fermée. Elle voit un message honnête et peut laisser son numéro. Ouvrez Dagana dans `Admin › Zones` : l'intendante vérifiée de Dagana apparaît aussitôt.
- **La vérification** : comme agent, ouvrez le dossier de Nogaye (5 étapes sur 6), faites l'entretien, puis « Valider le profil ».

Le bandeau « Version de démonstration » est affiché sur toutes les pages, et les pages ne sont pas indexées par les moteurs de recherche tant que `DEMO_MODE=true`. La liste des profils et les fiches ne le sont jamais, même hors démonstration.

---

## 2. Déployer sur un VPS

Dorwar se déploie comme Gobering : **Traefik** tourne déjà sur le VPS (ports 80 et 443, certificats Let's Encrypt, réseau Docker `traefik-net`), et l'application s'y déclare par les étiquettes de son `docker-compose.yml`. Elle n'ouvre aucun port. Les migrations s'appliquent au démarrage du conteneur, et la base est sur Neon.

Il faut un VPS avec **Docker** et **Traefik** (2 Go de mémoire au moins : la construction de l'image en a besoin), un **nom de domaine** et un compte **Neon**. Comptez une vingtaine de minutes. Pas de Traefik sur le serveur ? Suivez les mêmes étapes avec la variante Caddy, décrite en [2.8](#28-vps-sans-traefik).

### 2.1 Pointer le domaine vers le serveur

Chez votre registraire, créez un enregistrement DNS de type **A** pour votre domaine (par exemple `demo.dorwar.sn`) avec l'adresse IP du serveur. **Attendez qu'il soit visible avant le premier lancement** : Let's Encrypt limite les tentatives échouées.

```bash
dig +short demo.dorwar.sn   # doit afficher l'IP du serveur
```

### 2.2 Créer la base de données sur Neon

1. Sur [console.neon.tech](https://console.neon.tech), créez un projet. Région conseillée : **AWS Europe Central (Frankfurt)**, la plus proche de Dakar parmi celles proposées.
2. Dans « Connection Details », choisissez la base `neondb` (ou créez une base `dorwar`) et copiez la chaîne de connexion. Elle ressemble à :
   `postgresql://utilisateur:motdepasse@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
3. Rien d'autre à faire : la première migration active elle-même l'extension **PostGIS**.

### 2.3 Récupérer le code

```bash
sudo mkdir -p /var/www/dorwar && sudo chown "$USER": /var/www/dorwar
git clone <adresse-de-votre-dépôt> /var/www/dorwar
cd /var/www/dorwar
```

C'est le dossier que le déploiement automatique ([2.7](#27-déploiement-automatique-github-actions)) met à jour. Sans dépôt distant, depuis votre ordinateur :

```bash
rsync -a --exclude /node_modules --exclude /.next --exclude /.git --exclude /.env \
  ./ utilisateur@serveur:/var/www/dorwar/
```

### 2.4 Configurer

```bash
cp .env.example .env
nano .env
```

Renseignez au minimum (le détail de chaque variable est en [section 4](#4-variables-denvironnement)) :

| Variable          | Valeur                                             |
| ----------------- | -------------------------------------------------- |
| `DATABASE_URL`    | la chaîne Neon copiée à l'étape 2.2                |
| `SITE_DOMAIN`     | votre domaine, sans `https://`                     |
| `SESSION_SECRET`  | le résultat de `openssl rand -base64 48`           |
| `WHATSAPP_NUMBER` | le numéro WhatsApp de l'équipe, ex. `221771234567` |

Le fichier `.env` reste sur le serveur : il n'est jamais versionné, et le déploiement automatique n'y touche pas.

### 2.5 Lancer

```bash
docker compose up -d --build
```

La première construction prend quelques minutes. Au démarrage, l'application **applique les migrations** puis attend les visiteurs ; Traefik la détecte seul et obtient le certificat HTTPS dès la première visite. Pour suivre :

```bash
docker compose ps            # « app » doit être healthy
docker compose logs -f app   # « Migrations appliquées. » puis « Ready »
```

### 2.6 Charger les données de démonstration

```bash
docker compose exec app node dist-scripts/seed.mjs
```

Ouvrez `https://votre-domaine` : la démo est en ligne.

**Attention, le site est public.** La page de connexion propose les comptes de démonstration, dont l'agent et l'administration, avec le code `123456` : toute personne qui connaît l'adresse peut s'y connecter. Les données sont fictives, mais ne diffusez pas l'adresse à la légère. Pour limiter l'accès, on peut placer le site derrière un identifiant avec le middleware `basicauth` de Traefik.

### 2.7 Déploiement automatique (GitHub Actions)

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) reprend celui de Gobering : GitHub se connecte en SSH au VPS, met le code à jour, reconstruit l'image et relance le conteneur (les migrations s'appliquent au démarrage).

1. Le VPS doit pouvoir lire le dépôt (clé de déploiement ou jeton, comme pour Gobering), et le code doit être cloné dans `/var/www/dorwar` (étape 2.3).
2. Dans le dépôt GitHub, _Settings › Secrets and variables › Actions_, ajoutez les quatre secrets du tableau ci-dessous.
3. Déclenchez le déploiement : un push (ou une fusion) sur `main`, ou _Actions › Deploy Dorwar › Run workflow_ en choisissant la branche, par exemple `prototype-demo`, sans la fusionner.

| Secret            | Valeur                                             |
| ----------------- | -------------------------------------------------- |
| `VPS_HOST`        | adresse IP ou nom du VPS                           |
| `VPS_USER`        | utilisateur SSH, autorisé à utiliser Docker        |
| `SSH_PRIVATE_KEY` | clé privée SSH dont la clé publique est sur le VPS |
| `SSH_PORT`        | port SSH, `22` en général                          |

Pour changer une variable : modifiez `.env` sur le VPS, puis `docker compose up -d`.

### 2.8 VPS sans Traefik

Sur un serveur **Ubuntu 24.04** neuf, sans proxy, la variante `docker-compose.caddy.yml` ajoute Caddy, qui prend les ports 80 et 443 et obtient lui-même les certificats. Commencez par installer Docker : connectez-vous en SSH, puis :

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# Déconnectez-vous puis reconnectez-vous pour que le groupe docker soit pris en compte.
docker compose version    # doit afficher une version 2.x
```

Ouvrez uniquement les ports utiles :

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

Suivez ensuite les étapes 2.1 à 2.6, avec deux changements dans `.env` : décommentez `COMPOSE_FILE=docker-compose.caddy.yml` (toutes les commandes `docker compose` de ce guide utilisent alors la variante Caddy) et `ACME_EMAIL=...` (adresse transmise à Let's Encrypt). Les journaux de Caddy : `docker compose logs caddy`.

---

## 3. Exploiter au quotidien

| Besoin                                   | Commande                                                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Mettre à jour après un `git pull`        | `docker compose up -d --build` (les nouvelles migrations s'appliquent au démarrage)                       |
| Mettre à jour sans se connecter          | GitHub Actions : push sur `main`, ou « Run workflow » ([2.7](#27-déploiement-automatique-github-actions)) |
| Remettre la démo à zéro                  | `docker compose exec app node dist-scripts/seed.mjs --reset`                                              |
| Voir les journaux                        | `docker compose logs -f app` (et `docker compose logs -f caddy` avec la variante Caddy)                   |
| Vérifier la base                         | `curl https://votre-domaine/api/health?base=1`                                                            |
| Appliquer les migrations sans redémarrer | `docker compose exec app node dist-scripts/migrate.mjs`                                                   |
| Démarrer sans toucher à la base          | `RUN_MIGRATIONS=false` dans `.env`, puis `docker compose up -d`                                           |
| Arrêter                                  | `docker compose down` (les volumes, donc les documents, sont conservés)                                   |

**Sauvegarder les documents privés** (pièces, photos : ils sont sur le volume `dorwar_uploads`, pas dans la base ; le préfixe est le nom du dossier du projet, vérifiez avec `docker volume ls`) :

```bash
docker run --rm -v dorwar_uploads:/data -v "$PWD":/sauvegarde alpine \
  tar czf /sauvegarde/documents-$(date +%F).tar.gz -C /data .
```

La base, elle, est sauvegardée par Neon (historique et restauration à un instant donné dans la console).

**Si le site ne répond pas en HTTPS** : vérifiez que le DNS pointe bien sur le serveur (`dig`), que `docker compose ps` montre `app` en `healthy` et que le réseau `traefik-net` existe (`docker network ls`), puis lisez les journaux du conteneur Traefik. Une page « 404 page not found » vient de Traefik : le nom saisi dans le navigateur ne correspond pas à `SITE_DOMAIN`. Let's Encrypt limite les tentatives : corrigez avant de relancer. Avec la variante Caddy : ports 80 et 443 ouverts, puis `docker compose logs caddy`.

**Si l'application ne démarre pas** : `docker compose logs app`. Un « Échec des migrations » indique presque toujours une `DATABASE_URL` incorrecte (mot de passe, nom de base, `sslmode=require` oublié).

---

## 4. Variables d'environnement

Toutes sont décrites dans [`.env.example`](.env.example).

| Variable                     | Obligatoire    | Rôle                                                                                                                                                |
| ---------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`               | oui            | Connexion PostgreSQL + PostGIS (Neon), avec `sslmode=require`                                                                                       |
| `SITE_DOMAIN`                | oui (Docker)   | Domaine public : règle de routage de Traefik (ou domaine de Caddy), et QR codes des cartes                                                          |
| `COMPOSE_FILE`               | variante Caddy | `docker-compose.caddy.yml` : fait utiliser la variante Caddy à toutes les commandes `docker compose`                                                |
| `ACME_EMAIL`                 | variante Caddy | Adresse transmise à Let's Encrypt (Caddy seulement : Traefik a sa propre configuration)                                                             |
| `SESSION_SECRET`             | oui            | Secret des sessions et des codes de connexion (32 caractères minimum)                                                                               |
| `SITE_URL`                   | non            | Adresse complète si elle diffère de `https://SITE_DOMAIN` (ex. `http://localhost:3000` en local)                                                    |
| `WHATSAPP_NUMBER`            | non            | Numéro de l'équipe par défaut ; modifiable ensuite dans `Admin › Paramètres`                                                                        |
| `DEMO_MODE`                  | non (`true`)   | Bandeau de démonstration, code affiché, pages non indexées                                                                                          |
| `DEMO_OTP`                   | non            | Code de connexion fixe en démonstration (sinon aléatoire, affiché à l'écran) ; ignoré hors démonstration                                            |
| `SMS_PROVIDER`               | non (`demo`)   | Fournisseur SMS ; seul `demo` existe, et seulement avec `DEMO_MODE=true` : hors démonstration, brancher un vrai fournisseur (`src/lib/auth/sms.ts`) |
| `DEFAULT_GUARANTEE_DAYS`     | non (`30`)     | Garantie initiale de la longue durée, créée par le seed ; ensuite modifiable dans l'admin                                                           |
| `DEFAULT_PLACEMENT_FEE_FCFA` | non (`15000`)  | Frais de dossier initiaux, longue durée                                                                                                             |
| `DEFAULT_MISSION_FEE_FCFA`   | non (`2500`)   | Frais de dossier initiaux, mission ponctuelle                                                                                                       |
| `UPLOADS_DIR`                | non            | Dossier privé des documents (dans Docker : `/app/data/uploads`)                                                                                     |
| `RUN_MIGRATIONS`             | non (`true`)   | Appliquer les migrations au démarrage du conteneur                                                                                                  |

---

## 5. Développer en local

Prérequis : Node.js 22.12 ou plus récent, Docker (pour une base PostGIS locale) ou une base Neon.

```bash
npm ci
cp .env.example .env          # puis DATABASE_URL, SESSION_SECRET, SITE_URL=http://localhost:3000
npm run db:up                 # PostGIS local sur le port 54329, attend qu'il soit prêt
# DATABASE_URL=postgres://dorwar:dorwar@localhost:54329/dorwar
npm run db:migrate
npm run db:seed
npm run dev                   # http://localhost:3000
```

Si toutes les pages répondent en erreur avec `ECONNREFUSED 127.0.0.1:54329`, la base locale est arrêtée : relancez `npm run db:up` (les données sont conservées dans le volume `dorwar-dev_dorwar_pg`), puis rechargez la page.

| Commande              | Rôle                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------ |
| `npm run check`       | Lint, vérification des types et tests                                                |
| `npm test`            | Tests (règles d'accès, formulaire, vérification, documents, contrastes, vocabulaire) |
| `npm run format`      | Formatage Prettier                                                                   |
| `npm run db:generate` | Nouvelle migration après une modification de `src/db/schema.ts`                      |
| `npm run db:reset`    | Vider la base et recharger les données de démonstration                              |
| `npm run referentiel` | Reconstruire le référentiel des zones depuis Wikidata (voir le script)               |

---

## 6. Ajouter un service par configuration

Un service (nom, icône, teinte, textes de sa page, formules, formulaire de besoin, étapes de vérification, garantie, frais) est **une ligne de la table `services`**. Les pages, le formulaire, la recherche, la liste de l'agent, le badge et la carte s'en déduisent : aucune page à modifier.

Un service est une **catégorie**, pas l'identité de Dorwar. Une fois activé, il apparaît dans le sélecteur de l'accueil et la liste des services, et devient un **filtre de l'annuaire** `/personnes` : pastilles « Chercher par service » sur l'accueil et dans l'annuaire dès qu'il y a deux services. Son vocabulaire (« intendante », par exemple) vit uniquement dans sa configuration : un test (`src/lib/content.test.ts`) échoue si une page, un composant ou un dictionnaire commun le reprend en dur.

1. Partez de la configuration existante :
   ```bash
   npm run --silent service -- export intendance-de-maison > nouveau-service.json
   ```
2. Adaptez le fichier : `slug`, `name`, `icon`, `hue` (`terre`, `baobab`, `indigo` ou `ocre`), `active` (laissez `false` pour préparer), puis dans `config` le vocabulaire, les textes, les formules, le formulaire (`needForm`), les étapes de vérification, la garantie et les frais de chaque formule.
3. Importez-le. Le fichier est validé : une garantie ou des frais manquants, deux champs de même clé, un formulaire sans champ « lieu » sont refusés avec un message clair.
   ```bash
   npm run --silent service -- import nouveau-service.json
   # en production :
   docker compose cp nouveau-service.json app:/tmp/nouveau-service.json
   docker compose exec app node dist-scripts/service.mjs import /tmp/nouveau-service.json
   ```
4. Ouvrez-le dans `Admin › Paramètres` quand l'équipe de terrain est prête à vérifier pour ce service.

L'icône est une clé du registre `src/components/icons.tsx`. Une clé inconnue affiche simplement l'initiale du service dans sa teinte : un nouveau service fonctionne sans code, son icône dédiée est un raffinement facultatif.

Le formulaire de besoin se décrit avec ces types de champs : `formula`, `choice`, `multi_choice`, `text`, `textarea`, `number`, `money`, `date`, `time_range`, `days_of_week`, `location`, `consent`, `info` (et `voice_note`, réservé). Chaque champ ou étape peut porter une condition `showIf` (`{ field, in: [...] }`, `{ field, filled: true }`, `any`, `all`). Voir `src/lib/form-engine/schema.ts`.

---

## 7. Architecture

- **Next.js 16** (App Router, TypeScript strict), rendu côté serveur ; JavaScript client limité aux formulaires interactifs.
- **Tailwind CSS 4**, thème entièrement personnalisé (`src/app/globals.css`) : palette « La porte ouverte », polices auto-hébergées Fraunces et Atkinson Hyperlegible Next (`src/app/fonts/`, licence OFL).
- **PostgreSQL + PostGIS** (Neon) avec **Drizzle** ; migrations versionnées dans `drizzle/`. Les distances sont calculées par PostGIS (`src/lib/matching.ts`).
- **Connexion par téléphone et code** à usage unique (haché, 5 minutes, 5 essais), sessions en base, cookie httpOnly. Le fournisseur SMS est une interface (`SmsProvider`) prête à brancher.
- **Contrôle d'accès côté serveur** sur chaque page et chaque action (`src/lib/auth/rbac.ts`, testé).
- **Documents privés** sur un volume Docker, derrière une interface de stockage prête pour un service compatible S3 (`src/lib/storage.ts`). Ils ne sont jamais servis publiquement : une seule route les lit (`/api/documents/[id]`), réservée à l'équipe, et chaque consultation est journalisée avant la lecture.

```
src/
  app/(site)/          accueil, page de service, annuaire /personnes, connexion, carte /v/[n°], vos données
  app/(famille)/       demande, profils, rencontre, suivi du placement
  app/(prestataire)/   inscription guidée, dossier, carte Dorwar, missions
  app/(agent)/         outil de terrain : dossiers, vérification, suivis
  app/(admin)/         administration
  components/          kit d'interface maison, marque, icônes
  db/                  schéma, client, données de démonstration
  i18n/                dictionnaires (français ; mots wolof à faire valider)
  lib/                 règles métier, accès, formulaires, recherche, stockage
drizzle/               migrations
scripts/               migrations, seed, import/export de service, référentiel
```

---

## 8. Choix techniques et écarts au plan

- **Cache Components désactivé.** Next 16.4 l'active par défaut. Presque toutes les pages lisent la session ou la base à chaque requête, et ce mode aurait demandé un accès à la base pendant `docker build`. Le modèle classique est plus simple et sûr ici ; la migration sera à prévoir avec Next 17.
- **TypeScript 5.9, ESLint 9, Vitest 4** : les versions les plus récentes de ces lignes stables, compatibles avec tout l'outillage. TypeScript 7 n'est pas encore pris en charge par typescript-eslint.
- **Node 24** dans l'image (version LTS active), au lieu du Node 22 indiqué dans le plan.
- **Déploiement derrière Traefik, comme Gobering, et non Caddy.** Le plan prévoyait Caddy. Le VPS ayant déjà Traefik (ports 80 et 443, réseau `traefik-net`), `docker-compose.yml` s'y déclare par étiquettes ; Caddy reste disponible, pour un serveur sans proxy, dans `docker-compose.caddy.yml`. Le déploiement automatique reprend le workflow GitHub Actions de Gobering (SSH, mise à jour du code, reconstruction), avec une différence : l'image est reconstruite **avant** l'arrêt de l'ancienne version, au lieu de `docker compose down` puis `build`, ce qui évite de couper le site pendant la construction. Vérifié en local avec Traefik 3.7 : routage, HTTPS, actions serveur, cookie `Secure`.
- **Référentiel des zones** : 14 régions, 46 départements et 516 communes (Wikidata, CC0), la région de Dakar corrigée à la main selon le découpage de 2021. Le plan prévoyait environ 80 quartiers pour Dakar ; il y en a **26**, uniquement ceux dont l'emplacement est sûr. L'admin peut en ajouter (`Admin › Zones`). Les points centraux sont approchés et à remplacer par le référentiel officiel (ANSD) avant un lancement.
- **Traductions** : le dictionnaire couvre l'interface publique, la connexion et les statuts ; les écrans internes (agent, admin) sont rédigés directement en français. Le wolof se limite à quelques mots, tous marqués `// À FAIRE VALIDER PAR UN LOCUTEUR` dans `src/i18n/wo.ts`.
- **Lecture à voix haute** dans l'inscription des prestataires, avec la synthèse vocale du téléphone (en français). La note vocale dans les demandes reste réservée (`voice_note`).
- **PWA** : le site est installable (manifeste et icônes), sans fonctionnement hors ligne.
- **Vitrine publique, ajoutée après le plan.** Le plan ne montrait des profils qu'aux familles connectées. Un visiteur voit désormais, sans compte, les personnes vérifiées : rangée à faire glisser sur l'accueil, un seul annuaire pour tous les services (`/personnes`, filtrable par service, quartier et formule), une fiche par personne (`/personnes/[id]`) et les avis des familles. L'âge, la rémunération souhaitée, la disponibilité et le numéro de carte restent réservés aux familles connectées (`src/lib/public-profile.ts`, testé). Les avis sont signés « Une famille » et le quartier, partout. Pas de carrousel automatique ni de classement « top » : la rangée ne bouge que sous le doigt et n'ajoute aucun JavaScript.

Mesures sur le build de production (page d'accueil, mobile) : environ **136 Ko de JavaScript transférés** (449 Ko décompressés, essentiellement React et Next.js) ; Lighthouse mobile **96 à 97 en performance et 100 en accessibilité** sur l'accueil, la page du service et la connexion.
