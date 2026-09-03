/**
 * admin.js — 后台管理逻辑
 * 登录认证 → 数据操作（增删改）→ 写入 GitHub → 部署
 */
(function () {
  const CFG = window.SITE_CONFIG;
  const D = window.DataLoader;

  const SECTIONS = [
    { key: 'xingyin', label: '行吟册 · 絮' },
    { key: 'shinian', label: '十年灯 · 文' },
    { key: 'xueye', label: '雪夜舟 · 图' },
    { key: 'gexidong', label: '各西东 · 语' },
    { key: 'shanye', label: '山野渔夫' },
    { key: 'categories', label: '分类管理' },
    { key: 'comments', label: '评论审核' },
    { key: 'settings', label: '主题设置' }
  ];

  const CATEGORY_TARGETS = ['xingyin', 'shinian', 'xueye'];

  let currentSection = 'xingyin';
  let cache = {}; // { xingyin: [...], shinian: [...], ... }
  let shaCache = {}; // path -> sha

  // ---------------- GitHub API ----------------

  function token() { return localStorage.getItem('github_token') || ''; }
  function setToken(t) { localStorage.setItem('github_token', t); }
  function clearToken() { localStorage.removeItem('github_token'); }

  function apiUrl(path) { return `${CFG.apiBase}/repos/${CFG.owner}/${CFG.repo}${path}`; }

  async function ghFetch(path, options) {
    const res = await fetch(apiUrl(path), Object.assign({
      headers: {
        Authorization: `token ${token()}`,
        Accept: 'application/vnd.github+json',
        ...(options && options.headers)
      }
    }, options));
    if (res.status === 401) {
      clearToken();
      showLogin('登录已失效，请重新输入 Token');
      throw new Error('身份验证失败');
    }
    return res;
  }

  function utf8ToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function base64ToUtf8(b64) {
    return decodeURIComponent(escape(atob(b64.replace(/\n/g, ''))));
  }

  // 读取文件内容与 sha（不存在则 content 为空字符串，sha 为 null）
  async function readFile(path) {
    const res = await ghFetch(`/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${CFG.branch}`);
    if (res.status === 404) return { content: '', sha: null };
    if (!res.ok) throw new Error(`读取 ${path} 失败（${res.status}）`);
    const data = await res.json();
    shaCache[path] = data.sha;
    return { content: base64ToUtf8(data.content), sha: data.sha };
  }

  async function writeFile(path, content, message) {
    const sha = shaCache[path];
    const body = {
      message: message || `更新 ${path}`,
      content: utf8ToBase64(content),
      branch: CFG.branch
    };
    if (sha) body.sha = sha;
    const res = await ghFetch(`/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`写入 ${path} 失败：${err.message || res.status}`);
    }
    const data = await res.json();
    shaCache[path] = data.content.sha;
    return data;
  }

  // ---------------- 登录 ----------------

  function showLogin(message) {
    const overlay = document.createElement('div');
    overlay.className = 'login-overlay';
    overlay.id = 'login-overlay';
    overlay.innerHTML = `
      <div class="login-box">
        <h2>连接 GitHub</h2>
        <p>${message || '请输入具有 repo 权限的 GitHub Personal Access Token，仅保存在本机浏览器中。'}</p>
        <input type="text" id="token-input" placeholder="ghp_xxxxxxxxxxxx">
        <button class="btn" id="token-submit">连接</button>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('token-submit').addEventListener('click', () => {
      const val = document.getElementById('token-input').value.trim();
      if (!val) return;
      setToken(val);
      overlay.remove();
      boot();
    });
  }

  function renderConnectionStatus() {
    const el = document.getElementById('admin-status');
    if (token()) {
      el.innerHTML = `<span class="connected">● 已连接</span><br><button id="btn-disconnect">断开连接</button>`;
      document.getElementById('btn-disconnect').addEventListener('click', () => {
        clearToken();
        location.reload();
      });
    } else {
      el.innerHTML = `<span>○ 未连接</span>`;
    }
  }

  // ---------------- 布局 / 菜单 ----------------

  function renderMenu() {
    const ul = document.getElementById('admin-menu');
    ul.innerHTML = '';
    SECTIONS.forEach((s) => {
      const li = document.createElement('li');
      li.className = s.key === currentSection ? 'active' : '';
      const btn = document.createElement('button');
      btn.textContent = s.label;
      btn.addEventListener('click', () => switchSection(s.key));
      li.appendChild(btn);
      ul.appendChild(li);
    });
  }

  async function switchSection(key) {
    currentSection = key;
    renderMenu();
    const main = document.getElementById('admin-main-content');
    main.innerHTML = '<p class="loading">加载中…</p>';
    try {
      if (CATEGORY_TARGETS.includes(key)) await renderCategoryEditor(key);
      else if (key === 'shanye') await renderBioEditor();
      else if (key === 'categories') await renderCategoryManager();
      else if (key === 'comments') await renderCommentModeration();
      else if (key === 'settings') await renderSettingsEditor();
    } catch (e) {
      main.innerHTML = `<p class="empty">加载失败：${escapeHtml(e.message)}</p>`;
    }
  }

  function toast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  // ---------------- 通用：栏目数据表格 ----------------

  const LABELS = {
    xingyin: '行吟册 · 絮',
    shinian: '十年灯 · 文',
    xueye: '雪夜舟 · 图',
    gexidong: '各西东 · 语'
  };

  const FIELDS = D.SCHEMA;

  async function loadCategoryItems(key) {
    const path = `data/${key}.md`;
    const { content } = await readFile(path);
    const items = D.parseLines(content, FIELDS[key]);
    if (key === 'xueye') items.forEach((it) => { it.imageList = it.images ? it.images.split(',').map((s) => s.trim()).filter(Boolean) : []; });
    if (key === 'shinian') items.forEach((it) => { it.top = it.top === 'true' || it.top === '1'; });
    cache[key] = items;
    return items;
  }

  function serializeItems(key, items) {
    const fields = FIELDS[key];
    return items.map((it) => {
      return fields.map((f) => {
        if (key === 'xueye' && f === 'images') return D.escapeField((it.imageList || []).join(','));
        if (key === 'shinian' && f === 'top') return it.top ? 'true' : 'false';
        return D.escapeField(it[f]);
      }).join(' | ');
    }).join('\n') + '\n';
  }

  async function saveCategoryItems(key, items, message) {
    cache[key] = items;
    await writeFile(`data/${key}.md`, serializeItems(key, items), message);
  }

  async function renderCategoryEditor(key) {
    const main = document.getElementById('admin-main-content');
    const items = await loadCategoryItems(key);
    const cats = await readCategoriesRaw(key === 'xingyin' || key === 'shinian' || key === 'xueye' ? key : null);

    const rows = items.map((it) => rowHtml(key, it)).join('');
    main.innerHTML = `
      <div class="admin-toolbar">
        <h2>${LABELS[key]}</h2>
        <button class="btn" id="btn-add">+ 新增</button>
      </div>
      <table class="admin-table">
        <thead>${theadHtml(key)}</thead>
        <tbody>${rows || `<tr><td colspan="6" class="empty">暂无内容</td></tr>`}</tbody>
      </table>
    `;

    document.getElementById('btn-add').addEventListener('click', () => showItemModal(key, null, cats));
    items.forEach((it) => {
      const editBtn = document.getElementById(`edit-${it.id}`);
      const delBtn = document.getElementById(`del-${it.id}`);
      if (editBtn) editBtn.addEventListener('click', () => showItemModal(key, it, cats));
      if (delBtn) delBtn.addEventListener('click', () => deleteItem(key, it.id));
      if (key === 'shinian') {
        const top = document.getElementById(`top-${it.id}`);
        if (top) top.addEventListener('change', (e) => toggleTop(it.id, e.target.checked));
      }
    });
  }

  async function readCategoriesRaw(key) {
    if (!key) return [];
    const { content } = await readFile(`data/categories_${key}.md`);
    return content.split('\n').map((l) => l.trim()).filter(Boolean);
  }

  function theadHtml(key) {
    if (key === 'xingyin') return '<tr><th>内容</th><th>分类</th><th>日期</th><th class="col-actions"></th></tr>';
    if (key === 'shinian') return '<tr><th>标题</th><th>分类</th><th>日期</th><th>置顶</th><th class="col-actions"></th></tr>';
    if (key === 'xueye') return '<tr><th>分类</th><th>图片数</th><th>日期</th><th class="col-actions"></th></tr>';
    if (key === 'gexidong') return '<tr><th>内容</th><th>日期</th><th class="col-actions"></th></tr>';
    return '';
  }

  function rowHtml(key, it) {
    if (key === 'xingyin') {
      return `<tr><td>${escapeHtml(truncate(it.content, 40))}</td><td>${escapeHtml(it.category)}</td><td>${escapeHtml(it.date)}</td>
        <td class="col-actions"><button id="edit-${it.id}">编辑</button><button id="del-${it.id}">删除</button></td></tr>`;
    }
    if (key === 'shinian') {
      return `<tr><td>${it.top ? '📌 ' : ''}${escapeHtml(it.title)}</td><td>${escapeHtml(it.category)}</td><td>${escapeHtml(it.date)}</td>
        <td><label class="toggle"><input type="checkbox" id="top-${it.id}" ${it.top ? 'checked' : ''}></label></td>
        <td class="col-actions"><button id="edit-${it.id}">编辑</button><button id="del-${it.id}">删除</button></td></tr>`;
    }
    if (key === 'xueye') {
      return `<tr><td>${escapeHtml(it.category)}</td><td>${it.imageList.length}</td><td>${escapeHtml(it.date)}</td>
        <td class="col-actions"><button id="edit-${it.id}">编辑</button><button id="del-${it.id}">删除</button></td></tr>`;
    }
    if (key === 'gexidong') {
      return `<tr><td>${escapeHtml(truncate(it.content, 50))}</td><td>${escapeHtml(it.date)}</td>
        <td class="col-actions"><button id="edit-${it.id}">编辑</button><button id="del-${it.id}">删除</button></td></tr>`;
    }
    return '';
  }

  function truncate(s, n) { return s && s.length > n ? s.slice(0, n) + '…' : (s || ''); }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function genId(prefix) {
    return `${prefix}-${Date.now()}`;
  }

  // ---------------- 编辑弹窗 ----------------

  function closeModal() {
    const ov = document.getElementById('modal-overlay');
    if (ov) ov.remove();
  }

  function showItemModal(key, item, categories) {
    const isNew = !item;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay';

    let formHtml = '';
    if (key === 'xingyin') {
      formHtml = `
        <div class="field">
          <label>内容（最多 50 字）</label>
          <input type="text" id="f-content" maxlength="50" value="${escapeAttr(item ? item.content : '')}">
          <div class="char-count" id="char-count">0/50</div>
        </div>
        <div class="field"><label>分类</label>${selectHtml(categories, item && item.category)}</div>
      `;
    } else if (key === 'shinian') {
      formHtml = `
        <div class="field"><label>标题</label><input type="text" id="f-title" value="${escapeAttr(item ? item.title : '')}"></div>
        <div class="field">
          <label>正文</label>
          <div class="rte-toolbar">
            <button type="button" data-cmd="bold"><b>B</b></button>
            <button type="button" data-cmd="italic"><i>I</i></button>
            <button type="button" data-cmd="underline"><u>U</u></button>
            <button type="button" data-cmd="strikeThrough"><s>S</s></button>
            <button type="button" data-cmd="insertUnorderedList">•</button>
            <button type="button" data-cmd="insertOrderedList">1.</button>
          </div>
          <div class="rte-editor" id="f-content" contenteditable="true">${item ? (item._fullBody || item.content || '') : ''}</div>
        </div>
        <div class="field"><label>分类</label>${selectHtml(categories, item && item.category)}</div>
        <div class="field"><label class="toggle"><input type="checkbox" id="f-top" ${item && item.top ? 'checked' : ''}> 置顶</label></div>
      `;
    } else if (key === 'xueye') {
      formHtml = `
        <div class="field"><label>分类</label>${selectHtml(categories, item && item.category)}</div>
        <div class="field">
          <label>图片 URL（每行一个）</label>
          <textarea id="f-images">${escapeHtml(item ? (item.imageList || []).join('\n') : '')}</textarea>
        </div>
      `;
    } else if (key === 'gexidong') {
      formHtml = `<div class="field"><label>留言内容</label><textarea id="f-content">${escapeHtml(item ? item.content : '')}</textarea></div>`;
    }

    overlay.innerHTML = `
      <div class="modal-box">
        <h3>${isNew ? '新增' : '编辑'} · ${LABELS[key]}</h3>
        <form id="item-form">
          ${formHtml}
          <div class="modal-actions">
            <button type="button" class="btn secondary" id="btn-cancel">取消</button>
            <button type="submit" class="btn">保存</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('btn-cancel').addEventListener('click', closeModal);

    if (key === 'xingyin') {
      const input = document.getElementById('f-content');
      const counter = document.getElementById('char-count');
      const updateCount = () => {
        const len = input.value.length;
        counter.textContent = `${len}/50`;
        counter.classList.toggle('warn', len >= 45);
      };
      input.addEventListener('input', () => {
        // 防止换行破坏单行数据格式
        input.value = input.value.replace(/\n/g, '');
        updateCount();
      });
      updateCount();
    }

    if (key === 'shinian') {
      overlay.querySelectorAll('.rte-toolbar button').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.execCommand(btn.dataset.cmd, false, null);
          document.getElementById('f-content').focus();
        });
      });
    }

    document.getElementById('item-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveItem(key, item, isNew);
    });
  }

  function selectHtml(categories, selected) {
    const opts = (categories || []).map((c) => `<option value="${escapeAttr(c)}" ${c === selected ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
    return `<select id="f-category">${opts || '<option value="">（未设置分类）</option>'}</select>`;
  }

  function escapeAttr(s) { return (s || '').replace(/"/g, '&quot;'); }

  async function saveItem(key, existing, isNew) {
    const items = cache[key] || (await loadCategoryItems(key));
    const id = existing ? existing.id : genId(key === 'shinian' ? 'sn' : key.slice(0, 2));
    const date = existing ? existing.date : todayStr();

    let record;
    if (key === 'xingyin') {
      record = { id, content: document.getElementById('f-content').value.trim(), category: document.getElementById('f-category').value, date };
    } else if (key === 'shinian') {
      const bodyHtml = document.getElementById('f-content').innerHTML.trim();
      const plainPreview = document.getElementById('f-content').innerText.trim();
      record = {
        id, title: document.getElementById('f-title').value.trim(),
        content: plainPreview, category: document.getElementById('f-category').value,
        date, top: document.getElementById('f-top').checked
      };
      // 完整正文写入 articles/sn-xxx.md
      await writeFile(
        `articles/${id}.md`,
        `---\ntitle: ${record.title}\ndate: ${date}\n---\n${bodyHtml}\n`,
        `保存文章 ${id}`
      );
    } else if (key === 'xueye') {
      const images = document.getElementById('f-images').value.split('\n').map((s) => s.trim()).filter(Boolean);
      record = { id, date, category: document.getElementById('f-category').value, images: images.join(','), imageList: images };
    } else if (key === 'gexidong') {
      record = { id, content: document.getElementById('f-content').value.trim(), date };
    }

    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) items.push(record); else items[idx] = record;

    try {
      await saveCategoryItems(key, items, `${isNew ? '新增' : '编辑'} ${LABELS[key]} ${id}`);
      closeModal();
      toast('保存成功');
      switchSection(key);
    } catch (e) {
      toast(`保存失败：${e.message}`);
    }
  }

  async function deleteItem(key, id) {
    if (!confirm('确定删除这条内容？此操作不可撤销。')) return;
    const items = (cache[key] || []).filter((i) => i.id !== id);
    try {
      await saveCategoryItems(key, items, `删除 ${LABELS[key]} ${id}`);
      toast('已删除');
      switchSection(key);
    } catch (e) {
      toast(`删除失败：${e.message}`);
    }
  }

  async function toggleTop(id, checked) {
    const items = cache['shinian'] || [];
    const it = items.find((i) => i.id === id);
    if (!it) return;
    it.top = checked;
    try {
      await saveCategoryItems('shinian', items, `${checked ? '置顶' : '取消置顶'} ${id}`);
      toast(checked ? '已置顶' : '已取消置顶');
      switchSection('shinian');
    } catch (e) {
      toast(`操作失败：${e.message}`);
    }
  }

  // ---------------- 山野渔夫（简介） ----------------

  async function renderBioEditor() {
    const main = document.getElementById('admin-main-content');
    const { content } = await readFile('data/shanye.md');
    main.innerHTML = `
      <h2>山野渔夫 · 简介</h2>
      <div class="field"><textarea id="f-bio" style="min-height:220px;">${escapeHtml(content)}</textarea></div>
      <button class="btn" id="btn-save-bio">保存</button>
    `;
    document.getElementById('btn-save-bio').addEventListener('click', async () => {
      try {
        await writeFile('data/shanye.md', document.getElementById('f-bio').value, '更新简介');
        toast('保存成功');
      } catch (e) { toast(`保存失败：${e.message}`); }
    });
  }

  // ---------------- 分类管理 ----------------

  async function renderCategoryManager() {
    const main = document.getElementById('admin-main-content');
    main.innerHTML = `<h2>分类管理</h2><div id="cat-panels"></div>`;
    const panels = document.getElementById('cat-panels');

    for (const key of CATEGORY_TARGETS) {
      const cats = await readCategoriesRaw(key);
      const items = cache[key] || (await loadCategoryItems(key));
      const usage = (c) => items.filter((i) => i.category === c).length;

      const section = document.createElement('div');
      section.style.marginBottom = '32px';
      section.innerHTML = `
        <div class="admin-toolbar"><h2 style="font-size:15px;">${LABELS[key]}</h2>
          <button class="btn secondary" data-add="${key}">+ 新增分类</button></div>
        ${cats.map((c) => `
          <div class="category-row">
            <span>${escapeHtml(c)}<span class="count">使用 ${usage(c)} 次</span></span>
            <span>
              <button data-edit="${key}::${escapeAttr(c)}" class="btn secondary">编辑</button>
              <button data-del="${key}::${escapeAttr(c)}" class="btn danger">删除</button>
            </span>
          </div>
        `).join('') || '<p class="empty">暂无分类</p>'}
      `;
      panels.appendChild(section);
    }

    panels.querySelectorAll('[data-add]').forEach((btn) => {
      btn.addEventListener('click', () => addCategory(btn.dataset.add));
    });
    panels.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [key, name] = btn.dataset.edit.split('::');
        editCategory(key, name);
      });
    });
    panels.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [key, name] = btn.dataset.del.split('::');
        deleteCategory(key, name);
      });
    });
  }

  async function saveCategoriesRaw(key, list) {
    await writeFile(`data/categories_${key}.md`, list.join('\n') + '\n', `更新 ${key} 分类`);
  }

  async function addCategory(key) {
    const name = prompt('新分类名称：');
    if (!name) return;
    const cats = await readCategoriesRaw(key);
    if (cats.includes(name)) { toast('该分类已存在'); return; }
    cats.push(name);
    await saveCategoriesRaw(key, cats);
    toast('已新增');
    renderCategoryManager();
  }

  async function editCategory(key, oldName) {
    const name = prompt('修改分类名称：', oldName);
    if (!name || name === oldName) return;
    const cats = await readCategoriesRaw(key);
    const idx = cats.indexOf(oldName);
    if (idx === -1) return;
    cats[idx] = name;
    await saveCategoriesRaw(key, cats);
    // 同步更新已使用该分类的内容
    const items = cache[key] || (await loadCategoryItems(key));
    items.forEach((it) => { if (it.category === oldName) it.category = name; });
    await saveCategoryItems(key, items, `分类重命名 ${oldName} → ${name}`);
    toast('已更新');
    renderCategoryManager();
  }

  async function deleteCategory(key, name) {
    const items = cache[key] || (await loadCategoryItems(key));
    const used = items.filter((i) => i.category === name).length;
    if (used > 0 && !confirm(`该分类下有 ${used} 条内容，删除后这些内容的分类将清空，确定继续？`)) return;
    const cats = (await readCategoriesRaw(key)).filter((c) => c !== name);
    await saveCategoriesRaw(key, cats);
    if (used > 0) {
      items.forEach((it) => { if (it.category === name) it.category = ''; });
      await saveCategoryItems(key, items, `清空已删除分类的引用`);
    }
    toast('已删除');
    renderCategoryManager();
  }

  // ---------------- 评论审核 ----------------

  function apiUrlAbs(path) { return `${CFG.apiBase}/repos/${CFG.owner}/${CFG.repo}${path}`; }

  async function renderCommentModeration() {
    const main = document.getElementById('admin-main-content');
    main.innerHTML = `
      <div class="admin-toolbar"><h2>评论审核</h2><button class="btn secondary" id="btn-refresh">刷新</button></div>
      <div id="pending-list"><p class="loading">加载中…</p></div>
    `;
    document.getElementById('btn-refresh').addEventListener('click', renderCommentModeration);
    await loadPendingComments();
  }

  async function loadPendingComments() {
    const wrap = document.getElementById('pending-list');
    try {
      const res = await ghFetch('/issues?labels=comment,pending&state=open&per_page=100');
      if (!res.ok) throw new Error(`加载失败（${res.status}）`);
      const issues = await res.json();
      if (!issues.length) { wrap.innerHTML = '<p class="empty">暂无待审核评论</p>'; return; }
      wrap.innerHTML = issues.map((iss) => {
        const pageMatch = iss.body && iss.body.match(/\[page:([^\]]+)\]/);
        const page = pageMatch ? pageMatch[1] : '未知页面';
        const clean = (iss.body || '').replace(/\[page:[^\]]+\]/, '').trim();
        return `
          <div class="category-row" style="flex-direction:column;align-items:flex-start;">
            <div><strong>${escapeHtml(page)}</strong> · ${escapeHtml(iss.user ? iss.user.login : '匿名')} · ${new Date(iss.created_at).toISOString().slice(0,10)}</div>
            <div style="margin:8px 0;">${escapeHtml(clean)}</div>
            <div>
              <button class="btn" data-approve="${iss.number}">✅ 通过</button>
              <button class="btn danger" data-reject="${iss.number}">❌ 拒绝</button>
              <button class="btn secondary" data-reply="${iss.number}">💬 回复</button>
            </div>
          </div>
        `;
      }).join('');
      wrap.querySelectorAll('[data-approve]').forEach((b) => b.addEventListener('click', () => moderate(b.dataset.approve, 'approved')));
      wrap.querySelectorAll('[data-reject]').forEach((b) => b.addEventListener('click', () => moderate(b.dataset.reject, 'rejected')));
      wrap.querySelectorAll('[data-reply]').forEach((b) => b.addEventListener('click', () => replyComment(b.dataset.reply)));
    } catch (e) {
      wrap.innerHTML = `<p class="empty">加载失败：${escapeHtml(e.message)}</p>`;
    }
  }

  async function moderate(number, label) {
    try {
      await ghFetch(`/issues/${number}/labels`, {
        method: 'POST',
        body: JSON.stringify({ labels: ['comment', label] })
      });
      await ghFetch(`/issues/${number}`, {
        method: 'PATCH',
        body: JSON.stringify({ state: 'closed' })
      });
      toast(label === 'approved' ? '已通过' : '已拒绝');
      loadPendingComments();
    } catch (e) {
      toast(`操作失败：${e.message}`);
    }
  }

  async function replyComment(number) {
    const text = prompt('回复内容：');
    if (!text) return;
    try {
      await ghFetch(`/issues/${number}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: text })
      });
      toast('回复已发布');
    } catch (e) {
      toast(`回复失败：${e.message}`);
    }
  }

  // ---------------- 主题设置 ----------------

  async function renderSettingsEditor() {
    const main = document.getElementById('admin-main-content');
    const { content } = await readFile('data/settings.json');
    let settings = { background: '#f7f7f7', color: '#111111', subtitle: '南山集' };
    try { if (content) settings = Object.assign(settings, JSON.parse(content)); } catch (e) {}

    main.innerHTML = `
      <h2>主题设置</h2>
      <div class="field"><label>背景色</label><input type="text" id="f-bg" value="${escapeAttr(settings.background)}"></div>
      <div class="field"><label>文字颜色</label><input type="text" id="f-color" value="${escapeAttr(settings.color)}"></div>
      <div class="field"><label>副标题</label><input type="text" id="f-subtitle" value="${escapeAttr(settings.subtitle)}"></div>
      <button class="btn" id="btn-save-settings">保存</button>
      <button class="btn secondary" id="btn-deploy" style="margin-left:10px;">提交并部署</button>
    `;

    document.getElementById('btn-save-settings').addEventListener('click', async () => {
      const newSettings = {
        background: document.getElementById('f-bg').value.trim(),
        color: document.getElementById('f-color').value.trim(),
        subtitle: document.getElementById('f-subtitle').value.trim()
      };
      try {
        await writeFile('data/settings.json', JSON.stringify(newSettings, null, 2), '更新主题设置');
        toast('保存成功');
      } catch (e) { toast(`保存失败：${e.message}`); }
    });

    document.getElementById('btn-deploy').addEventListener('click', deploy);
  }

  async function deploy() {
    try {
      const res = await ghFetch('/pages/builds', { method: 'POST' });
      if (!res.ok && res.status !== 201) throw new Error(`触发失败（${res.status}）`);
      toast('部署已触发，前台将在 1-3 分钟内更新');
    } catch (e) {
      toast(`部署触发失败，但文件已保存：${e.message}`);
    }
  }

  // ---------------- 启动 ----------------

  async function boot() {
    renderConnectionStatus();
    if (!token()) { showLogin(); return; }
    renderMenu();
    switchSection(currentSection);
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
