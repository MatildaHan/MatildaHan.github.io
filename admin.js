// ============================================================
// 1. 数据存储
// ============================================================
const DB = {
    get(key, def) {
        try {
            return JSON.parse(localStorage.getItem('jiananshan_' + key)) || def;
        } catch (e) {
            return def;
        }
    },
    set(key, val) {
        localStorage.setItem('jiananshan_' + key, JSON.stringify(val));
    }
};

function genId() { return Date.now() + Math.random() * 1000; }

// ============================================================
// 2. 默认数据初始化
// ============================================================
function initDefaultData() {
    if (!DB.get('site', null)) {
        DB.set('site', {
            logoColor: '#b89c84',
            siteName: '见南山',
            siteDesc: '春山如黛草如烟',
            homeTitle: '不再热爱生活。'
        });
    }
    if (!DB.get('xingyin', null)) {
        DB.set('xingyin', [
            { id: 1, content: '我决定，从今天开始不再热爱生活。', date: '2026/08/25' },
            { id: 2, content: '山间有雾，心里有你。', date: '2026/08/26' },
            { id: 3, content: '春水初生，春林初盛。', date: '2026/08/27' },
        ]);
    }
    if (!DB.get('shinian', null)) {
        DB.set('shinian', [
            { id: 1, title: '不再热爱生活。', category: '闲聊几句', categoryDesc: '没什么要紧事，就是灯下坐着，忽然想跟你聊几句。', content: '汤之问棘也是已：穷发之北，有冥海者，天池也。有鱼焉，其广数千里，未有知其修者，其名为鲲。有鸟焉，其名为鹏，背若泰山，翼若垂天之云，抟扶摇羊角而上者九万里，绝云气，负青天，然后图南，且适南冥也。', date: '2026/08/25' },
            { id: 2, title: '灯火可亲', category: '灯火可亲', categoryDesc: '家事，食事，灯下琐事。外面风雨再大，推开门就小了。', content: '家是港湾，灯火是归途。无论走多远，总有一盏灯为你而亮。', date: '2026/08/26' },
            { id: 3, title: '半杯凉茶', category: '半杯凉茶', categoryDesc: '主打冷静、清醒的观察，聊聊读到的书，遇到的人，像凉茶一样，入口微苦，却有余甘。', content: '人生如茶，苦后回甘。有时候需要一杯凉茶，让自己清醒地看世界。', date: '2026/08/27' },
        ]);
    }
    if (!DB.get('xueye', null)) {
        DB.set('xueye', [
            { id: 1, category: '四季有信', categoryDesc: '跟随时令的自然影像——春芽、夏荷、秋叶、冬雪，同一棵树的一年十二个月。', count: 6, date: '2026/08/25' },
            { id: 2, category: '旧物不言', categoryDesc: '静物与旧物件——一把老椅子，泛黄的书页，窗台的灰尘与光影，沉默里有故事。', count: 6, date: '2026/08/26' },
        ]);
    }
    if (!DB.get('tingyu', null)) {
        DB.set('tingyu', [
            { id: 1, title: '《百年孤独》', year: '2026' },
            { id: 2, title: '《活着》', year: '2026' },
            { id: 3, title: '《局外人》', year: '2025' },
            { id: 4, title: '《追风筝的人》', year: '2026' },
            { id: 5, title: '《小王子》', year: '2025' },
        ]);
    }
    if (!DB.get('gexi', null)) {
        DB.set('gexi', [
            { id: 1, content: '各西东，语未休。', date: '2026/08/25' },
            { id: 2, content: '山高水长，江湖再见。', date: '2026/08/26' },
        ]);
    }
    if (!DB.get('about', null)) {
        DB.set('about', '山野渔夫，居南山之下。\n\n不捕鱼，只打捞日子的碎影——晨雾、夕照、一碗热汤、一盏迟归的灯。\n\n见南山，是我落脚的地方，也是把所见所感细细晾晒的小院。\n\n风来听风，雨来看雨，你来，便一起坐坐。\n\n见字如面，见山如归。');
    }
}
initDefaultData();

// ============================================================
// 3. 面板切换
// ============================================================
document.querySelectorAll('.admin-sidebar nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.admin-sidebar nav a').forEach(a => a.classList.remove('active'));
        this.classList.add('active');
        const panelId = this.dataset.panel;
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(panelId);
        if (target) target.classList.add('active');
        document.getElementById('panelTitle').textContent = this.textContent.trim();
        // 刷新列表
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
// 4. 站点设置
// ============================================================
function loadSiteSettings() {
    const s = DB.get('site', {});
    document.getElementById('site-logo-color').value = s.logoColor || '#b89c84';
    document.getElementById('site-name').value = s.siteName || '见南山';
    document.getElementById('site-desc').value = s.siteDesc || '春山如黛草如烟';
    document.getElementById('site-home-title').value = s.homeTitle || '不再热爱生活。';
}

