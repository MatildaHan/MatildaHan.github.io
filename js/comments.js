/**
 * comments.js - GitHub Issues 评论系统
 */

var COMMENTS_CONFIG = {
    owner: 'MatildaHan',
    repo: 'MatildaHan.github.io'
};

// ============================================================
// 获取评论
// ============================================================

async function getComments(pageId) {
    try {
        var url = 'https://api.github.com/repos/' + COMMENTS_CONFIG.owner + '/' + COMMENTS_CONFIG.repo + '/issues?labels=comment,approved&state=closed&per_page=100';
        var response = await fetch(url);
        if (!response.ok) return [];
        var issues = await response.json();

        var result = [];
        for (var i = 0; i < issues.length; i++) {
            var issue = issues[i];
            if (issue.body && issue.body.indexOf('[page:' + pageId + ']') !== -1) {
                var replies = await getIssueReplies(issue.number);
                result.push({
                    id: issue.number,
                    content: extractCommentContent(issue.body),
                    author: issue.user.login,
                    created_at: issue.created_at,
                    replies: replies
                });
            }
        }
        return result;
    } catch (e) {
        console.error('获取评论失败:', e);
        return [];
    }
}

async function getIssueReplies(issueNumber) {
    try {
        var url = 'https://api.github.com/repos/' + COMMENTS_CONFIG.owner + '/' + COMMENTS_CONFIG.repo + '/issues/' + issueNumber + '/comments';
        var response = await fetch(url);
        if (!response.ok) return [];
        var comments = await response.json();
        var result = [];
        for (var i = 0; i < comments.length; i++) {
            result.push({
                author: comments[i].user.login,
                content: comments[i].body,
                created_at: comments[i].created_at
            });
        }
        return result;
    } catch (e) {
        return [];
    }
}

// ============================================================
// 提取评论内容（修复版）
// ============================================================

function extractCommentContent(body) {
    if (!body) return '内容为空';
    
    // 方法1：查找 "评论内容：" 后面的内容
    var match = body.match(/评论内容：\n([\s\S]*?)(?=\n\n|$)/);
    if (match && match[1]) {
        return match[1].trim();
    }
    
    // 方法2：按行提取
    var lines = body.split('\n');
    var contentLines = [];
    var found = false;
    
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.indexOf('评论内容：') !== -1) {
            found = true;
            var rest = line.replace('评论内容：', '').trim();
            if (rest) {
                return rest;
            }
            continue;
        }
        if (found) {
            var trimmed = line.trim();
            if (trimmed === '' || trimmed.indexOf('页面：') === 0 || trimmed.indexOf('评论者：') === 0) {
                break;
            }
            contentLines.push(trimmed);
        }
    }
    
    if (contentLines.length > 0) {
        return contentLines.join(' ').trim();
    }
    
    // 方法3：清理元数据
    var clean = body.replace(/\[page:.+?\]/, '')
                    .replace(/页面：.+/, '')
                    .replace(/评论者：.+/, '')
                    .replace(/评论内容：/, '')
                    .trim();
    if (clean) {
        return clean;
    }
    
    return '内容为空';
}

// ============================================================
// 提交评论
// ============================================================

async function submitComment(pageId, pageTitle, content, author) {
    if (!content || content.trim() === '') {
        alert('请输入评论内容');
        return false;
    }

    var token = localStorage.getItem('github_token');
    if (!token) {
        alert('评论功能需要配置 GitHub Token，请联系管理员');
        return false;
    }

    try {
        var url = 'https://api.github.com/repos/' + COMMENTS_CONFIG.owner + '/' + COMMENTS_CONFIG.repo + '/issues';
        var response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'token ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: '[评论] ' + pageTitle + ' - ' + new Date().toLocaleString(),
                body: '[page:' + pageId + ']\n\n' +
                      '页面：' + pageTitle + '\n\n' +
                      '评论者：' + (author || '匿名用户') + '\n\n' +
                      '评论内容：\n' + content.trim(),
                labels: ['comment', 'pending']
            })
        });

        if (response.ok) {
            alert('评论提交成功！审核通过后将显示在页面中。');
            return true;
        } else {
            var error = await response.json();
            alert('提交失败：' + (error.message || '请重试'));
            return false;
        }
    } catch (e) {
        alert('提交失败，请检查网络连接');
        return false;
    }
}

// ============================================================
// 渲染评论
// ============================================================

function renderComments(comments, containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    if (!comments || comments.length === 0) {
        container.innerHTML = '<div class="comments-empty">暂无评论，来说点什么吧</div>';
        return;
    }

    var html = '<div class="comments-list">';
    for (var i = 0; i < comments.length; i++) {
        var c = comments[i];
        var contentDisplay = c.content || '内容为空';
        html += '<div class="comment-item">' +
            '<div class="comment-header">' +
            '<span class="comment-author">' + escapeHtml(c.author) + '</span>' +
            '<span class="comment-date">' + formatDate(c.created_at) + '</span>' +
            '</div>' +
            '<div class="comment-body">' + escapeHtml(contentDisplay) + '</div>';

        if (c.replies && c.replies.length > 0) {
            html += '<div class="comment-replies">';
            for (var j = 0; j < c.replies.length; j++) {
                var r = c.replies[j];
                var isAdmin = r.content.indexOf('管理员回复') !== -1 || r.content.indexOf('📝') !== -1;
                html += '<div class="reply-item' + (isAdmin ? ' reply-admin' : '') + '">' +
                    '<span class="reply-author">' + escapeHtml(r.author) + '</span>' +
                    '<span class="reply-content">' + escapeHtml(r.content) + '</span>' +
                    '</div>';
            }
            html += '</div>';
        }

        html += '</div>';
    }
    html += '</div>';

    container.innerHTML = html;
}

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    var d = new Date(dateStr);
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    var hours = String(d.getHours()).padStart(2, '0');
    var minutes = String(d.getMinutes()).padStart(2, '0');
    return d.getFullYear() + '/' + month + '/' + day + ' ' + hours + ':' + minutes;
}
