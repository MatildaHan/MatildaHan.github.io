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
            pageList.forEach(function(item, idx) {
                html += '<div class="item-module" onclick="openDetail(\'' + key + '\', \'' + item.id + '\')">' +
                    '<div class="text-content" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(item.text) + '</div>' +
                    '<div class="date-text" style="flex-shrink:0;">' + item.date + '</div>' +
                    '</div>';
                if (idx !== pageList.length - 1) html += '<div class="item-divider"></div>';
            });
            break;

        // ========== 十年灯·文（置顶 + 显示日期） ==========
        case 'shinian':
            // 置顶文章排在前面
            var sortedList = pageList.slice().sort(function(a, b) {
                if (a.top && !b.top) return -1;
                if (!a.top && b.top) return 1;
                return 0;
            });
            sortedList.forEach(function(item, idx) {
                var displayContent = item.content ? item.content.slice(0, 60) : '';
                if (item.content && item.content.length > 60) {
                    displayContent += '...';
                }
                html += '<div class="poem-item" onclick="openDetail(\'' + key + '\', \'' + item.id + '\')" style="padding:6px 0;">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;width:100%;">' +
                    '<div style="display:flex;align-items:center;gap:6px;overflow:hidden;flex:1;">' +
                    (item.top ? '<span style="color:#e74c3c;font-size:14px;flex-shrink:0;">📌</span>' : '') +
                    '<span style="font-size:16px;font-weight:bold;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(item.title) + '</span>' +
                    '</div>' +
                    '<span style="font-size:13px;color:#8c7c68;flex-shrink:0;margin-left:12px;">' + (item.date || '') + '</span>' +
                    '</div>' +
                    (displayContent ? '<div style="font-size:14px;color:#6b5b47;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;">' + escapeHtml(displayContent) + '</div>' : '') +
                    '</div>';
                if (idx !== sortedList.length - 1) html += '<div class="item-divider"></div>';
            });
            break;

        // ========== 雪夜舟·图（图片80×80 + 日期） ==========
        case 'xueye':
            pageList.forEach(function(group, idx) {
                var firstImage = group.images && group.images.length > 0 ? group.images[0] : '';
                html += '<div class="image-item-module" onclick="openDetail(\'' + key + '\', \'' + group.id + '\')" style="display:flex;align-items:center;gap:16px;padding:6px 0;cursor:pointer;transition:background 0.2s;">' +
                    '<img src="' + firstImage + '" alt="" style="width:80px;height:80px;object-fit:cover;border-radius:4px;flex-shrink:0;background:#ddd;" onerror="this.style.display=\'none\'">' +
                    '<span style="font-size:14px;color:#8c7c68;">' + (group.date || '') + '</span>' +
                    '</div>';
                if (idx !== pageList.length - 1) html += '<div class="item-divider"></div>';
            });
            break;

        // ========== 各西东·语 ==========
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

        // ========== 山野渔夫 ==========
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

// ============================================================
// 详情页
// ============================================================

window.openDetail = async function(key, id) {
    var detail = null;
    var title = '';
    var pageId = key + '-' + id;

    if (key === 'shinian') {
        detail = await DataLoader.loadArticleById(id);
        if (!detail) { alert('文章内容未找到'); return; }
        title = detail.title || '文章';
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
        detail.paragraphs.forEach(function(p) {
            if (typeof p === 'string' && p.indexOf('<img') !== -1) {
                html += p;
            } else {
                html += '<p>' + p + '</p>';
            }
        });
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
        var comments = await getComments(pageId);
        if (typeof renderComments === 'function') {
            renderComments(comments, 'commentsList');
        }
    }

    menuItems.forEach(function(el) { el.classList.remove('active'); });
    document.querySelector('.menu-item[data-key="' + key + '"]').classList.add('active');
};

window.closeDetail = function() {
    listView.classList.remove('hidden');
    detailView.classList.remove('active');
    bodyEl.classList.remove('detail-open');

    menuItems.forEach(function(el) { el.classList.remove('active'); });
    document.querySelector('.menu-item[data-key="' + currentKey + '"]').classList.add('active');
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
