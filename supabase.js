// ============================================================
// Supabase 连接配置
// ============================================================

// ⚠️ 重要：部署到 Vercel 时，这些值会从环境变量读取
// 本地开发时，请将下面的值替换为你的 Supabase 项目信息
const SUPABASE_URL = 'https://phvayjkoyphsyavkjcuk.supabase.co';   // ← Data API 中的 API URL
const SUPABASE_ANON_KEY = 'sb_publishable_uunGD7DLA9YWwtkl5mgEvw_Z95hid4l';     // ← API Keys 中的 Publishable key
// ============================================================
// 数据库操作封装
// ============================================================
const DB = {
    // 获取所有数据
    getAll: async function(table, options) {
        options = options || {};
        try {
            let url = SUPABASE_URL + '/rest/v1/' + table + '?select=*';
            if (options.orderBy) {
                url += '&order=' + options.orderBy + '.desc';
            }
            if (options.limit) {
                url += '&limit=' + options.limit;
            }

            var response = await fetch(url, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
                }
            });
            if (!response.ok) throw new Error('Network error');
            return await response.json();
        } catch (e) {
            console.warn('Supabase 请求失败:', e);
            return [];
        }
    },

    // 获取单条数据
    getById: async function(table, id) {
        try {
            var response = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + id, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
                }
            });
            var data = await response.json();
            return data.length > 0 ? data[0] : null;
        } catch (e) {
            console.warn('获取单条失败:', e);
            return null;
        }
    },

    // 新增数据
    insert: async function(table, data) {
        try {
            var response = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(data)
            });
            var result = await response.json();
            return result.length > 0 ? result[0] : null;
        } catch (e) {
            console.warn('插入失败:', e);
            return null;
        }
    },

    // 更新数据
    update: async function(table, id, data) {
        try {
            var response = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + id, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(data)
            });
            var result = await response.json();
            return result.length > 0 ? result[0] : null;
        } catch (e) {
            console.warn('更新失败:', e);
            return null;
        }
    },

    // 删除数据
    delete: async function(table, id) {
        try {
            await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + id, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
                }
            });
            return { success: true };
        } catch (e) {
            console.warn('删除失败:', e);
            return { success: false };
        }
    }
};

// 暴露到全局
window.DB = DB;
window.SUPABASE_URL = SUPABASE_URL;
