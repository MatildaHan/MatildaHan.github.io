// admin.js —— 后台管理完整逻辑（南山集）
const Admin = {
  token: null,
  currentPanel: "xingyin",
  modalWrap: null,
  modalBody: null,
  modalTitle: null,
  modalData: null, // { key, id, isNew, row }
  categoriesCache: {},

  async init() {
    this.modalWrap = document.getElementById("modalWrap");
    this.modalBody = document.getElementById("modalBody");
    this.modalTitle = document.getElementById("modalTitle");

    // Token 管理
    this.token = localStorage.getItem("github_token");
    if (!this.token) {
      this.showTokenInput();
      return;
    }
    this.updateTokenStatus();

    // 导航
    document.querySelectorAll(".admin-nav-item").forEach(el => {
      el.onclick = () => {
        document.querySelectorAll(".admin-nav-item").forEach(n => n.classList.remove("active"));
        el.classList.add("active");
        this.currentPanel = el.dataset.panel;
        this.renderPanel(this.currentPanel);
      };
    });
    document.querySelector('.admin-nav-item[data-panel="xingyin"]').classList.add("active");

    // 弹窗按钮
    document.getElementById("modalClose").onclick = () => this.closeModal();
    document.getElementById("modalCancel").onclick = () => this.closeModal();
    document.getElementById("modalSave").onclick = () => this.onModalSave();

    // Token 重置按钮
    document.getElementById("tokenStatus").onclick = () => {
      if (confirm("确定要清除已保存的 Token 吗？")) {
        localStorage.removeItem("github_token");
        location.reload();
      }
    };

    await this.renderPanel("xingyin");
  },

  // ---------- Token 输入 ----------
  showTokenInput() {
    const wrap = document.getElementById("adminPanel");
    wrap.innerHTML = `
      <div class="token-setup">
        <h2>连接 GitHub 仓库</h2>
        <p>请输入 GitHub Personal Access Token（需要 repo 和 issues 权限）</p>
        <p class="hint">Token 仅保存在浏览器 localStorage，不会上传到任何服务器。</p>
        <input type="password" id="tokenInput" placeholder="ghp_xxxxxxxxxxxx" style="width:100%;max-width:500px;"/>
        <br/><br/>
        <button class="btn btn-primary" onclick="Admin.saveToken()">保存并连接</button>
        <p class="hint" style="margin-top:16px;">
          如何获取 Token：GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token，勾选 repo 和 issues。
        </p>
      </div>
    `;
  },

  saveToken() {
    const input = document.getElementById("tokenInput");
    const token = input.value.trim();
    if (!token) { alert("请输入 Token"); return; }
    localStorage.setItem("github_token", token);
    this.token = token;
    this.updateTokenStatus();
    this.renderPanel("xingyin");
  },

  updateTokenStatus() {
    const el = document.getElementById("tokenStatus");
    if (this.token) {
      el.innerHTML = `<span class="token-connected">● 已连接 ${this.token.slice(0, 8)}***（点击清除）</span>`;
    } else {
      el.innerHTML = `<span class="token-disconnected">○ 未连接</span>`;
    }
  },

  // ---------- 渲染面板 ----------
  async renderPanel(panelKey) {
    const wrap = document.getElementById("adminPanel");
    wrap.innerHTML = '<div class="loading">加载中...</div>';

    try {
      switch (panelKey) {
        case "xingyin": await this.renderXingyin(wrap); break;
        case "shinian": await this.renderShinian(wrap); break;
        case "xueye": await this.renderXueye(wrap); break;
        case "gexidong": await this.renderGexidong(wrap); break;
        case "shanye": await this.renderShanye(wrap); break;
        case "category": await this.renderCategory(wrap); break;
        case "commentAudit": await this.renderCommentAudit(wrap); break;
        case "setting": await this.renderSetting(wrap); break;
      }
    } catch (e) {
      wrap.innerHTML = `<div class="error">加载失败：${e.message}<br/><button class="btn" onclick="Admin.renderPanel('${panelKey}')">重试</button></div>`;
    }
  },

  // ---------- 行吟册·絮 ----------
  async renderXingyin(wrap) {
    const rows = await DataLoader.loadMd("xingyin");
    wrap.innerHTML = `
      <div class="panel-head">
        <h2>行吟册·絮</h2>
        <button class="btn btn-primary" onclick="Admin.showAdd('xingyin')">+ 新增短句</button>
      </div>
      <table>
        <thead><tr><th style="width:80px">ID</th><th>内容</th><th style="width:100px">分类</th><th style="width:110px">日期</th><th style="width:120px">操作</th></tr></thead>
        <tbody>
          ${rows.length === 0 ? '<tr><td colspan="5" class="empty">暂无数据</td></tr>' : rows.map((r, i) => `
            <tr>
              <td>${this.escape(r[0])}</td>
              <td>${this.escape(r[1])}</td>
              <td>${this.escape(r[2] || "")}</td>
              <td>${this.escape(r[3] || "")}</td>
              <td>
                <button class="btn btn-sm" onclick="Admin.showEdit('xingyin',${i})">编辑</button>
                <button class="btn btn-sm btn-danger" onclick="Admin.doDelete('xingyin',${i})">删除</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  },

  // ---------- 十年灯·文 ----------
  async renderShinian(wrap) {
    const rows = await DataLoader.loadMd("shinian");
    wrap.innerHTML = `
      <div class="panel-head">
        <h2>十年灯·文</h2>
        <button class="btn btn-primary" onclick="Admin.showAdd('shinian')">+ 新增文章</button>
      </div>
      <table>
        <thead><tr><th style="width:80px">ID</th><th>标题</th><th style="width:100px">分类</th><th style="width:110px">日期</th><th style="width:60px">置顶</th><th style="width:160px">操作</th></tr></thead>
        <tbody>
          ${rows.length === 0 ? '<tr><td colspan="6" class="empty">暂无数据</td></tr>' : rows.map((r, i) => `
            <tr>
              <td>${this.escape(r[0])}</td>
              <td>${this.escape(r[1])}</td>
              <td>${this.escape(r[3] || "")}</td>
              <td>${this.escape(r[4] || "")}</td>
              <td>
                <label class="switch">
                  <input type="checkbox" ${r[5] === "true" ? "checked" : ""} onchange="Admin.toggleTop(${i}, this.checked)"/>
                  <span class="slider"></span>
                </label>
              </td>
              <td>
                <button class="btn btn-sm" onclick="Admin.showEdit('shinian',${i})">编辑</button>
                <button class="btn btn-sm btn-danger" onclick="Admin.doDelete('shinian',${i})">删除</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  },

  // ---------- 雪夜舟·图 ----------
  async renderXueye(wrap) {
    const rows = await DataLoader.loadMd("xueye");
    wrap.innerHTML = `
      <div class="panel-head">
        <h2>雪夜舟·图</h2>
        <button class="btn btn-primary" onclick="Admin.showAdd('xueye')">+ 新增图集</button>
      </div>
      <table>
        <thead><tr><th style="width:80px">ID</th><th style="width:100px">分类</th><th style="width:110px">日期</th><th>图片</th><th style="width:120px">操作</th></tr></thead>
        <tbody>
          ${rows.length === 0 ? '<tr><td colspan="5" class="empty">暂无数据</td></tr>' : rows.map((r, i) => {
            const urls = (r[3] || "").split(",").map(u => u.trim()).filter(Boolean);
            return `
            <tr>
              <td>${this.escape(r[0])}</td>
              <td>${this.escape(r[2] || "")}</td>
              <td>${this.escape(r[1] || "")}</td>
              <td>${urls.length} 张 ${urls[0] ? `<img src="${urls[0]}" class="thumb-img"/>` : ""}</td>
              <td>
                <button class="btn btn-sm" onclick="Admin.showEdit('xueye',${i})">编辑</button>
                <button class="btn btn-sm btn-danger" onclick="Admin.doDelete('xueye',${i})">删除</button>
              </td>
            </tr>
          `;}).join("")}
        </tbody>
      </table>
    `;
  },

  // ---------- 各西东·语 ----------
  async renderGexidong(wrap) {
    const rows = await DataLoader.loadMd("gexidong");
    wrap.innerHTML = `
      <div class="panel-head">
        <h2>各西东·语</h2>
        <button class="btn btn-primary" onclick="Admin.showAdd('gexidong')">+ 新增留言</button>
      </div>
      <table>
        <thead><tr><th style="width:80px">ID</th><th>内容</th><th style="width:110px">日期</th><th style="width:120px">操作</th></tr></thead>
        <tbody>
          ${rows.length === 0 ? '<tr><td colspan="4" class="empty">暂无数据</td></tr>' : rows.map((r, i) => `
            <tr>
              <td>${this.escape(r[0])}</td>
              <td>${this.escape(r[1])}</td>
              <td>${this.escape(r[2] || "")}</td>
              <td>
                <button class="btn btn-sm" onclick="Admin.showEdit('gexidong',${i})">编辑</button>
                <button class="btn btn-sm btn-danger" onclick="Admin.doDelete('gexidong',${i})">删除</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  },

  // ---------- 山野渔夫 ----------
  async renderShanye(wrap) {
    const { content } = await DataLoader.getFile("data/shanye.md");
    wrap.innerHTML = `
      <div class="panel-head">
        <h2>山野渔夫（个人简介）</h2>
        <button class="btn btn-primary" onclick="Admin.saveShanye()">保存</button>
      </div>
      <textarea id="shanyeText" rows="16" style="width:100%;font-family:SimSun,serif;font-size:15px;line-height:1.8;">${this.escape(content)}</textarea>
      <p class="hint">纯文本，支持换行。保存后前台「山野渔夫」页面会显示此内容。</p>
    `;
  },

  async saveShanye() {
    const val = document.getElementById("shanyeText").value;
    try {
      await DataLoader.writeGitHubFile("data/shanye.md", val, "更新个人简介");
      alert("保存成功！GitHub Pages 约 1-3 分钟后更新。");
    } catch (e) {
      alert("保存失败：" + e.message);
    }
  },

  // ---------- 分类管理 ----------
  async renderCategory(wrap) {
    const keys = [
      { key: "xingyin", name: "行吟册·絮" },
      { key: "shinian", name: "十年灯·文" },
      { key: "xueye", name: "雪夜舟·图" }
    ];

    let html = '<div class="panel-head"><h2>分类管理</h2></div>';
    for (const { key, name } of keys) {
      const cats = await DataLoader.loadCategories(key);
      const data = await DataLoader.loadMd(key).catch(() => []);
      // 统计使用次数
      const catIndex = key === "xingyin" ? 2 : key === "shinian" ? 3 : 2;
      const usage = {};
      data.forEach(r => {
        const c = r[catIndex];
        if (c) usage[c] = (usage[c] || 0) + 1;
      });

      html += `
        <div class="category-block">
          <h3>${name}
            <button class="btn btn-sm btn-primary" onclick="Admin.addCategory('${key}')">+ 新增</button>
          </h3>
          <div class="category-list">
            ${cats.length === 0 ? '<span class="empty">暂无分类</span>' : cats.map(c => `
              <span class="category-tag">
                ${this.escape(c)} <small>(${usage[c] || 0})</small>
                <button class="btn btn-xs" onclick="Admin.editCategory('${key}','${this.escape(c)}')">编辑</button>
                <button class="btn btn-xs btn-danger" onclick="Admin.deleteCategory('${key}','${this.escape(c)}',${usage[c] || 0})">删除</button>
              </span>
            `).join("")}
          </div>
        </div>
      `;
    }
    wrap.innerHTML = html;
  },

  async addCategory(key) {
    const name = prompt("请输入新分类名称：");
    if (!name || !name.trim()) return;
    const cats = await DataLoader.loadCategories(key);
    if (cats.includes(name.trim())) { alert("分类已存在"); return; }
    cats.push(name.trim());
    await DataLoader.saveCategories(key, cats);
    this.renderPanel("category");
  },

  async editCategory(key, oldName) {
    const newName = prompt("修改分类名称：", oldName);
    if (!newName || !newName.trim()) return;
    const cats = await DataLoader.loadCategories(key);
    const idx = cats.indexOf(oldName);
    if (idx === -1) return;
    cats[idx] = newName.trim();
    await DataLoader.saveCategories(key, cats);

    // 同步更新数据文件中的分类
    const data = await DataLoader.loadMd(key);
    const catIndex = key === "xingyin" ? 2 : key === "shinian" ? 3 : 2;
    let changed = false;
    data.forEach(r => {
      if (r[catIndex] === oldName) { r[catIndex] = newName.trim(); changed = true; }
    });
    if (changed) {
      const content = data.map(r => r.join("|")).join("\n") + "\n";
      await DataLoader.writeGitHubFile(`data/${key}.md`, content, `同步分类名 ${oldName}→${newName}`);
    }
    this.renderPanel("category");
  },

  async deleteCategory(key, name, usage) {
    if (usage > 0) {
      if (!confirm(`分类「${name}」正被 ${usage} 条内容使用，确定删除？（内容不会被删除，仅移除分类标签）`)) return;
    } else {
      if (!confirm(`确定删除分类「${name}」？`)) return;
    }
    const cats = await DataLoader.loadCategories(key);
    const filtered = cats.filter(c => c !== name);
    await DataLoader.saveCategories(key, filtered);
    this.renderPanel("category");
  },

  // ---------- 评论审核 ----------
  async renderCommentAudit(wrap) {
    wrap.innerHTML = `
      <div class="panel-head">
        <h2>评论审核</h2>
        <button class="btn btn-primary" onclick="Admin.renderPanel('commentAudit')">刷新</button>
      </div>
      <div id="pendingList"><div class="loading">加载待审核评论...</div></div>
    `;

    try {
      const apiBase = `https://api.github.com/repos/${DataLoader.owner}/${DataLoader.repo}`;
      const res = await fetch(`${apiBase}/issues?labels=comment,pending&state=open&per_page=100`);
      if (!res.ok) throw new Error(`API错误 ${res.status}`);
      const issues = await res.json();

      const listDom = document.getElementById("pendingList");
      if (issues.length === 0) {
        listDom.innerHTML = '<div class="empty">暂无待审核评论</div>';
        return;
      }

      listDom.innerHTML = issues.map(issue => {
        const parsed = this.parseIssueBody(issue.body);
        return `
          <div class="comment-audit-item">
            <div class="audit-head">
              <strong>${this.escape(parsed.name || "匿名")}</strong>
              <span class="audit-date">${this.formatDate(issue.created_at)}</span>
              <span class="audit-page">页面: ${this.escape(parsed.page || issue.title)}</span>
            </div>
            <div class="audit-content">${this.escape(parsed.content).replace(/\n/g, "<br>")}</div>
            <div class="audit-actions">
              <button class="btn btn-sm btn-primary" onclick="Admin.approveComment(${issue.number})">✅ 通过</button>
              <button class="btn btn-sm btn-danger" onclick="Admin.rejectComment(${issue.number})">❌ 拒绝</button>
              <button class="btn btn-sm" onclick="Admin.replyComment(${issue.number})">💬 回复</button>
            </div>
          </div>
        `;
      }).join("");
    } catch (e) {
      document.getElementById("pendingList").innerHTML = `<div class="error">加载失败：${e.message}</div>`;
    }
  },

  parseIssueBody(body) {
    const result = { name: "", email: "", content: "", page: "" };
    if (!body) return result;
    const lines = body.split("\n");
    let contentStart = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("[page:")) result.page = line.slice(6, -1);
      else if (line.startsWith("昵称:")) result.name = line.slice(3).trim();
      else if (line.startsWith("邮箱:")) result.email = line.slice(3).trim();
      else if (line.startsWith("内容:")) contentStart = i + 1;
    }
    if (contentStart >= 0) result.content = lines.slice(contentStart).join("\n").trim();
    return result;
  },

  async approveComment(issueNumber) {
    try {
      const apiBase = `https://api.github.com/repos/${DataLoader.owner}/${DataLoader.repo}`;
      const token = this.token;
      // 添加 approved 标签，移除 pending，关闭 issue
      await fetch(`${apiBase}/issues/${issueNumber}/labels`, {
        method: "POST",
        headers: { "Authorization": `token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ labels: ["approved"] })
      });
      await fetch(`${apiBase}/issues/${issueNumber}/labels/pending`, {
        method: "DELETE",
        headers: { "Authorization": `token ${token}` }
      });
      await fetch(`${apiBase}/issues/${issueNumber}`, {
        method: "PATCH",
        headers: { "Authorization": `token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ state: "closed" })
      });
      alert("已通过审核");
      this.renderPanel("commentAudit");
    } catch (e) {
      alert("操作失败：" + e.message);
    }
  },

  async rejectComment(issueNumber) {
    if (!confirm("确定拒绝这条评论？")) return;
    try {
      const apiBase = `https://api.github.com/repos/${DataLoader.owner}/${DataLoader.repo}`;
      const token = this.token;
      await fetch(`${apiBase}/issues/${issueNumber}/labels`, {
        method: "POST",
        headers: { "Authorization": `token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ labels: ["rejected"] })
      });
      await fetch(`${apiBase}/issues/${issueNumber}/labels/pending`, {
        method: "DELETE",
        headers: { "Authorization": `token ${token}` }
      });
      await fetch(`${apiBase}/issues/${issueNumber}`, {
        method: "PATCH",
        headers: { "Authorization": `token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ state: "closed" })
      });
      alert("已拒绝");
      this.renderPanel("commentAudit");
    } catch (e) {
      alert("操作失败：" + e.message);
    }
  },

  async replyComment(issueNumber) {
    const reply = prompt("请输入回复内容：");
    if (!reply || !reply.trim()) return;
    try {
      const apiBase = `https://api.github.com/repos/${DataLoader.owner}/${DataLoader.repo}`;
      const token = this.token;
      await fetch(`${apiBase}/issues/${issueNumber}/comments`, {
        method: "POST",
        headers: { "Authorization": `token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply.trim() })
      });
      alert("回复成功");
    } catch (e) {
      alert("回复失败：" + e.message);
    }
  },

  // ---------- 站点设置 ----------
  async renderSetting(wrap) {
    const s = await DataLoader.loadSettings();
    wrap.innerHTML = `
      <div class="panel-head">
        <h2>站点设置</h2>
        <button class="btn btn-primary" onclick="Admin.saveSetting()">保存设置</button>
      </div>
      <div class="setting-form">
        <div class="form-group">
          <label>站点名称</label>
          <input type="text" id="s_name" value="${this.escape(s.siteName || "")}"/>
        </div>
        <div class="form-group">
          <label>站点描述（标语）</label>
          <input type="text" id="s_desc" value="${this.escape(s.siteDesc || "")}"/>
        </div>
        <div class="form-group">
          <label>背景色</label>
          <div class="color-row">
            <input type="color" id="s_bgColor" value="${this.escape(s.bgColor || "#f7f7f7")}"/>
            <input type="text" id="s_bgColorText" value="${this.escape(s.bgColor || "#f7f7f7")}"/>
          </div>
        </div>
        <div class="form-group">
          <label>文字颜色</label>
          <div class="color-row">
            <input type="color" id="s_textColor" value="${this.escape(s.textColor || "#111111")}"/>
            <input type="text" id="s_textColorText" value="${this.escape(s.textColor || "#111111")}"/>
          </div>
        </div>
        <div class="form-group">
          <label>强调色</label>
          <div class="color-row">
            <input type="color" id="s_accentColor" value="${this.escape(s.accentColor || "#4A6C5C")}"/>
            <input type="text" id="s_accentColorText" value="${this.escape(s.accentColor || "#4A6C5C")}"/>
          </div>
        </div>
        <div class="form-group">
          <label>背景图片 URL（选填）</label>
          <input type="text" id="s_bgImage" value="${this.escape(s.backgroundImage || "")}" placeholder="https://..."/>
        </div>
      </div>
      <p class="hint">保存后前台主题会自动更新。GitHub Pages 约 1-3 分钟后生效。</p>
    `;
    // 联动颜色选择器
    ["bgColor", "textColor", "accentColor"].forEach(c => {
      const picker = document.getElementById(`s_${c}`);
      const text = document.getElementById(`s_${c}Text`);
      picker.oninput = () => text.value = picker.value;
      text.oninput = () => picker.value = text.value;
    });
  },

  async saveSetting() {
    const settings = {
      siteName: document.getElementById("s_name").value.trim(),
      siteDesc: document.getElementById("s_desc").value.trim(),
      bgColor: document.getElementById("s_bgColorText").value.trim(),
      textColor: document.getElementById("s_textColorText").value.trim(),
      accentColor: document.getElementById("s_accentColorText").value.trim(),
      backgroundImage: document.getElementById("s_bgImage").value.trim()
    };
    try {
      await DataLoader.saveSettings(settings);
      alert("保存成功！");
    } catch (e) {
      alert("保存失败：" + e.message);
    }
  },

  // ---------- 置顶开关 ----------
  async toggleTop(index, checked) {
    const rows = await DataLoader.loadMd("shinian");
    if (!rows[index]) return;
    rows[index][5] = checked ? "true" : "false";
    const content = rows.map(r => r.join("|")).join("\n") + "\n";
    try {
      await DataLoader.writeGitHubFile("data/shinian.md", content, `更新置顶 ${rows[index][0]}`);
    } catch (e) {
      alert("保存失败：" + e.message);
      this.renderPanel("shinian");
    }
  },

  // ---------- 弹窗：新增/编辑 ----------
  showAdd(key) {
    this.openModal(key, null, true, null);
  },

  showEdit(key, index) {
    DataLoader.loadMd(key).then(rows => {
      this.openModal(key, index, false, rows[index]);
    });
  },

  openModal(key, index, isNew, row) {
    this.modalData = { key, index, isNew, row };
    const names = {
      xingyin: "短句",
      shinian: "文章",
      xueye: "图集",
      gexidong: "留言"
    };
    this.modalTitle.textContent = isNew ? `新增${names[key]}` : `编辑${names[key]}`;
    this.modalWrap.classList.remove("hidden");

    // 根据类型渲染表单
    if (key === "xingyin") this.renderXingyinForm(row);
    else if (key === "shinian") this.renderShinianForm(row);
    else if (key === "xueye") this.renderXueyeForm(row);
    else if (key === "gexidong") this.renderGexidongForm(row);
  },

  closeModal() {
    this.modalWrap.classList.add("hidden");
    this.modalData = null;
  },

  // 行吟册表单
  async renderXingyinForm(row) {
    const cats = await DataLoader.loadCategories("xingyin");
    this.modalBody.innerHTML = `
      <div class="form-group">
        <label>短句内容（最多50字）</label>
        <input type="text" id="f_content" maxlength="50" value="${row ? this.escape(row[1]) : ""}" placeholder="晚风吹过南山..."/>
        <div class="char-count"><span id="f_count">${row ? row[1].length : 0}</span>/50</div>
      </div>
      <div class="form-group">
        <label>分类</label>
        <select id="f_category">
          <option value="">无分类</option>
          ${cats.map(c => `<option value="${this.escape(c)}" ${row && row[2] === c ? "selected" : ""}>${this.escape(c)}</option>`).join("")}
        </select>
      </div>
    `;
    const input = document.getElementById("f_content");
    const count = document.getElementById("f_count");
    input.addEventListener("input", () => count.textContent = input.value.length);
  },

  // 十年灯表单（富文本）
  async renderShinianForm(row) {
    const cats = await DataLoader.loadCategories("shinian");
    let articleContent = "";
    if (row && !row._isNew) {
      try {
        articleContent = await DataLoader.loadArticleById(row[0]);
      } catch (e) {}
    }
    this.modalBody.innerHTML = `
      <div class="form-group">
        <label>标题</label>
        <input type="text" id="f_title" value="${row ? this.escape(row[1]) : ""}" placeholder="文章标题"/>
      </div>
      <div class="form-group">
        <label>摘要（列表页显示，截取前60字）</label>
        <input type="text" id="f_preview" maxlength="100" value="${row ? this.escape(row[2] || "") : ""}" placeholder="一句话摘要..."/>
      </div>
      <div class="form-group">
        <label>分类</label>
        <select id="f_category">
          <option value="">无分类</option>
          ${cats.map(c => `<option value="${this.escape(c)}" ${row && row[3] === c ? "selected" : ""}>${this.escape(c)}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label>正文（富文本）</label>
        <div class="rte-toolbar">
          <button type="button" onclick="document.execCommand('bold')"><b>B</b></button>
          <button type="button" onclick="document.execCommand('italic')"><i>I</i></button>
          <button type="button" onclick="document.execCommand('underline')"><u>U</u></button>
          <button type="button" onclick="document.execCommand('strikeThrough')"><s>S</s></button>
          <button type="button" onclick="document.execCommand('insertUnorderedList')">• 列表</button>
          <button type="button" onclick="document.execCommand('insertOrderedList')">1. 序号</button>
          <button type="button" onclick="document.execCommand('formatBlock','h3')">H3</button>
          <button type="button" onclick="document.execCommand('formatBlock','p')">P</button>
        </div>
        <div id="f_content" class="rte-editor" contenteditable="true">${articleContent}</div>
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="f_top" ${row && row[5] === "true" ? "checked" : ""}/> 置顶此文章</label>
      </div>
    `;
  },

  // 雪夜舟表单
  async renderXueyeForm(row) {
    const cats = await DataLoader.loadCategories("xueye");
    const urls = row ? (row[3] || "").split(",").map(u => u.trim()).filter(Boolean) : [""];
    this.modalBody.innerHTML = `
      <div class="form-group">
        <label>分类</label>
        <select id="f_category">
          <option value="">无分类</option>
          ${cats.map(c => `<option value="${this.escape(c)}" ${row && row[2] === c ? "selected" : ""}>${this.escape(c)}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label>图片 URL 列表</label>
        <div id="f_urls">
          ${urls.map((u, i) => `
            <div class="url-row">
              <input type="text" class="f_url" value="${this.escape(u)}" placeholder="https://..."/>
              <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">×</button>
            </div>
          `).join("")}
        </div>
        <button type="button" class="btn btn-sm" onclick="Admin.addUrlRow()">+ 添加图片</button>
      </div>
    `;
  },

  addUrlRow() {
    const container = document.getElementById("f_urls");
    const div = document.createElement("div");
    div.className = "url-row";
    div.innerHTML = `
      <input type="text" class="f_url" placeholder="https://..."/>
      <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(div);
  },

  // 各西东表单
  renderGexidongForm(row) {
    this.modalBody.innerHTML = `
      <div class="form-group">
        <label>留言内容</label>
        <textarea id="f_content" rows="4" placeholder="...">${row ? this.escape(row[1]) : ""}</textarea>
      </div>
    `;
  },

  // ---------- 弹窗保存 ----------
  async onModalSave() {
    const { key, index, isNew } = this.modalData;
    const saveBtn = document.getElementById("modalSave");
    saveBtn.disabled = true;
    saveBtn.textContent = "保存中...";

    try {
      if (key === "xingyin") await this.saveXingyin(isNew, index);
      else if (key === "shinian") await this.saveShinian(isNew, index);
      else if (key === "xueye") await this.saveXueye(isNew, index);
      else if (key === "gexidong") await this.saveGexidong(isNew, index);

      this.closeModal();
      this.renderPanel(key);
      alert("保存成功！GitHub Pages 约 1-3 分钟后更新。");
    } catch (e) {
      alert("保存失败：" + e.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "保存";
    }
  },

  async saveXingyin(isNew, index) {
    const content = document.getElementById("f_content").value.trim();
    const category = document.getElementById("f_category").value;
    if (!content) throw new Error("内容不能为空");
    if (content.length > 50) throw new Error("内容不能超过50字");

    const rows = await DataLoader.loadMd("xingyin");
    const date = DataLoader.today();

    if (isNew) {
      const id = DataLoader.genId("xy");
      rows.push([id, content, category, date]);
    } else {
      rows[index][1] = content;
      rows[index][2] = category;
    }

    const text = rows.map(r => r.join("|")).join("\n") + "\n";
    await DataLoader.writeGitHubFile("data/xingyin.md", text, isNew ? "新增短句" : "编辑短句");
  },

  async saveShinian(isNew, index) {
    const title = document.getElementById("f_title").value.trim();
    const preview = document.getElementById("f_preview").value.trim();
    const category = document.getElementById("f_category").value;
    const top = document.getElementById("f_top").checked;
    const articleHtml = document.getElementById("f_content").innerHTML;

    if (!title) throw new Error("标题不能为空");

    const rows = await DataLoader.loadMd("shinian");
    const date = DataLoader.today();
    let id;

    if (isNew) {
      id = DataLoader.genId("sn");
      rows.push([id, title, preview, category, date, top ? "true" : "false"]);
    } else {
      id = rows[index][0];
      rows[index][1] = title;
      rows[index][2] = preview;
      rows[index][3] = category;
      rows[index][5] = top ? "true" : "false";
    }

    // 保存索引
    const text = rows.map(r => r.join("|")).join("\n") + "\n";
    await DataLoader.writeGitHubFile("data/shinian.md", text, isNew ? "新增文章" : "编辑文章");

    // 保存文章正文
    await DataLoader.writeGitHubFile(`articles/${id}.md`, articleHtml, isNew ? "新增文章正文" : "更新文章正文");
  },

  async saveXueye(isNew, index) {
    const category = document.getElementById("f_category").value;
    const urlInputs = document.querySelectorAll(".f_url");
    const urls = Array.from(urlInputs).map(i => i.value.trim()).filter(Boolean);
    if (urls.length === 0) throw new Error("至少添加一张图片");

    const rows = await DataLoader.loadMd("xueye");
    const date = DataLoader.today();

    if (isNew) {
      const id = DataLoader.genId("xyg");
      rows.push([id, date, category, urls.join(",")]);
    } else {
      rows[index][2] = category;
      rows[index][3] = urls.join(",");
    }

    const text = rows.map(r => r.join("|")).join("\n") + "\n";
    await DataLoader.writeGitHubFile("data/xueye.md", text, isNew ? "新增图集" : "编辑图集");
  },

  async saveGexidong(isNew, index) {
    const content = document.getElementById("f_content").value.trim();
    if (!content) throw new Error("内容不能为空");

    const rows = await DataLoader.loadMd("gexidong");
    const date = DataLoader.today();

    if (isNew) {
      const id = DataLoader.genId("gxd");
      rows.push([id, content, date]);
    } else {
      rows[index][1] = content;
    }

    const text = rows.map(r => r.join("|")).join("\n") + "\n";
    await DataLoader.writeGitHubFile("data/gexidong.md", text, isNew ? "新增留言" : "编辑留言");
  },

  // ---------- 删除 ----------
  async doDelete(key, index) {
    if (!confirm("确定删除这条数据？此操作不可撤销。")) return;
    try {
      const rows = await DataLoader.loadMd(key);
      const deleted = rows.splice(index, 1)[0];
      const text = rows.map(r => r.join("|")).join("\n") + "\n";
      await DataLoader.writeGitHubFile(`data/${key}.md`, text, `删除 ${key} 条目`);

      // 如果是十年灯文章，同时删除正文文件
      if (key === "shinian" && deleted && deleted[0]) {
        try {
          await DataLoader.deleteGitHubFile(`articles/${deleted[0]}.md`, "删除文章正文");
        } catch (e) { /* 文件可能不存在 */ }
      }

      this.renderPanel(key);
    } catch (e) {
      alert("删除失败：" + e.message);
    }
  },

  // ---------- 工具 ----------
  escape(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  },

  formatDate(iso) {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
};

window.addEventListener("DOMContentLoaded", () => Admin.init());
