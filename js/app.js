/**
 * app.js – Router principal y carga de topics
 *
 * Para añadir un nuevo topic:
 *   1. Coloca el JSON en src/<topic>.json
 *   2. Añade una entrada al array TOPICS_REGISTRY abajo
 */

import { startStudySession } from './study.js';
import { renderStats }        from './stats.js';

const BUILD_MARKER = 'b710882-time-topic';

/* ─── Registro de topics ──────────────────────────────────── */
const TOPICS_REGISTRY = [
  { id: 'money', label: 'Money & Finance', icon: '💰', file: 'src/money.json' },
  { id: 'time', label: 'Expressions with time', icon: '⏳', file: 'src/time.json' },
  { id: 'personality', label: 'Personality', icon: '🙃', file: 'src/personality.json' },
  { id: 'work', label: 'Work', icon: '⚒️', file: 'src/work.json' },
  { id: 'conflict', label: 'Conflict & Warfare', icon: '🔫', file: 'src/conflict.json' },
  // { id: 'travel', label: 'Travel', icon: '✈️', file: 'src/travel.json' },
];

/* ─── Estado global ───────────────────────────────────────── */
export let allTopics = [];   // [{ meta, cards }]

/* ─── Carga de datos ──────────────────────────────────────── */
async function loadTopics() {
  const results = await Promise.allSettled(
    TOPICS_REGISTRY.map(async (meta) => {
      const url = new URL(`../${meta.file}`, import.meta.url);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} al cargar ${url.pathname}`);
      }
      const cards = await res.json();
      return { meta, cards };
    })
  );

  results
    .filter(r => r.status === 'rejected')
    .forEach(({ reason }) => console.error('[topics] Error cargando topic:', reason));

  allTopics = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
}

/* ─── Router ──────────────────────────────────────────────── */
export function showView(name) {
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
    v.classList.add('hidden');
  });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const view = document.getElementById(`view-${name}`);
  if (view) { view.classList.remove('hidden'); view.classList.add('active'); }

  const navBtn = document.querySelector(`.nav-btn[data-view="${name}"]`);
  if (navBtn) navBtn.classList.add('active');

  if (name === 'dashboard') renderDashboard();
  if (name === 'stats') renderStats(allTopics);
}

/* ─── Dashboard ───────────────────────────────────────────── */
function renderDashboard() {
  const grid = document.getElementById('topic-grid');
  grid.innerHTML = '';

  allTopics.forEach(({ meta, cards }) => {
    const stats = getTopicStats(meta.id);
    const pct   = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : null;

    const card  = document.createElement('div');
    card.className = 'topic-card';
    card.innerHTML = `
      <div class="topic-icon">${meta.icon}</div>
      <div class="topic-name">${meta.label}</div>
      <div class="topic-count">${cards.length} términos · ${getUniqueTypes(cards)}</div>
      <div class="topic-stats">
        <div class="topic-stats-row">
          <span>${stats.total > 0 ? `${stats.pass} aciertos / ${stats.fail} fallos` : 'Sin intentos aún'}</span>
          <span class="topic-pct">${pct !== null ? pct + '%' : ''}</span>
        </div>
        <div class="topic-bar">
          <div class="topic-bar-fill" style="width:${pct ?? 0}%"></div>
        </div>
      </div>
    `;
    card.addEventListener('click', () => openSessionModal(meta, cards));
    grid.appendChild(card);
  });
}

function getUniqueTypes(cards) {
  const types = [...new Set(cards.map(c => c.type))];
  return types.join(' · ');
}

/* ─── Stats helpers ───────────────────────────────────────── */
export function getTopicStats(topicId) {
  const data = JSON.parse(localStorage.getItem('eoi_stats') || '{}');
  const topic = data[topicId] || {};
  let pass = 0, fail = 0;
  Object.values(topic).forEach(t => { pass += (t.pass || 0); fail += (t.fail || 0); });
  return { pass, fail, total: pass + fail };
}

export function recordResult(topicId, cardId, result /* 'pass'|'fail' */) {
  const data  = JSON.parse(localStorage.getItem('eoi_stats') || '{}');
  if (!data[topicId])         data[topicId]         = {};
  if (!data[topicId][cardId]) data[topicId][cardId] = { pass: 0, fail: 0 };
  data[topicId][cardId][result]++;
  localStorage.setItem('eoi_stats', JSON.stringify(data));
}

export function getCardStats(topicId, cardId) {
  const data = JSON.parse(localStorage.getItem('eoi_stats') || '{}');
  return (data[topicId]?.[cardId]) || { pass: 0, fail: 0 };
}

export function resetTopicStats(topicId) {
  const data = JSON.parse(localStorage.getItem('eoi_stats') || '{}');
  delete data[topicId];
  localStorage.setItem('eoi_stats', JSON.stringify(data));
}

export function resetAllStats() {
  localStorage.removeItem('eoi_stats');
}

/* ─── Modal de sesión ─────────────────────────────────────── */
function openSessionModal(meta, cards) {
  document.getElementById('modal-topic-name').textContent = meta.label;
  document.getElementById('modal-count').textContent      = `${cards.length} términos disponibles`;

  // reset selection
  document.querySelector('input[name=mode][value=A]').checked = true;

  const modal = document.getElementById('session-modal');
  modal.classList.remove('hidden');

  document.getElementById('btn-start-session').onclick = () => {
    const mode = document.querySelector('input[name=mode]:checked').value;
    modal.classList.add('hidden');
    startStudySession(meta, cards, mode);
  };
}

/* ─── Init ────────────────────────────────────────────────── */
async function init() {
  console.info('[EOI build]', BUILD_MARKER);
  await loadTopics();
  renderDashboard();

  // Nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.view));
  });

  // Brand → dashboard
  document.getElementById('nav-brand').addEventListener('click', () => showView('dashboard'));

  // Modal close
  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('session-modal').classList.add('hidden');
  });
  document.getElementById('session-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
  });
}

init();
