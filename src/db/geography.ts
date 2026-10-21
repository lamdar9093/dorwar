import { customType } from "drizzle-orm/pg-core";

export type LngLat = { lng: number; lat: number };

/** Décode un point EWKB hexadécimal tel que PostGIS le renvoie pour une colonne `geography`. */
export function parseEwkbPoint(hex: string): LngLat {
  const buf = Buffer.from(hex, "hex");
  const littleEndian = buf.readUInt8(0) === 1;
  const type = littleEndian ? buf.readUInt32LE(1) : buf.readUInt32BE(1);
  const hasSrid = (type & 0x20000000) !== 0;
  const offset = hasSrid ? 9 : 5;
  const readDouble = (at: number) => (littleEndian ? buf.readDoubleLE(at) : buf.readDoubleBE(at));
  return { lng: readDouble(offset), lat: readDouble(offset + 8) };
}

export function toEwkt({ lng, lat }: LngLat): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

/**
 * Point géographique WGS84 : les distances PostGIS sont calculées en mètres.
 * `geo_point` est un domaine sur `geography(Point,4326)` créé par la première migration :
 * drizzle-kit met le nom du type entre guillemets, ce qu'un type paramétré ne supporte pas.
 */
export const geographyPoint = customType<{ data: LngLat; driverData: string }>({
  dataType() {
    return "geo_point";
  },
  toDriver(value) {
    return toEwkt(value);
  },
  fromDriver(value) {
    return parseEwkbPoint(value);
  },
});

/** Contour d'une zone, réservé pour un référentiel officiel futur (non lu par l'application). */
export const geographyMultiPolygon = customType<{ data: string; driverData: string }>({
  dataType() {
    return "geo_multipolygon";
  },
});
