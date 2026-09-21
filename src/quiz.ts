// Copyright (c) 2026 Benjamin Benno Falkner
// SPDX-License-Identifier: MIT

import { createFullscreenControls } from './fullscreen';
import { stringsFor } from './strings';
import type { Strings } from './strings';
import type { QuizOption, QuizQuestion, QuizQuestionSource, QuizResult, QuizCompletedDetail } from './types';

function shuffle<T>(items: T[]): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = result[i]!;
    const b = result[j]!;
    result[i] = b;
    result[j] = a;
  }
  return result;
}

interface QuizState {
  questions: QuizQuestion[];
  index: number;
  correctCount: number;
  results: QuizResult[];
  completed: boolean;
}

/** One quiz instance bound to a container element. Loads its questions
 * (data-url first, data-content as offline/fallback backup), then drives
 * the widget through start -> question x N -> result. */
export class QuizWidget {
  private readonly container: HTMLElement;
  private readonly content: HTMLElement;
  private readonly title: string;
  private readonly requestedCount: number | null;
  private state: QuizState = { questions: [], index: 0, correctCount: 0, results: [], completed: false };

  /** Texts in the language of the container's surrounding [lang]. */
  private get t(): Strings {
    return stringsFor(this.container);
  }

  constructor(container: HTMLElement) {
    this.container = container;
    this.content = document.createElement('div');
    this.content.className = 'quiz-content';
    container.replaceChildren(this.content, createFullscreenControls(container));
    this.title = container.dataset.title || 'Quiz';
    const count = container.dataset.count ? parseInt(container.dataset.count, 10) : NaN;
    this.requestedCount = Number.isFinite(count) ? count : null;
    void this.loadQuestions();
  }

