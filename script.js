(function() {
    // ============================================================
    // 页面导航
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
            if (pageId === 'page-home') {
                container.style.marginTop = '80px';
            } else {
                container.style.marginTop = '30px';
            }
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
    // 页面跳转
    // ============================================================
    document.addEventListener('click', function(e) {
        var target = e.target.closest('[data-sub]');
        if (target) {
            e.preventDefault();
            var sub = target.dataset.sub;
            if (sub) {
                var section = document.getElementById(sub);
                if (section) {
                    var i;
                    for (i = 0; i < sections.length; i++) {
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
            showPage('page-home');
        }
    });

    // ============================================================
    // 渲染首页
    // ============================================================
    async function renderHome() {
        var site = await DB.getAll('site_settings');
        site = site.length > 0 ? site[0] : {};

        // Logo
        var logoBlock = document.getElementById('logoBlock');
        var logoImage = document.getElementById('logoImage');
        if (logoImage && site.logo_image && site.logo_image.trim() !== '') {
            logoImage.src = site.logo_image;
            logoImage.style.display = 'block';
            if (logoBlock) logoBlock.style.backgroundColor = 'transparent';
        } else {
            if (logoImage) logoImage.style.display = 'none';
            if (logoBlock) logoBlock.style.backgroundColor = site.logo_color || '#b89c84';
        }

        var homeImage = document.getElementById('homeImage');
        if (homeImage) {
            homeImage.style.backgroundColor = site.logo_color || '#b89c84';
        }

        var siteNameEl = document.getElementById('siteName');
        var siteDescEl = document.getElementById('siteDesc');
        if (siteNameEl) siteNameEl.textContent = site.site_name || '见南山';
        if (siteDescEl) siteDescEl.textContent = site.site_desc || '春山如黛草如烟';

        // 行吟册·絮 最新一条
        var xingyinList = await DB.getAll('xingyin', { orderBy: 'id' });
        var latestXingyin = xingyinList.length > 0 ? xingyinList[xingyinList.length - 1] : null;

        var homeTitle = document.getElementById('homeTitle');
        var homeDate = document.getElementById('homeDate');
        if (homeTitle) {
            homeTitle.textContent = latestXingyin ? latestXingyin.content : '暂无短句';
        }
        if (homeDate) {
            homeDate.textContent = latestXingyin ? latestXingyin.date : new Date().toISOString().slice(0, 10).replace(/-/g, '/');
        }

        // 十年灯·文 最新3条
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
                html += '<h3 class="item-title" data-sub="shinian-detail" data-id="' + item.id + '">' + item.title + '</h3>';
                html += '<p class="item-desc">' + displaySummary + '</p>';
                html += '<div class="item-footer">';
                html += '<span class="tag">#' + (item.category || '未分类') + '</span>';
                html += '<span class="item-time">' + dateDisplay + '</span>';
                html += '</div>';
                html += '</div>';
            }
        } else {
            html = '<div class="list-item"><p class="item-desc" style="text-align:center;color:#b8b0a8;">暂无文章，请前往后台添加</p></div>';
        }

        if (homeLatest) {
            homeLatest.innerHTML = html;
        }
    }

    // ============================================================
    // 行吟册·絮
    // ============================================================
    async function renderXingyinList() {
        var list = await DB.getAll('xingyin', { orderBy: 'id' });
        var container = document.getElementById('xingyinList');
        if (!container) return;
        var html = '';
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            html += '<div class="article-item">';
            html += '<div class="article-date">' + item.date + '</div>';
            html += '<div class="article-text"><a data-sub="xingyin-detail" data-id="' + item.id + '">' + item.content + '</a></div>';
            html += '</div>';
        }
        container.innerHTML = html;
    }

    async function loadXingyinDetail(id) {
        var item = await DB.getById('xingyin', id);
        if (!item) return;

        var titleEl = document.getElementById('xingyinDetailTitle');
        var dateEl = document.getElementById('xingyinDetailDate');
        var contentEl = document.getElementById('xingyinDetailContent');
        var sidebarEl = document.getElementById('xingyinSidebar');

        if (titleEl) titleEl.textContent = item.content;
        if (dateEl) dateEl.textContent = item.date;
        if (contentEl) contentEl.innerHTML = '<p>' + item.content + '</p>';

        var list = await DB.getAll('xingyin', { orderBy: 'id' });
        if (sidebarEl) {
            var html = '';
            for (var j = 0; j < list.length; j++) {
                var text = list[j].content;
                var displayText = text.substring(0, 20) + (text.length > 20 ? '...' : '');
                html += '<a href="#" data-sub="xingyin-detail" data-id="' + list[j].id + '">' + displayText + '</a>';
            }
            sidebarEl.innerHTML = html;
        }
    }

    // ============================================================
    // 十年灯·文
    // ============================================================
    async function renderShinianCards() {
        var list = await DB.getAll('shinian', { orderBy: 'id' });
        var categories = [];
        for (var i = 0; i < list.length; i++) {
            if (categories.indexOf(list[i].category) === -1) {
                categories.push(list[i].category);
            }
        }
        var container = document.getElementById('shinianCards');
        if (!container) return;
        var html = '';
        for (var j = 0; j < categories.length; j++) {
            var cat = categories[j];
            var items = [];
            for (var k = 0; k < list.length; k++) {
                if (list[k].category === cat) {
                    items.push(list[k]);
                }
            }
            var desc = items.length > 0 ? items[0].category_desc || '' : '';
            var indexStr = String(j + 1).padStart(2, '0');
            html += '<div class="series-card">';
            html += '<div class="card-index">' + indexStr + ' / 系列</div>';
            html += '<h3 class="card-title">' + cat + '</h3>';
            html += '<p class="card-desc">' + (desc || '暂无描述') + '</p>';
            html += '<a class="card-link" data-sub="shinian-list" data-category="' + cat + '">进入系列&gt;</a>';
            html += '</div>';
        }
        container.innerHTML = html;
    }

    async function loadShinianList(category) {
        var list = await DB.getAll('shinian', { orderBy: 'id' });
        var items = [];
        for (var i = 0; i < list.length; i++) {
            if (list[i].category === category) {
                items.push(list[i]);
            }
        }
        var container = document.getElementById('shinianList');
        if (!container) return;
        var html = '';
        for (var j = 0; j < items.length; j++) {
            var item = items[j];
            html += '<div class="article-item">';
            html += '<div class="article-date">' + item.date + '</div>';
            html += '<div class="article-text"><a data-sub="shinian-detail" data-id="' + item.id + '">' + item.title + '</a></div>';
            html += '</div>';
        }
        container.innerHTML = html;
    }

    async function loadShinianDetail(id) {
        var item = await DB.getById('shinian', id);
        if (!item) return;

        var titleEl = document.getElementById('shinianDetailTitle');
        var dateEl = document.getElementById('shinianDetailDate');
        var contentEl = document.getElementById('shinianDetailContent');
        var sidebarTitleEl = document.getElementById('shinianSidebarTitle');
        var sidebarEl = document.getElementById('shinianSidebar');

        if (titleEl) titleEl.textContent = item.title;
        if (dateEl) dateEl.textContent = item.date;
        if (contentEl) contentEl.innerHTML = '<p>' + item.content.replace(/\n/g, '</p><p>') + '</p>';
        if (sidebarTitleEl) sidebarTitleEl.textContent = '系列 / ' + item.category;

        var list = await DB.getAll('shinian', { orderBy: 'id' });
        if (sidebarEl) {
            var sameCategory = [];
            for (var j = 0; j < list.length; j++) {
                if (list[j].category === item.category) {
                    sameCategory.push(list[j]);
                }
            }
            var html = '';
            for (var k = 0; k < sameCategory.length; k++) {
                html += '<a href="#" data-sub="shinian-detail" data-id="' + sameCategory[k].id + '">' + sameCategory[k].title + '</a>';
            }
            sidebarEl.innerHTML = html;
        }
    }

    // ============================================================
    // 雪夜舟·图
    // ============================================================
    async function renderXueyeCards() {
        var list = await DB.getAll('xueye', { orderBy: 'id' });
        var container = document.getElementById('xueyeCards');
        if (!container) return;
        var html = '';
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var indexStr = String(i + 1).padStart(2, '0');
            html += '<div class="series-card">';
            html += '<div class="card-index">' + indexStr + ' / 系列</div>';
            html += '<h3 class="card-title">' + item.category + '</h3>';
            html += '<p class="card-desc">' + (item.category_desc || '暂无描述') + '</p>';
            html += '<a class="card-link" data-sub="xueye-gallery" data-id="' + item.id + '">进入系列&gt;</a>';
            html += '</div>';
        }
        container.innerHTML = html;
    }

    async function loadXueyeGallery(id) {
        var item = await DB.getById('xueye', id);
        if (!item) return;
        var container = document.getElementById('xueyeGallery');
        if (!container) return;
        var count = item.count || 6;
        var images = '';
        for (var j = 0; j < count; j++) {
            images += '<div class="img-placeholder"></div>';
        }
        container.innerHTML = '';
        var group = document.createElement('div');
        group.className = 'gallery-group';
        var dateDiv = document.createElement('div');
        dateDiv.className = 'group-date';
        dateDiv.textContent = item.date;
        group.appendChild(dateDiv);
        var rowDiv = document.createElement('div');
        rowDiv.className = 'img-row';
        rowDiv.innerHTML = images;
        group.appendChild(rowDiv);
        container.appendChild(group);

        var infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'text-align:center;padding:20px 0;color:#9c836e;font-size:13px;';
        infoDiv.textContent = item.category + ' · 共 ' + (item.count || 6) + ' 张图片';
        container.appendChild(infoDiv);
    }

    // ============================================================
    // 听雨眠·记
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
        var yearKeys = Object.keys(years).sort(function(a, b) { return b - a; });
        var html = '';
        for (var j = 0; j < yearKeys.length; j++) {
            var year = yearKeys[j];
            var items = years[year];
            html += '<div class="year-block">';
            html += '<div class="year-card">';
            html += '<div class="year-num">' + year + '</div>';
            html += '<div class="year-desc">共计 ' + items.length + ' 本</div>';
            html += '<a class="year-link" data-sub="tingyu-detail" data-year="' + year + '">进入系列&gt;</a>';
            html += '</div>';
            html += '<div class="book-wrap">';
            for (var k = 0; k < items.length; k++) {
                html += '<a class="book-item" data-sub="tingyu-detail" data-year="' + year + '" data-title="' + items[k].title + '">' + items[k].title + '</a>';
            }
            html += '</div>';
            html += '</div>';
        }
        container.innerHTML = html;
    }

    async function loadTingyuDetail(year, title) {
        var list = await DB.getAll('tingyu', { orderBy: 'id' });
        var items = [];
        for (var i = 0; i < list.length; i++) {
            if (list[i].year === year) {
                items.push(list[i]);
            }
        }
        var target = null;
        if (title) {
            for (var j = 0; j < items.length; j++) {
                if (items[j].title === title) {
                    target = items[j];
                    break;
                }
            }
        }
        if (!target && items.length > 0) target = items[0];
        if (!target) return;

        var titleEl = document.getElementById('tingyuDetailTitle');
        var dateEl = document.getElementById('tingyuDetailDate');
        var contentEl = document.getElementById('tingyuDetailContent');
        var sidebarYearEl = document.getElementById('tingyuSidebarYear');
        var sidebarEl = document.getElementById('tingyuSidebar');

        if (titleEl) titleEl.textContent = target.title;
        if (dateEl) dateEl.textContent = year + '年';
        if (contentEl) contentEl.innerHTML = '<p>《' + target.title + '》</p><p>年份：' + year + '</p><p>这是 ' + year + ' 年阅读的书籍之一。</p>';
        if (sidebarYearEl) sidebarYearEl.textContent = year;

        if (sidebarEl) {
            var html = '';
            for (var k = 0; k < items.length; k++) {
                var num = String(k + 1).padStart(2, '0');
                html += '<li>' + num + ' <a href="#" data-sub="tingyu-detail" data-year="' + year + '" data-title="' + items[k].title + '">' + items[k].title + '</a></li>';
            }
            sidebarEl.innerHTML = html;
        }
    }

    // ============================================================
    // 各西东·语
    // ============================================================
    async function renderGexiList() {
        var list = await DB.getAll('gexi', { orderBy: 'id' });
        var container = document.getElementById('gexiList');
        if (!container) return;
        var html = '';
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            html += '<div class="article-item">';
            html += '<div class="article-date">' + item.date + '</div>';
            html += '<div class="article-text">' + item.content + '</div>';
            html += '</div>';
        }
        container.innerHTML = html;
    }

    // ============================================================
    // 山野渔夫
    // ============================================================
    async function renderAbout() {
        var list = await DB.getAll('about');
        var content = list.length > 0 ? list[0].content : '';
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
    // 数据变化监听
    // ============================================================
    window.addEventListener('storage', function(e) {
        if (e.key && e.key.indexOf('jiananshan_') === 0) {
            var active = document.querySelector('.page-section.active');
            if (active) {
                var id = active.id;
                if (id === 'page-home') renderHome();
                if (id === 'page-xingyin') renderXingyinList();
                if (id === 'page-shinian') renderShinianCards();
                if (id === 'page-xueye') renderXueyeCards();
                if (id === 'page-tingyu') renderTingyuYears();
                if (id === 'page-gexi') renderGexiList();
                if (id === 'page-about') renderAbout();
            }
        }
    });

    // ============================================================
    // 初始化
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {
        var container = document.querySelector('.container');
        if (container) {
            container.style.marginTop = '80px';
        }
    });

    showPage('page-home');
})();