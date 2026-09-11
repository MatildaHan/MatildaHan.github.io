// admin.js —— 须臾之间 后台逻辑

// ============================================================
// 登录
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
        document.getElementById('loginError').className = 'error';
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
// 记录更新字数
// ============================================================
async function recordUpdate(wordCount) {
    if (!wordCount || wordCount <= 0) return;
    var today = new Date().toISOString().slice(0, 10);
    try {
        var list = await DB.getAll('update_logs');
        var existing = null;
        for (var i = 0; i < list.length; i++) {
            if (list[i].date === today) { existing = list[i]; break; }
        }
        if (existing) {
            await DB.update('update_logs', existing.id, {
                word_count: (existing.word_count || 0) + wordCount
            });
        } else {
            await DB.insert('update_logs', { date: today, word_count: wordCount });
        }
    } catch (e) {
        console.error('记录更新失败:', e);
    }
}

// ============================================================
// 杂记分类
// ============================================================
var _zajiCategoriesCache = [];

async function getZajiCategories() {
    _zajiCategoriesCache = await DB.getAll('zaji_categories', { orderBy: 'id' });
    return _zajiCategoriesCache;
}

async function renderZajiCategories() {
    var list = await getZajiCategories();
    var tbody = document.getElementById('zaji-category-list');
    if (!tbody) return;
    var html = '';
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        html += '<tr>';
        html += '<td><strong>' + item.name + '</strong></td>';
        html += '<td>' + (item.description || '') + '</td>';
        html += '<td class="actions">';
        html += '<button class="btn" onclick="openZajiCategoryEdit(' + item.id + ')">编辑</button>';
        html += '<button class="btn btn-danger" onclick="deleteZajiCategory(' + item.id + ')">删除</button>';
        html += '</td>';
        html += '</tr>';
    }
    tbody.innerHTML = html || '';
    updateZajiCategorySelect();
}

function updateZajiCategorySelect() {
    var list = _zajiCategoriesCache;
    var select = document.getElementById('zaji-category-select');
    if (!select) return;
    var html = '';
    for (var i = 0; i < list.length; i++) {
        html += '<option value="' + list[i].name + '">' + list[i].name + '</option>';
    }
    select.innerHTML = html;
}

function switchZajiTab(tabId) {
    document.querySelectorAll('#panel-zaji .tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabId) btn.classList.add('active');
    });
    document.querySelectorAll('#panel-zaji .tab-content').forEach(function(content) {
        content.classList.remove('active');
        if (content.id === tabId) content.classList.add('active');
    });
}

// ============================================================
// 随笔 CRUD
// ============================================================
async function renderSuibi() {
    var list = await DB.getAll('suibi', { orderBy: 'id' });
    var tbody = document.getElementById('suibi-list');
    if (!tbody) return;
    var html = '';
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        html += '<tr>';
        html += '<td>' + (i + 1) + '</td>';
        html += '<td>' + item.content + '</td>';
        html += '<td>' + item.date + '</td>';
        html += '<td class="actions">';
        html += '<button class="btn" onclick="openSuibiEdit(' + item.id + ')">编辑</button>';
        html += '<button class="btn btn-danger" onclick="deleteSuibi(' + item.id + ')">删除</button>';
        html += '</td>';
        html += '</tr>';
    }
    tbody.innerHTML = html;
}

function openSuibiForm() {
    document.getElementById('suibiModal').classList.add('show');
    document.getElementById('suibiModalTitle').textContent = '新增短句';
    document.getElementById('suibi-edit-id').value = '';
    document.getElementById('suibi-content').value = '';
    document.getElementById('suibi-date').value = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
}

function openSuibiEdit(id) {
    DB.getById('suibi', id).then(function(item) {
        if (!item) return;
        document.getElementById('suibiModal').classList.add('show');
        document.getElementById('suibiModalTitle').textContent = '编辑短句';
        document.getElementById('suibi-edit-id').value = id;
        document.getElementById('suibi-content').value = item.content;
        document.getElementById('suibi-date').value = item.date;
    });
}

function closeSuibiForm() {
    document.getElementById('suibiModal').classList.remove('show');
}

async function saveSuibi() {
    var id = document.getElementById('suibi-edit-id').value;
    var content = document.getElementById('suibi-content').value.trim();
    var date = document.getElementById('suibi-date').value.trim();
    if (!content) { alert('请输入内容'); return; }
    if (id) {
        await DB.update('suibi', id, { content: content, date: date });
    } else {
        await DB.insert('suibi', { content: content, date: date });
    }
    await recordUpdate(content.length);
    closeSuibiForm();
    await renderSuibi();
    await refreshDashboard();
}

async function deleteSuibi(id) {
    if (!confirm('确定删除？')) return;
    await DB.delete('suibi', id);
    await renderSuibi();
    await refreshDashboard();
}

// ============================================================
// 杂记文章 CRUD
// ============================================================
async function renderZaji() {
    var list = await DB.getAll('zaji', { orderBy: 'id' });
    var tbody = document.getElementById('zaji-list');
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
        html += '<button class="btn" onclick="openZajiArticleEdit(' + item.id + ')">编辑</button>';
        html += '<button class="btn btn-danger" onclick="deleteZajiArticle(' + item.id + ')">删除</button>';
        html += '</td>';
        html += '</tr>';
    }
    tbody.innerHTML = html;
}

