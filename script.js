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
            color: (site && (site.theme_color || site.logo_color)) || '#2A2A28',
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
    // 3. 页面导航（核心逻辑）
    // ============================================================
    var sections = document.querySelectorAll('.page-section');
    var navLinks = document.querySelectorAll('#globalNav a');

    function showPage(pageId) {
        for (var i = 0; i < sections.length; i++) {
            sections[i].classList.remove('active');
        }
        var target = document.getElementById(pageId);
        if (target) target.classList.add('active');

        for (var j = 0; j < navLinks.length; j++) {
            navLinks[j].classList.remove('active');
            if (navLinks[j].dataset.page === pageId) {
                navLinks[j].classList.add('active');
            }
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (pageId === 'page-home') renderHome();
        if (pageId === 'page-xingyin') renderXingyinList();
        if (pageId === 'page-shinian') renderShinianPage();
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
        // 处理 data-sub（跳转到详情页）
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
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    if (sub === 'shinian-detail') loadShinianDetail(target.dataset.id);
                }
            }
            return;
        }

        // 处理 data-back（返回按钮）
        var backBtn = e.target.closest('[data-back]');
        if (backBtn) {
            e.preventDefault();
            var backId = backBtn.dataset.back;
            if (backId) {
                showPage(backId);
            }
            return;
        }
    });

    // ============================================================
    // 5. Logo 更新
    // ============================================================
    function updateLogo(site) {
        var siteNameEl = document.getElementById('siteName');
        var siteDescEl = document.getElementById('siteDesc');
        if (siteNameEl) siteNameEl.textContent = site.site_name || '见南山';
        if (siteDescEl) siteDescEl.textContent = site.site_desc || '春山如黛草如烟';
    }

    // ============================================================
    // 6. 首页
    // ============================================================
    async function renderHome() {
        var site = await getSite();
        updateLogo(site);

        // ① 更新记录
        await renderUpdateRecord();

        // ② 行吟册（最新一条）
        var xingyinList = await DB.getAll('xingyin', { orderBy: 'id' });
        var latestXingyin = xingyinList.length > 0 ? xingyinList[xingyinList.length - 1] : null;
        var homeXingyin = document.getElementById('homeXingyin');
        if (homeXingyin) {
            if (latestXingyin) {
                homeXingyin.innerHTML =
                    '<div class="xingyin-item">' +
                    '<span class="xingyin-text">' + (latestXingyin.content || '') + '</span>' +
                    '<span class="xingyin-date">' + (latestXingyin.date || '') + '</span>' +
                    '</div>';
            } else {
                homeXingyin.innerHTML = '<p style="text-align:center;color:#999;padding:20px 0;">暂无内容</p>';
            }
        }

        // ③ 十年灯（最新一条）
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
    // 7. 更新记录
    // ============================================================
    async function renderUpdateRecord() {
        var container = document.getElementById('updateRecordGrid');
        if (!container) return;

        var records = await DB.getAll('update_records', { orderBy: 'date' });
        var recordMap = {};
        for (var i = 0; i < records.length; i++) {
            recordMap[records[i].date] = records[i].word_count || 0;
        }

        var now = new Date();
        var months = [];
   // 修改后：从当前月到 5 个月前（9月 → 4月）
for (var m = 0; m <= 5; m++) {
    var d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    months.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        days: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    });
}

        var html = '';
        for (var k = 0; k < months.length; k++) {
            var mo = months[k];
            html += '<div class="update-row">';
            html += '<span class="update-month">' + mo.month + '月</span>';
            html += '<div class="update-days">';

            for (var day = 1; day <= mo.days; day++) {
                var dateStr = mo.year + '-' +
                    String(mo.month).padStart(2, '0') + '-' +
                    String(day).padStart(2, '0');

                var count = recordMap[dateStr] || 0;
                var level = 0;
                if (count > 0 && count <= 200) level = 1;
                else if (count > 200 && count <= 500) level = 2;
                else if (count > 500 && count <= 1000) level = 3;
                else if (count > 1000) level = 4;

                html += '<div class="update-day level-' + level + '" title="' + dateStr + '（' + count + '字）"></div>';
            }

            html += '</div>';
            html += '</div>';
        }

        container.innerHTML = html;
    }

    // ============================================================
    // 8. 行吟册列表
    // ============================================================
    async function renderXingyinList() {
        var list = await DB.getAll('xingyin', { orderBy: 'id' });
        var container = document.getElementById('xingyinList');
        if (!container) return;
        var html = '';
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            html += '<div class="article-item">';
            html += '<div class="article-text" style="font-weight:700;flex:1;">' + item.content + '</div>';
            html += '<div class="article-date" style="text-align:right;">— ' + item.date + '</div>';
            html += '</div>';
        }
        container.innerHTML = html || '<p style="text-align:center;color:#999;padding:40px 0;">暂无内容</p>';
    }

    // ============================================================
    // 9. 十年灯页面（文章列表 + 系列导航）
    // ============================================================
    var _currentShinianCategory = null;

    async function renderShinianPage() {
        var list = await DB.getAll('shinian', { orderBy: 'id' });
        var categories = await DB.getAll('shinian_categories', { orderBy: 'id' });

        // 如果分类表为空，从文章中提取
        if (categories.length === 0) {
            var catSet = {};
            for (var i = 0; i < list.length; i++) {
                if (list[i].category) {
                    catSet[list[i].category] = true;
                }
            }
            categories = Object.keys(catSet).map(function(name) {
                return { name: name };
            });
        }

        // 渲染右侧系列导航
        var seriesContainer = document.getElementById('shinianSeriesList');
        if (seriesContainer) {
            var seriesHtml = '';
            for (var j = 0; j < categories.length; j++) {
                var cat = categories[j];
                var activeClass = (_currentShinianCategory === cat.name) ? ' active' : '';
                seriesHtml += '<a class="shinian-series-item' + activeClass + '" data-series="' + cat.name + '">' + cat.name + '</a>';
            }
            seriesContainer.innerHTML = seriesHtml;
        }

        // 渲染左侧文章列表
        renderShinianArticleList(list);
    }

    function renderShinianArticleList(list) {
        var container = document.getElementById('shinianArticleList');
        if (!container) return;

        var filtered = list;
        if (_currentShinianCategory) {
            filtered = list.filter(function(x) {
                return x.category === _currentShinianCategory;
            });
        }

        var sorted = filtered.slice().reverse();

        if (sorted.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#999;padding:40px 0;">暂无文章</p>';
            return;
        }

        var html = '';
        for (var i = 0; i < sorted.length; i++) {
            var item = sorted[i];
            html += '<div class="shinian-article-item">';
            html += '<a class="shinian-article-title" data-sub="shinian-detail" data-id="' + item.id + '">' + (item.title || '无标题') + '</a>';
            html += '<span class="shinian-article-tag">#' + (item.category || '未分类') + '</span>';
            html += '<span class="shinian-article-date">' + (item.date || '') + '</span>';
            html += '</div>';
        }
        container.innerHTML = html;
    }

    // 系列点击事件
    document.addEventListener('click', function(e) {
        var seriesItem = e.target.closest('.shinian-series-item');
        if (seriesItem) {
            e.preventDefault();
            var series = seriesItem.dataset.series;
            if (_currentShinianCategory === series) {
                _currentShinianCategory = null;
            } else {
                _currentShinianCategory = series;
            }
            DB.getAll('shinian', { orderBy: 'id' }).then(function(list) {
                renderShinianArticleList(list);
                var items = document.querySelectorAll('.shinian-series-item');
                for (var i = 0; i < items.length; i++) {
                    items[i].classList.remove('active');
                    if (items[i].dataset.series === _currentShinianCategory) {
                        items[i].classList.add('active');
                    }
                }
            });
            return;
        }
    });

    // ============================================================
    // 10. 十年灯 文章详情
    // ============================================================
    async function loadShinianDetail(id) {
        var item = await DB.getById('shinian', id);
        if (!item) return;

        var titleEl = document.getElementById('shinianDetailTitle');
        var dateEl = document.getElementById('shinianDetailDate');
        var contentEl = document.getElementById('shinianDetailContent');

        if (titleEl) titleEl.textContent = item.title;
        if (dateEl) dateEl.textContent = item.date;
        if (contentEl) contentEl.innerHTML = '<p>' + (item.content || '').replace(/\n/g, '</p><p>') + '</p>';
    }

    // ============================================================
    // 11. 山野渔夫
    // ============================================================
    async function renderAbout() {
        var list = await DB.getAll('about');
        var content = list.length > 0 ? (list[0].content || '') : '';
        var container = document.getElementById('aboutContent');
        if (!container) return;
        var lines = content.split('\n');
        var html = '';
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line) {
                html += '<p>' + line + '</p>';
            }
        }
        container.innerHTML = html;
    }

    // ============================================================
    // 12. 初始化
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {
        showPage('page-home');
    });
})();
