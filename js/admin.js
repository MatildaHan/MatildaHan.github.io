/**
 * admin.js - 南山集后台管理（GitHub API 版本）
 */

// ============================================================
// 1. 配置 - ⚠️ 请修改为你的 GitHub 信息
// ============================================================
const GITHUB_CONFIG = {
    owner: 'MatildaHan',
    repo: 'MatildaHan.github.io',
    branch: 'main',
    token: ''
};

// ============================================================
// 2. 数据文件映射
// ============================================================
const DATA_FILES = {
    xingyin: 'data/xingyin.md',
    shinian: 'data/shinian.md',
    xueye: 'data/xueye.md',
    gexidong: 'data/gexidong.md',
    shanye: 'data/shanye.md',
    settings: 'data/settings.json'
};

let currentEdit = { category: null, id: null, isNew: false };
let githubToken = '';

// ============================================================
// 3. GitHub API 操作
// ============================================================

function getToken() {
    if (githubToken) return githubToken;
    const saved = localStorage.getItem('github_token');
    if (saved) { githubToken = saved; return githubToken; }
    
    const token = prompt(
        '请输入 GitHub Personal Access Token：\n\n' +
        '获取方式：\n' +
        'GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)\n' +
        '需要 repo 权限'
    );
    if (token) {
        githubToken = token;
        localStorage.setItem('github_token', token);
        updateConnectionStatus(true);
    }
    return token;
}

async function readGitHubFile(path) {
    const token = getToken();
    if (!token) throw new Error('需要 GitHub Token');
    
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;
    const response = await fetch(url, {
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`读取失败: ${response.status}`);
    
    const data = await response.json();
    return { content: atob(data.content), sha: data.sha };
}

async function writeGitHubFile(path, content, message = '更新内容') {
    const token = getToken();
    if (!token) throw new Error('需要 GitHub Token');
    
    let sha = '';
    try {
        const existing = await readGitHubFile(path);
        if (existing) sha = existing.sha;
    } catch (e) {}
    
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            message: message,
            content: btoa(unescape(encodeURIComponent(content))),
            sha: sha,
            branch: GITHUB_CONFIG.branch
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '写入失败');
    }
    return await response.json();
}

function updateConnectionStatus(connected) {
    const el = document.getElementById('connectionStatus');
    if (connected) {
        el.textContent = '● 已连接';
        el.style.color = '#7ddf9a';
    } else {
        el.textContent = '● 未连接';
        el.style.color = '#ff6b6b';
    }
}

// ============================================================
// 4. 数据加载与保存
// ============================================================

async function loadDataFile(category) {
    const path = DATA_FILES[category];
    if (!path) return '';
    try {
        const result = await readGitHubFile(path);
        return result ? result.content : '';
    } catch (e) {
        console.error('加载失败:', e);
        showToast('加载失败: ' + e.message, 'error');
        return '';
    }
}

async function saveDataFile(category, content) {
    const path = DATA_FILES[category];
    try {
        await writeGitHubFile(path, content, `更新 ${category} 数据`);
        return true;
    } catch (e) {
        console.error('保存失败:', e);
        showToast('保存失败: ' + e.message, 'error');
        return false;
    }
}

// ============================================================
// 5. 数据解析
// ============================================================

function parseXingyin(text) {
    if (!text) return [];
    return text.split('\n').filter(line => line.trim()).map(line => {
        const parts = line.split('|').map(s => s.trim());
        return { id: parts[0] || 'xy-' + Date.now(), text: parts[1] || '', category: parts[2] || '默认', date: parts[3] || '' };
    });
}

function formatXingyin(items) {
    return items.map(item => `${item.id} | ${item.text} | ${item.category} | ${item.date}`).join('\n');
}

function parseShinian(text) {
    if (!text) return [];
    return text.split('\n').filter(line => line.trim()).map(line => {
        const parts = line.split('|').map(s => s.trim());
        return { id: parts[0] || 'sn-' + Date.now(), title: parts[1] || '', summary: parts[2] || '', date: parts[3] || '' };
    });
}

function formatShinian(items) {
    return items.map(item => `${item.id} | ${item.title} | ${item.summary} | ${item.date}`).join('\n');
}

function parseXueye(text) {
    if (!text) return [];
    return text.split('\n').filter(line => line.trim()).map(line => {
        const parts = line.split('|').map(s => s.trim());
        return { id: parts[0] || 'xy-' + Date.now(), date: parts[1] || '', images: parts[2] ? parts[2].split(',').map(s => s.trim()) : [] };
    });
}

function formatXueye(items) {
    return items.map(item => `${item.id} | ${item.date} | ${item.images.join(',')}`).join('\n');
}

