import type { Metadata } from "next";
import { ActionForm } from "@/components/ui/action-form";
import { Hint, Label, TextInput } from "@/components/ui/field";
import { ServiceMark } from "@/components/ui/service-mark";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSpace } from "@/lib/auth/guards";
import { getAllServices } from "@/lib/services/repository";
import { getSettings } from "@/lib/settings";
import { updateServiceParams, updateWhatsapp } from "../actions";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  await requireSpace("admin", "/admin/parametres");
  const [settings, services] = await Promise.all([getSettings(), getAllServices()]);
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <h1 className="text-4xl">Paramètres</h1>

      <section className="rounded-md border border-ligne bg-white p-5 sm:p-6">
        <h2 className="text-2xl">Contact WhatsApp de l’équipe</h2>
        <ActionForm action={updateWhatsapp} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="whatsapp">Numéro, indicatif compris</Label>
            <TextInput
              id="whatsapp"
              name="whatsapp"
              inputMode="numeric"
              defaultValue={settings.whatsappNumber ?? ""}
              placeholder="221771234567"
            />
            <Hint>
              Sans « + » ni espaces. Utilisé par tous les boutons « Parler à l’équipe Dorwar sur
              WhatsApp ».
            </Hint>
          </div>
          <SubmitButton pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
        </ActionForm>
      </section>

      {services.map((s) => (
        <section key={s.id} className="rounded-md border border-ligne bg-white p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <ServiceMark icon={s.icon} name={s.name} hue={s.hue} size="sm" />
            <h2 className="text-2xl">{s.name}</h2>
          </div>
          <ActionForm action={updateServiceParams} className="mt-5 space-y-6">
            <input type="hidden" name="service" value={s.id} />
            <label className="flex min-h-12 items-center gap-3 font-bold">
              <input
                type="checkbox"
                name="actif"
                value="oui"
                defaultChecked={s.active}
                className="size-5 accent-indigo-900"
              />
              Service ouvert aux familles
            </label>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-ligne">
                    <th className="py-2 pr-4">Formule</th>
                    <th className="py-2 pr-4">Garantie (jours)</th>
                    <th className="py-2">Frais de dossier (FCFA)</th>
                  </tr>
                </thead>
                <tbody>
                  {s.config.formulas.map((f) => (
                    <tr key={f.key} className="border-b border-ligne last:border-0">
                      <td className="py-3 pr-4 font-bold">{f.label}</td>
                      <td className="py-3 pr-4">
                        <label className="sr-only" htmlFor={`garantie_${s.id}_${f.key}`}>
                          Garantie pour {f.label}
                        </label>
                        <TextInput
                          id={`garantie_${s.id}_${f.key}`}
                          name={`garantie_${f.key}`}
                          type="number"
                          min={0}
                          max={365}
                          defaultValue={s.config.guarantees[f.key]?.days ?? 0}
                          className="w-28!"
                        />
                      </td>
                      <td className="py-3">
                        <label className="sr-only" htmlFor={`frais_${s.id}_${f.key}`}>
                          Frais pour {f.label}
                        </label>
                        <TextInput
                          id={`frais_${s.id}_${f.key}`}
                          name={`frais_${f.key}`}
                          inputMode="numeric"
                          defaultValue={s.config.fees[f.key]?.amountFcfa ?? 0}
                          className="w-36!"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gris-700">
              Les textes, le formulaire et les étapes de vérification d’un service se modifient dans
              sa configuration (voir le README, « Ajouter un service »).
            </p>
            <SubmitButton pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
          </ActionForm>
        </section>
      ))}
    </div>
  );
}
