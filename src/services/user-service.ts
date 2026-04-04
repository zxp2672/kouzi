import { getSupabaseClient } from '@/storage/database/supabase-client';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  role_id: number | null;
  organization_id: number | null;
  department: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface UserFormData {
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role_id?: number;
  organization_id?: number;
  department?: string;
  is_active?: boolean;
}

const DEFAULT_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    name: '系统管理员',
    email: 'admin@example.com',
    phone: '13800138000',
    role_id: 1,
    organization_id: null,
    department: '公安局机关',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: 2,
    username: 'manager',
    name: '库房管理员',
    email: 'manager@example.com',
    phone: '13800138001',
    role_id: 2,
    organization_id: null,
    department: '公安处机关',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: null,
  }
];

async function isSupabaseAvailable(): Promise<boolean> {
  try {
    getSupabaseClient();
    return true;
  } catch {
    return false;
  }
}

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
      email: user.email || null,
      phone: user.phone || null,
      role_id: user.role_id || null,
      organization_id: user.organization_id !== undefined ? user.organization_id : null,
      department: user.department || null,
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
    const userToInsert = {
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
        email: user.email || null,
        phone: user.phone || null,
        role_id: user.role_id || null,
        organization_id: user.organization_id !== undefined ? user.organization_id : null,
        department: user.department || null,
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
      email: user.email || null,
      phone: user.phone || null,
      role_id: user.role_id || null,
      organization_id: user.organization_id !== undefined ? user.organization_id : null,
      department: user.department || null,
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
  
  if (!hasSupabase) {
    const allUsers = await fetchUsers();
    const updatedUsers = allUsers.map(u => 
      u.id === id ? { 
        ...u, 
        ...user,
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
    const userToUpdate = {
      ...user,
      updated_at: now
    };

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
