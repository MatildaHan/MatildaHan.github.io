(function() {
    // ============================================================
    // 1. 数据访问
    // ------------------------------------------------------------
    // 注意：这里直接复用 supabase.js 挂载到 window 上的 DB 对象，
    // 不再定义自己的本地 DB（之前的版本在这里重新声明了一个只读
    // localStorage 的 DB，导致前台永远读不到后台在 Supabase 里
    // 保存的数据）。DB.getAll/getById 内部已经处理好了网络失败
    // 时的 localStorage 降级，这里无需关心。
    // ============================================================
    var DB = window.DB;

    // ============================================================
    // 2. 主题配置（颜色 / 字号），字段统一使用 snake_case，
    //    与后台 saveSiteSettings() 写入 Supabase 的字段保持一致
    // ============================================================
    function getThemeConfig(site) {
        return {
            color: (site && (site.theme_color || site.logo_color)) || '#b89c84',
            size: (site && site.title_size) || '20'
        };
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
        if (pageId === 'page-xueye') renderXueyeCards();
        if (pageId === 'page-tingyu') renderTingyuYears();
        if (pageId === 'page-gexi') renderGexiList();
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
                    if (sub === 'xingyin-detail') loadXingyinDetail(target.dataset.id);
                    if (sub === 'shinian-list') loadShinianList(target.dataset.category);
                    if (sub === 'shinian-detail') loadShinianDetail(target.dataset.id);
                    if (sub === 'xueye-gallery') loadXueyeGallery(target.dataset.id);
                    if (sub === 'tingyu-detail') loadTingyuDetail(target.dataset.year, target.dataset.title);
                }
            }
            return;
        }

        var backBtn = e.target.closest('[data-back]');
        if (backBtn) {
            e.preventDefault();
            var backId = backBtn.dataset.back;
            if (backId) {
                showPage('page-home');
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

    async function getSite() {
        var list = await DB.getAll('site_settings');
        return list && list.length > 0 ? list[0] : {};
    }

    // ============================================================
    // 6. 首页（含雪夜舟·图最新一张、十年灯·文最新3条）
    // ============================================================
    async function renderHome() {
        var site = await getSite();
        var theme = getThemeConfig(site);

        updateLogo(site);

        var xingyinList = await DB.getAll('xingyin', { orderBy: 'id' });
        var latestXingyin = xingyinList.length > 0 ? xingyinList[xingyinList.length - 1] : null;

        var homeTitle = document.getElementById('homeTitle');
        var homeDate = document.getElementById('homeDate');
        if (homeTitle) {
            homeTitle.textContent = latestXingyin ? latestXingyin.content : '暂无短句，请前往后台添加';
            homeTitle.style.color = theme.color;
            homeTitle.style.fontSize = theme.size + 'px';
        }
        if (homeDate) {
            homeDate.textContent = latestXingyin ? latestXingyin.date : new Date().toISOString().slice(0, 10).replace(/-/g, '/');
        }

        // 中间图片：显示雪夜舟·图最新一组的第一张
        var homeImage = document.getElementById('homeImage');
        var xueyeList = await DB.getAll('xueye', { orderBy: 'id' });
        var latestXueye = xueyeList.length > 0 ? xueyeList[xueyeList.length - 1] : null;

        if (homeImage) {
            homeImage.className = 'tilted-card';
            homeImage.style.transform = 'rotate(3deg)';
            if (latestXueye && latestXueye.images && latestXueye.images.length > 0) {
                homeImage.style.backgroundImage = 'url(' + latestXueye.images[0] + ')';
                homeImage.style.backgroundSize = 'cover';
                homeImage.style.backgroundPosition = 'center';
                homeImage.style.backgroundRepeat = 'no-repeat';
                homeImage.style.backgroundColor = 'transparent';
            } else {
                homeImage.style.backgroundImage = 'none';
                homeImage.style.backgroundColor = site.logo_color || '#b89c84';
            }
        }

        var siteNameEl = document.getElementById('siteName');
        var siteDescEl = document.getElementById('siteDesc');
        if (siteNameEl) siteNameEl.textContent = site.site_name || '见南山';
        if (siteDescEl) siteDescEl.textContent = site.site_desc || '春山如黛草如烟';

        var shinian = await DB.getAll('shinian', { orderBy: 'id' });
        var latest3Shinian = shinian.slice(-3).reverse();

        var html = '';
        var homeLatest = document.getElementById('homeLatest');

        if (latest3Shinian.length > 0) {
            for (var i = 0; i < latest3Shinian.length; i++) {
                var item = latest3Shinian[i];
                var summary = item.content ? item.content.substring(0, 80) : '';
                var displaySummary = summary + (item.content && item.content.length > 80 ? '...' : '');
                var dateDisplay = item.date || '';

                html += '<div class="list-item">';
                html += '<h3 class="item-title" data-sub="shinian-detail" data-id="' + item.id + '" style="color:' + theme.color + ';font-size:' + theme.size + 'px;font-weight:bold;">' + item.title + '</h3>';
                html += '<p class="item-desc">' + displaySummary + '</p>';
                html += '<div class="item-footer">';
                html += '<span class="tag" style="color:' + theme.color + ';">#' + (item.category || '未分类') + '</span>';
                html += '<span class="item-time">' + dateDisplay + '</span>';
                html += '</div>';
                html += '</div>';
            }
        } else {
            html = '<div class="list-item"><p class="item-desc" style="text-align:center;color:#b8b0a8;">暂无文章，请前往后台添加</p></div>';
        }

        if (homeLatest) homeLatest.innerHTML = html;
    }

    // ============================================================
    // 7. 行吟册·絮
    // ============================================================
    async function renderXingyinList() {
        var list = await DB.getAll('xingyin', { orderBy: 'id' });
        var container = document.getElementById('xingyinList');
        if (!container) return;
        var theme = getThemeConfig(await getSite());
        var html = '';
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            html += '<div class="article-item">';
            html += '<div class="article-date">' + item.date + '</div>';
            html += '<div class="article-text"><a data-sub="xingyin-detail" data-id="' + item.id + '" style="color:' + theme.color + ';font-size:' + theme.size + 'px;font-weight:bold;">' + item.content + '</a></div>';
            html += '</div>';
        }
        container.innerHTML = html || '<p style="text-align:center;color:#999;padding:40px 0;">暂无内容</p>';
    }

    async function loadXingyinDetail(id) {
        var item = await DB.getById('xingyin', id);
        if (!item) return;
        var list = await DB.getAll('xingyin', { orderBy: 'id' });
        var theme = getThemeConfig(await getSite());

        var titleEl = document.getElementById('xingyinDetailTitle');
        var dateEl = document.getElementById('xingyinDetailDate');
        var contentEl = document.getElementById('xingyinDetailContent');
        var sidebarEl = document.getElementById('xingyinSidebar');

        if (titleEl) {
            titleEl.textContent = item.content;
            titleEl.style.color = theme.color;
            titleEl.style.fontSize = theme.size + 'px';
            titleEl.style.fontWeight = 'bold';
        }
        if (dateEl) dateEl.textContent = item.date;
        if (contentEl) contentEl.innerHTML = '<p>' + item.content + '</p>';

        if (sidebarEl) {
            var html = '';
            for (var j = 0; j < list.length; j++) {
                var text = list[j].content || '';
                var displayText = text.length > 40 ? text.substring(0, 40) + '...' : text;
                html += '<a href="#" data-sub="xingyin-detail" data-id="' + list[j].id + '" style="font-size:14px;font-weight:bold;color:' + theme.color + ';display:block;margin-bottom:6px;text-decoration:none;">' + displayText + '</a>';
            }
            sidebarEl.innerHTML = html;
        }
    }

    // ============================================================
    // 8. 十年灯·文（系列描述取自 shinian_categories 表，而不是
    //    文章记录自身——后台文章表里的 category_desc 字段已废弃）
    // ============================================================
    async function getShinianCategoryDescMap() {
        var cats = await DB.getAll('shinian_categories');
        var map = {};
        for (var i = 0; i < cats.length; i++) {
            map[cats[i].name] = cats[i].desc || '';
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
        var theme = getThemeConfig(await getSite());
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
        var theme = getThemeConfig(await getSite());
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
        var theme = getThemeConfig(await getSite());

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
    // 9. 雪夜舟·图（同样从 xueye_categories 表取描述）
    // ============================================================
    async function getXueyeCategoryDescMap() {
        var cats = await DB.getAll('xueye_categories');
        var map = {};
        for (var i = 0; i < cats.length; i++) {
            map[cats[i].name] = cats[i].desc || '';
        }
        return map;
    }

    async function renderXueyeCards() {
        var list = await DB.getAll('xueye', { orderBy: 'id' });
        var descMap = await getXueyeCategoryDescMap();
        var container = document.getElementById('xueyeCards');
        if (!container) return;
        var theme = getThemeConfig(await getSite());
        var html = '';
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var indexStr = String(i + 1).padStart(2, '0');
            html += '<div class="series-card">';
            html += '<div class="card-index" style="color:' + theme.color + ';font-size:14px;">' + indexStr + ' / 系列</div>';
            html += '<h3 class="card-title" style="color:' + theme.color + ';font-size:' + theme.size + 'px;font-weight:bold;">' + item.category + '</h3>';
            html += '<p class="card-desc">' + (descMap[item.category] || '暂无描述') + '</p>';
            html += '<a class="card-link" data-sub="xueye-gallery" data-id="' + item.id + '" style="color:' + theme.color + ';font-size:14px;text-decoration:none;">进入系列&gt;</a>';
            html += '</div>';
        }
        container.innerHTML = html || '<p style="text-align:center;color:#999;padding:40px 0;">暂无内容</p>';
    }

    async function loadXueyeGallery(id) {
        var item = await DB.getById('xueye', id);
        if (!item) return;
        var container = document.getElementById('xueyeGallery');
        if (!container) return;

        var images = item.images || [];
        var count = images.length || 0;

        container.innerHTML = '';

        if (count > 0) {
            var group = document.createElement('div');
            group.className = 'gallery-group';

            var dateDiv = document.createElement('div');
            dateDiv.className = 'group-date';
            dateDiv.textContent = item.date;
            group.appendChild(dateDiv);

            var rowDiv = document.createElement('div');
            rowDiv.className = 'img-row';

            for (var j = 0; j < count; j++) {
                var imgWrap = document.createElement('div');
                imgWrap.className = 'img-wrap';
                var img = document.createElement('img');
                img.src = images[j];
                imgWrap.appendChild(img);
                rowDiv.appendChild(imgWrap);
            }
            group.appendChild(rowDiv);
            container.appendChild(group);

            var theme = getThemeConfig(await getSite());
            var infoDiv = document.createElement('div');
            infoDiv.style.cssText = 'text-align:center;padding:20px 0;color:' + theme.color + ';font-size:13px;';
            infoDiv.textContent = item.category + ' · 共 ' + count + ' 张图片';
            container.appendChild(infoDiv);
        } else {
            container.innerHTML = '<p style="text-align:center;color:#999;padding:40px 0;">暂无图片</p>';
        }
    }

    // ============================================================
    // 10. 听雨眠·记
    // ============================================================
    async function renderTingyuYears() {
        var list = await DB.getAll('tingyu', { orderBy: 'id' });
        var years = {};
        for (var i = 0; i < list.length; i++) {
            var year = list[i].year;
            if (!years[year]) years[year] = [];
            years[year].push(list[i]);
        }
        var container = document.getElementById('tingyuYears');
        if (!container) return;
        var theme = getThemeConfig(await getSite());
        var yearKeys = Object.keys(years).sort(function(a, b) { return b - a; });
        var html = '';
        for (var j = 0; j < yearKeys.length; j++) {
            var year = yearKeys[j];
            var items = years[year];
            html += '<div class="year-block">';
            html += '<div class="year-card">';
            html += '<div class="year-num" style="color:' + theme.color + ';font-size:' + theme.size + 'px;font-weight:bold;">' + year + '</div>';
            html += '<div class="year-desc">共计 ' + items.length + ' 本</div>';
            html += '</div>';
            html += '<div class="book-wrap">';
            for (var k = 0; k < items.length; k++) {
                html += '<a class="book-item" data-sub="tingyu-detail" data-year="' + year + '" data-title="' + items[k].title + '" style="color:' + theme.color + ';font-size:' + theme.size + 'px;font-weight:bold;text-decoration:none;">' + items[k].title + '</a>';
            }
            html += '</div>';
            html += '</div>';
        }
        container.innerHTML = html || '<p style="text-align:center;color:#999;padding:40px 0;">暂无内容</p>';
    }

    async function loadTingyuDetail(year, title) {
        var list = await DB.getAll('tingyu', { orderBy: 'id' });
        var items = list.filter(function(x) { return String(x.year) === String(year); });
        var target = null;
        if (title) {
            for (var j = 0; j < items.length; j++) {
                if (items[j].title === title) { target = items[j]; break; }
            }
        }
        if (!target && items.length > 0) target = items[0];
        if (!target) return;

        var theme = getThemeConfig(await getSite());

        var titleEl = document.getElementById('tingyuDetailTitle');
        var dateEl = document.getElementById('tingyuDetailDate');
        var contentEl = document.getElementById('tingyuDetailContent');
        var sidebarYearEl = document.getElementById('tingyuSidebarYear');
        var sidebarEl = document.getElementById('tingyuSidebar');

        if (titleEl) {
            titleEl.textContent = target.title;
            titleEl.style.color = theme.color;
            titleEl.style.fontSize = theme.size + 'px';
            titleEl.style.fontWeight = 'bold';
        }
        if (dateEl) dateEl.textContent = year + '年';
        if (contentEl) contentEl.innerHTML = '<p>《' + target.title + '》</p><p>年份：' + year + '</p><p>这是 ' + year + ' 年阅读的书籍之一。</p>';
        if (sidebarYearEl) {
            sidebarYearEl.textContent = year;
            sidebarYearEl.style.color = theme.color;
            sidebarYearEl.style.fontSize = theme.size + 'px';
            sidebarYearEl.style.fontWeight = 'bold';
        }

        if (sidebarEl) {
            var html = '';
            for (var k = 0; k < items.length; k++) {
                var num = String(k + 1).padStart(2, '0');
                var displayTitle = items[k].title;
                if (displayTitle.length > 40) displayTitle = displayTitle.substring(0, 40) + '...';
                html += '<li style="list-style:none;margin-bottom:6px;"><span style="color:#999;font-size:12px;">' + num + '</span> <a href="#" data-sub="tingyu-detail" data-year="' + year + '" data-title="' + items[k].title + '" style="font-size:14px;font-weight:bold;color:' + theme.color + ';text-decoration:none;">' + displayTitle + '</a></li>';
            }
            sidebarEl.innerHTML = html;
        }
    }

    // ============================================================
    // 11. 各西东·语
    // ============================================================
    async function renderGexiList() {
        var list = await DB.getAll('gexi', { orderBy: 'id' });
        var container = document.getElementById('gexiList');
        if (!container) return;
        var theme = getThemeConfig(await getSite());
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
    // 12. 山野渔夫
    // ============================================================
    async function renderAbout() {
        var list = await DB.getAll('about');
        var content = list.length > 0 ? (list[0].content || '') : '';
        var container = document.getElementById('aboutContent');
        if (!container) return;
        var theme = getThemeConfig(await getSite());
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
    // 13. 初始化
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {
        var container = document.querySelector('.container');
        if (container) container.style.marginTop = '80px';
        renderHome();
    });

    // 默认显示首页
    showPage('page-home');
})();
