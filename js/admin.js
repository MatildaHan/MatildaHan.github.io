/**
 * admin.js - 南山集后台管理（修复版）
 * 修复：
 * 1. 短句限制1行/50字
 * 2. 分类管理（增/删/改/筛选）
 * 3. 编辑弹窗回填数据
 * 4. 固定列宽
 */

// ============================================================
// 1. 配置
// ============================================================
var GITHUB_CONFIG = {
    owner: 'MatildaHan',
    repo: 'MatildaHan.github.io',
    branch: 'main',
    token: ''
};

var DATA_FILES = {
    xingyin: 'data/xingyin.md',
    shinian: 'data/shinian.md',
    xueye: 'data/xueye.md',
    gexidong: 'data/gexidong.md',
    shanye: 'data/shanye.md',
    settings: 'data/settings.json',
    categories: 'data/categories.md'
};

var currentEdit = { category: null, id: null, isNew: false };
var githubToken = '';
var categoryList = [];

// ============================================================
// 2. GitHub API 操作
// ============================================================

function getToken() {
    if (githubToken) return githubToken;
    var saved = localStorage.getItem('github_token');
    if (saved) { githubToken = saved; return githubToken; }
    var token = prompt(
        '请输入 GitHub Personal Access Token：\n\n' +
        '获取方式：\n' +
        'GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)\n' +
        '需要 repo 权限'
    );
    if (token) {
        githubToken = token;
        localStorage.setItem('github_token', token);
        updateConnectionStatus(true);
    }
    return token;
}

async function readGitHubFile(path) {
    var token = getToken();
    if (!token) throw new Error('需要 GitHub Token');
    var url = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/contents/' + path;
    var response = await fetch(url, {
        headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('读取失败: ' + response.status);
    var data = await response.json();
    var binaryString = atob(data.content);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    var decoder = new TextDecoder('utf-8');
    var content = decoder.decode(bytes);
    return { content: content, sha: data.sha };
}

async function writeGitHubFile(path, content, message) {
    if (!message) message = '更新内容';
    var token = getToken();
    if (!token) throw new Error('需要 GitHub Token');
    var sha = '';
    try {
        var existing = await readGitHubFile(path);
        if (existing) sha = existing.sha;
    } catch (e) {}
    var encoder = new TextEncoder();
    var data = encoder.encode(content);
    var binaryString = '';
    for (var i = 0; i < data.length; i++) {
        binaryString += String.fromCharCode(data[i]);
    }
    var base64Content = btoa(binaryString);
    var url = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/contents/' + path;
    var response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': 'token ' + token,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            message: message,
            content: base64Content,
            sha: sha,
            branch: GITHUB_CONFIG.branch
        })
    });
    if (!response.ok) {
        var error = await response.json();
        throw new Error(error.message || '写入失败');
    }
    return await response.json();
}

function updateConnectionStatus(connected) {
    var el = document.getElementById('connectionStatus');
    if (el) {
        if (connected) {
            el.textContent = '● 已连接';
            el.style.color = '#7ddf9a';
        } else {
            el.textContent = '● 未连接';
            el.style.color = '#ff6b6b';
        }
    }
}

// ============================================================
// 3. 数据加载与保存
// ============================================================

async function loadDataFile(category) {
    var path = DATA_FILES[category];
    if (!path) return '';
    try {
        var result = await readGitHubFile(path);
        return result ? result.content : '';
    } catch (e) {
        return '';
    }
}

async function saveDataFile(category, content) {
    var path = DATA_FILES[category];
    try {
        await writeGitHubFile(path, content, '更新 ' + category + ' 数据');
        return true;
    } catch (e) {
        console.error('保存失败:', e);
        showToast('保存失败: ' + e.message, 'error');
        return false;
    }
}

// ============================================================
// 4. 分类管理
// ============================================================

async function loadCategories() {
    var text = await loadDataFile('categories');
    if (text) {
        categoryList = text.split('\n').filter(function(line) { return line.trim(); });
    } else {
        categoryList = ['默认', '人生感悟', '生活', '文学'];
    }
    return categoryList;
}

async function saveCategories() {
    var content = categoryList.join('\n');
    await saveDataFile('categories', content);
}

