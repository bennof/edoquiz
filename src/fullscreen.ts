// Copyright (c) 2026 Benjamin Benno Falkner
// SPDX-License-Identifier: MIT

import { stringsFor } from './strings';

/** Persistent controls, independent of the current quiz screen. */
export function createFullscreenControls(container: HTMLElement): HTMLElement {
  const controls = document.createElement('div');
  controls.className = 'quiz-controls';
  const status = document.createElement('span');
  status.className = 'quiz-fullscreen-status';
  status.setAttribute('role', 'status');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'quiz-fullscreen-btn';
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  icon.appendChild(path);
  button.appendChild(icon);

  const update = (): void => {
    const expanded = document.fullscreenElement === container;
    const t = stringsFor(container);
    const label = expanded ? t.exitFullscreen : t.fullscreen;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(expanded));
    path.setAttribute('d', expanded
      ? 'M3 8h5V3M16 3v5h5M21 16h-5v5M8 21v-5H3'
      : 'M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5');
  };
  container.addEventListener('fullscreenchange', update);
  button.addEventListener('click', async () => {
    button.disabled = true;
    status.textContent = '';
    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch {
      status.textContent = stringsFor(container).fullscreenFailed;
    } finally {
      button.disabled = false;
      update();
    }
  });
  update();
  controls.append(status, button);
  return controls;
}
