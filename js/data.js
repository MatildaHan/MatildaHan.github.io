/**
 * data.js - 从 Markdown 文件加载数据
 * 使用 fetch API 读取 data/ 目录下的 .md 文件
 */

const DataLoader = {
    /**
     * 加载指定栏目的数据
     * @param {string} key - 栏目标识: xingyin | shinian | xueye | gexidong | shanye
     * @returns {Promise<Array>} 数据数组
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
            // 返回空数组，避免页面崩溃
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
     * 行吟册·絮 格式:
     * - 内容 | 日期
     * 示例: 不再热爱生活。 | 2026/08/25
     */
    parseXingyin(lines) {
        return lines.map(line => {
            const parts = line.split('|').map(s => s.trim());
            return {
                text: parts[0] || '无内容',
                date: parts[1] || '未知日期'
            };
        });
    },

    /**
     * 十年灯·文 格式:
     * - 标题 | 摘要内容
     * 示例: 夜雨寄北 | 君问归期未有期，巴山夜雨涨秋池...
     */
    parseShinian(lines) {
        return lines.map(line => {
            const parts = line.split('|').map(s => s.trim());
            return {
                title: parts[0] || '无标题',
                content: parts[1] || '无内容'
            };
        });
    },

    /**
     * 雪夜舟·图 格式:
     * - 日期 | 图片数量 | 图片URL1,图片URL2,...
     * 示例: 2026/08/20 | 7 | #,#,#,#,#,#,#
     */
    parseXueye(lines) {
        return lines.map(line => {
            const parts = line.split('|').map(s => s.trim());
            const date = parts[0] || '未知日期';
            const urls = parts[2] ? parts[2].split(',').map(s => s.trim()) : [];
            // 如果指定了数量但没给URL，用占位符填充
            const count = parseInt(parts[1]) || urls.length || 1;
            const imgs = urls.length >= count ? urls.slice(0, count) : 
                         urls.concat(Array(count - urls.length).fill('#'));
            return { date, imgs };
        });
    },

    /**
     * 各西东·语 格式:
     * - 昵称 | 留言内容
     * 示例: 晚风叙旧 | 人间风月皆过客，山河万里寄相思...
     */
    parseGexidong(lines) {
        return lines.map(line => {
            const parts = line.split('|').map(s => s.trim());
            return {
                nickname: parts[0] || '匿名',
                message: parts[1] || '无留言',
                avatar: '#' // 头像占位
            };
        });
    },

    /**
     * 山野渔夫 格式:
     * - 简介内容 (每行一条)
     */
    parseShanye(lines) {
        return lines.map(line => ({
            bio: line.trim()
        }));
    },

    /**
     * 加载文章详情 (从 articles/ 目录)
     * @param {string} title - 文章标题
     * @returns {Promise<Object>} 文章数据 { date, paragraphs }
     */
    async loadArticle(title) {
        try {
            // 将标题转为文件名: 夜雨寄北 -> 夜雨寄北.md
            const response = await fetch(`articles/${title}.md`);
            if (!response.ok) {
                throw new Error(`加载文章 ${title}.md 失败`);
            }
            const text = await response.text();
            return this.parseArticle(text);
        } catch (error) {
            console.error('文章加载错误:', error);
            return null;
        }
    },

    /**
     * 解析文章 Markdown 格式:
     * ---
     * date: 2026/08/20
     * ---
     * 
     * 正文内容...
     * 多段文字用空行分隔
     */
    parseArticle(text) {
        const lines = text.split('\n');
        let date = '未知日期';
        let paragraphs = [];
        let isReadingFrontmatter = false;
        let isReadingContent = false;
        let currentParagraph = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // 检测 Frontmatter (---)
            if (line.trim() === '---') {
                if (!isReadingFrontmatter) {
                    isReadingFrontmatter = true;
                    continue;
                } else {
                    isReadingFrontmatter = false;
                    isReadingContent = true;
                    continue;
                }
            }

            // 解析 Frontmatter
            if (isReadingFrontmatter) {
                const match = line.match(/date:\s*(.+)/);
                if (match) {
                    date = match[1].trim();
                }
                continue;
            }

            // 解析正文
            if (isReadingContent || !isReadingFrontmatter) {
                const trimmed = line.trim();
                if (trimmed === '') {
                    // 空行：保存当前段落
                    if (currentParagraph.length > 0) {
                        paragraphs.push(currentParagraph.join(' '));
                        currentParagraph = [];
                    }
                } else {
                    currentParagraph.push(trimmed);
                }
            }
        }

        // 保存最后一段
        if (currentParagraph.length > 0) {
            paragraphs.push(currentParagraph.join(' '));
        }

        // 如果没有解析到任何段落，把整个内容当作一段
        if (paragraphs.length === 0) {
            paragraphs = [text.replace(/---/g, '').trim()];
        }

        return { date, paragraphs };
    }
};