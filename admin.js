// admin.js
// ============================================================
// 登录验证逻辑
// ============================================================
async function handleLogin() {
    var email = document.getElementById('login-username').value.trim();
    var password = document.getElementById('login-password').value.trim();
    var errorEl = document.getElementById('loginError');
    var btn = document.getElementById('btnLogin');

    if (!email || !password) {
        errorEl.textContent = '请输入邮箱和密码';
        errorEl.className = 'error show';
        return;
    }

    if (btn) { btn.disabled = true; btn.textContent = '登录中...'; }
    try {
        await AUTH.signIn(email, password);
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('adminWrapper').className = 'admin-wrapper show';
        errorEl.className = 'error';
        await initAdmin();
    } catch (err) {
        errorEl.textContent = err.message || '邮箱或密码错误';
        errorEl.className = 'error show';
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '登 录'; }
    }
}

async function handleLogout() {
    if (confirm('确定要退出登录吗？')) {
        await AUTH.signOut();
        document.getElementById('adminWrapper').className = 'admin-wrapper';
        document.getElementById('loginContainer').style.display = 'block';
        document.getElementById('login-password').value = '';
        var errorEl = document.getElementById('loginError');
        errorEl.className = 'error';
    }
}

async function checkLogin() {
    var ok = await AUTH.isLoggedIn();
    if (ok) {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('adminWrapper').className = 'admin-wrapper show';
        await initAdmin();
    }
}

document.getElementById('login-password').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') handleLogin();
});
document.getElementById('login-username').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') handleLogin();
});

// ============================================================
// 工具函数
// ============================================================
function genId() { return Date.now() + Math.random() * 1000; }

// ============================================================
// 记录更新字数
// ============================================================
async function recordUpdate(wordCount) {
    if (!wordCount || wordCount <= 0) return;
    var today = new Date().toISOString().slice(0, 10);
    try {
        var list = await DB.getAll('update_records');
        var existing = null;
        for (var i = 0; i < list.length; i++) {
            if (list[i].date === today) { existing = list[i]; break; }
        }
        if (existing) {
            await DB.update('update_records', existing.id, {
                word_count: (existing.word_count || 0) + wordCount
            });
        } else {
            await DB.insert('update_records', { date: today, word_count: wordCount });
        }
    } catch (e) {
        console.error('❌ 记录更新失败:', e);
    }
}

// ============================================================
// 分类管理 - 杂记
// ============================================================
var _shinianCategoriesCache = [];

async function getShinianCategories() {
    _shinianCategoriesCache = await DB.getAll('shinian_categories', { orderBy: 'id' });
    return _shinianCategoriesCache;
}

async function renderShinianCategories() {
    var list = await getShinianCategories();
    var tbody = document.getElementById('shinian-category-list');
    if (!tbody) return;
    var html = '';
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        html += '<tr>';
        html += '<td><strong>' + item.name + '</strong></td>';
        html += '<td>' + (item.description || '') + '</td>';
        html += '<td class="actions">';
        html += '<button class="btn" onclick="openShinianCategoryEdit(' + item.id + ')">编辑</button>';
        html += '<button class="btn btn-danger" onclick="deleteShinianCategory(' + item.id + ')">删除</button>';
        html += '</td>';
        html += '</tr>';
    }
    tbody.innerHTML = html || '';
    updateShinianCategorySelect();
}

function updateShinianCategorySelect() {
    var list = _shinianCategoriesCache;
    var select = document.getElementById('shinian-category-select');
    if (!select) return;
    var html = '';
    for (var i = 0; i < list.length; i++) {
        html += '<option value="' + list[i].name + '">' + list[i].name + '</option>';
    }
    select.innerHTML = html;
}

// ============================================================
// Tab 切换
// ============================================================
function switchShinianTab(tabId) {
    document.querySelectorAll('#panel-shinian .tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabId) btn.classList.add('active');
    });
    document.querySelectorAll('#panel-shinian .tab-content').forEach(function(content) {
        content.classList.remove('active');
        if (content.id === tabId) content.classList.add('active');
    });
}

