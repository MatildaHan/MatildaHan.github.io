/**
 * app.js - 南山集 前台应用
 */

var PAGE_SIZE = 10;
var currentKey = 'xingyin';
var currentPage = 1;
var currentData = [];

var menuItems = document.querySelectorAll('.menu-item');
var contentWrapDom = document.getElementById('contentWrap');
var paginationWrapDom = document.getElementById('paginationWrap');
var listView = document.getElementById('listView');
var detailView = document.getElementById('detailView');
var detailContainer = document.getElementById('detailContainer');

async function applySettings() {
    var settings = await DataLoader.loadSettings();
    var body = document.body;
    if (settings.bgImage) {
        body.style.backgroundImage = 'url(\'' + settings.bgImage + '\')';
    } else {
        body.style.backgroundImage = 'none';
    }
    body.style.backgroundColor = settings.bgColor || '#ecebe9';
    var titleMain = document.querySelector('.title-main');
    if (titleMain) titleMain.style.color = settings.titleColor || '#333333';
    var titleSub = document.querySelector('.title-sub');
    if (titleSub && settings.subtitle) {
        titleSub.textContent = settings.subtitle;
    }
}

function renderContent(key, page) {
    var list = currentData;
    var total = list.length;
    var totalPage = Math.ceil(total / PAGE_SIZE);
    if (page < 1) page = 1;
    if (page > totalPage) page = totalPage;
    currentPage = page;

    var start = (page - 1) * PAGE_SIZE;
    var end = Math.min(start + PAGE_SIZE, total);
    var pageList = list.slice(start, end);

    var html = '';

    switch (key) {
        case 'xingyin':
            pageList.forEach(function(item, idx) {
                html += '<div class="item-module" onclick="openDetail(\'' + key + '\', \'' + item.id + '\')">' +
                    '<div class="text-content">' + escapeHtml(item.text) + '</div>' +
                    '<div class="date-text">' + item.date + '</div>' +
                    '</div>';
                if (idx !== pageList.length - 1) html += '<div class="item-divider"></div>';
            });
            break;

        case 'shinian':
            pageList.forEach(function(item, idx) {
                html += '<div class="poem-item" onclick="openDetail(\'' + key + '\', \'' + item.id + '\')">' +
                    '<div class="poem-title">' + escapeHtml(item.title) + '</div>' +
                    '<div class="poem-desc line-clamp-2">' + escapeHtml(item.summary) + '</div>' +
                    '</div>';
                if (idx !== pageList.length - 1) html += '<div class="item-divider"></div>';
            });
            break;

        case 'xueye':
            pageList.forEach(function(group, idx) {
                html += '<div class="date-image-group">' +
                    '<div class="image-date">' + group.date + '</div>' +
                    '<div class="image-wrap">';
                group.images.forEach(function(src) {
                    html += '<img class="image-item" src="' + src + '" alt="" onclick="openDetail(\'' + key + '\', \'' + group.id + '\')" onerror="this.style.background=\'#d4cfc8\'">';
                });
                html += '</div></div>';
                if (idx !== pageList.length - 1) html += '<div class="item-divider"></div>';
            });
            break;

        case 'gexidong':
            pageList.forEach(function(item, idx) {
                html += '<div class="msg-item" onclick="openDetail(\'' + key + '\', \'' + item.id + '\')">' +
                    '<div class="msg-head">' +
                    '<div class="avatar" style="background:#c4b8a8;"></div>' +
                    '<div class="nickname">访客</div>' +
                    '</div>' +
                    '<div class="msg-content line-clamp-2">' + escapeHtml(item.content) + '</div>' +
                    '</div>';
                if (idx !== pageList.length - 1) html += '<div class="item-divider"></div>';
            });
            break;

        case 'shanye':
            pageList.forEach(function(item, idx) {
                html += '<div class="intro-item">' + escapeHtml(item.bio) + '</div>';
                if (idx !== pageList.length - 1) html += '<div class="item-divider"></div>';
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
    var pagHtml = '<button id="prevBtn" ' + (page === 1 ? 'disabled' : '') + '>上一页</button>' +
        '<span class="page-info">第 ' + page + ' / ' + totalPage + ' 页</span>' +
        '<button id="nextBtn" ' + (page === totalPage ? 'disabled' : '') + '>下一页</button>';
    paginationWrapDom.innerHTML = pagHtml;
    document.getElementById('prevBtn').onclick = function() {
        renderContent(currentKey, currentPage - 1);
    };
    document.getElementById('nextBtn').onclick = function() {
        renderContent(currentKey, currentPage + 1);
    };
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.openDetail = async function(key, id) {
    var detail = null;
    var title = '';
    if (key === 'shinian') {
        detail = await DataLoader.loadArticleById(id);
        if (!detail) { alert('文章内容未找到'); return; }
        title = detail.title || '文章';
    } else {
        var item = currentData.find(function(d) { return d.id === id; });
        if (!item) { alert('内容未找到'); return; }
        title = item.text || item.content || item.bio || '详情';
        detail = { title: title, date: item.date || '未知日期', paragraphs: [title] };
        if (key === 'xueye' && item.images) {
            detail.paragraphs = item.images.map(function(img) {
                return '<img src="' + img + '" class="detail-image" onerror="this.style.display=\'none\'">';
            });
        }
    }

    listView.classList.add('hidden');
    detailView.classList.add('active');

    var keyTitle = DataLoader.getKeyTitle(key);

    var html = '<div class="breadcrumb" onclick="closeDetail()">‹ 家 / ' + keyTitle + ' / ' + escapeHtml(title) + '</div>' +
        '<h1 class="detail-title">' + escapeHtml(title) + '</h1>' +
        '<div class="detail-date">' + (detail.date || '未知日期') + '</div>' +
        '<div class="detail-body">';

    if (detail.paragraphs) {
        detail.paragraphs.forEach(function(p) {
            if (typeof p === 'string' && p.indexOf('<img') !== -1) {
                html += p;
            } else {
                html += '<p>' + p + '</p>';
            }
        });
    }

    html += '</div><button class="back-btn" onclick="closeDetail()">← 返回列表</button>';

    detailContainer.innerHTML = html;

    menuItems.forEach(function(el) { el.classList.remove('active'); });
    document.querySelector('.menu-item[data-key="' + key + '"]').classList.add('active');
};

window.closeDetail = function() {
    listView.classList.remove('hidden');
    detailView.classList.remove('active');
    menuItems.forEach(function(el) { el.classList.remove('active'); });
    document.querySelector('.menu-item[data-key="' + currentKey + '"]').classList.add('active');
    renderContent(currentKey, currentPage);
};

async function loadAndRender(key, page) {
    if (!page) page = 1;
    currentKey = key;
    currentData = await DataLoader.load(key);
    renderContent(key, page);
}

menuItems.forEach(function(item) {
    item.addEventListener('click', function() {
        if (detailView.classList.contains('active')) {
            detailView.classList.remove('active');
            listView.classList.remove('hidden');
        }
        menuItems.forEach(function(el) { el.classList.remove('active'); });
        this.classList.add('active');
        var key = this.dataset.key;
        loadAndRender(key, 1);
    });
});

async function init() {
    await applySettings();
    await loadAndRender('xingyin', 1);
}

init();