function renderCategoryTable() {
    var tbody = document.getElementById('tbody-category');
    if (!tbody) return;
    if (categoryList.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="4">暂无分类，点击 "新增分类" 添加</td></tr>';
        return;
    }
    var html = '';
    for (var i = 0; i < categoryList.length; i++) {
        var name = categoryList[i];
        var count = getCategoryUsageCount(name);
        html += '<tr><td>' + (i + 1) + '</td><td>' + escapeHtml(name) + '</td><td>' + count + '</td><td>' +
            '<button onclick="editCategory(' + i + ')" class="btn btn-primary btn-sm">✏️</button>' +
            '<button onclick="deleteCategory(' + i + ')" class="btn btn-danger btn-sm">🗑️</button></td></tr>';
    }
    tbody.innerHTML = html;
}

function getCategoryUsageCount(name) {
    var count = 0;
    var categories = ['xingyin', 'shinian', 'xueye'];
    for (var c = 0; c < categories.length; c++) {
        var text = document.getElementById('tbody-' + categories[c]);
        if (text) {
            var rows = text.querySelectorAll('tr');
            for (var r = 0; r < rows.length; r++) {
                var cells = rows[r].querySelectorAll('td');
                if (cells.length > 2 && cells[2].textContent === name) {
                    count++;
                }
            }
        }
    }
    return count;
}

function addCategory() {
    var name = prompt('请输入新分类名称：');
    if (name && name.trim()) {
        var trimmed = name.trim();
        if (categoryList.indexOf(trimmed) === -1) {
            categoryList.push(trimmed);
            saveCategories();
            renderCategoryTable();
            showToast('分类添加成功', 'success');
        } else {
            showToast('分类已存在', 'error');
        }
    }
}

function editCategory(index) {
    var oldName = categoryList[index];
    var newName = prompt('修改分类名称：', oldName);
    if (newName && newName.trim() && newName.trim() !== oldName) {
        var trimmed = newName.trim();
        if (categoryList.indexOf(trimmed) === -1) {
            categoryList[index] = trimmed;
            saveCategories();
            renderCategoryTable();
            // 更新所有使用了该分类的数据
            updateCategoryInData(oldName, trimmed);
            showToast('分类修改成功', 'success');
        } else {
            showToast('分类已存在', 'error');
        }
    }
}

function deleteCategory(index) {
    var name = categoryList[index];
    var count = getCategoryUsageCount(name);
    if (count > 0) {
        if (!confirm('分类 "' + name + '" 正在被 ' + count + ' 条内容使用，删除后这些内容将变为"未分类"。确定删除吗？')) {
            return;
        }
    } else {
        if (!confirm('确定删除分类 "' + name + '" 吗？')) {
            return;
        }
    }
    categoryList.splice(index, 1);
    saveCategories();
    renderCategoryTable();
    showToast('分类删除成功', 'success');
}

async function updateCategoryInData(oldName, newName) {
    var categories = ['xingyin', 'shinian', 'xueye'];
    for (var c = 0; c < categories.length; c++) {
        var text = await loadDataFile(categories[c]);
        if (text) {
            var lines = text.split('\n');
            var updated = false;
            for (var i = 0; i < lines.length; i++) {
                var parts = lines[i].split('|').map(function(s) { return s.trim(); });
                if (parts.length >= 3 && parts[2] === oldName) {
                    parts[2] = newName;
                    lines[i] = parts.join(' | ');
                    updated = true;
                }
            }
            if (updated) {
                await saveDataFile(categories[c], lines.join('\n'));
            }
        }
    }
    // 重新渲染所有表格
    renderTable('xingyin');
    renderTable('shinian');
    renderTable('xueye');
}

function getCategoryOptions() {
    var html = '<option value="">无分类</option>';
    for (var i = 0; i < categoryList.length; i++) {
        html += '<option value="' + escapeHtml(categoryList[i]) + '">' + escapeHtml(categoryList[i]) + '</option>';
    }
    return html;
}

// ============================================================
// 5. 数据解析
// ============================================================

function parseXingyin(text) {
    if (!text) return [];
    return text.split('\n').filter(function(line) { return line.trim(); }).map(function(line) {
        var parts = line.split('|').map(function(s) { return s.trim(); });
        return { id: parts[0] || 'xy-' + Date.now(), text: parts[1] || '', category: parts[2] || '默认', date: parts[3] || '' };
    });
}

function formatXingyin(items) {
    return items.map(function(item) { return item.id + ' | ' + item.text + ' | ' + item
