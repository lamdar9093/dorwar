import type { Answers } from "./constants";
import type { Condition, FieldSpec, FormStep, NeedForm, ShowIf } from "./schema";

function hasValue(value: unknown): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim() !== "";
  return true;
}

function matches(condition: Condition, answers: Answers): boolean {
  const value = answers[condition.field];
  if (condition.filled && !hasValue(value)) return false;
  if (condition.in) {
    const accepted = condition.in;
    if (Array.isArray(value)) return value.some((v) => accepted.includes(String(v)));
    return value != null && accepted.includes(String(value));
  }
  return true;
}

export function isShown(showIf: ShowIf | undefined, answers: Answers): boolean {
  if (!showIf) return true;
  if ("any" in showIf) return showIf.any.some((c) => matches(c, answers));
  if ("all" in showIf) return showIf.all.every((c) => matches(c, answers));
  return matches(showIf, answers);
}

/** Champs affichés d'une étape. Les types réservés (note vocale) ne sont pas encore rendus. */
export function visibleFields(step: FormStep, answers: Answers): FieldSpec[] {
  return step.fields.filter((f) => f.type !== "voice_note" && isShown(f.showIf, answers));
}

export function visibleSteps(form: NeedForm, answers: Answers): FormStep[] {
  return form.steps.filter(
    (s) => isShown(s.showIf, answers) && visibleFields(s, answers).length > 0,
  );
}

/**
 * Retire les réponses des champs devenus invisibles (branche abandonnée en cours de route).
 * Répété jusqu'à stabilité, car un champ masqué peut en masquer un autre.
 */
export function pruneAnswers(form: NeedForm, answers: Answers): Answers {
  let current: Answers = { ...answers };
  for (let i = 0; i < 10; i++) {
    const keep = new Set<string>();
    for (const step of visibleSteps(form, current)) {
      for (const field of visibleFields(step, current)) keep.add(field.key);
    }
    const next: Answers = {};
    for (const [k, v] of Object.entries(current)) if (keep.has(k)) next[k] = v;
    if (Object.keys(next).length === Object.keys(current).length) return next;
    current = next;
  }
  return current;
}

export function findField(form: NeedForm, type: FieldSpec["type"]): FieldSpec | undefined {
  for (const step of form.steps)
    for (const field of step.fields) if (field.type === type) return field;
  return undefined;
}
