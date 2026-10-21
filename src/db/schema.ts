import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { ServiceConfig } from "@/lib/services/config";
import { geographyMultiPolygon, geographyPoint } from "./geography";

// Vocabulaire du code : « prestataire » désigne toute personne qui propose ses services,
// quel que soit le service. Les libellés affichés viennent de la configuration du service.

export const userRole = pgEnum("user_role", ["famille", "prestataire", "agent", "admin"]);
export const userStatus = pgEnum("user_status", ["actif", "suspendu"]);
export const gender = pgEnum("gender", ["femme", "homme"]);
export const dossierStatus = pgEnum("dossier_status", [
  "en_attente",
  "en_cours",
  "verifie",
  "refuse",
  "suspendu",
]);
export const stepStatus = pgEnum("step_status", ["a_faire", "fait", "echec"]);
export const placementStatus = pgEnum("placement_status", [
  "rencontre_demandee",
  "rencontre_prevue",
  "essai",
  "confirme",
  "termine",
  "annule",
]);
export const requestStatus = pgEnum("request_status", ["ouverte", "pourvue", "fermee"]);
export const incidentStatus = pgEnum("incident_status", ["ouvert", "en_cours", "resolu"]);
export const areaLevel = pgEnum("area_level", ["region", "departement", "commune", "quartier"]);
export const searchMode = pgEnum("search_mode", ["autour", "zone"]);
export const documentKind = pgEnum("document_kind", [
  "piece_identite",
  "photo",
  "justificatif",
  "autre",
]);
export const accessAction = pgEnum("access_action", [
  "consultation",
  "televersement",
  "suppression",
  "ouverture_dossier",
]);

const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  /** Numéro au format international, ex. +221770000001. */
  phone: text().notNull().unique(),
  role: userRole().notNull(),
  status: userStatus().notNull().default("actif"),
  /** Nom affiché pour l'équipe (agents, admin). */
  name: text(),
  consentAt: timestamp({ withTimezone: true }),
  createdAt: createdAt(),
  lastLoginAt: timestamp({ withTimezone: true }),
});

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: uuid().primaryKey().defaultRandom(),
    phone: text().notNull(),
    codeHash: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    attempts: smallint().notNull().default(0),
    consumedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.phone, t.createdAt)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text().notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.userId)],
);

export const services = pgTable("services", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  /** Clé du registre d'icônes ; une clé inconnue affiche un médaillon à l'initiale. */
  icon: text().notNull(),
  /** Teinte de la palette attribuée au service. */
  hue: text().notNull(),
  active: boolean().notNull().default(false),
  sortOrder: integer().notNull().default(0),
  config: jsonb().$type<ServiceConfig>().notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const areas = pgTable(
  "areas",
  {
    id: uuid().primaryKey().defaultRandom(),
    parentId: uuid().references((): AnyPgColumn => areas.id),
    level: areaLevel().notNull(),
    name: text().notNull(),
    /** Chemin lisible et unique, ex. « dakar/dakar/mermoz-sacre-coeur/mermoz ». */
    key: text().notNull().unique(),
    /** Identifiants des ancêtres puis de la zone elle-même (région en premier). */
    pathIds: uuid().array().notNull(),
    centroid: geographyPoint().notNull(),
    boundary: geographyMultiPolygon(),
    /** Zone ouverte : elle et toutes ses sous-zones sont desservies. */
    isOpen: boolean().notNull().default(false),
    wikidataId: text(),
  },
  (t) => [
    index().on(t.parentId),
    index().on(t.level),
    index().using("gist", t.centroid),
    index().using("gin", t.pathIds),
  ],
);

export const workerProfiles = pgTable(
  "worker_profiles",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    firstName: text().notNull(),
    /** Privé : seuls le prénom et l'initiale sont affichés aux familles. */
    lastName: text().notNull(),
    gender: gender().notNull(),
    birthYear: smallint().notNull(),
    languages: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    experienceYears: smallint().notNull().default(0),
    /** Présentation rédigée par l'agent après l'entretien, visible par les familles. */
    presentation: text(),
    areaId: uuid()
      .notNull()
      .references(() => areas.id),
    /** Point approché (centre du quartier, légèrement décalé) : jamais l'adresse, jamais affiché. */
    location: geographyPoint().notNull(),
    interventionRadiusKm: smallint().notNull().default(5),
    acceptedAreaIds: uuid()
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    willingToRelocate: boolean().notNull().default(false),
    availableFrom: date(),
    monthlyRateFcfa: integer(),
    dailyRateFcfa: integer(),
    /** Identifiant public de la carte Dorwar (QR code). */
    cardId: text().notNull().unique(),
    ratingAvg: real(),
    ratingCount: integer().notNull().default(0),
    /** Réservé : photo prise par l'agent, publiée seulement avec l'accord de la personne. */
    photoKey: text(),
    consentAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index().using("gist", t.location),
    index().on(t.areaId),
    index().using("gin", t.acceptedAreaIds),
  ],
);

