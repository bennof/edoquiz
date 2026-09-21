# edoquiz

An embeddable multiple-choice quiz widget. Drop a `<div>` with a few `data-*` attributes into any page, include one script and one stylesheet, and you get a quiz with a start screen, shuffled questions, instant feedback and a percentage result. No framework, no build step for the page that uses it.

- **Questions from inline JSON or from a URL** — with the inline copy as an offline/fallback backup.
- **Randomized.** Questions are drawn at random from a pool (`data-count`), and answer options are shuffled too.
- **Your page decides what happens with the results.** The widget fires an event with every answer; it never talks to a backend.
- **Several quizzes per page**, each with its own state.
- **English and German** texts, following the page's `lang`.
- **Themeable with CSS custom properties.** The widget's stylesheet only reads `--quiz-*` tokens (all with fallbacks), so it looks right without a theme and is restyled from an ordinary stylesheet.
- **Small.** One ~8 kB script (minified), one ~4 kB stylesheet, no dependencies.

Demos: [`examples/demo.html`](examples/demo.html) (English) and [`examples/demo_de.html`](examples/demo_de.html) (Deutsch) — a quiz that quizzes you on itself. They load the files in `dist/`, so run `npm run build` first; the file-based example needs a server, so use `npm run dev` (see [Development](#development)).

## Quick start

```html
<link rel="stylesheet" href="edoquiz.css">
<link rel="stylesheet" href="theme.css"> <!-- optional: your --quiz-* values -->

<div id="capitals" class="quiz-widget" data-type="quiz"
     data-title="Capitals" data-count="2"
     data-content='[
       {"question":"Capital of France?","options":["Paris","Rome","Oslo"],"correct":0},
       {"question":"Capital of Norway?","options":["Oslo","Bern","Riga"],"correct":0},
       {"question":"Capital of Italy?","options":["Milan","Rome","Turin"],"correct":1}
     ]'></div>

<script src="edoquiz.global.js"></script>
```

The script initializes every `[data-type="quiz"]` on the page automatically, even if it is loaded after `DOMContentLoaded`.

## Markup

| Attribute | Meaning |
| --- | --- |
| `data-type="quiz"` | Marks the container as a quiz. Required. |
| `class="quiz-widget"` | Gives the container its look. Required for styling. |
| `data-title` | Heading of the quiz. Default: `Quiz`. |
| `data-count` | How many questions to draw from the pool, at random. Default: all. Larger than the pool → the whole pool. |
| `data-content` | The questions as inline JSON (see below). |
| `data-url` | URL to load the questions from, same JSON format. |
| `data-redo="false"` | No *Try again* button on the result screen. Default: the button is shown. |

Put `data-content` in a **single-quoted** attribute, as above, so the JSON's double quotes need no escaping; write an apostrophe inside it as `&#39;`.

### Question format

An array of objects:

```json
[
  {
    "question": "Which city is the capital of Australia?",
    "options": ["Sydney", "Melbourne", "Canberra", "Perth"],
    "correct": 2
  }
]
```

`correct` is the index (starting at 0) of the right option **in the order written here**. The options are shuffled for display, and correctness follows each option, not its position.

### Question sources

- With only `data-content`: the inline questions are used.
- With `data-url`: it is tried first, so the questions are always the current ones. If the request **fails** — network error, HTTP error status, or a response that isn't valid JSON — the quiz falls back to `data-content`, if there is one. Without a backup, the widget shows an error message instead of stopping silently.
- If the URL answers with valid JSON that isn't a non-empty array of questions, that is reported as *No valid questions found* — it does not fall back.
- With neither, the widget shows an error message.

Behind `data-url` can be a static file or any endpoint that returns this JSON; the widget assumes nothing about the backend. It uses `fetch`, so it needs `http(s)` (and CORS for other origins) — from a `file://` page the request is blocked and the fallback is used.

## What the user sees

1. A start screen with the title, the number of questions and a *Start quiz* button — the quiz never starts by itself.
2. One question at a time, with a progress line and bar. Choosing an answer marks it right or wrong at once (and shows the right one), then *Next* / *Show result*.
3. A result screen with the score as a **percentage** and the number of correct answers, and — unless `data-redo="false"` — *Try again*, which returns to the start screen — with the same questions in the same order as before, since the draw happens once, on load.
4. In the corner, a button that shows the quiz in fullscreen, where the content is centered in a column of limited width.

## The result event

When the result screen is shown, the container fires **`edoquiz-completed`**. It bubbles, so you can listen on the container or on `document`. The `detail` lists every answer in the order the questions were shown:

```js
document.addEventListener('edoquiz-completed', (event) => {
  console.log(event.target.id);        // which quiz
  console.log(event.detail.results);
  // [{ question: "Capital of France?", selectedAnswer: "Paris", correct: true }, …]
});
```

It fires once per attempt — after *Try again* and another run, it fires again. Sending the results to a server (or anywhere else) is up to your page.

## JavaScript API

The global is `EdoQuiz` (IIFE build); the ESM build exports the same names.

```js
EdoQuiz.initAll();                    // initialize quizzes that aren't yet (e.g. after injecting markup)
const quiz = EdoQuiz.init(element);   // initialize one container, returns its QuizWidget
```

`initAll(selector = '[data-type="quiz"]', root = document)` skips containers that were already initialized. `QuizWidget` is also exported if you want to construct one yourself. The TypeScript types `QuizQuestionSource`, `QuizResult` and `QuizCompletedDetail` are exported as well.

## Language

Widget texts are English or German, chosen by the closest `lang` attribute above the quiz (`<html lang="de">` or any element around it). German for `de` and `de-…`, English for everything else, including no `lang`.

## Theming

Set the tokens on `:root` (or on any ancestor of the quiz):

```css
:root {
  --quiz-accent: #7c3aed;
  --quiz-accent-hover: #6d28d9;
  --quiz-radius: 8px;
}
```

The widget's stylesheet only *reads* `--quiz-*` (each with a built-in fallback) and never declares them, so a theme linked anywhere wins, and works without one. [`examples/theme.css`](examples/theme.css) lists every token with its default, plus a dark variant, and is the reference.

| Token | Used for |
| --- | --- |
| `--quiz-font`, `--quiz-radius` | Font family; corner radius of the quiz box |
| `--quiz-fullscreen-max-width` | Width of the centered column in fullscreen (default `44rem`) |
| `--quiz-bg`, `--quiz-border` | Quiz box background; box, option and progress-track lines |
| `--quiz-option-bg`, `--quiz-option-hover-bg` | Answer options; their hover (also the fullscreen button's) |
| `--quiz-shadow` | Shadow of the quiz box |
| `--quiz-text`, `--quiz-muted` | Main text; progress line, summary, hints |
| `--quiz-accent`, `--quiz-accent-hover`, `--quiz-accent-contrast` | Buttons, progress bar, score, focus ring; the text on an accent background |
| `--quiz-correct`, `--quiz-correct-bg` | A right answer |
| `--quiz-wrong`, `--quiz-wrong-bg` | A wrong answer, and error messages |

## Limitations

- Single-answer multiple choice only. Results are not stored — a reload starts over.
- `data-content`/`data-url` are read once, when the quiz initializes.
- There is no automated test suite yet.

## Development

```
npm install
npm run dev        # watch + local server: http://127.0.0.1:8081/examples/demo.html
npm run build      # dist/edoquiz.{esm.js,global.js,css} + type declarations
npm run typecheck
```

Sources are in [`src/`](src/): `quiz.ts` is the widget, `strings.ts` the texts, `fullscreen.ts` the fullscreen button, `index.ts` the entry point that initializes the page's quizzes.

## License

Copyright © 2026 Benjamin Benno Falkner. Released under the [MIT License](LICENSE); every source file carries an `SPDX-License-Identifier: MIT` header, and the built files in `dist/` a copyright banner.

## AI assistance

This project was developed with the help of AI. Parts of the code, tests and documentation were written with Claude (Anthropic) via Claude Code and with Codex (OpenAI), under the direction of the author, who is responsible for the result.
