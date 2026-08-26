/**
 * data.js - 前台数据加载
 */

var DataLoader = {
    async load(key) {
        try {
            var response = await fetch('data/' + key + '.md');
            if (!response.ok) {
                throw new Error('加载 ' + key + '.md 失败');
            }
            var text = await response.text();
            return this.parse(key, text);
        } catch (error) {
            console.error('数据加载错误:', error);
            return [];
        }
    },

    parse: function(key, text) {
        var lines = text.split('\n').filter(function(line) {
            return line.trim() !== '';
        });

        switch (key) {
            case 'xingyin':
                return this.parseXingyin(lines);
            case 'shinian':
                return this.parseShinian(lines);
            case 'xueye':
                return this.parseXueye(lines);
            case 'gexidong':
                return this.parseGexidong(lines);
            case 'shanye':
                return this.parseShanye(lines);
            default:
                return [];
        }
    },

    // ========== 行吟册·絮 ==========
    // 格式: id | 内容 | 分类 | 日期
    parseXingyin: function(lines) {
        return lines.map(function(line) {
            var parts = line.split('|').map(function(s) {
                return s.trim();
            });
            return {
                id: parts[0] || 'xy-' + Date.now(),
                text: parts[1] || '无内容',
                category: parts[2] || '默认',
                date: parts[3] || '未知日期'
            };
        });
    },

    // ========== 十年灯·文 ==========
    // 格式: id | 标题 | 正文内容 | 分类 | 日期 | top
    parseShinian: function(lines) {
        return lines.map(function(line) {
            var parts = line.split('|').map(function(s) {
                return s.trim();
            });
            return {
                id: parts[0] || 'sn-' + Date.now(),
                title: parts[1] || '无标题',
                content: parts[2] || '',
                category: parts[3] || '',
                date: parts[4] || '未知日期',
                top: parts[5] === 'true' || false
            };
        });
    },

    // ========== 雪夜舟·图 ==========
    // 格式: id | 日期 | 分类 | 图片URL1,图片URL2,...
    parseXueye: function(lines) {
        return lines.map(function(line) {
            var parts = line.split('|').map(function(s) {
                return s.trim();
            });
            return {
                id: parts[0] || 'xy-' + Date.now(),
                date: parts[1] || '未知日期',
                category: parts[2] || '',
                images: parts[3] ? parts[3].split(',').map(function(s) {
                    return s.trim();
                }) : []
            };
        });
    },

    // ========== 各西东·语 ==========
    // 格式: id | 留言内容 | 日期
    parseGexidong: function(lines) {
        return lines.map(function(line) {
            var parts = line.split('|').map(function(s) {
                return s.trim();
            });
            return {
                id: parts[0] || 'gx-' + Date.now(),
                content: parts[1] || '无留言',
                date: parts[2] || '未知日期'
            };
        });
    },

    // ========== 山野渔夫 ==========
    parseShanye: function(lines) {
        return lines.map(function(line) {
            return { bio: line.trim() };
        });
    },

    // ========== 加载文章详情 ==========
    async loadArticleById(id) {
        try {
            var response = await fetch('articles/' + id + '.md');
            if (!response.ok) {
                throw new Error('加载文章 ' + id + '.md 失败');
            }
            var text = await response.text();
            return this.parseArticle(text);
        } catch (error) {
            console.error('文章加载错误:', error);
            return null;
        }
    },

    parseArticle: function(text) {
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

    // ========== 加载主题设置 ==========
    async loadSettings() {
        try {
            var response = await fetch('data/settings.json');
            if (!response.ok) throw new Error('加载设置失败');
            return await response.json();
        } catch (error) {
            return {
                bgImage: '',
                bgColor: '#ecebe9',
                primaryColor: '#6b5b47',
                titleColor: '#333333',
                subtitle: '春山如黛草如烟'
            };
        }
    },

    getKeyTitle: function(key) {
        var map = {
            'xingyin': '行吟册·絮',
            'shinian': '十年灯·文',
            'xueye': '雪夜舟·图',
            'gexidong': '各西东·语',
            'shanye': '山野渔夫'
        };
        return map[key] || key;
    }
};
