(function() {
    // ============================================================
    // 1. 数据存储
    // ============================================================
    var DB = {
        get: function(key, def) {
            try {
                var data = localStorage.getItem('jiananshan_' + key);
                return data ? JSON.parse(data) : def;
            } catch (e) {
                return def;
            }
        },
        set: function(key, val) {
            localStorage.setItem('jiananshan_' + key, JSON.stringify(val));
        }
    };

    // ============================================================
    // 2. 默认数据初始化
    // ============================================================
    function initDefaultData() {
        if (!DB.get('site', null)) {
            DB.set('site', {
                logoColor: '#b89c84',
                logoImage: '',
                siteName: '见南山',
                siteDesc: '春山如黛草如烟',
                theme_color: '#b89c84',
                title_size: '20'
            });
        }
        if (!DB.get('xingyin', null)) {
            DB.set('xingyin', [
                { id: 1, content: '我决定，从今天开始不再热爱生活。', date: '2026/08/25' },
                { id: 2, content: '山间有雾，心里有你。', date: '2026/08/26' },
                { id: 3, content: '春水初生，春林初盛。', date: '2026/08/27' }
            ]);
        }
        if (!DB.get('shinian', null)) {
            DB.set('shinian', [
                { 
                    id: 1, 
                    title: '不再热爱生活。', 
                    category: '闲聊几句', 
                    categoryDesc: '没什么要紧事，就是灯下坐着，忽然想跟你聊几句。', 
                    content: '汤之问棘也是已：穷发之北，有冥海者，天池也。有鱼焉，其广数千里，未有知其修者，其名为鲲。有鸟焉，其名为鹏，背若泰山，翼若垂天之云，抟扶摇羊角而上者九万里，绝云气，负青天，然后图南，且适南冥也。', 
                    date: '2026-08-25 14:30:00' 
                },
                { 
                    id: 2, 
                    title: '灯火可亲', 
                    category: '灯火可亲', 
                    categoryDesc: '家事，食事，灯下琐事。外面风雨再大，推开门就小了。', 
                    content: '家是港湾，灯火是归途。无论走多远，总有一盏灯为你而亮。', 
                    date: '2026-08-26 10:15:00' 
                },
                { 
                    id: 3, 
                    title: '半杯凉茶', 
                    category: '半杯凉茶', 
                    categoryDesc: '主打冷静、清醒的观察，聊聊读到的书，遇到的人，像凉茶一样，入口微苦，却有余甘。', 
                    content: '人生如茶，苦后回甘。有时候需要一杯凉茶，让自己清醒地看世界。', 
                    date: '2026-08-27 09:00:00' 
                }
            ]);
        }
        if (!DB.get('xueye', null)) {
            DB.set('xueye', [
                { id: 1, category: '四季有信', categoryDesc: '跟随时令的自然影像——春芽、夏荷、秋叶、冬雪，同一棵树的一年十二个月。', count: 6, date: '2026/08/25', images: [] },
                { id: 2, category: '旧物不言', categoryDesc: '静物与旧物件——一把老椅子，泛黄的书页，窗台的灰尘与光影，沉默里有故事。', count: 6, date: '2026/08/26', images: [] }
            ]);
        }
        if (!DB.get('tingyu', null)) {
            DB.set('tingyu', [
                { id: 1, title: '《百年孤独》', year: '2026' },
                { id: 2, title: '《活着》', year: '2026' },
                { id: 3, title: '《局外人》', year: '2025' },
                { id: 4, title: '《追风筝的人》', year: '2026' },
                { id: 5, title: '《小王子》', year: '2025' }
            ]);
        }
        if (!DB.get('gexi', null)) {
            DB.set('gexi', [
                { id: 1, content: '各西东，语未休。', date: '2026/08/25' },
                { id: 2, content: '山高水长，江湖再见。', date: '2026/08/26' }
            ]);
        }
        if (!DB.get('about', null)) {
            DB.set('about', '山野渔夫，居南山之下。\n\n不捕鱼，只打捞日子的碎影——晨雾、夕照、一碗热汤、一盏迟归的灯。\n\n见南山，是我落脚的地方，也是把所见所感细细晾晒的小院。\n\n风来听风，雨来看雨，你来，便一起坐坐。\n\n见字如面，见山如归。');
        }
    }
    initDefaultData();

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
            var backId = backBtn.dataset.back;
            if (backId) {
                showPage('page-home');
            }
        }
    });

    // ============================================================
    // 5. 获取主题色和字号（工具函数）
    // ============================================================
    function getThemeConfig() {
        var site = DB.get('site', {});
        return {
            color: site.theme_color || site.logoColor || '#b89c84',
            size: site.title_size || '20'
        };
    }

    // ============================================================
    // 6. 渲染首页（含雪夜舟·图最新一张）
    // ============================================================
    function renderHome() {
        var site = DB.get('site', {});
        var theme = getThemeConfig();
        
        // 更新 Logo
        updateLogo(site);
        
        // 获取"行吟册·絮"最新一条数据
        var xingyinList = DB.get('xingyin', []);
        var latestXingyin = xingyinList.length > 0 ? xingyinList[xingyinList.length - 1] : null;
        
        var homeTitle = document.getElementById('homeTitle');
        var homeDate = document.getElementById('homeDate');
        if (homeTitle) {
            homeTitle.textContent = latestXingyin ? latestXingyin.content : '暂无短句';
            homeTitle.style.color = theme.color;
            homeTitle.style.fontSize = theme.size + 'px';
        }
        if (homeDate) {
            homeDate.textContent = latestXingyin ? latestXingyin.date : new Date().toISOString().slice(0, 10).replace(/-/g, '/');
        }
        
        // ★★★ 中间图片：显示雪夜舟·图最新一张 ★★★
        var homeImage = document.getElementById('homeImage');
        var xueyeList = DB.get('xueye', []);
        var latestXueye = xueyeList.length > 0 ? xueyeList[xueyeList.length - 1] : null;
        
        if (homeImage) {
            // 重置样式
            homeImage.style.backgroundImage = 'none';
            homeImage.style.backgroundColor = site.logo_color || site.logoColor || '#b89c84';
            homeImage.className = 'tilted-card';
            homeImage.style.transform = 'rotate(3deg)';
            
            if (latestXueye && latestXueye.images && latestXueye.images.length > 0) {
                // 有图片：显示图片
                homeImage.style.backgroundImage = 'url(' + latestXueye.images[0] + ')';
                homeImage.style.backgroundSize = 'cover';
                homeImage.style.backgroundPosition = 'center';
                homeImage.style.backgroundRepeat = 'no-repeat';
                homeImage.style.backgroundColor = 'transparent';
            } else {
                // 没有图片：显示主题色
                homeImage.style.backgroundImage = 'none';
                homeImage.style.backgroundColor = site.logo_color || site.logoColor || '#b89c84';
            }
        }

        var siteNameEl = document.getElementById('siteName');
        var siteDescEl = document.getElementById('siteDesc');
        if (siteNameEl) siteNameEl.textContent = site.site_name || site.siteName || '见南山';
        if (siteDescEl) siteDescEl.textContent = site.site_desc || site.siteDesc || '春山如黛草如烟';

        // 十年灯·文 最新3条
        var shinian = DB.get('shinian', []);
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

        if (homeLatest) {
            homeLatest.innerHTML = html;
        }
    }

    // ============================================================
    // 7. Logo 更新函数
    // ============================================================
    function updateLogo(site) {
        var logoBlock = document.getElementById('logoBlock');
        var logoImage = document.getElementById('logoImage');
        
        var logoImg = site.logo_image || site.logoImage || '';
        
        if (logoImage && logoImg && logoImg.trim() !== '') {
            logoImage.src = logoImg;
            logoImage.style.display = 'block';
            if (logoBlock) logoBlock.style.backgroundColor = 'transparent';
        } else {
            if (logoImage) logoImage.style.display = 'none';
            if (logoBlock) logoBlock.style.backgroundColor = site.logo_color || site.logoColor || '#b89c84';
        }
    }

    // ============================================================
    // 8. 行吟册·絮
    // ============================================================
    function renderXingyinList() {
        var list = DB.get('xingyin', []);
        var container = document.getElementById('xingyinList');
        if (!container) return;
        var theme = getThemeConfig();
        var html = '';
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            html += '<div class="article-item">';
            html += '<div class="article-date">' + item.date + '</div>';
            html += '<div class="article-text"><a data-sub="xingyin-detail" data-id="' + item.id + '" style="color:' + theme.color + ';font-size:' + theme.size + 'px;font-weight:bold;">' + item.content + '</a></div>';
            html += '</div>';
        }
        container.innerHTML = html;
    }

    function loadXingyinDetail(id) {
        var list = DB.get('xingyin', []);
        var item = null;
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === Number(id)) {
                item = list[i];
                break;
            }
        }
        if (!item) return;
        
        var theme = getThemeConfig();
        
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
                var text = list[j].content;
                var displayText = text;
                if (displayText.length > 40) {
                    displayText = displayText.substring(0, 40) + '...';
                }
                html += '<a href="#" data-sub="xingyin-detail" data-id="' + list[j].id + '" style="font-size:14px;font-weight:bold;color:' + theme.color + ';display:block;margin-bottom:6px;text-decoration:none;">' + displayText + '</a>';
            }
            sidebarEl.innerHTML = html;
        }
    }

    // ============================================================
    // 9. 十年灯·文
    // ============================================================
    function renderShinianCards() {
        var list = DB.get('shinian', []);
        var categories = [];
        for (var i = 0; i < list.length; i++) {
            if (categories.indexOf(list[i].category) === -1) {
                categories.push(list[i].category);
            }
        }
        var container = document.getElementById('shinianCards');
        if (!container) return;
        var theme = getThemeConfig();
        var html = '';
        for (var j = 0; j < categories.length; j++) {
            var cat = categories[j];
            var items = [];
            for (var k = 0; k < list.length; k++) {
                if (list[k].category === cat) {
                    items.push(list[k]);
                }
            }
            var desc = items.length > 0 ? items[0].categoryDesc || '' : '';
            var indexStr = String(j + 1).padStart(2, '0');
            html += '<div class="series-card">';
            html += '<div class="card-index" style="color:' + theme.color + ';font-size:14px;">' + indexStr + ' / 系列</div>';
            html += '<h3 class="card-title" style="color:' + theme.color + ';font-size:' + theme.size + 'px;font-weight:bold;">' + cat + '</h3>';
            html += '<p class="card-desc">' + (desc || '暂无描述') + '</p>';
            html += '<a class="card-link" data-sub="shinian-list" data-category="' + cat + '" style="color:' + theme.color + ';font-size:14px;text-decoration:none;">进入系列&gt;</a>';
            html += '</div>';
        }
        container.innerHTML = html;
    }

    function loadShinianList(category) {
        var list = DB.get('shinian', []);
        var items = [];
        for (var i = 0; i < list.length; i++) {
            if (list[i].category === category) {
                items.push(list[i]);
            }
        }
        var container = document.getElementById('shinianList');
        if (!container) return;
        var theme = getThemeConfig();
        var html = '';
        for (var j = 0; j < items.length; j++) {
            var item = items[j];
            html += '<div class="article-item">';
            html += '<div class="article-date">' + item.date + '</div>';
            html += '<div class="article-text"><a data-sub="shinian-detail" data-id="' + item.id + '" style="color:' + theme.color + ';font-size:' + theme.size + 'px;font-weight:bold;">' + item.title + '</a></div>';
            html += '</div>';
        }
        container.innerHTML = html;
    }

    function loadShinianDetail(id) {
        var list = DB.get('shinian', []);
        var item = null;
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === Number(id)) {
                item = list[i];
                break;
            }
        }
        if (!item) return;
        
        var theme = getThemeConfig();
        
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
            var sameCategory = [];
            for (var j = 0; j < list.length; j++) {
                if (list[j].category === item.category) {
                    sameCategory.push(list[j]);
                }
            }
            var html = '';
            for (var k = 0; k < sameCategory.length; k++) {
                var displayTitle = sameCategory[k].title;
                if (displayTitle.length > 40) {
                    displayTitle = displayTitle.substring(0, 40) + '...';
                }
                html += '<a href="#" data-sub="shinian-detail" data-id="' + sameCategory[k].id + '" style="font-size:14px;font-weight:bold;color:' + theme.color + ';display:block;margin-bottom:6px;text-decoration:none;">' + displayTitle + '</a>';
            }
            sidebarEl.innerHTML = html;
        }
    }

    // ============================================================
    // 10. 雪夜舟·图
    // ============================================================
    function renderXueyeCards() {
        var list = DB.get('xueye', []);
        var container = document.getElementById('xueyeCards');
        if (!container) return;
        var theme = getThemeConfig();
        var html = '';
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var indexStr = String(i + 1).padStart(2, '0');
            html += '<div class="series-card">';
            html += '<div class="card-index" style="color:' + theme.color + ';font-size:14px;">' + indexStr + ' / 系列</div>';
            html += '<h3 class="card-title" style="color:' + theme.color + ';font-size:' + theme.size + 'px;font-weight:bold;">' + item.category + '</h3>';
            html += '<p class="card-desc">' + (item.categoryDesc || '暂无描述') + '</p>';
            html += '<a class="card-link" data-sub="xueye-gallery" data-id="' + item.id + '" style="color:' + theme.color + ';font-size:14px;text-decoration:none;">进入系列&gt;</a>';
            html += '</div>';
        }
        container.innerHTML = html;
    }

    function loadXueyeGallery(id) {
        var list = DB.get('xueye', []);
        var item = null;
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === Number(id)) {
                item = list[i];
                break;
            }
        }
        if (!item) return;
        var container = document.getElementById('xueyeGallery');
        if (!container) return;
        
        var images = item.images || [];
        var count = images.length || 0;
        var theme = getThemeConfig();
        
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
            
            var infoDiv = document.createElement('div');
            infoDiv.style.cssText = 'text-align:center;padding:20px 0;color:' + theme.color + ';font-size:13px;';
            infoDiv.textContent = item.category + ' · 共 ' + count + ' 张图片';
            container.appendChild(infoDiv);
        } else {
            container.innerHTML = '<p style="text-align:center;color:#999;padding:40px 0;">暂无图片</p>';
        }
    }

    // ============================================================
    // 11. 听雨眠·记
    // ============================================================
    function renderTingyuYears() {
        var list = DB.get('tingyu', []);
        var years = {};
        for (var i = 0; i < list.length; i++) {
            var year = list[i].year;
            if (!years[year]) years[year] = [];
            years[year].push(list[i]);
        }
        var container = document.getElementById('tingyuYears');
        if (!container) return;
        var theme = getThemeConfig();
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
        container.innerHTML = html;
    }

    function loadTingyuDetail(year, title) {
        var list = DB.get('tingyu', []);
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
        
        var theme = getThemeConfig();
        
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
                if (displayTitle.length > 40) {
                    displayTitle = displayTitle.substring(0, 40) + '...';
                }
                html += '<li style="list-style:none;margin-bottom:6px;"><span style="color:#999;font-size:12px;">' + num + '</span> <a href="#" data-sub="tingyu-detail" data-year="' + year + '" data-title="' + items[k].title + '" style="font-size:14px;font-weight:bold;color:' + theme.color + ';text-decoration:none;">' + displayTitle + '</a></li>';
            }
            sidebarEl.innerHTML = html;
        }
    }

    // ============================================================
    // 12. 各西东·语
    // ============================================================
    function renderGexiList() {
        var list = DB.get('gexi', []);
        var container = document.getElementById('gexiList');
        if (!container) return;
        var theme = getThemeConfig();
        var html = '';
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            html += '<div class="article-item">';
            html += '<div class="article-date">' + item.date + '</div>';
            html += '<div class="article-text" style="color:' + theme.color + ';font-size:' + theme.size + 'px;font-weight:bold;">' + item.content + '</div>';
            html += '</div>';
        }
        container.innerHTML = html;
    }

    // ============================================================
    // 13. 山野渔夫
    // ============================================================
    function renderAbout() {
        var content = DB.get('about', '');
        var container = document.getElementById('aboutContent');
        if (!container) return;
        var theme = getThemeConfig();
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
    // 14. 数据变化监听
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
    // 15. 初始化
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {
        var container = document.querySelector('.container');
        if (container) {
            container.style.marginTop = '80px';
        }
        var site = DB.get('site', {});
        updateLogo(site);
        renderHome();
        renderXingyinList();
        renderShinianCards();
        renderXueyeCards();
        renderTingyuYears();
        renderGexiList();
        renderAbout();
    });

    // 默认显示首页
    showPage('page-home');
})();
