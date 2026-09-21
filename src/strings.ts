// Copyright (c) 2026 Benjamin Benno Falkner
// SPDX-License-Identifier: MIT

// Widget texts, English and German. The language follows the closest [lang]
// attribute above the quiz container; anything that isn't German is English.

export interface Strings {
  loading: string;
  loadFailedNoBackup: (url: string) => string;
  noSource: string;
  unreadable: string;
  noQuestions: string;
  summary: (count: number) => string;
  start: string;
  progress: (current: number, total: number) => string;
  next: string;
  showResult: string;
  score: (correct: number, total: number) => string;
  retry: string;
  fullscreen: string;
  exitFullscreen: string;
  fullscreenFailed: string;
}

const EN: Strings = {
  loading: 'Loading questions …',
  loadFailedNoBackup: (url) => `Could not load the questions from ${url}, and no data-content backup is set.`,
  noSource: 'Neither data-content nor data-url given.',
  unreadable: 'Could not read the questions (data-content).',
  noQuestions: 'No valid questions found.',
  summary: (n) => `${n} ${n === 1 ? 'question' : 'questions'} · random order`,
  start: 'Start quiz',
  progress: (c, t) => `Question ${c} / ${t}`,
  next: 'Next',
  showResult: 'Show result',
  score: (c, t) => `${c} of ${t} correct`,
  retry: 'Try again',
  fullscreen: 'Fullscreen',
  exitFullscreen: 'Exit fullscreen',
  fullscreenFailed: 'Could not toggle fullscreen.',
};

const DE: Strings = {
  loading: 'Fragen werden geladen …',
  loadFailedNoBackup: (url) => `Fragen konnten nicht von ${url} geladen werden und es ist kein data-content als Backup hinterlegt.`,
  noSource: 'Kein data-content und keine data-url angegeben.',
  unreadable: 'Fragen (data-content) konnten nicht gelesen werden.',
  noQuestions: 'Keine gültigen Fragen gefunden.',
  summary: (n) => `${n} ${n === 1 ? 'Frage' : 'Fragen'} · zufällige Reihenfolge`,
  start: 'Quiz starten',
  progress: (c, t) => `Frage ${c} / ${t}`,
  next: 'Weiter',
  showResult: 'Ergebnis anzeigen',
  score: (c, t) => `${c} von ${t} Fragen richtig`,
  retry: 'Nochmal versuchen',
  fullscreen: 'Vollbild',
  exitFullscreen: 'Vollbild verlassen',
  fullscreenFailed: 'Vollbild konnte nicht umgeschaltet werden.',
};

export function stringsFor(container: HTMLElement): Strings {
  const lang = container.closest('[lang]')?.getAttribute('lang')?.trim() ?? '';
  return /^de(?:-|$)/i.test(lang) ? DE : EN;
}
