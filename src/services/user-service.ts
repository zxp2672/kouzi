import { getSupabaseClient, getSupabaseCredentials } from '@/storage/database/supabase-client';

export interface User {
  id: number;
  username: string;
  password_hash?: string;
  name: string;
  email: string | null;
  phone: string | null;
  role_id: number | null;
  organization_id: number | null;
  department: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface UserFormData {
  username: string;
  name: string;
  password?: string;
  email?: string;
  phone?: string;
  role_id?: number;
  organization_id?: number;
  department?: string;
  avatar_url?: string;
  is_active?: boolean;
}

/**
 * 简单的密码哈希函数（基于 SHA-256）
 * 注意：生产环境建议使用 bcrypt 等更安全的方案
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_warehouse_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 验证密码是否正确
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const { url } = getSupabaseCredentials();
    return url !== 'https://mock.supabase.co';
  } catch {
    return false;
  }
}

const DEFAULT_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    password_hash: undefined,
    name: '系统管理员',
    email: 'admin@example.com',
    phone: '13800138000',
    role_id: 1,
    organization_id: null,
    department: '公安局机关',
    avatar_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: 2,
    username: 'manager',
    password_hash: undefined,
    name: '库房管理员',
    email: 'manager@example.com',
    phone: '13800138001',
    role_id: 2,
    organization_id: null,
    department: '公安处机关',
    avatar_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: null,
  }
];

export async function fetchUsers(): Promise<User[]> {
  const hasSupabase = await isSupabaseAvailable();
  
  if (!hasSupabase) {
    try {
      const saved = localStorage.getItem('users');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.users || DEFAULT_USERS;
      }
      localStorage.setItem('users', JSON.stringify({ users: DEFAULT_USERS, nextId: 3 }));
      return DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .order('username', { ascending: true });

    if (error) {
      console.warn('Supabase fetch failed, falling back to localStorage:', error);
      try {
        const saved = localStorage.getItem('users');
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.users || DEFAULT_USERS;
        }
        localStorage.setItem('users', JSON.stringify({ users: DEFAULT_USERS, nextId: 3 }));
        return DEFAULT_USERS;
      } catch {
        return DEFAULT_USERS;
      }
    }

    return (data as User[]) || [];
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    try {
      const saved = localStorage.getItem('users');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.users || DEFAULT_USERS;
      }
      localStorage.setItem('users', JSON.stringify({ users: DEFAULT_USERS, nextId: 3 }));
      return DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  }
}

export async function createUser(user: UserFormData): Promise<User> {
  const hasSupabase = await isSupabaseAvailable();
  
  // 如果有密码，先哈希
  const passwordHash = user.password ? await hashPassword(user.password) : undefined;
  
  if (!hasSupabase) {
    const allUsers = await fetchUsers();
    const saved = localStorage.getItem('users');
    let nextId = 3;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    const newUser: User = {
      id: nextId,
      username: user.username,
      name: user.name,
      password_hash: passwordHash,
      email: user.email || null,
      phone: user.phone || null,
      role_id: user.role_id || null,
      organization_id: user.organization_id !== undefined ? user.organization_id : null,
      department: user.department || null,
      avatar_url: user.avatar_url || null,
      is_active: user.is_active !== undefined ? user.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: null
    };
    
    const updated = [...allUsers, newUser];
    localStorage.setItem('users', JSON.stringify({ users: updated, nextId: nextId + 1 }));
    return newUser;
  }

  try {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    const userToInsert: Record<string, unknown> = {
      username: user.username,
      name: user.name,
      email: user.email || null,
      phone: user.phone || null,
      role_id: user.role_id || null,
      organization_id: user.organization_id !== undefined ? user.organization_id : null,
      department: user.department || null,
      is_active: user.is_active !== undefined ? user.is_active : true,
      created_at: now,
      updated_at: now
    };
    
    if (passwordHash) {
      userToInsert.password_hash = passwordHash;
    }

    const { data, error } = await client
      .from('users')
      .insert(userToInsert)
      .select()
      .single();

    if (error) {
      console.warn('Supabase create failed, falling back to localStorage:', error);
      const allUsers = await fetchUsers();
      const saved = localStorage.getItem('users');
      let nextId = 3;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          nextId = parsed.nextId || nextId;
        } catch {
          // ignore
        }
      }
      
      const newUser: User = {
        id: nextId,
        username: user.username,
        name: user.name,
        password_hash: passwordHash,
        email: user.email || null,
        phone: user.phone || null,
        role_id: user.role_id || null,
        organization_id: user.organization_id !== undefined ? user.organization_id : null,
        department: user.department || null,
        avatar_url: user.avatar_url || null,
        is_active: user.is_active !== undefined ? user.is_active : true,
        created_at: new Date().toISOString(),
        updated_at: null
      };
      
      const updated = [...allUsers, newUser];
      localStorage.setItem('users', JSON.stringify({ users: updated, nextId: nextId + 1 }));
      return newUser;
    }

    return data as User;
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    const allUsers = await fetchUsers();
    const saved = localStorage.getItem('users');
    let nextId = 3;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    const newUser: User = {
      id: nextId,
      username: user.username,
      name: user.name,
      password_hash: passwordHash,
      email: user.email || null,
      phone: user.phone || null,
      role_id: user.role_id || null,
      organization_id: user.organization_id !== undefined ? user.organization_id : null,
      department: user.department || null,
      avatar_url: user.avatar_url || null,
      is_active: user.is_active !== undefined ? user.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: null
    };
    
    const updated = [...allUsers, newUser];
    localStorage.setItem('users', JSON.stringify({ users: updated, nextId: nextId + 1 }));
    return newUser;
  }
}

export async function updateUser(id: number, user: UserFormData): Promise<User> {
  const hasSupabase = await isSupabaseAvailable();
  
  // 如果有密码，先哈希
  const passwordHash = user.password ? await hashPassword(user.password) : undefined;
  
  if (!hasSupabase) {
    const allUsers = await fetchUsers();
    const updatedUsers = allUsers.map(u => 
      u.id === id ? { 
        ...u, 
        ...user,
        password_hash: passwordHash || u.password_hash,
        email: user.email !== undefined ? user.email : u.email,
        phone: user.phone !== undefined ? user.phone : u.phone,
        role_id: user.role_id !== undefined ? user.role_id : u.role_id,
        organization_id: user.organization_id !== undefined ? user.organization_id : u.organization_id,
        department: user.department !== undefined ? user.department : u.department,
        is_active: user.is_active !== undefined ? user.is_active : u.is_active,
        updated_at: new Date().toISOString()
      } : u
    );
    
    const saved = localStorage.getItem('users');
    let nextId = 3;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    localStorage.setItem('users', JSON.stringify({ users: updatedUsers, nextId }));
    const updated = updatedUsers.find(u => u.id === id);
    if (!updated) throw new Error('User not found');
    return updated;
  }

  try {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    const userToUpdate: Record<string, unknown> = {
      ...user,
      updated_at: now
    };
    
    // 移除 password 字段，使用 password_hash
    delete userToUpdate.password;
    if (passwordHash) {
      userToUpdate.password_hash = passwordHash;
    }

    const { data, error } = await client
      .from('users')
      .update(userToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('Supabase update failed, falling back to localStorage:', error);
      const allUsers = await fetchUsers();
      const updatedUsers = allUsers.map(u => 
        u.id === id ? { 
          ...u, 
          ...user,
          password_hash: passwordHash || u.password_hash,
          email: user.email !== undefined ? user.email : u.email,
          phone: user.phone !== undefined ? user.phone : u.phone,
          role_id: user.role_id !== undefined ? user.role_id : u.role_id,
          organization_id: user.organization_id !== undefined ? user.organization_id : u.organization_id,
          department: user.department !== undefined ? user.department : u.department,
          is_active: user.is_active !== undefined ? user.is_active : u.is_active,
          updated_at: new Date().toISOString()
        } : u
      );
      
      const saved = localStorage.getItem('users');
      let nextId = 3;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          nextId = parsed.nextId || nextId;
        } catch {
          // ignore
        }
      }
      
      localStorage.setItem('users', JSON.stringify({ users: updatedUsers, nextId }));
      const updated = updatedUsers.find(u => u.id === id);
      if (!updated) throw new Error('User not found');
      return updated;
    }

    return data as User;
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    const allUsers = await fetchUsers();
    const updatedUsers = allUsers.map(u => 
      u.id === id ? { 
        ...u, 
        ...user,
        password_hash: passwordHash || u.password_hash,
        email: user.email !== undefined ? user.email : u.email,
        phone: user.phone !== undefined ? user.phone : u.phone,
        role_id: user.role_id !== undefined ? user.role_id : u.role_id,
        organization_id: user.organization_id !== undefined ? user.organization_id : u.organization_id,
        department: user.department !== undefined ? user.department : u.department,
        is_active: user.is_active !== undefined ? user.is_active : u.is_active,
        updated_at: new Date().toISOString()
      } : u
    );
    
    const saved = localStorage.getItem('users');
    let nextId = 3;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    localStorage.setItem('users', JSON.stringify({ users: updatedUsers, nextId }));
    const updated = updatedUsers.find(u => u.id === id);
    if (!updated) throw new Error('User not found');
    return updated;
  }
}

export async function deleteUser(id: number): Promise<void> {
  const hasSupabase = await isSupabaseAvailable();
  
  if (!hasSupabase) {
    const allUsers = await fetchUsers();
    const updated = allUsers.filter(u => u.id !== id);
    
    const saved = localStorage.getItem('users');
    let nextId = 3;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    localStorage.setItem('users', JSON.stringify({ users: updated, nextId }));
    return;
  }

  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase delete failed, falling back to localStorage:', error);
      const allUsers = await fetchUsers();
      const updated = allUsers.filter(u => u.id !== id);
      
      const saved = localStorage.getItem('users');
      let nextId = 3;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          nextId = parsed.nextId || nextId;
        } catch {
          // ignore
        }
      }
      
      localStorage.setItem('users', JSON.stringify({ users: updated, nextId }));
      return;
    }
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    const allUsers = await fetchUsers();
    const updated = allUsers.filter(u => u.id !== id);
    
    const saved = localStorage.getItem('users');
    let nextId = 3;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    localStorage.setItem('users', JSON.stringify({ users: updated, nextId }));
  }
}

/**
 * 用户登录验证
 * @returns 验证成功返回用户信息，失败返回 null
 */
export async function loginUser(username: string, password: string): Promise<User | null> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    // localStorage 模式
    const allUsers = await fetchUsers();
    const user = allUsers.find(u => u.username === username && u.is_active);
    
