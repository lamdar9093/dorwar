"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";

/**
 * « Écouter » : lit le texte à voix haute avec la synthèse vocale du téléphone (en français).
 * Pour les personnes qui lisent difficilement. Masqué si l'appareil n'a pas de voix française.
 */
export function ListenButton({ text, label = "Écouter" }: { text: string; label?: string }) {
  const [available, setAvailable] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const check = () =>
      setAvailable(
        window.speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().startsWith("fr")),
      );
    check();
    window.speechSynthesis.addEventListener("voiceschanged", check);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", check);
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!available) return null;

  const speak = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.92;
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("fr"));
    if (voice) utterance.voice = voice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(utterance);
  };

  return (
    <button
      type="button"
      onClick={speak}
      aria-pressed={speaking}
      className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border-[1.5px] border-indigo-900 px-4 font-bold text-indigo-900 hover:bg-indigo-900 hover:text-sable-50 aria-pressed:bg-indigo-900 aria-pressed:text-sable-50"
    >
      <Icon name="ecouter" size={22} />
      {speaking ? "Arrêter" : label}
    </button>
  );
}
