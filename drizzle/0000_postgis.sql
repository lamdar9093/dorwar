-- PostGIS fournit le type geography et les calculs de distance (extension disponible sur Neon).
CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint
-- Domaines utilisés par le schéma Drizzle (voir src/db/geography.ts).
CREATE DOMAIN geo_point AS geography(Point, 4326);
--> statement-breakpoint
CREATE DOMAIN geo_multipolygon AS geography(MultiPolygon, 4326);
