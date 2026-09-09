// ============================================================
// Supabase 连接配置
// ============================================================

const SUPABASE_URL = 'https://phvayjkoephsyavkjcuk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_eLqmBExr2Z2GFx9FFnOjww_i3B5t_tf';

// ============================================================
// 鉴权模块（AUTH）
// ============================================================
const SESSION_KEY = 'jns_session';

const AUTH = {
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
        } catch (e) {
            return false;
        }
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
        } catch (e) {
            return true;
        }
    },
    getUserEmail: function() {
        var s = this.getSession();
        return s && s.user ? s.user.email : '';
    }
};

// ============================================================
// 数据库操作封装
// ============================================================
function authHeaders(forWrite) {
    var token = (forWrite && AUTH.getAccessToken()) || SUPABASE_ANON_KEY;
    return {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + token
    };
}

const DB = {
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
            console.warn('插入失败:', e);
            return null;
        }
    },
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
            return { success: true };
        } catch (e) {
            console.warn('删除失败:', e);
            return { success: false };
        }
    },
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
// Storage 操作封装
// ============================================================
const STORAGE = {
    BUCKET: 'jiananshan-images',

    upload: async function(file, path) {
        try {
            var token = AUTH.getAccessToken() || SUPABASE_ANON_KEY;
            var formData = new FormData();
            formData.append('file', file);

            var url = SUPABASE_URL + '/storage/v1/object/' + this.BUCKET + '/' + path;
            var response = await fetch(url, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + token
                },
                body: formData
            });

            if (!response.ok) {
                var errorText = await response.text();
                throw new Error('上传失败: ' + response.status);
            }

            var data = await response.json();
            var publicUrl = SUPABASE_URL + '/storage/v1/object/public/' + this.BUCKET + '/' + data.Key;
            return publicUrl;
        } catch (e) {
            console.error('上传图片失败:', e);
            throw e;
        }
    },

    uploadMultiple: async function(files, folder) {
        var results = [];
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var timestamp = Date.now();
            var ext = file.name.split('.').pop() || 'jpg';
            var path = folder + '/' + timestamp + '-' + i + '.' + ext;
            var url = await this.upload(file, path);
            results.push(url);
        }
        return results;
    },

    ensureBucket: async function() {
        try {
            var token = AUTH.getAccessToken() || SUPABASE_ANON_KEY;
            var checkRes = await fetch(SUPABASE_URL + '/storage/v1/bucket/' + this.BUCKET, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + token
                }
            });
            if (checkRes.ok) return true;
            var createRes = await fetch(SUPABASE_URL + '/storage/v1/bucket', {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: this.BUCKET,
                    name: this.BUCKET,
                    public: true
                })
            });
            return true;
        } catch (e) {
            return true;
        }
    }
};

// ============================================================
// 暴露到全局
// ============================================================
window.DB = DB;
window.AUTH = AUTH;
window.STORAGE = STORAGE;
window.SUPABASE_URL = SUPABASE_URL;

console.log('✅ Supabase 已加载');
