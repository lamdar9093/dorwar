import { type NextRequest, NextResponse } from "next/server";
import { getAreaChildren } from "@/lib/areas";

/** Sous-zones d'une zone (ou les régions) pour la recherche « par zone ». Données publiques. */
export async function GET(request: NextRequest) {
  const parent = request.nextUrl.searchParams.get("parent");
  if (parent && !/^[0-9a-f-]{36}$/i.test(parent)) {
    return NextResponse.json({ error: "Zone invalide" }, { status: 400 });
  }
  const children = await getAreaChildren(parent);
  return NextResponse.json(
    children.map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level,
      isOpen: c.isOpen,
      childCount: c.childCount,
    })),
    { headers: { "Cache-Control": "public, max-age=600" } },
  );
}
