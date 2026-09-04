// data.js 修复中文乱码 + loadCategoryFile
const DataLoader = {
  owner:"MatildaHan",
  repo:"MatildaHan.github.io",
  branch:"main",
  baseUrl:"",

  init(){
    this.baseUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents`;
  },

  // Base64 → UTF8 中文安全解码 解决中文乱码
  base64ToUtf8(base64) {
    const byteString = atob(base64);
    const uint8 = new Uint8Array([...byteString].map(c => c.charCodeAt(0)));
    return new TextDecoder("utf-8").decode(uint8);
  },

  // UTF8字符串 → Base64 写入GitHub上传用
  utf8ToBase64(str) {
    const uint8 = new TextEncoder().encode(str);
    return btoa(String.fromCharCode(...uint8));
  },

  async getFile(path){
    const res = await fetch(`${this.baseUrl}/${path}?ref=${this.branch}`);
    if(!res.ok) throw new Error("文件读取失败");
    const json = await res.json();
    const raw = this.base64ToUtf8(json.content);
    return {content:raw,sha:json.sha};
  },

  async loadMd(key){
    const path = `data/${key}.md`;
    const {content} = await this.getFile(path);
    return this.parsePipe(content);
  },

  parsePipe(text){
    const lines = text.trim().split("\n").filter(l=>l.trim());
    const out = [];
    for(let line of lines){
      const arr = line.split("|");
      out.push(arr.map(x=>x.trim()));
    }
    return out;
  },

  /**
   * 读取栏目分类文件 data/categories_{key}.md
   * @param {string} key xingyin / shinian / xueye
   * @returns {string[]}
   */
  async loadCategoryFile(key) {
    const path = `data/categories_${key}.md`;
    try {
      const { content } = await this.getFile(path);
      const list = content.split("\n").map(s => s.trim()).filter(s => s);
      return list;
    } catch (e) {
      console.warn(`分类文件 ${path} 不存在，返回空列表`, e);
      return [];
    }
  },

  async loadSettings(){
    try{
      const {content} = await this.getFile("data/settings.json");
      return JSON.parse(content);
    }catch(e){
      return {
        siteName:"南山集",
        siteDesc:"春山如黛草如烟",
        bgColor:"#f7f7f7",
        textColor:"#111111",
        accentColor:"#4A6C5C"
      }
    }
  },

  async loadArticleById(id){
    const path = `articles/${id}.md`;
    const {content} = await this.getFile(path);
    return content;
  }
}
DataLoader.init();
