/**
 * app.js — 前台应用逻辑
 * 初始化 → 菜单切换 → 列表渲染 → 详情打开
 */
(function () {
  const MENU = [
    { key: 'xingyin', label: '行吟册 · 絮' },
    { key: 'shinian', label: '十年灯 · 文' },
    { key: 'xueye', label: '雪夜舟 · 图' },
    { key: 'gexidong', label: '各西东 · 语' },
    { key: 'shanye', label: '山野渔夫' }
  ];

  let currentKey = null;
  let currentItems = [];

  const els = {};

  function q(id) { return document.getElementById(id); }

  async function init() {
    els.sidebar = q('sidebar-menu');
    els.brandSubtitle = q('brand-subtitle');
    els.main = q('main');
    els.listView = q('list-view');
    els.detailView = q('detail-view');

    try {
      const settings = await DataLoader.loadSettings();
      applyTheme(settings);
    } catch (e) {
      console.warn('主题加载失败，使用默认样式', e);
    }

    renderMenu();
    switchMenu(MENU[0].key);
  }

  function applyTheme(settings) {
    if (settings.background) document.body.style.background = settings.background;
    if (settings.color) document.documentElement.style.setProperty('--ink', settings.color);
    if (settings.subtitle && els.brandSubtitle) els.brandSubtitle.textContent = settings.subtitle;
  }

  function renderMenu() {
    els.sidebar.innerHTML = '';
    MENU.forEach((item) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.textContent = item.label;
      btn.dataset.key = item.key;
      btn.addEventListener('click', () => switchMenu(item.key));
      li.appendChild(btn);
      els.sidebar.appendChild(li);
    });
  }

  function markActiveMenu(key) {
    Array.from(els.sidebar.children).forEach((li) => {
      const btn = li.querySelector('button');
      li.classList.toggle('active', btn.dataset.key === key);
    });
  }

  async function switchMenu(key) {
    currentKey = key;
    markActiveMenu(key);
    closeDetail(false);
    els.listView.innerHTML = '<p class="loading">加载中…</p>';

    try {
      if (key === 'shanye') {
        const bio = await DataLoader.loadShanye();
        els.listView.innerHTML = `<div class="bio">${escapeHtml(bio) || '暂无简介'}</div>`;
        currentItems = [];
        return;
      }
      const items = await DataLoader.load(key);
      currentItems = items;
      renderList(key, items);
    } catch (e) {
      els.listView.innerHTML = `<p class="loading">加载失败：${escapeHtml(e.message)}</p>`;
    }
  }

  function renderList(key, items) {
    if (!items.length) {
      els.listView.innerHTML = '<p class="list-empty">暂无内容</p>';
      return;
    }
    const ul = document.createElement('ul');
    ul.className = 'list';

    items.forEach((it) => {
      const li = document.createElement('li');
      li.className = 'list-item';
      if (key === 'xueye') li.classList.add('with-thumb');
      li.addEventListener('click', () => openDetail(key, it.id));

      if (key === 'xueye') {
        const thumb = document.createElement('img');
        thumb.className = 'thumb';
        thumb.src = it.imageList[0] || '';
        thumb.alt = '';
        li.appendChild(thumb);
      }

      const titleBlock = document.createElement('div');
      titleBlock.className = 'title-block';

      const titleEl = document.createElement('span');
      titleEl.className = 'title';
      if (key === 'shinian' && it.top) {
        const pin = document.createElement('span');
        pin.className = 'pin';
        pin.textContent = '📌';
        titleEl.appendChild(pin);
      }
      titleEl.appendChild(document.createTextNode(titleFor(key, it)));
      titleBlock.appendChild(titleEl);

      const excerptText = excerptFor(key, it);
      if (excerptText) {
        const excerpt = document.createElement('span');
        excerpt.className = 'excerpt';
        excerpt.textContent = excerptText;
        titleBlock.appendChild(excerpt);
      }

      li.appendChild(titleBlock);

      const dateEl = document.createElement('span');
      dateEl.className = 'date';
      dateEl.textContent = it.date || '';
      li.appendChild(dateEl);

      ul.appendChild(li);
    });

    els.listView.innerHTML = '';
    els.listView.appendChild(ul);
  }

  function titleFor(key, it) {
    if (key === 'shinian') return it.title;
    if (key === 'xingyin') return truncate(it.content, 30);
    if (key === 'xueye') return it.category || '图集';
    if (key === 'gexidong') return truncate(it.content, 30);
    return '';
  }

  function excerptFor(key, it) {
    if (key === 'shinian') return truncate(it.content, 60);
    return '';
  }

  function truncate(str, n) {
    if (!str) return '';
    return str.length > n ? str.slice(0, n) + '…' : str;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML.replace(/\n/g, '<br>');
  }

  // ---------- 详情页 ----------

  async function openDetail(key, id) {
    els.detailView.innerHTML = '<p class="loading">加载中…</p>';
    document.body.classList.add('detail-open');
    els.listView.style.display = 'none';
    els.detailView.style.display = 'block';

    let title = '', date = '', bodyHtml = '';

    try {
      if (key === 'shinian') {
        const article = await DataLoader.loadArticleById(id);
        const listItem = currentItems.find((i) => i.id === id);
        title = (article && article.meta.title) || (listItem && listItem.title) || '';
        date = (article && article.meta.date) || (listItem && listItem.date) || '';
        bodyHtml = article
          ? bodyToHtml(article.body)
          : `<p>${escapeHtml((listItem && listItem.content) || '')}</p>`;
      } else if (key === 'xingyin') {
        const item = currentItems.find((i) => i.id === id);
        title = truncate(item.content, 30);
        date = item.date;
        bodyHtml = `<p>${escapeHtml(item.content)}</p>`;
      } else if (key === 'xueye') {
        const item = currentItems.find((i) => i.id === id);
        title = item.category || '图集';
        date = item.date;
        bodyHtml = `<div class="image-group">${item.imageList
          .map((src) => `<img src="${escapeAttr(src)}" alt="">`)
          .join('')}</div>`;
      } else if (key === 'gexidong') {
        const item = currentItems.find((i) => i.id === id);
        title = truncate(item.content, 30);
        date = item.date;
        bodyHtml = `<p>${escapeHtml(item.content)}</p>`;
      }
    } catch (e) {
      bodyHtml = `<p>内容加载失败：${escapeHtml(e.message)}</p>`;
    }

    const menuLabel = (MENU.find((m) => m.key === key) || {}).label || '';

    els.detailView.innerHTML = `
      <nav class="breadcrumb">
        <button id="btn-home">‹ 家</button> / ${escapeHtml(menuLabel)} / ${escapeHtml(title)}
      </nav>
      <h2 class="detail-title">${escapeHtml(title)}</h2>
      <span class="detail-date">${escapeHtml(date)}</span>
      <div class="detail-body">${bodyHtml}</div>
      <div class="comments" id="comments-root"></div>
      <button class="back-link" id="btn-back">‹ 返回列表</button>
    `;

    q('btn-home').addEventListener('click', () => closeDetail(true));
    q('btn-back').addEventListener('click', () => closeDetail(true));

    if (window.Comments) {
      Comments.load(`${key}-${id}`, title);
    }
  }

  function bodyToHtml(body) {
    // 富文本详情已是 HTML；纯文本详情按空行分段落
    if (/<[a-z][\s\S]*>/i.test(body)) return body;
    return body
      .split(/\n{2,}/)
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join('');
  }

  function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;');
  }

  function closeDetail(backToList) {
    document.body.classList.remove('detail-open');
    els.detailView.style.display = 'none';
    els.detailView.innerHTML = '';
    if (backToList) els.listView.style.display = '';
  }

  document.addEventListener('DOMContentLoaded', init);
})();
