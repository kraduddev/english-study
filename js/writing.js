import { showView } from './app.js';

const WRITING_DATA_URL = new URL('../src/writing-skills.json', import.meta.url);

let writingCatalog = {
  categories: [],
  skills: [],
};

let uiInitialized = false;
let loadError = '';

const state = {
  query: '',
  category: 'all',
  selectedSkillId: null,
};

export async function initWriting() {
  await loadWritingCatalog();
  setupWritingUI();
  populateCategoryFilter();
  renderWritingDashboard();
}

async function loadWritingCatalog() {
  try {
    const res = await fetch(WRITING_DATA_URL);
    if (!res.ok) {
      loadError = `HTTP ${res.status} al cargar ${WRITING_DATA_URL.pathname}`;
      writingCatalog = { categories: [], skills: [] };
      console.error('[writing] Error cargando catálogo:', loadError);
      return;
    }

    writingCatalog = await res.json();
    loadError = '';
  } catch (error) {
    loadError = error.message || 'No se han podido cargar los writing skills.';
    writingCatalog = { categories: [], skills: [] };
    console.error('[writing] Error cargando catálogo:', error);
  }
}

function setupWritingUI() {
  if (uiInitialized) return;
  uiInitialized = true;

  document.getElementById('writing-search')?.addEventListener('input', (event) => {
    state.query = event.target.value;
    renderWritingDashboard();
  });

  document.getElementById('writing-category-filter')?.addEventListener('change', (event) => {
    state.category = event.target.value;
    renderWritingDashboard();
  });

  document.getElementById('btn-writing-back')?.addEventListener('click', () => showView('writing'));
}

function populateCategoryFilter() {
  const filter = document.getElementById('writing-category-filter');
  if (!filter) return;

  filter.innerHTML = [
    '<option value="all">Todas las categorías</option>',
    ...writingCatalog.categories.map((category) => (
      `<option value="${escapeHtml(category.id)}">${escapeHtml(category.title)}</option>`
    )),
  ].join('');

  filter.value = state.category;
}

