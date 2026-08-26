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

var bodyEl = document.body;

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
        // ========== 行吟册·絮 ==========
        case 'xingyin':
            for (var i = 0; i < pageList.length; i++) {
                var item = pageList[i];
                html += '<div class="item-module" onclick="openDetail(\'' + key + '\', \'' + item.id + '\')">' +
                    '<div class="text-content">' + escapeHtml(item.text) + '</div>' +
                    '<div class="date-text">' + item.date + '</div>' +
                    '</div>';
                if (i !== pageList.length - 1) html += '<div class="item-divider"></div>';
            }
            break;

        // ========== 十年灯·文（置顶 + 显示日期） ==========
        case 'shinian':
            // 置顶排序
            var sortedList = pageList.slice().sort(function(a, b) {
                if (a.top && !b.top) return -1;
                if (!a.top && b.top) return 1;
                return 0;
            });
            for (var j = 0; j < sortedList.length; j++) {
                var item = sortedList[j];
                var displayContent = item.content ? item.content.slice(0, 60) : '';
                if (item.content && item.content.length > 60) {
                    displayContent += '...';
                }
                html += '<div class="poem-item" onclick="openDetail(\'' + key + '\', \'' + item.id + '\')">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;width:100%;">' +
                    '<div style="display:flex;align-items:center;gap:6px;overflow:hidden;flex:1;">' +
                    (item.top ? '<span style="color:#e74c3c;font-size:14px;flex-shrink:0;">📌</span>' : '') +
                    '<span class="poem-title">' + escapeHtml(item.title) + '</span>' +
                    '</div>' +
                    '<span class="date-text" style="font-size:13px;color:#8c7c68;flex-shrink:0;margin-left:12px;">' + item.date + '</span>' +
                    '</div>' +
                    (displayContent ? '<div class="poem-desc">' + escapeHtml(displayContent) + '</div>' : '') +
                    '</div>';
                if (j !== sortedList.length - 1) html += '<div class="item-divider"></div>';
            }
            break;

        // ========== 雪夜舟·图（图片80×80 + 日期） ==========
        case 'xueye':
            for (var k = 0; k < pageList.length; k++) {
                var group = pageList[k];
                var firstImage = group.images && group.images.length > 0 ? group.images[0] : '';
                html += '<div class="image-item-module" onclick="openDetail(\'' + key + '\', \'' + group.id + '\')">' +
                    '<img src="' + firstImage + '" class="image-thumb" onerror="this.style.display=\'none\'">' +
                    '<span class="image-date">' + group.date + '</span>' +
                    '</div>';
                if (k !== pageList.length - 1) html += '<div class="item-divider"></div>';
            }
            break;

        // ========== 各西东·语 ==========
        case 'gexidong':
            for (var l = 0; l < pageList.length; l++) {
                var item = pageList[l];
                html += '<div class="msg-item" onclick="openDetail(\'' + key + '\', \'' + item.id + '\')">' +
                    '<div class="msg-head">' +
                    '<div class="avatar" style="background:#c4b8a8;"></div>' +
                    '<div class="nickname">访客</div>' +
                    '</div>' +
                    '<div class="msg-content line-clamp-2">' + escapeHtml(item.content) + '</div>' +
                    '</div>';
                if (l !== pageList.length - 1) html += '<div class="item-divider"></div>';
            }
            break;

        // ========== 山野渔夫 ==========
        case 'shanye':
            for (var m = 0; m < pageList.length; m++) {
                var item = pageList[m];
                html += '<div class="intro-item">' + escapeHtml(item.bio) + '</div>';
                if (m !== pageList.length - 1) html += '<div class="item-divider"></div>';
            }
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
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// 详情页
// ============================================================