function saveSiteSettings() {
    const s = {
        logoColor: document.getElementById('site-logo-color').value || '#b89c84',
        siteName: document.getElementById('site-name').value || '见南山',
        siteDesc: document.getElementById('site-desc').value || '春山如黛草如烟',
        homeTitle: document.getElementById('site-home-title').value || '不再热爱生活。'
    };
    DB.set('site', s);
    alert('站点设置已保存！');
}

// ============================================================
// 5. 行吟册·絮 (CRUD)
// ============================================================
function getXingyin() { return DB.get('xingyin', []); }
function setXingyin(data) { DB.set('xingyin', data); }

function renderXingyin() {
    const list = getXingyin();
    const tbody = document.getElementById('xingyin-list');
    tbody.innerHTML = list.map((item, idx) => `
        <tr>
            <td>${idx+1}</td>
            <td>${item.content}</td>
            <td>${item.date}</td>
            <td class="actions">
                <button class="btn" onclick="editXingyin(${item.id})">编辑</button>
                <button class="btn btn-danger" onclick="deleteXingyin(${item.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

function openXingyinForm() {
    document.getElementById('xingyin-form').style.display = 'block';
    document.getElementById('xingyin-edit-id').value = '';
    document.getElementById('xingyin-content').value = '';
    document.getElementById('xingyin-date').value = new Date().toISOString().slice(0,10).replace(/-/g,'/');
}

function closeXingyinForm() {
    document.getElementById('xingyin-form').style.display = 'none';
}

function editXingyin(id) {
    const list = getXingyin();
    const item = list.find(i => i.id === id);
    if (!item) return;
    document.getElementById('xingyin-form').style.display = 'block';
    document.getElementById('xingyin-edit-id').value = id;
    document.getElementById('xingyin-content').value = item.content;
    document.getElementById('xingyin-date').value = item.date;
}

function saveXingyin() {
    const id = document.getElementById('xingyin-edit-id').value;
    const content = document.getElementById('xingyin-content').value.trim();
    const date = document.getElementById('xingyin-date').value.trim();
    if (!content) { alert('请输入内容'); return; }
    let list = getXingyin();
    if (id) {
        const item = list.find(i => i.id === Number(id));
        if (item) { item.content = content; item.date = date; }
    } else {
        list.push({ id: genId(), content, date });
    }
    setXingyin(list);
    closeXingyinForm();
    renderXingyin();
    refreshDashboard();
}

function deleteXingyin(id) {
    if (!confirm('确定删除？')) return;
    let list = getXingyin();
    list = list.filter(i => i.id !== id);
    setXingyin(list);
    renderXingyin();
    refreshDashboard();
}

// ============================================================
// 6. 十年灯·文 (CRUD)
// ============================================================
function getShinian() { return DB.get('shinian', []); }
function setShinian(data) { DB.set('shinian', data); }

function renderShinian() {
    const list = getShinian();
    const tbody = document.getElementById('shinian-list');
    tbody.innerHTML = list.map((item, idx) => `
        <tr>
            <td>${idx+1}</td>
            <td><strong>${item.title}</strong></td>
            <td>${item.category}${item.categoryDesc ? ' ('+item.categoryDesc+')' : ''}</td>
            <td>${item.date}</td>
            <td class="actions">
                <button class="btn" onclick="editShinian(${item.id})">编辑</button>
                <button class="btn btn-danger" onclick="deleteShinian(${item.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

function openShinianForm() {
    document.getElementById('shinian-form').style.display = 'block';
    document.getElementById('shinian-edit-id').value = '';
    document.getElementById('shinian-title').value = '';
    document.getElementById('shinian-category').value = '闲聊几句';
    document.getElementById('shinian-category-desc').value = '';
    document.getElementById('shinian-content').value = '';
    document.getElementById('shinian-date').value = new Date().toISOString().slice(0,10).replace(/-/g,'/');
}

function closeShinianForm() { document.getElementById('shinian-form').style.display = 'none'; }

function editShinian(id) {
    const list = getShinian();
    const item = list.find(i => i.id === id);
    if (!item) return;
    document.getElementById('shinian-form').style.display = 'block';
    document.getElementById('shinian-edit-id').value = id;
    document.getElementById('shinian-title').value = item.title;
    document.getElementById('shinian-category').value = item.category || '闲聊几句';
    document.getElementById('shinian-category-desc').value = item.categoryDesc || '';
    document.getElementById('shinian-content').value = item.content || '';
    document.getElementById('shinian-date').value = item.date;
}

function saveShinian() {
    const id = document.getElementById('shinian-edit-id').value;
    const title = document.getElementById('shinian-title').value.trim();
    const category = document.getElementById('shinian-category').value;
    const categoryDesc = document.getElementById('shinian-category-desc').value.trim();
    const content = document.getElementById('shinian-content').value.trim();
    const date = document.getElementById('shinian-date').value.trim();
    if (!title) { alert('请输入标题'); return; }
    let list = getShinian();
    if (id) {
        const item = list.find(i => i.id === Number(id));
        if (item) { item.title = title; item.category = category; item.categoryDesc = categoryDesc; item.content = content; item.date = date; }
    } else {
        list.push({ id: genId(), title, category, categoryDesc, content, date });
    }
    setShinian(list);
    closeShinianForm();
    renderShinian();
    refreshDashboard();
}

function deleteShinian(id) {
    if (!confirm('确定删除？')) return;
    let list = getShinian();
    list = list.filter(i => i.id !== id);
    setShinian(list);
    renderShinian();
    refreshDashboard();
}

// ============================================================
// 7. 雪夜舟·图 (CRUD)
// ============================================================
function getXueye() { return DB.get('xueye', []); }
function setXueye(data) { DB.set('xueye', data); }

function renderXueye() {
    const list = getXueye();
    const tbody = document.getElementById('xueye-list');
    tbody.innerHTML = list.map((item, idx) => `
        <tr>
            <td>${idx+1}</td>
            <td><strong>${item.category}</strong></td>
            <td>${item.categoryDesc || '-'}</td>
            <td><span class="img-preview"></span> ×${item.count || 6}</td>
            <td>${item.date}</td>
            <td class="actions">
                <button class="btn" onclick="editXueye(${item.id})">编辑</button>
                <button class="btn btn-danger" onclick="deleteXueye(${item.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

function openXueyeForm() {
    document.getElementById('xueye-form').style.display = 'block';
    document.getElementById('xueye-edit-id').value = '';
    document.getElementById('xueye-category').value = '';
    document.getElementById('xueye-category-desc').value = '';
    document.getElementById('xueye-count').value = 6;
    document.getElementById('xueye-date').value = new Date().toISOString().slice(0,10).replace(/-/g,'/');
}

function closeXueyeForm() { document.getElementById('xueye-form').style.display = 'none'; }

function editXueye(id) {
    const list = getXueye();
    const item = list.find(i => i.id === id);
    if (!item) return;
    document.getElementById('xueye-form').style.display = 'block';
    document.getElementById('xueye-edit-id').value = id;
    document.getElementById('xueye-category').value = item.category;
    document.getElementById('xueye-category-desc').value = item.categoryDesc || '';
    document.getElementById('xueye-count').value = item.count || 6;
    document.getElementById('xueye-date').value = item.date;
}

function saveXueye() {
    const id = document.getElementById('xueye-edit-id').value;
    const category = document.getElementById('xueye-category').value.trim();
    const categoryDesc = document.getElementById('xueye-category-desc').value.trim();
    const count = parseInt(document.getElementById('xueye-count').value) || 6;
    const date = document.getElementById('xueye-date').value.trim();
    if (!category) { alert('请输入分类名称'); return; }
    let list = getXueye();
    if (id) {
        const item = list.find(i => i.id === Number(id));
        if (item) { item.category = category; item.categoryDesc = categoryDesc; item.count = count; item.date = date; }
    } else {
        list.push({ id: genId(), category, categoryDesc, count, date });
    }
    setXueye(list);
    closeXueyeForm();
    renderXueye();
    refreshDashboard();
}

function deleteXueye(id) {
    if (!confirm('确定删除？')) return;
    let list = getXueye();
    list = list.filter(i => i.id !== id);
    setXueye(list);
    renderXueye();
    refreshDashboard();
}

// ============================================================
// 8. 听雨眠·记 (CRUD)
// ============================================================
function getTingyu() { return DB.get('tingyu', []); }
function setTingyu(data) { DB.set('tingyu', data); }

function renderTingyu() {
    const list = getTingyu();
    const tbody = document.getElementById('tingyu-list');
    tbody.innerHTML = list.map((item, idx) => `
        <tr>
            <td>${idx+1}</td>
            <td>${item.title}</td>
            <td>${item.year}</td>
            <td class="actions">
                <button class="btn" onclick="editTingyu(${item.id})">编辑</button>
                <button class="btn btn-danger" onclick="deleteTingyu(${item.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

function openTingyuForm() {
    document.getElementById('tingyu-form').style.display = 'block';
    document.getElementById('tingyu-edit-id').value = '';
    document.getElementById('tingyu-title').value = '';
    document.getElementById('tingyu-year').value = new Date().getFullYear();
}

function closeTingyuForm() { document.getElementById('tingyu-form').style.display = 'none'; }

function editTingyu(id) {
    const list = getTingyu();
    const item = list.find(i => i.id === id);
    if (!item) return;
    document.getElementById('tingyu-form').style.display = 'block';
    document.getElementById('tingyu-edit-id').value = id;
    document.getElementById('tingyu-title').value = item.title;
    document.getElementById('tingyu-year').value = item.year;
}

function saveTingyu() {
    const id = document.getElementById('tingyu-edit-id').value;
    const title = document.getElementById('tingyu-title').value.trim();
    const year = document.getElementById('tingyu-year').value.trim();
    if (!title) { alert('请输入书名'); return; }
    if (!year) { alert('请输入年份'); return; }
    let list = getTingyu();
    if (id) {
        const item = list.find(i => i.id === Number(id));
        if (item) { item.title = title; item.year = year; }
    } else {
        list.push({ id: genId(), title, year });
    }
    setTingyu(list);
    closeTingyuForm();
    renderTingyu();
    refreshDashboard();
}

function deleteTingyu(id) {
    if (!confirm('确定删除？')) return;
    let list = getTingyu();
    list = list.filter(i => i.id !== id);
    setTingyu(list);
    renderTingyu();
    refreshDashboard();
}

// ============================================================
// 9. 各西东·语 (CRUD)
// ============================================================
function getGexi() { return DB.get('gexi', []); }
function setGexi(data) { DB.set('gexi', data); }

function renderGexi() {
    const list = getGexi();
    const tbody = document.getElementById('gexi-list');
    tbody.innerHTML = list.map((item, idx) => `
        <tr>
            <td>${idx+1}</td>
            <td>${item.content}</td>
            <td>${item.date}</td>
            <td class="actions">
                <button class="btn" onclick="editGexi(${item.id})">编辑</button>
                <button class="btn btn-danger" onclick="deleteGexi(${item.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

function openGexiForm() {
    document.getElementById('gexi-form').style.display = 'block';
    document.getElementById('gexi-edit-id').value = '';
    document.getElementById('gexi-content').value = '';
    document.getElementById('gexi-date').value = new Date().toISOString().slice(0,10).replace(/-/g,'/');
}

function closeGexiForm() { document.getElementById('gexi-form').style.display = 'none'; }

function editGexi(id) {
    const list = getGexi();
    const item = list.find(i => i.id === id);
    if (!item) return;
    document.getElementById('gexi-form').style.display = 'block';
    document.getElementById('gexi-edit-id').value = id;
    document.getElementById('gexi-content').value = item.content;
    document.getElementById('gexi-date').value = item.date;
}

function saveGexi() {
    const id = document.getElementById('gexi-edit-id').value;
    const content = document.getElementById('gexi-content').value.trim();
    const date = document.getElementById('gexi-date').value.trim();
    if (!content) { alert('请输入内容'); return; }
    let list = getGexi();
    if (id) {
        const item = list.find(i => i.id === Number(id));
        if (item) { item.content = content; item.date = date; }
    } else {
        list.push({ id: genId(), content, date });
    }
    setGexi(list);
    closeGexiForm();
    renderGexi();
    refreshDashboard();
}

function deleteGexi(id) {
    if (!confirm('确定删除？')) return;
    let list = getGexi();
    list = list.filter(i => i.id !== id);
    setGexi(list);
    renderGexi();
    refreshDashboard();
}

// ============================================================
// 10. 山野渔夫 (About)
// ============================================================
function loadAbout() {
    document.getElementById('about-content').value = DB.get('about', '');
}

function saveAbout() {
    DB.set('about', document.getElementById('about-content').value);
    alert('简介已保存！');
}

// ============================================================
// 11. 总览数据刷新
// ============================================================
function refreshDashboard() {
    document.getElementById('count-xingyin').textContent = getXingyin().length;
    document.getElementById('count-shinian').textContent = getShinian().length;
    document.getElementById('count-xueye').textContent = getXueye().length;
    document.getElementById('count-tingyu').textContent = getTingyu().length;
    document.getElementById('count-gexi').textContent = getGexi().length;
}

// ============================================================
// 12. 初始化渲染
// ============================================================
function initAdmin() {
    refreshDashboard();
    renderXingyin();
    renderShinian();
    renderXueye();
    renderTingyu();
    renderGexi();
    loadAbout();
    loadSiteSettings();
}
initAdmin();