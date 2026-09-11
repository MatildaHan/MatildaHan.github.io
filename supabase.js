// supabase.js —— Supabase 连接与数据访问
// ============================================================
// 连接配置
// ============================================================
const SUPABASE_URL = 'https://phvayjkoyphsyavkjcuk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_eLqmBExr2Z2GFx9FFnOjww_i3B5t_tf';

const SESSION_KEY = 'xuyu_session';

// ============================================================
// 鉴权模块
// ============================================================
const AUTH = {
    getSession: function() {
        try {
            var raw = localStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    },
    setSession: function(session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    },
    clearSession: function() {
        localStorage.removeItem(SESSION_KEY);
    },
    getAccessToken: function() {
        var s = this.getSession();
        return s && s.access_token ? s.access_token : null;
    },
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
            var msg = (data && (data.error_description || data.msg || data.error)) || '登录失败';
            throw new Error(msg);
        }
        this.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user: data.user,
            expires_at: Date.now() + (data.expires_in || 3600) * 1000
        });
        return data;
    },
    signOut: async function() {
        var session = this.getSession();
        if (session && session.access_token) {
            try {
                await fetch(SUPABASE_URL + '/auth/v1/logout', {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': 'Bearer ' + session.access_token
                    }
                });
            } catch (e) {}
        }
        this.clearSession();
    },
    refresh: async function() {
        var session = this.getSession();
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
            this.setSession({
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                user: data.user,
                expires_at: Date.now() + (data.expires_in || 3600) * 1000
            });
            return true;
        } catch (e) { return false; }
    },
    isLoggedIn: async function() {
        var session = this.getSession();
        if (!session || !session.access_token) return false;
        if (session.expires_at && Date.now() > session.expires_at) {
            var ok = await this.refresh();
            if (!ok) {
                this.clearSession();
                return false;
            }
            session = this.getSession();
        }
        try {
            var res = await fetch(SUPABASE_URL + '/auth/v1/user', {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + session.access_token
                }
            });
            if (res.ok) return true;
            this.clearSession();
            return false;
        } catch (e) { return true; }
    },
    getUserEmail: function() {
        var s = this.getSession();
        return s && s.user ? s.user.email : '';
    }
};

function authHeaders(forWrite) {
    var token = (forWrite && AUTH.getAccessToken()) || SUPABASE_ANON_KEY;
    return {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };
}

// ============================================================
// 数据库操作
// ============================================================
const DB = {
    getAll: async function(table, options) {
        options = options || {};
        try {
            var url = SUPABASE_URL + '/rest/v1/' + table + '?select=*';
            if (options.orderBy) url += '&order=' + options.orderBy + '.desc';
            if (options.limit) url += '&limit=' + options.limit;
            var response = await fetch(url, { headers: authHeaders(false) });
            if (!response.ok) throw new Error('Network error');
            var data = await response.json();
            localStorage.setItem('xuyu_' + table, JSON.stringify(data));
            return data;
        } catch (e) {
            console.warn('Supabase 请求失败，使用 localStorage:', e);
            var data = localStorage.getItem('xuyu_' + table);
            return data ? JSON.parse(data) : [];
        }
    },
    getById: async function(table, id) {
        try {
            var response = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + id, {
                headers: authHeaders(false)
            });
            var data = await response.json();
            return data.length > 0 ? data[0] : null;
        } catch (e) {
            console.warn('获取单条失败:', e);
            return null;
        }
    },
    insert: async function(table, data) {
        try {
            var headers = authHeaders(true);
            headers['Prefer'] = 'return=representation';
            var response = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('insert failed: ' + response.status);
            var result = await response.json();
            var cached = localStorage.getItem('xuyu_' + table);
            if (cached) {
                var list = JSON.parse(cached);
                if (result.length > 0) {
                    var exists = list.some(function(item) { return item.id === result[0].id; });
                    if (!exists) {
                        list.push(result[0]);
                        localStorage.setItem('xuyu_' + table, JSON.stringify(list));
                    }
                }
            }
            return result.length > 0 ? result[0] : null;
        } catch (e) {
            console.warn('插入失败:', e);
            return null;
        }
    },
    update: async function(table, id, data) {
        try {
            var headers = authHeaders(true);
            headers['Prefer'] = 'return=representation';
            var response = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + id, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('update failed: ' + response.status);
            var result = await response.json();
            var cached = localStorage.getItem('xuyu_' + table);
            if (cached) {
                var list = JSON.parse(cached);
                for (var i = 0; i < list.length; i++) {
                    if (list[i].id === Number(id)) {
                        for (var key in data) list[i][key] = data[key];
                        break;
                    }
                }
                localStorage.setItem('xuyu_' + table, JSON.stringify(list));
            }
            return result.length > 0 ? result[0] : null;
        } catch (e) {
            console.warn('更新失败:', e);
            return null;
        }
    },
    delete: async function(table, id) {
        try {
            var response = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + id, {
                method: 'DELETE',
                headers: authHeaders(true)
            });
            if (!response.ok) throw new Error('delete failed: ' + response.status);
            var cached = localStorage.getItem('xuyu_' + table);
            if (cached) {
                var list = JSON.parse(cached);
                var newList = [];
                for (var i = 0; i < list.length; i++) {
                    if (list[i].id !== Number(id)) newList.push(list[i]);
                }
                localStorage.setItem('xuyu_' + table, JSON.stringify(newList));
            }
            return { success: true };
        } catch (e) {
            console.warn('删除失败:', e);
            return { success: false };
        }
    },
    get: function(key, def) {
        try {
            var data = localStorage.getItem('xuyu_' + key);
            return data ? JSON.parse(data) : def;
        } catch (e) { return def; }
    },
    set: function(key, val) {
        localStorage.setItem('xuyu_' + key, JSON.stringify(val));
    }
};

window.DB = DB;
window.AUTH = AUTH;
window.SUPABASE_URL = SUPABASE_URL;

console.log('✅ Supabase 已加载');