function parseGexidong(text) {
    if (!text) return [];
    return text.split('\n').filter(line => line.trim()).map(line => {
        const parts = line.split('|').map(s => s.trim());
        return { id: parts[0] || 'gx-' + Date.now(), content: parts[1] || '', date: parts[2] || '' };
    });
}

function formatGexidong(items) {
    return items.map(item => `${item.id} | ${item.content} | ${item.date}`).join('\n');
}

function parseShanye(text) {
    return text ? text.trim() : '';
}

// ============================================================
// 6. 渲染表格
// ============================================================

async function renderTable(category) {
    const text = await loadDataFile(category);
    let items = [], renderFn = null;
    
    switch(category) {
        case 'xingyin': items = parseXingyin(text); renderFn = renderXingyinRow; break;
        case 'shinian': items = parseShinian(text); renderFn = renderShinianRow; break;
        case 'xueye': items = parseXueye(text); renderFn = renderXueyeRow; break;
        case 'gexidong': items = parseGexidong(text); renderFn = renderGexidongRow; break;
    }
    
    const tbody = document.getElementById(`tbody-${category}`);
    if (!tbody) return;
    
    if (items.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="5">暂无内容，点击 "新增" 添加</td></tr>`;
        return;
    }
    
    tbody.innerHTML = items.map(item => renderFn(item, category)).join('');
    updateStats(category, items.length);
}

function renderXingyinRow(item) {
    return `<tr><td>${item.id}</td><td>${escapeHtml(item.text)}</td><td>${escapeHtml(item.category)}</td><td>${item.date}</td>
        <td><button onclick="editItem('xingyin','${item.id}')" class="btn btn-primary btn-sm">✏️</button>
        <button onclick="deleteItem('xingyin','${item.id}')" class="btn btn-danger btn-sm">🗑️</button></td></tr>`;
}

function renderShinianRow(item) {
    const summary = item.summary.length > 50 ? item.summary.slice(0,50)+'...' : item.summary;
    return `<tr><td>${item.id}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(summary)}</td><td>${item.date}</td>
        <td><button onclick="editItem('shinian','${item.id}')" class="btn btn-primary btn-sm">✏️</button>
        <button onclick="deleteItem('shinian','${item.id}')" class="btn btn-danger btn-sm">🗑️</button></td></tr>`;
}

function renderXueyeRow(item) {
    const preview = item.images.slice(0, 3).map(img => 
        `<img src="${img}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;" onerror="this.style.display='none'">`
    ).join('');
    return `<tr><td>${item.id}</td><td>${item.date}</td><td>${item.images.length}</td>
        <td><div style="display:flex;gap:4px;">${preview}</div></td>
        <td><button onclick="editItem('xueye','${item.id}')" class="btn btn-primary btn-sm">✏️</button>
        <button onclick="deleteItem('xueye','${item.id}')" class="btn btn-danger btn-sm">🗑️</button></td></tr>`;
}

function renderGexidongRow(item) {
    const content = item.content.length > 40 ? item.content.slice(0,40)+'...' : item.content;
    return `<tr><td>${item.id}</td><td>${escapeHtml(content)}</td><td>${item.date}</td>
        <td><button onclick="editItem('gexidong','${item.id}')" class="btn btn-primary btn-sm">✏️</button>
        <button onclick="deleteItem('gexidong','${item.id}')" class="btn btn-danger btn-sm">🗑️</button></td></tr>`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// 7. 统计
// ============================================================

function updateStats(category, count) {
    const map = { xingyin: 'statXingyin', shinian: 'statShinian', xueye: 'statXueye', gexidong: 'statGexidong' };
    const el = document.getElementById(map[category]);
    if (el) el.textContent = count;
}

async function updateAllStats() {
    const categories = ['xingyin', 'shinian', 'xueye', 'gexidong'];
    for (const cat of categories) {
        const text = await loadDataFile(cat);
        let items = [];
        switch(cat) {
            case 'xingyin': items = parseXingyin(text); break;
            case 'shinian': items = parseShinian(text); break;
            case 'xueye': items = parseXueye(text); break;
            case 'gexidong': items = parseGexidong(text); break;
        }
        updateStats(cat, items.length);
    }
}

// ============================================================
// 8. 增删改
// ============================================================

function addItem(category) {
    currentEdit = { category, id: null, isNew: true };
    showModal(category, null, true);
}

function editItem(category, id) {
    currentEdit = { category, id, isNew: false };
    showModal(category, id, false);
}

async function deleteItem(category, id) {
    if (!confirm('确定删除吗？')) return;
    
    const text = await loadDataFile(category);
    let items = [], formatter = null;
    
    switch(category) {
        case 'xingyin': items = parseXingyin(text); formatter = formatXingyin; break;
        case 'shinian': items = parseShinian(text); formatter = formatShinian; break;
        case 'xueye': items = parseXueye(text); formatter = formatXueye; break;
        case 'gexidong': items = parseGexidong(text); formatter = formatGexidong; break;
    }
    
    items = items.filter(item => item.id !== id);
    const newText = formatter(items);
    await saveDataFile(category, newText);
    
    renderTable(category);
    updateAllStats();
    showToast('删除成功', 'success');
}

// ============================================================
// 9. 弹窗
// ============================================================

function showModal(category, id, isNew) {
    const modal = document.getElementById('editModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    const names = { xingyin: '行吟册·絮', shinian: '十年灯·文', xueye: '雪夜舟·图', gexidong: '各西东·语' };
    title.textContent = isNew ? `新增 ${names[category]}` : `编辑 ${names[category]}`;
    
    let html = '';
    const today = new Date().toISOString().slice(0,10);
    
    switch(category) {
        case 'xingyin':
            html = `
                <div class="form-group"><label>短句内容</label><textarea id="formText" rows="3"></textarea></div>
                <div class="form-group"><label>分类</label><input type="text" id="formCategory" value="默认"></div>
                <div class="form-group"><label>日期</label><input type="date" id="formDate" value="${today}"></div>
            `;
            break;
        case 'shinian':
            html = `
                <div class="form-group"><label>标题</label><input type="text" id="formTitle"></div>
                <div class="form-group"><label>摘要（列表显示）</label><textarea id="formSummary" rows="2"></textarea></div>
                <div class="form-group"><label>正文（详情页）</label><textarea id="formContent" rows="6"></textarea></div>
                <div class="form-group"><label>日期</label><input type="date" id="formDate" value="${today}"></div>
            `;
            break;
        case 'xueye':
            html = `
                <div class="form-group"><label>日期</label><input type="date" id="formDate" value="${today}"></div>
                <div class="form-group"><label>图片 URL（逗号分隔）</label><textarea id="formImages" rows="3"></textarea></div>
            `;
            break;
        case 'gexidong':
            html = `
                <div class="form-group"><label>留言内容</label><textarea id="formContent" rows="4"></textarea></div>
                <div class="form-group"><label>日期</label><input type="date" id="formDate" value="${today}"></div>
            `;
            break;
    }
    
    body.innerHTML = html;
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('editModal').classList.remove('active');
}

async function saveModal() {
    const { category, id, isNew } = currentEdit;
    const text = await loadDataFile(category);
    let items = [], formatter = null;
    
    switch(category) {
        case 'xingyin': items = parseXingyin(text); formatter = formatXingyin; break;
        case 'shinian': items = parseShinian(text); formatter = formatShinian; break;
        case 'xueye': items = parseXueye(text); formatter = formatXueye; break;
        case 'gexidong': items = parseGexidong(text); formatter = formatGexidong; break;
    }
    
    const formData = collectFormData(category);
    if (!formData) return;
    
    if (isNew) {
        const prefix = { xingyin: 'xy', shinian: 'sn', xueye: 'xy', gexidong: 'gx' }[category];
        formData.id = `${prefix}-${Date.now()}`;
        items.push(formData);
    } else {
        const index = items.findIndex(i => i.id === id);
        if (index !== -1) { formData.id = id; items[index] = formData; }
    }
    
    const newText = formatter(items);
    const success = await saveDataFile(category, newText);
    
    if (success) {
        closeModal();
        renderTable(category);
        updateAllStats();
        showToast('保存成功！正在部署...', 'success');
        await deploySite();
    }
}

function collectFormData(category) {
    const getVal = (id) => document.getElementById(id)?.value || '';
    switch(category) {
        case 'xingyin': return { text: getVal('formText'), category: getVal('formCategory') || '默认', date: getVal('formDate') };
        case 'shinian': return { title: getVal('formTitle'), summary: getVal('formSummary'), content: getVal('formContent'), date: getVal('formDate') };
        case 'xueye': return { date: getVal('formDate'), images: getVal('formImages').split(',').map(s => s.trim()).filter(Boolean) };
        case 'gexidong': return { content: getVal('formContent'), date: getVal('formDate') };
        default: return null;
    }
}

// ============================================================
// 10. 山野渔夫
// ============================================================

async function loadShanye() {
    const text = await loadDataFile('shanye');
    document.getElementById('shanyeContent').value = parseShanye(text);
}

async function saveShanye() {
    const content = document.getElementById('shanyeContent').value;
    await saveDataFile('shanye', content);
    showToast('简介保存成功！', 'success');
}

// ============================================================
// 11. 主题设置
// ============================================================

async function loadSettings() {
    const text = await loadDataFile('settings');
    if (text) {
        try {
            const settings = JSON.parse(text);
            document.getElementById('settingBgImage').value = settings.bgImage || '';
            document.getElementById('settingBgColor').value = settings.bgColor || '#ecebe9';
            document.getElementById('settingPrimaryColor').value = settings.primaryColor || '#6b5b47';
            document.getElementById('settingTitleColor').value = settings.titleColor || '#333333';
            document.getElementById('settingSubtitle').value = settings.subtitle || '春山如黛草如烟';
        } catch (e) {}
    }
}

async function saveSettings() {
    const settings = {
        bgImage: document.getElementById('settingBgImage').value,
        bgColor: document.getElementById('settingBgColor').value,
        primaryColor: document.getElementById('settingPrimaryColor').value,
        titleColor: document.getElementById('settingTitleColor').value,
        subtitle: document.getElementById('settingSubtitle').value
    };
    await saveDataFile('settings', JSON.stringify(settings, null, 2));
    showToast('主题设置保存成功！', 'success');
}

function previewSettings() {
    const bgImage = document.getElementById('settingBgImage').value;
    const bgColor = document.getElementById('settingBgColor').value;
    const primaryColor = document.getElementById('settingPrimaryColor').value;
    const titleColor = document.getElementById('settingTitleColor').value;
    const subtitle = document.getElementById('settingSubtitle').value;
    
    const modal = document.getElementById('editModal');
    document.getElementById('modalTitle').textContent = '👁️ 主题预览';
    document.getElementById('modalBody').innerHTML = `
        <div style="padding:20px;background:${bgColor};border-radius:8px;${bgImage ? `background-image:url(${bgImage});background-size:cover;` : ''}">
            <div style="background:rgba(255,255,255,0.85);padding:40px;border-radius:8px;">
                <h1 style="color:${titleColor};font-size:28px;font-weight:bold;">南山集</h1>
                <p style="color:${primaryColor};font-size:16px;">${subtitle}</p>
                <hr style="border-color:${primaryColor};margin:16px 0;">
                <p style="color:${primaryColor};font-size:14px;">预览效果</p>
                <div style="display:flex;gap:12px;margin-top:16px;">
                    <span style="background:${primaryColor};color:#fff;padding:4px 16px;border-radius:4px;">按钮</span>
                    <span style="border:1px solid ${primaryColor};color:${primaryColor};padding:4px 16px;border-radius:4px;">边框</span>
                </div>
            </div>
        </div>
    `;
    modal.classList.add('active');
    document.querySelector('.modal-footer .btn-primary').onclick = closeModal;
}

// ============================================================
// 12. 同步与部署
// ============================================================

async function syncAll() {
    showToast('正在同步数据...', 'info');
    try {
        await updateAllStats();
        await renderTable('xingyin');
        await renderTable('shinian');
        await renderTable('xueye');
        await renderTable('gexidong');
        await loadShanye();
        await loadSettings();
        showToast('同步完成！', 'success');
    } catch (e) {
        showToast('同步失败: ' + e.message, 'error');
    }
}

async function deploySite() {
    try {
        const token = getToken();
        if (!token) return;
        
        // 触发 GitHub Pages 重新部署
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/git/refs/heads/${GITHUB_CONFIG.branch}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `token ${token}` }
        });
        const data = await response.json();
        const latestSha = data.object.sha;
        
        const commitUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/git/commits`;
        await fetch(commitUrl, {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: '🚀 部署更新',
                tree: latestSha,
                parents: [latestSha]
            })
        });
        
        showToast('🚀 部署已触发，等待 1-3 分钟...', 'success');
    } catch (e) {
        showToast('✅ 数据已保存，GitHub Pages 将自动部署', 'success');
    }
}

// ============================================================
// 13. Toast
// ============================================================

function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================================================
// 14. 导航切换
// ============================================================

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        this.classList.add('active');
        
        const tab = this.dataset.tab;
        document.querySelectorAll('.tab-panel').forEach(el => el.classList.remove('active'));
        const panel = document.getElementById(`panel-${tab}`);
        if (panel) {
            panel.classList.add('active');
            if (['xingyin', 'shinian', 'xueye', 'gexidong'].includes(tab)) renderTable(tab);
            else if (tab === 'shanye') loadShanye();
            else if (tab === 'settings') loadSettings();
            else if (tab === 'dashboard') updateAllStats();
        }
    });
});

// ============================================================
// 15. 初始化
// ============================================================

const savedToken = localStorage.getItem('github_token');
if (savedToken) {
    githubToken = savedToken;
    updateConnectionStatus(true);
} else {
    updateConnectionStatus(false);
}

updateAllStats();

console.log('📝 南山集后台管理已启动');
console.log('⚠️ 请确保已配置 GitHub Token');
console.log('📖 获取 Token: GitHub Settings → Developer settings → Personal access tokens');
