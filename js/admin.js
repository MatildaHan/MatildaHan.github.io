/**
 * admin.js - 南山集后台管理（完整修复版）
 * 修复：固定列宽、富文本编辑器、清空表单、自动日期
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
    categories_xingyin: 'data/categories_xingyin.md',
    categories_shinian: 'data/categories_shinian.md',
    categories_xueye: 'data/categories_xueye.md'
};

var currentEdit = { category: null, id: null, isNew: false };
var githubToken = '';

var categoryData = {
    xingyin: [],
    shinian: [],
    xueye: []
};

// ============================================================
// 2. GitHub API
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
            el.textContent = '已连接';
            el.style.color = '#7ddf9a';
        } else {
            el.textContent = '未连接';
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
        await writeGitHubFile(path, content, '更新 ' + category);
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

async function loadCategories(target) {
    var fileKey = 'categories_' + target;
    var text = await loadDataFile(fileKey);
    if (text) {
        categoryData[target] = text.split('\n').filter(function(line) {
            return line.trim();
        });
    } else {
        var defaults = {
            xingyin: ['默认', '人生感悟', '生活'],
            shinian: ['默认', '文学', '随笔', '诗词'],
            xueye: ['默认', '风景', '人物', '纪实']
        };
        categoryData[target] = defaults[target] || ['默认'];
    }
    return categoryData[target];
}

async function saveCategories(target) {
    var fileKey = 'categories_' + target;
    var content = categoryData[target].join('\n');
    await saveDataFile(fileKey, content);
}

function renderCategoryTable(target) {
    var tbody = document.getElementById('tbody-category-' + target);
    if (!tbody) return;
    var list = categoryData[target] || [];
    if (list.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="4">暂无分类</td></tr>';
        return;
    }
    var html = '';
    for (var i = 0; i < list.length; i++) {
        var name = list[i];
        var count = getCategoryUsageCount(target, name);
        html += '<tr><td>' + (i + 1) + '</td><td>' + escapeHtml(name) + '</td><td>' + count + '</td><td>' +
            '<button onclick="editCategory(\'' + target + '\',' + i + ')" class="btn btn-primary btn-sm">编辑</button>' +
            '<button onclick="deleteCategory(\'' + target + '\',' + i + ')" class="btn btn-danger btn-sm">删除</button></td></tr>';
    }
    tbody.innerHTML = html;
}

function getCategoryUsageCount(target, name) {
    var count = 0;
    var tbody = document.getElementById('tbody-' + target);
    if (tbody) {
        var rows = tbody.querySelectorAll('tr');
        for (var r = 0; r < rows.length; r++) {
            var cells = rows[r].querySelectorAll('td');
            var colIndex = (target === 'xingyin') ? 2 : (target === 'shinian' ? 3 : 2);
            if (cells.length > colIndex && cells[colIndex].textContent === name) {
                count++;
            }
        }
    }
    return count;
}

function addCategory(target) {
    var name = prompt('请输入新分类名称：');
    if (name && name.trim()) {
        var trimmed = name.trim();
        if (categoryData[target].indexOf(trimmed) === -1) {
            categoryData[target].push(trimmed);
            saveCategories(target);
            renderCategoryTable(target);
            updateCategorySelect(target);
            showToast('分类添加成功', 'success');
        } else {
            showToast('分类已存在', 'error');
        }
    }
}

function editCategory(target, index) {
    var oldName = categoryData[target][index];
    var newName = prompt('修改分类名称：', oldName);
    if (newName && newName.trim() && newName.trim() !== oldName) {
        var trimmed = newName.trim();
        if (categoryData[target].indexOf(trimmed) === -1) {
            categoryData[target][index] = trimmed;
            saveCategories(target);
            renderCategoryTable(target);
            updateCategoryInData(target, oldName, trimmed);
            updateCategorySelect(target);
            showToast('分类修改成功', 'success');
        } else {
            showToast('分类已存在', 'error');
        }
    }
}

function deleteCategory(target, index) {
    var name = categoryData[target][index];
    var count = getCategoryUsageCount(target, name);
    var msg = '确定删除分类 "' + name + '" 吗？';
    if (count > 0) {
        msg = '分类 "' + name + '" 正在被 ' + count + ' 条内容使用，删除后这些内容将变为"未分类"。确定删除吗？';
    }
    if (!confirm(msg)) return;
    categoryData[target].splice(index, 1);
    saveCategories(target);
    renderCategoryTable(target);
    updateCategorySelect(target);
    showToast('分类删除成功', 'success');
}

async function updateCategoryInData(target, oldName, newName) {
    var text = await loadDataFile(target);
    if (text) {
        var lines = text.split('\n');
        var updated = false;
        for (var i = 0; i < lines.length; i++) {
            var parts = lines[i].split('|').map(function(s) {
                return s.trim();
            });
            var colIndex = (target === 'xingyin') ? 2 : (target === 'shinian' ? 3 : 2);
            if (parts.length > colIndex && parts[colIndex] === oldName) {
                parts[colIndex] = newName;
                lines[i] = parts.join(' | ');
                updated = true;
            }
        }
        if (updated) {
            await saveDataFile(target, lines.join('\n'));
        }
    }
    renderTable(target);
}

function updateCategorySelect(target) {
    var selects = document.querySelectorAll('select[data-target="' + target + '"]');
    var options = '<option value="">无分类</option>';
    for (var i = 0; i < categoryData[target].length; i++) {
        options += '<option value="' + escapeHtml(categoryData[target][i]) + '">' + escapeHtml(categoryData[target][i]) + '</option>';
    }
    for (var s = 0; s < selects.length; s++) {
        var currentVal = selects[s].value;
        selects[s].innerHTML = options;
        selects[s].value = currentVal;
    }
}

function getCategoryOptions(target) {
    var html = '<option value="">无分类</option>';
    var list = categoryData[target] || [];
    for (var i = 0; i < list.length; i++) {
        html += '<option value="' + escapeHtml(list[i]) + '">' + escapeHtml(list[i]) + '</option>';
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
            content: parts[2] || '',
            category: parts[3] || '',
            date: parts[4] || '',
            top: parts[5] === 'true' || false
        };
    });
}

function formatShinian(items) {
    return items.map(function(item) {
        return item.id + ' | ' + item.title + ' | ' + item.content + ' | ' + item.category + ' | ' + item.date + ' | ' + (item.top ? 'true' : 'false');
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
// 6. 渲染表格（固定列宽）
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
        tbody.innerHTML = '<tr class="empty-row"><td colspan="10">暂无内容</td></tr>';
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
    return '<tr><td style="width:80px;">' + item.id + '</td><td style="width:400px;" title="' + escapeHtml(item.text) + '">' + escapeHtml(item.text) + '</td><td style="width:120px;">' + escapeHtml(item.category) + '</td><td style="width:120px;">' + item.date + '</td><td style="width:140px;"><button onclick="editItem(\'xingyin\',\'' + item.id + '\')" class="btn btn-primary btn-sm">编辑</button><button onclick="deleteItem(\'xingyin\',\'' + item.id + '\')" class="btn btn-danger btn-sm">删除</button></td></tr>';
}

// ===== 十年灯·文：固定列宽 =====
function renderShinianRow(item) {
    var topChecked = item.top ? 'checked' : '';
    return '<tr>' +
        '<td style="width:80px;">' + item.id + '</td>' +
        '<td style="width:180px;" title="' + escapeHtml(item.title) + '">' + escapeHtml(item.title) + '</td>' +
        '<td style="width:250px;" title="' + escapeHtml(item.content) + '">' + escapeHtml(item.content) + '</td>' +
        '<td style="width:120px;">' + escapeHtml(item.category) + '</td>' +
        '<td style="width:120px;">' + item.date + '</td>' +
        '<td style="width:100px;">' +
        '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;">' +
        '<input type="checkbox" ' + topChecked + ' onchange="toggleTop(\'shinian\', \'' + item.id + '\', this.checked)">' +
        '<span style="font-size:12px;color:#888;">置顶</span>' +
        '</label>' +
        '</td>' +
        '<td style="width:150px;">' +
        '<button onclick="editItem(\'shinian\',\'' + item.id + '\')" class="btn btn-primary btn-sm">编辑</button> ' +
        '<button onclick="deleteItem(\'shinian\',\'' + item.id + '\')" class="btn btn-danger btn-sm">删除</button>' +
        '</td>' +
        '</tr>';
}

function renderXueyeRow(item) {
    var preview = '';
    for (var i = 0; i < Math.min(3, item.images.length); i++) {
        preview += '<img src="' + item.images[i] + '" style="width:40px;height:40px;object-fit:cover;border-radius:4px;" onerror="this.style.display=\'none\'">';
    }
    return '<tr><td style="width:80px;">' + item.id + '</td><td style="width:120px;">' + item.date + '</td><td style="width:120px;">' + escapeHtml(item.category) + '</td><td style="width:80px;">' + item.images.length + '</td><td style="width:200px;"><div style="display:flex;gap:4px;overflow:hidden;">' + preview + '</div></td><td style="width:140px;"><button onclick="editItem(\'xueye\',\'' + item.id + '\')" class="btn btn-primary btn-sm">编辑</button><button onclick="deleteItem(\'xueye\',\'' + item.id + '\')" class="btn btn-danger btn-sm">删除</button></td></tr>';
}

function renderGexidongRow(item) {
    var content = item.content.length > 40 ? item.content.slice(0, 40) + '...' : item.content;
    return '<tr><td style="width:80px;">' + item.id + '</td><td style="width:400px;" title="' + escapeHtml(item.content) + '">' + escapeHtml(content) + '</td><td style="width:120px;">' + item.date + '</td><td style="width:140px;"><button onclick="editItem(\'gexidong\',\'' + item.id + '\')" class="btn btn-primary btn-sm">编辑</button><button onclick="deleteItem(\'gexidong\',\'' + item.id + '\')" class="btn btn-danger btn-sm">删除</button></td></tr>';
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
// 9. 置顶切换
// ============================================================

async function toggleTop(category, id, checked) {
    try {
        var text = await loadDataFile(category);
        var items = parseShinian(text);

        var found = false;
        for (var i = 0; i < items.length; i++) {
            if (items[i].id === id) {
                items[i].top = checked;
                found = true;
                break;
            }
        }

        if (!found) {
            showToast('未找到该文章', 'error');
            return;
        }

        var newText = formatShinian(items);
        var success = await saveDataFile(category, newText);

        if (success) {
            showToast(checked ? '已置顶' : '已取消置顶', 'success');
            renderTable(category);
        }
    } catch (e) {
        showToast('操作失败: ' + e.message, 'error');
    }
}

// ============================================================
// 10. 弹窗（清空表单 + 富文本编辑器）
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

    // 获取已有数据（编辑时回填）
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

    // 先清空之前的表单内容
    var html = '';
    var categoryOptions = getCategoryOptions(category);

    switch (category) {
        case 'xingyin':
            var textVal = existingData ? existingData[1] || '' : '';
            var catVal = existingData ? existingData[2] || '默认' : '默认';
            html =
                '<div class="form-group">' +
                '<label>短句内容（最多50字，不能换行）</label>' +
                '<input type="text" id="formText" maxlength="50" value="' + escapeHtml(textVal) + '" placeholder="请输入短句..." oninput="updateCharCount()">' +
                '<div class="char-count"><span id="charCount">' + textVal.length + '</span>/50</div>' +
                '</div>' +
                '<div class="form-group">' +
                '<label>分类</label>' +
                '<select id="formCategory" data-target="xingyin">' + categoryOptions + '</select>' +
                '</div>' +
                '<div class="hint">短句不能换行，最多50个字符</div>';
            setTimeout(function() {
                var sel = document.getElementById('formCategory');
                if (sel) sel.value = catVal;
            }, 50);
            break;

        case 'shinian':
    var titleVal = existingData ? existingData[1] || '' : '';
    var catVal = existingData ? existingData[3] || '' : '';
    
    // 先构建 HTML
    html =
        '<div class="form-group"><label>标题</label><input type="text" id="formTitle" value="' + escapeHtml(titleVal) + '"></div>' +
        '<div class="form-group"><label>正文内容（支持富文本）</label>' +
        '<div class="rich-editor-toolbar">' +
        '<button type="button" onclick="execRichCmd(\'bold\')"><b>B</b></button>' +
        '<button type="button" onclick="execRichCmd(\'italic\')"><i>I</i></button>' +
        '<button type="button" onclick="execRichCmd(\'underline\')"><u>U</u></button>' +
        '<button type="button" onclick="execRichCmd(\'strikeThrough\')"><s>S</s></button>' +
        '<button type="button" onclick="execRichCmd(\'insertUnorderedList\')">列表</button>' +
        '<button type="button" onclick="execRichCmd(\'insertOrderedList\')">序号</button>' +
        '</div>' +
        '<div id="richEditor" contenteditable="true" style="min-height:200px;border:1px solid #ddd;border-radius:4px;padding:10px;font-size:14px;line-height:1.8;background:#fff;overflow-y:auto;"></div>' +
        '<div class="hint">支持加粗、斜体、下划线、删除线、列表等样式</div>' +
        '</div>' +
        '<div class="form-group"><label>分类</label><select id="formCategory" data-target="shinian">' + categoryOptions + '</select></div>';
    
    body.innerHTML = html;
    modal.classList.add('active');
    
    // 设置分类值
    setTimeout(function() {
        var sel = document.getElementById('formCategory');
        if (sel) sel.value = catVal;
    }, 50);
    
    // ===== 加载文章内容到富文本编辑器 =====
    if (!isNew && id) {
        setTimeout(function() {
            (async function() {
                try {
                    var article = await loadArticleContent(id);
                    console.log('加载文章内容:', id, article ? '成功' : '失败');
                    if (article) {
                        var editor = document.getElementById('richEditor');
                        if (editor) {
                            editor.innerHTML = article;
                        }
                    }
                } catch (e) {
                    console.error('加载文章内容失败:', e);
                }
            })();
        }, 150);
    }
    break;

        case 'xueye':
            var catVal = existingData ? existingData[2] || '' : '';
            var imagesVal = existingData && existingData.length > 3 ? existingData[3] || '' : '';
            html =
                '<div class="form-group"><label>分类</label><select id="formCategory" data-target="xueye">' + categoryOptions + '</select></div>' +
                '<div class="form-group"><label>图片 URL（逗号分隔）</label><textarea id="formImages" rows="3">' + escapeHtml(imagesVal) + '</textarea></div>';
            setTimeout(function() {
                var sel = document.getElementById('formCategory');
                if (sel) sel.value = catVal;
            }, 50);
            break;

        case 'gexidong':
            var contentVal = existingData ? existingData[1] || '' : '';
            html =
                '<div class="form-group"><label>留言内容</label><textarea id="formContent" rows="4">' + escapeHtml(contentVal) + '</textarea></div>';
            break;
    }

    body.innerHTML = html;
    modal.classList.add('active');
    
    // 聚焦到富文本编辑器
    setTimeout(function() {
        var editor = document.getElementById('richEditor');
        if (editor) {
            editor.focus();
        }
    }, 100);
}

// 富文本编辑器命令
function execRichCmd(command) {
    document.execCommand(command, false, null);
    var editor = document.getElementById('richEditor');
    if (editor) {
        editor.focus();
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
    // 清空所有表单内容，防止下次打开时残留
    var modal = document.getElementById('editModal');
    var body = document.getElementById('modalBody');
    if (body) {
        body.innerHTML = '';
    }
    if (modal) {
        modal.classList.remove('active');
    }
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

    // ===== 换行处理 =====
    if (category === 'gexidong' && formData.content) {
        formData.content = formData.content.replace(/\n/g, ' ').replace(/\r/g, ' ');
    }
    if (category === 'xingyin' && formData.text) {
        formData.text = formData.text.replace(/\n/g, ' ').trim();
        if (formData.text.length > 50) {
            showToast('短句不能超过50个字符', 'error');
            return;
        }
    }

    // ===== 自动生成当前日期 =====
    var currentDate = new Date().toISOString().slice(0, 10);
    formData.date = currentDate;

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

    // ===== 保存文章详情（十年灯·文） =====
    if (category === 'shinian' && formData.content) {
        var articleId = isNew ? formData.id : id;
        var articleContent = '---\ndate: ' + formData.date + '\ntitle: ' + formData.title + '\n---\n\n' + formData.content;
        try {
            await writeGitHubFile('articles/' + articleId + '.md', articleContent, '保存文章: ' + formData.title);
        } catch (e) {
            console.error('保存文章详情失败:', e);
            showToast('文章内容保存失败，请重试', 'error');
        }
    }

    if (success) {
        closeModal();
        renderTable(category);
        updateAllStats();
        showToast('保存成功', 'success');
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
    // 获取富文本内容
    var getRich = function() {
        var editor = document.getElementById('richEditor');
        return editor ? editor.innerHTML : '';
    };
    switch (category) {
        case 'xingyin':
            return {
                text: getVal('formText'),
                category: getSel('formCategory') || '默认'
            };
        case 'shinian':
            return {
                title: getVal('formTitle'),
                content: getRich(),
                category: getSel('formCategory') || ''
            };
        case 'xueye':
            return {
                category: getSel('formCategory') || '',
                images: getVal('formImages').split(',').map(function(s) {
                    return s.trim();
                }).filter(function(s) {
                    return s;
                })
            };
        case 'gexidong':
            return {
                content: getVal('formContent')
            };
        default:
            return null;
    }
}

// ============================================================
// 11. 山野渔夫
// ============================================================

async function loadShanye() {
    var text = await loadDataFile('shanye');
    document.getElementById('shanyeContent').value = parseShanye(text);
}

async function saveShanye() {
    var content = document.getElementById('shanyeContent').value;
    await saveDataFile('shanye', content);
    showToast('简介保存成功', 'success');
}

// ============================================================
// 12. 主题设置
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
    showToast('主题设置保存成功', 'success');
}

function previewSettings() {
    var bgImage = document.getElementById('settingBgImage').value;
    var bgColor = document.getElementById('settingBgColor').value;
    var primaryColor = document.getElementById('settingPrimaryColor').value;
    var titleColor = document.getElementById('settingTitleColor').value;
    var subtitle = document.getElementById('settingSubtitle').value;
    var modal = document.getElementById('editModal');
    document.getElementById('modalTitle').textContent = '主题预览';
    document.getElementById('modalBody').innerHTML = '<div style="padding:20px;background:' + bgColor + ';border-radius:8px;' + (bgImage ? 'background-image:url(' + bgImage + ');background-size:cover;' : '') + '"><div style="background:rgba(255,255,255,0.85);padding:40px;border-radius:8px;"><h1 style="color:' + titleColor + ';font-size:28px;font-weight:bold;">南山集</h1><p style="color:' + primaryColor + ';font-size:16px;">' + subtitle + '</p><hr style="border-color:' + primaryColor + ';margin:16px 0;"><p style="color:' + primaryColor + ';font-size:14px;">预览效果</p><div style="display:flex;gap:12px;margin-top:16px;"><span style="background:' + primaryColor + ';color:#fff;padding:4px 16px;border-radius:4px;">按钮</span><span style="border:1px solid ' + primaryColor + ';color:' + primaryColor + ';padding:4px 16px;border-radius:4px;">边框</span></div></div></div>';
    modal.classList.add('active');
    document.querySelector('.modal-footer .btn-primary').onclick = closeModal;
}

// ============================================================
// 13. 同步与部署
// ============================================================

async function syncAll() {
    showToast('正在同步数据...', 'info');
    try {
        await loadCategories('xingyin');
        await loadCategories('shinian');
        await loadCategories('xueye');
        await updateAllStats();
        await renderTable('xingyin');
        await renderTable('shinian');
        await renderTable('xueye');
        await renderTable('gexidong');
        await loadShanye();
        await loadSettings();
        renderCategoryTable('xingyin');
        renderCategoryTable('shinian');
        renderCategoryTable('xueye');
        updateCategorySelect('xingyin');
        updateCategorySelect('shinian');
        updateCategorySelect('xueye');
        showToast('同步完成', 'success');
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
                message: '部署更新',
                tree: latestSha,
                parents: [latestSha]
            })
        });
        showToast('部署已触发，等待 1-3 分钟', 'success');
    } catch (e) {
        showToast('数据已保存，GitHub Pages 将自动部署', 'success');
    }
}

// ============================================================
// 14. Toast
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
// 15. 导航切换
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
                loadCategories('xingyin');
                loadCategories('shinian');
                loadCategories('xueye');
                renderCategoryTable('xingyin');
                renderCategoryTable('shinian');
                renderCategoryTable('xueye');
            } else if (tab === 'comments') {
                renderCommentsPanel();
            } else if (tab === 'dashboard') {
                updateAllStats();
            }
        }
    });
}

// ============================================================
// 16. 评论审核功能
// ============================================================

async function getPendingComments() {
    try {
        var token = getToken();
        if (!token) return [];

        var url = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/issues?labels=comment,pending&state=open&per_page=100';
        var response = await fetch(url, {
            headers: { 'Authorization': 'token ' + token }
        });
        if (!response.ok) return [];
        return await response.json();
    } catch (e) {
        console.error('获取待审核评论失败:', e);
        return [];
    }
}

async function renderCommentsPanel() {
    var issues = await getPendingComments();
    var tbody = document.getElementById('tbody-comments');
    if (!tbody) return;

    if (issues.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6">暂无待审核评论</td></tr>';
        return;
    }

    var html = '';
    for (var i = 0; i < issues.length; i++) {
        var issue = issues[i];
        var body = issue.body || '';
        var pageMatch = body.match(/\[page:(.+?)\]/);
        var pageTitle = pageMatch ? pageMatch[1] : '未知页面';
        var authorMatch = body.match(/评论者：(.+)/);
        var author = authorMatch ? authorMatch[1].trim() : '匿名';
        var contentMatch = body.match(/评论内容：\n([\s\S]*?)$/);
        var content = contentMatch ? contentMatch[1].trim() : body;

        html += '<tr>' +
            '<td>' + issue.number + '</td>' +
            '<td>' + escapeHtml(pageTitle) + '</td>' +
            '<td>' + escapeHtml(author) + '</td>' +
            '<td title="' + escapeHtml(content) + '">' + escapeHtml(content.slice(0, 50)) + (content.length > 50 ? '...' : '') + '</td>' +
            '<td>' + new Date(issue.created_at).toLocaleString() + '</td>' +
            '<td>' +
            '<button onclick="approveComment(' + issue.number + ')" class="btn btn-success btn-sm">通过</button> ' +
            '<button onclick="rejectComment(' + issue.number + ')" class="btn btn-danger btn-sm">拒绝</button> ' +
            '<button onclick="replyComment(' + issue.number + ')" class="btn btn-primary btn-sm">回复</button>' +
            '</td>' +
            '</tr>';
    }
    tbody.innerHTML = html;
}

async function approveComment(issueNumber) {
    if (!confirm('确定通过这条评论吗？')) return;

    try {
        var token = getToken();
        var url = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/issues/' + issueNumber;

        await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': 'token ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                labels: ['comment', 'approved'],
                state: 'closed'
            })
        });

        showToast('评论已通过审核', 'success');
        renderCommentsPanel();
    } catch (e) {
        showToast('操作失败: ' + e.message, 'error');
    }
}

async function rejectComment(issueNumber) {
    if (!confirm('确定拒绝这条评论吗？')) return;

    try {
        var token = getToken();
        var url = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/issues/' + issueNumber;

        await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': 'token ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                labels: ['comment', 'rejected'],
                state: 'closed'
            })
        });

        showToast('评论已拒绝', 'success');
        renderCommentsPanel();
    } catch (e) {
        showToast('操作失败: ' + e.message, 'error');
    }
}

async function replyComment(issueNumber) {
    var replyContent = prompt('请输入回复内容：');
    if (!replyContent || replyContent.trim() === '') return;

    try {
        var token = getToken();
        var url = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/issues/' + issueNumber + '/comments';

        await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'token ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                body: '📝 **管理员回复：**\n\n' + replyContent.trim()
            })
        });

        showToast('回复已发送', 'success');
        renderCommentsPanel();
    } catch (e) {
        showToast('回复失败: ' + e.message, 'error');
    }
}

function refreshComments() {
    renderCommentsPanel();
    showToast('已刷新', 'info');
}

// ============================================================
// 17. 默认数据
// ============================================================

var DEFAULT_DATA = {
    'xingyin': 'xy-001 | 欢迎使用南山集 | 默认 | ' + new Date().toISOString().slice(0, 10) + '\nxy-002 | 在这里管理你的短句 | 默认 | ' + new Date().toISOString().slice(0, 10),
    'shinian': 'sn-001 | 第一篇文章 | 这是文章正文内容 | 默认 | ' + new Date().toISOString().slice(0, 10) + ' | false',
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
    'categories_xingyin': '默认\n人生感悟\n生活',
    'categories_shinian': '默认\n文学\n随笔\n诗词',
    'categories_xueye': '默认\n风景\n人物\n纪实'
};

var DEFAULT_ARTICLE = '---\ndate: ' + new Date().toISOString().slice(0, 10) + '\ntitle: 第一篇文章\n---\n\n这是文章正文内容，你可以在这里写任何内容。';

async function initData() {
    var files = ['xingyin', 'shinian', 'xueye', 'gexidong', 'shanye', 'settings', 'categories_xingyin', 'categories_shinian', 'categories_xueye'];
    var hasData = false;
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var text = await loadDataFile(file);
        if (text && text.trim()) {
            hasData = true;
            break;
        }
    }
    if (!hasData) {
        showToast('首次运行，正在创建默认数据...', 'info');
        for (var j = 0; j < files.length; j++) {
            var key = files[j];
            var content = DEFAULT_DATA[key] || '';
            if (content) {
                await saveDataFile(key, content);
            }
        }
        try {
            await writeGitHubFile('articles/sn-001.md', DEFAULT_ARTICLE, '创建默认文章');
        } catch (e) {}
        showToast('默认数据创建完成', 'success');
    }

    await loadCategories('xingyin');
    await loadCategories('shinian');
    await loadCategories('xueye');

    await updateAllStats();
    await renderTable('xingyin');
    await renderTable('shinian');
    await renderTable('xueye');
    await renderTable('gexidong');
    await loadShanye();
    await loadSettings();
    renderCategoryTable('xingyin');
    renderCategoryTable('shinian');
    renderCategoryTable('xueye');
    updateCategorySelect('xingyin');
    updateCategorySelect('shinian');
    updateCategorySelect('xueye');
}

// ============================================================
// 18. 启动
// ============================================================

var savedToken = localStorage.getItem('github_token');
if (savedToken) {
    githubToken = savedToken;
    updateConnectionStatus(true);
} else {
    updateConnectionStatus(false);
}

initData();

console.log('南山集后台管理已启动（完整修复版）');
console.log('请确保已配置 GitHub Token');
