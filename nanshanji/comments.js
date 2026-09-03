/**
 * comments.js — 评论系统（基于 GitHub Issues）
 *
 * 读取：GET /repos/{owner}/{repo}/issues?labels=comment,approved&state=closed
 *       在 body 中匹配 [page:pageId] 来筛选出属于当前页面的评论
 * 提交：POST /repos/{owner}/{repo}/issues  labels: comment, pending
 *
 * 重要说明：GitHub 创建 Issue 必须携带具有 public_repo 权限的身份令牌，
 * 纯静态页面没有服务端可以代为签发/隐藏令牌。因此这里让访客在提交评论时
 * 自行输入一个 GitHub Token（仅保存在 sessionStorage，关闭标签页即失效，
 * 不会写入 localStorage 或上传到任何第三方）。如果需要真正匿名评论，
 * 需要额外一个轻量后端或 Serverless 函数来代理创建 Issue。
 */
(function () {
  const CFG = window.SITE_CONFIG;

  function apiUrl(path) {
    return `${CFG.apiBase}/repos/${CFG.owner}/${CFG.repo}${path}`;
  }

  async function load(pageId, pageTitle) {
    const root = document.getElementById('comments-root');
    if (!root) return;
    root.innerHTML = `
      <h3>评论</h3>
      <div id="comment-list-wrap"><p class="loading">加载评论中…</p></div>
      <form class="comment-form" id="comment-form">
        <input type="text" id="comment-author" placeholder="你的称呼（可选）">
        <textarea id="comment-content" placeholder="写下你的想法…" required></textarea>
        <button type="submit">提交评论</button>
        <p class="comment-status" id="comment-status">评论将在管理员审核后展示。</p>
      </form>
    `;

    document
      .getElementById('comment-form')
      .addEventListener('submit', (e) => {
        e.preventDefault();
        submit(pageId, pageTitle);
      });

    try {
      const res = await fetch(
        apiUrl(`/issues?labels=comment,approved&state=closed&per_page=100`)
      );
      if (!res.ok) throw new Error(`评论加载失败（${res.status}）`);
      const issues = await res.json();
      const mine = issues.filter((iss) => iss.body && iss.body.includes(`[page:${pageId}]`));
      renderList(mine);
    } catch (e) {
      document.getElementById('comment-list-wrap').innerHTML =
        `<p class="comment-empty">评论加载失败：${escapeHtml(e.message)}</p>`;
    }
  }

  function renderList(issues) {
    const wrap = document.getElementById('comment-list-wrap');
    if (!wrap) return;
    if (!issues.length) {
      wrap.innerHTML = '<p class="comment-empty">还没有评论，来说两句吧</p>';
      return;
    }
    const ul = document.createElement('ul');
    ul.className = 'comment-list';
    issues
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .forEach((iss) => {
        const li = document.createElement('li');
        li.className = 'comment-item';
        const cleanBody = iss.body.replace(/\[page:[^\]]+\]/, '').trim();
        const date = new Date(iss.created_at).toISOString().slice(0, 10);
        li.innerHTML = `
          <div class="meta">
            <span class="author">${escapeHtml(iss.user ? iss.user.login : '匿名')}</span>
            · <span class="date">${date}</span>
          </div>
          <div class="body">${escapeHtml(cleanBody)}</div>
        `;
        ul.appendChild(li);
      });
    wrap.innerHTML = '';
    wrap.appendChild(ul);
  }

  async function submit(pageId, pageTitle) {
    const statusEl = document.getElementById('comment-status');
    const content = document.getElementById('comment-content').value.trim();
    const author = document.getElementById('comment-author').value.trim();
    if (!content) return;

    let token = sessionStorage.getItem('comment_token');
    if (!token) {
      token = window.prompt(
        '提交评论需要一个具有 public_repo 权限的 GitHub Token（仅保存在本次浏览会话中）：'
      );
      if (!token) return;
      sessionStorage.setItem('comment_token', token);
    }

    statusEl.textContent = '提交中…';

    const title = `[评论] ${pageTitle || pageId} - ${new Date().toISOString()}`;
    const body = `[page:${pageId}]\n\n${author ? `**${author}**：\n\n` : ''}${content}`;

    try {
      const res = await fetch(apiUrl('/issues'), {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github+json'
        },
        body: JSON.stringify({ title, body, labels: ['comment', 'pending'] })
      });
      if (!res.ok) throw new Error(`提交失败（${res.status}）`);
      document.getElementById('comment-form').reset();
      statusEl.textContent = '提交成功，等待管理员审核后展示。';
    } catch (e) {
      statusEl.textContent = `提交失败：${e.message}`;
      sessionStorage.removeItem('comment_token');
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  window.Comments = { load };
})();
