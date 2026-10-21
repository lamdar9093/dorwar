import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { familyProfiles, users, workerProfiles } from "@/db/schema";
import { ActionForm } from "@/components/ui/action-form";
import { Label, Select, TextInput } from "@/components/ui/field";
import { Pill } from "@/components/ui/pill";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSpace } from "@/lib/auth/guards";
import { cn } from "@/lib/cn";
import { formatDate, formatPhone } from "@/lib/format";
import { createStaff, setUserStatus } from "../actions";

export const metadata: Metadata = { title: "Utilisateurs" };

const ROLES = [
  { key: "", label: "Tous" },
  { key: "famille", label: "Familles" },
  { key: "prestataire", label: "Prestataires" },
  { key: "agent", label: "Agents" },
  { key: "admin", label: "Admins" },
] as const;

export default async function UsersPage({ searchParams }: PageProps<"/admin/utilisateurs">) {
  const admin = await requireSpace("admin", "/admin/utilisateurs");
  const query = await searchParams;
  const role = ROLES.find((r) => r.key === query.role)?.key ?? "";
  const q = typeof query.q === "string" ? query.q.trim() : "";
  const conditions: SQL[] = [];
  if (role) conditions.push(eq(users.role, role));
  if (q) {
    const like = `%${q.replace(/[%_]/g, "")}%`;
    conditions.push(
      or(
        ilike(users.phone, `%${q.replace(/\D/g, "") || "x"}%`),
        ilike(users.name, like),
        ilike(familyProfiles.displayName, like),
        ilike(workerProfiles.firstName, like),
        ilike(workerProfiles.lastName, like),
      )!,
    );
  }
  const rows = await db
    .select({
      id: users.id,
      phone: users.phone,
      role: users.role,
      status: users.status,
      name: users.name,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
      familyName: familyProfiles.displayName,
      firstName: workerProfiles.firstName,
      lastName: workerProfiles.lastName,
    })
    .from(users)
    .leftJoin(familyProfiles, eq(familyProfiles.userId, users.id))
    .leftJoin(workerProfiles, eq(workerProfiles.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(300);

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <h1 className="text-4xl">Utilisateurs</h1>
        <form className="mt-6 flex gap-2" action="/admin/utilisateurs" role="search">
          <input type="hidden" name="role" value={role} />
          <label htmlFor="q" className="sr-only">
            Rechercher
          </label>
          <TextInput id="q" name="q" defaultValue={q} placeholder="Nom ou téléphone" />
          <button
            type="submit"
            className="min-h-13 rounded-sm bg-indigo-900 px-5 font-bold text-sable-50"
          >
            Chercher
          </button>
        </form>
        <nav aria-label="Filtrer par rôle" className="mt-4 flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <Link
              key={r.key}
              href={`/admin/utilisateurs${r.key ? `?role=${r.key}` : ""}`}
              aria-current={r.key === role ? "true" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-4 font-bold",
                r.key === role ? "bg-indigo-900 text-sable-50" : "border border-trait bg-white",
              )}
            >
              {r.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 overflow-x-auto rounded-md border border-ligne bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-ligne bg-sable-100">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Inscription</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-b border-ligne last:border-0">
                  <td className="px-4 py-3 font-bold">
                    {u.name ?? u.familyName ?? (u.firstName ? `${u.firstName} ${u.lastName}` : "—")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatPhone(u.phone)}</td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    {u.id === admin.id ? (
                      <Pill tone="succes">Vous</Pill>
                    ) : (
                      <ActionForm action={setUserStatus}>
                        <input type="hidden" name="utilisateur" value={u.id} />
                        <input
                          type="hidden"
                          name="statut"
                          value={u.status === "actif" ? "suspendu" : "actif"}
                        />
                        <span className="flex items-center gap-2">
                          <Pill tone={u.status === "actif" ? "succes" : "danger"}>
                            {u.status === "actif" ? "Actif" : "Suspendu"}
                          </Pill>
                          <SubmitButton variant="quiet" pendingLabel="…">
                            {u.status === "actif" ? "Suspendre" : "Réactiver"}
                          </SubmitButton>
                        </span>
                      </ActionForm>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <aside className="lg:col-span-4">
        <section className="rounded-md border border-ligne bg-white p-5">
          <h2 className="text-2xl">Ajouter un membre de l’équipe</h2>
          <p className="mt-1 text-sm text-gris-700">
            Il ou elle se connectera avec ce numéro et un code, comme tout le monde.
          </p>
          <ActionForm action={createStaff} className="mt-4 space-y-4" resetOnSuccess>
            <div>
              <Label htmlFor="nom">Nom</Label>
              <TextInput id="nom" name="nom" required />
            </div>
            <div>
              <Label htmlFor="telephone">Téléphone mobile</Label>
              <TextInput
                id="telephone"
                name="telephone"
                inputMode="tel"
                placeholder="77 123 45 67"
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Rôle</Label>
              <Select id="role" name="role" defaultValue="agent">
                <option value="agent">Agent de terrain</option>
                <option value="admin">Admin</option>
              </Select>
            </div>
            <SubmitButton pendingLabel="Ajout…">Ajouter</SubmitButton>
          </ActionForm>
        </section>
      </aside>
    </div>
  );
}
