# BRIEF — Dorwar, la confiance avant la mise en relation

> À lire en entier avant d'écrire la moindre ligne de code.
> Première étape obligatoire : propose-moi un plan (architecture, modèle de données, pages, choix de design) dans un fichier `PLAN.md`, puis **attends ma validation** avant de coder.

---

## 1. Le projet en une phrase

Dorwar est une plateforme sénégalaise qui présente aux familles des personnes **vérifiées sur le terrain** pour les services de la maison et du quotidien. Dorwar ne vend pas une mise en relation : Dorwar vend la **confiance**.

Le premier service ouvert est l'intendance de maison, mais **Dorwar n'est pas un site de bonnes**. C'est une marque de confiance qui ouvrira d'autres services, un par un. Le site ne l'annonce jamais explicitement ; il le laisse sentir par son positionnement, ses textes, ses visuels et son architecture (voir section 6).

## 2. Le contexte (Sénégal, Dakar)

- Trouver quelqu'un de confiance pour tenir sa maison est un vrai calvaire : vols, départs sans prévenir, conflits. Les familles ne savent plus à qui faire confiance. Les recommandations de bouche-à-oreille et les groupes Facebook ne garantissent rien.
- Ce métier est aujourd'hui désigné par des mots dévalorisants (« bonne », « mbindaan », « dianké »), et les personnes qui l'exercent manquent de protection : salaires non respectés, familles abusives, aucun recours. Dorwar veut les présenter autrement, avec respect et élégance.
- Beaucoup vivent chez la famille (logé(e)s), 6 ou 7 jours sur 7, et rentrent chez elles lors des grandes fêtes ; d'autres rentrent chaque soir. Selon les maisons, c'est différent.
- Tout le monde a un smartphone Android, souvent d'entrée ou milieu de gamme, avec une connexion parfois lente et des données mobiles qui coûtent cher.
- La vie quotidienne passe par **WhatsApp** (messages écrits et **vocaux**) et le paiement mobile (**Wave**, **Orange Money**).
- Langues : le français pour l'écrit, le **wolof** à l'oral au quotidien. Une partie des intendantes et intendants lit difficilement.
- L'équipe : un développeur au Canada (moi) et une associée au Sénégal, très présente sur le terrain, avec un fort réseau chez les artisans et le personnel de maison. **C'est elle qui vérifie chaque personne.** Le cœur de Dorwar, c'est cette opération de terrain ; l'application la sert.

## 3. Références et concurrence

- **Références fonctionnelles uniquement** : AlloVoisins et Yoojo (France), TaskRabbit (États-Unis). On s'inspire de leurs **fonctionnalités** (profils, demandes, avis), **jamais** de leur design, de leurs textes, de leur logo ou de leur marque. Rien ne doit rappeler ces sites.
- Concurrence locale : bureaux de placement informels, groupes Facebook, petites annonces, bouche-à-oreille. Notre différence : **la vérification visible et la garantie**.
- Ne pas inventer de signification au nom « Dorwar ».

## 4. Périmètre de cette version : prototype de démonstration

Objectif : une démo crédible à montrer à des familles et à des intendantes et intendants, pour tester l'idée. **Pas** un produit en production.

