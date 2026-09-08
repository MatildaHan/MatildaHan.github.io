// ============================================================
// 工具：生成 ID
// ============================================================
function genId() { return Date.now() + Math.random() * 1000; }

// ============================================================
// 行吟册·絮 (CRUD)
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
        html += '<button class="btn" onclick="editXingyin(' + item.id + ')">编辑</button>';
        html += '<button class="btn btn-danger" onclick="deleteXingyin(' + item.id + ')">删除</button>';
        html += '</td>';
        html += '</tr>';
    }
    tbody.innerHTML = html;
}

function openXingyinForm() {
    document.getElementById('xingyin-form').style.display = 'block';
    document.getElementById('xingyin-edit-id').value = '';
    document.getElementById('xingyin-content').value = '';
    document.getElementById('xingyin-date').value = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
}

function closeXingyinForm() {
    document.getElementById('xingyin-form').style.display = 'none';
}

async function editXingyin(id) {
    var item = await DB.getById('xingyin', id);
    if (!item) return;
    document.getElementById('xingyin-form').style.display = 'block';
    document.getElementById('xingyin-edit-id').value = id;
    document.getElementById('xingyin-content').value = item.content;
    document.getElementById('xingyin-date').value = item.date;
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
// 十年灯·文 (CRUD)
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
        html += '<td>' + item.category + (item.category_desc ? ' (' + item.category_desc + ')' : '') + '</td>';
        html += '<td>' + item.date + '</td>';
        html += '<td class="actions">';
        html += '<button class="btn" onclick="editShinian(' + item.id + ')">编辑</button>';
        html += '<button class="btn btn-danger" onclick="deleteShinian(' + item.id + ')">删除</button>';
        html += '</td>';
        html += '</tr>';
    }
    tbody.innerHTML = html;
}

function openShinianForm() {
    document.getElementById('shinian-form').style.display = 'block';
    document.getElementById('shinian-edit-id').value = '';
    document.getElementById('shinian-title').value = '';
    document.getElementById('shinian-category').value = '闲聊几句';
    document.getElementById('shinian-category-desc').value = '';
    document.getElementById('shinian-content').value = '';
    document.getElementById('shinian-date').value = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
}

function closeShinianForm() {
    document.getElementById('shinian-form').style.display = 'none';
}

async function editShinian(id) {
    var item = await DB.getById('shinian', id);
    if (!item) return;
    document.getElementById('shinian-form').style.display = 'block';
    document.getElementById('shinian-edit-id').value = id;
    document.getElementById('shinian-title').value = item.title;
    document.getElementById('shinian-category').value = item.category || '闲聊几句';
    document.getElementById('shinian-category-desc').value = item.category_desc || '';
    document.getElementById('shinian-content').value = item.content || '';
    document.getElementById('shinian-date').value = item.date;
}

async function saveShinian() {
    var id = document.getElementById('shinian-edit-id').value;
    var title = document.getElementById('shinian-title').value.trim();
    var category = document.getElementById('shinian-category').value;
    var categoryDesc = document.getElementById('shinian-category-desc').value.trim();
    var content = document.getElementById('shinian-content').value.trim();
    var date = document.getElementById('shinian-date').value.trim();
    if (!title) { alert('请输入标题'); return; }

    var data = { title: title, category: category, category_desc: categoryDesc, content: content, date: date };

    if (id) {
        await DB.update('shinian', id, data);
    } else {
        await DB.insert('shinian', data);
    }
    closeShinianForm();
    await renderShinian();
    await refreshDashboard();
}

async function deleteShinian(id) {
    if (!confirm('确定删除？')) return;
    await DB.delete('shinian', id);
    await renderShinian();
    await refreshDashboard();
}

// ============================================================
// 雪夜舟·图 (CRUD)
// ============================================================
async function renderXueye() {
    var list = await DB.getAll('xueye', { orderBy: 'id' });
    var tbody = document.getElementById('xueye-list');
    if (!tbody) return;
    var html = '';
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        html += '<tr>';
        html += '<td>' + (i + 1) + '</td>';
        html += '<td><strong>' + item.category + '</strong></td>';
        html += '<td>' + (item.category_desc || '-') + '</td>';
        html += '<td><span class="img-preview"></span> ×' + (item.count || 6) + '</td>';
        html += '<td>' + item.date + '</td>';
        html += '<td class="actions">';
        html += '<button class="btn" onclick="editXueye(' + item.id + ')">编辑</button>';
        html += '<button class="btn btn-danger" onclick="deleteXueye(' + item.id + ')">删除</button>';
        html += '</td>';
        html += '</tr>';
    }
    tbody.innerHTML = html;
}

function openXueyeForm() {
    document.getElementById('xueye-form').style.display = 'block';
    document.getElementById('xueye-edit-id').value = '';
    document.getElementById('xueye-category').value = '';
    document.getElementById('xueye-category-desc').value = '';
    document.getElementById('xueye-count').value = 6;
    document.getElementById('xueye-date').value = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
}

function closeXueyeForm() {
    document.getElementById('xueye-form').style.display = 'none';
}

