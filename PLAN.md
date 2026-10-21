# PLAN — Dorwar, prototype de démonstration

> Réponse au brief [`dorwar-brief.md`](dorwar-brief.md).
> **Statut : validé le 18 octobre 2026, réalisé.** Les questions ouvertes (§14) n'ayant pas encore reçu de réponse, le prototype applique les propositions par défaut (direction A, garantie de 30 jours, etc.). Toutes sont modifiables par configuration ou dans l'admin. Les écarts entre ce plan et la réalisation sont listés dans le [README, section 8](README.md#8-choix-techniques-et-écarts-au-plan).

## 0. Lecture rapide

- Une démo crédible, 100 % données fictives, bandeau discret « Version de démonstration » sur toutes les pages.
- **Simulé** : OTP (code affiché à l'écran), paiements (simple mention Wave / Orange Money), SMS, photos (médaillons stylisés).
- **Réel** : base Neon + PostGIS, contrôle d'accès serveur par rôle, stockage privé des documents, journal d'accès, cartes Dorwar avec QR code fonctionnel.
- Un seul service visible : **Intendance de maison** (3 formules). L'architecture accepte un service supplémentaire par simple configuration (§2), sans toucher aux pages — et le site n'annonce jamais rien « à venir ».

## 1. Architecture technique

### Pile

| Brique | Choix | Note |
|---|---|---|
| Framework | Next.js (App Router), version stable courante, TypeScript `strict` | Rendu serveur (RSC) par défaut, composants client uniquement pour l'interactif. Runtime Node partout (pas d'edge) : simplifie PostGIS et le stockage disque. |
| Style | Tailwind CSS v4, thème 100 % personnalisé via `@theme` | Aucune couleur/police par défaut. Pas de shadcn/ui : un petit kit maison (~12 composants) pèse moins lourd et évite le « style par défaut » interdit par le brief. |
| BDD | Neon (PostgreSQL) + extension PostGIS | Connexion `pg` (pool) avec `sslmode=require`. |
| ORM | Drizzle + migrations versionnées `drizzle-kit` | Le SQL géographique passe par l'opérateur `sql` de Drizzle. |
| Validation | Zod, côté serveur, sur chaque Server Action | Le moteur de formulaire (§2) compile la config du service en schéma Zod. |
| Auth | Téléphone +221 + OTP, sessions en base, cookie httpOnly | Pas de mot de passe. Interface `SmsPort` : implémentation démo (code affiché), prête pour un vrai fournisseur SMS. |
| Fichiers | Interface `StoragePort` → disque local (volume Docker) | Jamais servis statiquement ; lecture via route authentifiée + journal d'accès. Implémentation S3 branchable plus tard sans changer les appels. |
| QR | Lib `qrcode`, SVG généré côté serveur | URL encodée : `https://<domaine>/v/<cardId>`. |
| i18n | Mini-lib maison `t(clé)` sur dictionnaires TS | `i18n/fr.ts` (défaut) et `i18n/wo.ts` (quelques salutations, chacune marquée `// À FAIRE VALIDER PAR UN LOCUTEUR`). |
| PWA | `manifest.webmanifest` + icônes (installable) | Pas de service worker au départ (budget JS, simplicité) ; ajout léger en fin de projet si trivial. |

### Choix assumés (à contester si besoin)

- **Sessions en base** (table `sessions`, jeton opaque) plutôt que JWT : révocable, simple, suffisant.
- **Ordre du parcours famille suivi à la lettre** (choix du service → connexion OTP → formulaire), comme écrit au brief §7.
- **Garantie et frais** : le brief les met à la fois en variables d'environnement (§11) et en paramètres admin (§7). Réconciliation : les variables d'env servent de **valeurs par défaut au seed**, ensuite tout est modifiable en admin (table `services` / `settings`).
- **Note vocale** : v1 texte seul ; le type de champ `voice_note` est réservé dans le moteur de formulaire pour plus tard (§14-Q7).
- **Pas de mode sombre** en v1 (hors périmètre, budget perf).

### Arborescence

```
src/
  app/
    (public)/        → /, /services/[slug], /connexion, /v/[cardId], /vos-donnees
    (famille)/       → /demande/[slug], /demandes, /demandes/[id], /profils/[id], /placements/[id]
    (prestataire)/   → /devenir-prestataire, /espace-prestataire, /espace-prestataire/carte, /espace-prestataire/demandes
    (agent)/         → /agent, /agent/dossiers/[id], /agent/suivis
    (admin)/         → /admin, /admin/{utilisateurs,dossiers,placements,incidents,zones,attente,parametres}
    api/health       → healthcheck Docker
    api/documents/[id] → seul point de lecture des fichiers privés (contrôle de rôle + journal)
  components/ui/     → kit maison : Bouton, Champ, CarteChoix, Badge, Sceau, Médaillon, Feuille, Bandeau…
  components/        → blocs métier : BadgeVerification, CarteProfil, CarteDorwar, SelecteurService, EtapesDossier…
  config/services.ts → registre icône + teinte par service (repli : médaillon-lettre, voir §2)
  db/                → schema.ts, migrations/, seed/ (référentiel zones + données de démo)
  lib/               → auth, rbac, otp, sms, storage, geo, form-engine, qr, i18n, format (FCFA, dates fr)
```

**Rôles et accès** : middleware par groupe de routes **et** garde `requireRole()` au début de chaque Server Action et chaque loader (défense en profondeur). Matrice : la famille ne voit jamais les documents ; le prestataire ne voit que son propre dossier ; l'agent voit les dossiers et placements ; l'admin voit tout.

## 2. Multi-services par configuration (le mécanisme)

Un service = **une ligne dans la table `services`**. Tout ce qui distingue un service est de la donnée :

```
slug, name, icon, hue, active, sortOrder
formulas      : [{ key, label, description, housing: bool }]            — les formules propres au service
pageTexts     : { heroTitle, heroSubtitle, points[], … }                — tous les textes de la page service
needForm      : { steps: [{ key, title, showIf?, fields: [FieldSpec] }] } — le formulaire de besoin
verification  : [{ type, label, publicLabel }]                          — étapes exigées, ordonnées
guarantees    : { <formulaKey>: { kind: 'remplacement'|'remplacement_ou_remboursement', days } }
fees          : { <formulaKey>: { amountFcfa, label } }
```

### Le moteur de formulaire (`lib/form-engine`)

- **Types de champs** : `choice` (cartes radio, grosses cibles), `multi_choice`, `text`, `textarea`, `number`, `money_fcfa`, `date`, `dates` (plusieurs dates), `time_range`, `days_of_week`, `area` (choix de quartier), `info` ; `voice_note` réservé.
- **Branches** : `showIf: { field, in: [...] }` sur un champ ou une étape entière (ex. : la contrepartie n'apparaît que si rythme = 7 j/7).
- **Trois responsabilités** : (1) rendu — un composant client par type de champ, une question à la fois sur mobile, cibles ≥ 48 px ; (2) validation — compilation `FieldSpec → Zod` côté serveur (requis, bornes, options autorisées, conditions) ; (3) stockage — réponses dans `requests.answers` (jsonb) + colonnes extraites pour le matching (formule, lieu).

### Le formulaire « Intendance de maison » (défini en seed, pas en code)

1. **Formule** : longue durée logé(e) / longue durée non logé(e) / mission ponctuelle.
2. Si logé(e) : **rythme** 6 j/7 ou 7 j/7 ; si 7 j/7 : **contrepartie convenue** (repos compensé ou rémunération supplémentaire + précision), inscrite dans les conditions (point juridique → CONFORMITE.md).
3. Longue durée : poste (ménage / cuisine / polyvalent), horaires, jour(s) de repos, congés lors des grandes fêtes, salaire mensuel proposé (FCFA), date de début.
4. Mission ponctuelle : date(s), nombre de jours, tâches (ménage, cuisine, préparation d'un événement…), tarif à la journée (FCFA).
5. Lieu (deux modes, §4) puis remarques et récapitulatif.

### Ajouter un service demain (ex. interne : commissionnaires — n'apparaît nulle part sur le site)

1 insert dans `services` (par seed ou SQL documenté) avec ses textes, formules, formulaire, étapes de vérification, garantie, frais → la page service, le formulaire de besoin, le matching, la checklist agent et le badge fonctionnent sans toucher au code des pages. **Icône** : le registre `config/services.ts` mappe `icon → SVG` ; clé inconnue → repli automatique en médaillon-lettre dans la teinte du service. Un nouveau service marche donc à 100 % sans code ; son icône dédiée est un raffinement optionnel.

## 3. Modèle de données

Conventions : le code dit toujours « prestataire » (valable pour tous les services) ; vocabulaire d'affichage géré en i18n (« intendante » / « intendant » selon `gender`).

| Table | Rôle | Colonnes notables |
|---|---|---|
| `users` | comptes | `phone` unique (+221, E.164), `role` (famille / prestataire / agent / admin), `status`, `createdAt` |
| `otp_codes` | connexion | `phone`, `codeHash`, `expiresAt` (5 min), `attempts` (max 5), `consumedAt` |
| `sessions` | sessions | `userId`, `tokenHash`, `expiresAt` |
| `services` | config des services | voir §2 |
| `worker_profiles` | fiche prestataire | `userId`, `firstName`, `lastName` (privé, affichage prénom + initiale), `gender`, `birthYear`, `languages[]`, `experienceYears`, `areaId` (quartier), `location` (point PostGIS, **jamais affiché**), `interventionRadiusKm`, `acceptedAreaIds[]`, `willingToRelocate`, `availability`, `monthlyRateFcfa`, `dailyRateFcfa`, `cardId` unique (QR), `avgRating` (dénormalisé) |
| `worker_services` | **le « dossier »** : un service proposé par une personne | `workerProfileId`, `serviceId`, `acceptedFormulaKeys[]`, `skills`, `verificationStatus` (brouillon / en attente / en cours / vérifié / refusé / suspendu), `verifiedAt`, `rejectedReason` |
| `verification_steps` | étapes du dossier | `workerServiceId`, `type` (identite / photo / adresse / reference_1 / reference_2 / entretien), `status` (à faire / fait / échec), `agentUserId`, `completedAt`, `notes` (privées), ordre. L'affichage public ne montre que `publicLabel` + date (« Identité vérifiée le 12 mars »), jamais le document. |
| `documents` | fichiers privés | `verificationStepId`, `workerProfileId`, `kind` (cni / portrait / adresse / autre), `storagePath`, `mimeType`, `uploadedByUserId`. **Jamais publics** ; accès agent + admin uniquement, via `api/documents/[id]`. |
| `access_logs` | journal sensible | `userId`, `documentId`, `action` (vue / téléversement / suppression), `at` — consultable par l'admin |
| `family_profiles` | fiche famille | `userId`, `displayName`, `areaId`, `location` (approchée : centroïde du quartier ou position partagée), `phoneVerifiedAt`, `commitmentsAcceptedAt` (engagements salaire/conditions) |
| `requests` | besoins | `familyUserId`, `serviceId`, `formulaKey`, `answers` (jsonb validé), `areaId`, `location`, `radiusKm`, `searchMode` (autour de moi / par zone), `status` |
| `placements` | tout le cycle | `requestId`, `workerServiceId`, statut : `rencontre_demandee → rencontre_prevue → essai → confirme → termine` (+ `annule`), `meetingAt`, `startDate`, `agreedSalaryFcfa` / `agreedDailyRateFcfa`, `restDays`, `conditions` (texte des conditions convenues par écrit), `guaranteeEndsAt`, `followUpCallDueAt` / `DoneAt` / `notes`, `endReason` |
| `reviews` | avis des deux côtés | `placementId`, `authorUserId`, `targetUserId`, `rating` 1–5, `comment`. Publics sur les profils prestataires ; les avis sur les familles sont visibles de l'équipe et du prestataire sollicité. |
| `incidents` | signalements | `reporterUserId`, `placementId?`, `category`, `description`, `status` (ouvert / en cours / résolu), `adminNotes` |
| `areas` | référentiel Sénégal | `parentId`, `level` (region / departement / commune / quartier), `name`, `slug`, `centroid` (geography Point), `boundary?`, `isOpen` |
| `waitlist` | zones sans profil | `phone`, `areaId`, `serviceId`, `createdAt`, `notifiedAt?` |
| `settings` | paramètres admin | clé/valeur : numéro WhatsApp, valeurs par défaut de garantie et de frais, etc. |

Index : GIST sur les colonnes `location` et `centroid`, unique sur `users.phone` et `worker_profiles.cardId`.

**Choix de modélisation** : le dossier de vérification est porté par `worker_services` (chaque service d'une même personne a son propre statut, comme demandé). Si une personne propose deux services, les étapes communes (identité…) sont refaites ou recopiées par l'agent — acceptable en démo, noté comme amélioration future.

## 4. Recherche par lieu

- **Deux modes** : « Autour de moi » (position partagée ou quartier choisi + rayon 2 / 5 / 10 / 20 km, tri du plus proche au plus loin) et « Par zone » (cascade région → département → commune → quartier).
- **Règle de correspondance** : un profil est proposé si son `worker_service` est vérifié, la formule demandée est acceptée, la zone est ouverte, et (distance ≤ rayon famille **et** ≤ rayon d'intervention du profil) **ou** la zone demandée est dans ses zones acceptées. Pour une formule logée : les profils `willingToRelocate` sont inclus au-delà du rayon, listés après les proches avec la mention « prêt(e) à s'installer ».
- **SQL** : `ST_DWithin` / `ST_Distance` sur type `geography` (mètres), via `sql` Drizzle.
- **Confidentialité** : jamais d'adresse ni de position précise à l'écran. Seulement le quartier et une distance arrondie (« à environ 3 km » ; en dessous de 1 km : « à moins d'1 km »).
- **Zones ouvertes** : `isOpen` posé sur la région de Dakar au seed (hérité par les descendants), basculable dans l'admin sans code. Recherche dans une zone fermée ou sans résultat → message honnête (« Pas encore d'intendant vérifié près de chez vous ») + proposition de laisser son numéro (`waitlist`).
- **Référentiel embarqué dans le repo (JSON de seed)** : les 14 régions et 46 départements complets, les communes du découpage en vigueur avec centroïdes approchés (source publique à créditer), et une liste curée de quartiers pour la région de Dakar (~80 : Ouakam, Yoff, Mermoz, Sacré-Cœur, Parcelles Assainies, Médina, Grand Dakar, Pikine, Guédiawaye, Keur Massar, Rufisque…). Ailleurs, la recherche descend jusqu'à la commune (ex. Dagana reste trouvable) ; l'admin peut ajouter un quartier à la main (§14-Q4).

## 5. Pages

### Public
| Page | Contenu |
|---|---|
| `/` Accueil | Vend la confiance et la marque, pas un métier. Sections du brief §6 : en-tête (titre + sélecteur « De quoi avez-vous besoin ? »), « Pour votre maison et votre quotidien » (liste des services actifs — belle avec 1 comme avec 10 : rangées éditoriales, pas de grille de cartes), « Personne n'entre chez vous sans être passé par nous » (5 étapes), « Comment ça marche » (3 étapes), garantie, section prestataires, pied de page (WhatsApp, zones couvertes, données personnelles). |
| `/services/intendance-de-maison` | Généré depuis `services.pageTexts` : titre, sous-titre, **les 3 formules côte à côte**, vérification, garantie, action « Trouver une personne de confiance ». |
| `/connexion` | Téléphone +221 → OTP (code affiché en mode démo) → redirection selon rôle. |
| `/v/[cardId]` | Page publique scannée depuis le QR d'une carte Dorwar : prénom, médaillon, service(s), **statut vérifié + actif en temps réel**, date de vérification, bouton WhatsApp. Rien d'autre. |
| `/vos-donnees` | Page « Vos données » (CDP) : quoi, pourquoi, qui y accède, contact. |

### Famille
`/demande/[slug]` (formulaire de besoin multi-étapes, généré par la config) · `/demandes` (mes demandes) · `/demandes/[id]` (profils correspondants triés par proximité : médaillon, prénom, âge, quartier, « à environ X km », expérience, langues, compétences, badge, note) · `/profils/[id]` (fiche complète : détail de la vérification au toucher du badge, avis, bouton « Demander une rencontre ») · `/placements/[id]` (statut, conditions convenues, fin de garantie, appel de suivi, laisser un avis, **Signaler un problème** bien visible).

### Prestataire
`/devenir-prestataire` : assistant pas-à-pas, peu de texte, grosses icônes + un mot (téléphone/OTP → prénom, genre, année de naissance, langues → service(s) et formules acceptées → quartier + rayon ou zones + « prêt(e) à s'installer » → tarifs souhaités → consentement → récap). Pensé pour une personne qui lit difficilement.
`/espace-prestataire` : statut du dossier étape par étape en langage simple (« L'équipe a vu ta carte d'identité ✓ ») · `/espace-prestataire/carte` (carte Dorwar : médaillon, prénom, QR, numéro de carte) · `/espace-prestataire/demandes` (rencontres, missions, avis reçus).

### Agent de terrain (l'écran le plus important — mobile, une main)
`/agent` : file des dossiers triée par priorité (dossiers presque finis d'abord, puis plus anciens), compteur d'étapes restantes, recherche. · `/agent/dossiers/[id]` : checklist des étapes de vérification (cocher, photo/document → stockage privé, notes, date et nom d'agent automatiques), gros boutons en barre d'action basse, **Valider le profil** (toutes étapes faites) ou **Refuser** avec motif. · `/agent/suivis` : placements en cours, appels de J+7 à passer (cocher + note), rencontres à coordonner.

### Admin (minimal)
`/admin` + sous-pages : utilisateurs, dossiers, placements, signalements (changement de statut), zones (ouvrir/fermer), liste d'attente, paramètres (durée de garantie, frais, numéro WhatsApp). Consultation du journal d'accès aux documents.

**Transversal** : bandeau « Version de démonstration » (layout racine), bouton « Parler à l'équipe Dorwar sur WhatsApp » (`wa.me`, numéro en configuration), états vides / chargement / erreur / confirmation rédigés pour chaque écran.

## 6. Design — deux directions

### Fondations communes (quel que soit le choix)

Texte de base 16 px min, boutons ≥ 48 px, contrastes AA vérifiés, icône toujours accompagnée d'un mot, une seule action principale par écran, rayons retenus (0 / 4 / 8 px + pilule pour les badges), ombres rares (un seul niveau), mise en page éditoriale asymétrique avec beaucoup d'air. Polices **auto-hébergées** (`next/font/local`, woff2 sous-ensemble latin + latin-ext). Interdits du brief respectés : pas de dégradés violets/bleus, pas de verre, pas d'emoji-icônes, pas de photos de stock, pas de tout-centré. Photos : médaillon d'initiales sur teinte stable par personne avec fin motif de lignes — le composant accepte une vraie photo plus tard sans changement d'interface.

### Direction A — « La porte ouverte » *(recommandée)*

**Idée** : la confiance comme un seuil qu'on franchit. Chaleur, matière, hospitalité — sénégalais par la terre et la lumière, pas par le folklore.

**Palette** (contrastes vérifiés) :
| Jeton | Code | Usage |
|---|---|---|
| `sable-50` | `#FAF6EE` | fond de page |
| `sable-100` | `#F2EADC` | fonds de section, cartes |
| `indigo-900` | `#273150` | titres, texte fort, pied de page (≈ 11:1 sur sable) |
| `gris-700` | `#5A554B` | texte secondaire (≈ 6,9:1) |
| `terre-600` | `#B4532E` | action principale, texte blanc (≈ 5:1) ; hover `#9C4526` |
| `baobab-600` | `#3F6B4A` | vérification, succès, sceau (blanc ≈ 6:1) |
| `ocre-500` | `#E8A33D` | **accent vif, rare** : pastilles, soulignés (texte indigo ≈ 5,9:1) |
| `ligne` | `#E4DAC8` | bordures, séparateurs |

**Typographie** : **Fraunces** (titres — serif à fort caractère, chaleureuse, licence OFL, variable donc un seul fichier) + **Atkinson Hyperlegible** (texte — dessinée par le Braille Institute pour maximiser la différenciation des lettres : un choix qui sert directement les personnes qui lisent difficilement ; excellente à 16 px sur petit écran, diacritiques français complets, libre).

**En-tête d'accueil** : composition asymétrique. À gauche, le titre en Fraunces sur deux lignes (« Chez Dorwar, la confiance se vérifie. »), le sous-titre, puis **le sélecteur de service comme objet principal** — une carte tactile « De quoi avez-vous besoin ? » listant les services actifs (avec un seul : une belle rangée Intendance de maison) et le bouton terre cuite « Trouver une personne de confiance » ; dessous, le lien sobre « Je propose mes services ». À droite (empilé dessous sur mobile), un dessin au trait fin indigo sur sable : une porte entrouverte d'où sort la lumière, chevauchée par le **sceau rond « Vérifié par Dorwar »** en vert baobab. En fond, un motif tissé géométrique très discret (SVG deux tons, faible contraste). Aucune photo, aucun métier représenté.

### Direction B — « Le sceau »

**Idée** : la vérification comme acte officiel réinventé avec élégance — le registre, le tampon, la carte. Plus graphique et institutionnel.

**Palette** :
| Jeton | Code | Usage |
|---|---|---|
| `papier` | `#F7F4EF` | fond |
| `indigo-nuit` | `#1C2440` | dominante : titres, boutons (blanc ≈ 15:1) |
| `sceau` | `#2E6B4F` | tampon « Vérifié », succès (blanc ≈ 6,3:1) |
| `terre-500` | `#C4603C` | secondaire chaleureux |
| `laterite` | `#C74424` | **accent vif, rare** (blanc ≈ 4,9:1) |

**Typographie** : **Bricolage Grotesque** (titres — grotesque contemporaine à forte personnalité, OFL) + **IBM Plex Sans** (texte — très lisible, dessinée pour l'univers du document) + **IBM Plex Mono** en micro-détail (numéros de carte Dorwar, dates de vérification).

**En-tête d'accueil** : le titre au-dessus d'une **carte Dorwar géante** légèrement inclinée — l'objet de marque : médaillon d'initiales, prénom fictif, QR, numéro en mono, tampon vert « VÉRIFIÉ » — posée sur un fond papier finement réglé comme un registre. Sélecteur de service et action principale sous la carte.

### Recommandation

**Direction A**, en lui empruntant le meilleur de B : le **sceau** devient le langage graphique du badge « Vérifié par Dorwar » et de la carte. Pourquoi A : pour des familles, la confiance passe par la chaleur humaine plus que par l'autorité administrative ; la palette terre/sable/indigo est sénégalaise sans folklore ; et Atkinson Hyperlegible sert l'objectif d'accessibilité mieux que tout. B reste documentée si tu préfères son caractère.

**Système par service** : chaque service a une teinte (`hue`) et une icône au trait (2 px) dans le registre ; l'intendance = terre cuite. Les suivants recevront leur teinte dans la même gamme — cohérent à dix services comme à un. Logotype : le mot « Dorwar » composé en police de titre + le sceau ; **aucune signification inventée au nom**.

### Performance

Budget : < 200 Ko de JS au premier chargement — RSC partout, kit UI maison, pas de lib de formulaire client, SVG inline, zéro bitmap sur l'accueil, polices ~80–120 Ko au total. Audit Lighthouse mobile (perf + accessibilité ≥ 90) à chaque jalon, pas seulement à la fin.

## 7. Contenus et i18n

- Les textes du brief §6 sont la base (titres, sections, garantie, prestataires) ; même voix pour tout ce qui manque : directe, chaleureuse, jamais creuse. Interdits appliqués : « en quelques clics », « solution innovante », « idéal », « révolutionnaire », superlatifs vides — et les mots dévalorisants (« bonne », « mbindaan », « dianké », « domestique », « servante ») n'apparaissent **nulle part** sur le site.
- Vocabulaire : « intendante » / « intendant » selon le genre (helper i18n), « Intendance de maison », « personnes de confiance », « ceux qui proposent leurs services ». Aucune annonce de services futurs, nulle part.
- Micro-états tous rédigés (vides, chargements, erreurs, confirmations) — ex. : « Pas encore d'intendant vérifié près de chez vous. Laissez votre numéro : on vous appelle dès que c'est le cas. »
- Wolof : `i18n/wo.ts`, uniquement des salutations et mots de boutons très répandus, chaque entrée marquée `// À FAIRE VALIDER PAR UN LOCUTEUR` ; rien d'inventé, validation par l'associée avant toute mise en avant.

## 8. Sécurité, rôles, données personnelles

- Contrôle serveur systématique (middleware + `requireRole` par action) ; tests dédiés (§10).
- Documents : stockage privé, lecture uniquement via `api/documents/[id]` (rôles agent/admin), **chaque accès journalisé** dans `access_logs`.
- OTP : haché, expiration 5 min, 5 essais max ; en démo, code affiché (ou fixé par `DEMO_OTP`).
- Consentement explicite à l'inscription (familles et prestataires), minimisation des données, page « Vos données ».
- En démo : aucune vraie pièce, aucune vraie photo ; les « documents » du seed sont des images neutres marquées « document fictif ».
- **`CONFORMITE.md`** (livré avec le prototype) listera ce qui doit être validé juridiquement avant tout lancement réel : déclaration à la CDP ; base légale et consentements ; durées de conservation et droits (accès, rectification, suppression) ; localisation des données (Neon hors Sénégal — transfert transfrontalier à encadrer, préférence région UE) ; encadrement de la formule 7 j/7 au regard du repos hebdomadaire du Code du travail sénégalais et validité de la « contrepartie convenue » ; statut juridique de l'activité (placement / intermédiation) ; conditions exactes de la garantie ; consentement des personnes de référence ; âge minimum (18 ans vérifié à l'inscription) ; texte d'engagement des familles.

## 9. Données de démo (seed)

- 1 service complet (Intendance de maison : textes, 3 formules, formulaire, 6 étapes de vérification, garantie, frais).
- Référentiel `areas` complet (§4), région de Dakar ouverte.
- 24 profils fictifs : ~2/3 de femmes, âges 19–55, quartiers variés de Dakar et banlieue, langues (wolof, français, pulaar, sérère, diola), expériences et compétences variées, formules panachées, tarifs dans des fourchettes plausibles à valider (§14-Q3) ; statuts étalés : vérifiés (majorité), en cours, refusé (1), suspendu (1).
- 4 familles, 5 demandes (dont 1 dans une zone fermée → entrée en `waitlist`), 4 placements aux statuts étalés (rencontre prévue, essai, confirmé, terminé avec avis des deux côtés), 1 incident.
- Comptes de démo documentés dans le README : famille `+221 77 000 00 01`, prestataire `…02`, agent `…03`, admin `…04`, OTP `123456`.
- Prénoms sénégalais plausibles, noms réduits à l'initiale, aucun homonyme gênant ; tout marqué fictif.

## 10. Qualité

- ESLint + Prettier + `tsc --noEmit` ; script unique `npm run check` (lint + types + tests).
- Vitest sur la logique pure : compilation FieldSpec → Zod (y compris branches `showIf`), gardes RBAC (chaque rôle contre chaque espace), arrondi des distances, machine à états des placements, règle « toutes les étapes requises faites → profil validable », écriture du journal d'accès à chaque lecture de document.
- Commits réguliers et lisibles, au minimum un par jalon (§12).

## 11. Déploiement

- **Dockerfile** multi-étapes : deps → build Next `standalone` → image finale `node:22-alpine`, utilisateur non root, `HEALTHCHECK` sur `/api/health`.
- **docker-compose.yml** : service `app` + **Caddy** (HTTPS automatique, `Caddyfile` piloté par la variable de domaine), volumes `uploads` (documents privés) et `caddy_data`.
- **Migrations** : appliquées au démarrage par un entrypoint idempotent (`npm run db:migrate`), et disponibles en commande documentée ; seed par `docker compose exec app npm run db:seed`.
- **`.env.example` documenté** : `DATABASE_URL` (Neon, `sslmode=require`), `SITE_DOMAIN`, `SESSION_SECRET`, `WHATSAPP_NUMBER`, `DEMO_MODE`, `DEMO_OTP`, `DEFAULT_GUARANTEE_DAYS`, `DEFAULT_PLACEMENT_FEE_FCFA`, `UPLOADS_DIR` (les deux valeurs « défaut » n'alimentent que le seed ; ensuite c'est l'admin qui fait foi).
- **README** : déploiement sur VPS vierge pas à pas — prérequis, création du projet Neon + `CREATE EXTENSION postgis`, DNS, `.env`, `docker compose up -d`, migrations/seed, comptes de démo, mise à jour, sauvegarde du volume.

## 12. Ordre de réalisation (jalons)

1. **Socle** : projet Next + TS strict + thème Tailwind complet, schéma Drizzle + migrations + PostGIS, seed zones + service, auth OTP + sessions + rôles, layouts + bandeau démo, kit UI de base.
2. **Vitrine** : accueil, page service, connexion, pied de page + WhatsApp, page `/v/[cardId]`.
3. **Parcours famille** : moteur de formulaire + formulaire intendance, matching géo, liste de profils, fiche profil + badge détaillé, demande de rencontre, suivi de placement, avis, signalement, waitlist.
4. **Espace agent** : file de dossiers, fiche dossier (étapes, documents, notes), validation/refus, suivis et appels.
5. **Parcours prestataire** : assistant d'inscription, espace (étapes en langage simple), carte Dorwar + QR, demandes/missions/avis.
6. **Admin** : listes, zones, paramètres, incidents, waitlist, journal d'accès.
7. **Finitions** : micro-états, accessibilité, audit Lighthouse, tests, manifest PWA (+ service worker léger si trivial).
8. **Livraison** : Docker + Caddy + README + CONFORMITE.md + récapitulatif final (ce qui marche / ce qui est simulé / ce qui manque avant un vrai lancement).

## 13. Ce qui restera simulé (rappel honnête pour la démo)

Paiements (mention Wave / Orange Money sans traitement), SMS (OTP affiché), photos (médaillons), documents d'identité (images fictives), rencontre coordonnée « hors ligne » par l'équipe (l'agent saisit la date), appel de suivi (coché par l'agent).

## 14. Questions ouvertes

| # | Question | Proposition par défaut |
|---|---|---|
| Q1 **[bloquant]** | Durée de garantie ? | Longue durée : 30 jours (remplacement). Mission ponctuelle : remplacement le jour même si possible, sinon remboursement des frais. Configurable par formule. |
| Q2 | Frais de placement : montants et affichage en démo ? Qui paie (la famille seule ?) | Afficher « Frais de dossier : X FCFA » sur le récapitulatif de demande uniquement, montant fictif en config. |
| Q3 | Fourchettes de rémunération réalistes pour le seed (à valider par ton associée) ? | 45 000–110 000 FCFA/mois ; 7 500–20 000 FCFA/jour. |
| Q4 | Quartiers détaillés seulement pour la région de Dakar (ailleurs : niveau commune) ? | Oui ; l'admin peut ajouter un quartier à la main. |
| Q5 | Un même numéro peut-il être à la fois famille et prestataire ? | Hors démo : un rôle par numéro. |
| Q6 | Affichage public des profils : prénom + initiale ? âge exact ou tranche ? | Prénom + initiale ; âge exact. |
| Q7 | Note vocale dans les remarques ? | V1 texte seul ; type `voice_note` réservé dans le moteur de formulaire. |
| Q8 **[bloquant]** | Direction de design : A « La porte ouverte » (recommandée) ou B « Le sceau » ? | A, avec le sceau de B comme langage du badge. |
| Q9 | Numéro WhatsApp et domaine de démo pour le `.env` ? | Placeholders documentés en attendant. |
| Q10 | Région d'hébergement Neon (données hors Sénégal) ? | UE (Francfort) ; point traité dans CONFORMITE.md. |
