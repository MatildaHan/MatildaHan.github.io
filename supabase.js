// ============================================================
// Supabase 连接配置
// ============================================================

// ⚠️ 重要：部署到 Vercel 时，这些值会从环境变量读取
// 本地开发时，请将下面的值替换为你的 Supabase 项目信息
const SUPABASE_URL = 'https://phvayjkoyphsyavkjcuk.supabase.co';   // ← Data API 中的 API URL
const SUPABASE_ANON_KEY = 'sb_publishable_uunGD7DLA9YWwtkl5mgEvw_Z95hid4l';     // ← API Keys 中的 Publishable key

// ============================================================
// 鉴权模块（AUTH）
// ------------------------------------------------------------
// 说明：后台登录不再使用"从数据表里读密码、前端明文比较"的方式，
// 改为调用 Supabase 内置的 Auth 服务（/auth/v1/token）。
// 密码校验在 Supabase 服务端完成，前端始终拿不到密码本身，
// 也无法通过在控制台里手动写 localStorage 来伪造登录状态——
// 因为后续所有写操作都会带上这里签发的 access_token，
// 只要 Supabase 表配置了「仅 authenticated 角色可写」的 RLS 策略，
// 伪造的 localStorage 标记位就不再具备任何实际权限。
//
// 需要你在 Supabase 后台完成一次性配置（前端代码无法代为完成）：
// 1. Authentication → Users 中新增一个管理员账号（邮箱 + 密码）。
// 2. 各内容表（xingyin / shinian / shinian_categories / xueye /
//    xueye_categories / tingyu / gexi / about / site_settings）：
//      - SELECT 策略：允许 anon 角色（前台展示需要匿名可读）。
//      - INSERT / UPDATE / DELETE 策略：仅允许 authenticated 角色。
// 3. 旧的 admin_users 表已不再被本文件使用，可以保留作为管理员
//    资料展示用，或直接删除。
// ============================================================
const SESSION_KEY = 'jns_session';

const AUTH = {
    // 从本地读取会话（access_token 等）
    getSession: function() {
        try {
            var raw = localStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    setSession: function(session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    },

    clearSession: function() {
        localStorage.removeItem(SESSION_KEY);
    },

    // 当前可用的访问令牌；未登录时返回 null
    getAccessToken: function() {
        var s = AUTH.getSession();
        return s && s.access_token ? s.access_token : null;
    },

    // 登录：email + password，成功后保存 access_token / refresh_token
    signIn: async function(email, password) {
        var res = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, password: password })
        });
        var data = await res.json();
        if (!res.ok) {
            var msg = (data && (data.error_description || data.msg || data.error)) || '登录失败，请检查邮箱和密码';
            throw new Error(msg);
        }
        AUTH.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user: data.user,
            expires_at: Date.now() + (data.expires_in || 3600) * 1000
        });
        return data;
    },

    // 退出登录：通知 Supabase 失效当前 token，并清空本地会话
    signOut: async function() {
        var session = AUTH.getSession();
        if (session && session.access_token) {
            try {
                await fetch(SUPABASE_URL + '/auth/v1/logout', {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': 'Bearer ' + session.access_token
                    }
                });
            } catch (e) {
                // 网络失败也没关系，本地会话依然会被清空
            }
        }
        AUTH.clearSession();
    },

    // 尝试用 refresh_token 换取新的 access_token（过期时使用）
    refresh: async function() {
        var session = AUTH.getSession();
        if (!session || !session.refresh_token) return false;
        try {
            var res = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh_token: session.refresh_token })
            });
            var data = await res.json();
            if (!res.ok) return false;
            AUTH.setSession({
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                user: data.user,
                expires_at: Date.now() + (data.expires_in || 3600) * 1000
            });
            return true;
        } catch (e) {
            return false;
        }
    },

    // 校验当前会话是否仍然有效（向 Supabase 请求当前用户信息）
    isLoggedIn: async function() {
        var session = AUTH.getSession();
        if (!session || !session.access_token) return false;

        // 本地已过期，先尝试刷新
        if (session.expires_at && Date.now() > session.expires_at) {
            var ok = await AUTH.refresh();
            if (!ok) {
                AUTH.clearSession();
                return false;
            }
            session = AUTH.getSession();
        }

        try {
            var res = await fetch(SUPABASE_URL + '/auth/v1/user', {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + session.access_token
                }
            });
            if (res.ok) return true;
            AUTH.clearSession();
            return false;
        } catch (e) {
            // 网络异常时，不强制登出，避免断网就被踢出后台
            return true;
        }
    },

    getUserEmail: function() {
        var s = AUTH.getSession();
        return s && s.user ? s.user.email : '';
    }
};

