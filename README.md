# 南山集 —— 纯静态个人博客 CMS

> 春山如黛草如烟

基于 GitHub Pages + GitHub API 的无服务器静态博客系统，无需后端、无需数据库。

## 快速部署

### 1. 上传到 GitHub

将本项目所有文件上传到你的 GitHub 仓库（例如 `MatildaHan.github.io`）。

### 2. 开启 GitHub Pages

仓库 → Settings → Pages → Source 选择 `main` 分支 → Save。

### 3. 生成 GitHub Token

1. 访问 https://github.com/settings/tokens
2. Generate new token (classic)
3. 勾选 `repo`（全部仓库权限）和 `issues`
4. 生成后复制 token（只显示一次）

### 4. 进入后台

访问 `https://你的用户名.github.io/仓库名/admin.html`
粘贴 Token，即可开始管理内容。

## 文件结构

```
├── index.html          # 前台首页
├── admin.html          # 后台管理
├── css/
│   ├── style.css       # 前台样式
│   └── admin.css       # 后台样式
├── js/
│   ├── data.js         # GitHub 文件读写
│   ├── app.js          # 前台逻辑
│   ├── admin.js        # 后台逻辑
│   └── comments.js     # 评论系统
├── data/               # 数据文件（后台自动维护）
│   ├── xingyin.md      # 行吟册·絮
│   ├── shinian.md      # 十年灯·文
│   ├── xueye.md        # 雪夜舟·图
│   ├── gexidong.md     # 各西东·语
│   ├── shanye.md       # 山野渔夫
│   ├── settings.json   # 站点设置
│   └── categories_*.md # 各栏目分类
└── articles/           # 长文正文
    └── sn-xxx.md
```

## 五大栏目

| 栏目 | 说明 | 数据格式 |
|------|------|----------|
| 行吟册·絮 | 短句片段 | ID \| 内容 \| 分类 \| 日期 |
| 十年灯·文 | 长篇文章 | ID \| 标题 \| 摘要 \| 分类 \| 日期 \| 置顶 |
| 雪夜舟·图 | 图片集 | ID \| 日期 \| 分类 \| 图片URLs |
| 各西东·语 | 留言集 | ID \| 内容 \| 日期 |
| 山野渔夫 | 个人简介 | 纯文本 |

## 评论系统

基于 GitHub Issues 实现：
- 访客提交评论 → 创建 `pending` 标签的 Issue
- 后台审核通过 → 添加 `approved` 标签并关闭 Issue
- 前台只显示已审核（approved + closed）的评论

## 注意事项

- Token 仅保存在浏览器 localStorage，不会上传任何服务器
- GitHub Pages 更新有 1-3 分钟延迟
- 本地直接打开 HTML 会跨域报错，请部署后或用 Live Server 预览
- 仓库需开启 Issues 功能（Settings → Features → Issues）
