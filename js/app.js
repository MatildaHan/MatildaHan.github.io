// app.js —— 前台主逻辑（南山集）
const App = {
  currentKey: "xingyin",
  currentData: [],
  listView: null,
  detailView: null,
  sidebar: null,
  settings: null,

  async init() {
    this.listView = document.getElementById("listView");
    this.detailView = document.getElementById("detailView");
    this.sidebar = document.getElementById("sidebar");

    // 加载并应用主题
    this.settings = await DataLoader.loadSettings();
    this.applyTheme(this.settings);

    // 菜单事件
    document.querySelectorAll(".nav-item").forEach(el => {
      el.onclick = () => {
        document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
        el.classList.add("active");
        const key = el.dataset.key;
        this.switchTab(key);
      };
    });

    // 返回按钮
    document.querySelector(".back-btn").onclick = () => this.closeDetail();
    document.querySelector(".breadcrumb").onclick = () => this.closeDetail();

    // 移动端菜单
    document.querySelector("#menuToggle").onclick = () => {
      this.sidebar.classList.toggle("mobile-open");
    };

    // 默认打开行吟册
    document.querySelector('.nav-item[data-key="xingyin"]').classList.add("active");
    await this.switchTab("xingyin");
  },

  // ---------- 应用主题 ----------
  applyTheme(s) {
    const root = document.documentElement;
    if (s.bgColor) root.style.setProperty("--bg", s.bgColor);
    if (s.textColor) root.style.setProperty("--text", s.textColor);
    if (s.accentColor) root.style.setProperty("--accent", s.accentColor);
    if (s.siteName) document.querySelector(".site-title").innerText = s.siteName;
    if (s.siteDesc) document.querySelector(".site-desc").innerText = s.siteDesc;
    if (s.backgroundImage) {
      document.body.style.backgroundImage = `url(${s.backgroundImage})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundAttachment = "fixed";
    }
  },

  async switchTab(key) {
    this.currentKey = key;
    this.closeDetail();
    this.listView.innerHTML = '<div class="loading">加载中...</div>';
    try {
      const data = await DataLoader.loadMd(key);
      this.currentData = data;
      this.renderList(key, data);
    } catch (e) {
      this.listView.innerHTML = `<div class="error">加载失败：${e.message}</div>`;
    }
  },

  renderList(key, rows) {
    this.listView.innerHTML = "";
    if (key === "shanye") {
      // 山野渔夫：纯文本
      const text = rows.map(r => r.join(" ")).join("\n");
      this.listView.innerHTML = `<div class="shanye-content">${text.replace(/\n/g, "<br>")}</div>`;
      return;
    }

    if (rows.length === 0) {
      this.listView.innerHTML = `<div class="empty">暂无内容</div>`;
      return;
    }

    if (key === "xingyin") {
      // id | content | category | date
      rows.forEach(r => {
        const [id, content, cat, date] = r;
        const div = document.createElement("div");
        div.className = "list-item";
        div.innerHTML = `
          <div class="item-main">
            <span class="tag">${this.escape(cat || "")}</span>
            <span class="item-text">${this.escape(content)}</span>
          </div>
          <span class="item-date">${this.escape(date)}</span>
        `;
        div.onclick = () => this.openDetail(key, id, r);
        this.listView.appendChild(div);
      });
    } else if (key === "shinian") {
      // id | title | preview | category | date | top
      const sorted = [...rows].sort((a, b) => {
        const topA = a[5] === "true" ? 1 : 0;
        const topB = b[5] === "true" ? 1 : 0;
        if (topB !== topA) return topB - topA;
        return (b[4] || "").localeCompare(a[4] || "");
      });
      sorted.forEach(r => {
        const [id, title, preview, cat, date, top] = r;
        const div = document.createElement("div");
        div.className = "list-item article-item";
        div.innerHTML = `
          <div class="item-head">
            <span class="item-title">${top === "true" ? "📌 " : ""}${this.escape(title)}</span>
            <span class="item-date">${this.escape(date)}</span>
          </div>
          <div class="item-preview">${this.escape(preview || "")}</div>
          <div class="item-foot"><span class="tag">${this.escape(cat || "")}</span></div>
        `;
        div.onclick = () => this.openDetail(key, id, r);
        this.listView.appendChild(div);
      });
    } else if (key === "xueye") {
      // id | date | category | urls
      rows.forEach(r => {
        const [id, date, cat, urls] = r;
        const urlList = (urls || "").split(",").map(u => u.trim()).filter(Boolean);
        const firstImg = urlList[0] || "";
        const div = document.createElement("div");
        div.className = "list-item gallery-item";
        div.innerHTML = `
          ${firstImg ? `<div class="gallery-thumb" style="background-image:url('${firstImg}')"></div>` : ""}
          <div class="gallery-info">
            <span class="tag">${this.escape(cat || "")}</span>
            <span class="item-date">${this.escape(date)}</span>
            <span class="gallery-count">${urlList.length} 张图</span>
          </div>
        `;
        div.onclick = () => this.openDetail(key, id, r);
        this.listView.appendChild(div);
      });
    } else if (key === "gexidong") {
      // id | content | date
      rows.forEach(r => {
        const [id, content, date] = r;
        const div = document.createElement("div");
        div.className = "list-item";
        div.innerHTML = `
          <div class="item-main"><span class="item-text">${this.escape(content)}</span></div>
          <span class="item-date">${this.escape(date)}</span>
        `;
        div.onclick = () => this.openDetail(key, id, r);
        this.listView.appendChild(div);
      });
    }
  },

  async openDetail(key, id, row) {
    document.body.classList.add("detail-open");
    this.listView.classList.add("hidden");
    this.detailView.classList.remove("hidden");
    const bread = document.querySelector(".breadcrumb");
    const bodyDom = document.querySelector(".detail-body");
    const commentWrap = document.getElementById("commentWrap");

    const names = {
      xingyin: "行吟册·絮",
      shinian: "十年灯·文",
      xueye: "雪夜舟·图",
      gexidong: "各西东·语",
      shanye: "山野渔夫"
    };

    if (key === "xingyin") {
      bread.innerHTML = `‹ 家 / ${names[key]}`;
      bodyDom.innerHTML = `
        <div class="detail-xingyin">
          <p class="xingyin-text">${this.escape(row[1])}</p>
          <div class="detail-meta">
            <span class="tag">${this.escape(row[2] || "")}</span>
            <span>${this.escape(row[3])}</span>
          </div>
        </div>
      `;
    } else if (key === "shinian") {
      bread.innerHTML = `‹ 家 / ${names[key]} / ${this.escape(row[1])}`;
      bodyDom.innerHTML = `<div class="loading">加载文章中...</div>`;
      try {
        const articleHtml = await DataLoader.loadArticleById(id);
        bodyDom.innerHTML = `
          <h1 class="detail-title">${this.escape(row[1])}</h1>
          <div class="detail-meta">
            <span class="tag">${this.escape(row[3] || "")}</span>
            <span>${this.escape(row[4])}</span>
          </div>
          <hr/>
          <div class="article-content">${articleHtml}</div>
        `;
      } catch (e) {
        bodyDom.innerHTML = `<div class="error">文章加载失败：${e.message}</div>`;
      }
    } else if (key === "xueye") {
      bread.innerHTML = `‹ 家 / ${names[key]}`;
      const imgs = (row[3] || "").split(",").map(u => u.trim()).filter(Boolean);
      bodyDom.innerHTML = `
        <div class="detail-meta">
          <span class="tag">${this.escape(row[2] || "")}</span>
          <span>${this.escape(row[1])}</span>
        </div>
        <div class="gallery-detail">
          ${imgs.map(u => `<img src="${u}" alt="图片" loading="lazy"/>`).join("")}
        </div>
      `;
    } else if (key === "gexidong") {
      bread.innerHTML = `‹ 家 / ${names[key]}`;
      bodyDom.innerHTML = `
        <div class="detail-gexidong">
          <p>${this.escape(row[1])}</p>
          <div class="detail-meta"><span>${this.escape(row[2])}</span></div>
        </div>
      `;
    }

    // 渲染评论
    if (key !== "shanye") {
      CommentSystem.setPage(id);
      CommentSystem.renderWrap(commentWrap);
    } else {
      commentWrap.innerHTML = "";
    }

    // 滚动到顶部
    this.detailView.scrollTop = 0;
  },

  closeDetail() {
    document.body.classList.remove("detail-open");
    this.listView.classList.remove("hidden");
    this.detailView.classList.add("hidden");
    this.sidebar.classList.remove("mobile-open");
  },

  escape(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
};

window.addEventListener("DOMContentLoaded", () => App.init());
