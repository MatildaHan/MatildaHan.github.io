# 南山集 · 使用说明

## 目录结构

```
├── index.html            前台首页
├── admin.html             后台管理页
├── css/style.css          前台样式
├── css/admin.css          后台样式
├── js/config.js           仓库配置（部署前必改）
├── js/data.js             前台数据加载与解析
├── js/app.js               前台应用逻辑
├── js/comments.js         评论系统
├── js/admin.js             后台管理逻辑
├── data/                  内容数据（示例数据已附带）
└── articles/               十年灯·文 的正文详情
```

## 部署步骤

1. 新建 GitHub 仓库 `你的用户名.github.io`（或任意仓库 + 开启 Pages）。
2. 把本项目所有文件推送到仓库根目录。
3. 打开 `js/config.js`，把 `owner`、`repo`、`branch` 改成你自己的信息。
4. 仓库 Settings → Pages 中开启 GitHub Pages（部署分支与 `config.js` 中的 `branch` 保持一致）。
5. 打开 `你的用户名.github.io/admin.html`，输入一个具有 **repo** 权限的
   [GitHub Personal Access Token](https://github.com/settings/tokens)（建议用 fine-grained token，只授权这一个仓库的 Contents / Issues 读写权限），即可开始编辑内容。
6. 首次编辑保存后，仓库文件会自动更新；点击「主题设置」页里的「提交并部署」可主动触发一次 Pages 构建，正常情况下 GitHub 检测到文件变化也会自动重新部署。

## 关于评论系统的重要说明

评论使用 GitHub Issues 存储：

- **展示**：读取带 `comment` + `approved` 标签、且已 `closed` 的 Issue，公开只读，无需鉴权。
- **提交**：创建 Issue 必须携带具备权限的身份令牌。由于本项目是纯静态站点、没有后端代理，**无法做到完全匿名评论**——访客提交评论时会被要求输入一个自己的 GitHub Token（`public_repo` 权限即可），该 Token 只存在浏览器 `sessionStorage` 中，关闭页面即失效，不会被保存或上传到别处。
- 如果你需要真正对所有访客免登录开放评论，需要额外接一个轻量后端或 Serverless 函数（例如 Cloudflare Worker / Vercel Function）来代为创建 Issue，这已超出「纯静态 + GitHub API」架构的能力范围，可以作为后续迭代方向。

## 数据格式约定

所有列表型数据文件（`data/*.md`）每行一条记录，字段用 ` | ` 分隔：

| 文件 | 字段 |
|---|---|
| `xingyin.md`（行吟册·絮） | `ID \| 内容 \| 分类 \| 日期` |
| `shinian.md`（十年灯·文） | `ID \| 标题 \| 内容(纯文本预览) \| 分类 \| 日期 \| top(true/false)` |
| `xueye.md`（雪夜舟·图） | `ID \| 日期 \| 分类 \| 图片URL(逗号分隔)` |
| `gexidong.md`（各西东·语） | `ID \| 内容 \| 日期` |
| `shanye.md`（山野渔夫） | 纯文本，无字段分隔 |

字段内如包含 `|` 或换行会被自动转义为 `&#124;` / `\n`，读取时自动还原，后台操作无需关心这一层细节。

十年灯·文的完整正文（富文本 HTML）单独存放在 `articles/sn-xxx.md`，格式为：

```
---
title: 标题
date: 2026-08-01
---
<p>正文 HTML……</p>
```

## 已随附的示例数据

仓库中的 `data/` 与 `articles/` 目录已经放了几条示例内容，本地用浏览器直接打开 `index.html` 无法访问（浏览器会拦截跨源读取本地文件的 fetch），需要推送到 GitHub 后通过 `https://你的用户名.github.io/` 访问才能看到真实效果；也可以用任意静态服务器（如 `npx serve`）在本地起一个 HTTP 服务预览前台交互（此时数据仍从线上 GitHub 仓库读取）。
