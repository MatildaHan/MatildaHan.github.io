/**
 * admin.js - 南山集后台管理（完整修复版）
 * 修复：短句限制1行/50字、分类管理、编辑回填、固定列宽
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
    if (saved) {
        githubToken = saved;
        return githubToken;
    }
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
        headers: {
            'Authorization': 'token ' + token,
            'Accept': 'application/vnd.github.v3+json'
        }
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
        categoryList = text.split('\n').filter(function(line) {
            return line.trim();
        });
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
        var tbody = document.getElementById('tbody-' + categories[c]);
        if (tbody) {
            var rows = tbody.querySelectorAll('tr');
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
    var msg = '确定删除分类 "' + name + '" 吗？';
    if (count > 0) {
        msg = '分类 "' + name + '" 正在被 ' + count + ' 条内容使用，删除后这些内容将变为"未分类"。确定删除吗？';
    }
    if (!confirm(msg)) return;
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
                var parts = lines[i].split('|').map(function(s) {
                    return s.trim();
                });
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
    return text.split('\n').filter(function(line) {
        return line.trim();
    }).map(function(line) {
        var parts = line.split('|').map(function(s) {
            return s.trim();
        });
        return {
            id: parts[0] || 'xy-' + Date.now(),
            text: parts[1] || '',
            category: parts[2] || '默认',
            date: parts[3] || ''
        };
    });
}

function formatXingyin(items) {
    return items.map(function(item) {
        return item.id + ' | ' + item.text + ' | ' + item.category + ' | ' + item.date;
    }).join('\n');
}

function parseShinian(text) {
    if (!text) return [];
    return text.split('\n').filter(function(line) {
        return line.trim();
    }).map(function(line) {
        var parts = line.split('|').map(function(s) {
            return s.trim();
        });
        return {
            id: parts[0] || 'sn-' + Date.now(),
            title: parts[1] || '',
            summary: parts[2] || '',
            category: parts[3] || '',
            date: parts[4] || ''
        };
    });
}

function formatShinian(items) {
    return items.map(function(item) {
        return item.id + ' | ' + item.title + ' | ' + item.summary + ' | ' + item.category + ' | ' + item.date;
    }).join('\n');
}

function parseXueye(text) {
    if (!text) return [];
    return text.split('\n').filter(function(line) {
        return line.trim();
    }).map(function(line) {
        var parts = line.split('|').map(function(s) {
            return s.trim();
        });
        return {
            id: parts[0] || 'xy-' + Date.now(),
            date: parts[1] || '',
            category: parts[2] || '',
            images: parts[3] ? parts[3].split(',').map(function(s) {
                return s.trim();
            }) : []
        };
    });
}

function formatXueye(items) {
    return items.map(function(item) {
        return item.id + ' | ' + item.date + ' | ' + item.category + ' | ' + item.images.join(',');
    }).join('\n');
}

function parseGexidong(text) {
    if (!text) return [];
    return text.split('\n').filter(function(line) {
        return line.trim();
    }).map(function(line) {
        var parts = line.split('|').map(function(s) {
            return s.trim();
        });
        return {
            id: parts[0] || 'gx-' + Date.now(),
            content: parts[1] || '',
            date: parts[2] || ''
        };
    });
}

function formatGexidong(items) {
    return items.map(function(item) {
        return item.id + ' | ' + item.content + ' | ' + item.date;
    }).join('\n');
}

function parseShanye(text) {
    return text ? text.trim() : '';
}

// ============================================================
// 6. 渲染表格
// ============================================================

async function renderTable(category) {
    var text = await loadDataFile(category);
    var items = [];
    var renderFn = null;
    switch (category) {
        case 'xingyin':
            items = parseXingyin(text);
            renderFn = renderXingyinRow;
            break;
        case 'shinian':
            items = parseShinian(text);
            renderFn = renderShinianRow;
            break;
        case 'xueye':
            items = parseXueye(text);
            renderFn = renderXueyeRow;
            break;
        case 'gexidong':
            items = parseGexidong(text);
            renderFn = renderGexidongRow;
            break;
    }
    var tbody = document.getElementById('tbody-' + category);
    if (!tbody) return;
    if (items.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="10">暂无内容，点击 "新增" 添加</td></tr>';
        return;
    }
    var html = '';
    for (var i = 0; i < items.length; i++) {
        html += renderFn(items[i]);
    }
    tbody.innerHTML = html;
    updateStats(category, items.length);
}

function renderXingyinRow(item) {
    return '<tr><td>' + item.id + '</td><td title="' + escapeHtml(item.text) + '">' + escapeHtml(item.text) + '</td><td>' + escapeHtml(item.category) + '</td><td>' + item.date + '</td><td><button onclick="editItem(\'xingyin\',\'' + item.id + '\')" class="btn btn-primary btn-sm">✏️</button><button onclick="deleteItem(\'xingyin\',\'' + item.id + '\')" class="btn btn-danger btn-sm">🗑️</button></td></tr>';
}

function renderShinianRow(item) {
    var summary = item.summary.length > 30 ? item.summary.slice(0, 30) + '...' : item.summary;
    return '<tr><td>' + item.id + '</td><td title="' + escapeHtml(item.title) + '">' + escapeHtml(item.title) + '</td><td title="' + escapeHtml(item.summary) + '">' + escapeHtml(summary) + '</td><td>' + escapeHtml(item.category) + '</td><td>' + item.date + '</td><td><button onclick="editItem(\'shinian\',\'' + item.id + '\')" class="btn btn-primary btn-sm">✏️</button><button onclick="deleteItem(\'shinian\',\'' + item.id + '\')" class="btn btn-danger btn-sm">🗑️</button></td></tr>';
}

function renderXueyeRow(item) {
    var preview = '';
    for (var i = 0; i < Math.min(3, item.images.length); i++) {
        preview += '<img src="' + item.images[i] + '" style="width:40px;height:40px;object-fit:cover;border-radius:4px;" onerror="this.style.display=\'none\'">';
    }
    return '<tr><td>' + item.id + '</td><td>' + item.date + '</td><td>' + escapeHtml(item.category) + '</td><td>' + item.images.length + '</td><td><div style="display:flex;gap:4px;overflow:hidden;">' + preview + '</div></td><td><button onclick="editItem(\'xueye\',\'' + item.id + '\')" class="btn btn-primary btn-sm">✏️</button><button onclick="deleteItem(\'xueye\',\'' + item.id + '\')" class="btn btn-danger btn-sm">🗑️</button></td></tr>';
}

function renderGexidongRow(item) {
    var content = item.content.length > 40 ? item.content.slice(0, 40) + '...' : item.content;
    return '<tr><td>' + item.id + '</td><td title="' + escapeHtml(item.content) + '">' + escapeHtml(content) + '</td><td>' + item.date + '</td><td><button onclick="editItem(\'gexidong\',\'' + item.id + '\')" class="btn btn-primary btn-sm">✏️</button><button onclick="deleteItem(\'gexidong\',\'' + item.id + '\')" class="btn btn-danger btn-sm">🗑️</button></td></tr>';
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// 7. 统计
// ============================================================

function updateStats(category, count) {
    var map = {
        xingyin: 'statXingyin',
        shinian: 'statShinian',
        xueye: 'statXueye',
        gexidong: 'statGexidong'
    };
    var el = document.getElementById(map[category]);
    if (el) el.textContent = count;
}

async function updateAllStats() {
    var categories = ['xingyin', 'shinian', 'xueye', 'gexidong'];
    for (var i = 0; i < categories.length; i++) {
        var cat = categories[i];
        var text = await loadDataFile(cat);
        var items = [];
        switch (cat) {
            case 'xingyin':
                items = parseXingyin(text);
                break;
            case 'shinian':
                items = parseShinian(text);
                break;
            case 'xueye':
                items = parseXueye(text);
                break;
            case 'gexidong':
                items = parseGexidong(text);
                break;
        }
        updateStats(cat, items.length);
    }
}

// ============================================================
// 8. 增删改
// ============================================================

function addItem(category) {
    currentEdit = { category: category, id: null, isNew: true };
    showModal(category, null, true);
}

function editItem(category, id) {
    currentEdit = { category: category, id: id, isNew: false };
    showModal(category, id, false);
}

async function deleteItem(category, id) {
    if (!confirm('确定删除吗？')) return;
    var text = await loadDataFile(category);
    var items = [];
    var formatter = null;
    switch (category) {
        case 'xingyin':
            items = parseXingyin(text);
            formatter = formatXingyin;
            break;
        case 'shinian':
            items = parseShinian(text);
            formatter = formatShinian;
            break;
        case 'xueye':
            items = parseXueye(text);
            formatter = formatXueye;
            break;
        case 'gexidong':
            items = parseGexidong(text);
            formatter = formatGexidong;
            break;
    }
    items = items.filter(function(item) {
        return item.id !== id;
    });
    var newText = formatter(items);
    await saveDataFile(category, newText);
    renderTable(category);
    updateAllStats();
    showToast('删除成功', 'success');
}

// ============================================================
// 9. 弹窗
// ============================================================

function showModal(category, id, isNew) {
    var modal = document.getElementById('editModal');
    var title = document.getElementById('modalTitle');
    var body = document.getElementById('modalBody');
    var names = {
        xingyin: '行吟册·絮',
        shinian: '十年灯·文',
        xueye: '雪夜舟·图',
        gexidong: '各西东·语'
    };
    title.textContent = isNew ? '新增 ' + names[category] : '编辑 ' + names[category];

    var existingData = null;
    if (!isNew) {
        var tbody = document.getElementById('tbody-' + category);
        if (tbody) {
            var rows = tbody.querySelectorAll('tr');
            for (var r = 0; r < rows.length; r++) {
                var cells = rows[r].querySelectorAll('td');
                if (cells.length > 0 && cells[0].textContent === id) {
                    existingData = [];
                    for (var c = 0; c < cells.length - 1; c++) {
                        existingData.push(cells[c].textContent);
                    }
                    break;
                }
            }
        }
    }

    var html = '';
    var today = new Date().toISOString().slice(0, 10);
    var categoryOptions = getCategoryOptions();

    switch (category) {
        case 'xingyin':
            var textVal = existingData ? existingData[1] || '' : '';
            var catVal = existingData ? existingData[2] || '默认' : '默认';
            var dateVal = existingData ? existingData[3] || today : today;
            html =
                '<div class="form-group">' +
                '<label>短句内容（最多50字，不能换行）</label>' +
                '<input type="text" id="formText" maxlength="50" value="' + escapeHtml(textVal) + '" placeholder="请输入短句..." oninput="updateCharCount()">' +
                '<div class="char-count"><span id="charCount">' + textVal.length + '</span>/50</div>' +
                '</div>' +
                '<div class="form-group">' +
                '<label>分类</label>' +
                '<select id="formCategory">' + categoryOptions + '</select>' +
                '</div>' +
                '<div class="form-group">' +
                '<label>日期</label>' +
                '<input type="date" id="formDate" value="' + dateVal + '">' +
                '</div>' +
                '<div class="hint">💡 短句不能换行，最多50个字符</div>';
            setTimeout(function() {
                var sel = document.getElementById('formCategory');
                if (sel) sel.value = catVal;
            }, 50);
            break;

        case 'shinian':
            var titleVal = existingData ? existingData[1] || '' : '';
            var summaryVal = existingData ? existingData[2] || '' : '';
            var catVal = existingData ? existingData[3] || '' : '';
            var dateVal = existingData ? existingData[4] || today : today;
            var contentVal = '';
            if (!isNew && id) {
                (async function() {
                    try {
                        var article = await loadArticleContent(id);
                        if (article) {
                            document.getElementById('formContent').value = article;
                        }
                    } catch (e) {}
                })();
            }
            html =
                '<div class="form-group"><label>标题</label><input type="text" id="formTitle" value="' + escapeHtml(titleVal) + '"></div>' +
                '<div class="form-group"><label>摘要（列表显示）</label><textarea id="formSummary" rows="2">' + escapeHtml(summaryVal) + '</textarea></div>' +
                '<div class="form-group"><label>分类</label><select id="formCategory">' + categoryOptions + '</select></div>' +
                '<div class="form-group"><label>正文（详情页）</label><textarea id="formContent" rows="6" placeholder="文章正文内容...">' + escapeHtml(contentVal) + '</textarea></div>' +
                '<div class="form-group"><label>日期</label><input type="date" id="formDate" value="' + dateVal + '"></div>';
            setTimeout(function() {
                var sel = document.getElementById('formCategory');
                if (sel) sel.value = catVal;
            }, 50);
            break;

        case 'xueye':
            var dateVal = existingData ? existingData[1] || today : today;
            var catVal = existingData ? existingData[2] || '' : '';
            var imagesVal = existingData && existingData.length > 3 ? existingData[3] || '' : '';
            html =
                '<div class="form-group"><label>日期</label><input type="date" id="formDate" value="' + dateVal + '"></div>' +
                '<div class="form-group"><label>分类</label><select id="formCategory">' + categoryOptions + '</select></div>' +
                '<div class="form-group"><label>图片 URL（逗号分隔）</label><textarea id="formImages" rows="3">' + escapeHtml(imagesVal) + '</textarea></div>';
            setTimeout(function() {
                var sel = document.getElementById('formCategory');
                if (sel) sel.value = catVal;
            }, 50);
            break;

        case 'gexidong':
            var contentVal = existingData ? existingData[1] || '' : '';
            var dateVal = existingData ? existingData[2] || today : today;
            html =
                '<div class="form-group"><label>留言内容</label><textarea id="formContent" rows="4">' + escapeHtml(contentVal) + '</textarea></div>' +
                '<div class="form-group"><label>日期</label><input type="date" id="formDate" value="' + dateVal + '"></div>';
            break;
    }

    body.innerHTML = html;
    modal.classList.add('active');
}

async function loadArticleContent(id) {
    try {
        var result = await readGitHubFile('articles/' + id + '.md');
        if (result) {
            var content = result.content;
            var lines = content.split('\n');
            var start = false;
            var paragraphs = [];
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line.trim() === '---') {
                    if (!start) {
                        start = true;
                        continue;
                    } else {
                        start = false;
                        continue;
                    }
                }
                if (!start && line.trim() && !line.match(/^date:/) && !line.match(/^title:/)) {
                    paragraphs.push(line.trim());
                }
            }
            return paragraphs.join('\n\n');
        }
        return '';
    } catch (e) {
        return '';
    }
}

function updateCharCount() {
    var el = document.getElementById('formText');
    var countEl = document.getElementById('charCount');
    if (el && countEl) {
        var len = el.value.length;
        countEl.textContent = len;
        var parent = countEl.parentElement;
        if (len > 45) {
            parent.className = 'char-count warning';
        } else {
            parent.className = 'char-count';
        }
    }
}

function closeModal() {
    document.getElementById('editModal').classList.remove('active');
}

async function saveModal() {
    var category = currentEdit.category;
    var id = currentEdit.id;
    var isNew = currentEdit.isNew;
    var text = await loadDataFile(category);
    var items = [];
    var formatter = null;
    switch (category) {
        case 'xingyin':
            items = parseXingyin(text);
            formatter = formatXingyin;
            break;
        case 'shinian':
            items = parseShinian(text);
            formatter = formatShinian;
            break;
        case 'xueye':
            items = parseXueye(text);
            formatter = formatXueye;
            break;
        case 'gexidong':
            items = parseGexidong(text);
            formatter = formatGexidong;
            break;
    }
    var formData = collectFormData(category);
    if (!formData) return;

    if (category === 'xingyin' && formData.text) {
        formData.text = formData.text.replace(/\n/g, ' ').trim();
        if (formData.text.length > 50) {
            showToast('短句不能超过50个字符', 'error');
            return;
        }
    }

    if (isNew) {
        var prefix = { xingyin: 'xy', shinian: 'sn', xueye: 'xy', gexidong: 'gx' }[category];
        formData.id = prefix + '-' + Date.now();
        items.push(formData);
    } else {
        var index = -1;
        for (var i = 0; i < items.length; i++) {
            if (items[i].id === id) {
                index = i;
                break;
            }
        }
        if (index !== -1) {
            formData.id = id;
            items[index] = formData;
        }
    }
    var newText = formatter(items);
    var success = await saveDataFile(category, newText);

    if (category === 'shinian' && formData.content) {
        var articleId = isNew ? formData.id : id;
        var articleContent = '---\ndate: ' + formData.date + '\ntitle: ' + formData.title + '\n---\n\n' + formData.content;
        try {
            await writeGitHubFile('articles/' + articleId + '.md', articleContent, '保存文章: ' + formData.title);
        } catch (e) {}
    }

    if (success) {
        closeModal();
        renderTable(category);
        updateAllStats();
        showToast('保存成功！正在部署...', 'success');
        await deploySite();
    }
}

function collectFormData(category) {
    var getVal = function(id) {
        var el = document.getElementById(id);
        return el ? el.value : '';
    };
    var getSel = function(id) {
        var el = document.getElementById(id);
        return el ? el.value : '';
    };
    switch (category) {
        case 'xingyin':
            return {
                text: getVal('formText'),
                category: getSel('formCategory') || '默认',
                date: getVal('formDate')
            };
        case 'shinian':
            return {
                title: getVal('formTitle'),
                summary: getVal('formSummary'),
                content: getVal('formContent'),
                category: getSel('formCategory') || '',
                date: getVal('formDate')
            };
        case 'xueye':
            return {
                date: getVal('formDate'),
                category: getSel('formCategory') || '',
                images: getVal('formImages').split(',').map(function(s) {
                    return s.trim();
                }).filter(function(s) {
                    return s;
                })
            };
        case 'gexidong':
            return {
                content: getVal('formContent'),
                date: getVal('formDate')
            };
        default:
            return null;
    }
}

// ============================================================
// 10. 山野渔夫
// ============================================================

async function loadShanye() {
    var text = await loadDataFile('shanye');
    document.getElementById('shanyeContent').value = parseShanye(text);
}

async function saveShanye() {
    var content = document.getElementById('shanyeContent').value;
    await saveDataFile('shanye', content);
    showToast('简介保存成功！', 'success');
}

// ============================================================
// 11. 主题设置
// ============================================================

async function loadSettings() {
    var text = await loadDataFile('settings');
    if (text) {
        try {
            var settings = JSON.parse(text);
            document.getElementById('settingBgImage').value = settings.bgImage || '';
            document.getElementById('settingBgColor').value = settings.bgColor || '#ecebe9';
            document.getElementById('settingPrimaryColor').value = settings.primaryColor || '#6b5b47';
            document.getElementById('settingTitleColor').value = settings.titleColor || '#333333';
            document.getElementById('settingSubtitle').value = settings.subtitle || '春山如黛草如烟';
        } catch (e) {}
    }
}

async function saveSettings() {
    var settings = {
        bgImage: document.getElementById('settingBgImage').value,
        bgColor: document.getElementById('settingBgColor').value,
        primaryColor: document.getElementById('settingPrimaryColor').value,
        titleColor: document.getElementById('settingTitleColor').value,
        subtitle: document.getElementById('settingSubtitle').value
    };
    await saveDataFile('settings', JSON.stringify(settings, null, 2));
    showToast('主题设置保存成功！', 'success');
}

function previewSettings() {
    var bgImage = document.getElementById('settingBgImage').value;
    var bgColor = document.getElementById('settingBgColor').value;
    var primaryColor = document.getElementById('settingPrimaryColor').value;
    var titleColor = document.getElementById('settingTitleColor').value;
    var subtitle = document.getElementById('settingSubtitle').value;
    var modal = document.getElementById('editModal');
    document.getElementById('modalTitle').textContent = '👁️ 主题预览';
    document.getElementById('modalBody').innerHTML = '<div style="padding:20px;background:' + bgColor + ';border-radius:8px;' + (bgImage ? 'background-image:url(' + bgImage + ');background-size:cover;' : '') + '"><div style="background:rgba(255,255,255,0.85);padding:40px;border-radius:8px;"><h1 style="color:' + titleColor + ';font-size:28px;font-weight:bold;">南山集</h1><p style="color:' + primaryColor + ';font-size:16px;">' + subtitle + '</p><hr style="border-color:' + primaryColor + ';margin:16px 0;"><p style="color:' + primaryColor + ';font-size:14px;">预览效果</p><div style="display:flex;gap:12px;margin-top:16px;"><span style="background:' + primaryColor + ';color:#fff;padding:4px 16px;border-radius:4px;">按钮</span><span style="border:1px solid ' + primaryColor + ';color:' + primaryColor + ';padding:4px 16px;border-radius:4px;">边框</span></div></div></div>';
    modal.classList.add('active');
    document.querySelector('.modal-footer .btn-primary').onclick = closeModal;
}

// ============================================================
// 12. 同步与部署
// ============================================================

async function syncAll() {
    showToast('正在同步数据...', 'info');
    try {
        await loadCategories();
        await updateAllStats();
        await renderTable('xingyin');
        await renderTable('shinian');
        await renderTable('xueye');
        await renderTable('gexidong');
        await loadShanye();
        await loadSettings();
        renderCategoryTable();
        showToast('同步完成！', 'success');
    } catch (e) {
        showToast('同步失败: ' + e.message, 'error');
    }
}

async function deploySite() {
    try {
        var token = getToken();
        if (!token) return;
        var url = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/git/refs/heads/' + GITHUB_CONFIG.branch;
        var response = await fetch(url, {
            headers: {
                'Authorization': 'token ' + token
            }
        });
        var data = await response.json();
        var latestSha = data.object.sha;
        var commitUrl = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/git/commits';
        await fetch(commitUrl, {
            method: 'POST',
            headers: {
                'Authorization': 'token ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: '🚀 部署更新',
                tree: latestSha,
                parents: [latestSha]
            })
        });
        showToast('🚀 部署已触发，等待 1-3 分钟...', 'success');
    } catch (e) {
        showToast('✅ 数据已保存，GitHub Pages 将自动部署', 'success');
    }
}

// ============================================================
// 13. Toast
// ============================================================

function showToast(message, type) {
    if (!type) type = 'info';
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.classList.add('show');
    }, 10);
    setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() {
            toast.remove();
        }, 300);
    }, 4000);
}

// ============================================================
// 14. 导航切换
// ============================================================

var navItems = document.querySelectorAll('.nav-item');
for (var i = 0; i < navItems.length; i++) {
    navItems[i].addEventListener('click', function(e) {
        e.preventDefault();
        var items = document.querySelectorAll('.nav-item');
        for (var j = 0; j < items.length; j++) {
            items[j].classList.remove('active');
        }
        this.classList.add('active');
        var tab = this.dataset.tab;
        var panels = document.querySelectorAll('.tab-panel');
        for (var k = 0; k < panels.length; k++) {
            panels[k].classList.remove('active');
        }
        var panel = document.getElementById('panel-' + tab);
        if (panel) {
            panel.classList.add('active');
            if (['xingyin', 'shinian', 'xueye', 'gexidong'].indexOf(tab) !== -1) {
                renderTable(tab);
            } else if (tab === 'shanye') {
                loadShanye();
            } else if (tab === 'settings') {
                loadSettings();
            } else if (tab === 'category') {
                loadCategories();
                renderCategoryTable();
            } else if (tab === 'dashboard') {
                updateAllStats();
            }
        }
    });
}

// ============================================================
// 15. 自动创建默认数据
// ============================================================

var DEFAULT_DATA = {
    'xingyin': 'xy-001 | 欢迎使用南山集 | 默认 | ' + new Date().toISOString().slice(0, 10) + '\nxy-002 | 在这里管理你的短句 | 默认 | ' + new Date().toISOString().slice(0, 10),
    'shinian': 'sn-001 | 第一篇文章 | 这是文章的摘要，显示在列表页。 | 默认 | ' + new Date().toISOString().slice(0, 10),
    'xueye': 'xy-001 | ' + new Date().toISOString().slice(0, 10) + ' | 默认 | https://picsum.photos/150/150?1,https://picsum.photos/150/150?2',
    'gexidong': 'gx-001 | 欢迎留言，记录你的想法。 | ' + new Date().toISOString().slice(0, 10),
    'shanye': '山野居者，渔樵度日。在这里编辑你的个人简介。',
    'settings': JSON.stringify({
        bgImage: '',
        bgColor: '#ecebe9',
        primaryColor: '#6b5b47',
        titleColor: '#333333',
        subtitle: '春山如黛草如烟'
    }, null, 2),
    'categories': '默认\n人生感悟\n生活\n文学'
};

var DEFAULT_ARTICLE = '---\ndate: ' + new Date().toISOString().slice(0, 10) + '\ntitle: 第一篇文章\n---\n\n这是文章正文内容，你可以在这里写任何内容。\n\n多段内容可以用空行分隔。';

async function initData() {
    var categories = ['xingyin', 'shinian', 'xueye', 'gexidong', 'shanye', 'settings', 'categories'];
    var hasData = false;
    for (var i = 0; i < categories.length; i++) {
        var cat = categories[i];
        var text = await loadDataFile(cat);
        if (text && text.trim()) {
            hasData = true;
            break;
        }
    }
    if (!hasData) {
        showToast('首次运行，正在创建默认数据...', 'info');
        for (var j = 0; j < categories.length; j++) {
            var key = categories[j];
            var content = DEFAULT_DATA[key] || '';
            if (content) {
                await saveDataFile(key, content);
            }
        }
        try {
            await writeGitHubFile('articles/sn-001.md', DEFAULT_ARTICLE, '创建默认文章');
        } catch (e) {}
        await loadCategories();
        showToast('✅ 默认数据创建完成！', 'success');
    } else {
        await loadCategories();
    }
    await updateAllStats();
    await renderTable('xingyin');
    await renderTable('shinian');
    await renderTable('xueye');
    await renderTable('gexidong');
    await loadShanye();
    await loadSettings();
    renderCategoryTable();
}

// ============================================================
// 16. 启动
// ============================================================

var savedToken = localStorage.getItem('github_token');
if (savedToken) {
    githubToken = savedToken;
    updateConnectionStatus(true);
} else {
    updateConnectionStatus(false);
}

initData();

console.log('📝 南山集后台管理已启动（完整修复版）');
console.log('⚠️ 请确保已配置 GitHub Token');
console.log('📖 获取 Token: GitHub Settings → Developer settings → Personal access tokens');
