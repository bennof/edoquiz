// Copyright (c) 2026 Benjamin Benno Falkner
// SPDX-License-Identifier: MIT

import { QuizWidget } from './quiz';

export { QuizWidget };
export type { QuizOption, QuizQuestion, QuizQuestionSource, QuizResult, QuizCompletedDetail } from './types';

const initialized = new WeakSet<HTMLElement>();

/** Initializes a single quiz container element (creates a new QuizWidget). */
export function init(el: HTMLElement): QuizWidget {
  initialized.add(el);
  return new QuizWidget(el);
}

/** Initializes every not-yet-initialized quiz container matching selector. */
export function initAll(selector = '[data-type="quiz"]', root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    if (!initialized.has(el)) init(el);
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll());
  } else {
    initAll();
  }
}