    if (!user) return null;
    
    // 检查密码
    if (user.password_hash) {
      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) return null;
    }
    
    return user;
  }

  try {
    const client = getSupabaseClient();
    const { data: user, error } = await client
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      console.warn('数据库查询用户失败，尝试 localStorage:', error);
      // 降级到 localStorage
      const allUsers = await fetchUsers();
      const localUser = allUsers.find(u => u.username === username && u.is_active);
      if (!localUser) return null;
      
      if (localUser.password_hash) {
        const isValid = await verifyPassword(password, localUser.password_hash);
        if (!isValid) return null;
      }
      return localUser;
    }

    // 验证密码
    if (user.password_hash) {
      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) return null;
    }

    return user as User;
  } catch (error) {
    console.error('登录验证失败:', error);
    // 降级到 localStorage
    const allUsers = await fetchUsers();
    const localUser = allUsers.find(u => u.username === username && u.is_active);
    if (!localUser) return null;
    
    if (localUser.password_hash) {
      const isValid = await verifyPassword(password, localUser.password_hash);
      if (!isValid) return null;
    }
    return localUser;
  }
}

/**
 * 修改用户密码
 */
export async function changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
  const hasSupabase = await isSupabaseAvailable();
  const newHash = await hashPassword(newPassword);

  if (!hasSupabase) {
    // localStorage 模式
    const allUsers = await fetchUsers();
    const user = allUsers.find(u => u.id === userId);
    
    if (!user) return false;
    
    // 验证旧密码
    if (user.password_hash) {
      const isValid = await verifyPassword(oldPassword, user.password_hash);
      if (!isValid) return false;
    }
    
    // 更新密码
    const updatedUsers = allUsers.map(u =>
      u.id === userId ? { ...u, password_hash: newHash, updated_at: new Date().toISOString() } : u
    );
    
    const saved = localStorage.getItem('users');
    let nextId = 3;
    if (saved) {
      try { nextId = JSON.parse(saved).nextId || nextId; } catch { /* ignore */ }
    }
    localStorage.setItem('users', JSON.stringify({ users: updatedUsers, nextId }));
    return true;
  }

  try {
    const client = getSupabaseClient();
    
    // 先获取用户验证旧密码
    const { data: user, error: fetchError } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !user) return false;

    if (user.password_hash) {
      const isValid = await verifyPassword(oldPassword, user.password_hash);
      if (!isValid) return false;
    }

    // 更新密码
    const { error: updateError } = await client
      .from('users')
      .update({
        password_hash: newHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('修改密码失败:', error);
    return false;
  }
}

