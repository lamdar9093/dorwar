# Conformité : ce qui reste à valider avant un lancement réel

Ce prototype est une **démonstration** : données fictives, aucun SMS envoyé, aucun paiement traité. Avant d'y inscrire de vraies personnes, les points ci-dessous doivent être validés par un juriste au fait du droit sénégalais (protection des données, droit du travail, activité d'intermédiation). Ce document ne constitue pas un avis juridique : c'est une liste de questions à trancher.

Le cadre principal est la **loi n° 2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel** et la **Commission de protection des données personnelles (CDP)**. À vérifier : les textes d'application en vigueur et toute réforme récente.

## 1. Données personnelles

### Formalités auprès de la CDP

- [ ] Déterminer la formalité requise pour chaque traitement (déclaration ou demande d'autorisation). Les données d'identité, les références et les notes d'entretien concernent des personnes en recherche d'emploi : vérifier si elles relèvent d'un régime renforcé.
- [ ] Désigner le responsable du traitement (structure juridique de Dorwar) et, si nécessaire, un correspondant.
- [ ] Tenir un registre des traitements : connexion, demandes des familles, vérification des prestataires, documents, journal d'accès, liste d'attente, avis, signalements.

### Base légale et consentement

- [ ] Valider les formulations de consentement :
  - à la création d'un compte (case « J'accepte que Dorwar conserve mon numéro… ») ;
  - à l'inscription d'un prestataire (écran « Vos informations », en mots simples, avec lecture à voix haute) ;
  - pour la **photo** prise par l'agent et sa publication éventuelle (prévoir un consentement écrit distinct ; aujourd'hui les profils n'affichent que des médaillons).
- [ ] Prévoir le consentement des **personnes de référence** contactées par l'agent (leur nom et leur numéro sont notés dans des notes privées), ou une autre base légale.
- [ ] Vérifier que le consentement d'une personne qui lit difficilement est valablement recueilli (lecture à voix haute, explication par l'agent, trace écrite).

### Profils visibles sans compte

Depuis l'ajout de la vitrine publique, un profil vérifié est visible par **tout visiteur du site**, et non plus seulement par les familles connectées. L'écran d'accord de l'inscription l'indique désormais, en mots simples et à voix haute.

