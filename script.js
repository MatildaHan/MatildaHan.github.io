(function() {
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

    // 初始化默认数据
    function initDefaultData() {
        if (!DB.get('site', null)) {
            DB.set('site', {
                logoColor: '#b89c84',
                logoImage: '',  // 新增：Logo 图片 Base64 或 URL
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
                { id: 4, title: '旧椅子时光', category: '旧椅子时光', categoryDesc: '主打回忆与故人。就像坐在一把吱呀作响的老椅子上，把从前的事，慢慢摇给你听。', content: '记忆就像一把旧椅子，坐上去就会想起很多事。', date: '2026/08/28' },
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
    // 2. 页面导航
    // ============================================================
    const sections = document.querySelectorAll('.page-section');
    const navLinks = document.querySelectorAll('#globalNav a');

    function showPage(pageId) {
        sections.forEach(sec => sec.classList.remove('active'));
        const target = document.getElementById(pageId);
        if (target) target.classList.add('active');

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === pageId) {
                link.classList.add('active');
            }
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 加载对应页面数据
        if (pageId === 'page-home') renderHome();
        if (pageId === 'page-xingyin') renderXingyinList();
        if (pageId === 'page-shinian') renderShinianCards();
        if (pageId === 'page-xueye') renderXueyeCards();
        if (pageId === 'page-tingyu') renderTingyuYears();
        if (pageId === 'page-gexi') renderGexiList();
        if (pageId === 'page-about') renderAbout();
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page) showPage(page);
        });
    });

    // ============================================================
    // 3. 页面跳转（data-sub / data-back）
    // ============================================================
    document.addEventListener('click', function(e) {
        const target = e.target.closest('[data-sub]');
        if (target) {
            e.preventDefault();
            const sub = target.dataset.sub;
            if (sub) {
                const section = document.getElementById(sub);
                if (section) {
                    sections.forEach(sec => sec.classList.remove('active'));
                    section.classList.add('active');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    // 加载子页面数据
                    if (sub === 'xingyin-detail') loadXingyinDetail(target.dataset.id);
                    if (sub === 'shinian-list') loadShinianList(target.dataset.category);
                    if (sub === 'shinian-detail') loadShinianDetail(target.dataset.id);
                    if (sub === 'xueye-gallery') loadXueyeGallery(target.dataset.id);
                    if (sub === 'tingyu-detail') loadTingyuDetail(target.dataset.year, target.dataset.title);
                }
            }
            return;
        }

        const backBtn = e.target.closest('[data-back]');
        if (backBtn) {
            e.preventDefault();
            const backId = backBtn.dataset.back;
            if (backId) {
                showPage('page-home');
            }
        }
    });

    // ============================================================
    // 4. 渲染首页
    // ============================================================
    function renderHome() {
    const site = DB.get('site', {});
    
    // 更新 Logo
    updateLogo(site);
    
    // 获取"行吟册·絮"最新一条数据
    const xingyinList = DB.get('xingyin', []);
    const latestXingyin = xingyinList.length > 0 ? xingyinList[xingyinList.length - 1] : null;
    
    // 如果有数据则显示，否则显示默认文案
    if (latestXingyin) {
        document.getElementById('homeTitle').textContent = latestXingyin.content;
        document.getElementById('homeDate').textContent = latestXingyin.date;
    } else {
        document.getElementById('homeTitle').textContent = '暂无短句';
        document.getElementById('homeDate').textContent = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
    }
    
    document.getElementById('homeImage').style.backgroundColor = site.logoColor || '#b89c84';

    // 网站名称和描述
    document.getElementById('siteName').textContent = site.siteName || '见南山';
    document.getElementById('siteDesc').textContent = site.siteDesc || '春山如黛草如烟';

    // 只展示十年灯·文，最多3条（保持不变）
    const shinian = DB.get('shinian', []);
    const latest3Shinian = shinian.slice(-3).reverse();

    let html = '';
    latest3Shinian.forEach((item, index) => {
        const summary = item.content ? item.content.substring(0, 50) : '';
        const displaySummary = summary + (item.content && item.content.length > 50 ? '...' : '');
        
        html += `
            <div class="list-item">
                <div class="item-header">
                    <span class="tag">${item.category || '十年灯·文'}</span>
                    <h3 class="item-title" data-sub="shinian-detail" data-id="${item.id}">${item.title}</h3>
                    <span class="item-time">${item.date}</span>
                </div>
                <p class="item-desc">${displaySummary}</p>
                ${index < latest3Shinian.length - 1 ? '<span class="divider-line"></span>' : ''}
            </div>
        `;
    });

    if (latest3Shinian.length === 0) {
        html = `
            <div class="list-item">
                <p class="item-desc" style="text-align:center;color:#b8b0a8;">暂无文章，请前往后台添加</p>
            </div>
        `;
    }

    document.getElementById('homeLatest').innerHTML = html;
}
    // ============================================================
    // 5. Logo 更新函数
    // ============================================================
    function updateLogo(site) {
        const logoBlock = document.getElementById('logoBlock');
        const logoImage = document.getElementById('logoImage');
        
        if (site.logoImage && site.logoImage.trim() !== '') {
            // 有图片 Logo
            logoImage.src = site.logoImage;
            logoImage.style.display = 'block';
            logoBlock.style.backgroundColor = 'transparent';
        } else {
            // 无图片，使用颜色
            logoImage.style.display = 'none';
            logoBlock.style.backgroundColor = site.logoColor || '#b89c84';
        }
    }

    // ============================================================
    // 6. 行吟册·絮
    // ============================================================
    function renderXingyinList() {
        const list = DB.get('xingyin', []);
        const container = document.getElementById('xingyinList');
        container.innerHTML = list.map(item => `
            <div class="article-item">
                <div class="article-date">${item.date}</div>
                <div class="article-text"><a data-sub="xingyin-detail" data-id="${item.id}">${item.content}</a></div>
            </div>
        `).join('');
    }

    function loadXingyinDetail(id) {
        const list = DB.get('xingyin', []);
        const item = list.find(i => i.id === Number(id));
        if (!item) return;
        document.getElementById('xingyinDetailTitle').textContent = item.content;
        document.getElementById('xingyinDetailDate').textContent = item.date;
        document.getElementById('xingyinDetailContent').innerHTML = `<p>${item.content}</p>`;
        const sidebar = document.getElementById('xingyinSidebar');
        sidebar.innerHTML = list.map(i => `
            <a href="#" data-sub="xingyin-detail" data-id="${i.id}">${i.content.substring(0, 20)}${i.content.length > 20 ? '...' : ''}</a>
        `).join('');
    }

    // ============================================================
    // 7. 十年灯·文
    // ============================================================
    function renderShinianCards() {
        const list = DB.get('shinian', []);
        const categories = [...new Set(list.map(i => i.category))];
        const container = document.getElementById('shinianCards');
        container.innerHTML = categories.map((cat, idx) => {
            const items = list.filter(i => i.category === cat);
            const desc = items.length > 0 ? items[0].categoryDesc || '' : '';
            return `
                <div class="series-card">
                    <div class="card-index">${String(idx + 1).padStart(2, '0')} / 系列</div>
                    <h3 class="card-title">${cat}</h3>
                    <p class="card-desc">${desc || '暂无描述'}</p>
                    <a class="card-link" data-sub="shinian-list" data-category="${cat}">进入系列&gt;</a>
                </div>
            `;
        }).join('');
    }

    function loadShinianList(category) {
        const list = DB.get('shinian', []);
        const items = list.filter(i => i.category === category);
        const container = document.getElementById('shinianList');
        container.innerHTML = items.map(item => `
            <div class="article-item">
                <div class="article-date">${item.date}</div>
                <div class="article-text"><a data-sub="shinian-detail" data-id="${item.id}">${item.title}</a></div>
            </div>
        `).join('');
    }

    function loadShinianDetail(id) {
        const list = DB.get('shinian', []);
        const item = list.find(i => i.id === Number(id));
        if (!item) return;
        document.getElementById('shinianDetailTitle').textContent = item.title;
        document.getElementById('shinianDetailDate').textContent = item.date;
        document.getElementById('shinianDetailContent').innerHTML = `<p>${item.content.replace(/\n/g, '</p><p>')}</p>`;
        document.getElementById('shinianSidebarTitle').textContent = `系列 / ${item.category}`;
        const sidebar = document.getElementById('shinianSidebar');
        const sameCategory = list.filter(i => i.category === item.category);
        sidebar.innerHTML = sameCategory.map(i => `
            <a href="#" data-sub="shinian-detail" data-id="${i.id}">${i.title}</a>
        `).join('');
    }

    // ============================================================
    // 8. 雪夜舟·图
    // ============================================================
    function renderXueyeCards() {
        const list = DB.get('xueye', []);
        const container = document.getElementById('xueyeCards');
        container.innerHTML = list.map((item, idx) => `
            <div class="series-card">
                <div class="card-index">${String(idx + 1).padStart(2, '0')} / 系列</div>
                <h3 class="card-title">${item.category}</h3>
                <p class="card-desc">${item.categoryDesc || '暂无描述'}</p>
                <a class="card-link" data-sub="xueye-gallery" data-id="${item.id}">进入系列&gt;</a>
            </div>
        `).join('');
    }

    function loadXueyeGallery(id) {
        const list = DB.get('xueye', []);
        const item = list.find(i => i.id === Number(id));
        if (!item) return;
        const container = document.getElementById('xueyeGallery');
        const images = Array.from({ length: item.count || 6 }, (_, i) => 
            `<div class="img-placeholder"></div>`
        ).join('');
        container.innerHTML = `
            <div class="gallery-group">
                <div class="group-date">${item.date}</div>
                <div class="img-row">${images}</div>
            </div>
            <div style="text-align:center;padding:20px 0;color:#9c836e;font-size:13px;">
                ${item.category} · 共 ${item.count || 6} 张图片
            </div>
        `;
    }

    // ============================================================
    // 9. 听雨眠·记
    // ============================================================
    function renderTingyuYears() {
        const list = DB.get('tingyu', []);
        const years = {};
        list.forEach(item => {
            if (!years[item.year]) years[item.year] = [];
            years[item.year].push(item);
        });
        const container = document.getElementById('tingyuYears');
        container.innerHTML = Object.keys(years).sort((a, b) => b - a).map(year => {
            const items = years[year];
            return `
                <div class="year-block">
                    <div class="year-card">
                        <div class="year-num">${year}</div>
                        <div class="year-desc">共计 ${items.length} 本</div>
                        <a class="year-link" data-sub="tingyu-detail" data-year="${year}">进入系列&gt;</a>
                    </div>
                    <div class="book-wrap">
                        ${items.map(book => `
                            <a class="book-item" data-sub="tingyu-detail" data-year="${year}" data-title="${book.title}">${book.title}</a>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    function loadTingyuDetail(year, title) {
        const list = DB.get('tingyu', []);
        const items = list.filter(i => i.year === year);
        const target = title ? items.find(i => i.title === title) : items[0];
        if (!target) return;
        document.getElementById('tingyuDetailTitle').textContent = target.title;
        document.getElementById('tingyuDetailDate').textContent = `${year}年`;
        document.getElementById('tingyuDetailContent').innerHTML = `
            <p>《${target.title}》</p>
            <p>年份：${year}</p>
            <p>这是 ${year} 年阅读的书籍之一。</p>
        `;
        document.getElementById('tingyuSidebarYear').textContent = year;
        const sidebar = document.getElementById('tingyuSidebar');
        sidebar.innerHTML = items.map((book, idx) => `
            <li>${String(idx + 1).padStart(2, '0')} <a href="#" data-sub="tingyu-detail" data-year="${year}" data-title="${book.title}">${book.title}</a></li>
        `).join('');
    }

    // ============================================================
    // 10. 各西东·语
    // ============================================================
    function renderGexiList() {
        const list = DB.get('gexi', []);
        const container = document.getElementById('gexiList');
        container.innerHTML = list.map(item => `
            <div class="article-item">
                <div class="article-date">${item.date}</div>
                <div class="article-text">${item.content}</div>
            </div>
        `).join('');
    }

    // ============================================================
    // 11. 山野渔夫
    // ============================================================
    function renderAbout() {
        const content = DB.get('about', '');
        const container = document.getElementById('aboutContent');
        container.innerHTML = content.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
    }

    // ============================================================
    // 12. 初始化
    // ============================================================
    window.addEventListener('storage', function(e) {
        if (e.key && e.key.startsWith('jiananshan_')) {
            const active = document.querySelector('.page-section.active');
            if (active) {
                const id = active.id;
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

    showPage('page-home');
})();
