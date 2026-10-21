import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import { generateCardId } from "@/lib/card";
import { draftConditions } from "@/lib/form-engine/summary";
import { formatDate } from "@/lib/format";
import { followUpDate, guaranteeEndDate } from "@/lib/placements";
import {
  checkServiceConfig,
  guaranteeText,
  serviceConfigSchema,
  type ServiceConfig,
} from "@/lib/services/config";
import * as s from "../schema";
import type { SeededArea } from "./areas";
import type { SeedDb } from "./db";
import { fakeDocumentSvg, fakePortraitSvg } from "./documents";
import {
  FAMILIES,
  STAFF,
  STEP_NOTES,
  WORKERS,
  type FamilyFixture,
  type WorkerFixture,
} from "./fixtures";
import { intendanceDeMaison } from "./services/intendance-de-maison";

const DAY = 86_400_000;

type Context = {
  db: SeedDb;
  areas: Map<string, SeededArea>;
  uploadsDir: string;
  now: number;
};

function at(ctx: Context, daysFromNow: number, hour = 10, minute = 0): Date {
  const d = new Date(ctx.now + daysFromNow * DAY);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

function isoDay(ctx: Context, daysFromNow: number): string {
  return at(ctx, daysFromNow).toISOString().slice(0, 10);
}

function area(ctx: Context, key: string): SeededArea {
  const found = ctx.areas.get(key);
  if (!found) throw new Error(`Zone inconnue dans le seed : ${key}`);
  return found;
}

/** Décalage stable de quelques centaines de mètres : la position enregistrée n'est jamais l'adresse. */
function blur(seed: string, lat: number, lng: number) {
  const h = createHash("sha256").update(seed).digest();
  const dLat = ((h[0] / 255) * 2 - 1) * 0.003;
  const dLng = ((h[1] / 255) * 2 - 1) * 0.003;
  return { lat: lat + dLat, lng: lng + dLng };
}

export type SeedSummary = Record<string, number>;

export async function seedDemo(
  ctx: Context,
  defaults: {
    guaranteeDays: number;
    feeFcfa: number;
    missionFeeFcfa: number;
    whatsappNumber: string | null;
  },
) {
  const { db } = ctx;

  // --- Service -----------------------------------------------------------------------------
  const seedService = intendanceDeMaison(defaults);
  const config: ServiceConfig = serviceConfigSchema.parse(seedService.config);
  const problems = checkServiceConfig(config);
  if (problems.length)
    throw new Error(`Configuration du service incohérente : ${problems.join(", ")}`);
  const [service] = await db
    .insert(s.services)
    .values({ ...seedService, config })
    .returning({ id: s.services.id });

  if (defaults.whatsappNumber) {
    await db.insert(s.settings).values({ key: "whatsapp_number", value: defaults.whatsappNumber });
  }

  // --- Équipe ------------------------------------------------------------------------------
  const [admin] = await db
    .insert(s.users)
    .values({
      phone: STAFF.admin.phone,
      role: "admin",
      name: STAFF.admin.name,
      consentAt: at(ctx, -400),
      createdAt: at(ctx, -400),
    })
    .returning({ id: s.users.id });
  const [agent] = await db
    .insert(s.users)
    .values({
      phone: STAFF.agent.phone,
      role: "agent",
      name: STAFF.agent.name,
      consentAt: at(ctx, -400),
      createdAt: at(ctx, -400),
    })
    .returning({ id: s.users.id });

  // --- Prestataires --------------------------------------------------------------------------
  const workers = new Map<
    string,
    { userId: string; profileId: string; workerServiceId: string; fixture: WorkerFixture }
  >();
  let documentCount = 0;
  for (const w of WORKERS) {
    const home = area(ctx, w.area);
    const opened = w.status === "verifie" || w.status === "suspendu";
    const verifiedAt = opened ? at(ctx, -w.daysAgo, 16) : null;
    const submittedAt = opened ? at(ctx, -w.daysAgo - 12, 9) : at(ctx, -w.daysAgo, 9);

    const [user] = await db
      .insert(s.users)
      .values({
        phone: w.phone,
        role: "prestataire",
        consentAt: submittedAt,
        createdAt: submittedAt,
      })
      .returning({ id: s.users.id });
    const [profile] = await db
      .insert(s.workerProfiles)
      .values({
        userId: user.id,
        firstName: w.firstName,
        lastName: w.lastName,
        gender: w.gender,
        birthYear: w.birthYear,
        languages: w.languages,
        experienceYears: w.experienceYears,
        presentation: w.presentation ?? null,
        areaId: home.id,
        location: blur(w.phone, home.lat, home.lng),
        interventionRadiusKm: w.radiusKm,
        acceptedAreaIds: (w.acceptedAreas ?? []).map((k) => area(ctx, k).id),
        willingToRelocate: w.relocate ?? false,
        availableFrom: isoDay(ctx, 3),
        monthlyRateFcfa: w.monthly ?? null,
        dailyRateFcfa: w.daily ?? null,
        cardId: w.cardId ?? generateCardId(),
        consentAt: submittedAt,
        createdAt: submittedAt,
      })
      .returning({ id: s.workerProfiles.id });
    const [dossier] = await db
      .insert(s.workerServices)
      .values({
        workerProfileId: profile.id,
        serviceId: service.id,
        formulaKeys: w.formulas,
        skills: w.skills,
        status: w.status,
        submittedAt,
        verifiedAt,
        decisionReason: w.reason ?? null,
        decidedAt:
          w.status === "refuse" || w.status === "suspendu"
            ? at(ctx, -Math.min(w.daysAgo, 10), 15)
            : verifiedAt,
        decidedById: w.status === "en_attente" || w.status === "en_cours" ? null : agent.id,
        createdAt: submittedAt,
      })
      .returning({ id: s.workerServices.id });

    // Étapes de vérification, dans l'ordre de la configuration.
    const offsets: Record<string, number> = {
      identite: 9,
      photo: 9,
      adresse: 7,
      reference_1: 5,
      reference_2: 4,
      entretien: 2,
    };
    const stepIds = new Map<string, string>();
    for (const [index, step] of config.verification.entries()) {
      const done = opened || (w.stepsDone ?? []).includes(step.key);
      const failed = w.status === "refuse" && step.group === "references";
      const completedAt = done
        ? opened
          ? new Date(verifiedAt!.getTime() - offsets[step.key] * DAY)
          : new Date(submittedAt.getTime() + (index + 1) * DAY * 0.8)
        : failed
          ? at(ctx, -w.daysAgo + 3)
          : null;
      const [row] = await db
        .insert(s.verificationSteps)
        .values({
          workerServiceId: dossier.id,
          type: step.key,
          sortOrder: index,
          status: done ? "fait" : failed ? "echec" : "a_faire",
          notes: done
            ? STEP_NOTES[step.key]
            : failed
              ? "Numéro injoignable après trois tentatives sur une semaine."
              : null,
          agentId: done || failed ? agent.id : null,
          completedAt,
        })
        .returning({ id: s.verificationSteps.id });
      stepIds.set(step.key, row.id);
    }

    // Documents privés fictifs (pièce d'identité recto/verso, photo).
    const hasIdentity = opened || (w.stepsDone ?? []).includes("identite");
    if (hasIdentity) {
      const who = `${w.firstName} ${w.lastName.charAt(0)}. (personne fictive)`;
      const docs = [
        {
          kind: "piece_identite" as const,
          step: "identite",
          label: "Carte d'identité, recto",
          svg: fakeDocumentSvg("Carte nationale d'identité — recto", who),
        },
        {
          kind: "piece_identite" as const,
          step: "identite",
          label: "Carte d'identité, verso",
          svg: fakeDocumentSvg("Carte nationale d'identité — verso", who),
        },
        {
          kind: "photo" as const,
          step: "photo",
          label: "Photo prise par l'agent",
          svg: fakePortraitSvg(`${w.firstName.charAt(0)}${w.lastName.charAt(0)}`),
        },
      ];
      for (const doc of docs) {
        const storageKey = `documents/${profile.id}/${randomUUID()}.svg`;
        const file = path.join(ctx.uploadsDir, storageKey);
        await mkdir(path.dirname(file), { recursive: true });
        await writeFile(file, doc.svg, { mode: 0o600 });
        await db.insert(s.documents).values({
          workerProfileId: profile.id,
          verificationStepId: stepIds.get(doc.step) ?? null,
          kind: doc.kind,
          storageKey,
          mimeType: "image/svg+xml",
          sizeBytes: Buffer.byteLength(doc.svg),
          label: doc.label,
          uploadedById: agent.id,
          createdAt: submittedAt,
        });
        documentCount++;
      }
    }
    workers.set(w.firstName + " " + w.lastName, {
      userId: user.id,
      profileId: profile.id,
      workerServiceId: dossier.id,
      fixture: w,
    });
  }

  // --- Familles ----------------------------------------------------------------------------
  const families = new Map<string, { userId: string; fixture: FamilyFixture }>();
  for (const [i, f] of FAMILIES.entries()) {
    const createdAt = at(ctx, -320 + i * 20, 11);
    const [user] = await db
      .insert(s.users)
      .values({ phone: f.phone, role: "famille", consentAt: createdAt, createdAt })
      .returning({ id: s.users.id });
    await db.insert(s.familyProfiles).values({
      userId: user.id,
      displayName: f.displayName,
      areaId: area(ctx, f.area).id,
      phoneVerifiedAt: createdAt,
      commitmentsAcceptedAt: createdAt,
      createdAt,
    });
    families.set(f.displayName, { userId: user.id, fixture: f });
  }

  const formulasById = new Map(config.formulas.map((f) => [f.key, f]));
  const formulaLabels = config.formulas.map((f) => ({ key: f.key, label: f.label }));

  // --- Demandes et placements -------------------------------------------------------------
  type RequestSpec = {
    family: string;
    formula: string;
    daysAgo: number;
    answers: Record<string, unknown>;
    areaKey: string;
    mode?: "autour" | "zone";
    radiusKm?: number;
    status?: "ouverte" | "pourvue" | "fermee";
  };
  const engagements = [0, 1, 2];

  async function createRequest(spec: RequestSpec) {
    const fam = families.get(spec.family)!;
    const zone = area(ctx, spec.areaKey);
    const mode = spec.mode ?? "autour";
    const lieu =
      mode === "autour"
        ? { mode, radiusKm: spec.radiusKm ?? 5, areaId: zone.id }
        : { mode, areaId: zone.id };
    const [row] = await db
      .insert(s.requests)
      .values({
        familyUserId: fam.userId,
        serviceId: service.id,
        formulaKey: spec.formula,
        answers: { formule: spec.formula, ...spec.answers, lieu, engagements },
        searchMode: mode,
        areaId: zone.id,
        location: { lat: zone.lat, lng: zone.lng },
        radiusKm: mode === "autour" ? (spec.radiusKm ?? 5) : null,
        status: spec.status ?? "ouverte",
        createdAt: at(ctx, -spec.daysAgo, 12),
      })
      .returning({ id: s.requests.id, answers: s.requests.answers });
    return row;
  }

  type PlacementSpec = {
    request: { id: string; answers: Record<string, unknown> };
    family: string;
    worker: string;
    formula: string;
    status: s.PlacementStatus;
    requestedDaysAgo: number;
    message?: string;
    meeting?: { inDays: number; hour: number; place: string };
    /** Début de l'essai (longue durée) ou premier jour de mission, en jours depuis aujourd'hui. */
    startInDays?: number;
    endInDays?: number;
    followUpDone?: boolean;
    acceptedByFamily?: boolean;
    acceptedByWorker?: boolean;
    endReason?: string;
  };

  async function createPlacement(spec: PlacementSpec) {
    const fam = families.get(spec.family)!;
    const worker = workers.get(spec.worker)!;
    const formula = formulasById.get(spec.formula)!;
    const guarantee = config.guarantees[spec.formula];
    const amount =
      formula.pay === "mensuel"
        ? Number(spec.request.answers.salaire ?? worker.fixture.monthly ?? 0)
        : Number(spec.request.answers.tarif_journalier ?? worker.fixture.daily ?? 0);
    const startDate = spec.startInDays !== undefined ? isoDay(ctx, spec.startInDays) : null;
    const guaranteeEndsAt = startDate ? guaranteeEndDate(startDate, guarantee.days) : null;
    const conditions = [
      draftConditions(config.needForm, spec.request.answers, { formulas: formulaLabels }),
      startDate ? `Début : ${formatDate(startDate)}.` : null,
      guaranteeEndsAt
        ? `Garantie Dorwar jusqu'au ${formatDate(guaranteeEndsAt)} : ${guaranteeText(guarantee)}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
    const pastMeeting = ["essai", "confirme", "termine"].includes(spec.status);
    const followUpDueAt = startDate && formula.kind === "longue" ? followUpDate(startDate) : null;
    const [row] = await db
      .insert(s.placements)
      .values({
        requestId: spec.request.id,
        workerServiceId: worker.workerServiceId,
        familyUserId: fam.userId,
        workerProfileId: worker.profileId,
        serviceId: service.id,
        formulaKey: spec.formula,
        status: spec.status,
        familyMessage: spec.message ?? null,
        meetingAt: spec.meeting ? at(ctx, spec.meeting.inDays, spec.meeting.hour) : null,
        meetingPlace: spec.meeting?.place ?? null,
        startDate,
        endDate: spec.endInDays !== undefined ? isoDay(ctx, spec.endInDays) : null,
        agreedMonthlyFcfa: formula.pay === "mensuel" ? amount : null,
        agreedDailyFcfa: formula.pay === "journalier" ? amount : null,
        restDays: Array.isArray(spec.request.answers.repos)
          ? (spec.request.answers.repos as string[])
          : null,
        conditions: spec.status === "rencontre_demandee" ? null : conditions,
        familyAcceptedAt:
          (spec.acceptedByFamily ?? pastMeeting) ? at(ctx, -spec.requestedDaysAgo + 2) : null,
        workerAcceptedAt:
          (spec.acceptedByWorker ?? pastMeeting) ? at(ctx, -spec.requestedDaysAgo + 2) : null,
        guaranteeEndsAt,
        followUpDueAt,
        followUpDoneAt:
          spec.followUpDone && followUpDueAt ? new Date(`${followUpDueAt}T11:00:00Z`) : null,
        followUpNotes: spec.followUpDone
          ? "Appel fait aux deux côtés : tout se passe comme convenu."
          : null,
        followUpById: spec.followUpDone ? agent.id : null,
        scheduledAt:
          spec.status !== "rencontre_demandee" ? at(ctx, -spec.requestedDaysAgo + 1) : null,
        trialStartedAt:
          formula.kind === "longue" && pastMeeting && startDate
            ? new Date(`${startDate}T09:00:00Z`)
            : null,
        confirmedAt:
          spec.status === "confirme" || spec.status === "termine"
            ? startDate
              ? new Date(
                  new Date(`${startDate}T09:00:00Z`).getTime() +
                    (formula.kind === "longue" ? guarantee.days : -1) * DAY,
                )
              : null
            : null,
        endedAt:
          spec.status === "termine" && spec.endInDays !== undefined
            ? at(ctx, spec.endInDays, 18)
            : null,
        endReason: spec.endReason ?? null,
        createdAt: at(ctx, -spec.requestedDaysAgo, 13),
      })
      .returning({ id: s.placements.id });
    return { id: row.id, familyUserId: fam.userId, workerUserId: worker.userId };
  }

  const reviews: (typeof s.reviews.$inferInsert)[] = [];
  const review = (
    p: { id: string; familyUserId: string; workerUserId: string },
    by: "famille" | "prestataire",
    rating: number,
    comment: string,
    daysAgo: number,
  ) =>
    reviews.push({
      placementId: p.id,
      authorId: by === "famille" ? p.familyUserId : p.workerUserId,
      targetUserId: by === "famille" ? p.workerUserId : p.familyUserId,
      authorRole: by,
      rating,
      comment,
      createdAt: at(ctx, -daysAgo, 19),
    });

  const mermoz = "dakar/dakar/mermoz-sacre-coeur/mermoz";

  // Famille Diallo (compte de démonstration) : un placement confirmé, une mission à venir, une demande ouverte.
  const r1 = await createRequest({
    family: "Famille Diallo",
    formula: "longue_logee",
    daysAgo: 70,
    areaKey: mermoz,
    radiusKm: 10,
    status: "pourvue",
    answers: {
      rythme: "6_sur_7",
      poste: "polyvalent",
      horaires: { start: "07:00", end: "20:00" },
      repos: ["dimanche"],
      fetes: ["tabaski", "korite"],
      duree_conges: "une_semaine",
      salaire: 90000,
      debut: isoDay(ctx, -60),
      remarques: "Nous sommes cinq à la maison, dont deux enfants scolarisés.",
    },
  });
  const p1 = await createPlacement({
    request: r1,
    family: "Famille Diallo",
    worker: "Aminata Sow",
    formula: "longue_logee",
    status: "confirme",
    requestedDaysAgo: 68,
    startInDays: -60,
    followUpDone: true,
  });
  review(
    p1,
    "famille",
    5,
    "Aminata est arrivée le jour prévu et a pris ses marques en une semaine. La maison n'a jamais été aussi bien tenue, et l'appel de l'équipe au bout de huit jours nous a rassurés.",
    25,
  );
  review(
    p1,
    "prestataire",
    5,
    "Famille respectueuse. Le salaire est versé à la date convenue et ma chambre est confortable.",
    24,
  );

  const r2 = await createRequest({
    family: "Famille Diallo",
    formula: "ponctuelle",
    daysAgo: 3,
    areaKey: mermoz,
    radiusKm: 5,
    answers: {
      mission_debut: isoDay(ctx, 6),
      mission_jours: 2,
      taches: ["cuisine", "evenement"],
      evenement: "Baptême de notre petite-fille",
      tarif_journalier: 10000,
      remarques: "Une trentaine d'invités le dimanche midi.",
    },
  });
  await createPlacement({
    request: r2,
    family: "Famille Diallo",
    worker: "Fatou Ndiaye",
    formula: "ponctuelle",
    status: "rencontre_prevue",
    requestedDaysAgo: 2,
    message: "Pouvez-vous passer un soir de la semaine pour voir la cuisine ?",
    meeting: { inDays: 2, hour: 17, place: "Chez la famille, à Mermoz" },
    startInDays: 6,
    endInDays: 7,
    acceptedByWorker: true,
    acceptedByFamily: false,
  });

  await createRequest({
    family: "Famille Diallo",
    formula: "longue_non_logee",
    daysAgo: 1,
    areaKey: mermoz,
    radiusKm: 5,
    answers: {
      poste: "cuisine",
      horaires: { start: "09:00", end: "17:00" },
      repos: ["samedi", "dimanche"],
      fetes: ["tabaski", "korite"],
      duree_conges: "2_3_jours",
      salaire: 100000,
      debut: isoDay(ctx, 14),
    },
  });

  // Famille Sarr : un essai en cours avec un signalement ouvert.
  const r4 = await createRequest({
    family: "Famille Sarr",
    formula: "longue_non_logee",
    daysAgo: 15,
    areaKey: "dakar/dakar/ouakam/ouakam",
    radiusKm: 5,
    status: "pourvue",
    answers: {
      poste: "cuisine",
      horaires: { start: "08:30", end: "17:30" },
      repos: ["dimanche"],
      fetes: ["tabaski", "korite", "gamou"],
      duree_conges: "2_3_jours",
      salaire: 115000,
      debut: isoDay(ctx, -5),
    },
  });
  const p3 = await createPlacement({
    request: r4,
    family: "Famille Sarr",
    worker: "Seynabou Gueye",
    formula: "longue_non_logee",
    status: "essai",
    requestedDaysAgo: 13,
    startInDays: -5,
  });

  // Famille Gueye : deux rencontres demandées, à organiser par l'agent.
  const r5 = await createRequest({
    family: "Famille Gueye",
    formula: "longue_logee",
    daysAgo: 3,
    areaKey: "dakar/dakar/mermoz-sacre-coeur/sacre-coeur",
    radiusKm: 10,
    answers: {
      rythme: "7_sur_7",
      contrepartie: "repos_compense",
      contrepartie_detail: "Deux jours de repos consécutifs chaque mois",
      poste: "polyvalent",
      horaires: { start: "07:30", end: "19:30" },
      fetes: ["tabaski", "korite", "magal"],
      duree_conges: "une_semaine",
      salaire: 100000,
      debut: isoDay(ctx, 10),
      remarques: "Grand-mère à la maison, qui a besoin d'attention en journée.",
    },
  });
  await createPlacement({
    request: r5,
    family: "Famille Gueye",
    worker: "Rokhaya Mbaye",
    formula: "longue_logee",
    status: "rencontre_demandee",
    requestedDaysAgo: 2,
    message: "Nous aimerions la rencontrer samedi matin si possible.",
  });
  await createPlacement({
    request: r5,
    family: "Famille Gueye",
    worker: "Marie Mendy",
    formula: "longue_logee",
    status: "rencontre_demandee",
    requestedDaysAgo: 1,
  });

  // Famille Mendy : une mission terminée, avis des deux côtés.
  const r6 = await createRequest({
    family: "Famille Mendy",
    formula: "ponctuelle",
    daysAgo: 30,
    areaKey: "dakar/dakar/sicap-liberte/liberte-6",
    radiusKm: 5,
    status: "pourvue",
    answers: {
      mission_debut: isoDay(ctx, -25),
      mission_jours: 1,
      taches: ["linge", "grand_nettoyage"],
      tarif_journalier: 7000,
    },
  });
  const p6 = await createPlacement({
    request: r6,
    family: "Famille Mendy",
    worker: "Astou Seck",
    formula: "ponctuelle",
    status: "termine",
    requestedDaysAgo: 28,
    startInDays: -25,
    endInDays: -25,
  });
  review(p6, "famille", 5, "Jeune, efficace et très polie. Le repassage était parfait.", 24);
  review(
    p6,
    "prestataire",
    5,
    "Bien accueillie, repas offert le midi, paiement le soir même par Wave.",
    24,
  );

  // Famille Ba : essai commencé il y a 7 jours, appel de suivi à passer aujourd'hui.
  const r7 = await createRequest({
    family: "Famille Ba",
    formula: "longue_non_logee",
    daysAgo: 20,
    areaKey: "dakar/dakar/fann-point-e-amitie/point-e",
    radiusKm: 5,
    status: "pourvue",
    answers: {
      poste: "polyvalent",
      horaires: { start: "08:00", end: "18:00" },
      repos: ["dimanche"],
      fetes: ["tabaski", "korite"],
      duree_conges: "2_3_jours",
      salaire: 100000,
      debut: isoDay(ctx, -7),
    },
  });
  await createPlacement({
    request: r7,
    family: "Famille Ba",
    worker: "Ndèye Fall",
    formula: "longue_non_logee",
    status: "essai",
    requestedDaysAgo: 18,
    startInDays: -7,
  });

  // Famille Kane, à Dagana : zone pas encore ouverte, numéro laissé en liste d'attente.
  const dagana = area(ctx, "saint-louis/dagana/dagana");
  await createRequest({
    family: "Famille Kane",
    formula: "ponctuelle",
    daysAgo: 1,
    areaKey: "saint-louis/dagana/dagana",
    mode: "zone",
    answers: {
      mission_debut: isoDay(ctx, 12),
      mission_jours: 3,
      taches: ["menage", "cuisine"],
      tarif_journalier: 6000,
    },
  });
  await db.insert(s.waitlist).values([
    {
      phone: "+221770000015",
      userId: families.get("Famille Kane")!.userId,
      areaId: dagana.id,
      serviceId: service.id,
      formulaKey: "ponctuelle",
      createdAt: at(ctx, -1, 12),
    },
    {
      phone: "+221770000099",
      areaId: area(ctx, "ziguinchor/ziguinchor/ziguinchor").id,
      serviceId: service.id,
      formulaKey: "longue_non_logee",
      createdAt: at(ctx, -9, 10),
    },
  ]);

  // Placements terminés : l'historique qui donne leurs notes aux profils.
  const history: {
    family: string;
    worker: string;
    formula: string;
    start: number;
    end: number;
    areaKey: string;
    answers: Record<string, unknown>;
    familyReview: [number, string];
    workerReview?: [number, string];
    endReason?: string;
  }[] = [
    {
      family: "Famille Gueye",
      worker: "Fatou Ndiaye",
      formula: "ponctuelle",
      start: -200,
      end: -199,
      areaKey: "dakar/dakar/mermoz-sacre-coeur/sacre-coeur",
      answers: {
        mission_debut: isoDay(ctx, -200),
        mission_jours: 2,
        taches: ["cuisine", "evenement"],
        evenement: "Baptême",
        tarif_journalier: 10000,
      },
      familyReview: [
        5,
        "Fatou a préparé le repas du baptême pour trente personnes, sans stress et avec le sourire. Nous la rappellerons pour la Tabaski.",
      ],
    },
    {
      family: "Famille Mendy",
      worker: "Fatou Ndiaye",
      formula: "ponctuelle",
      start: -60,
      end: -60,
      areaKey: "dakar/dakar/sicap-liberte/liberte-6",
      answers: {
        mission_debut: isoDay(ctx, -60),
        mission_jours: 1,
        taches: ["cuisine"],
        tarif_journalier: 10000,
      },
      familyReview: [
        5,
        "Un déjeuner de famille parfaitement organisé. Ponctuelle et très professionnelle.",
      ],
    },
    {
      family: "Famille Sarr",
      worker: "Rokhaya Mbaye",
      formula: "longue_logee",
      start: -290,
      end: -40,
      areaKey: "dakar/dakar/ouakam/ouakam",
      answers: {
        rythme: "6_sur_7",
        poste: "polyvalent",
        horaires: { start: "07:00", end: "20:00" },
        repos: ["vendredi"],
        salaire: 95000,
        debut: isoDay(ctx, -290),
      },
      familyReview: [
        4,
        "Très expérimentée, elle connaît son métier mieux que nous. Un peu stricte sur les horaires, ce qui est finalement une qualité.",
      ],
      workerReview: [
        4,
        "Famille correcte dans l'ensemble. Un salaire versé avec retard une fois, réglé grâce à l'équipe Dorwar.",
      ],
      endReason: "La famille s'est installée à Thiès.",
    },
    {
      family: "Famille Ba",
      worker: "Moussa Sène",
      formula: "longue_non_logee",
      start: -210,
      end: -30,
      areaKey: "dakar/dakar/fann-point-e-amitie/point-e",
      answers: {
        poste: "polyvalent",
        horaires: { start: "08:00", end: "17:00" },
        repos: ["dimanche"],
        salaire: 100000,
        debut: isoDay(ctx, -210),
      },
      familyReview: [
        5,
        "Moussa est fiable et discret. Il a remis la cuisine en ordre dès la première semaine.",
      ],
      endReason: "Fin de contrat : la famille a déménagé.",
    },
    {
      family: "Famille Mendy",
      worker: "Ibrahima Cissé",
      formula: "longue_logee",
      start: -220,
      end: -60,
      areaKey: "dakar/dakar/sicap-liberte/liberte-6",
      answers: {
        rythme: "6_sur_7",
        poste: "menage",
        horaires: { start: "07:00", end: "19:00" },
        repos: ["dimanche"],
        salaire: 105000,
        debut: isoDay(ctx, -220),
      },
      familyReview: [
        4,
        "Sérieux et ponctuel. Nous aurions aimé un peu plus de cuisine, mais ce n'était pas prévu dans le poste.",
      ],
      endReason: "Fin de la période convenue.",
    },
    {
      family: "Famille Diallo",
      worker: "Marie Mendy",
      formula: "ponctuelle",
      start: -150,
      end: -149,
      areaKey: mermoz,
      answers: {
        mission_debut: isoDay(ctx, -150),
        mission_jours: 2,
        taches: ["grand_nettoyage"],
        tarif_journalier: 8000,
      },
      familyReview: [5, "Venue deux jours pour le grand ménage avant la Korité : impeccable."],
      workerReview: [5, "Famille accueillante, consignes claires, paiement à l'heure."],
    },
    {
      family: "Famille Sarr",
      worker: "Oumy Thiam",
      formula: "longue_non_logee",
      start: -140,
      end: -16,
      areaKey: "dakar/dakar/ouakam/ouakam",
      answers: {
        poste: "menage",
        horaires: { start: "08:00", end: "16:00" },
        repos: ["dimanche"],
        salaire: 90000,
        debut: isoDay(ctx, -140),
      },
      familyReview: [
        5,
        "Oumy a été d'une patience et d'une organisation rares. Nous la recommandons sans réserve.",
      ],
      endReason: "La famille part six mois à l'étranger.",
    },
    {
      family: "Famille Gueye",
      worker: "Yacine Diouf",
      formula: "ponctuelle",
      start: -12,
      end: -12,
      areaKey: "dakar/dakar/mermoz-sacre-coeur/sacre-coeur",
      answers: {
        mission_debut: isoDay(ctx, -12),
        mission_jours: 1,
        taches: ["cuisine", "evenement"],
        evenement: "Repas de Tamkharit",
        tarif_journalier: 9000,
      },
      familyReview: [
        5,
        "Repas de Tamkharit pour toute la famille : délicieux, et la cuisine rendue propre.",
      ],
    },
  ];

  let historicRokhaya: { id: string; familyUserId: string; workerUserId: string } | null = null;
  for (const h of history) {
    const req = await createRequest({
      family: h.family,
      formula: h.formula,
      daysAgo: -h.start + 8,
      areaKey: h.areaKey,
      radiusKm: 10,
      status: "pourvue",
      answers: h.answers,
    });
    const p = await createPlacement({
      request: req,
      family: h.family,
      worker: h.worker,
      formula: h.formula,
      status: "termine",
      requestedDaysAgo: -h.start + 6,
      startInDays: h.start,
      endInDays: h.end,
      followUpDone: formulasById.get(h.formula)!.kind === "longue",
      endReason: h.endReason,
    });
    review(p, "famille", h.familyReview[0], h.familyReview[1], -h.end - 1);
    if (h.workerReview) review(p, "prestataire", h.workerReview[0], h.workerReview[1], -h.end - 1);
    if (h.worker === "Rokhaya Mbaye") historicRokhaya = p;
  }

  await db.insert(s.reviews).values(reviews);

  // Notes moyennes dénormalisées sur les profils.
  await db.execute(sql`
    update worker_profiles wp set
      rating_avg = agg.avg, rating_count = agg.n
    from (
      select r.target_user_id, avg(r.rating)::real as avg, count(*)::int as n
      from reviews r where r.author_role = 'famille'
      group by r.target_user_id
    ) agg
    where agg.target_user_id = wp.user_id
  `);

  // Signalements.
  await db.insert(s.incidents).values([
    {
      reporterId: families.get("Famille Sarr")!.userId,
      placementId: p3.id,
      category: "retard_absence",
      description:
        "Seynabou est arrivée avec deux heures de retard lundi, sans prévenir. Tout se passe bien par ailleurs, nous voulions simplement le signaler.",
      status: "ouvert",
      createdAt: at(ctx, -1, 20),
    },
    {
      reporterId: workers.get("Rokhaya Mbaye")!.userId,
      placementId: historicRokhaya?.id ?? null,
      category: "salaire_conditions",
      description: "Le salaire du mois dernier a été versé avec dix jours de retard.",
      status: "resolu",
      adminNotes:
        "Famille rappelée : le retard venait d'un déplacement. Salaire versé le lendemain. À vérifier lors du prochain appel.",
      handledById: admin.id,
      resolvedAt: at(ctx, -95, 15),
      createdAt: at(ctx, -97, 9),
    },
  ]);

  const [{ n: areaCount }] = (
    await db.execute<{ n: number }>(sql`select count(*)::int as n from areas`)
  ).rows;
  const [{ n: placementCount }] = (
    await db.execute<{ n: number }>(sql`select count(*)::int as n from placements`)
  ).rows;
  const [{ n: requestCount }] = (
    await db.execute<{ n: number }>(sql`select count(*)::int as n from requests`)
  ).rows;
  await db.update(s.services).set({ updatedAt: new Date() }).where(eq(s.services.id, service.id));

  return {
    zones: areaCount,
    prestataires: WORKERS.length,
    familles: FAMILIES.length,
    demandes: requestCount,
    placements: placementCount,
    avis: reviews.length,
    documents: documentCount,
  } satisfies SeedSummary;
}
