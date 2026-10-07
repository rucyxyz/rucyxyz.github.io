function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ============================================================
   Drawer
   ============================================================ */
const hamburger     = document.getElementById('hamburger');
const drawer        = document.getElementById('drawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const drawerClose   = document.getElementById('drawerClose');

function openDrawer() {
  drawer.classList.add('open');
  drawerOverlay.classList.add('open');
  hamburger.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  drawer.classList.remove('open');
  drawerOverlay.classList.remove('open');
  hamburger.classList.remove('open');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () =>
  drawer.classList.contains('open') ? closeDrawer() : openDrawer()
);
drawerOverlay.addEventListener('click', closeDrawer);
drawerClose.addEventListener('click', closeDrawer);
document.querySelectorAll('.drawer-nav a').forEach(a =>
  a.addEventListener('click', closeDrawer)
);

/* ============================================================
   Theme
   ============================================================ */
const themeBtn  = document.getElementById('themeBtn');
const themeIcon = document.getElementById('themeIcon');

applyTheme(localStorage.getItem('theme') || 'dark');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
  localStorage.setItem('theme', theme);
}

themeBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ============================================================
   Data
   ============================================================ */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
}

let allProjects = [];
let allArticles = [];

async function loadProjects() {
  try {
    const res = await fetch('./projects.json');
    allProjects = await res.json();
    renderProjects(allProjects);
    rebuildTagFilters();
  } catch (e) {
    document.getElementById('projectGrid').innerHTML =
      '<p style="color:var(--text2);font-size:14px;">プロジェクトを読み込めませんでした。</p>';
  }
}

async function loadArticles() {
  try {
    const res = await fetch('./articles.json');
    allArticles = await res.json();
    renderArticles(allArticles);
    rebuildTagFilters();
  } catch (e) {
    document.getElementById('articleGrid').innerHTML =
      '<p style="color:var(--text2);font-size:14px;">記事を読み込めませんでした。</p>';
  }
}

/* ============================================================
   Render — サムネなし
   ============================================================ */
function renderProjects(projects) {
  const grid = document.getElementById('projectGrid');
  if (!projects.length) {
    grid.innerHTML = '<p style="color:var(--text2);font-size:14px;">該当するプロジェクトが見つかりませんでした。</p>';
    return;
  }
  grid.innerHTML = projects.map(p => {
    const href = p.links?.project || p.links?.github || '';
    const open = href ? `<a class="project-card project-card--link" href="${href}" target="_blank" rel="noopener">` : '<div class="project-card">';
    const close = href ? '</a>' : '</div>';
    return open + `
      <div class="info">
        <h3>${esc(p.title)}</h3>
        ${p.date ? `<div class="project-date"><span class="material-icons">calendar_today</span>${formatDate(p.date)}</div>` : ''}
        <p>${esc(p.description)}</p>
        <div class="tags">${(p.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      </div>
    ` + close;
  }).join('');
}

function renderArticles(articles) {
  const grid = document.getElementById('articleGrid');
  if (!articles.length) {
    grid.innerHTML = '<p style="color:var(--text2);font-size:14px;">該当する記事が見つかりませんでした。</p>';
    return;
  }
  grid.innerHTML = articles.map(a => {
    return `<a class="article-card article-card--link" href="#article/${a.id}">
      <div class="info">
        <div class="article-badge">Blog</div>
        <h3>${esc(a.title)}</h3>
        ${a.date ? `<div class="project-date"><span class="material-icons">calendar_today</span>${formatDate(a.date)}</div>` : ''}
        <p>${esc(a.description)}</p>
        <div class="tags">${(a.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      </div>
    </a>`;
  }).join('');
}

/* ============================================================
   Search
   ============================================================ */
const searchBtn      = document.getElementById('searchBtn');
const searchOverlay  = document.getElementById('searchOverlay');
const searchInput    = document.getElementById('searchInput');
const searchResults  = document.getElementById('searchResults');
const searchCloseBtn = document.getElementById('searchCloseBtn');
const tagFiltersEl   = document.getElementById('tagFilters');

let activeTag = null;

function openSearch() {
  searchOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => searchInput.focus(), 100);
  renderSearchResults(allProjects, allArticles);
}
function closeSearch() {
  searchOverlay.classList.remove('open');
  document.body.style.overflow = '';
  searchInput.value = '';
  activeTag = null;
  document.querySelectorAll('.tag-filter').forEach(el => el.classList.remove('active'));
}

searchBtn.addEventListener('click', openSearch);
searchCloseBtn.addEventListener('click', closeSearch);
searchOverlay.addEventListener('click', e => {
  if (e.target === searchOverlay) closeSearch();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSearch();
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
});

searchInput.addEventListener('input', doSearch);

function rebuildTagFilters() {
  const allTags = [...new Set([...allProjects, ...allArticles].flatMap(p => p.tags || []))].sort();
  tagFiltersEl.innerHTML = allTags.map(t =>
    `<span class="tag-filter" data-tag="${t}">${t}</span>`
  ).join('');
  tagFiltersEl.querySelectorAll('.tag-filter').forEach(el => {
    el.addEventListener('click', () => {
      if (activeTag === el.dataset.tag) {
        activeTag = null;
        el.classList.remove('active');
      } else {
        activeTag = el.dataset.tag;
        tagFiltersEl.querySelectorAll('.tag-filter').forEach(x => x.classList.remove('active'));
        el.classList.add('active');
      }
      doSearch();
    });
  });
}

