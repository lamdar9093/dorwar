// Dictionnaire français (langue par défaut). Le wolof complète ce dictionnaire dans wo.ts.
// Les écrans internes (agent de terrain, admin) sont rédigés directement en français dans leurs pages.

export const fr = {
  site: {
    demoBanner: "Version de démonstration — les personnes et les profils présentés sont fictifs.",
    skipToContent: "Aller au contenu",
    login: "Connexion",
    mySpace: "Mon espace",
    logout: "Se déconnecter",
    homeLink: "Dorwar, retour à l'accueil",
  },
  home: {
    welcome: "Bienvenue chez Dorwar",
    title: "Chez Dorwar, la confiance se vérifie.",
    subtitle:
      "On ne vous donne pas un numéro. On vous présente une personne qu'on a rencontrée, vérifiée et suivie.",
    selectorLegend: "De quoi avez-vous besoin ?",
    cta: "Trouver une personne de confiance",
    ctaHint: "Connexion par numéro de téléphone, sans mot de passe.",
    secondary: "Je propose mes services",
    vitrine: {
      eyebrow: "Vérifiées sur le terrain",
      title: "Des personnes vérifiées, une par une.",
      intro:
        "Parcourez les profils sans créer de compte. Pour rencontrer quelqu'un, dites-nous ce qu'il vous faut.",
      rowLabel: "Profils vérifiés récemment",
      seeAll: "Voir les {n} profils vérifiés",
      byService: "Chercher par service",
      byArea: "Chercher par quartier",
    },
    people: {
      title: "Les personnes vérifiées",
      intro:
        "Chaque personne ici a été rencontrée chez elle par notre équipe : identité, adresse, références et entretien. Parcourez librement ; pour rencontrer quelqu'un, dites-nous ce qu'il vous faut.",
      allServices: "Tous",
      service: "Service",
      area: "Votre quartier",
      allAreas: "Tous les quartiers",
      formula: "Formule",
      allFormulas: "Toutes",
      submit: "Afficher",
      none: "Personne de vérifié pour ces critères, pour l'instant.",
      noneText:
        "Nous préférons vous le dire plutôt que de vous présenter quelqu'un que nous n'avons pas vérifié. Décrivez votre besoin : l'équipe vous prévient dès qu'une personne correspond.",
      describe: "Décrire mon besoin",
      seeEveryone: "Voir toutes les personnes",
      recent: ", les plus récemment vérifiés d'abord.",
      nearest:
        ", du plus proche au plus éloigné du quartier choisi. Les distances sont arrondies : aucune adresse n'est affichée.",
      ctaTitle: "Vous avez repéré quelqu'un ?",
      ctaText:
        "Dites-nous ce qu'il vous faut : le service, la formule, votre quartier, la rémunération proposée. Vous verrez ensuite les personnes qui y correspondent, et l'équipe organise la rencontre.",
      ctaAction: "Dites-nous ce qu'il vous faut",
      verifiedFor: "Vérifiée pour",
      verifiedForMale: "Vérifié pour",
    },
    reviews: {
      eyebrow: "Après la rencontre",
      title: "Ce que disent les familles.",
      family: "Une famille",
      about: "À propos de {name}, {noun}",
    },
    services: {
      title: "Pour votre maison et votre quotidien.",
      intro:
        "Des personnes que notre équipe a rencontrées, chez elles, avant de vous les présenter.",
      discover: "Découvrir",
    },
    verify: {
      eyebrow: "Comment on vérifie",
      title: "Personne n'entre chez vous sans être passé par nous.",
      intro:
        "Chaque personne présentée sur Dorwar a été rencontrée par notre équipe, sur le terrain. Cinq contrôles, toujours les mêmes, datés et visibles sur son profil.",
      steps: [
        {
          icon: "identite",
          title: "Identité",
          badge: "Identité vérifiée",
          text: "Sa carte nationale d'identité est vue et contrôlée, en personne.",
        },
        {
          icon: "photo",
          title: "Photo récente",
          badge: "Photo récente prise par Dorwar",
          text: "Une photo prise par notre agent le jour de la rencontre, avec son accord.",
        },
        {
          icon: "adresse",
          title: "Adresse visitée",
          badge: "Adresse visitée",
          text: "Nous nous rendons à son domicile. L'adresse reste privée.",
        },
        {
          icon: "references",
          title: "Deux références",
          badge: "Deux personnes de référence contactées",
          text: "Deux personnes qui la connaissent bien sont appelées : anciens employeurs, voisins, délégué de quartier.",
        },
        {
          icon: "entretien",
          title: "Entretien en personne",
          badge: "Entretien en personne",
          text: "Un vrai échange avec notre équipe, avant toute présentation à une famille.",
        },
      ],
      privacy:
        "La carte d'identité n'est jamais montrée sur le site. Vous voyez ce qui a été vérifié, et quand.",
      badgeCaption: "Sur chaque profil, un toucher sur le badge suffit pour voir le détail.",
    },
    how: {
      eyebrow: "Comment ça marche",
      title: "Trois étapes, et une équipe qui reste là.",
      steps: [
        {
          title: "Dites-nous ce qu'il vous faut",
          text: "Le service, la formule qui vous convient, votre quartier et la rémunération que vous proposez.",
        },
        {
          title: "On vous propose des profils vérifiés",
          text: "Les personnes les plus proches de chez vous d'abord, avec leur expérience, leurs avis et le détail de leur vérification.",
        },
        {
          title: "Vous rencontrez, vous choisissez. On reste là après.",
          text: "L'équipe organise la rencontre, écrit les conditions avec vous et appelle après la première semaine.",
        },
      ],
    },
    guarantee: {
      eyebrow: "Notre garantie",
      title: "Ça ne colle pas ? On vous propose quelqu'un d'autre.",
      body: "Une personne peut être très bien et ne pas convenir à votre maison. Pendant la période de garantie, prévenez l'équipe : nous vous présentons une autre personne vérifiée, sans nouveaux frais de dossier.",
      points: [
        "Un appel de l'équipe après la première semaine, des deux côtés.",
        "Un bouton « Signaler un problème » dans chaque placement, suivi par l'équipe.",
        "Des conditions écrites et acceptées avant le premier jour.",
      ],
    },
    providers: {
      eyebrow: "Pour celles et ceux qui proposent leurs services",
      title: "Être vérifié par Dorwar, c'est être pris au sérieux.",
      points: [
        {
          icon: "personne",
          title: "Des familles identifiées",
          text: "Chaque famille confirme son numéro de téléphone et son quartier. Vous savez chez qui vous allez.",
        },
        {
          icon: "document",
          title: "Des conditions écrites",
          text: "Rémunération, horaires, repos : tout est écrit et accepté des deux côtés avant le premier jour.",
        },
        {
          icon: "discussion",
          title: "Une équipe à qui parler",
          text: "Une question, un problème ? L'équipe Dorwar répond sur WhatsApp et suit chaque placement.",
        },
      ],
      quote: "Un jour, une semaine ou toute l'année : c'est vous qui choisissez.",
      missions:
        "Les missions courtes sont ouvertes à toute personne vérifiée qui veut un revenu d'appoint.",
      cta: "Je propose mes services",
    },
    contact: {
      title: "Une question avant de commencer ?",
      body: "Notre équipe vous répond sur WhatsApp, en français ou en wolof.",
    },
  },
  footer: {
    tagline: "La confiance avant la mise en relation.",
    zones: "Zones couvertes",
    contact: "Contact",
    data: "Vos données",
    dataText:
      "Vos données ne sont jamais vendues. Les pièces d'identité ne sont jamais publiées. Chaque consultation d'un document est enregistrée.",
    dataLink: "Comment nous protégeons vos données",
    legal: "Dorwar. Version de démonstration : toutes les personnes présentées sont fictives.",
  },
  whatsapp: {
    cta: "Parler à l'équipe Dorwar sur WhatsApp",
    short: "Écrire sur WhatsApp",
    missing: "Numéro WhatsApp de l'équipe à configurer dans l'admin.",
    prefill: "Bonjour l'équipe Dorwar, ",
  },
  auth: {
    title: "Connexion",
    intro: "Pas de mot de passe : nous vous envoyons un code par SMS.",
    providerIntro: "Commencez par votre numéro de téléphone. Il vous servira à vous connecter.",
    phoneLabel: "Votre numéro de téléphone",
    phoneHint: "Un numéro mobile du Sénégal, par exemple 77 123 45 67.",
    sendCode: "Recevoir mon code",
    sending: "Envoi du code…",
    codeTitle: "Entrez le code reçu",
    codeIntro: "Envoyé au {phone}. Il reste valable {minutes} minutes.",
    demoCode: "Démonstration : aucun SMS n'est envoyé. Votre code est",
    codeLabel: "Code à 6 chiffres",
    verify: "Valider",
    verifying: "Vérification…",
    changeNumber: "Changer de numéro",
    consent:
      "J'accepte que Dorwar conserve mon numéro pour me connecter et me recontacter au sujet de mes demandes.",
    consentLink: "En savoir plus sur vos données",
    errors: {
      invalidPhone: "Ce numéro ne ressemble pas à un mobile du Sénégal. Vérifiez les 9 chiffres.",
      tooMany: "Trop de codes demandés. Réessayez dans un quart d'heure.",
      wrongCode: "Ce code n'est pas le bon. Il vous reste {n} essai(s).",
      expired: "Ce code a expiré. Demandez-en un nouveau.",
      tooManyAttempts: "Trop d'essais. Demandez un nouveau code.",
      consentRequired: "Votre accord est nécessaire pour créer votre compte.",
      suspended: "Ce compte est suspendu. Contactez l'équipe Dorwar.",
      codeFormat: "Le code compte 6 chiffres.",
      smsUnavailable:
        "Nous ne pouvons pas envoyer de code pour le moment. Écrivez à l'équipe Dorwar sur WhatsApp.",
    },
    demoAccounts: "Comptes de démonstration",
  },
  dossier: {
    en_attente: "Inscription reçue",
    en_cours: "Vérification en cours",
    verifie: "Vérifié par Dorwar",
    refuse: "Dossier non retenu",
    suspendu: "Carte suspendue",
  },
  common: {
    continue: "Continuer",
    back: "Retour",
    edit: "Modifier",
    save: "Enregistrer",
    cancel: "Annuler",
    send: "Envoyer",
    yes: "Oui",
    no: "Non",
    optional: "facultatif",
    loading: "Chargement…",
    step: "Étape {n} sur {total}",
    listen: "Écouter",
  },
  errors: {
    generic: "Quelque chose s'est mal passé de notre côté. Réessayez dans un instant.",
    notFound: "Cette page n'existe pas, ou plus.",
    forbidden: "Cette page ne vous est pas accessible.",
  },
} as const;

type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : { [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof fr>;

export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}
