// admin.js 南山集后台完整代码
const Admin = {
  token: null,
  currentPanel: "xingyin",
  modalWrap: null,
  modalBody: null,
  modalMeta: { key: null, id: null, isNew: false },

  async init() {
    this.modalWrap = document.getElementById("modalWrap");
    this.modalBody = document.getElementById("modalBody");
    this.token = localStorage.getItem("github_token");

    if (!this.token) {
      const t = prompt("请输入GitHub Personal Access Token（需要repo、issues权限）");
      if (!t) {
        alert("无Token无法进行后台管理");
        return;
      }
      localStorage.setItem("github_token", t);
      this.token = t;
    }
    document.querySelector("#tokenStatus").innerText = `Token: ${this.token.slice(0, 8)}***`;

    // 导航事件
    document.querySelectorAll(".admin-nav-item").forEach(el => {
      el.onclick = () => {
        document.querySelectorAll(".admin-nav-item").forEach(n => n.classList.remove("active"));
        el.classList.add("active");
        this.currentPanel = el.dataset.panel;
        this.renderPanel(this.currentPanel);
      };
    });
    document.querySelector(`.admin-nav-item[data-panel="xingyin"]`).classList.add("active");

    // 弹窗事件
    document.querySelector("#modalClose").onclick = () => this.closeModal();
    document.querySelector("#modalCancel").onclick = () => this.closeModal();
    document.querySelector("#modalSave").onclick = () => this.onModalSave();

    await this.renderPanel("xingyin");
  },

  // GitHub底层写入文件
  async writeGitHubFile(path, content, sha, commitMsg) {
    const body = {
      message: commitMsg || "update file",
      content: DataLoader.utf8ToBase64(content)
    };
    if (sha) body.sha = sha;
    const res = await fetch(`${DataLoader.baseUrl}/${path}?ref=${DataLoader.branch}`, {
      method: "PUT",
      headers: {
        "Authorization": `token ${this.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`writeGitHubFile fail ${res.status}: ${errText}`);
    }
    return await res.json();
  },

  // GitHub删除文件
  async deleteGitHubFile(path, sha, commitMsg) {
    const body = {
      message: commitMsg || "delete file",
      sha: sha
    };
    const res = await fetch(`${DataLoader.baseUrl}/${path}?ref=${DataLoader.branch}`, {
      method: "DELETE",
      headers: {
        "Authorization": `token ${this.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`deleteGitHubFile fail ${res.status}`);
    return await res.json();
  },

  // 生成唯一ID
  genId(prefix) {
    return prefix + Date.now().toString(36);
  },

  // 获取当前日期 YYYY‑MM‑DD
  getTodayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  },

  async renderPanel(panelKey) {
    const wrap = document.getElementById("adminPanel");
    wrap.innerHTML = "加载中...";
    try {
      if (panelKey === "xingyin") {
        const rows = await DataLoader.loadMd("xingyin");
        wrap.innerHTML = `
          <h2>行吟册·絮</h2>
          <button class="btn btn-primary" onclick="Admin.showAdd('xingyin')">+新增短句</button>
          <table>
            <thead><tr><th>ID</th><th>内容</th><th>分类</th><th>日期</th><th>操作</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${r[0]}</td>
                  <td>${r[1]}</td>
                  <td>${r[2]}</td>
                  <td>${r[3]}</td>
                  <td>
                    <button class="btn" onclick="Admin.showEdit('xingyin','${r[0]}')">编辑</button>
                    <button class="btn" onclick="Admin.doDelete('xingyin','${r[0]}')">删除</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
      } else if (panelKey === "shinian") {
        const rows = await DataLoader.loadMd("shinian");
        wrap.innerHTML = `
          <h2>十年灯·文</h2>
          <button class="btn btn-primary" onclick="Admin.showAdd('shinian')">+新增文章</button>
          <table>
            <thead><tr><th>ID</th><th>标题</th><th>分类</th><th>日期</th><th>置顶</th><th>操作</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${r[0]}</td>
                  <td>${r[1]}</td>
                  <td>${r[3]}</td>
                  <td>${r[4]}</td>
                  <td>${r[5] === "true" ? "📌" : "-"}</td>
                  <td>
                    <button class="btn" onclick="Admin.showEdit('shinian','${r[0]}')">编辑</button>
                    <button class="btn" onclick="Admin.doDelete('shinian','${r[0]}')">删除</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
      } else if (panelKey === "xueye") {
        const rows = await DataLoader.loadMd("xueye");
        wrap.innerHTML = `
          <h2>雪夜舟·图</h2>
          <button class="btn btn-primary" onclick="Admin.showAdd('xueye')">+新增图集</button>
          <table>
            <thead><tr><th>ID</th><th>分类</th><th>日期</th><th>操作</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${r[0]}</td>
                  <td>${r[2]}</td>
                  <td>${r[1]}</td>
                  <td>
                    <button class="btn" onclick="Admin.showEdit('xueye','${r[0]}')">编辑</button>
                    <button class="btn" onclick="Admin.doDelete('xueye','${r[0]}')">删除</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
      } else if (panelKey === "gexidong") {
        const rows = await DataLoader.loadMd("gexidong");
        wrap.innerHTML = `
          <h2>各西东·语</h2>
          <button class="btn btn-primary" onclick="Admin.showAdd('gexidong')">+新增留言</button>
          <table>
            <thead><tr><th>ID</th><th>内容</th><th>日期</th><th>操作</th></tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${r[0]}</td>
                  <td>${r[1]}</td>
                  <td>${r[2]}</td>
                  <td>
                    <button class="btn" onclick="Admin.showEdit('gexidong','${r[0]}')">编辑</button>
                    <button class="btn" onclick="Admin.doDelete('gexidong','${r[0]}')">删除</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
      } else if (panelKey === "shanye") {
        const { content } = await DataLoader.getFile("data/shanye.md");
        wrap.innerHTML = `
          <h2>山野渔夫（个人简介）</h2>
          <textarea id="shanyeText" rows="12">${content}</textarea>
          <br/>
          <button class="btn btn-primary" onclick="Admin.saveShanye()">保存</button>
        `;
      } else if (panelKey === "category") {
        wrap.innerHTML = "加载中...";
        const catXingyin = await DataLoader.loadCategoryFile("xingyin");
        const catShinian = await DataLoader.loadCategoryFile("shinian");
        const catXueye = await DataLoader.loadCategoryFile("xueye");

        let html = `<h2>分类管理</h2>
        <div style="margin:8px 0;color:#666">
        遵循文档：分别读取 data/categories_xingyin.md、categories_shinian.md、categories_xueye.md
        </div>

        <div style="margin:16px 0;border:1px solid #eee;padding:12px;border-radius:4px;">
          <h4>📄 行吟册·絮 分类</h4>
          <div style="margin-top:8px;">
            ${catXingyin.length>0 ? catXingyin.map(c=>`<span class="tag" style="margin:2px 4px 2px 0;">${c}</span>`).join("") : "<span style='color:#999'>暂无分类</span>"}
          </div>
        </div>

        <div style="margin:16px 0;border:1px solid #eee;padding:12px;border-radius:4px;">
          <h4>📄 十年灯·文 分类</h4>
          <div style="margin-top:8px;">
            ${catShinian.length>0 ? catShinian.map(c=>`<span class="tag" style="margin:2px 4px 2px 0;">${c}</span>`).join("") : "<span style='color:#999'>暂无分类</span>"}
          </div>
        </div>

        <div style="margin:16px 0;border:1px solid #eee;padding:12px;border-radius:4px;">
          <h4>📄 雪夜舟·图 分类</h4>
          <div style="margin-top:8px;">
            ${catXueye.length>0 ? catXueye.map(c=>`<span class="tag" style="margin:2px 4px 2px 0;">${c}</span>`).join("") : "<span style='color:#999'>暂无分类</span>"}
          </div>
        </div>

        <div style="margin-top:24px;color:#777;font-size:0.9rem;">
          <p>操作提示：</p>
          <ul>
            <li>每个分类文件一行写一个分类；</li>
            <li>如果文件不存在，页面显示【暂无分类】不会报错崩溃；</li>
            <li>新增/删除分类需要在仓库手动编辑对应 md 文件。</li>
          </ul>
        </div>
        `;
        wrap.innerHTML = html;
      } else if (panelKey === "commentAudit") {
        wrap.innerHTML = `
          <h2>评论审核</h2>
          <p>评论基于GitHub Issues实现，待审核标签：pending；通过后打上approved并关闭issue。</p>
          <p style="color:#666">提示：可在此面板调用GitHub Issues接口拉取待审核评论，当前为UI占位。</p>
        `;
      } else if (panelKey === "setting") {
        const set = await DataLoader.loadSettings();
        wrap.innerHTML = `
          <h2>站点设置</h2>
          <div>站点名称:<input id="s_name" value="${set.siteName}"/></div>
          <div>站点描述:<input id="s_desc" value="${set.siteDesc}"/></div>
          <div>强调色:<input id="s_accent" value="${set.accentColor}"/></div>
          <button class="btn btn-primary" onclick="Admin.saveSetting()">保存设置</button>
        `;
      }
    } catch (err) {
      console.error("renderPanel error", err);
      document.getElementById("adminPanel").innerHTML = `<p style="color:red">加载异常：${err.message}</p>`;
    }
  },

  showAdd(key) {
    this.openModal(key, null, true);
  },
  showEdit(key, id) {
    this.openModal(key, id, false);
  },

  async openModal(key, id, isNew) {
    this.modalMeta = { key, id, isNew };
    document.getElementById("modalTitle").innerText = isNew ? "新增" : "编辑";
    this.modalWrap.classList.remove("hidden");
    // 根据栏目渲染表单
    if (key === "xingyin") {
      const cats = await DataLoader.loadCategoryFile("xingyin");
      this.modalBody.innerHTML = `
        <div>内容(最多50字符)：<input id="m_content" maxlength="50"/></div>
        <div>分类：
          <select id="m_cat">
            ${cats.map(c => `<option value="${c}">${c}</option>`).join("")}
          </select>
        </div>
      `;
    } else if (key === "shinian") {
      const cats = await DataLoader.loadCategoryFile("shinian");
      this.modalBody.innerHTML = `
        <div>标题：<input id="m_title"/></div>
        <div>分类：
          <select id="m_cat">
            ${cats.map(c => `<option value="${c}">${c}</option>`).join("")}
          </select>
        </div>
        <div>置顶：<input type="checkbox" id="m_top"/></div>
        <div>正文(富文本)：<div contenteditable id="m_body" style="min-height:180px;border:1px solid #ccc;padding:8px;"></div></div>
      `;
    } else if (key === "xueye") {
      const cats = await DataLoader.loadCategoryFile("xueye");
      this.modalBody.innerHTML = `
        <div>分类：
          <select id="m_cat">
            ${cats.map(c => `<option value="${c}">${c}</option>`).join("")}
          </select>
        </div>
        <div>图片URL(多个逗号分隔)：<input id="m_urls"/></div>
      `;
    } else if (key === "gexidong") {
      this.modalBody.innerHTML = `
        <div>留言内容：<textarea id="m_content"></textarea></div>
      `;
    }
    // 编辑回填数据
    if (!isNew) {
      const mdRows = await DataLoader.loadMd(key);
      const row = mdRows.find(r => r[0] === id);
      if (!row) return;
      if (key === "xingyin") {
        document.getElementById("m_content").value = row[1];
        document.getElementById("m_cat").value = row[2];
      } else if (key === "shinian") {
        document.getElementById("m_title").value = row[1];
        document.getElementById("m_cat").value = row[3];
        document.getElementById("m_top").checked = row[5] === "true";
      } else if (key === "xueye") {
        document.getElementById("m_cat").value = row[2];
        document.getElementById("m_urls").value = row[3];
      } else if (key === "gexidong") {
        document.getElementById("m_content").value = row[1];
      }
    }
  },

  closeModal() {
    this.modalWrap.classList.add("hidden");
    this.modalMeta = { key: null, id: null, isNew: false };
  },

  async onModalSave() {
    const { key, id, isNew } = this.modalMeta;
    try {
      const mdPath = `data/${key}.md`;
      const { content: mdText, sha } = await DataLoader.getFile(mdPath);
      let rows = DataLoader.parsePipe(mdText);
      const today = this.getTodayStr();

      if (key === "xingyin") {
        const content = document.getElementById("m_content").value.trim();
        const cat = document.getElementById("m_cat").value;
        if (!content) throw new Error("内容不能为空");
        if (isNew) {
          const newId = this.genId("xy");
          rows.push([newId, content, cat, today]);
        } else {
          const idx = rows.findIndex(r => r[0] === id);
          rows[idx] = [id, content, cat, rows[idx][3]];
        }
      } else if (key === "shinian") {
        const title = document.getElementById("m_title").value.trim();
        const cat = document.getElementById("m_cat").value;
        const top = document.getElementById("m_top").checked ? "true" : "false";
        const bodyHtml = document.getElementById("m_body").innerHTML;
        if (!title) throw new Error("标题不能为空");
        let articleId;
        if (isNew) {
          articleId = this.genId("sn");
          rows.push([articleId, title, bodyHtml.slice(0,60)+"…", cat, today, top]);
          // 写入文章详情文件 articles/sn‑xxx.md
          await this.writeGitHubFile(`articles/${articleId}.md`, bodyHtml, null, `create article ${articleId}`);
        } else {
          articleId = id;
          const idx = rows.findIndex(r => r[0] === id);
          rows[idx] = [id, title, bodyHtml.slice(0,60)+"…", cat, rows[idx][4], top];
          // 更新文章详情
          const artFile = await DataLoader.getFile(`articles/${articleId}.md`);
          await this.writeGitHubFile(`articles/${articleId}.md`, bodyHtml, artFile.sha, `update article ${articleId}`);
        }
      } else if (key === "xueye") {
        const cat = document.getElementById("m_cat").value;
        const urls = document.getElementById("m_urls").value.trim();
        if (isNew) {
          const newId = this.genId("xyimg");
          rows.push([newId, today, cat, urls]);
        } else {
          const idx = rows.findIndex(r => r[0] === id);
          rows[idx] = [id, rows[idx][1], cat, urls];
        }
      } else if (key === "gexidong") {
        const content = document.getElementById("m_content").value.trim();
        if (!content) throw new Error("内容不能为空");
        if (isNew) {
          const newId = this.genId("gy");
          rows.push([newId, content, today]);
        } else {
          const idx = rows.findIndex(r => r[0] === id);
          rows[idx] = [id, content, rows[idx][2]];
        }
      }

      // 回写md文件
      const newMdContent = rows.map(r => r.join("|")).join("\n") + "\n";
      await this.writeGitHubFile(mdPath, newMdContent, sha, isNew ? "add item" : "update item");
      alert("保存成功");
      this.closeModal();
      await this.renderPanel(this.currentPanel);
    } catch (e) {
      console.error("保存失败", e);
      alert("保存失败：" + e.message);
    }
  },

  async doDelete(key, id) {
    if (!confirm("确认删除该条目？")) return;
    try {
      const mdPath = `data/${key}.md`;
      const { content: mdText, sha } = await DataLoader.getFile(mdPath);
      let rows = DataLoader.parsePipe(mdText);
      // 十年灯额外删除文章文件
      if (key === "shinian") {
        try {
          const artPath = `articles/${id}.md`;
          const artFile = await DataLoader.getFile(artPath);
          await this.deleteGitHubFile(artPath, artFile.sha, "delete article");
        } catch (e) { console.warn("文章文件不存在，跳过删除"); }
      }
      rows = rows.filter(r => r[0] !== id);
      const newMdContent = rows.map(r => r.join("|")).join("\n") + "\n";
      await this.writeGitHubFile(mdPath, newMdContent, sha, "delete item");
      alert("删除完成");
      await this.renderPanel(this.currentPanel);
    } catch (err) {
      console.error(err);
      alert("删除失败：" + err.message);
    }
  },

  async saveShanye() {
    try {
      const val = document.getElementById("shanyeText").value;
      const { sha } = await DataLoader.getFile("data/shanye.md");
      await this.writeGitHubFile("data/shanye.md", val, sha, "update shanye intro");
      alert("保存成功");
      await this.renderPanel("shanye");
    } catch (e) {
      alert("保存失败：" + e.message);
    }
  },

  async saveSetting() {
    try {
      const payload = {
        siteName: document.getElementById("s_name").value,
        siteDesc: document.getElementById("s_desc").value,
        accentColor: document.getElementById("s_accent").value
      };
      const { sha } = await DataLoader.getFile("data/settings.json");
      await this.writeGitHubFile("data/settings.json", JSON.stringify(payload, null, 2), sha, "update site settings");
      alert("设置保存成功");
      await this.renderPanel("setting");
    } catch (e) {
      alert("保存设置失败：" + e.message);
    }
  }
};

window.onload = () => Admin.init();