function openZajiArticleForm() {
    document.getElementById('zajiArticleModal').classList.add('show');
    document.getElementById('zajiArticleModalTitle').textContent = '新增文章';
    document.getElementById('zaji-edit-id').value = '';
    document.getElementById('zaji-title').value = '';
    document.getElementById('zaji-category-select').value = '';
    document.getElementById('zaji-content').value = '';
    document.getElementById('zaji-date').value = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
    updateZajiCategorySelect();
}

function openZajiArticleEdit(id) {
    DB.getById('zaji', id).then(function(item) {
        if (!item) return;
        document.getElementById('zajiArticleModal').classList.add('show');
        document.getElementById('zajiArticleModalTitle').textContent = '编辑文章';
        document.getElementById('zaji-edit-id').value = id;
        document.getElementById('zaji-title').value = item.title;
        updateZajiCategorySelect();
        document.getElementById('zaji-category-select').value = item.category || '';
        document.getElementById('zaji-content').value = item.content || '';
        document.getElementById('zaji-date').value = item.date;
    });
}

function closeZajiArticleForm() {
    document.getElementById('zajiArticleModal').classList.remove('show');
}

async function saveZajiArticle() {
    var id = document.getElementById('zaji-edit-id').value;
    var title = document.getElementById('zaji-title').value.trim();
    var category = document.getElementById('zaji-category-select').value;
    var content = document.getElementById('zaji-content').value.trim();
    var date = document.getElementById('zaji-date').value.trim();
    if (!title) { alert('请输入标题'); return; }
    if (!category) { alert('请选择分类'); return; }

    var data = { title: title, category: category, content: content, date: date };

    if (id) {
        await DB.update('zaji', id, data);
    } else {
        await DB.insert('zaji', data);
    }
    await recordUpdate(content.length);
    closeZajiArticleForm();
    await renderZaji();
    await refreshDashboard();
}

async function deleteZajiArticle(id) {
    if (!confirm('确定删除？')) return;
    await DB.delete('zaji', id);
    await renderZaji();
    await refreshDashboard();
}

// ============================================================
// 杂记分类 CRUD
// ============================================================
function openZajiCategoryForm() {
    document.getElementById('zajiCategoryModal').classList.add('show');
    document.getElementById('zajiCategoryModalTitle').textContent = '添加分类';
    document.getElementById('zaji-category-edit-id').value = '';
    document.getElementById('zaji-category-name').value = '';
    document.getElementById('zaji-category-desc-input').value = '';
}

function openZajiCategoryEdit(id) {
    var item = _zajiCategoriesCache.find(c => c.id === id);
    if (!item) return;
    document.getElementById('zajiCategoryModal').classList.add('show');
    document.getElementById('zajiCategoryModalTitle').textContent = '编辑分类';
    document.getElementById('zaji-category-edit-id').value = id;
    document.getElementById('zaji-category-name').value = item.name;
    document.getElementById('zaji-category-desc-input').value = item.description || '';
}

function closeZajiCategoryForm() {
    document.getElementById('zajiCategoryModal').classList.remove('show');
}

async function saveZajiCategory() {
    var id = document.getElementById('zaji-category-edit-id').value;
    var name = document.getElementById('zaji-category-name').value.trim();
    var desc = document.getElementById('zaji-category-desc-input').value.trim();
    if (!name) { alert('请输入分类名称'); return; }

    if (!id) {
        if (_zajiCategoriesCache.find(c => c.name === name)) { alert('分类已存在'); return; }
        await DB.insert('zaji_categories', { name: name, description: desc });
    } else {
        await DB.update('zaji_categories', id, { name: name, description: desc });
    }
    closeZajiCategoryForm();
    await renderZajiCategories();
    await renderZaji();
}

async function deleteZajiCategory(id) {
    if (!confirm('确定删除该分类吗？')) return;
    await DB.delete('zaji_categories', id);
    await renderZajiCategories();
    await renderZaji();
}

// ============================================================
// 闲话
// ============================================================
async function loadXianhua() {
    var list = await DB.getAll('xianhua');
    var content = list.length > 0 ? list[0].content : '';
    document.getElementById('xianhua-content').value = content;
}

async function saveXianhua() {
    var content = document.getElementById('xianhua-content').value;
    var list = await DB.getAll('xianhua');
    if (list.length > 0) {
        await DB.update('xianhua', list[0].id, { content: content });
    } else {
        await DB.insert('xianhua', { content: content });
    }
    await recordUpdate(content.length);
    alert('简介已保存！');
}

// ============================================================
// 总览
// ============================================================
async function refreshDashboard() {
    var suibi = await DB.getAll('suibi');
    var zaji = await DB.getAll('zaji');
    document.getElementById('count-suibi').textContent = suibi.length;
    document.getElementById('count-zaji').textContent = zaji.length;
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
        if (panelId === 'panel-suibi') await renderSuibi();
        if (panelId === 'panel-zaji') { await renderZaji(); await renderZajiCategories(); }
        if (panelId === 'panel-xianhua') await loadXianhua();
    });
});

// ============================================================
// 初始化
// ============================================================
async function initAdmin() {
    var emailEl = document.getElementById('currentUserEmail');
    if (emailEl) emailEl.textContent = AUTH.getUserEmail() || '管理员';
    await refreshDashboard();
    await renderSuibi();
    await renderZaji();
    await renderZajiCategories();
    await loadXianhua();
}

checkLogin();