  private async loadQuestions(): Promise<void> {
    const raw = this.container.dataset.content;
    const url = this.container.dataset.url;

    // data-url is tried first (the current state on the server); data-content
    // serves as an offline/fallback backup if the server is unreachable,
    // returns an error, or responds with invalid JSON.
    if (url) {
      this.renderLoading();
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: unknown = await res.json();
        this.setupQuestions(data);
      } catch {
        if (raw) {
          this.useFallbackContent(raw);
        } else {
          this.renderError(this.t.loadFailedNoBackup(url));
        }
      }
    } else if (raw) {
      this.useFallbackContent(raw);
    } else {
      this.renderError(this.t.noSource);
    }
  }

  private useFallbackContent(raw: string): void {
    try {
      const data: unknown = JSON.parse(raw);
      this.setupQuestions(data);
    } catch {
      this.renderError(this.t.unreadable);
    }
  }

  private setupQuestions(data: unknown): void {
    if (!Array.isArray(data) || data.length === 0) {
      this.renderError(this.t.noQuestions);
      return;
    }
    const pool = shuffle(data as QuizQuestionSource[]);
    const count = this.requestedCount ? Math.min(this.requestedCount, pool.length) : pool.length;
    this.state.questions = pool.slice(0, count).map((q) => {
      // Options are shuffled too, tracking correctness per option instead of
      // by index so the shuffled order stays consistent with the answer.
      const optionsWithFlag: QuizOption[] = q.options.map((text, i) => ({ text, isCorrect: i === q.correct }));
      return { question: q.question, options: shuffle(optionsWithFlag) };
    });
    this.renderStart();
  }

  private renderLoading(): void {
    this.content.replaceChildren();
    const wrap = document.createElement('div');
    wrap.className = 'quiz-start';
    const p = document.createElement('p');
    p.textContent = this.t.loading;
    wrap.appendChild(p);
    this.content.appendChild(wrap);
  }

  private renderError(message: string): void {
    this.content.replaceChildren();
    const el = document.createElement('div');
    el.className = 'quiz-error';
    el.textContent = message;
    this.content.appendChild(el);
  }

  private renderStart(): void {
    this.content.replaceChildren();
    const wrap = document.createElement('div');
    wrap.className = 'quiz-start';

    const heading = document.createElement('h2');
    heading.textContent = this.title;

    const summary = document.createElement('p');
    summary.textContent = this.t.summary(this.state.questions.length);

    const startBtn = document.createElement('button');
    startBtn.className = 'quiz-btn quiz-start-btn';
    startBtn.textContent = this.t.start;
    startBtn.addEventListener('click', () => {
      this.state.index = 0;
      this.state.correctCount = 0;
      this.state.results = [];
      this.state.completed = false;
      this.renderQuestion();
    });

    wrap.append(heading, summary, startBtn);
    this.content.appendChild(wrap);
  }

  private renderQuestion(): void {
    this.content.replaceChildren();
    const q = this.state.questions[this.state.index];
    if (!q) return;
    const total = this.state.questions.length;
    const current = this.state.index + 1;
    const pct = Math.round((this.state.index / total) * 100);

    const progress = document.createElement('div');
    progress.className = 'quiz-progress';
    const progressLeft = document.createElement('span');
    progressLeft.textContent = this.t.progress(current, total);
    const progressRight = document.createElement('span');
    progressRight.textContent = this.title;
    progress.append(progressLeft, progressRight);

    const progressBar = document.createElement('div');
    progressBar.className = 'quiz-progress-bar';
    const progressFill = document.createElement('div');
    progressFill.className = 'quiz-progress-fill';
    progressFill.style.width = `${pct}%`;
    progressBar.appendChild(progressFill);

    const questionEl = document.createElement('div');
    questionEl.className = 'quiz-question';
    questionEl.textContent = q.question;

    const optionsEl = document.createElement('div');
    optionsEl.className = 'quiz-options';

    const nextWrap = document.createElement('div');
    nextWrap.className = 'quiz-next';

    const optionButtons: HTMLButtonElement[] = [];
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.dataset.idx = String(i);
      btn.textContent = opt.text;
      optionButtons.push(btn);
      optionsEl.appendChild(btn);
    });
    optionButtons.forEach((btn, i) => {
      btn.addEventListener('click', () => this.handleAnswer(i, optionButtons, q, nextWrap));
    });

    this.content.append(progress, progressBar, questionEl, optionsEl, nextWrap);
  }

  private handleAnswer(idx: number, optionButtons: HTMLButtonElement[], q: QuizQuestion, nextWrap: HTMLElement): void {
    const chosen = q.options[idx];
    if (!chosen || this.state.results.length > this.state.index) return;
    this.state.results.push({
      question: q.question,
      selectedAnswer: chosen.text,
      correct: chosen.isCorrect,
    });

    optionButtons.forEach((btn, i) => {
      btn.disabled = true;
      if (q.options[i]?.isCorrect) btn.classList.add('correct');
      else if (i === idx) btn.classList.add('wrong');
    });

    if (chosen?.isCorrect) this.state.correctCount++;

    const isLast = this.state.index === this.state.questions.length - 1;
    const btn = document.createElement('button');
    btn.className = 'quiz-btn';
    btn.textContent = isLast ? this.t.showResult : this.t.next;
    btn.addEventListener('click', () => {
      if (isLast) {
        this.renderResult();
      } else {
        this.state.index++;
        this.renderQuestion();
      }
    });
    nextWrap.appendChild(btn);
  }

  private renderResult(): void {
    this.content.replaceChildren();
    const total = this.state.questions.length;
    const pct = Math.round((this.state.correctCount / total) * 100);

    const wrap = document.createElement('div');
    wrap.className = 'quiz-result';

    const heading = document.createElement('h2');
    heading.textContent = this.title;

    const score = document.createElement('div');
    score.className = 'quiz-score';
    score.textContent = `${pct}%`;

    const sub = document.createElement('p');
    sub.className = 'quiz-score-sub';
    sub.textContent = this.t.score(this.state.correctCount, total);

    wrap.append(heading, score, sub);
    if (this.container.dataset.redo !== 'false') {
      const restartBtn = document.createElement('button');
      restartBtn.className = 'quiz-btn quiz-restart-btn';
      restartBtn.textContent = this.t.retry;
      restartBtn.addEventListener('click', () => this.renderStart());
      wrap.appendChild(restartBtn);
    }
    this.content.appendChild(wrap);
    if (!this.state.completed) {
      this.state.completed = true;
      this.container.dispatchEvent(new CustomEvent<QuizCompletedDetail>('edoquiz-completed', {
        bubbles: true,
        detail: { results: this.state.results.map((result) => ({ ...result })) },
      }));
    }
  }
}
