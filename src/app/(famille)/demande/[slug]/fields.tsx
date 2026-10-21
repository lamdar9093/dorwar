"use client";

import { ChoiceCard, ChoiceChip } from "@/components/ui/choice";
import {
  describedBy,
  FieldError,
  Hint,
  inputClasses,
  Label,
  TextArea,
  TextInput,
} from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/lib/cn";
import { WEEK_DAYS, type TimeRangeAnswer } from "@/lib/form-engine/constants";
import type { FieldSpec } from "@/lib/form-engine/schema";
import { addDaysIso, formatNumber } from "@/lib/format";
import {
  LocationField,
  type AreaGroup,
  type LocationValue,
  type ZoneOption,
} from "./location-field";

export type FormulaOption = {
  key: string;
  label: string;
  shortLabel: string;
  summary: string;
  icon: string;
};

export type FieldContext = {
  formulas: FormulaOption[];
  areaGroups: AreaGroup[];
  regions: ZoneOption[];
  today: string;
};

type Props = {
  field: FieldSpec;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  ctx: FieldContext;
};

const id = (field: FieldSpec) => `champ-${field.key}`;

export function FieldRenderer({ field, value, onChange, error, ctx }: Props) {
  switch (field.type) {
    case "formula":
      return (
        <fieldset aria-describedby={error ? `${id(field)}-erreur` : undefined}>
          <legend className="sr-only">{field.label}</legend>
          <div className="space-y-3">
            {ctx.formulas.map((f) => (
              <ChoiceCard
                key={f.key}
                name={field.key}
                value={f.key}
                checked={value === f.key}
                onChange={() => onChange(f.key)}
                label={f.label}
                description={f.summary}
                icon={f.icon}
                scale="lg"
              />
            ))}
          </div>
          <FieldError id={`${id(field)}-erreur`}>{error}</FieldError>
        </fieldset>
      );

    case "choice":
      return (
        <fieldset aria-describedby={describedBy(id(field), { hint: field.hint, error })}>
          <legend className="mb-3 text-base font-bold">{field.label}</legend>
          <div className={cn("grid gap-3", field.options.length > 2 && "sm:grid-cols-2")}>
            {field.options.map((o) => (
              <ChoiceCard
                key={o.value}
                name={field.key}
                value={o.value}
                checked={value === o.value}
                onChange={() => onChange(o.value)}
                label={o.label}
                description={o.description}
                icon={o.icon}
              />
            ))}
          </div>
          {field.hint && <Hint id={`${id(field)}-aide`}>{field.hint}</Hint>}
          <FieldError id={`${id(field)}-erreur`}>{error}</FieldError>
        </fieldset>
      );

    case "multi_choice": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (v: string) =>
        onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);
      const withIcons = field.options.some((o) => o.icon);
      return (
        <fieldset aria-describedby={describedBy(id(field), { hint: field.hint, error })}>
          <legend className="mb-3 text-base font-bold">
            {field.label}
            {!field.required && (
              <span className="ml-2 text-sm font-normal text-gris-700">facultatif</span>
            )}
          </legend>
          {withIcons ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {field.options.map((o) => (
                <ChoiceCard
                  key={o.value}
                  type="checkbox"
                  name={field.key}
                  value={o.value}
                  checked={selected.includes(o.value)}
                  onChange={() => toggle(o.value)}
                  label={o.label}
                  description={o.description}
                  icon={o.icon}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {field.options.map((o) => (
                <ChoiceChip
                  key={o.value}
                  name={field.key}
                  value={o.value}
                  checked={selected.includes(o.value)}
                  onChange={() => toggle(o.value)}
                  label={o.label}
                />
              ))}
            </div>
          )}
          {field.hint && <Hint id={`${id(field)}-aide`}>{field.hint}</Hint>}
          <FieldError id={`${id(field)}-erreur`}>{error}</FieldError>
        </fieldset>
      );
    }

    case "text":
      return (
        <div>
          <Label htmlFor={id(field)} optional={!field.required}>
            {field.label}
          </Label>
          <TextInput
            id={id(field)}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(id(field), { hint: field.hint, error })}
          />
          {field.hint && <Hint id={`${id(field)}-aide`}>{field.hint}</Hint>}
          <FieldError id={`${id(field)}-erreur`}>{error}</FieldError>
        </div>
      );

    case "textarea": {
      const text = typeof value === "string" ? value : "";
      return (
        <div>
          <Label htmlFor={id(field)} optional={!field.required}>
            {field.label}
          </Label>
          <TextArea
            id={id(field)}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            rows={5}
            aria-invalid={error ? true : undefined}
            aria-describedby={`${id(field)}-compte`}
          />
          <p id={`${id(field)}-compte`} className="mt-2 text-right text-sm text-gris-700">
            {formatNumber(text.length)} / {formatNumber(field.maxLength)}
          </p>
          <FieldError id={`${id(field)}-erreur`}>{error}</FieldError>
        </div>
      );
    }

    case "number": {
      const n = typeof value === "number" ? value : undefined;
      const set = (next: number) => onChange(Math.min(field.max, Math.max(field.min, next)));
      return (
        <div>
          <Label htmlFor={id(field)}>{field.label}</Label>
          <div className="flex items-stretch gap-2">
            <button
              type="button"
              onClick={() => set((n ?? field.min + 1) - 1)}
              className="flex size-13 items-center justify-center rounded-sm border-[1.5px] border-indigo-900 text-2xl font-bold"
              aria-label="Un de moins"
            >
              −
            </button>
            <input
              id={id(field)}
              type="number"
              inputMode="numeric"
              min={field.min}
              max={field.max}
              value={n ?? ""}
              onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy(id(field), { error })}
              className={cn(inputClasses, "w-24! text-center text-xl font-bold")}
            />
            <button
              type="button"
              onClick={() => set((n ?? field.min - 1) + 1)}
              className="flex size-13 items-center justify-center rounded-sm border-[1.5px] border-indigo-900 text-2xl font-bold"
              aria-label="Un de plus"
            >
              +
            </button>
            {field.unit && <span className="self-center pl-1 text-gris-700">{field.unit}</span>}
          </div>
          <FieldError id={`${id(field)}-erreur`}>{error}</FieldError>
        </div>
      );
    }

    case "money": {
      const n = typeof value === "number" ? value : undefined;
      return (
        <div>
          <Label htmlFor={id(field)}>{field.label}</Label>
          <div
            className={cn(
              "flex min-h-13 items-stretch overflow-hidden rounded-sm border-[1.5px] bg-white focus-within:border-indigo-900",
              error ? "border-rouge-700" : "border-trait",
            )}
          >
            <input
              id={id(field)}
              inputMode="numeric"
              autoComplete="off"
              value={n === undefined ? "" : formatNumber(n)}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                onChange(digits ? Number(digits) : undefined);
              }}
              placeholder={formatNumber(field.min * 3)}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy(id(field), { hint: field.hint, error })}
              className="min-w-0 flex-1 px-4 text-xl font-bold text-indigo-900 outline-none"
            />
            <span className="flex items-center border-l border-ligne bg-sable-100 px-4 text-sm font-bold whitespace-nowrap text-indigo-900">
              {field.unit}
            </span>
          </div>
          {field.hint && <Hint id={`${id(field)}-aide`}>{field.hint}</Hint>}
          <FieldError id={`${id(field)}-erreur`}>{error}</FieldError>
        </div>
      );
    }

    case "date":
      return (
        <div>
          <Label htmlFor={id(field)}>{field.label}</Label>
          <TextInput
            id={id(field)}
            type="date"
            min={addDaysIso(ctx.today, field.minDaysFromToday)}
            max={addDaysIso(ctx.today, field.maxDaysFromToday)}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value || undefined)}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(id(field), { hint: field.hint, error })}
            className="max-w-xs"
          />
          {field.hint && <Hint id={`${id(field)}-aide`}>{field.hint}</Hint>}
          <FieldError id={`${id(field)}-erreur`}>{error}</FieldError>
        </div>
      );

    case "time_range": {
      const range = (value as TimeRangeAnswer | undefined) ?? { start: "", end: "" };
      return (
        <fieldset aria-describedby={describedBy(id(field), { hint: field.hint, error })}>
          <legend className="mb-3 text-base font-bold">{field.label}</legend>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor={`${id(field)}-debut`} className="mb-1 block text-sm text-gris-700">
                De
              </label>
              <TextInput
                id={`${id(field)}-debut`}
                type="time"
                step={900}
                value={range.start}
                onChange={(e) => onChange({ ...range, start: e.target.value })}
                className="w-36!"
              />
            </div>
            <div>
              <label htmlFor={`${id(field)}-fin`} className="mb-1 block text-sm text-gris-700">
                À
              </label>
              <TextInput
                id={`${id(field)}-fin`}
                type="time"
                step={900}
                value={range.end}
                onChange={(e) => onChange({ ...range, end: e.target.value })}
                className="w-36!"
              />
            </div>
          </div>
          {field.hint && <Hint id={`${id(field)}-aide`}>{field.hint}</Hint>}
          <FieldError id={`${id(field)}-erreur`}>{error}</FieldError>
        </fieldset>
      );
    }

    case "days_of_week": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (d: string) =>
        onChange(
          selected.includes(d)
            ? selected.filter((s) => s !== d)
            : WEEK_DAYS.filter((w) => w === d || selected.includes(w)),
        );
      return (
        <fieldset aria-describedby={describedBy(id(field), { hint: field.hint, error })}>
          <legend className="mb-3 text-base font-bold">{field.label}</legend>
          <div className="flex flex-wrap gap-2">
            {WEEK_DAYS.map((d) => (
              <ChoiceChip
                key={d}
                name={field.key}
                value={d}
                checked={selected.includes(d)}
                onChange={() => toggle(d)}
                label={d.charAt(0).toUpperCase() + d.slice(1)}
              />
            ))}
          </div>
          {field.hint && <Hint id={`${id(field)}-aide`}>{field.hint}</Hint>}
          <FieldError id={`${id(field)}-erreur`}>{error}</FieldError>
        </fieldset>
      );
    }

    case "location":
      return (
        <LocationField
          value={value as LocationValue | undefined}
          onChange={onChange}
          areaGroups={ctx.areaGroups}
          regions={ctx.regions}
          error={error}
        />
      );

    case "consent": {
      const accepted = Array.isArray(value) ? (value as number[]) : [];
      return (
        <fieldset>
          <legend className="mb-3 text-base font-bold">{field.label}</legend>
          <div className="space-y-3">
            {field.items.map((item, i) => (
              <label
                key={item}
                className="flex min-h-14 cursor-pointer items-start gap-3 rounded-md border-[1.5px] border-trait bg-white p-4 has-checked:border-indigo-900 has-checked:bg-sable-50"
              >
                <input
                  type="checkbox"
                  checked={accepted.includes(i)}
                  onChange={() =>
                    onChange(
                      accepted.includes(i)
                        ? accepted.filter((a) => a !== i)
                        : [...accepted, i].sort(),
                    )
                  }
                  className="mt-1 size-5 shrink-0 accent-indigo-900"
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
          <FieldError>{error}</FieldError>
        </fieldset>
      );
    }

    case "info":
      return (
        <Notice tone="info" title={field.label}>
          {field.body}
        </Notice>
      );

    case "voice_note":
      return null;
  }
}
