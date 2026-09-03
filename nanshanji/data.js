/**
 * data.js — 前台数据加载器
 * 负责从 GitHub 仓库读取 .md / .json 文件并解析为可渲染的数据结构
 *
 * 数据文件格式（每行一条记录，字段用 " | " 分隔）：
 *   xingyin.md   ID | 内容 | 分类 | 日期
 *   shinian.md   ID | 标题 | 内容 | 分类 | 日期 | top
 *   xueye.md     ID | 日期 | 分类 | 图片URLs(以逗号分隔)
 *   gexidong.md  ID | 内容 | 日期
 *   shanye.md    纯文本（无分隔）
 *
 * 字段内如包含 "|" 或换行，会被转义为 &#124; / \n，读取时自动还原。
 */
(function () {
  const CFG = window.SITE_CONFIG;

  function rawUrl(path) {
    return `${CFG.rawBase}/${CFG.owner}/${CFG.repo}/${CFG.branch}/${path}?t=${Date.now()}`;
  }

  async function fetchText(path) {
    const res = await fetch(rawUrl(path), { cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 404) return '';
      throw new Error(`读取失败：${path}（${res.status}）`);
    }
    return res.text();
  }

  // ---- 字段转义 / 还原 ----
  function unescapeField(str) {
    if (str == null) return '';
    return str
      .replace(/\\n/g, '\n')
      .replace(/&#124;/g, '|')
      .trim();
  }

  function escapeField(str) {
    if (str == null) return '';
    return String(str)
      .replace(/\|/g, '&#124;')
      .replace(/\r?\n/g, '\\n');
  }

  // 按 " | " 拆分一行（允许两侧有空格）
  function splitLine(line) {
    return line.split('|').map(unescapeField);
  }

  function parseLines(text, fieldNames) {
    return text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'))
      .map((line) => {
        const parts = splitLine(line);
        const obj = {};
        fieldNames.forEach((name, i) => {
          obj[name] = parts[i] !== undefined ? parts[i] : '';
        });
        return obj;
      });
  }

  const SCHEMA = {
    xingyin: ['id', 'content', 'category', 'date'],
    shinian: ['id', 'title', 'content', 'category', 'date', 'top'],
    xueye: ['id', 'date', 'category', 'images'],
    gexidong: ['id', 'content', 'date']
  };

  async function load(key) {
    const text = await fetchText(`data/${key}.md`);
    const fields = SCHEMA[key];
    if (!fields) throw new Error(`未知栏目：${key}`);
    const items = parseLines(text, fields);
    if (key === 'xueye') {
      items.forEach((it) => {
        it.imageList = it.images ? it.images.split(',').map((s) => s.trim()).filter(Boolean) : [];
      });
    }
    if (key === 'shinian') {
      items.forEach((it) => { it.top = it.top === 'true' || it.top === '1'; });
      // 置顶排前，其余按日期倒序
      items.sort((a, b) => {
        if (a.top !== b.top) return a.top ? -1 : 1;
        return (b.date || '').localeCompare(a.date || '');
      });
    } else {
      items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }
    return items;
  }

  async function loadShanye() {
    const text = await fetchText('data/shanye.md');
    return text.trim();
  }

  async function loadCategories(key) {
    const text = await fetchText(`data/categories_${key}.md`);
    return text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  }

  async function loadSettings() {
    const defaults = {
      background: '#f7f7f7',
      color: '#111111',
      subtitle: '南山集'
    };
    try {
      const text = await fetchText('data/settings.json');
      if (!text) return defaults;
      return Object.assign(defaults, JSON.parse(text));
    } catch (e) {
      return defaults;
    }
  }

  // 文章详情：articles/sn-xxx.md
  // 文件格式：
  //   ---
  //   title: 标题
  //   date: 2024-01-01
  //   ---
  //   正文（HTML，富文本编辑器产出）
  async function loadArticleById(id) {
    const fileId = id.startsWith('sn-') ? id : `sn-${id}`;
    const text = await fetchText(`articles/${fileId}.md`);
    if (!text) return null;

    const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    let meta = {};
    let body = text;
    if (match) {
      match[1].split('\n').forEach((line) => {
        const idx = line.indexOf(':');
        if (idx === -1) return;
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim();
        meta[k] = v;
      });
      body = match[2].trim();
    }
    return { meta, body };
  }

  window.DataLoader = {
    load,
    loadShanye,
    loadCategories,
    loadSettings,
    loadArticleById,
    // 供 admin.js 复用的编解码工具
    escapeField,
    unescapeField,
    splitLine,
    parseLines,
    SCHEMA
  };
})();
