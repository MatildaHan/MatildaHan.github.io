/**
 * data.js - 前台数据加载（直接读取 GitHub）
 */

var GITHUB_CONFIG = {
    owner: 'MatildaHan',
    repo: 'MatildaHan.github.io',
    branch: 'main'
};

var DATA_FILES = {
    xingyin: 'data/xingyin.md',
    shinian: 'data/shinian.md',
    xueye: 'data/xueye.md',
    gexidong: 'data/gexidong.md',
    shanye: 'data/shanye.md',
    settings: 'data/settings.json'
};

var DataLoader = {
    async load(key) {
        try {
            var url = 'https://raw.githubusercontent.com/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/' + GITHUB_CONFIG.branch + '/' + DATA_FILES[key];
            var response = await fetch(url);
            if (!response.ok) {
                if (response.status === 404) return [];
                throw new Error('加载失败: ' + response.status);
            }
            var text = await response.text();
            return this.parse(key, text);
        } catch (error) {
            console.error('数据加载错误:', error);
            return [];
        }
    },

    parse(key, text) {
        var lines = text.split('\n').filter(function(line) { return line.trim() !== ''; });
        
        switch (key) {
            case 'xingyin': return this.parseXingyin(lines);
            case 'shinian': return this.parseShinian(lines);
            case 'xueye': return this.parseXueye(lines);
            case 'gexidong': return this.parseGexidong(lines);
            case 'shanye': return this.parseShanye(lines);
            default: return [];
        }
    },

    parseXingyin(lines) {
        return lines.map(function(line) {
            var parts = line.split('|').map(function(s) { return s.trim(); });
            return { id: parts[0] || 'xy-' + Date.now(), text: parts[1] || '无内容', category: parts[2] || '默认', date: parts[3] || '未知日期' };
        });
    },

    parseShinian(lines) {
        return lines.map(function(line) {
            var parts = line.split('|').map(function(s) { return s.trim(); });
            return { id: parts[0] || 'sn-' + Date.now(), title: parts[1] || '无标题', summary: parts[2] || '无内容', date: parts[3] || '未知日期' };
        });
    },

    parseXueye(lines) {
        return lines.map(function(line) {
            var parts = line.split('|').map(function(s) { return s.trim(); });
            return { id: parts[0] || 'xy-' + Date.now(), date: parts[1] || '未知日期', images: parts[2] ? parts[2].split(',').map(function(s) { return s.trim(); }) : [] };
        });
    },

    parseGexidong(lines) {
        return lines.map(function(line) {
            var parts = line.split('|').map(function(s) { return s.trim(); });
            return { id: parts[0] || 'gx-' + Date.now(), content: parts[1] || '无留言', date: parts[2] || '未知日期' };
        });
    },

    parseShanye(lines) {
        return lines.map(function(line) {
            return { bio: line.trim() };
        });
    },

    async loadArticleById(id) {
        try {
            var url = 'https://raw.githubusercontent.com/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/' + GITHUB_CONFIG.branch + '/articles/' + id + '.md';
            var response = await fetch(url);
            if (!response.ok) return null;
            var text = await response.text();
            return this.parseArticle(text);
        } catch (error) {
            console.error('文章加载错误:', error);
            return null;
        }
    },

    parseArticle(text) {
        var lines = text.split('\n');
        var date = '未知日期';
        var title = '文章';
        var paragraphs = [];
        var isReadingFrontmatter = false;
        var currentParagraph = [];

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.trim() === '---') {
                isReadingFrontmatter = !isReadingFrontmatter;
                continue;
            }
            if (isReadingFrontmatter) {
                var dateMatch = line.match(/date:\s*(.+)/);
                if (dateMatch) date = dateMatch[1].trim();
                var titleMatch = line.match(/title:\s*(.+)/);
                if (titleMatch) title = titleMatch[1].trim();
                continue;
            }
            var trimmed = line.trim();
            if (trimmed === '') {
                if (currentParagraph.length > 0) {
                    paragraphs.push(currentParagraph.join(' '));
                    currentParagraph = [];
                }
            } else if (!trimmed.startsWith('---')) {
                currentParagraph.push(trimmed);
            }
        }
        if (currentParagraph.length > 0) {
            paragraphs.push(currentParagraph.join(' '));
        }
        if (paragraphs.length === 0) {
            paragraphs = [text.replace(/---/g, '').trim() || '暂无内容'];
        }
        return { date: date, title: title, paragraphs: paragraphs };
    },

    async loadSettings() {
        try {
            var url = 'https://raw.githubusercontent.com/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/' + GITHUB_CONFIG.branch + '/data/settings.json';
            var response = await fetch(url);
            if (!response.ok) return { bgImage: '', bgColor: '#ecebe9', primaryColor: '#6b5b47', titleColor: '#333333', subtitle: '春山如黛草如烟' };
            return await response.json();
        } catch (error) {
            return { bgImage: '', bgColor: '#ecebe9', primaryColor: '#6b5b47', titleColor: '#333333', subtitle: '春山如黛草如烟' };
        }
    },

    getKeyTitle: function(key) {
        var map = { 'xingyin': '行吟册·絮', 'shinian': '十年灯·文', 'xueye': '雪夜舟·图', 'gexidong': '各西东·语', 'shanye': '山野渔夫' };
        return map[key] || key;
    }
};
