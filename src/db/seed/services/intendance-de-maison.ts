import type { ServiceConfigInput } from "@/lib/services/config";

/**
 * Configuration du service « Intendance de maison ».
 * C'est une donnée : la copier, l'adapter et l'insérer suffit pour ouvrir un autre service.
 */

export type ServiceSeed = {
  slug: string;
  name: string;
  icon: string;
  hue: string;
  sortOrder: number;
  active: boolean;
  config: ServiceConfigInput;
};

type Defaults = { guaranteeDays: number; feeFcfa: number; missionFeeFcfa: number };

const LONGUE = ["longue_logee", "longue_non_logee"];

export function intendanceDeMaison({
  guaranteeDays,
  feeFcfa,
  missionFeeFcfa,
}: Defaults): ServiceSeed {
  const longGuarantee = {
    kind: "remplacement" as const,
    days: guaranteeDays,
    text: "Si ça ne colle pas dans les {jours} jours qui suivent le début de l'essai, nous vous présentons une autre personne vérifiée, sans nouveaux frais de dossier.",
  };

  return {
    slug: "intendance-de-maison",
    name: "Intendance de maison",
    icon: "maison",
    hue: "terre",
    sortOrder: 1,
    active: true,
    config: {
      vocabulary: {
        female: "intendante",
        male: "intendant",
        neutral: "intendante ou intendant",
        plural: "intendantes et intendants",
        noneNearby: "Pas encore d'intendante ou d'intendant vérifié près de chez vous.",
        findAction: "Trouver une intendante ou un intendant",
      },
      tagline:
        "Une intendante ou un intendant vérifié pour tenir votre maison : ménage, cuisine, entretien.",
      page: {
        title: "Intendance de maison. La confiance, chaque jour.",
        subtitle:
          "Une intendante ou un intendant vérifié, à demeure ou pour quelques jours. Ménage, cuisine, entretien, et une équipe qui reste là après.",
        formulasTitle: "Trois façons de travailler ensemble.",
        formulasIntro:
          "Vous choisissez la formule. Les conditions sont écrites et acceptées des deux côtés avant le premier jour.",
        faq: [
          {
            q: "Qui fixe le salaire ?",
            a: "Vous proposez un montant dans votre demande. Il est discuté lors de la rencontre, puis écrit dans les conditions que vous acceptez tous les deux. Lors de l'appel de suivi, l'équipe demande à chacun si tout se passe comme convenu.",
          },
          {
            q: "Comment se passe la rencontre ?",
            a: "L'équipe vous appelle pour fixer un rendez-vous, chez vous ou dans un lieu neutre. Vous faites connaissance, vous posez vos questions. Rien n'est engagé tant que vous n'avez pas choisi.",
          },
          {
            q: "Et pour les grandes fêtes ?",
            a: "Vous indiquez dans votre demande les congés accordés pour la Tabaski, la Korité ou d'autres fêtes. Ils sont écrits dans les conditions : chacun sait à quoi s'attendre.",
          },
          {
            q: "Combien coûte Dorwar ?",
            a: "Des frais de dossier fixes, annoncés avant toute demande de rencontre et réglés par Wave ou Orange Money une fois la personne choisie. Le salaire est versé directement à la personne.",
          },
          {
            q: "Que se passe-t-il si ça ne colle pas ?",
            a: "Pendant la période de garantie, prévenez l'équipe : nous vous présentons une autre personne vérifiée, sans nouveaux frais de dossier.",
          },
          {
            q: "Qui protège la personne qui travaille chez moi ?",
            a: "Nous aussi. Les familles sont identifiées par leur numéro et leur quartier, elles s'engagent sur les conditions, et la personne peut joindre l'équipe à tout moment. Un manquement grave met fin au suivi.",
          },
        ],
      },
      formulas: [
        {
          key: "longue_logee",
          label: "Longue durée, logé(e)",
          shortLabel: "À demeure, logé(e)",
          summary:
            "La personne vit chez vous, 6 ou 7 jours sur 7, et rentre dans sa famille pour les grandes fêtes.",
          facts: [
            "6 ou 7 jours sur 7, avec une contrepartie écrite pour le 7 jours sur 7",
            "Une chambre, des repos et des congés convenus par écrit",
            "Un salaire mensuel versé à la date convenue",
          ],
          icon: "logee",
          housing: true,
          kind: "longue",
          pay: "mensuel",
        },
        {
          key: "longue_non_logee",
          label: "Longue durée, non logé(e)",
          shortLabel: "À demeure, non logé(e)",
          summary: "La personne arrive le matin et rentre chez elle chaque soir.",
          facts: [
            "Des horaires fixes, convenus ensemble",
            "Une personne qui habite à une distance raisonnable",
            "Un salaire mensuel versé à la date convenue",
          ],
          icon: "non_logee",
          housing: false,
          kind: "longue",
          pay: "mensuel",
        },
        {
          key: "ponctuelle",
          label: "Mission ponctuelle",
          shortLabel: "Quelques jours",
          summary:
            "Un jour ou quelques jours : grand ménage, baptême, fête, remplacement pendant des congés.",
          facts: [
            "D'un jour à deux semaines",
            "Un tarif à la journée, convenu à l'avance",
            "Une personne vérifiée exactement comme pour la longue durée",
          ],
          icon: "ponctuelle",
          housing: false,
          kind: "ponctuelle",
          pay: "journalier",
        },
      ],
      skills: [
        { key: "menage", label: "Ménage et rangement", icon: "balai" },
        { key: "cuisine", label: "Cuisine", icon: "marmite" },
        { key: "linge", label: "Linge et repassage", icon: "linge" },
        { key: "marche", label: "Courses au marché", icon: "panier" },
        { key: "evenements", label: "Grands repas et événements", icon: "fete" },
      ],
      verification: [
        {
          key: "identite",
          label: "Pièce d'identité",
          publicLabel: "Identité vérifiée",
          description:
            "Sa carte nationale d'identité est vue et contrôlée, en personne. Elle n'est jamais montrée sur le site.",
          plainLabel: "Nous regardons votre carte d'identité.",
          agentHint:
            "Contrôler l'original de la carte : photo, nom, date de naissance, validité. Photographier le recto et le verso (stockage privé).",
          icon: "identite",
          acceptsDocuments: true,
        },
        {
          key: "photo",
          label: "Photo récente",
          publicLabel: "Photo récente prise par Dorwar",
          description: "Une photo prise par notre agent le jour de la rencontre, avec son accord.",
          plainLabel: "Nous prenons une photo de vous, avec votre accord.",
          agentHint:
            "Photo de face, lumière du jour, fond neutre. Demander l'accord écrit avant toute publication.",
          icon: "photo",
          acceptsDocuments: true,
        },
        {
          key: "adresse",
          label: "Adresse visitée",
          publicLabel: "Adresse visitée",
          description: "Nous nous rendons à son domicile. L'adresse reste privée.",
          plainLabel: "Nous venons voir où vous habitez.",
          agentHint:
            "Visite sur place. Noter le repère et la personne rencontrée : ces informations ne sont jamais affichées.",
          icon: "adresse",
          acceptsDocuments: true,
        },
        {
          key: "reference_1",
          label: "Première référence",
          publicLabel: "Deux personnes de référence contactées",
          description:
            "Deux personnes qui la connaissent bien sont appelées : anciens employeurs, voisins, délégué de quartier.",
          plainLabel: "Nous appelons une personne qui vous connaît bien.",
          agentHint:
            "Nom, lien et téléphone restent privés. Demander : durée de la relation, ponctualité, honnêteté, raison du départ.",
          icon: "references",
          group: "references",
          acceptsDocuments: false,
        },
        {
          key: "reference_2",
          label: "Deuxième référence",
          publicLabel: "Deux personnes de référence contactées",
          description:
            "Deux personnes qui la connaissent bien sont appelées : anciens employeurs, voisins, délégué de quartier.",
          plainLabel: "Nous appelons une deuxième personne qui vous connaît.",
          agentHint:
            "Une personne différente de la première, si possible un ancien employeur. Mêmes questions.",
          icon: "references",
          group: "references",
          acceptsDocuments: false,
        },
        {
          key: "entretien",
          label: "Entretien en personne",
          publicLabel: "Entretien en personne",
          description: "Un entretien avec notre équipe, avant toute présentation à une famille.",
          plainLabel: "Nous parlons ensemble de votre expérience et de ce que vous cherchez.",
          agentHint:
            "Expérience, savoir-faire, attentes (salaire, repos, logement), disponibilité. Rédiger ensuite la présentation visible par les familles.",
          icon: "entretien",
          acceptsDocuments: false,
        },
      ],
      guarantees: {
        longue_logee: longGuarantee,
        longue_non_logee: longGuarantee,
        ponctuelle: {
          kind: "remplacement_ou_remboursement",
          days: 1,
          text: "Si la mission ne se passe pas comme prévu, prévenez l'équipe au plus tard le lendemain : nous envoyons quelqu'un d'autre quand c'est possible, sinon les frais de dossier sont remboursés.",
        },
      },
      fees: {
        longue_logee: { amountFcfa: feeFcfa, label: "Frais de dossier" },
        longue_non_logee: { amountFcfa: feeFcfa, label: "Frais de dossier" },
        ponctuelle: { amountFcfa: missionFeeFcfa, label: "Frais de dossier" },
      },
      needForm: {
        steps: [
          {
            key: "formule",
            title: "Quelle formule vous convient ?",
            intro: "Vous pourrez encore en parler lors de la rencontre.",
            fields: [{ type: "formula", key: "formule", label: "Formule" }],
          },
          {
            key: "rythme",
            title: "Quel rythme de travail ?",
            showIf: { field: "formule", in: ["longue_logee"] },
            fields: [
              {
                type: "choice",
                key: "rythme",
                label: "Jours de travail par semaine",
                required: true,
                options: [
                  {
                    value: "6_sur_7",
                    label: "6 jours sur 7",
                    description: "Un jour de repos chaque semaine.",
                  },
                  {
                    value: "7_sur_7",
                    label: "7 jours sur 7",
                    description: "Avec une contrepartie convenue et écrite.",
                  },
                ],
              },
              {
                type: "choice",
                key: "contrepartie",
                label: "Contrepartie du 7 jours sur 7",
                required: true,
                showIf: { field: "rythme", in: ["7_sur_7"] },
                options: [
                  {
                    value: "repos_compense",
                    label: "Repos compensé",
                    description:
                      "Des jours de repos regroupés, par exemple deux jours chaque mois.",
                  },
                  {
                    value: "remuneration_supplementaire",
                    label: "Rémunération supplémentaire",
                    description: "Un montant ajouté au salaire chaque mois.",
                  },
                ],
              },
              {
                type: "text",
                key: "contrepartie_detail",
                label: "Précisez la contrepartie",
                placeholder: "Ex. : 2 jours de repos par mois, ou 10 000 FCFA de plus",
                maxLength: 160,
                required: true,
                showIf: { field: "rythme", in: ["7_sur_7"] },
              },
              {
                type: "info",
                key: "info_contrepartie",
                label: "Bon à savoir",
                body: "La contrepartie sera écrite dans les conditions du placement, que vous acceptez tous les deux.",
                showIf: { field: "rythme", in: ["7_sur_7"] },
              },
            ],
          },
          {
            key: "poste",
            title: "Le poste",
            showIf: { field: "formule", in: LONGUE },
            fields: [
              {
                type: "choice",
                key: "poste",
                label: "Type de poste",
                required: true,
                options: [
                  { value: "menage", label: "Ménage et entretien", icon: "balai" },
                  { value: "cuisine", label: "Cuisine", icon: "marmite" },
                  {
                    value: "polyvalent",
                    label: "Polyvalent",
                    description: "Ménage et cuisine",
                    icon: "maison",
                  },
                ],
              },
              {
                type: "time_range",
                key: "horaires",
                label: "Horaires de travail",
                hint: "Par exemple de 8 h à 18 h, pause comprise.",
                required: true,
              },
              {
                type: "days_of_week",
                key: "repos",
                label: "Jour(s) de repos",
                min: 1,
                max: 2,
                required: true,
                showIf: {
                  any: [
                    { field: "formule", in: ["longue_non_logee"] },
                    { field: "rythme", in: ["6_sur_7"] },
                  ],
                },
              },
            ],
          },
          {
            key: "fetes",
            title: "Les grandes fêtes",
            intro:
              "Pour les grandes fêtes, beaucoup rentrent dans leur famille. Indiquez-le dès maintenant : ce sera écrit dans les conditions.",
            showIf: { field: "formule", in: LONGUE },
            fields: [
              {
                type: "multi_choice",
                key: "fetes",
                label: "Congés accordés pour",
                required: false,
                options: [
                  { value: "tabaski", label: "Tabaski" },
                  { value: "korite", label: "Korité" },
                  { value: "tamkharit", label: "Tamkharit" },
                  { value: "gamou", label: "Gamou" },
                  { value: "magal", label: "Magal de Touba" },
                  { value: "noel", label: "Noël" },
                  { value: "paques", label: "Pâques" },
                ],
              },
              {
                type: "choice",
                key: "duree_conges",
                label: "Durée de chaque congé",
                required: true,
                showIf: { field: "fetes", filled: true },
                options: [
                  { value: "2_3_jours", label: "2 à 3 jours" },
                  { value: "une_semaine", label: "Une semaine" },
                  { value: "a_convenir", label: "À convenir ensemble" },
                ],
              },
            ],
          },
          {
            key: "remuneration",
            title: "Salaire et date de début",
            showIf: { field: "formule", in: LONGUE },
            fields: [
              {
                type: "money",
                key: "salaire",
                label: "Salaire mensuel proposé",
                unit: "FCFA par mois",
                min: 20000,
                max: 1000000,
                step: 5000,
                required: true,
                hint: "Versé directement à la personne. Le montant sera écrit dans les conditions.",
              },
              {
                type: "date",
                key: "debut",
                label: "Date de début souhaitée",
                minDaysFromToday: 0,
                maxDaysFromToday: 180,
                required: true,
              },
            ],
          },
          {
            key: "mission",
            title: "La mission",
            showIf: { field: "formule", in: ["ponctuelle"] },
            fields: [
              {
                type: "date",
                key: "mission_debut",
                label: "Premier jour",
                minDaysFromToday: 0,
                maxDaysFromToday: 120,
                required: true,
              },
              {
                type: "number",
                key: "mission_jours",
                label: "Nombre de jours",
                min: 1,
                max: 14,
                unit: "jour(s)",
                required: true,
              },
              {
                type: "multi_choice",
                key: "taches",
                label: "Tâches",
                required: true,
                options: [
                  { value: "menage", label: "Ménage", icon: "balai" },
                  { value: "cuisine", label: "Cuisine", icon: "marmite" },
                  { value: "linge", label: "Linge et repassage", icon: "linge" },
                  { value: "grand_nettoyage", label: "Grand nettoyage", icon: "maison" },
                  { value: "evenement", label: "Préparation d'un événement", icon: "fete" },
                ],
              },
              {
                type: "text",
                key: "evenement",
                label: "Quel événement ?",
                placeholder: "Baptême, mariage, Tabaski, retour de voyage…",
                maxLength: 120,
                required: false,
                showIf: { field: "taches", in: ["evenement"] },
              },
              {
                type: "money",
                key: "tarif_journalier",
                label: "Tarif à la journée proposé",
                unit: "FCFA par jour",
                min: 2000,
                max: 100000,
                step: 500,
                required: true,
              },
            ],
          },
          {
            key: "lieu",
            title: "Où se trouve la maison ?",
            intro:
              "Votre adresse n'est jamais affichée. Les personnes que vous rencontrez voient seulement votre quartier.",
            fields: [{ type: "location", key: "lieu", label: "Lieu" }],
          },
          {
            key: "remarques",
            title: "Autre chose à nous dire ?",
            fields: [
              {
                type: "textarea",
                key: "remarques",
                label: "Remarques",
                placeholder: "Nombre de personnes à la maison, habitudes, allergies, animaux…",
                maxLength: 600,
                required: false,
              },
              { type: "voice_note", key: "note_vocale", label: "Note vocale" },
            ],
          },
          {
            key: "engagements",
            title: "Vos engagements",
            intro:
              "La confiance va dans les deux sens : Dorwar protège aussi celles et ceux qui travaillent chez vous.",
            fields: [
              {
                type: "consent",
                key: "engagements",
                label: "En tant que famille, je m'engage à :",
                items: [
                  "verser la rémunération convenue, à la date convenue ;",
                  "respecter les horaires, les jours de repos et les congés écrits dans les conditions ;",
                  "traiter la personne avec respect et prévenir l'équipe Dorwar en cas de difficulté.",
                ],
              },
            ],
          },
        ],
      },
    },
  };
}
