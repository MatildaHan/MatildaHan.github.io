(function() {
    // ============================================================
    // 1. 数据访问
    // ============================================================
    var DB = window.DB;

    // ============================================================
    // 2. 主题配置
    // ============================================================
    function getThemeConfig(site) {
        return {
            color: (site && (site.theme_color || site.logo_color)) || '#b89c84',
            size: (site && site.title_size) || '20'
        };
    }

    var _siteCache = null;

    async function getSite() {
        if (_siteCache) return _siteCache;
        var list = await DB.getAll('site_settings');
        _siteCache = list && list.length > 0 ? list[0] : {};
        return _siteCache;
    }

    // ============================================================
    // 3. 页面导航
    // ============================================================
    var sections = document.querySelectorAll('.page-section');
    var navLinks = document.querySelectorAll('#globalNav a');

    function showPage(pageId) {
        var i;
        for (i = 0; i < sections.length; i++) {
            sections[i].classList.remove('active');
        }
        var target = document.getElementById(pageId);
        if (target) target.classList.add('active');

        for (i = 0; i < navLinks.length; i++) {
            navLinks[i].classList.remove('active');
            if (navLinks[i].dataset.page === pageId) {
                navLinks[i].classList.add('active');
            }
        }

        var container = document.querySelector('.container');
        if (container) {
            container.style.marginTop = (pageId === 'page-home') ? '80px' : '30px';
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (pageId === 'page-home') renderHome();
        if (pageId === 'page-xingyin') renderXingyinList();
        if (pageId === 'page-shinian') renderShinianCards();
        if (pageId === 'page-about') renderAbout();
    }

    for (var i = 0; i < navLinks.length; i++) {
        navLinks[i].addEventListener('click', function(e) {
            e.preventDefault();
            var page = this.dataset.page;
            if (page) showPage(page);
        });
    }

   // ============================================================
// 4. 页面跳转（data-sub / data-back）
// ============================================================
document.addEventListener('click', function(e) {
    var target = e.target.closest('[data-sub]');
    if (target) {
        e.preventDefault();
        var sub = target.dataset.sub;
        if (sub) {
            var section = document.getElementById(sub);
            if (section) {
                for (var i = 0; i < sections.length; i++) {
                    sections[i].classList.remove('active');
                }
                section.classList.add('active');

                var container = document.querySelector('.container');
                if (container) {
                    container.style.marginTop = '30px';
                }

                window.scrollTo({ top: 0, behavior: 'smooth' });
                if (sub === 'shinian-list') loadShinianList(target.dataset.category);
                if (sub === 'shinian-detail') loadShinianDetail(target.dataset.id);
            }
        }
        return;
    }

    var backBtn = e.target.closest('[data-back]');
    if (backBtn) {
        e.preventDefault();
        var backId = backBtn.dataset.back;
        if (backId) {
            // ★★★ 使用 showPage 跳转到指定页面 ★★★
            showPage(backId);
        }
    }
});
    // ============================================================
    // 5. Logo 更新
    // ============================================================
    function updateLogo(site) {
        var logoBlock = document.getElementById('logoBlock');
        var logoImage = document.getElementById('logoImage');
        var logoImg = (site && site.logo_image) || '';

        if (logoImage && logoImg && logoImg.trim() !== '') {
            logoImage.src = logoImg;
            logoImage.style.display = 'block';
            if (logoBlock) logoBlock.style.backgroundColor = 'transparent';
        } else {
            if (logoImage) logoImage.style.display = 'none';
            if (logoBlock) logoBlock.style.backgroundColor = (site && site.logo_color) || '#b89c84';
        }
    }

// ============================================================
// 首页渲染
// ============================================================
async function renderHome() {
    var site = await getSite();
    var theme = getThemeConfig(site);

    updateLogo(site);

    // 网站名称和描述
    var siteNameEl = document.getElementById('siteName');
    var siteDescEl = document.getElementById('siteDesc');
    if (siteNameEl) siteNameEl.textContent = site.site_name || '见南山';
    if (siteDescEl) siteDescEl.textContent = site.site_desc || '春山如黛草如烟';

    // ① 更新记录
    renderUpdateRecord();

    // ② 行吟册（只显示最新一条）
    var xingyinList = await DB.getAll('xingyin', { orderBy: 'id' });
    var latestXingyin = xingyinList.length > 0 ? xingyinList[xingyinList.length - 1] : null;
    var homeXingyin = document.getElementById('homeXingyin');
    if (homeXingyin) {
        if (latestXingyin) {
            homeXingyin.innerHTML =
                '<div class="xingyin-item">' +
                '<span class="xingyin-date">' + (latestXingyin.date || '') + '</span>' +
                '<span class="xingyin-text">' + (latestXingyin.content || '') + '</span>' +
                '</div>';
        } else {
            homeXingyin.innerHTML = '<p style="text-align:center;color:#999;padding:20px 0;">暂无内容</p>';
        }
    }

    // ③ 十年灯（只显示最新一条）
    var shinian = await DB.getAll('shinian', { orderBy: 'id' });
    var latestShinian = shinian.length > 0 ? shinian[shinian.length - 1] : null;
    var homeShinian = document.getElementById('homeShinian');
    if (homeShinian) {
        if (latestShinian) {
            var summary = latestShinian.content ? latestShinian.content.substring(0, 100) : '';
            var displaySummary = summary + (latestShinian.content && latestShinian.content.length > 100 ? '...' : '');
            var dateDisplay = latestShinian.date || '';

            homeShinian.innerHTML =
                '<div class="shinian-item">' +
                '<h3 class="item-title" data-sub="shinian-detail" data-id="' + latestShinian.id + '">' + latestShinian.title + '</h3>' +
                '<p class="item-desc">' + displaySummary + '</p>' +
                '<div class="item-footer">' +
                '<span class="tag">#' + (latestShinian.category || '未分类') + '</span>' +
                '<span class="item-time">' + dateDisplay + '</span>' +
                '</div>' +
                '</div>';
        } else {
            homeShinian.innerHTML = '<p style="text-align:center;color:#999;padding:20px 0;">暂无文章</p>';
        }
    }
}
    // ============================================================
    // 7. 行吟册·絮（仅列表）
    // ============================================================
    async function renderXingyinList() {
        var list = await DB.getAll('xingyin', { orderBy: 'id' });
        var container = document.getElementById('xingyinList');
        if (!container) return;
        var site = await getSite();
        var theme = getThemeConfig(site);
        var html = '';
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            html += '<div class="article-item">';
            html += '<div class="article-date">' + item.date + '</div>';
            html += '<div class="article-text" style="color:' + theme.color + ';font-size:' + theme.size + 'px;font-weight:bold;">' + item.content + '</div>';
            html += '</div>';
        }
        container.innerHTML = html || '<p style="text-align:center;color:#999;padding:40px 0;">暂无内容</p>';
    }

    // ============================================================
    // 8. 十年灯·文
    // ============================================================
    async function getShinianCategoryDescMap() {
        var cats = await DB.getAll('shinian_categories');
        var map = {};
        for (var i = 0; i < cats.length; i++) {
            map[cats[i].name] = cats[i].description || '';
        }
        return map;
    }

    async function renderShinianCards() {
        var list = await DB.getAll('shinian', { orderBy: 'id' });
        var descMap = await getShinianCategoryDescMap();
        var categories = [];
        for (var i = 0; i < list.length; i++) {
            if (categories.indexOf(list[i].category) === -1) {
                categories.push(list[i].category);
            }
        }
        var container = document.getElementById('shinianCards');
        if (!container) return;
        var site = await getSite();
        var theme = getThemeConfig(site);
        var html = '';
        for (var j = 0; j < categories.length; j++) {
            var cat = categories[j];
            var desc = descMap[cat] || '';
            var indexStr = String(j + 1).padStart(2, '0');
            html += '<div class="series-card">';
            html += '<div class="card-index" style="color:' + theme.color + ';font-size:14px;">' + indexStr + ' / 系列</div>';
            html += '<h3 class="card-title" style="color:' + theme.color + ';font-size:' + theme.size + 'px;font-weight:bold;">' + cat + '</h3>';
            html += '<p class="card-desc">' + (desc || '暂无描述') + '</p>';
            html += '<a class="card-link" data-sub="shinian-list" data-category="' + cat + '" style="color:' + theme.color + ';font-size:14px;text-decoration:none;">进入系列&gt;</a>';
            html += '</div>';
        }
        container.innerHTML = html || '<p style="text-align:center;color:#999;padding:40px 0;">暂无内容</p>';
    }

    async function loadShinianList(category) {
        var list = await DB.getAll('shinian', { orderBy: 'id' });
        var items = list.filter(function(x) { return x.category === category; });
        var container = document.getElementById('shinianList');
        if (!container) return;
        var site = await getSite();
        var theme = getThemeConfig(site);
        var html = '';
        for (var j = 0; j < items.length; j++) {
            var item = items[j];
            html += '<div class="article-item">';
            html += '<div class="article-date">' + item.date + '</div>';
            html += '<div class="article-text"><a data-sub="shinian-detail" data-id="' + item.id + '" style="color:' + theme.color + ';font-size:' + theme.size + 'px;font-weight:bold;">' + item.title + '</a></div>';
            html += '</div>';
        }
        container.innerHTML = html || '<p style="text-align:center;color:#999;padding:40px 0;">该系列暂无文章</p>';
    }

    async function loadShinianDetail(id) {
        var item = await DB.getById('shinian', id);
        if (!item) return;
        var list = await DB.getAll('shinian', { orderBy: 'id' });
        var site = await getSite();
        var theme = getThemeConfig(site);

        var titleEl = document.getElementById('shinianDetailTitle');
        var dateEl = document.getElementById('shinianDetailDate');
        var contentEl = document.getElementById('shinianDetailContent');
        var sidebarTitleEl = document.getElementById('shinianSidebarTitle');
        var sidebarEl = document.getElementById('shinianSidebar');

        if (titleEl) {
            titleEl.textContent = item.title;
            titleEl.style.color = theme.color;
            titleEl.style.fontSize = theme.size + 'px';
            titleEl.style.fontWeight = 'bold';
        }
        if (dateEl) dateEl.textContent = item.date;
        if (contentEl) contentEl.innerHTML = '<p>' + (item.content || '').replace(/\n/g, '</p><p>') + '</p>';
        if (sidebarTitleEl) {
            sidebarTitleEl.textContent = '系列 / ' + item.category;
            sidebarTitleEl.style.color = theme.color;
        }

        if (sidebarEl) {
            var sameCategory = list.filter(function(x) { return x.category === item.category; });
            var html = '';
            for (var k = 0; k < sameCategory.length; k++) {
                var displayTitle = sameCategory[k].title;
                if (displayTitle.length > 40) displayTitle = displayTitle.substring(0, 40) + '...';
                html += '<a href="#" data-sub="shinian-detail" data-id="' + sameCategory[k].id + '" style="font-size:14px;font-weight:bold;color:' + theme.color + ';display:block;margin-bottom:6px;text-decoration:none;">' + displayTitle + '</a>';
            }
            sidebarEl.innerHTML = html;
        }
    }

    // ============================================================
    // 9. 山野渔夫
    // ============================================================
    async function renderAbout() {
        var list = await DB.getAll('about');
        var content = list.length > 0 ? (list[0].content || '') : '';
        var container = document.getElementById('aboutContent');
        if (!container) return;
        var site = await getSite();
        var theme = getThemeConfig(site);
        var lines = content.split('\n');
        var html = '';
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line) {
                html += '<p style="color:' + theme.color + ';font-size:' + theme.size + 'px;font-weight:bold;">' + line + '</p>';
            }
        }
        container.innerHTML = html;
    }

    // ============================================================
    // 10. 初始化
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {
        var container = document.querySelector('.container');
        if (container) container.style.marginTop = '80px';
        renderHome();
    });

    showPage('page-home');
})();