async function editXueye(id) {
    var item = await DB.getById('xueye', id);
    if (!item) return;
    document.getElementById('xueye-form').style.display = 'block';
    document.getElementById('xueye-edit-id').value = id;
    document.getElementById('xueye-category').value = item.category;
    document.getElementById('xueye-category-desc').value = item.category_desc || '';
    document.getElementById('xueye-count').value = item.count || 6;
    document.getElementById('xueye-date').value = item.date;
}

async function saveXueye() {
    var id = document.getElementById('xueye-edit-id').value;
    var category = document.getElementById('xueye-category').value.trim();
    var categoryDesc = document.getElementById('xueye-category-desc').value.trim();
    var count = parseInt(document.getElementById('xueye-count').value) || 6;
    var date = document.getElementById('xueye-date').value.trim();
    if (!category) { alert('请输入分类名称'); return; }

    var data = { category: category, category_desc: categoryDesc, count: count, date: date };

    if (id) {
        await DB.update('xueye', id, data);
    } else {
        await DB.insert('xueye', data);
    }
    closeXueyeForm();
    await renderXueye();
    await refreshDashboard();
}

async function deleteXueye(id) {
    if (!confirm('确定删除？')) return;
    await DB.delete('xueye', id);
    await renderXueye();
    await refreshDashboard();
}

// ============================================================
// 听雨眠·记 (CRUD)
// ============================================================
async function renderTingyu() {
    var list = await DB.getAll('tingyu', { orderBy: 'id' });
    var tbody = document.getElementById('tingyu-list');
    if (!tbody) return;
    var html = '';
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        html += '<tr>';
        html += '<td>' + (i + 1) + '</td>';
        html += '<td>' + item.title + '</td>';
        html += '<td>' + item.year + '</td>';
        html += '<td class="actions">';
        html += '<button class="btn" onclick="editTingyu(' + item.id + ')">编辑</button>';
        html += '<button class="btn btn-danger" onclick="deleteTingyu(' + item.id + ')">删除</button>';
        html += '</td>';
        html += '</tr>';
    }
    tbody.innerHTML = html;
}

function openTingyuForm() {
    document.getElementById('tingyu-form').style.display = 'block';
    document.getElementById('tingyu-edit-id').value = '';
    document.getElementById('tingyu-title').value = '';
    document.getElementById('tingyu-year').value = new Date().getFullYear();
}

function closeTingyuForm() {
    document.getElementById('tingyu-form').style.display = 'none';
}

async function editTingyu(id) {
    var item = await DB.getById('tingyu', id);
    if (!item) return;
    document.getElementById('tingyu-form').style.display = 'block';
    document.getElementById('tingyu-edit-id').value = id;
    document.getElementById('tingyu-title').value = item.title;
    document.getElementById('tingyu-year').value = item.year;
}

async function saveTingyu() {
    var id = document.getElementById('tingyu-edit-id').value;
    var title = document.getElementById('tingyu-title').value.trim();
    var year = document.getElementById('tingyu-year').value.trim();
    if (!title) { alert('请输入书名'); return; }
    if (!year) { alert('请输入年份'); return; }

    var data = { title: title, year: year };

    if (id) {
        await DB.update('tingyu', id, data);
    } else {
        await DB.insert('tingyu', data);
    }
    closeTingyuForm();
    await renderTingyu();
    await refreshDashboard();
}

async function deleteTingyu(id) {
    if (!confirm('确定删除？')) return;
    await DB.delete('tingyu', id);
    await renderTingyu();
    await refreshDashboard();
}

// ============================================================
// 各西东·语 (CRUD)
// ============================================================
async function renderGexi() {
    var list = await DB.getAll('gexi', { orderBy: 'id' });
    var tbody = document.getElementById('gexi-list');
    if (!tbody) return;
    var html = '';
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        html += '<tr>';
        html += '<td>' + (i + 1) + '</td>';
        html += '<td>' + item.content + '</td>';
        html += '<td>' + item.date + '</td>';
        html += '<td class="actions">';
        html += '<button class="btn" onclick="editGexi(' + item.id + ')">编辑</button>';
        html += '<button class="btn btn-danger" onclick="deleteGexi(' + item.id + ')">删除</button>';
        html += '</td>';
        html += '</tr>';
    }
    tbody.innerHTML = html;
}

function openGexiForm() {
    document.getElementById('gexi-form').style.display = 'block';
    document.getElementById('gexi-edit-id').value = '';
    document.getElementById('gexi-content').value = '';
    document.getElementById('gexi-date').value = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
}

function closeGexiForm() {
    document.getElementById('gexi-form').style.display = 'none';
}

async function editGexi(id) {
    var item = await DB.getById('gexi', id);
    if (!item) return;
    document.getElementById('gexi-form').style.display = 'block';
    document.getElementById('gexi-edit-id').value = id;
    document.getElementById('gexi-content').value = item.content;
    document.getElementById('gexi-date').value = item.date;
}

