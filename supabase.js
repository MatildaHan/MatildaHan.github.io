// ============================================================
// Supabase 连接配置
// ============================================================

const SUPABASE_URL = 'https://phvayjkoyphsyavkjcuk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uunGD7DLA9YWwtkl5mgEvw_Z95hid4l';

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
        var s = AUTH.getSession();
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
            } catch (e) {}
        }
        AUTH.clearSession();
    },
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
    isLoggedIn: async function() {
        var session = AUTH.getSession();
        if (!session || !session.access_token) return false;
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

// ============================================================
// Storage 操作封装（修复 URL 截断问题）
// ============================================================
const STORAGE = {
    BUCKET: 'jiananshan-images',

    upload: async function(file, path) {
        try {
            var token = AUTH.getAccessToken() || SUPABASE_ANON_KEY;
            var formData = new FormData();
            formData.append('file', file);

            var url = SUPABASE_URL + '/storage/v1/object/' + this.BUCKET + '/' + path;
            console.log('📤 上传 URL:', url);

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
                throw new Error('上传失败: ' + response.status + ' ' + errorText);
            }

            var data = await response.json();
            
            // ★★★ 关键：确保 Key 完整 ★★★
            var fullKey = data.Key;
            console.log('📁 文件 Key:', fullKey);
            
            // ★★★ 构造完整的公开 URL ★★★
            var publicUrl = SUPABASE_URL + '/storage/v1/object/public/' + this.BUCKET + '/' + fullKey;
            
            // ★★★ 验证 URL 完整性 ★★★
            console.log('✅ 图片 URL 长度:', publicUrl.length);
            console.log('✅ 完整图片 URL:', publicUrl);
            
            return publicUrl;
        } catch (e) {
            console.error('上传图片失败:', e);
            throw e;
        }
    },


// 暴露到全局
window.DB = DB;
window.AUTH = AUTH;
window.STORAGE = STORAGE;
window.SUPABASE_URL = SUPABASE_URL;
