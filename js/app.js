/**
 * app.js - 南山集 前台应用
 */

const PAGE_SIZE = 10;
let currentKey = 'xingyin';
let currentPage = 1;
let currentData = [];

const menuItems = document.querySelectorAll('.menu-item');
const contentWrapDom = document.getElementById('contentWrap');
const paginationWrapDom = document.getElementById('paginationWrap');
const listView = document.getElementById('listView');
const detailView = document.getElementById('detailView');
const detailContainer = document.getElementById('detailContainer');

// ============================================================
// 1. 应用主题设置
// ============================================================

async function applySettings() {
    const settings = await DataLoader.loadSettings();
    const body = document.body;
    
    // 背景图
    if (settings.bgImage) {
        body.style.backgroundImage = `url('${settings.bgImage}')`;
    } else {
        body.style.backgroundImage = 'none';
    }
    body.style.backgroundColor = settings.bgColor || '#ecebe9';
    
    // 主色
    document.querySelectorAll('.menu-item.active, .date-text, .pagination .page-info')
        .forEach(el => el.style.color = settings.primaryColor);
    document.querySelectorAll('.header')
        .forEach(el => el.style.borderColor = settings.primaryColor);
    
    // 标题颜色
    const titleMain = document.querySelector('.title-main');
    if (titleMain) titleMain.style.color = settings.titleColor || '#333333';
    
    // 副标题
    const titleSub = document.querySelector('.title-sub');
    if (titleSub && settings.subtitle) {
        titleSub.textContent = settings.subtitle;
    }
}

// ============================================================
// 2. 渲染列表
// ============================================================

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
                html += `<div class="item-module" onclick="openDetail('${key}', '${item.id}')">
                    <div class="text-content">${escapeHtml(item.text)}</div>
                    <div class="date-text">${item.date}</div>
                </div>`;
                if (idx !== pageList.length - 1) html += `<div class="item-divider"></div>`;
            });
            break;

        case 'shinian':
            pageList.forEach((item, idx) => {
                html += `<div class="poem-item" onclick="openDetail('${key}', '${item.id}')">
                    <div class="poem-title">${escapeHtml(item.title)}</div>
                    <div class="poem-desc line-clamp-2">${escapeHtml(item.summary)}</div>
                </div>`;
                if (idx !== pageList.length - 1) html += `<div class="item-divider"></div>`;
            });
            break;

        case 'xueye':
            pageList.forEach((group, idx) => {
                html += `<div class="date-image-group">
                    <div class="image-date">${group.date}</div>
                    <div class="image-wrap">`;
                group.images.forEach(src => {
                    html += `<img class="image-item" src="${src}" alt="" 
                            onclick="openDetail('${key}', '${group.id}')"
                            onerror="this.style.background='#d4cfc8'">`;
                });
                html += `</div></div>`;
                if (idx !== pageList.length - 1) {
                    html += `<div class="item-divider"></div>`;
                }
            });
            break;

        case 'gexidong':
            pageList.forEach((item, idx) => {
                html += `<div class="msg-item" onclick="openDetail('${key}', '${item.id}')">
                    <div class="msg-head">
                        <div class="avatar" style="background:#c4b8a8;"></div>
                        <div class="nickname">访客</div>
                    </div>
                    <div class="msg-content line-clamp-2">${escapeHtml(item.content)}</div>
                </div>`;
                if (idx !== pageList.length - 1) html += `<div class="item-divider"></div>`;
            });
            break;

        case 'shanye':
            pageList.forEach((item, idx) => {
                html += `<div class="intro-item line-clamp-2">${escapeHtml(item.bio)}</div>`;
                if (idx !== pageList.length - 1) html += `<div class="item-divider"></div>`;
            });
            break;
    }

    contentWrapDom.innerHTML = html;
    renderPagination(totalPage, currentPage);
}

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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// 3. 详情渲染
// ============================================================

window.openDetail = async function(key, id) {
    let detail = null;
    let title = '';
    
    if (key === 'shinian') {
        // 加载文章详情
        detail = await DataLoader.loadArticleById(id);
        if (!detail) {
            alert('文章内容未找到');
            return;
        }
        title = detail.title || '文章';
    } else {
        // 其他栏目：从当前数据中查找
        const item = currentData.find(d => d.id === id);
        if (!item) {
            alert('内容未找到');
            return;
        }
        title = item.text || item.content || item.bio || '详情';
        // 构建简单详情
        detail = {
            title: title,
            date: item.date || '未知日期',
            paragraphs: [title]
        };
        // 如果是图片，显示图片
        if (key === 'xueye' && item.images) {
            detail.paragraphs = item.images.map(img => 
                `<img src="${img}" class="detail-image" onerror="this.style.display='none'">`
            );
        }
    }

    listView.classList.add('hidden');
    detailView.classList.add('active');

    const keyTitle = DataLoader.getKeyTitle(key);

    let html = `
        <div class="breadcrumb" onclick="closeDetail()">‹ 家 / ${keyTitle} / ${escapeHtml(title)}</div>
        <h1 class="detail-title">${escapeHtml(title)}</h1>
        <div class="detail-date">${detail.date || '未知日期'}</div>
        <div class="detail-body">
    `;
    
    if (detail.paragraphs) {
        detail.paragraphs.forEach(p => {
            if (typeof p === 'string' && p.startsWith('<img')) {
                html += p;
            } else {
                html += `<p>${p}</p>`;
            }
        });
    }
    
    html += `
        </div>
        <button class="back-btn" onclick="closeDetail()">← 返回列表</button>
    `;

    detailContainer.innerHTML = html;

    menuItems.forEach(el => el.classList.remove('active'));
    document.querySelector(`.menu-item[data-key="${key}"]`).classList.add('active');
};

window.closeDetail = function() {
    listView.classList.remove('hidden');
    detailView.classList.remove('active');
    
    menuItems.forEach(el => el.classList.remove('active'));
    document.querySelector(`.menu-item[data-key="${currentKey}"]`).classList.add('active');
    
    renderContent(currentKey, currentPage);
};

// ============================================================
// 4. 加载与初始化
// ============================================================

async function loadAndRender(key, page = 1) {
    currentKey = key;
    currentData = await DataLoader.load(key);
    renderContent(key, page);
}

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

// 启动应用
async function init() {
    await applySettings();
    await loadAndRender('xingyin', 1);
}

init();