// ============================================================
// 随笔 (CRUD)
// ============================================================
async function renderXingyin() {
    var list = await DB.getAll('xingyin', { orderBy: 'id' });
    var tbody = document.getElementById('xingyin-list');
    if (!tbody) return;
    var html = '';
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        html += '<tr>';
        html += '<td>' + (i + 1) + '</td>';
        html += '<td>' + item.content + '</td>';
        html += '<td>' + item.date + '</td>';
        html += '<td class="actions">';
        html += '<button class="btn" onclick="openXingyinEdit(' + item.id + ')">编辑</button>';
        html += '<button class="btn btn-danger" onclick="deleteXingyin(' + item.id + ')">删除</button>';
        html += '</td>';
        html += '</tr>';
    }
    tbody.innerHTML = html;
}

function openXingyinForm() {
    document.getElementById('xingyinModal').classList.add('show');
    document.getElementById('xingyinModalTitle').textContent = '新增短句';
    document.getElementById('xingyin-edit-id').value = '';
    document.getElementById('xingyin-content').value = '';
    document.getElementById('xingyin-date').value = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
}

function openXingyinEdit(id) {
    DB.getById('xingyin', id).then(function(item) {
        if (!item) return;
        document.getElementById('xingyinModal').classList.add('show');
        document.getElementById('xingyinModalTitle').textContent = '编辑短句';
        document.getElementById('xingyin-edit-id').value = id;
        document.getElementById('xingyin-content').value = item.content;
        document.getElementById('xingyin-date').value = item.date;
    });
}

function closeXingyinForm() {
    document.getElementById('xingyinModal').classList.remove('show');
}

async function saveXingyin() {
    var id = document.getElementById('xingyin-edit-id').value;
    var content = document.getElementById('xingyin-content').value.trim();
    var date = document.getElementById('xingyin-date').value.trim();
    if (!content) { alert('请输入内容'); return; }
    if (id) {
        await DB.update('xingyin', id, { content: content, date: date });
    } else {
        await DB.insert('xingyin', { content: content, date: date });
    }
    await recordUpdate(content.length);
    closeXingyinForm();
    await renderXingyin();
    await refreshDashboard();
}

async function deleteXingyin(id) {
    if (!confirm('确定删除？')) return;
    await DB.delete('xingyin', id);
    await renderXingyin();
    await refreshDashboard();
}

// ============================================================
// 杂记 文章 (CRUD)
// ============================================================
async function renderShinian() {
    var list = await DB.getAll('shinian', { orderBy: 'id' });
    var tbody = document.getElementById('shinian-list');
    if (!tbody) return;
    var html = '';
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        html += '<tr>';
        html += '<td>' + (i + 1) + '</td>';
        html += '<td><strong>' + item.title + '</strong></td>';
        html += '<td>' + item.category + '</td>';
        html += '<td>' + item.date + '</td>';
        html += '<td class="actions">';
        html += '<button class="btn" onclick="openShinianArticleEdit(' + item.id + ')">编辑</button>';
        html += '<button class="btn btn-danger" onclick="deleteShinianArticle(' + item.id + ')">删除</button>';
        html += '</td>';
        html += '</tr>';
    }
    tbody.innerHTML = html;
}

function openShinianArticleForm() {
    document.getElementById('shinianArticleModal').classList.add('show');
    document.getElementById('shinianArticleModalTitle').textContent = '新增文章';
    document.getElementById('shinian-edit-id').value = '';
    document.getElementById('shinian-title').value = '';
    document.getElementById('shinian-category-select').value = '';
    document.getElementById('shinian-content').value = '';
    document.getElementById('shinian-date').value = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
    updateShinianCategorySelect();
}

function openShinianArticleEdit(id) {
    DB.getById('shinian', id).then(function(item) {
        if (!item) return;
        document.getElementById('shinianArticleModal').classList.add('show');
        document.getElementById('shinianArticleModalTitle').textContent = '编辑文章';
        document.getElementById('shinian-edit-id').value = id;
        document.getElementById('shinian-title').value = item.title;
        updateShinianCategorySelect();
        document.getElementById('shinian-category-select').value = item.category || '';
        document.getElementById('shinian-content').value = item.content || '';
        document.getElementById('shinian-date').value = item.date;
    });
}

function closeShinianArticleForm() {
    document.getElementById('shinianArticleModal').classList.remove('show');
}

async function saveShinianArticle() {
    var id = document.getElementById('shinian-edit-id').value;
    var title = document.getElementById('shinian-title').value.trim();
    var category = document.getElementById('shinian-category-select').value;
    var content = document.getElementById('shinian-content').value.trim();
    var date = document.getElementById('shinian-date').value.trim();
    if (!title) { alert('请输入标题'); return; }
    if (!category) { alert('请选择分类'); return; }

    var data = { title: title, category: category, content: content, date: date };

    if (id) {
        await DB.update('shinian', id, data);
    } else {
        await DB.insert('shinian', data);
    }
    await recordUpdate(content.length);
    closeShinianArticleForm();
    await renderShinian();
    await refreshDashboard();
}

