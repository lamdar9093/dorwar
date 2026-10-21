import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import { ServiceMark } from "@/components/ui/service-mark";
import { requireSpace } from "@/lib/auth/guards";
import { getActiveServices } from "@/lib/services/repository";

export const metadata = { title: "Nouvelle demande" };

/** Choix du service. Avec un seul service ouvert, on y va directement. */
export default async function NewRequestPage() {
  await requireSpace("famille", "/demande");
  const services = await getActiveServices();
  if (services.length === 1) redirect(`/demande/${services[0].slug}`);
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-4xl">De quoi avez-vous besoin ?</h1>
      <ul className="mt-8 border-t border-indigo-900">
        {services.map((s) => (
          <li key={s.id} className="border-b border-ligne">
            <Link
              href={`/demande/${s.slug}`}
              className="group flex min-h-20 items-center gap-4 py-4"
            >
              <ServiceMark icon={s.icon} name={s.name} hue={s.hue} />
              <span className="flex-1">
                <span className="block text-xl font-bold group-hover:underline">{s.name}</span>
                <span className="block text-gris-700">{s.config.tagline}</span>
              </span>
              <Icon name="arrowRight" size={22} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
