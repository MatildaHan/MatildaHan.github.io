// comments.js —— 基于 GitHub Issues 的评论系统（南山集）
const CommentSystem = {
  owner: "MatildaHan",
  repo: "MatildaHan.github.io",
  pageId: null,
  apiBase: "",

  init() {
    this.apiBase = `https://api.github.com/repos/${this.owner}/${this.repo}`;
  },

  setPage(pid) {
    this.pageId = pid;
  },

  // ---------- 加载已审核评论 ----------
  async loadApprovedComments() {
    // 标签：comment + approved + page:xxx，状态 closed
    const labels = `comment,approved,page:${this.pageId}`;
    const url = `${this.apiBase}/issues?labels=${encodeURIComponent(labels)}&state=closed&per_page=100`;
    try {
      const res = await fetch(url);
      if (!res.ok) return [];
      const issues = await res.json();
      const comments = [];
      for (const issue of issues) {
        const parsed = this.parseIssueBody(issue.body);
        // 加载管理员回复
        let reply = "";
        try {
          const cRes = await fetch(`${this.apiBase}/issues/${issue.number}/comments?per_page=1`);
          if (cRes.ok) {
            const cList = await cRes.json();
            if (cList.length > 0) reply = cList[0].body;
          }
        } catch (e) {}
        comments.push({
          name: parsed.name || "匿名",
          content: parsed.content || issue.body,
          date: this.formatDate(issue.created_at),
          reply: reply
        });
      }
      return comments;
    } catch (e) {
      return [];
    }
  },

  // ---------- 解析 issue body ----------
  parseIssueBody(body) {
    const result = { name: "", email: "", content: "" };
    if (!body) return result;
    const lines = body.split("\n");
    let contentStart = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("昵称:")) result.name = line.slice(3).trim();
      else if (line.startsWith("邮箱:")) result.email = line.slice(3).trim();
      else if (line.startsWith("内容:")) {
        contentStart = i + 1;
        break;
      }
    }
    if (contentStart >= 0) {
      result.content = lines.slice(contentStart).join("\n").trim();
    }
    return result;
  },

  // ---------- 提交评论（创建 pending issue） ----------
  async submitComment(payload) {
    const token = localStorage.getItem("github_token");
    if (!token) throw new Error("需要 Token 才能提交评论（访客模式下请联系站长）");

    const body = {
      title: `[评论] ${payload.title || "文章"} - ${new Date().toLocaleString("zh-CN")}`,
      body: `[page:${this.pageId}]\n昵称:${payload.name}\n邮箱:${payload.email || "无"}\n内容:\n${payload.content}`,
      labels: ["comment", "pending", `page:${this.pageId}`]
    };

    const res = await fetch(`${this.apiBase}/issues`, {
      method: "POST",
      headers: {
        "Authorization": `token ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/vnd.github.v3+json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`提交失败: ${res.status} ${err.message || ""}`);
    }
    return await res.json();
  },

  // ---------- 渲染评论区 ----------
  async renderWrap(wrapDom) {
    wrapDom.innerHTML = `
      <div class="comment-section">
        <h3>留言</h3>
        <div class="comment-form">
          <div class="form-row">
            <input type="text" id="c_name" placeholder="你的名字" maxlength="20"/>
            <input type="text" id="c_email" placeholder="邮箱（选填，不公开）"/>
          </div>
          <textarea id="c_content" placeholder="写下你的想法，提交后需站长审核" maxlength="500"></textarea>
          <div class="form-foot">
            <span id="c_count">0/500</span>
            <button id="c_submit" class="btn-submit">提交留言</button>
          </div>
        </div>
        <div id="commentList" class="comment-list">
          <div class="loading">加载中...</div>
        </div>
      </div>
    `;

    // 字符计数
    const textarea = wrapDom.querySelector("#c_content");
    const countEl = wrapDom.querySelector("#c_count");
    textarea.addEventListener("input", () => {
      countEl.textContent = `${textarea.value.length}/500`;
    });

    // 提交
    wrapDom.querySelector("#c_submit").onclick = async () => {
      const name = wrapDom.querySelector("#c_name").value.trim();
      const email = wrapDom.querySelector("#c_email").value.trim();
      const content = textarea.value.trim();
      if (!name) { alert("请填写名字"); return; }
      if (!content) { alert("请填写留言内容"); return; }
      const btn = wrapDom.querySelector("#c_submit");
      btn.disabled = true;
      btn.textContent = "提交中...";
      try {
        await this.submitComment({ name, email, content, title: this.pageId });
        alert("提交成功！留言将在站长审核后显示。");
        wrapDom.querySelector("#c_name").value = "";
        wrapDom.querySelector("#c_email").value = "";
        textarea.value = "";
        countEl.textContent = "0/500";
      } catch (e) {
        alert(e.message);
      } finally {
        btn.disabled = false;
        btn.textContent = "提交留言";
      }
    };

    // 加载已审核评论
    const listDom = wrapDom.querySelector("#commentList");
    const comments = await this.loadApprovedComments();
    if (comments.length === 0) {
      listDom.innerHTML = `<div class="no-comment">暂无留言，来写第一条吧。</div>`;
    } else {
      listDom.innerHTML = comments.map(c => `
        <div class="comment-item">
          <div class="comment-head">
            <span class="comment-name">${this.escapeHtml(c.name)}</span>
            <span class="comment-date">${c.date}</span>
          </div>
          <div class="comment-content">${this.escapeHtml(c.content).replace(/\n/g, "<br>")}</div>
          ${c.reply ? `<div class="comment-reply"><span class="reply-label">站长回复：</span>${this.escapeHtml(c.reply).replace(/\n/g, "<br>")}</div>` : ""}
        </div>
      `).join("");
    }
  },

  formatDate(iso) {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  },

  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
};

CommentSystem.init();
