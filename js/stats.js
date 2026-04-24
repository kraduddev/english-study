/**
 * stats.js – Vista de estadísticas
 */

import { resetTopicStats, resetAllStats, getCardStats } from './app.js';

export function renderStats(allTopics) {
  renderGlobal(allTopics);
  renderTopics(allTopics);
  setupResetAll(allTopics);
}

/* ─── Cajas globales ──────────────────────────────────────── */
function renderGlobal(allTopics) {
  const data = JSON.parse(localStorage.getItem('eoi_stats') || '{}');
  let totalPass = 0, totalFail = 0, totalTerms = 0;

  allTopics.forEach(({ meta, cards }) => {
    totalTerms += cards.length;
    const topic = data[meta.id] || {};
    Object.values(topic).forEach(t => {
      totalPass += (t.pass || 0);
      totalFail += (t.fail || 0);
    });
  });

  const totalAttempts = totalPass + totalFail;
  const pct = totalAttempts > 0 ? Math.round((totalPass / totalAttempts) * 100) : 0;

  document.getElementById('stats-global').innerHTML = `
    <div class="stat-box accent">
      <div class="stat-box-num">${totalTerms}</div>
      <div class="stat-box-label">Términos totales</div>
    </div>
    <div class="stat-box green">
      <div class="stat-box-num">${totalPass}</div>
      <div class="stat-box-label">Aciertos totales</div>
    </div>
    <div class="stat-box red">
      <div class="stat-box-num">${totalFail}</div>
      <div class="stat-box-label">Fallos totales</div>
    </div>
    <div class="stat-box accent">
      <div class="stat-box-num">${pct}%</div>
      <div class="stat-box-label">Precisión global</div>
    </div>
  `;
}

/* ─── Bloques por topic ───────────────────────────────────── */
function renderTopics(allTopics) {
  const container = document.getElementById('stats-topics');
  container.innerHTML = '';

  allTopics.forEach(({ meta, cards }) => {
    const block = document.createElement('div');
    block.className = 'stats-topic-block';

    let topicPass = 0, topicFail = 0;
    const rows = cards.map(card => {
      const s    = getCardStats(meta.id, card.id);
      const tot  = s.pass + s.fail;
      const pct  = tot > 0 ? Math.round((s.pass / tot) * 100) : null;
      topicPass += s.pass;
      topicFail += s.fail;
      return { card, s, tot, pct };
    });

    const topicTotal = topicPass + topicFail;
    const topicPct   = topicTotal > 0 ? Math.round((topicPass / topicTotal) * 100) : 0;

    block.innerHTML = `
      <div class="stats-topic-header">
        <h3>${meta.icon} ${meta.label}</h3>
        <div class="stats-topic-right">
          <span class="stats-topic-pct">${topicTotal > 0 ? topicPct + '%' : 'Sin datos'}</span>
          <button class="stats-topic-reset" data-topic="${meta.id}">Resetear</button>
          <span class="stats-topic-chevron">▼</span>
        </div>
      </div>
      <div class="stats-topic-body">
        <table class="stats-table">
          <thead>
            <tr>
              <th>Término</th>
              <th>Tipo</th>
              <th>✓ Aciertos</th>
              <th>✗ Fallos</th>
              <th>%</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(({ card, s, tot, pct }) => `
              <tr>
                <td class="td-term">${card.term}</td>
                <td style="color:var(--text-muted);font-size:.78rem">${card.type || ''}</td>
                <td class="td-pass">${s.pass}</td>
                <td class="td-fail">${s.fail}</td>
                <td class="td-pct" style="color:${pct === null ? 'var(--text-muted)' : pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--yellow)' : 'var(--red)'}">
                  ${pct !== null ? pct + '%' : '—'}
                </td>
                <td>
                  <div class="mini-bar">
                    <div class="mini-bar-fill" style="width:${pct ?? 0}%"></div>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Toggle expand/collapse
    block.querySelector('.stats-topic-header').addEventListener('click', (e) => {
      if (e.target.classList.contains('stats-topic-reset')) return;
      block.classList.toggle('open');
    });

    // Reset topic
    block.querySelector('.stats-topic-reset').addEventListener('click', () => {
      if (confirm(`¿Resetear estadísticas de "${meta.label}"?`)) {
        resetTopicStats(meta.id);
        renderStats(allTopics);
      }
    });

    container.appendChild(block);
  });
}

/* ─── Reset global ────────────────────────────────────────── */
function setupResetAll(allTopics) {
  const btn = document.getElementById('btn-reset-all');
  btn.onclick = () => {
    if (confirm('¿Resetear TODAS las estadísticas? Esta acción no se puede deshacer.')) {
      resetAllStats();
      renderStats(allTopics);
    }
  };
}