async function deleteShinianArticle(id) {
    if (!confirm('确定删除？')) return;
    await DB.delete('shinian', id);
    await renderShinian();
    await refreshDashboard();
}

// ============================================================
// 杂记 分类管理
// ============================================================
function openShinianCategoryForm() {
    document.getElementById('shinianCategoryModal').classList.add('show');
    document.getElementById('shinianCategoryModalTitle').textContent = '添加分类';
    document.getElementById('shinian-category-edit-id').value = '';
    document.getElementById('shinian-category-name').value = '';
    document.getElementById('shinian-category-desc-input').value = '';
}

function openShinianCategoryEdit(id) {
    var item = _shinianCategoriesCache.find(c => c.id === id);
    if (!item) return;
    document.getElementById('shinianCategoryModal').classList.add('show');
    document.getElementById('shinianCategoryModalTitle').textContent = '编辑分类';
    document.getElementById('shinian-category-edit-id').value = id;
    document.getElementById('shinian-category-name').value = item.name;
    document.getElementById('shinian-category-desc-input').value = item.description || '';
}

function closeShinianCategoryForm() {
    document.getElementById('shinianCategoryModal').classList.remove('show');
}

async function saveShinianCategory() {
    var id = document.getElementById('shinian-category-edit-id').value;
    var name = document.getElementById('shinian-category-name').value.trim();
    var desc = document.getElementById('shinian-category-desc-input').value.trim();
    if (!name) { alert('请输入分类名称'); return; }

    if (!id) {
        if (_shinianCategoriesCache.find(c => c.name === name)) { alert('分类已存在'); return; }
        await DB.insert('shinian_categories', { name: name, description: desc });
    } else {
        await DB.update('shinian_categories', id, { name: name, description: desc });
    }
    closeShinianCategoryForm();
    await renderShinianCategories();
    await renderShinian();
}

async function deleteShinianCategory(id) {
    if (!confirm('确定删除该分类吗？')) return;
    await DB.delete('shinian_categories', id);
    await renderShinianCategories();
    await renderShinian();
}

// ============================================================
// 闲话 (About)
// ============================================================
async function loadAbout() {
    var list = await DB.getAll('about');
    var content = list.length > 0 ? list[0].content : '';
    document.getElementById('about-content').value = content;
}

async function saveAbout() {
    var content = document.getElementById('about-content').value;
    var list = await DB.getAll('about');
    if (list.length > 0) {
        await DB.update('about', list[0].id, { content: content });
    } else {
        await DB.insert('about', { content: content });
    }
    await recordUpdate(content.length);
    alert('简介已保存！');
}

// ============================================================
// 总览数据刷新
// ============================================================
async function refreshDashboard() {
    var xingyin = await DB.getAll('xingyin');
    var shinian = await DB.getAll('shinian');
    document.getElementById('count-xingyin').textContent = xingyin.length;
    document.getElementById('count-shinian').textContent = shinian.length;
}

// ============================================================
// 面板切换
// ============================================================
document.querySelectorAll('.admin-sidebar nav a').forEach(function(link) {
    link.addEventListener('click', async function(e) {
        e.preventDefault();
        document.querySelectorAll('.admin-sidebar nav a').forEach(function(a) { a.classList.remove('active'); });
        this.classList.add('active');
        var panelId = this.dataset.panel;
        document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
        var target = document.getElementById(panelId);
        if (target) target.classList.add('active');
        document.getElementById('panelTitle').textContent = this.textContent.trim();
        if (panelId === 'panel-dashboard') await refreshDashboard();
        if (panelId === 'panel-xingyin') await renderXingyin();
        if (panelId === 'panel-shinian') { await renderShinian(); await renderShinianCategories(); }
        if (panelId === 'panel-about') await loadAbout();
    });
});

// ============================================================
// 初始化
// ============================================================
async function initAdmin() {
    var emailEl = document.getElementById('currentUserEmail');
    if (emailEl) emailEl.textContent = AUTH.getUserEmail() || '管理员';
    await refreshDashboard();
    await renderXingyin();
    await renderShinian();
    await renderShinianCategories();
    await loadAbout();
}

checkLogin();