- [ ] Valider que ce consentement suffit. Sinon, prévoir une case séparée (« J'accepte que mon profil soit visible sur le site »), qui laisse la personne visible des seules familles inscrites si elle refuse. Avant un vrai lancement, prévoir aussi une option pour sortir de la vitrine.
- [ ] Faire confirmer la liste des informations publiques :
  - visibles sans compte : prénom et initiale, quartier, langues, savoir-faire, formules, date de chaque vérification, présentation rédigée par l'équipe, avis des familles ;
  - réservées aux familles connectées : âge, rémunération souhaitée, disponibilité ;
  - jamais publiques : le **numéro de carte Dorwar**, qui permettrait de fabriquer une fausse carte « active ».
- [ ] Les avis sont publiés signés « Une famille » et le quartier, sans le nom. La personne concernée voit dans son propre espace quelle famille l'a écrit. Vérifier que l'information donnée aux familles au moment d'écrire un avis est suffisante.
- [ ] La liste des profils et les fiches ne sont jamais proposées aux moteurs de recherche (`noindex`), même hors démonstration. Ce choix est à garder tant que les personnes n'ont pas accepté autre chose.

### Minimisation et conservation

- [ ] Fixer les **durées de conservation** : pièces d'identité et photos de vérification, notes d'entretien, comptes inactifs, demandes, journal des accès, liste d'attente. Rien n'est encore purgé automatiquement.
- [ ] Décider s'il faut conserver une copie de la pièce d'identité ou seulement le résultat du contrôle (« vue le 3 mars, valide »). Ne garder que le résultat réduirait fortement le risque.
- [ ] Confirmer que la position géographique est minimale : position partagée arrondie à environ 100 m, positions des prestataires ramenées au centre du quartier et décalées.

### Droits des personnes

- [ ] Mettre en place la procédure d'accès, de rectification, d'opposition et de suppression (aujourd'hui : une demande par WhatsApp, traitée à la main).
- [ ] Compléter la page « Vos données » avec les mentions légales définitives : identité du responsable, finalités, durées, destinataires, transferts, contact, droit de saisir la CDP.

### Hébergement et transferts hors du Sénégal

- [ ] La base est hébergée chez **Neon** (région de l'Union européenne conseillée) et l'application sur un VPS dont le pays est à choisir : c'est un **transfert de données hors du Sénégal**. Vérifier les conditions posées par la loi et la CDP (pays offrant une protection suffisante, autorisation, garanties contractuelles).
- [ ] Étudier la possibilité d'un hébergement au Sénégal pour les documents d'identité.

### Sécurité

- [ ] Documents : stockage chiffré au repos (volume chiffré ou stockage compatible S3 avec chiffrement), sauvegardes chiffrées, procédure de restauration testée.
- [ ] Revue des accès de l'équipe (aujourd'hui : tout agent voit tous les dossiers) et du **journal d'accès** (qui le consulte, combien de temps il est conservé).
- [ ] Procédure de notification en cas de violation de données.
- [ ] Avant la production : test d'intrusion, limitation du débit sur la connexion par code, envoi réel des SMS par un fournisseur sérieux.

## 2. Droit du travail et activité de Dorwar

- [ ] **Statut de l'activité** : présentation de personnes, placement ou intermédiation ? Selon la qualification, des agréments ou des obligations spécifiques peuvent s'appliquer aux bureaux de placement.
- [ ] **Employeur** : confirmer que la famille est l'employeur (contrat, déclaration, cotisations sociales) et ce que Dorwar peut ou doit rappeler aux familles.
- [ ] **Formule 7 jours sur 7** : vérifier sa compatibilité avec les règles sur le repos hebdomadaire des employés de maison (convention collective ou textes applicables), et la validité de la « contrepartie convenue » (repos compensé ou rémunération supplémentaire) que le formulaire demande. Selon la réponse, la formule pourrait devoir être retirée ou encadrée autrement.
- [ ] **Salaire minimum** applicable aux employés de maison : l'afficher dans le formulaire et refuser une proposition inférieure (aujourd'hui, seul un plancher technique de 20 000 FCFA est appliqué).
- [ ] **Âge minimum** : le formulaire exige 18 ans (année de naissance déclarée, à confirmer par la pièce d'identité lors de la vérification).
- [ ] **Conditions écrites** : faire relire le modèle de conditions rédigé par l'agent et acceptées des deux côtés (horaires, repos, congés des grandes fêtes, rémunération). Décider s'il doit devenir un contrat type.
- [ ] **Missions ponctuelles** : statut des personnes qui font quelques jours pour un revenu d'appoint (travail occasionnel, déclarations).

## 3. Engagements commerciaux

- [ ] **Garantie de remplacement** : conditions exactes (durée par formule, nombre de remplacements, cas exclus, remboursement pour les missions ponctuelles). Aujourd'hui : 30 jours pour la longue durée, remplacement ou remboursement des frais pour une mission ponctuelle, valeurs modifiables dans l'admin.
- [ ] **Frais de dossier** : montants, moment du paiement, conditions de remboursement, facturation. Les montants actuels sont fictifs.
- [ ] **Paiement par Wave ou Orange Money** : contrat marchand, traçabilité, obligations comptables.
- [ ] **Conditions générales d'utilisation** pour les familles et pour les prestataires, dont les **engagements des familles** (salaire versé à la date convenue, repos respectés, respect de la personne) et les suites d'un manquement.
- [ ] **Avis** : règles de publication et de modération, droit de réponse, retrait d'un avis.
- [ ] **Signalements** : délais de traitement, procédure en cas de faits graves (vol, violence) et coordination avec les autorités.
- [ ] **Badge « Vérifié par Dorwar »** : formuler précisément ce qu'il garantit et ce qu'il ne garantit pas, pour éviter de laisser croire à une garantie de comportement.

## 4. Contenus

- [ ] Faire relire par un locuteur chaque mot **wolof** (`src/i18n/wo.ts`, entrées marquées `// À FAIRE VALIDER PAR UN LOCUTEUR`).
- [ ] Remplacer le référentiel des zones (Wikidata, points approchés) par le **référentiel officiel** (ANSD, ANAT) et vérifier les quartiers de Dakar.
- [ ] Remplacer les médaillons par de vraies photos uniquement avec le consentement écrit des personnes.