/**
 * 重置用户密码（管理员操作）
 */
export async function resetPassword(userId: number, newPassword: string): Promise<boolean> {
  const newHash = await hashPassword(newPassword);
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const allUsers = await fetchUsers();
    const updatedUsers = allUsers.map(u =>
      u.id === userId ? { ...u, password_hash: newHash, updated_at: new Date().toISOString() } : u
    );
    
    const saved = localStorage.getItem('users');
    let nextId = 3;
    if (saved) {
      try { nextId = JSON.parse(saved).nextId || nextId; } catch { /* ignore */ }
    }
    localStorage.setItem('users', JSON.stringify({ users: updatedUsers, nextId }));
    return true;
  }

  try {
    const client = getSupabaseClient();

    const { error } = await client
      .from('users')
      .update({
        password_hash: newHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('重置密码失败:', error);
    return false;
  }
}

/**
 * 初始化默认用户密码
 * 用于首次运行时设置默认账号密码
 */
export async function initDefaultUsers(): Promise<void> {
  const hasSupabase = await isSupabaseAvailable();

  // 默认账号密码
  const defaults = [
    { username: 'admin', password: 'admin123', name: '系统管理员' },
    { username: 'manager', password: '123456', name: '库房管理员' },
  ];

  if (!hasSupabase) {
    // localStorage 模式：更新默认用户密码哈希
    const allUsers = await fetchUsers();
    let changed = false;

    for (const def of defaults) {
      const user = allUsers.find(u => u.username === def.username);
      if (user && !user.password_hash) {
        user.password_hash = await hashPassword(def.password);
        changed = true;
      }
    }

    if (changed) {
      const saved = localStorage.getItem('users');
      let nextId = 3;
      if (saved) {
        try { nextId = JSON.parse(saved).nextId || nextId; } catch { /* ignore */ }
      }
      localStorage.setItem('users', JSON.stringify({ users: allUsers, nextId }));
    }
    return;
  }

  try {
    const client = getSupabaseClient();

    for (const def of defaults) {
      // 检查用户是否存在
      const { data: existing } = await client
        .from('users')
        .select('id, password_hash')
        .eq('username', def.username)
        .single();

      if (existing && !existing.password_hash) {
        // 用户存在但没有密码，设置默认密码
        const hash = await hashPassword(def.password);
        await client
          .from('users')
          .update({ password_hash: hash })
          .eq('id', existing.id);
      } else if (!existing) {
        // 用户不存在，创建
        const hash = await hashPassword(def.password);
        await client
          .from('users')
          .insert({
            username: def.username,
            password_hash: hash,
            name: def.name,
            is_active: true,
            created_at: new Date().toISOString()
          });
      }
    }
  } catch (error) {
    console.error('初始化默认用户失败:', error);
  }
}

// 导出哈希函数供创建用户时使用
export { hashPassword };

/**
 * 更新用户头像
 */
export async function updateUserAvatar(userId: number, avatarUrl: string): Promise<User> {
  console.log('updateUserAvatar called, userId:', userId, 'dataLength:', avatarUrl?.length);
  
  const hasSupabase = await isSupabaseAvailable();
  console.log('Supabase available:', hasSupabase);
  
  if (!hasSupabase) {
    console.log('使用localStorage模式保存头像');
    const allUsers = await fetchUsers();
    console.log('获取到用户列表，数量:', allUsers.length);
    
    const updatedUsers = allUsers.map(u => 
      u.id === userId ? { ...u, avatar_url: avatarUrl, updated_at: new Date().toISOString() } : u
    );
    
    const saved = localStorage.getItem('users');
    let nextId = 3;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch { /* ignore */ }
    }
    
    try {
      localStorage.setItem('users', JSON.stringify({ users: updatedUsers, nextId }));
      console.log('头像已保存到localStorage users');
    } catch (storageError: any) {
      console.error('localStorage保存失败:', storageError);
      if (storageError.name === 'QuotaExceededError') {
        throw new Error('存储空间不足，图片可能太大，请选择小于1MB的图片');
      }
      throw new Error('本地存储失败: ' + storageError.message);
    }
    
    const updated = updatedUsers.find(u => u.id === userId);
    if (!updated) throw new Error('用户不存在');
    return updated;
  }

  try {
    const client = getSupabaseClient();
    console.log('尝试通过Supabase更新头像');
    
    const { data, error } = await client
      .from('users')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase头像更新错误:', error);
      // 如果是因为字段不存在，降级到localStorage
      if (error.code === '42703' || error.message?.includes('avatar_url')) {
        console.warn('avatar_url字段不存在，降级到localStorage存储');
        const allUsers = await fetchUsers();
        const updatedUsers = allUsers.map(u => 
          u.id === userId ? { ...u, avatar_url: avatarUrl, updated_at: new Date().toISOString() } : u
        );
        
        const saved = localStorage.getItem('users');
        let nextId = 3;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            nextId = parsed.nextId || nextId;
          } catch { /* ignore */ }
        }
        
        localStorage.setItem('users', JSON.stringify({ users: updatedUsers, nextId }));
        const updated = updatedUsers.find(u => u.id === userId);
        if (!updated) throw new Error('用户不存在');
        return updated;
      }
      throw new Error('头像更新失败: ' + error.message);
    }
    
    if (!data) {
      throw new Error('头像更新失败：未找到用户');
    }
    
    console.log('Supabase头像更新成功');
    return data as User;
  } catch (error: any) {
    console.error('更新头像失败:', error);
    throw error;
  }
}