window.openDetail = async function(key, id) {
    var detail = null;
    var title = '';
    var pageId = key + '-' + id;

    if (key === 'shinian') {
        // 加载文章详情
        detail = await DataLoader.loadArticleById(id);
        if (!detail) {
            alert('文章内容未找到，ID: ' + id);
            // 从列表中获取标题
            var found = currentData.find(function(d) { return d.id === id; });
            if (found) {
                title = found.title || '文章';
                detail = { title: title, date: found.date || '未知日期', paragraphs: ['文章正文暂无内容'] };
            } else {
                return;
            }
        } else {
            title = detail.title || '文章';
        }
    } else {
        var item = currentData.find(function(d) { return d.id === id; });
        if (!item) { alert('内容未找到'); return; }
        title = item.text || item.title || item.content || item.bio || '详情';
        detail = { title: title, date: item.date || '未知日期', paragraphs: [title] };
        if (key === 'xueye' && item.images) {
            detail.paragraphs = item.images.map(function(img) {
                return '<img src="' + img + '" class="detail-image" onerror="this.style.display=\'none\'">';
            });
        }
    }

    listView.classList.add('hidden');
    detailView.classList.add('active');
    bodyEl.classList.add('detail-open');

    var keyTitle = DataLoader.getKeyTitle(key);

    var html = '<div class="breadcrumb" onclick="closeDetail()">‹ 家 / ' + keyTitle + ' / ' + escapeHtml(title) + '</div>' +
        '<h1 class="detail-title">' + escapeHtml(title) + '</h1>' +
        '<div class="detail-date">' + (detail.date || '未知日期') + '</div>' +
        '<div class="detail-body">';

    if (detail.paragraphs) {
        for (var i = 0; i < detail.paragraphs.length; i++) {
            var p = detail.paragraphs[i];
            if (typeof p === 'string' && p.indexOf('<img') !== -1) {
                html += p;
            } else {
                html += '<p>' + p + '</p>';
            }
        }
    }

    html += '</div>';

    // 评论区域
    html += '<div class="comments-section">' +
        '<h3 class="comments-title">💬 评论</h3>' +
        '<div id="commentsList"></div>' +
        '<div class="comment-form">' +
        '<h4>发表评论</h4>' +
        '<div class="form-group">' +
        '<input type="text" id="commentAuthor" placeholder="你的昵称（可选）" maxlength="20">' +
        '</div>' +
        '<div class="form-group">' +
        '<textarea id="commentContent" rows="4" placeholder="写下你的想法..." maxlength="500" oninput="updateCommentCharCount()"></textarea>' +
        '<div class="char-count"><span id="commentCharCount">0</span>/500</div>' +
        '</div>' +
        '<button onclick="submitUserComment()" class="btn btn-primary">提交评论</button>' +
        '</div>' +
        '</div>';

    html += '<button class="back-btn" onclick="closeDetail()">← 返回列表</button>';

    detailContainer.innerHTML = html;

    // 加载评论
    window.currentCommentPage = { id: pageId, title: title };
    if (typeof getComments === 'function') {
        try {
            var comments = await getComments(pageId);
            if (typeof renderComments === 'function') {
                renderComments(comments, 'commentsList');
            }
        } catch (e) {
            console.log('评论加载失败:', e);
        }
    }

    menuItems.forEach(function(el) { el.classList.remove('active'); });
    var activeMenu = document.querySelector('.menu-item[data-key="' + key + '"]');
    if (activeMenu) activeMenu.classList.add('active');
};

window.closeDetail = function() {
    listView.classList.remove('hidden');
    detailView.classList.remove('active');
    bodyEl.classList.remove('detail-open');

    menuItems.forEach(function(el) { el.classList.remove('active'); });
    var activeMenu = document.querySelector('.menu-item[data-key="' + currentKey + '"]');
    if (activeMenu) activeMenu.classList.add('active');
    renderContent(currentKey, currentPage);
};

// ============================================================
// 评论提交
// ============================================================

window.submitUserComment = async function() {
    var author = document.getElementById('commentAuthor').value;
    var content = document.getElementById('commentContent').value;
    var pageInfo = window.currentCommentPage;

    if (!pageInfo) {
        alert('请先打开一篇文章');
        return;
    }

    if (typeof submitComment === 'function') {
        var success = await submitComment(pageInfo.id, pageInfo.title, content, author);
        if (success) {
            document.getElementById('commentContent').value = '';
            document.getElementById('commentAuthor').value = '';
            document.getElementById('commentCharCount').textContent = '0';
            if (typeof getComments === 'function') {
                var comments = await getComments(pageInfo.id);
                if (typeof renderComments === 'function') {
                    renderComments(comments, 'commentsList');
                }
            }
        }
    } else {
        alert('评论功能未加载，请刷新页面重试');
    }
};

function updateCommentCharCount() {
    var el = document.getElementById('commentContent');
    var countEl = document.getElementById('commentCharCount');
    if (el && countEl) {
        countEl.textContent = el.value.length;
    }
}

// ============================================================
// 加载与初始化
// ============================================================

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
            bodyEl.classList.remove('detail-open');
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
