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
            logoImage: '',  // 新增：Logo 图片 Base64
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
// 4. 站点设置（含 Logo 上传）
// ============================================================
function loadSiteSettings() {
    const s = DB.get('site', {});
    document.getElementById('site-logo-color').value = s.logoColor || '#b89c84';
    document.getElementById('site-name').value = s.siteName || '见南山';
    document.getElementById('site-desc').value = s.siteDesc || '春山如黛草如烟';
    document.getElementById('site-home-title').value = s.homeTitle || '不再热爱生活。';
    
    // 加载 Logo 预览
    const logoImage = s.logoImage || '';
    const preview = document.getElementById('logo-preview');
    if (logoImage && logoImage.trim() !== '') {
        preview.src = logoImage;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
}

// Logo 上传处理
document.getElementById('logo-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const base64 = event.target.result;
        document.getElementById('logo-preview').src = base64;
        document.getElementById('logo-preview').style.display = 'block';
        // 临时存储，保存时正式写入
        window._tempLogoImage = base64;
    };
    reader.readAsDataURL(file);
});

// 清除 Logo 图片
function clearLogoImage() {
    document.getElementById('logo-preview').style.display = 'none';
    document.getElementById('logo-preview').src = '';
    document.getElementById('logo-upload').value = '';
    window._tempLogoImage = '';
}

function saveSiteSettings() {
    const logoColor = document.getElementById('site-logo-color').value || '#b89c84';
    const siteName = document.getElementById('site-name').value || '见南山';
    const siteDesc = document.getElementById('site-desc').value || '春山如黛草如烟';
    const homeTitle = document.getElementById('site-home-title').value || '不再热爱生活。';
    
    // 优先使用上传的图片，否则保留原有图片
    let logoImage = window._tempLogoImage;
    if (!logoImage || logoImage.trim() === '') {
        // 如果没上传新图片，保留原有
        const existing = DB.get('site', {});
        logoImage = existing.logoImage || '';
    }
    
    const s = {
        logoColor: logoColor,
        logoImage: logoImage,
        siteName: siteName,
        siteDesc: siteDesc,
        homeTitle: homeTitle
    };
    DB.set('site', s);
    window._tempLogoImage = '';
    alert('站点设置已保存！');
}

// ============================================================
// 5-11. 各模块 CRUD（与之前相同，略...）
// ============================================================
// 为了节省篇幅，这里省略了 xingyin、shinian、xueye、tingyu、gexi、about 的 CRUD 函数
// 这些函数与之前版本完全相同，请保留
