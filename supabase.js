// ============================================================
// Supabase 连接配置
// ============================================================

const SUPABASE_URL = 'https://phvayjkoyphsyavkjcuk.supabase.co';
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
            var msg = (data && (data.error_description || data.msg || data.error)) || '登录失败，请检查邮箱和密码';
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
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
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
            console.log('📡 请求:', url);
            
            var response = await fetch(url, { 
                headers: authHeaders(false) 
            });
            
            console.log('📊 状态码:', response.status);
            
            if (!response.ok) {
                var errorText = await response.text();
                throw new Error('HTTP ' + response.status + ': ' + errorText);
            }
            var data = await response.json();
            // 同步到 localStorage 缓存
            localStorage.setItem('jiananshan_' + table, JSON.stringify(data));
            return data;
        } catch (e) {
            console.warn('Supabase 请求失败，使用 localStorage:', e.message);
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
            if (!response.ok) throw new Error('HTTP ' + response.status);
            var data = await response.json();
            return data.length > 0 ? data[0] : null;
        } catch (e) {
            console.warn('获取单条失败，使用 localStorage:', e.message);
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

    // 新增数据
    insert: async function(table, data) {
        try {
            var headers = authHeaders(true);
            headers['Prefer'] = 'return=representation';
            
            console.log('📝 插入数据:', table, data);
            
            var response = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                var errorText = await response.text();
                throw new Error('HTTP ' + response.status + ': ' + errorText);
            }
            
            var result = await response.json();
            console.log('✅ 插入成功:', result);
            
            // 更新缓存
            var cached = localStorage.getItem('jiananshan_' + table);
            if (cached) {
                var list = JSON.parse(cached);
                if (result.length > 0) {
                    var exists = list.some(function(item) { return item.id === result[0].id; });
                    if (!exists) {
                        list.push(result[0]);
                        localStorage.setItem('jiananshan_' + table, JSON.stringify(list));
                    }
                }
            }
            
            return result.length > 0 ? result[0] : null;
        } catch (e) {
            console.error('❌ 插入失败:', e.message);
            // 降级到 localStorage
            var existing = localStorage.getItem('jiananshan_' + table);
            var list = existing ? JSON.parse(existing) : [];
            var newItem = { id: Date.now() + Math.random() * 1000, ...data };
            list.push(newItem);
            localStorage.setItem('jiananshan_' + table, JSON.stringify(list));
            return newItem;
        }
    },

    // 更新数据
    update: async function(table, id, data) {
        try {
            var headers = authHeaders(true);
            headers['Prefer'] = 'return=representation';
            
            console.log('📝 更新数据:', table, id, data);
            
            var response = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + id, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                var errorText = await response.text();
                throw new Error('HTTP ' + response.status + ': ' + errorText);
            }
            
            var result = await response.json();
            console.log('✅ 更新成功:', result);
            
            // 更新缓存
            var cached = localStorage.getItem('jiananshan_' + table);
            if (cached) {
                var list = JSON.parse(cached);
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
            
            return result.length > 0 ? result[0] : null;
        } catch (e) {
            console.error('❌ 更新失败:', e.message);
            // 降级到 localStorage
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

    // 删除数据
    delete: async function(table, id) {
        try {
            console.log('📝 删除数据:', table, id);
            
            var response = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + id, {
                method: 'DELETE',
                headers: authHeaders(true)
            });
            
            if (!response.ok) {
                var errorText = await response.text();
                throw new Error('HTTP ' + response.status + ': ' + errorText);
            }
            
            console.log('✅ 删除成功');
            
            // 更新缓存
            var cached = localStorage.getItem('jiananshan_' + table);
            if (cached) {
                var list = JSON.parse(cached);
                var newList = [];
                for (var i = 0; i < list.length; i++) {
                    if (list[i].id !== Number(id)) {
                        newList.push(list[i]);
                    }
                }
                localStorage.setItem('jiananshan_' + table, JSON.stringify(newList));
            }
            
            return { success: true };
        } catch (e) {
            console.error('❌ 删除失败:', e.message);
            // 降级到 localStorage
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
    },

    // 同步获取（用于快速读取缓存）
    get: function(key, def) {
        try {
            var data = localStorage.getItem('jiananshan_' + key);
            return data ? JSON.parse(data) : def;
        } catch (e) {
            return def;
        }
    },

    // 同步设置
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
            var publicUrl = SUPABASE_URL + '/storage/v1/object/public/' + this.BUCKET + '/' + data.Key;
            console.log('✅ 图片上传成功:', publicUrl);
            return publicUrl;
        } catch (e) {
            console.error('❌ 上传图片失败:', e);
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
            
            // 检查桶是否存在
            var checkRes = await fetch(SUPABASE_URL + '/storage/v1/bucket/' + this.BUCKET, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + token
                }
            });
            
            if (checkRes.ok) {
                console.log('✅ 存储桶已存在');
                return true;
            }
            
            // 创建桶（公开）
            console.log('📁 创建存储桶...');
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
            
            if (createRes.ok) {
                console.log('✅ 存储桶创建成功');
                return true;
            } else {
                var errorText = await createRes.text();
                console.warn('⚠️ 创建存储桶失败:', errorText);
                return true;
            }
        } catch (e) {
            console.warn('⚠️ ensureBucket 警告:', e.message);
            return true;
        }
    },

    delete: async function(path) {
        try {
            var token = AUTH.getAccessToken() || SUPABASE_ANON_KEY;
            var url = SUPABASE_URL + '/storage/v1/object/' + this.BUCKET + '/' + path;
            var response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + token
                }
            });
            return response.ok;
        } catch (e) {
            console.error('删除图片失败:', e);
            return false;
        }
    },

    extractPath: function(url) {
        var prefix = '/storage/v1/object/public/' + this.BUCKET + '/';
        var idx = url.indexOf(prefix);
        if (idx !== -1) {
            return url.substring(idx + prefix.length);
        }
        return null;
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
console.log('📡 SUPABASE_URL:', SUPABASE_URL);
console.log('🔑 SUPABASE_ANON_KEY 长度:', SUPABASE_ANON_KEY.length);
console.log('🔑 SUPABASE_ANON_KEY 前缀:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