/**
 * 更新当前用户信息（姓名、电话、邮箱等）
 */
export async function updateCurrentUser(userId: number, updates: { name?: string; phone?: string; email?: string }): Promise<User> {
  console.log('updateCurrentUser called, userId:', userId, 'updates:', updates);
  const hasSupabase = await isSupabaseAvailable();
  console.log('Supabase available for updateCurrentUser:', hasSupabase);
  
  if (!hasSupabase) {
    console.log('使用localStorage模式更新用户信息');
    const allUsers = await fetchUsers();
    const updatedUsers = allUsers.map(u => 
      u.id === userId ? { ...u, ...updates, updated_at: new Date().toISOString() } : u
    );
    
    const saved = localStorage.getItem('users');
    let nextId = 3;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch { /* ignore */ }
    }
    
    localStorage.setItem('users', JSON.stringify({ users: updatedUsers, nextId }));
    console.log('用户信息已保存到localStorage');
    const updated = updatedUsers.find(u => u.id === userId);
    if (!updated) throw new Error('用户不存在');
    return updated;
  }

  try {
    const client = getSupabaseClient();
    console.log('尝试通过Supabase更新用户信息');
    
    const { data, error } = await client
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase更新用户信息失败:', error);
      throw new Error('信息更新失败: ' + error.message);
    }
    
    if (!data) {
      throw new Error('信息更新失败：未找到用户');
    }
    
    console.log('Supabase用户信息更新成功');
    return data as User;
  } catch (error) {
    console.error('更新信息失败:', error);
    throw error;
  }
}
