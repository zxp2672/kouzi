import { getSupabaseClient } from '@/storage/database/supabase-client';

export interface Role {
  id: number;
  code: string;
  name: string;
  description: string | null;
  level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface RoleFormData {
  code: string;
  name: string;
  description?: string;
  level?: number;
  is_active: boolean;
}

const DEFAULT_ROLES: Role[] = [
  {
    id: 1,
    code: 'admin',
    name: '系统管理员',
    description: '拥有系统全部权限',
    level: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: 2,
    code: 'manager',
    name: '库房管理员',
    description: '管理库房日常操作',
    level: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: 3,
    code: 'user',
    name: '普通用户',
    description: '普通操作用户',
    level: 3,
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

export async function fetchRoles(): Promise<Role[]> {
  const hasSupabase = await isSupabaseAvailable();
  
  if (!hasSupabase) {
    try {
      const saved = localStorage.getItem('roles');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.roles || DEFAULT_ROLES;
      }
      localStorage.setItem('roles', JSON.stringify({ roles: DEFAULT_ROLES, nextId: 4 }));
      return DEFAULT_ROLES;
    } catch {
      return DEFAULT_ROLES;
    }
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('roles')
      .select('*')
      .order('level', { ascending: true });

    if (error) {
      console.warn('Supabase fetch failed, falling back to localStorage:', error);
      try {
        const saved = localStorage.getItem('roles');
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.roles || DEFAULT_ROLES;
        }
        localStorage.setItem('roles', JSON.stringify({ roles: DEFAULT_ROLES, nextId: 4 }));
        return DEFAULT_ROLES;
      } catch {
        return DEFAULT_ROLES;
      }
    }

    return (data as Role[]) || [];
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    try {
      const saved = localStorage.getItem('roles');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.roles || DEFAULT_ROLES;
      }
      localStorage.setItem('roles', JSON.stringify({ roles: DEFAULT_ROLES, nextId: 4 }));
      return DEFAULT_ROLES;
    } catch {
      return DEFAULT_ROLES;
    }
  }
}

export async function createRole(role: RoleFormData): Promise<Role> {
  const hasSupabase = await isSupabaseAvailable();
  
  if (!hasSupabase) {
    const allRoles = await fetchRoles();
    const saved = localStorage.getItem('roles');
    let nextId = 4;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    const newRole: Role = {
      ...role,
      id: nextId,
      description: role.description || null,
      level: role.level || 3,
      created_at: new Date().toISOString(),
      updated_at: null
    };
    
    const updated = [...allRoles, newRole];
    localStorage.setItem('roles', JSON.stringify({ roles: updated, nextId: nextId + 1 }));
    return newRole;
  }

  try {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    const roleToInsert = {
      ...role,
      description: role.description || null,
      level: role.level || 3,
      created_at: now,
      updated_at: now
    };

    const { data, error } = await client
      .from('roles')
      .insert(roleToInsert)
      .select()
      .single();

    if (error) {
      console.warn('Supabase create failed, falling back to localStorage:', error);
      const allRoles = await fetchRoles();
      const saved = localStorage.getItem('roles');
      let nextId = 4;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          nextId = parsed.nextId || nextId;
        } catch {
          // ignore
        }
      }
      
      const newRole: Role = {
        ...role,
        id: nextId,
        description: role.description || null,
        level: role.level || 3,
        created_at: new Date().toISOString(),
        updated_at: null
      };
      
      const updated = [...allRoles, newRole];
      localStorage.setItem('roles', JSON.stringify({ roles: updated, nextId: nextId + 1 }));
      return newRole;
    }

    return data as Role;
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    const allRoles = await fetchRoles();
    const saved = localStorage.getItem('roles');
    let nextId = 4;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    const newRole: Role = {
      ...role,
      id: nextId,
      description: role.description || null,
      level: role.level || 3,
      created_at: new Date().toISOString(),
      updated_at: null
    };
    
    const updated = [...allRoles, newRole];
    localStorage.setItem('roles', JSON.stringify({ roles: updated, nextId: nextId + 1 }));
    return newRole;
  }
}

export async function updateRole(id: number, role: RoleFormData): Promise<Role> {
  const hasSupabase = await isSupabaseAvailable();
  
  if (!hasSupabase) {
    const allRoles = await fetchRoles();
    const updatedRoles = allRoles.map(r => 
      r.id === id ? { 
        ...r, 
        ...role,
        description: role.description || null,
        level: role.level || r.level,
        updated_at: new Date().toISOString()
      } : r
    );
    
    const saved = localStorage.getItem('roles');
    let nextId = 4;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    localStorage.setItem('roles', JSON.stringify({ roles: updatedRoles, nextId }));
    const updated = updatedRoles.find(r => r.id === id);
    if (!updated) throw new Error('Role not found');
    return updated;
  }

  try {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    const roleToUpdate = {
      ...role,
      description: role.description || null,
      level: role.level,
      updated_at: now
    };

    const { data, error } = await client
      .from('roles')
      .update(roleToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('Supabase update failed, falling back to localStorage:', error);
      const allRoles = await fetchRoles();
      const updatedRoles = allRoles.map(r => 
        r.id === id ? { 
          ...r, 
          ...role,
          description: role.description || null,
          level: role.level || r.level,
          updated_at: new Date().toISOString()
        } : r
      );
      
      const saved = localStorage.getItem('roles');
      let nextId = 4;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          nextId = parsed.nextId || nextId;
        } catch {
          // ignore
        }
      }
      
      localStorage.setItem('roles', JSON.stringify({ roles: updatedRoles, nextId }));
      const updated = updatedRoles.find(r => r.id === id);
      if (!updated) throw new Error('Role not found');
      return updated;
    }

    return data as Role;
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    const allRoles = await fetchRoles();
    const updatedRoles = allRoles.map(r => 
      r.id === id ? { 
        ...r, 
        ...role,
        description: role.description || null,
        level: role.level || r.level,
        updated_at: new Date().toISOString()
      } : r
    );
    
    const saved = localStorage.getItem('roles');
    let nextId = 4;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    localStorage.setItem('roles', JSON.stringify({ roles: updatedRoles, nextId }));
    const updated = updatedRoles.find(r => r.id === id);
    if (!updated) throw new Error('Role not found');
    return updated;
  }
}

export async function deleteRole(id: number): Promise<void> {
  const hasSupabase = await isSupabaseAvailable();
  
  if (!hasSupabase) {
    const allRoles = await fetchRoles();
    const updated = allRoles.filter(r => r.id !== id);
    
    const saved = localStorage.getItem('roles');
    let nextId = 4;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    localStorage.setItem('roles', JSON.stringify({ roles: updated, nextId }));
    return;
  }

  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase delete failed, falling back to localStorage:', error);
      const allRoles = await fetchRoles();
      const updated = allRoles.filter(r => r.id !== id);
      
      const saved = localStorage.getItem('roles');
      let nextId = 4;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          nextId = parsed.nextId || nextId;
        } catch {
          // ignore
        }
      }
      
      localStorage.setItem('roles', JSON.stringify({ roles: updated, nextId }));
      return;
    }
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    const allRoles = await fetchRoles();
    const updated = allRoles.filter(r => r.id !== id);
    
    const saved = localStorage.getItem('roles');
    let nextId = 4;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    localStorage.setItem('roles', JSON.stringify({ roles: updated, nextId }));
  }
}