**Inclus**
1. Un seul service actif : **Intendance de maison** (ménage, cuisine, entretien de la maison), assuré par des **intendantes et intendants**, avec trois formules (voir section 7) : longue durée logé(e), longue durée non logé(e), et missions ponctuelles d'un ou quelques jours.
2. Une architecture **multi-services** : chaque service (nom, icône, formulaire de besoin, étapes de vérification, garantie, frais) est une donnée configurable. Ajouter un service doit se faire par configuration, sans toucher aux pages. Les prochains seront probablement les commissionnaires (quelqu'un qui agit à votre place : faire la queue à la mairie, retirer un document, faire des achats), mais **ils n'apparaissent nulle part sur le site**.
3. Le parcours famille complet (voir section 7).
4. Le parcours prestataire (celle ou celui qui propose ses services) : inscription et suivi de sa vérification.
5. L'espace **agent de terrain** (mon associée) pour vérifier les dossiers. C'est l'écran le plus important de l'outil.
6. Un espace admin minimal.

**Exclus de cette version**
- Paiements réels (en démo, indiquer simplement que le paiement se fait par Wave ou Orange Money, sans traitement réel).
- Envoi réel de SMS (OTP simulé, code affiché en mode démo).
- L'ouverture d'autres services (tout doit pourtant être prêt pour en ajouter un).
- Toute mention de services « à venir » ou « bientôt disponibles ».
- Application mobile native (site web mobile d'abord, installable en PWA si c'est simple).

**Données** : uniquement des données **fictives** (noms, quartiers, profils). Aucune vraie pièce d'identité, aucune vraie photo de personne. Un bandeau discret « Version de démonstration » sur toutes les pages.

## 5. La promesse de confiance (à rendre visible partout)

Chaque profil affiche un **badge « Vérifié par Dorwar »** qui, au toucher, détaille ce qui a été vérifié et quand :
1. Identité (carte nationale d'identité vue et contrôlée).
2. Photo récente prise par l'agent.
3. Adresse visitée.
4. Deux personnes de référence contactées.
5. Entretien en personne.

La carte d'identité n'est **jamais** affichée publiquement. Seul le résultat (« vérifiée le 12 mars ») l'est.

Autres piliers de confiance :
- **Garantie de remplacement** : si le placement ne convient pas dans les `[X à définir]` jours, Dorwar propose une autre personne. Pour une mission ponctuelle, une garantie adaptée (remplacement ou remboursement). Durées et conditions en variables de configuration, par formule.
- **Carte Dorwar** : chaque intendante et intendant vérifié a une carte numérique avec photo et QR code. La famille scanne le code et voit, sur le site, que la personne est bien vérifiée et active.
- **Suivi** : un appel de l'équipe après la première semaine (statut visible dans le placement).
- **Avis** après chaque placement, des deux côtés.
- **Signaler un problème** : bouton visible, formulaire simple, suivi par l'admin.
- **Confiance dans les deux sens** : les familles aussi sont identifiées (numéro vérifié, quartier) et s'engagent sur le salaire et les conditions convenus. Dorwar protège aussi les intendantes et intendants.
- **Contact humain** : bouton « Parler à l'équipe Dorwar sur WhatsApp » (lien `wa.me`, numéro en configuration).

## 6. Positionnement et textes (français, ton direct et chaleureux, jamais creux)

**Règle de positionnement**
- L'accueil vend **la confiance et la marque Dorwar**, pas un métier.
- **Vocabulaire** : on dit « intendante » pour une femme, « intendant » pour un homme, et « Intendance de maison » pour le service. Les mots « bonne », « mbindaan », « dianké », « domestique » et « servante » n'apparaissent **nulle part** sur le site. Ce métier est présenté avec respect et élégance : Dorwar veut changer son image au Sénégal, comme un titre qu'on est fier de porter.
- Le métier n'apparaît qu'à partir du choix du service et sur la page du service.
- Les textes généraux parlent de « personnes de confiance », « chez vous », « votre quotidien », « ceux qui proposent leurs services », jamais uniquement de ménage.
- Aucune phrase ne promet ou n'annonce de futurs services.

Interdits : « en quelques clics », « solution innovante », « idéal », « révolutionnaire », superlatifs vides.
Les textes ci-dessous sont une base, à garder ou améliorer avec la même voix.

**Accueil, en-tête**
- Titre : « Chez Dorwar, la confiance se vérifie. »
- Sous-titre : « On ne vous donne pas un numéro. On vous présente une personne qu'on a rencontrée, vérifiée et suivie. »
- Action principale : un sélecteur « De quoi avez-vous besoin ? » qui liste les services actifs, puis « Trouver une personne de confiance ».
- Action secondaire : « Je propose mes services »

**Section des services**
- Titre : « Pour votre maison et votre quotidien. »
- Elle n'affiche que les services actifs. Elle doit paraître complète et voulue avec un seul service, et rester belle avec dix (par exemple une liste ou un sélecteur plutôt qu'une grille de cartes qui paraîtrait vide).

**Page du service « Intendance de maison »**
- Titre : « Intendance de maison. La confiance, chaque jour. »
- Sous-titre : « Une intendante ou un intendant vérifié, à demeure ou pour quelques jours. Ménage, cuisine, entretien, et une équipe qui reste là après. »
- Les trois formules présentées clairement, côte à côte : longue durée logé(e), longue durée non logé(e), mission ponctuelle.

**Section « Comment on vérifie »**
- Titre : « Personne n'entre chez vous sans être passé par nous. »
- Les 5 étapes de vérification, chacune avec une icône simple et une phrase.

**Section « Comment ça marche »** (3 étapes)
1. « Dites-nous ce qu'il vous faut » (à demeure ou pour quelques jours, logé(e) ou non, quartier, rémunération proposée).
2. « On vous propose des profils vérifiés. »
3. « Vous rencontrez, vous choisissez. On reste là après. »

**Section « Notre garantie »**
- Titre : « Ça ne colle pas ? On vous propose quelqu'un d'autre. »

**Section « Pour celles et ceux qui proposent leurs services »**
- Titre : « Être vérifié par Dorwar, c'est être pris au sérieux. »
- Texte : des familles identifiées, des conditions convenues par écrit, une équipe à qui parler. « Un jour, une semaine ou toute l'année : c'est vous qui choisissez. » Les missions ponctuelles sont ouvertes à toute personne vérifiée qui veut un revenu d'appoint.

**Pied de page** : contact WhatsApp, zones couvertes, mentions sur les données personnelles.

**Wolof** : quelques mots clés et salutations peuvent apparaître (par ex. sur les boutons d'accueil). Mets-les dans un fichier de traduction séparé, marqués `// À FAIRE VALIDER PAR UN LOCUTEUR`. N'invente rien que tu n'es pas sûr de connaître.

## 7. Parcours et pages

**Famille**
1. Accueil, puis choix du service.
2. Connexion par numéro de téléphone (+221) et code OTP (simulé en démo). Pas de mot de passe.
3. Formulaire de besoin propre au service choisi, défini dans la configuration du service. Pour l'intendance de maison :
   - **Formule** : longue durée logé(e) (6 jours sur 7 ou 7 jours sur 7), longue durée non logé(e) (rentre chez soi chaque soir), ou mission ponctuelle.
   - **Longue durée** : type de poste (ménage, cuisine, polyvalent), jour(s) de repos, congés lors des grandes fêtes, horaires, quartier, salaire mensuel proposé en FCFA, date de début.
   - **Mission ponctuelle** : date(s), nombre de jours, tâches (ménage, cuisine, préparation d'un événement…), quartier, tarif à la journée en FCFA.
   - Remarques (texte, ou note vocale si c'est simple à faire, sinon plus tard).
   - Pour la formule 7 jours sur 7, le formulaire demande la contrepartie convenue (repos compensé ou rémunération supplémentaire), écrite dans les conditions. Le point est à valider juridiquement (voir CONFORMITE.md).
4. Liste de profils vérifiés correspondants, triés par proximité (voir « Recherche par lieu » ci-dessous) : photo (emplacement stylisé en démo), prénom, âge, quartier, distance approximative, expérience, langues parlées, compétences, badge de vérification, note moyenne.
5. Fiche profil détaillée, avec le détail de la vérification et les avis.
6. Demande de rencontre, puis suivi du placement : statut (rencontre prévue, en essai, confirmé), date de fin de garantie, appel de suivi, avis, signalement.

**Prestataire**
1. Inscription très simple, en choisissant le ou les services proposés et les formules acceptées (longue durée logé(e), non logé(e), missions ponctuelles) : peu de texte, grosses icônes, guidée pas à pas.
2. Sa carte Dorwar numérique (photo, QR code), une fois vérifié(e).
3. Suivi de son dossier : chaque étape de vérification avec son statut, en langage simple.
4. Ses demandes de rencontre, ses missions et ses avis.

**Agent de terrain (le plus important)**
1. Liste des dossiers à traiter, triés par priorité.
2. Fiche dossier : cocher chaque étape de vérification, ajouter photos et documents (stockage privé), notes, date, nom de l'agent.
3. Valider ou refuser un profil, avec motif.
4. Suivi des placements et des appels à faire.
5. Pensé pour être utilisé **sur téléphone, sur le terrain**, avec une main.

**Recherche par lieu**
- Deux façons de chercher, comme sur les grandes plateformes de services entre particuliers :
  1. **Autour de moi** : la famille partage sa position (ou choisit son quartier), puis règle un rayon (par exemple 2, 5, 10 ou 20 km). Les profils sont triés du plus proche au plus éloigné.
  2. **Par zone** : région, puis département, puis commune, puis quartier. Exemple : une famille de Dagana (région de Saint-Louis) cherche une intendante pour une mission ponctuelle à Dagana.
- Chaque intendante ou intendant indique son lieu de résidence et son **rayon d'intervention**, ou les zones où il ou elle accepte de travailler. Pour une formule logée, la distance compte moins : prévoir l'option « prêt(e) à s'installer dans une autre ville ».
- **Confidentialité** : jamais d'adresse exacte ni de position précise affichée. Seulement le quartier et une distance arrondie (« à environ 3 km »).
- **Pilote à Dakar** : seule la région de Dakar est ouverte au démarrage, mais tout le pays est déjà dans les données. Ouvrir une zone se fait dans l'admin, sans code. Si une famille cherche dans une zone sans profil vérifié, afficher un message honnête (« Pas encore d'intendant vérifié près de chez vous ») et proposer de laisser son numéro pour être prévenue.
- Technique : extension **PostGIS** sur Neon pour les calculs de distance, et un référentiel administratif du Sénégal (régions, départements, communes) importé dans la table des zones.

**Admin** : utilisateurs, dossiers, placements, signalements, zones ouvertes, paramètres (durée de garantie, frais de placement, numéro WhatsApp).

## 8. Modèle de données (à affiner dans PLAN.md)

- `users` : téléphone, rôle (famille, prestataire, agent, admin). Dans le code, le terme est toujours « prestataire », jamais « bonne » ni « travailleuse », pour rester valable pour tous les services, statut, date de création.
- `services` : nom, slug, icône, actif ou non, ordre d'affichage, textes de la page, schéma du formulaire de besoin, étapes de vérification exigées, durée de garantie, frais. C'est la table qui permet d'ouvrir un nouveau service sans toucher au code des pages.
- `worker_services` : les services qu'une personne propose, chacun avec son propre statut de vérification.
- `worker_profiles` : prénom, genre (pour afficher « intendante » ou « intendant »), âge, quartier, compétences, langues, expérience, formules acceptées, disponibilité, salaire mensuel souhaité, tarif journalier souhaité, statut de vérification, note moyenne, identifiant de carte Dorwar (pour le QR code).
- `verification_steps` : profil, type (identité, photo, adresse, référence 1, référence 2, entretien), statut, agent, date, notes.
- `documents` : fichiers privés liés à une étape, jamais publics, accès agent et admin uniquement.
- `family_profiles` : zone, position approximative, téléphone vérifié, engagements acceptés.
- `requests` : besoins des familles, liés à un service, avec les réponses du formulaire propre à ce service.
- `placements` : famille, prestataire, service, formule (longue durée logé(e), non logé(e), ponctuelle), statut, dates, jours de repos, rémunération convenue, fin de garantie, suivi.
- `reviews` et `incidents`.
- `areas` : hiérarchie région → département → commune → quartier, avec coordonnées (point central, contour si disponible) et un indicateur « zone ouverte ».
- Positions : les profils et les demandes ont une position géographique (PostGIS) et un lien vers leur zone ; les profils ont un rayon d'intervention et des zones acceptées.
- `waitlist` : les numéros laissés par les familles dans les zones pas encore ouvertes.
- `settings` : paramètres modifiables par l'admin.
- Un journal d'accès aux documents sensibles (qui a consulté quoi, quand).

## 9. Design : rigoureux, moderne, unique, et pas « généré par IA »

**À éviter absolument** (ce sont les signes d'un site généré à la va-vite) :
- Dégradés violets ou bleus, effets de verre, néons.
- Héro centré avec deux boutons puis trois cartes arrondies identiques.
- Icônes en emoji, illustrations génériques en 3D, photos de stock.
- Polices par défaut (Inter, Poppins, Roboto) sans intention.
- Ombres partout, coins très arrondis partout, tout centré.
- Composants de bibliothèque laissés avec leur style par défaut : si tu utilises shadcn/ui ou équivalent, refais complètement le thème.

**La direction**
- **Le visuel principal porte la marque, pas un métier** : pas d'image de ménage ni de métier en en-tête de l'accueil. Il évoque la confiance et le quotidien (le badge de vérification, une porte qu'on ouvre, une poignée de main, la vie d'un quartier).
- **Un système d'icônes et de couleurs par service**, pensé dès le départ pour en accueillir beaucoup d'autres de façon cohérente.
- **Identité sénégalaise sobre**, pas folklorique : une palette chaude et terreuse (sable, terre cuite, indigo profond, vert baobab, un accent vif utilisé rarement). Propose 2 palettes dans PLAN.md avec leurs codes et explique ton choix.
- **Typographie** : une police de titre avec du caractère et une police de texte très lisible sur petit écran. Polices **auto-hébergées** (pas de chargement externe). Justifie ton choix.
- **Mise en page éditoriale**, asymétrique quand ça sert, beaucoup d'air, une hiérarchie claire. Une seule action principale par écran.
- **Photos** : en démo, des emplacements stylisés et élégants (initiales, motif, couleur de la palette), prévus pour recevoir plus tard de vraies photos prises par l'agent avec l'accord des personnes.
- **Micro-détails soignés** : états vides, chargements, erreurs, confirmations, tous rédigés et dessinés.

**Simplicité (non négociable)**
- Trois actions principales pour une famille : décrire son besoin, voir des profils, demander une rencontre.
- Boutons d'au moins 48 px de haut, texte de base d'au moins 16 px, contrastes conformes WCAG AA.
- Icônes toujours accompagnées d'un mot.
- Test mental : une personne qui lit difficilement doit pouvoir s'inscrire sans aide.

**Performance (connexions lentes)**
- Mobile d'abord, puis tablette et ordinateur.
- Première page légère : vise moins de 200 Ko de JavaScript au premier chargement, images optimisées et redimensionnées.
- Objectif Lighthouse mobile : 90 ou plus en performance et en accessibilité.

## 10. Technique

- **Framework** : Next.js (App Router) avec TypeScript strict.
- **Style** : Tailwind CSS avec un thème entièrement personnalisé (couleurs, polices, espacements, rayons).
- **Base de données** : **Neon** (PostgreSQL serverless). ORM : Drizzle, migrations versionnées avec drizzle-kit. Connexion par `DATABASE_URL` avec `sslmode=require`.
- **Authentification** : par numéro de téléphone et OTP. En démo, OTP simulé (code affiché ou fixe en variable d'environnement). Prévoir l'interface pour brancher plus tard un fournisseur de SMS.
- **Rôles et accès** : contrôle côté serveur sur chaque route et chaque action. Une famille ne voit jamais les documents ; un prestataire ne voit que son dossier.
- **Fichiers** : stockage privé sur un volume Docker en démo, derrière une interface prête pour un stockage compatible S3 plus tard. Aucun document servi publiquement.
- **Validation** des formulaires côté serveur (Zod).
- **Traductions** : français par défaut, structure prête pour le wolof.
- **Données de démo** : script de seed avec 20 à 30 profils fictifs, quelques familles, demandes, placements et avis, dans plusieurs quartiers de Dakar.
- **Qualité** : lint, formatage, quelques tests sur les règles d'accès et la vérification. Commits réguliers et lisibles.

## 11. Déploiement

- **Dockerfile** multi-étapes (build Next.js en sortie `standalone`, image finale légère, utilisateur non root, healthcheck).
- **docker-compose.yml** : le service applicatif + un reverse proxy **Caddy** pour le HTTPS automatique sur mon domaine.
- Variables dans un fichier `.env.example` documenté : `DATABASE_URL`, domaine, numéro WhatsApp, mode démo, OTP de démo, durée de garantie, frais de placement.
- Migrations appliquées au démarrage ou par une commande documentée.
- Un `README.md` qui permet de déployer sur un VPS vierge en suivant les étapes, sans rien deviner.

## 12. Données personnelles

- Au Sénégal, la collecte de données personnelles est encadrée par la Commission de protection des données personnelles (CDP). Prévois : consentement explicite à l'inscription, minimum de données, documents d'identité jamais publics, journal des accès, page « Vos données ».
- Ajoute un fichier `CONFORMITE.md` listant ce qui reste à valider juridiquement avant tout lancement réel.

## 13. Ce que j'attends, dans l'ordre

1. `PLAN.md` : architecture, modèle de données, liste des pages, 2 directions de design (palette, polices, une description de l'en-tête d'accueil), la façon dont on ajoute un nouveau service par configuration, questions ouvertes. **Puis tu t'arrêtes et tu attends ma validation.**
2. Après validation : le prototype, en commençant par l'accueil et le parcours famille, puis l'espace agent, puis le reste.
3. Le déploiement Docker et le README.
4. Un court récapitulatif final : ce qui marche, ce qui est simulé, ce qui manque avant un vrai lancement.

Si un point de ce brief est ambigu, pose la question dans PLAN.md plutôt que de deviner.