async function saveGexi() {
    var id = document.getElementById('gexi-edit-id').value;
    var content = document.getElementById('gexi-content').value.trim();
    var date = document.getElementById('gexi-date').value.trim();
    if (!content) { alert('请输入内容'); return; }

    if (id) {
        await DB.update('gexi', id, { content: content, date: date });
    } else {
        await DB.insert('gexi', { content: content, date: date });
    }
    closeGexiForm();
    await renderGexi();
    await refreshDashboard();
}

async function deleteGexi(id) {
    if (!confirm('确定删除？')) return;
    await DB.delete('gexi', id);
    await renderGexi();
    await refreshDashboard();
}

// ============================================================
// 山野渔夫 (About)
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
    alert('简介已保存！');
}

// ============================================================
// 站点设置
// ============================================================
async function loadSiteSettings() {
    var list = await DB.getAll('site_settings');
    var s = list.length > 0 ? list[0] : {};
    document.getElementById('site-logo-color').value = s.logo_color || '#b89c84';
    document.getElementById('site-name').value = s.site_name || '见南山';
    document.getElementById('site-desc').value = s.site_desc || '春山如黛草如烟';

    var logoImage = s.logo_image || '';
    var preview = document.getElementById('logo-preview');
    if (preview) {
        if (logoImage && logoImage.trim() !== '') {
            preview.src = logoImage;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    }
}

var uploadInput = document.getElementById('logo-upload');
if (uploadInput) {
    uploadInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(event) {
            var base64 = event.target.result;
            var preview = document.getElementById('logo-preview');
            if (preview) {
                preview.src = base64;
                preview.style.display = 'block';
            }
            window._tempLogoImage = base64;
        };
        reader.readAsDataURL(file);
    });
}

function clearLogoImage() {
    var preview = document.getElementById('logo-preview');
    if (preview) {
        preview.style.display = 'none';
        preview.src = '';
    }
    var upload = document.getElementById('logo-upload');
    if (upload) upload.value = '';
    window._tempLogoImage = '';
}

async function saveSiteSettings() {
    var logoColor = document.getElementById('site-logo-color').value || '#b89c84';
    var siteName = document.getElementById('site-name').value || '见南山';
    var siteDesc = document.getElementById('site-desc').value || '春山如黛草如烟';

    var logoImage = window._tempLogoImage || '';
    if (!logoImage || logoImage.trim() === '') {
        var list = await DB.getAll('site_settings');
        if (list.length > 0) {
            logoImage = list[0].logo_image || '';
        }
    }

    var data = {
        logo_color: logoColor,
        logo_image: logoImage,
        site_name: siteName,
        site_desc: siteDesc
    };

    var list = await DB.getAll('site_settings');
    if (list.length > 0) {
        await DB.update('site_settings', list[0].id, data);
    } else {
        await DB.insert('site_settings', data);
    }
    window._tempLogoImage = '';
    alert('站点设置已保存！');
}

// ============================================================
// 总览数据刷新
// ============================================================
async function refreshDashboard() {
    var xingyin = await DB.getAll('xingyin');
    var shinian = await DB.getAll('shinian');
    var xueye = await DB.getAll('xueye');
    var tingyu = await DB.getAll('tingyu');
    var gexi = await DB.getAll('gexi');

    var countXingyin = document.getElementById('count-xingyin');
    var countShinian = document.getElementById('count-shinian');
    var countXueye = document.getElementById('count-xueye');
    var countTingyu = document.getElementById('count-tingyu');
    var countGexi = document.getElementById('count-gexi');

    if (countXingyin) countXingyin.textContent = xingyin.length;
    if (countShinian) countShinian.textContent = shinian.length;
    if (countXueye) countXueye.textContent = xueye.length;
    if (countTingyu) countTingyu.textContent = tingyu.length;
    if (countGexi) countGexi.textContent = gexi.length;
}

// ============================================================
// 面板切换
// ============================================================
document.querySelectorAll('.admin-sidebar nav a').forEach(function(link) {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.admin-sidebar nav a').forEach(function(a) {
            a.classList.remove('active');
        });
        this.classList.add('active');
        var panelId = this.dataset.panel;
        document.querySelectorAll('.panel').forEach(function(p) {
            p.classList.remove('active');
        });
        var target = document.getElementById(panelId);
        if (target) target.classList.add('active');
        document.getElementById('panelTitle').textContent = this.textContent.trim();

        if (panelId === 'panel-dashboard') refreshDashboard();
        if (panelId === 'panel-xingyin') renderXingyin();
        if (panelId === 'panel-shinian') renderShinian();
        if (panelId === 'panel-xueye') renderXueye();
        if (panelId === 'panel-tingyu') renderTingyu();
        if (panelId === 'panel-gexi') renderGexi();
        if (panelId === 'panel-about') loadAbout();
        if (panelId === 'panel-site') loadSiteSettings();
    });
});

// ============================================================
// 初始化
// ============================================================
async function initAdmin() {
    await refreshDashboard();
    await renderXingyin();
    await renderShinian();
    await renderXueye();
    await renderTingyu();
    await renderGexi();
    await loadAbout();
    await loadSiteSettings();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
} else {
    initAdmin();
}