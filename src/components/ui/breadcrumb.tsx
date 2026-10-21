import Link from "next/link";
import { Fragment } from "react";

/** Fil d'Ariane : le dernier élément est la page courante. */
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Fil d’Ariane" className="text-sm text-gris-700">
      {items.map((item, i) => (
        <Fragment key={item.label}>
          {i > 0 && <span aria-hidden="true"> / </span>}
          {item.href ? (
            <Link
              href={item.href}
              className="underline decoration-ligne underline-offset-4 hover:decoration-indigo-900"
            >
              {item.label}
            </Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
