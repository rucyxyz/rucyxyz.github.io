function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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
      <div class="thumb">
        ${p.thumbnail
          ? `<img src="${esc(p.thumbnail)}" alt="${esc(p.title)}" loading="lazy">`
          : `<div class="no-img">No Image</div>`}
      </div>
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
      <div class="thumb">
        ${a.thumbnail
          ? `<img src="${esc(a.thumbnail)}" alt="${esc(a.title)}" loading="lazy">`
          : `<div class="no-img">No Image</div>`}
      </div>
      <div class="info">
        <div class="article-badge">Article</div>
        <h3>${esc(a.title)}</h3>
        ${a.date ? `<div class="project-date"><span class="material-icons">calendar_today</span>${formatDate(a.date)}</div>` : ''}
        <p>${esc(a.description)}</p>
        <div class="tags">${(a.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      </div>
    </a>`;
  }).join('');
}

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
      ? (item.url || '#')
      : (item.links?.project || item.links?.github || '#');
    return `
      <a class="search-result-item" href="${esc(href)}" target="${href !== '#' ? '_blank' : '_self'}" rel="noopener">
        <div class="search-result-thumb">
          ${item.thumbnail ? `<img src="${esc(item.thumbnail)}" alt="${esc(item.title)}">` : 'No Image'}
        </div>
        <div class="search-result-info">
          <div class="search-result-title">
            <span class="search-type-badge search-type-${item._type}">${item._type === 'project' ? 'Project' : 'Article'}</span>
            ${esc(item.title)}
          </div>
          ${item.date ? `<div class="search-result-date">${formatDate(item.date)}</div>` : ''}
          <div class="search-result-desc">${esc(item.description)}</div>
          <div class="search-result-tags">
            ${(item.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
          </div>
        </div>
      </a>
    `;
  }).join('');
}

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

const fadeObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      fadeObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.05 });

document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

loadProjects();
loadArticles().then(() => router());

/* ===== HASH ROUTER ===== */
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

    document.getElementById('articles').scrollIntoView({ behavior: 'smooth' });
  });
});

async function loadGitHubStats() {
  try {
    const cached = sessionStorage.getItem('gh_stats');
    if (cached) {
      const { followers, repos, stars } = JSON.parse(cached);
      document.getElementById('ghFollowers').textContent = followers;
      document.getElementById('ghRepos').textContent     = repos;
      document.getElementById('ghStars').textContent     = stars;
      return;
    }
    const [userRes, reposRes] = await Promise.all([
      fetch('https://api.github.com/users/tls-client'),
      fetch('https://api.github.com/users/tls-client/repos?per_page=100')
    ]);
    const user  = await userRes.json();
    const repos = await reposRes.json();

    const followers = user.followers ?? '—';
    const repoCount = user.public_repos ?? '—';
    const stars = Array.isArray(repos)
      ? repos.reduce((sum, r) => sum + r.stargazers_count, 0)
      : 0;

    document.getElementById('ghFollowers').textContent = followers;
    document.getElementById('ghRepos').textContent     = repoCount;
    document.getElementById('ghStars').textContent     = stars;

    sessionStorage.setItem('gh_stats', JSON.stringify({ followers, repos: repoCount, stars }));
  } catch(e) {}
}

async function loadCommitGraph() {
  try {
    const cached = sessionStorage.getItem('gh_commits');
    if (cached) {
      const { counts, total, maxDay, lastDay } = JSON.parse(cached);
      document.getElementById('ghCommitsSub').textContent   = `Last 30 days · Max/day ${maxDay}`;
      document.getElementById('ghTotalCommits').textContent = `${total} commits total`;
      document.getElementById('ghLastDay').textContent      = `Last day ${lastDay} commits`;
      drawCommitChart(counts);
      return;
    }
    const res   = await fetch('https://api.github.com/users/tls-client/repos?per_page=100');
    const repos = await res.json();
    if (!Array.isArray(repos)) return;

    const days = 30;
    const counts = new Array(days).fill(0);
    const now = Date.now();

    await Promise.all(repos.slice(0, 10).map(async repo => {
      try {
        const r = await fetch(`https://api.github.com/repos/tls-client/${repo.name}/commits?per_page=100&since=${new Date(now - days*86400000).toISOString()}`);
        const commits = await r.json();
        if (!Array.isArray(commits)) return;
        commits.forEach(c => {
          const date = new Date(c.commit.author.date);
          const diffDays = Math.floor((now - date.getTime()) / 86400000);
          if (diffDays >= 0 && diffDays < days) counts[days - 1 - diffDays]++;
        });
      } catch(e) {}
    }));

    const total = counts.reduce((a,b) => a+b, 0);
    const maxDay = Math.max(...counts);
    const lastDay = counts[counts.length - 1];

    document.getElementById('ghCommitsSub').textContent   = `Last ${days} days · Max/day ${maxDay}`;
    document.getElementById('ghTotalCommits').textContent = `${total} commits total`;
    document.getElementById('ghLastDay').textContent      = `Last day ${lastDay} commits`;

    sessionStorage.setItem('gh_commits', JSON.stringify({ counts, total, maxDay, lastDay }));
    drawCommitChart(counts);
  } catch(e) {}
}

function drawCommitChart(counts) {
  const canvas = document.getElementById('commitChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.offsetWidth || 700;
  const h = 100;
  canvas.width  = w;
  canvas.height = h;

  const max = Math.max(...counts, 1);
  const pad = 4;
  const step = (w - pad * 2) / (counts.length - 1);

  ctx.clearRect(0, 0, w, h);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(41,212,120,0.35)');
  grad.addColorStop(1, 'rgba(41,212,120,0)');

  ctx.beginPath();
  counts.forEach((v, i) => {
    const x = pad + i * step;
    const y = h - pad - (v / max) * (h - pad * 2);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(pad + (counts.length-1) * step, h);
  ctx.lineTo(pad, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  counts.forEach((v, i) => {
    const x = pad + i * step;
    const y = h - pad - (v / max) * (h - pad * 2);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#29d478';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

loadGitHubStats();
loadCommitGraph();