/** Un « dossier » : un service proposé par une personne, avec sa propre vérification. */
export const workerServices = pgTable(
  "worker_services",
  {
    id: uuid().primaryKey().defaultRandom(),
    workerProfileId: uuid()
      .notNull()
      .references(() => workerProfiles.id, { onDelete: "cascade" }),
    serviceId: uuid()
      .notNull()
      .references(() => services.id),
    formulaKeys: text().array().notNull(),
    skills: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    status: dossierStatus().notNull().default("en_attente"),
    submittedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    verifiedAt: timestamp({ withTimezone: true }),
    /** Motif de refus ou de suspension, communiqué à la personne. */
    decisionReason: text(),
    decidedAt: timestamp({ withTimezone: true }),
    decidedById: uuid().references(() => users.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex().on(t.workerProfileId, t.serviceId), index().on(t.status)],
);

export const verificationSteps = pgTable(
  "verification_steps",
  {
    id: uuid().primaryKey().defaultRandom(),
    workerServiceId: uuid()
      .notNull()
      .references(() => workerServices.id, { onDelete: "cascade" }),
    /** Clé de l'étape dans la configuration du service. */
    type: text().notNull(),
    sortOrder: smallint().notNull(),
    status: stepStatus().notNull().default("a_faire"),
    /** Notes privées de l'agent. */
    notes: text(),
    agentId: uuid().references(() => users.id),
    completedAt: timestamp({ withTimezone: true }),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex().on(t.workerServiceId, t.type)],
);

/** Fichiers privés : jamais servis publiquement, lus seulement par l'équipe, chaque accès est journalisé. */
export const documents = pgTable(
  "documents",
  {
    id: uuid().primaryKey().defaultRandom(),
    workerProfileId: uuid()
      .notNull()
      .references(() => workerProfiles.id, { onDelete: "cascade" }),
    verificationStepId: uuid().references(() => verificationSteps.id, { onDelete: "set null" }),
    kind: documentKind().notNull(),
    storageKey: text().notNull().unique(),
    mimeType: text().notNull(),
    sizeBytes: integer().notNull(),
    label: text(),
    uploadedById: uuid()
      .notNull()
      .references(() => users.id),
    createdAt: createdAt(),
    deletedAt: timestamp({ withTimezone: true }),
  },
  (t) => [index().on(t.workerProfileId)],
);

export const accessLogs = pgTable(
  "access_logs",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id),
    action: accessAction().notNull(),
    documentId: uuid().references(() => documents.id, { onDelete: "set null" }),
    workerProfileId: uuid().references(() => workerProfiles.id, { onDelete: "set null" }),
    ip: text(),
    at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.at), index().on(t.workerProfileId)],
);

export const familyProfiles = pgTable("family_profiles", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Nom présenté aux personnes rencontrées, ex. « Famille Diallo ». */
  displayName: text().notNull(),
  areaId: uuid().references(() => areas.id),
  phoneVerifiedAt: timestamp({ withTimezone: true }).notNull(),
  commitmentsAcceptedAt: timestamp({ withTimezone: true }),
  createdAt: createdAt(),
});

export const requests = pgTable(
  "requests",
  {
    id: uuid().primaryKey().defaultRandom(),
    familyUserId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    serviceId: uuid()
      .notNull()
      .references(() => services.id),
    formulaKey: text().notNull(),
    /** Réponses validées du formulaire propre au service. */
    answers: jsonb().$type<Record<string, unknown>>().notNull(),
    searchMode: searchMode().notNull(),
    /** Zone choisie, ou quartier le plus proche de la position partagée. */
    areaId: uuid()
      .notNull()
      .references(() => areas.id),
    /** Position arrondie (environ 100 m) ou centre de la zone. */
    location: geographyPoint().notNull(),
    radiusKm: smallint(),
    status: requestStatus().notNull().default("ouverte"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.familyUserId)],
);

