// data.js —— GitHub 文件读写解析器（南山集）
const DataLoader = {
  owner: "MatildaHan",
  repo: "MatildaHan.github.io",
  branch: "main",
  baseUrl: "",

  init() {
    this.baseUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents`;
  },

  // ---------- 读取文件 ----------
  async getFile(path) {
    const url = `${this.baseUrl}/${path}?ref=${this.branch}`;
    const res = await fetch(url);
    if (res.status === 404) return { content: "", sha: null, notFound: true };
    if (!res.ok) throw new Error(`读取失败: ${res.status}`);
    const json = await res.json();
    const raw = json.content ? atob(json.content.replace(/\s/g, "")) : "";
    return { content: raw, sha: json.sha, notFound: false };
  },

  // ---------- 写入文件（核心） ----------
  async writeGitHubFile(path, content, message) {
    const token = localStorage.getItem("github_token");
    if (!token) throw new Error("未配置 GitHub Token");

    // 先读取已有文件获取 sha（用于更新）
    let sha = null;
    try {
      const existing = await this.getFile(path);
      sha = existing.sha;
    } catch (e) {
      // 文件不存在，新建
    }

    // UTF-8 → base64
    const encoded = this.utf8ToBase64(content);

    const body = {
      message: message || `更新 ${path}`,
      content: encoded,
      branch: this.branch
    };
    if (sha) body.sha = sha;

    const res = await fetch(`${this.baseUrl}/${path}`, {
      method: "PUT",
      headers: {
        "Authorization": `token ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/vnd.github.v3+json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`写入失败: ${res.status} ${err.message || ""}`);
    }
    return await res.json();
  },

  // ---------- 删除文件 ----------
  async deleteGitHubFile(path, message) {
    const token = localStorage.getItem("github_token");
    if (!token) throw new Error("未配置 GitHub Token");

    const existing = await this.getFile(path);
    if (!existing.sha) throw new Error("文件不存在");

    const body = {
      message: message || `删除 ${path}`,
      sha: existing.sha,
      branch: this.branch
    };

    const res = await fetch(`${this.baseUrl}/${path}`, {
      method: "DELETE",
      headers: {
        "Authorization": `token ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/vnd.github.v3+json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`删除失败: ${res.status} ${err.message || ""}`);
    }
    return true;
  },

  // ---------- 解析管道符分隔的 md ----------
  parsePipe(text) {
    if (!text || !text.trim()) return [];
    const lines = text.trim().split("\n").filter(l => l.trim());
    const out = [];
    for (let line of lines) {
      const arr = line.split("|");
      out.push(arr.map(x => x.trim()));
    }
    return out;
  },

  // ---------- 加载栏目数据 ----------
  async loadMd(key) {
    const path = `data/${key}.md`;
    const { content } = await this.getFile(path);
    return this.parsePipe(content);
  },

  // ---------- 加载分类 ----------
  async loadCategories(key) {
    const path = `data/categories_${key}.md`;
    const { content } = await this.getFile(path);
    if (!content.trim()) return [];
    return content.trim().split("\n").map(l => l.trim()).filter(Boolean);
  },

  // ---------- 保存分类 ----------
  async saveCategories(key, categories) {
    const path = `data/categories_${key}.md`;
    const content = categories.join("\n") + "\n";
    await this.writeGitHubFile(path, content, `更新分类 ${key}`);
  },

  // ---------- 加载站点设置 ----------
  async loadSettings() {
    try {
      const { content } = await this.getFile("data/settings.json");
      if (!content.trim()) return this.defaultSettings();
      return JSON.parse(content);
    } catch (e) {
      return this.defaultSettings();
    }
  },

  defaultSettings() {
    return {
      siteName: "南山集",
      siteDesc: "春山如黛草如烟",
      bgColor: "#f7f7f7",
      textColor: "#111111",
      accentColor: "#4A6C5C",
      backgroundImage: ""
    };
  },

  // ---------- 保存站点设置 ----------
  async saveSettings(settings) {
    await this.writeGitHubFile("data/settings.json", JSON.stringify(settings, null, 2), "更新站点设置");
  },

  // ---------- 加载文章详情 ----------
  async loadArticleById(id) {
    const path = `articles/${id}.md`;
    const { content } = await this.getFile(path);
    return content;
  },

  // ---------- 工具：UTF-8 转 Base64 ----------
  utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },

  // ---------- 生成唯一 ID ----------
  genId(prefix) {
    return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  },

  // ---------- 生成日期 ----------
  today() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
};

DataLoader.init();