// ============================================================
// 数据库操作封装
// ------------------------------------------------------------
// 读请求（getAll / getById）使用 anon key 即可（前台匿名访问）。
// 写请求（insert / update / delete）优先携带登录用户的 access_token，
// 未登录时回退到 anon key（此时若 RLS 配置正确，会被服务端拒绝）。
// 网络请求失败时，统一降级为 localStorage，保证离线/预览也能演示。
// ============================================================
function authHeaders(forWrite) {
    var token = (forWrite && AUTH.getAccessToken()) || SUPABASE_ANON_KEY;
    return {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + token
    };
}

const DB = {
    // 获取所有数据
    getAll: async function(table, options) {
        options = options || {};
        try {
            var url = SUPABASE_URL + '/rest/v1/' + table + '?select=*';
            if (options.orderBy) {
                url += '&order=' + options.orderBy + '.desc';
            }
            if (options.limit) {
                url += '&limit=' + options.limit;
            }

            var response = await fetch(url, { headers: authHeaders(false) });
            if (!response.ok) throw new Error('Network error');
            return await response.json();
        } catch (e) {
            console.warn('Supabase 请求失败，使用 localStorage:', e);
            var data = localStorage.getItem('jiananshan_' + table);
            return data ? JSON.parse(data) : [];
        }
    },

    // 获取单条数据
    getById: async function(table, id) {
        try {
            var response = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + id, {
                headers: authHeaders(false)
            });
            var data = await response.json();
            return data.length > 0 ? data[0] : null;
        } catch (e) {
            console.warn('获取单条失败，使用 localStorage:', e);
            var allData = localStorage.getItem('jiananshan_' + table);
            if (allData) {
                var list = JSON.parse(allData);
                for (var i = 0; i < list.length; i++) {
                    if (list[i].id === Number(id)) {
                        return list[i];
                    }
                }
            }
            return null;
        }
    },

    // 新增数据（写操作，需登录态 token）
    insert: async function(table, data) {
        try {
            var headers = authHeaders(true);
            headers['Content-Type'] = 'application/json';
            headers['Prefer'] = 'return=representation';
            var response = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('insert failed: ' + response.status);
            var result = await response.json();
            return result.length > 0 ? result[0] : null;
        } catch (e) {
            console.warn('插入失败，使用 localStorage:', e);
            var existing = localStorage.getItem('jiananshan_' + table);
            var list = existing ? JSON.parse(existing) : [];
            var newItem = Object.assign({ id: Date.now() + Math.random() * 1000 }, data);
            list.push(newItem);
            localStorage.setItem('jiananshan_' + table, JSON.stringify(list));
            return newItem;
        }
    },

    // 更新数据（写操作，需登录态 token）
    update: async function(table, id, data) {
        try {
            var headers = authHeaders(true);
            headers['Content-Type'] = 'application/json';
            headers['Prefer'] = 'return=representation';
            var response = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + id, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('update failed: ' + response.status);
            var result = await response.json();
            return result.length > 0 ? result[0] : null;
        } catch (e) {
            console.warn('更新失败，使用 localStorage:', e);
            var existing = localStorage.getItem('jiananshan_' + table);
            if (existing) {
                var list = JSON.parse(existing);
                for (var i = 0; i < list.length; i++) {
                    if (list[i].id === Number(id)) {
                        for (var key in data) {
                            list[i][key] = data[key];
                        }
                        break;
                    }
                }
                localStorage.setItem('jiananshan_' + table, JSON.stringify(list));
            }
            return null;
        }
    },

    // 删除数据（写操作，需登录态 token）
    delete: async function(table, id) {
        try {
            var response = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + id, {
                method: 'DELETE',
                headers: authHeaders(true)
            });
            if (!response.ok) throw new Error('delete failed: ' + response.status);
            return { success: true };
        } catch (e) {
            console.warn('删除失败，使用 localStorage:', e);
            var existing = localStorage.getItem('jiananshan_' + table);
            if (existing) {
                var list = JSON.parse(existing);
                var newList = [];
                for (var i = 0; i < list.length; i++) {
                    if (list[i].id !== Number(id)) {
                        newList.push(list[i]);
                    }
                }
                localStorage.setItem('jiananshan_' + table, JSON.stringify(newList));
            }
            return { success: true };
        }
    }
};

// 暴露到全局
window.DB = DB;
window.AUTH = AUTH;
window.SUPABASE_URL = SUPABASE_URL;