export const placements = pgTable(
  "placements",
  {
    id: uuid().primaryKey().defaultRandom(),
    requestId: uuid()
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    workerServiceId: uuid()
      .notNull()
      .references(() => workerServices.id),
    familyUserId: uuid()
      .notNull()
      .references(() => users.id),
    workerProfileId: uuid()
      .notNull()
      .references(() => workerProfiles.id),
    serviceId: uuid()
      .notNull()
      .references(() => services.id),
    formulaKey: text().notNull(),
    status: placementStatus().notNull().default("rencontre_demandee"),
    familyMessage: text(),
    meetingAt: timestamp({ withTimezone: true }),
    meetingPlace: text(),
    startDate: date(),
    endDate: date(),
    agreedMonthlyFcfa: integer(),
    agreedDailyFcfa: integer(),
    restDays: text().array(),
    /** Conditions convenues, écrites, acceptées des deux côtés. */
    conditions: text(),
    familyAcceptedAt: timestamp({ withTimezone: true }),
    workerAcceptedAt: timestamp({ withTimezone: true }),
    guaranteeEndsAt: date(),
    followUpDueAt: date(),
    followUpDoneAt: timestamp({ withTimezone: true }),
    followUpNotes: text(),
    followUpById: uuid().references(() => users.id),
    scheduledAt: timestamp({ withTimezone: true }),
    trialStartedAt: timestamp({ withTimezone: true }),
    confirmedAt: timestamp({ withTimezone: true }),
    endedAt: timestamp({ withTimezone: true }),
    endReason: text(),
    /** Placement remplacé au titre de la garantie. */
    replacesPlacementId: uuid().references((): AnyPgColumn => placements.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index().on(t.familyUserId),
    index().on(t.workerProfileId),
    index().on(t.status),
    index().on(t.requestId),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid().primaryKey().defaultRandom(),
    placementId: uuid()
      .notNull()
      .references(() => placements.id, { onDelete: "cascade" }),
    authorId: uuid()
      .notNull()
      .references(() => users.id),
    targetUserId: uuid()
      .notNull()
      .references(() => users.id),
    authorRole: userRole().notNull(),
    rating: smallint().notNull(),
    comment: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex().on(t.placementId, t.authorId),
    index().on(t.targetUserId),
    check("reviews_rating_range", sql`${t.rating} between 1 and 5`),
  ],
);

export const incidents = pgTable(
  "incidents",
  {
    id: uuid().primaryKey().defaultRandom(),
    reporterId: uuid()
      .notNull()
      .references(() => users.id),
    placementId: uuid().references(() => placements.id, { onDelete: "set null" }),
    category: text().notNull(),
    description: text().notNull(),
    status: incidentStatus().notNull().default("ouvert"),
    adminNotes: text(),
    handledById: uuid().references(() => users.id),
    resolvedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.status)],
);

export const waitlist = pgTable(
  "waitlist",
  {
    id: uuid().primaryKey().defaultRandom(),
    phone: text().notNull(),
    userId: uuid().references(() => users.id, { onDelete: "set null" }),
    areaId: uuid()
      .notNull()
      .references(() => areas.id),
    serviceId: uuid().references(() => services.id),
    formulaKey: text(),
    createdAt: createdAt(),
    notifiedAt: timestamp({ withTimezone: true }),
  },
  (t) => [uniqueIndex().on(t.phone, t.areaId, t.serviceId)],
);

export const settings = pgTable("settings", {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  updatedAt: updatedAt(),
  updatedById: uuid().references(() => users.id),
});

export type User = typeof users.$inferSelect;
export type UserRole = (typeof userRole.enumValues)[number];
export type DossierStatus = (typeof dossierStatus.enumValues)[number];
export type StepStatus = (typeof stepStatus.enumValues)[number];
export type PlacementStatus = (typeof placementStatus.enumValues)[number];
export type IncidentStatus = (typeof incidentStatus.enumValues)[number];
export type AreaLevel = (typeof areaLevel.enumValues)[number];
export type Area = typeof areas.$inferSelect;
export type Service = typeof services.$inferSelect;
export type WorkerProfile = typeof workerProfiles.$inferSelect;
export type WorkerService = typeof workerServices.$inferSelect;
export type VerificationStep = typeof verificationSteps.$inferSelect;
export type Placement = typeof placements.$inferSelect;
export type Request = typeof requests.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Incident = typeof incidents.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