function doSearch() {
  const query = searchInput.value.trim().toLowerCase();
  const match = item =>
    (!activeTag || (item.tags || []).includes(activeTag)) &&
    (!query || item.title.toLowerCase().includes(query) ||
               item.description.toLowerCase().includes(query) ||
               (item.tags || []).some(t => t.toLowerCase().includes(query)));

  renderSearchResults(allProjects.filter(match), allArticles.filter(match));
}

function renderSearchResults(projects, articles) {
  const items = [
    ...projects.map(p => ({ ...p, _type: 'project' })),
    ...articles.map(a => ({ ...a, _type: 'article' })),
  ];
  if (!items.length) {
    searchResults.innerHTML = '<div class="search-empty">🔍 該当する項目がありません</div>';
    return;
  }
  searchResults.innerHTML = items.map(item => {
    const href = item._type === 'article'
      ? `#article/${item.id}`
      : (item.links?.project || item.links?.github || '#');
    const hasLink = item._type === 'article' || href !== '#';
    const isExternal = item._type !== 'article' && href !== '#';
    const tag = hasLink ? 'a' : 'div';
    const attrs = hasLink ? `href="${esc(href)}" ${isExternal ? 'target="_blank" rel="noopener"' : ''}` : '';
    return `
      <${tag} class="search-result-item" ${attrs}>
        <div class="search-result-info">
          <div class="search-result-title">
            <span class="search-type-badge search-type-${item._type}">${item._type === 'project' ? 'Project' : 'Blog'}</span>
            ${esc(item.title)}
          </div>
          ${item.date ? `<div class="search-result-date">${formatDate(item.date)}</div>` : ''}
          <div class="search-result-desc">${esc(item.description)}</div>
          <div class="search-result-tags">
            ${(item.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
          </div>
        </div>
      </${tag}>
    `;
  }).join('');
}

/* ============================================================
   Skills animation
   ============================================================ */
const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.skill-fill').forEach(bar => {
        bar.style.width = bar.dataset.w + '%';
      });
      skillObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0 });

document.querySelectorAll('.skill-category, .skill-category-card').forEach(el => skillObserver.observe(el));

/* ============================================================
   Fade-in
   ============================================================ */
const fadeObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      fadeObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.05 });

document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

/* ============================================================
   Boot
   ============================================================ */
loadProjects();
loadArticles().then(() => router());

/* ============================================================
   Hash Router (blog detail)
   ============================================================ */
const articleOverlay = document.getElementById('articleOverlay');
const articleClose   = document.getElementById('articleClose');

function router() {
  const hash = location.hash;
  const m = hash.match(/^#article\/(\d+)$/);
  if (m) {
    const id = parseInt(m[1]);
    const article = allArticles.find(a => a.id === id);
    if (article) { openArticle(article); return; }
  }
  closeArticle();
}

function openArticle(a) {
  const el = document.getElementById('articleOverlay');
  document.getElementById('articleTitle').textContent   = a.title;
  document.getElementById('articleDate').textContent    = a.date ? formatDate(a.date) : '';
  document.getElementById('articleTags').innerHTML      = (a.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('');
  document.getElementById('articleBody').innerHTML      = a.content || `<p>${esc(a.description)}</p>`;
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
  el.scrollTop = 0;
}

function closeArticle() {
  articleOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

window.addEventListener('hashchange', router);
articleClose.addEventListener('click', () => { history.pushState('', '', ' '); closeArticle(); });
articleOverlay.addEventListener('click', e => { if (e.target === articleOverlay) { history.pushState('', '', ' '); closeArticle(); } });

/* ============================================================
   Drawer accordions / filters
   ============================================================ */
const archiveToggle = document.getElementById('archiveToggle');
const archivePanel  = document.getElementById('archivePanel');
const categoryToggle = document.getElementById('categoryToggle');
const categoryPanel  = document.getElementById('categoryPanel');

archiveToggle.addEventListener('click', () => {
  const isOpen = archivePanel.classList.toggle('open');
  archiveToggle.classList.toggle('open', isOpen);
});
categoryToggle.addEventListener('click', () => {
  const isOpen = categoryPanel.classList.toggle('open');
  categoryToggle.classList.toggle('open', isOpen);
});

document.querySelectorAll('.drawer-panel-item').forEach(item => {
  item.addEventListener('click', () => {
    const type  = item.dataset.filterType;
    const value = item.dataset.filterValue;

    document.querySelectorAll('.drawer-panel-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    closeDrawer();

    if (type === 'archive') {
      const filtered = allArticles.filter(a => a.date && a.date.startsWith(value));
      renderArticles(filtered);
    } else if (type === 'category') {
      const filtered = allArticles.filter(a => (a.tags || []).includes(value));
      renderArticles(filtered);
    }

    document.getElementById('blog').scrollIntoView({ behavior: 'smooth' });
  });
});
