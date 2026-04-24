/**
 * study.js – Lógica de la sesión de flashcards
 *
 * Modo A: frente = término EN   → reverso = traducción ES + definición + ejemplos
 * Modo B: frente = traducción ES → reverso = término EN  + definición + ejemplos
 *
 * Las tarjetas falladas se reinsertan al final de la cola y se repiten
 * hasta que se aciertan todas.
 */

import { showView, recordResult } from './app.js';

/* ─── Estado de sesión ────────────────────────────────────── */
let queue        = [];
let current      = null;
let sessionMeta  = null;
let sessionMode  = 'A';
let sessionCards = [];
let totalCards   = 0;
let passCount    = 0;
let failedIds    = new Set();

/* ─── Shuffle Fisher-Yates ────────────────────────────────── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ─── Inicio de sesión ────────────────────────────────────── */
export function startStudySession(meta, cards, mode) {
  sessionMeta  = meta;
  sessionMode  = mode;
  sessionCards = cards;
  totalCards   = cards.length;
  passCount    = 0;
  failedIds    = new Set();
  queue        = shuffle(cards);

  showView('study');
  setupStudyUI();
  showNextCard();
}

/* ─── Configurar UI ───────────────────────────────────────── */
function setupStudyUI() {
  document.getElementById('study-topic-label').textContent = sessionMeta.label;
  document.getElementById('study-mode-label').textContent  = `Modo ${sessionMode}`;

  document.getElementById('btn-back').onclick = () => {
    if (confirm('¿Seguro que quieres salir? Se perderá el progreso de esta sesión.')) {
      showView('dashboard');
    }
  };

  document.getElementById('flashcard').onclick = revealCard;
  document.getElementById('btn-pass').onclick  = () => handleAnswer('pass');
  document.getElementById('btn-fail').onclick  = () => handleAnswer('fail');

  document.getElementById('btn-end-dashboard').onclick = () => showView('dashboard');
  document.getElementById('btn-repeat-failed').onclick = () => repeatFailed();

  document.getElementById('session-end').classList.add('hidden');
  document.getElementById('card-scene').style.display = '';
  document.getElementById('answer-btns').classList.add('hidden');
  document.getElementById('flashcard').classList.remove('flipped');
}

/* ─── Mostrar siguiente tarjeta ───────────────────────────── */
function showNextCard() {
  if (queue.length === 0) { endSession(); return; }

  current = queue.shift();

  const card = document.getElementById('flashcard');
  card.style.transition = 'none';
  card.classList.remove('flipped');
  void card.offsetWidth;
  card.style.transition = '';

  document.getElementById('answer-btns').classList.add('hidden');

  const isEN = sessionMode === 'A';

  document.getElementById('front-badge').textContent = isEN ? '🇬🇧 Inglés' : '🇪🇸 Español';
  document.getElementById('front-badge').className   = `card-badge ${isEN ? 'badge-en' : 'badge-es'}`;
  document.getElementById('front-main').textContent  = isEN ? current.term : current.translation;
  document.getElementById('front-type').textContent  = current.type ? `(${current.type})` : '';

  document.getElementById('back-badge').textContent      = isEN ? '🇪🇸 Español' : '🇬🇧 Inglés';
  document.getElementById('back-badge').className        = `card-badge ${isEN ? 'badge-es' : 'badge-en'}`;
  document.getElementById('back-answer').textContent     = isEN ? current.translation : current.term;
  document.getElementById('back-definition').textContent = current.definition;

  const examplesEl = document.getElementById('back-examples');
  examplesEl.innerHTML = '';
  (current.examples || []).forEach(ex => {
    const div = document.createElement('div');
    div.className   = 'card-example';
    div.textContent = `"${ex}"`;
    examplesEl.appendChild(div);
  });

  updateProgress();
}

/* ─── Revelar reverso ─────────────────────────────────────── */
function revealCard() {
  const card = document.getElementById('flashcard');
  if (card.classList.contains('flipped')) return;
  card.classList.add('flipped');
  document.getElementById('answer-btns').classList.remove('hidden');
}

/* ─── Registrar respuesta ─────────────────────────────────── */
function handleAnswer(result) {
  recordResult(sessionMeta.id, current.id, result);
  if (result === 'pass') {
    passCount++;
  } else {
    failedIds.add(current.id);
    queue.push(current);
  }
  showNextCard();
}

/* ─── Barra de progreso ───────────────────────────────────── */
function updateProgress() {
  const pct = Math.round((passCount / totalCards) * 100);
  document.getElementById('progress-text').textContent = `${passCount} / ${totalCards}`;
  document.getElementById('progress-bar').style.width  = `${pct}%`;
}

/* ─── Fin de sesión ───────────────────────────────────────── */
function endSession() {
  document.getElementById('card-scene').style.display = 'none';
  document.getElementById('answer-btns').classList.add('hidden');
  document.getElementById('session-end').classList.remove('hidden');

  const pct = Math.round((passCount / totalCards) * 100);
  document.getElementById('session-end-stats').innerHTML = `
    <div class="end-stat green">
      <div class="end-stat-num">${passCount}</div>
      <div class="end-stat-label">Aciertos</div>
    </div>
    <div class="end-stat red">
      <div class="end-stat-num">${failedIds.size}</div>
      <div class="end-stat-label">Términos fallados</div>
    </div>
    <div class="end-stat blue">
      <div class="end-stat-num">${pct}%</div>
      <div class="end-stat-label">Precisión</div>
    </div>
  `;
  document.getElementById('btn-repeat-failed').style.display = failedIds.size > 0 ? '' : 'none';
}

/* ─── Repetir solo falladas ───────────────────────────────── */
function repeatFailed() {
  const failed = sessionCards.filter(c => failedIds.has(c.id));
  if (failed.length === 0) return;

  totalCards = failed.length;
  passCount  = 0;
  failedIds  = new Set();
  queue      = shuffle(failed);

  document.getElementById('session-end').classList.add('hidden');
  document.getElementById('card-scene').style.display = '';
  document.getElementById('answer-btns').classList.add('hidden');
  document.getElementById('flashcard').classList.remove('flipped');

  showNextCard();
}

