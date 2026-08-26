/**
 * data.js - 前台数据加载
 */

const DataLoader = {
    /**
     * 加载指定栏目的数据
     */
    async load(key) {
        try {
            const response = await fetch(`data/${key}.md`);
            if (!response.ok) {
                throw new Error(`加载 ${key}.md 失败`);
            }
            const text = await response.text();
            return this.parse(key, text);
        } catch (error) {
            console.error('数据加载错误:', error);
            return [];
        }
    },

    /**
     * 解析不同格式的 Markdown
     */
    parse(key, text) {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
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

    /**
     * 行吟册·絮 格式: id | 内容 | 分类 | 日期
     */
    parseXingyin(lines) {
        return lines.map(line => {
            const parts = line.split('|').map(s => s.trim());
            return {
                id: parts[0] || 'xy-' + Date.now(),
                text: parts[1] || '无内容',
                category: parts[2] || '默认',
                date: parts[3] || '未知日期'
            };
        });
    },

    /**
     * 十年灯·文 格式: id | 标题 | 摘要 | 日期
     */
    parseShinian(lines) {
        return lines.map(line => {
            const parts = line.split('|').map(s => s.trim());
            return {
                id: parts[0] || 'sn-' + Date.now(),
                title: parts[1] || '无标题',
                summary: parts[2] || '无内容',
                date: parts[3] || '未知日期'
            };
        });
    },

    /**
     * 雪夜舟·图 格式: id | 日期 | 图片URL1,图片URL2,...
     */
    parseXueye(lines) {
        return lines.map(line => {
            const parts = line.split('|').map(s => s.trim());
            return {
                id: parts[0] || 'xy-' + Date.now(),
                date: parts[1] || '未知日期',
                images: parts[2] ? parts[2].split(',').map(s => s.trim()) : []
            };
        });
    },

    /**
     * 各西东·语 格式: id | 留言内容 | 日期
     */
    parseGexidong(lines) {
        return lines.map(line => {
            const parts = line.split('|').map(s => s.trim());
            return {
                id: parts[0] || 'gx-' + Date.now(),
                content: parts[1] || '无留言',
                date: parts[2] || '未知日期'
            };
        });
    },

    /**
     * 山野渔夫 格式: 简介内容（单条）
     */
    parseShanye(lines) {
        return lines.map(line => ({
            bio: line.trim()
        }));
    },

    /**
     * 加载文章详情（通过 ID）
     */
    async loadArticleById(id) {
        try {
            const response = await fetch(`articles/${id}.md`);
            if (!response.ok) {
                throw new Error(`加载文章 ${id}.md 失败`);
            }
            const text = await response.text();
            return this.parseArticle(text);
        } catch (error) {
            console.error('文章加载错误:', error);
            return null;
        }
    },

    /**
     * 解析文章 Markdown
     */
    parseArticle(text) {
        const lines = text.split('\n');
        let date = '未知日期';
        let title = '文章';
        let paragraphs = [];
        let isReadingFrontmatter = false;
        let currentParagraph = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.trim() === '---') {
                isReadingFrontmatter = !isReadingFrontmatter;
                continue;
            }

            if (isReadingFrontmatter) {
                const dateMatch = line.match(/date:\s*(.+)/);
                if (dateMatch) date = dateMatch[1].trim();
                const titleMatch = line.match(/title:\s*(.+)/);
                if (titleMatch) title = titleMatch[1].trim();
                continue;
            }

            const trimmed = line.trim();
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

        return { date, title, paragraphs };
    },

    /**
     * 加载主题设置
     */
    async loadSettings() {
        try {
            const response = await fetch('data/settings.json');
            if (!response.ok) throw new Error('加载设置失败');
            return await response.json();
        } catch (error) {
            console.error('设置加载错误:', error);
            return {
                bgImage: '',
                bgColor: '#ecebe9',
                primaryColor: '#6b5b47',
                titleColor: '#333333',
                subtitle: '春山如黛草如烟'
            };
        }
    },

    /**
     * 获取栏目标题
     */
    getKeyTitle(key) {
        const map = {
            'xingyin': '行吟册·絮',
            'shinian': '十年灯·文',
            'xueye': '雪夜舟·图',
            'gexidong': '各西东·语',
            'shanye': '山野渔夫'
        };
        return map[key] || key;
    }
};