export function renderWritingDashboard() {
  const metaEl = document.getElementById('writing-results-meta');
  const groupsEl = document.getElementById('writing-category-groups');
  if (!metaEl || !groupsEl) return;

  if (loadError) {
    metaEl.innerHTML = '';
    groupsEl.innerHTML = renderMessageState(
      'No se ha podido cargar la sección de writing',
      loadError
    );
    return;
  }

  const filteredSkills = getFilteredSkills();
  const groupedCategories = writingCatalog.categories
    .map((category) => ({
      category,
      skills: filteredSkills.filter((skill) => skill.categoryId === category.id),
    }))
    .filter(({ skills }) => skills.length > 0);

  metaEl.innerHTML = [
    `<span class="writing-summary-pill">${filteredSkills.length} writings visibles</span>`,
    `<span class="writing-summary-pill">${groupedCategories.length} familias activas</span>`,
    state.category !== 'all'
      ? `<span class="writing-summary-pill">Filtro: ${escapeHtml(getCategoryTitle(state.category))}</span>`
      : '',
    state.query.trim()
      ? `<span class="writing-summary-pill">Búsqueda: “${escapeHtml(state.query.trim())}”</span>`
      : '',
  ].filter(Boolean).join('');

  if (groupedCategories.length === 0) {
    groupsEl.innerHTML = `
      ${renderMessageState(
        'No hay resultados',
        'Prueba con otro término de búsqueda o limpia el filtro de categoría.'
      )}
      <div class="writing-empty-actions">
        <button type="button" class="btn-secondary" id="btn-clear-writing-filters">Limpiar filtros</button>
      </div>
    `;

    document.getElementById('btn-clear-writing-filters')?.addEventListener('click', clearFilters);
    return;
  }

  groupsEl.innerHTML = groupedCategories.map(({ category, skills }) => `
    <section class="writing-family" style="--category-color:${escapeHtml(category.color)};">
      <div class="writing-family-header">
        <div class="writing-family-copy">
          <div class="writing-family-kicker">Familia de writing</div>
          <h2 class="writing-family-title">${escapeHtml(category.title)}</h2>
          <p class="writing-family-description">${escapeHtml(category.description)}</p>
        </div>
        <div class="writing-family-side">
          <span class="writing-family-count">${skills.length} ${skills.length === 1 ? 'tipo' : 'tipos'}</span>
          <div class="writing-tag-list">
            ${category.tags.map((tag) => `<span class="tag-chip tag-chip-category">${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="writing-cards-grid">
        ${skills.map((skill) => renderWritingCard(skill, category)).join('')}
      </div>
    </section>
  `).join('');

  groupsEl.querySelectorAll('.writing-card').forEach((card) => {
    card.addEventListener('click', () => openWritingSkill(card.dataset.skillId));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openWritingSkill(card.dataset.skillId);
      }
    });
  });
}

export function renderWritingDetail() {
  const detailEl = document.getElementById('writing-detail-content');
  if (!detailEl) return;

  if (loadError) {
    detailEl.innerHTML = renderMessageState('No se ha podido cargar el detalle', loadError);
    return;
  }

  const skill = writingCatalog.skills.find((item) => item.id === state.selectedSkillId) || writingCatalog.skills[0];
  if (!skill) {
    detailEl.innerHTML = renderMessageState(
      'Todavía no hay writings configurados',
      'Añade elementos a src/writing-skills.json para mostrar esta vista.'
    );
    return;
  }

  const category = writingCatalog.categories.find((item) => item.id === skill.categoryId);

  detailEl.innerHTML = `
    <article class="writing-detail-panel" style="--category-color:${escapeHtml(category?.color || 'var(--accent)')};">
      <aside class="writing-detail-sidebar">
        <span class="writing-detail-category">${escapeHtml(skill.category)}</span>
        <h1 class="writing-detail-title">${escapeHtml(skill.title)}</h1>
        <p class="writing-detail-description">${escapeHtml(skill.shortDescription)}</p>
        <div class="writing-detail-tags">
          ${skill.tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('')}
        </div>
        ${category ? `
          <div class="writing-detail-family-box">
            <div class="writing-detail-family-label">Familia</div>
            <h2>${escapeHtml(category.title)}</h2>
            <p>${escapeHtml(category.description)}</p>
            <div class="writing-tag-list">
              ${category.tags.map((tag) => `<span class="tag-chip tag-chip-category">${escapeHtml(tag)}</span>`).join('')}
            </div>
          </div>
        ` : ''}
      </aside>
      <div class="writing-detail-media">
        <img
          class="writing-detail-image"
          src="${escapeHtml(skill.infographicUrl)}"
          alt="Infografía de ${escapeHtml(skill.title)}"
          loading="lazy"
        />
      </div>
    </article>
  `;
}

function renderWritingCard(skill, category) {
  return `
    <button
      type="button"
      class="writing-card"
      data-skill-id="${escapeHtml(skill.id)}"
      style="--category-color:${escapeHtml(category.color)};"
      aria-label="Abrir infografía de ${escapeHtml(skill.title)}"
    >
      <div class="writing-card-top">
        <span class="writing-card-category">${escapeHtml(skill.category)}</span>
        <span class="writing-card-action">Ver infografía →</span>
      </div>
      <div class="writing-card-body">
        <h3 class="writing-card-title">${escapeHtml(skill.title)}</h3>
        <p class="writing-card-description">${escapeHtml(skill.shortDescription)}</p>
      </div>
      <div class="writing-tag-list">
        ${skill.tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('')}
      </div>
    </button>
  `;
}

function getFilteredSkills() {
  const query = normalize(state.query);

  return writingCatalog.skills.filter((skill) => {
    const matchesCategory = state.category === 'all' || skill.categoryId === state.category;
    if (!matchesCategory) return false;
    if (!query) return true;

    const haystack = normalize([
      skill.title,
      skill.category,
      skill.shortDescription,
      ...(skill.tags || []),
    ].join(' '));

    return haystack.includes(query);
  });
}

function openWritingSkill(skillId) {
  state.selectedSkillId = skillId;
  showView('writing-detail');
}

function clearFilters() {
  state.query = '';
  state.category = 'all';

  const search = document.getElementById('writing-search');
  const filter = document.getElementById('writing-category-filter');

  if (search) search.value = '';
  if (filter) filter.value = 'all';

  renderWritingDashboard();
}

function getCategoryTitle(categoryId) {
  return writingCatalog.categories.find((category) => category.id === categoryId)?.title || categoryId;
}

function normalize(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function renderMessageState(title, message) {
  return `
    <div class="empty-state">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

