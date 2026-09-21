// Copyright (c) 2026 Benjamin Benno Falkner
// SPDX-License-Identifier: MIT

/** Shape of one question as delivered by data-content / data-url. */
export interface QuizQuestionSource {
  question: string;
  options: string[];
  correct: number;
}

export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

/** A question after option order has been shuffled for presentation. */
export interface QuizQuestion {
  question: string;
  options: QuizOption[];
}

/** One submitted answer, in the order the questions were shown. */
export interface QuizResult {
  question: string;
  selectedAnswer: string;
  correct: boolean;
}

export interface QuizCompletedDetail {
  results: QuizResult[];
}
