// script.js —— 须臾之间 前端逻辑
(function() {
    var DB = window.DB;

    // ============================================================
    // 站点信息
    // ============================================================
    var _siteCache = null;

    async function getSite() {
        if (_siteCache) return _siteCache;
        var list = await DB.getAll('site_settings');
        _siteCache = list && list.length > 0 ? list[0] : {};
        return _siteCache;
    }

    // ============================================================
    // 页面导航
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
        if (pageId === 'page-suibi') renderSuibiList();
        if (pageId === 'page-zaji') renderZajiPage();
        if (pageId === 'page-xianhua') renderXianhua();
    }

    for (var i = 0; i < navLinks.length; i++) {
        navLinks[i].addEventListener('click', function(e) {
            e.preventDefault();
            var page = this.dataset.page;
            if (page) showPage(page);
        });
    }

    // ============================================================
    // 内部跳转
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
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    if (sub === 'zaji-detail') loadZajiDetail(target.dataset.id);
                }
            }
            return;
        }

        var backBtn = e.target.closest('[data-back]');
        if (backBtn) {
            e.preventDefault();
            var backId = backBtn.dataset.back;
            if (backId) showPage(backId);
        }
    });

    // ============================================================
    // Logo
    // ============================================================
    function updateLogo(site) {
        var siteNameEl = document.getElementById('siteName');
        var siteDescEl = document.getElementById('siteDesc');
        if (siteNameEl) siteNameEl.textContent = site.site_name || '须臾之间';
        if (siteDescEl) siteDescEl.textContent = site.site_desc || '寄蜉蝣于天地，渺沧海之一粟';
    }

    // ============================================================
    // 打字机
    // ============================================================
    var bannerFullText = '写信告诉我，今夜你想要梦什么';
    var bannerTextEl = document.getElementById('bannerText');
    var bannerBtnEl = document.getElementById('bannerBtn');
    var typewriterTimer = null;
    var typewriterDone = false;

    function startTypewriter() {
        if (typewriterDone) return;
        var index = 0;
        bannerTextEl.innerHTML = '<span class="cursor"></span>';
        typewriterTimer = setInterval(function() {
            if (index < bannerFullText.length) {
                var current = bannerFullText.substring(0, index + 1);
                bannerTextEl.innerHTML = current + '<span class="cursor"></span>';
                index++;
            } else {
                clearInterval(typewriterTimer);
                typewriterTimer = null;
                typewriterDone = true;
                setTimeout(function() {
                    bannerTextEl.innerHTML = bannerFullText;
                    bannerBtnEl.classList.add('show');
                }, 400);
            }
        }, 120);
    }

    // ============================================================
    // 序章首页
    // ============================================================
    async function renderHome() {
        var site = await getSite();
        updateLogo(site);

        // 随笔：取最新 6 条
        var suibiList = await DB.getAll('suibi', { orderBy: 'id' });
        var essayContainer = document.getElementById('homeSuibi');
        if (essayContainer) {
            var displayList = suibiList.slice(-6);
            var html = '';
            for (var i = 0; i < displayList.length; i++) {
                var item = displayList[i];
                html += '<div class="essay-card">';
                html += '<div class="essay-text">' + (item.content || '') + '</div>';
                html += '<div class="essay-date">' + (item.date || '') + '</div>';
                html += '</div>';
            }
            if (displayList.length === 0) {
                html = '<div class="essay-card"><div class="essay-text" style="color:#7a6a5a;">暂无随笔</div></div>';
            }
            essayContainer.innerHTML = html;
        }

        // 杂记：取最新 3 条
        var zajiList = await DB.getAll('zaji', { orderBy: 'id' });
        var noteContainer = document.getElementById('homeZaji');
        if (noteContainer) {
            var latestThree = zajiList.slice(-3).reverse();
            var html2 = '';
            for (var j = 0; j < latestThree.length; j++) {
                var z = latestThree[j];
                var summary = z.content ? z.content.substring(0, 60) : '';
                if (z.content && z.content.length > 60) summary += '...';
                html2 += '<div class="note-item" data-sub="zaji-detail" data-id="' + z.id + '">';
                html2 += '  <div class="note-thumb"></div>';
                html2 += '  <div class="note-body">';
                html2 += '    <div class="note-title">' + (z.title || '无标题') + '</div>';
                html2 += '    <div class="note-summary">' + summary + '</div>';
                html2 += '  </div>';
                html2 += '</div>';
            }
            if (latestThree.length === 0) {
                html2 = '<p style="color:#7a6a5a;padding:20px 0;">暂无杂记</p>';
            }
            noteContainer.innerHTML = html2;
        }

        if (!typewriterDone) startTypewriter();
    }

    // ============================================================
    // 随笔列表
    // ============================================================
    async function renderSuibiList() {
        var list = await DB.getAll('suibi', { orderBy: 'id' });
        var container = document.getElementById('suibiList');
        if (!container) return;

        var leftHtml = '';
        var rightHtml = '';

        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var colIndex = Math.floor(i / 2);
            var z = list.length - colIndex;

            var card = '<div class="article-item" style="z-index:' + z + ';">';
            card += '  <div class="article-date">' + (item.date || '') + '</div>';
            card += '  <div class="article-text">' + (item.content || '') + '</div>';
            card += '</div>';

            if (i % 2 === 0) leftHtml += card;
            else rightHtml += card;
        }

        container.innerHTML =
            '<div class="suibi-col">' + leftHtml + '</div>' +
            '<div class="suibi-col">' + rightHtml + '</div>';
    }

    // ============================================================
    // 杂记页面
    // ============================================================
    var _currentZajiCategory = null;

    async function renderZajiPage() {
        var list = await DB.getAll('zaji', { orderBy: 'id' });
        var categories = await DB.getAll('zaji_categories', { orderBy: 'id' });

        if (categories.length === 0) {
            var catSet = {};
            for (var i = 0; i < list.length; i++) {
                if (list[i].category) catSet[list[i].category] = true;
            }
            categories = Object.keys(catSet).map(function(name) {
                return { name: name };
            });
        }

        var seriesContainer = document.getElementById('zajiSeriesList');
        if (seriesContainer) {
            var seriesHtml = '';
            for (var j = 0; j < categories.length; j++) {
                var cat = categories[j];
                var activeClass = (_currentZajiCategory === cat.name) ? ' active' : '';
                seriesHtml += '<a class="zaji-series-item' + activeClass + '" data-series="' + cat.name + '">' + cat.name + '</a>';
            }
            seriesContainer.innerHTML = seriesHtml;
        }

        renderZajiArticleList(list);
    }

    function renderZajiArticleList(list) {
        var container = document.getElementById('zajiArticleList');
        if (!container) return;

        var filtered = list;
        if (_currentZajiCategory) {
            filtered = list.filter(function(x) {
                return x.category === _currentZajiCategory;
            });
        }

        var sorted = filtered.slice().reverse();

        if (sorted.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#7a6a5a;padding:40px 0;">暂无文章</p>';
            return;
        }

        var html = '';
        for (var i = 0; i < sorted.length; i++) {
            var item = sorted[i];
            html += '<div class="zaji-article-item">';
            html += '<a class="zaji-article-title" data-sub="zaji-detail" data-id="' + item.id + '">' + (item.title || '无标题') + '</a>';
            html += '<span class="zaji-article-tag">#' + (item.category || '未分类') + '</span>';
            html += '<span class="zaji-article-date">' + (item.date || '') + '</span>';
            html += '</div>';
        }
        container.innerHTML = html;
    }

    document.addEventListener('click', function(e) {
        var seriesItem = e.target.closest('.zaji-series-item');
        if (seriesItem) {
            e.preventDefault();
            var series = seriesItem.dataset.series;
            if (_currentZajiCategory === series) _currentZajiCategory = null;
            else _currentZajiCategory = series;

            DB.getAll('zaji', { orderBy: 'id' }).then(function(list) {
                renderZajiArticleList(list);
                var items = document.querySelectorAll('.zaji-series-item');
                for (var i = 0; i < items.length; i++) {
                    items[i].classList.remove('active');
                    if (items[i].dataset.series === _currentZajiCategory) {
                        items[i].classList.add('active');
                    }
                }
            });
            return;
        }
    });

    // ============================================================
    // 杂记详情
    // ============================================================
    async function loadZajiDetail(id) {
        var item = await DB.getById('zaji', id);
        if (!item) return;

        var titleEl = document.getElementById('zajiDetailTitle');
        var dateEl = document.getElementById('zajiDetailDate');
        var contentEl = document.getElementById('zajiDetailContent');

        if (titleEl) titleEl.textContent = item.title;
        if (dateEl) dateEl.textContent = item.date;
        if (contentEl) contentEl.innerHTML = '<p>' + (item.content || '').replace(/\n/g, '</p><p>') + '</p>';
    }

    // ============================================================
    // 闲话
    // ============================================================
    async function renderXianhua() {
        var list = await DB.getAll('xianhua');
        var content = list.length > 0 ? (list[0].content || '') : '';
        var container = document.getElementById('xianhuaContent');
        if (!container) return;
        var lines = content.split('\n');
        var html = '';
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line) html += '<p>' + line + '</p>';
        }
        container.innerHTML = html;
    }

    // ============================================================
    // 初始化
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {
        showPage('page-home');
    });
})();
