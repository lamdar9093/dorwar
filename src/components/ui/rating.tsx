import { Icon } from "@/components/icons";

const decimal = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** « 4,8 · 6 avis », ou « Nouveau profil » sans avis. */
export function Rating({ avg, count }: { avg: number | null; count: number }) {
  if (!count || avg == null) {
    return <span className="text-sm text-gris-700">Nouveau profil, pas encore d’avis</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-indigo-900">
      <Icon name="etoile" size={18} className="fill-ocre-500 text-terre-700" strokeWidth={1.4} />
      <span className="font-bold">{decimal.format(avg)}</span>
      <span className="text-gris-700">· {count} avis</span>
    </span>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="etoile"
          size={18}
          strokeWidth={1.4}
          className={n <= value ? "fill-ocre-500 text-terre-700" : "text-trait"}
        />
      ))}
    </span>
  );
}
