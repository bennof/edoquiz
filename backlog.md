# Anforderungen: Quiz-Modul & Modul-Architektur

## 1. Quiz-Modul (Funktional)

- Single-HTML/JS-Widget mit Multiple-Choice-Fragen.
- Startbildschirm mit Aufforderung zum Start ("Quiz starten"-Button), kein automatischer Beginn.
- Konfigurierbare Anzahl an Fragen (`data-count`), die aus einem größeren Fragenpool gezogen werden.
- Fragen werden in zufälliger Reihenfolge präsentiert; Antwortoptionen werden ebenfalls gemischt.
- Direktes Feedback pro Frage (richtig/falsch visuell markiert), bevor zur nächsten Frage gewechselt wird.
- Abschluss-Screen mit Ergebnis als **Prozentwert** (nicht nur absolute Punktzahl) sowie Möglichkeit, das Quiz erneut zu starten.

## 2. Einbindung / Datenquellen

- Einbindung über ein Container-Element mit definierten Data-Attributen:
  ```html
  <div id="..." class="..." data-type="quiz"
       data-count="3"
       data-title="..."
       data-content='[...]'
       data-url="...">
  </div>
  ```
- Zwei mögliche Fragenquellen, gleiches JSON-Format bei beiden:
  - `data-content`: Fragen direkt als inline JSON-String.
  - `data-url`: Fragen werden per `fetch` von einer URL nachgeladen.
- **Priorität:** `data-url` wird zuerst versucht (aktueller Datenstand). Schlägt der Abruf fehl (Netzwerkfehler, HTTP-Fehlerstatus, ungültiges JSON), wird automatisch auf `data-content` als **Offline-/Fallback-Backup** zurückgefallen.
- Sind weder `data-content` noch `data-url` gesetzt bzw. schlagen beide fehl, wird ein Fehlerzustand im Widget angezeigt statt eines stillen Abbruchs.
- Mehrere Quiz-Instanzen auf einer Seite müssen unabhängig voneinander funktionieren (jede mit eigenem Zustand).

## 3. Backend-Agnostik

- Das Frontend kennt **ausschließlich** das JSON-Antwortformat (Array aus Objekten mit `question`, `options`, `correct`) – nicht die Implementierung dahinter.
- Hinter `data-url` kann eine statische JSON-Datei, ein Skript oder ein vollwertiger API-Endpunkt mit Datenbank-Anbindung stehen; das Modul darf keine Annahmen über den Backend-Stack treffen.
- Beispielhaft angedachter Stack für einen DB-gestützten Endpunkt: **Rust** (Axum o.ä.) mit **SQLite** (passend für viele Reads, wenige Writes) – Backend-Wahl ist aber offen und kann jederzeit ausgetauscht werden, ohne das Frontend anzufassen.
- Schema-Idee für eine DB-Variante: Tabelle `questions` mit `topic`, `question`, 4 Optionsfeldern, `correct`-Index; zufällige Auswahl serverseitig z. B. per `ORDER BY RANDOM() LIMIT n`, optionale Filterung nach `topic`.

## 4. CSS-/Theming-Architektur (modulübergreifendes Muster)

Gilt nicht nur für das Quiz-Modul, sondern als Konvention für **alle** zukünftigen Module:

- Jedes Modul liegt als eigene **`.js`-Datei** vor, die ihr Markup und ihr **modulspezifisches CSS** selbst mitbringt (z. B. per injiziertem `<style>`-Element).
- Das injizierte CSS **konsumiert nur** CSS Custom Properties (`var(--modulname-x, fallback-wert)`) und **deklariert sie nicht selbst** – so entstehen keine Konflikte mit extern gesetzten Werten, unabhängig von der Injection-Reihenfolge im DOM.
- Tatsächliche Theming-Werte (Farben, Radius, Akzentfarbe etc.) werden über eine **separate CSS-Datei** gesetzt, die klassisch per `<link rel="stylesheet">` im `<head>` eingebunden wird.
- Trennung von JS (Logik + Struktur-CSS) und Theme-CSS (Variablenwerte) ist bewusst so gewählt, dass:
  - die `.js`-Datei unabhängig vom Theme normal über HTTP gecacht werden kann,
  - Theme-Anpassungen (Farben, Look) über die CSS-Datei erfolgen, ohne die JS-Datei zu verändern oder deren Cache zu invalidieren.
- Für mehrere Module mit gemeinsamem Erscheinungsbild: gemeinsamer Variablen-Namespace erwägen (z. B. `--app-accent` statt `--quiz-accent`), damit eine zentrale Theme-Datei mehrere Module gleichzeitig stylen kann.

## 5. Referenzimplementierung

- Aktuelle Beispielumsetzung (Stand: Priorität `data-url` vor `data-content`) liegt unter `/mnt/user-data/outputs/quiz-modul.html` als Referenz für Struktur und Datenformat.
- Aufsplittung in `quiz.js` (Logik) + `quiz.css`/Theme-Datei erfolgt eigenständig durch den Nutzer, orientiert an obigem Architekturmuster.