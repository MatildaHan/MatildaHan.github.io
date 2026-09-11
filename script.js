// script.js
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

        var backBtn = e.target.closest('[data-back]');
        if (backBtn) {
            e.preventDefault();
            var backId = backBtn.dataset.back;
            if (backId) {
                showPage(backId);
            }
        }
    });

    // ============================================================
    // 5. Logo 更新
    // ============================================================
    function updateLogo(site) {
        var siteNameEl = document.getElementById('siteName');
        var siteDescEl = document.getElementById('siteDesc');
        if (siteNameEl) siteNameEl.textContent = site.site_name || '须臾之间';
        if (siteDescEl) siteDescEl.textContent = site.site_desc || '寄蜉蝣于天地，渺沧海之一粟';
    }

    // ============================================================
    // 6. 打字机效果
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
    // 7. 首页
    // ============================================================
    async function renderHome() {
        var site = await getSite();
        updateLogo(site);

        // ① 随笔（行吟册）—— 最多6条
        var xingyinList = await DB.getAll('xingyin', { orderBy: 'id' });
        var essayContainer = document.getElementById('homeXingyin');
        if (essayContainer) {
            var displayList = xingyinList.slice(-6).reverse();
            var html = '';
            for (var i = 0; i < displayList.length; i++) {
                var item = displayList[i];
                html += '<div class="essay-card">';
                html += '<div class="essay-text">' + (item.content || '') + '</div>';
                html += '<div class="essay-date">' + (item.date || '') + '</div>';
                html += '</div>';
            }
            if (displayList.length === 0) {
                html = '<p style="text-align:center;color:#7a6a5a;padding:40px 0;">暂无随笔</p>';
            }
            essayContainer.innerHTML = html;
        }

        // ② 杂记（十年灯）—— 最新3条
        var shinian = await DB.getAll('shinian', { orderBy: 'id' });
        var noteContainer = document.getElementById('homeShinian');
        if (noteContainer) {
            var latestThree = shinian.slice(-3).reverse();
            var html2 = '';
            for (var j = 0; j < latestThree.length; j++) {
                var s = latestThree[j];
                html2 += '<div class="note-item" data-sub="shinian-detail" data-id="' + s.id + '">';
                html2 += '<div class="note-title">' + (s.title || '无标题') + '</div>';
                html2 += '<div class="note-meta">';
                html2 += '<span class="note-tag">#' + (s.category || '未分类') + '</span>';
                html2 += '<span>' + (s.date || '') + '</span>';
                html2 += '</div>';
                html2 += '</div>';
            }
            if (latestThree.length === 0) {
                html2 = '<p style="text-align:center;color:#7a6a5a;padding:40px 0;">暂无杂记</p>';
            }
            noteContainer.innerHTML = html2;
        }

        // 启动打字机（只执行一次）
        if (!typewriterDone) {
            startTypewriter();
        }
    }

    // ============================================================
    // 8. 随笔（行吟册）列表
    // ============================================================
    async function renderXingyinList() {
        var list = await DB.getAll('xingyin', { orderBy: 'id' });
        var container = document.getElementById('xingyinList');
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

            if (i % 2 === 0) {
                leftHtml += card;
            } else {
                rightHtml += card;
            }
        }

        container.innerHTML =
            '<div class="xingyin-col">' + leftHtml + '</div>' +
            '<div class="xingyin-col">' + rightHtml + '</div>';
    }

    // ============================================================
    // 9. 杂记（十年灯）页面
    // ============================================================
    var _currentShinianCategory = null;

    async function renderShinianPage() {
        var list = await DB.getAll('shinian', { orderBy: 'id' });
        var categories = await DB.getAll('shinian_categories', { orderBy: 'id' });

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
            container.innerHTML = '<p style="text-align:center;color:#7a6a5a;padding:40px 0;">暂无文章</p>';
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
    // 10. 杂记 文章详情
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
    // 11. 闲话（山野渔夫）
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
