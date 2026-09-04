// app.js 南山集前台完整版本（适配雪夜舟JSON图片数据）
const App = {
  currentKey:"xingyin",
  listView:null,
  detailView:null,
  sidebar:null,

  async init(){
    this.listView = document.getElementById("listView");
    this.detailView = document.getElementById("detailView");
    this.sidebar = document.getElementById("sidebar");
    // 加载配置
    const settings = await DataLoader.loadSettings();
    document.querySelector(".site-title").innerText = settings.siteName;
    document.querySelector(".site-desc").innerText = settings.siteDesc;

    // 应用主题CSS变量
    const root = document.documentElement;
    root.style.setProperty("--bg", settings.bgColor ?? "#f7f7f7");
    root.style.setProperty("--text", settings.textColor ?? "#111111");
    root.style.setProperty("--accent", settings.accentColor ?? "#4A6C5C");

    // 菜单事件
    document.querySelectorAll(".nav-item").forEach(el=>{
      el.onclick = ()=>{
        document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
        el.classList.add("active");
        const key = el.dataset.key;
        this.switchTab(key);
      }
    })
    document.querySelector(".back-btn").onclick = ()=>this.closeDetail();
    document.querySelector("#menuToggle").onclick = ()=>{
      this.sidebar.classList.toggle("hidden");
    }
    // 默认打开行吟册
    document.querySelector(`.nav-item[data-key="xingyin"]`).classList.add("active");
    await this.switchTab("xingyin");
  },

  async switchTab(key){
    this.currentKey = key;
    this.closeDetail();
    const data = await DataLoader.loadMd(key);
    this.renderList(key,data);
  },

  renderList(key,rows){
    this.listView.innerHTML = "";
    if(key==="xingyin"){
      // id | content | category | date
      rows.forEach(r=>{
        const [id,content,cat,date] = r;
        const div = document.createElement("div");
        div.className="list-item";
        div.innerHTML = `
          <div class="meta">
            <span><span class="tag">${cat||""}</span>${content}</span>
            <span>${date}</span>
          </div>
        `;
        div.onclick = ()=>this.openDetail(key,id,r);
        this.listView.appendChild(div);
      })
    }else if(key==="shinian"){
      // id|title|preview|category|date|top
      const sorted = [...rows].sort((a,b)=>{
        const topA = a[5]==="true"?1:0;
        const topB = b[5]==="true"?1:0;
        return topB-topA;
      })
      sorted.forEach(r=>{
        const [id,title,preview,cat,date,top] = r;
        const div = document.createElement("div");
        div.className="list-item";
        div.innerHTML = `
          <div class="meta">
            <span>${top==="true"?"📌 ":""}${title} <span class="tag">${cat||""}</span></span>
            <span>${date}</span>
          </div>
          <div class="preview">${preview}</div>
        `;
        div.onclick = ()=>this.openDetail(key,id,r);
        this.listView.appendChild(div);
      })
    }else if(key==="xueye"){
      // id|date|category|JSON字符串（图片数组）
      rows.forEach(r=>{
        const [id,date,cat] = r;
        const div = document.createElement("div");
        div.className="list-item";
        div.innerHTML = `
          <div class="meta">
            <span>[图集] <span class="tag">${cat}</span></span>
            <span>${date}</span>
          </div>
        `;
        div.onclick = ()=>this.openDetail(key,id,r);
        this.listView.appendChild(div);
      })
    }else if(key==="gexidong"){
      // id|content|date
      rows.forEach(r=>{
        const [id,content,date] = r;
        const div = document.createElement("div");
        div.className="list-item";
        div.innerHTML = `
          <div class="meta">
            <span>${content}</span>
            <span>${date}</span>
          </div>
        `;
        div.onclick = ()=>this.openDetail(key,id,r);
        this.listView.appendChild(div);
      })
    }else if(key==="shanye"){
      this.listView.innerHTML = `<div style="padding:12px;">${rows.join("<br>")}</div>`;
    }
  },

  async openDetail(key,id,row){
    document.body.classList.add("detail-open");
    this.listView.classList.add("hidden");
    this.detailView.classList.remove("hidden");
    const bread = document.querySelector(".breadcrumb");
    const bodyDom = document.querySelector(".detail-body");
    const commentWrap = document.getElementById("commentWrap");
    CommentSystem.setPage(id);
    CommentSystem.renderWrap(commentWrap);

    if(key==="xingyin"){
      bread.innerHTML = `‹ 家 / 行吟册·絮`;
      bodyDom.innerHTML = `<h2>${row[1]}</h2><div>日期：${row[3]}</div>`;
    }else if(key==="shinian"){
      bread.innerHTML = `‹ 家 / 十年灯·文 / ${row[1]}`;
      const articleHtml = await DataLoader.loadArticleById(id);
      bodyDom.innerHTML = `<h1>${row[1]}</h1><div>日期：${row[4]}</div><hr/>${articleHtml}`;
    }else if(key==="xueye"){
      bread.innerHTML = `‹ 家 / 雪夜舟·图`;
      let imgList;
      try {
        // 新格式：JSON数组
        imgList = JSON.parse(row[3]);
      } catch (e) {
        // 兼容旧格式：逗号分隔URL字符串
        imgList = row[3].split(",").map(u => ({ url: u.trim(), desc: "" }));
      }
      // 渲染图片+图片描述
      bodyDom.innerHTML = imgList.map(item => `
        <div style="margin:12px 0;">
          <img src="${item.url}" style="max-width:100%;">
          ${item.desc ? `<p style="color:#444;margin-top:4px;">${item.desc}</p>` : ""}
        </div>
      `).join("");
    }else if(key==="gexidong"){
      bread.innerHTML = `‹ 家 / 各西东·语`;
      bodyDom.innerHTML = `<div>${row[1]}</div><div>${row[2]}</div>`;
    }
  },

  closeDetail(){
    document.body.classList.remove("detail-open");
    this.listView.classList.remove("hidden");
    this.detailView.classList.add("hidden");
  }
}

window.onload = ()=>App.init();
