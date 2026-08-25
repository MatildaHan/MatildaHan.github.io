/**
 * app.js - 南山集 核心应用
 * 依赖: DataLoader (data.js)
 */

// ============================================================
// 1. 配置
// ============================================================
const PAGE_SIZE = 10;
let currentKey = 'xingyin';
let currentPage = 1;
let currentData = [];

// 菜单映射
const MENU_MAP = {
    xingyin: '行吟册·絮',
    shinian: '十年灯·文',
    xueye: '雪夜舟·图',
    gexidong: '各西东·语',
    shanye: '山野渔夫'
};

// ============================================================
// 2. DOM 引用
// ============================================================
const menuItems = document.querySelectorAll('.menu-item');
const contentWrapDom = document.getElementById('contentWrap');
const paginationWrapDom = document.getElementById('paginationWrap');
const listView = document.getElementById('listView');
const detailView = document.getElementById('detailView');
const articleDetail = document.getElementById('articleDetail');

// ============================================================
// 3. 渲染函数
// ============================================================

/**
 * 渲染列表内容
 */
function renderContent(key, page) {
    const list = currentData;
    const total = list.length;
    const totalPage = Math.ceil(total / PAGE_SIZE);
    
    if (page < 1) page = 1;
    if (page > totalPage) page = totalPage;
    currentPage = page;

    const start = (page - 1) * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, total);
    const pageList = list.slice(start, end);

    let html = '';

    switch (key) {
        case 'xingyin':
            pageList.forEach((item, idx) => {
                html += `<div class="item-module">
                    <div class="text-content">${item.text}</div>
                    <div class="date-text">${item.date}</div>
                </div>`;
                if (idx !== pageList.length - 1) html += `<div class="item-divider"></div>`;
            });
            break;

        case 'shinian':
            pageList.forEach((item, idx) => {
                html += `<div class="poem-item" onclick="openArticle('${item.title}')">
                    <div class="poem-title">${item.title}</div>
                    <div class="poem-desc line-clamp-2">${item.content}</div>
                </div>`;
                if (idx !== pageList.length - 1) html += `<div class="item-divider"></div>`;
            });
            break;

        case 'xueye':
            pageList.forEach((group, idx) => {
                html += `<div class="date-image-group">
                    <div class="image-date">${group.date}</div>
                    <div class="image-wrap">`;
                group.imgs.forEach(src => {
                    html += `<img class="image-item" src="${src}" alt="" onerror="this.style.background='#d4cfc8'">`;
                });
                html += `</div></div>`;
                if (idx !== pageList.length - 1) {
                    html += `<div class="item-divider"></div>`;
                }
            });
            break;

        case 'gexidong':
            pageList.forEach((item, idx) => {
                html += `<div class="msg-item">
                    <div class="msg-head">
                        <div class="avatar" style="background:#c4b8a8;"></div>
                        <div class="nickname">${item.nickname}</div>
                    </div>
                    <div class="msg-content line-clamp-2">${item.message}</div>
                </div>`;
                if (idx !== pageList.length - 1) html += `<div class="item-divider"></div>`;
            });
            break;

        case 'shanye':
            pageList.forEach((item, idx) => {
                html += `<div class="intro-item line-clamp-2">${item.bio}</div>`;
                if (idx !== pageList.length - 1) html += `<div class="item-divider"></div>`;
            });
            break;
    }

    contentWrapDom.innerHTML = html;
    renderPagination(totalPage, currentPage);
}

/**
 * 渲染分页控件
 */
function renderPagination(totalPage, page) {
    if (totalPage <= 1) {
        paginationWrapDom.innerHTML = '';
        return;
    }
    
    const pagHtml = `
        <button id="prevBtn" ${page === 1 ? 'disabled' : ''}>上一页</button>
        <span class="page-info">第 ${page} / ${totalPage} 页</span>
        <button id="nextBtn" ${page === totalPage ? 'disabled' : ''}>下一页</button>
    `;
    paginationWrapDom.innerHTML = pagHtml;

    document.getElementById('prevBtn').onclick = () => {
        renderContent(currentKey, currentPage - 1);
    };
    document.getElementById('nextBtn').onclick = () => {
        renderContent(currentKey, currentPage + 1);
    };
}

// ============================================================
// 4. 文章详情
// ============================================================

/**
 * 打开文章详情（全局函数，供 onclick 调用）
 */
window.openArticle = async function(title) {
    const article = await DataLoader.loadArticle(title);
    if (!article) {
        alert('文章内容未找到: ' + title);
        return;
    }

    // 隐藏列表，显示详情
    listView.classList.add('hidden');
    detailView.classList.add('active');

    // 构建文章HTML
    let html = `
        <div class="breadcrumb" onclick="closeArticle()">‹ 家 / 十年灯·文 / ${title}</div>
        <h1 class="article-title">${title}。</h1>
        <div class="article-date">${article.date}</div>
        <div class="article-body">
    `;
    
    article.paragraphs.forEach(p => {
        html += `<p>${p}</p>`;
    });
    
    html += `
        </div>
        <button class="back-btn" onclick="closeArticle()">← 返回列表</button>
    `;

    articleDetail.innerHTML = html;

    // 更新菜单高亮
    menuItems.forEach(el => el.classList.remove('active'));
    document.querySelector('.menu-item[data-key="shinian"]').classList.add('active');
};

/**
 * 关闭文章详情（全局函数）
 */
window.closeArticle = function() {
    listView.classList.remove('hidden');
    detailView.classList.remove('active');
    
    menuItems.forEach(el => el.classList.remove('active'));
    document.querySelector(`.menu-item[data-key="${currentKey}"]`).classList.add('active');
    
    renderContent(currentKey, currentPage);
};

// ============================================================
// 5. 加载数据 & 初始化
// ============================================================

/**
 * 加载栏目数据并渲染
 */
async function loadAndRender(key, page = 1) {
    currentKey = key;
    currentData = await DataLoader.load(key);
    renderContent(key, page);
}

/**
 * 菜单切换事件
 */
menuItems.forEach(item => {
    item.addEventListener('click', function() {
        if (detailView.classList.contains('active')) {
            detailView.classList.remove('active');
            listView.classList.remove('hidden');
        }

        menuItems.forEach(el => el.classList.remove('active'));
        this.classList.add('active');
        
        const key = this.dataset.key;
        loadAndRender(key, 1);
    });
});

// ============================================================
// 6. 启动应用
// ============================================================

// 默认加载 "行吟册·絮"
loadAndRender('xingyin', 1);