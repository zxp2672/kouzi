import { getSupabaseClient, getSupabaseCredentials } from '@/storage/database/supabase-client';

export interface Organization {
  id: number;
  code: string;
  name: string;
  type: string;
  level: number;
  parent_id: number | null;
  path: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  children?: Organization[];
}

export interface OrganizationFormData {
  code: string;
  name: string;
  type: string;
  level?: number;
  parent_id?: number;
  path?: string | null;
  sort_order?: number;
  is_active: boolean;
}

const DEFAULT_ORGANIZATIONS: Organization[] = [
  {
    id: 1,
    code: 'GAJ001',
    name: 'XX市公安局',
    type: 'bureau',
    level: 1,
    parent_id: null,
    path: null,
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: 2,
    code: 'GAC001',
    name: 'XX区公安处',
    type: 'department',
    level: 2,
    parent_id: 1,
    path: '1',
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: 3,
    code: 'SD001',
    name: 'XX派出所',
    type: 'team',
    level: 3,
    parent_id: 2,
    path: '1.2',
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
];

async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const { url } = getSupabaseCredentials();
    return url !== 'https://mock.supabase.co';
  } catch {
    return false;
  }
}

export async function fetchOrganizations(): Promise<Organization[]> {
  const hasSupabase = await isSupabaseAvailable();
  
  if (!hasSupabase) {
    // Fallback to localStorage
    try {
      const saved = localStorage.getItem('organizations');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.organizations || DEFAULT_ORGANIZATIONS;
      }
      localStorage.setItem('organizations', JSON.stringify({ organizations: DEFAULT_ORGANIZATIONS, nextId: 4 }));
      return DEFAULT_ORGANIZATIONS;
    } catch {
      return DEFAULT_ORGANIZATIONS;
    }
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('organizations')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('Supabase fetch failed, falling back to localStorage:', error);
      // Fallback to localStorage
      try {
        const saved = localStorage.getItem('organizations');
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.organizations || DEFAULT_ORGANIZATIONS;
        }
        localStorage.setItem('organizations', JSON.stringify({ organizations: DEFAULT_ORGANIZATIONS, nextId: 4 }));
        return DEFAULT_ORGANIZATIONS;
      } catch {
        return DEFAULT_ORGANIZATIONS;
      }
    }

    return (data as Organization[]) || [];
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    // Fallback to localStorage
    try {
      const saved = localStorage.getItem('organizations');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.organizations || DEFAULT_ORGANIZATIONS;
      }
      localStorage.setItem('organizations', JSON.stringify({ organizations: DEFAULT_ORGANIZATIONS, nextId: 4 }));
      return DEFAULT_ORGANIZATIONS;
    } catch {
      return DEFAULT_ORGANIZATIONS;
    }
  }
}

export async function createOrganization(org: OrganizationFormData): Promise<Organization> {
  const hasSupabase = await isSupabaseAvailable();
  
  if (!hasSupabase) {
    // Fallback to localStorage
    const allOrgs = await fetchOrganizations();
    const saved = localStorage.getItem('organizations');
    let nextId = 4;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    const ORGANIZATION_TYPES = [
      { value: 'bureau', label: '公安局机关', level: 1 },
      { value: 'department', label: '公安处机关', level: 2 },
      { value: 'team', label: '所队', level: 3 },
    ];
    
    const typeInfo = ORGANIZATION_TYPES.find(t => t.value === org.type);
    const newOrg: Organization = {
      ...org,
      id: nextId,
      level: typeInfo?.level || 1,
      parent_id: org.parent_id || null,
      sort_order: org.sort_order || 0,
      path: null,
      created_at: new Date().toISOString(),
      updated_at: null
    };
    
    const updated = [...allOrgs, newOrg];
    localStorage.setItem('organizations', JSON.stringify({ organizations: updated, nextId: nextId + 1 }));
    return newOrg;
  }

  try {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    const ORGANIZATION_TYPES = [
      { value: 'bureau', label: '公安局机关', level: 1 },
      { value: 'department', label: '公安处机关', level: 2 },
      { value: 'team', label: '所队', level: 3 },
    ];
    
    const typeInfo = ORGANIZATION_TYPES.find(t => t.value === org.type);
    const orgToInsert = {
      ...org,
      level: typeInfo?.level || 1,
      parent_id: org.parent_id || null,
      sort_order: org.sort_order || 0,
      path: null,
      created_at: now,
      updated_at: now
    };

    const { data, error } = await client
      .from('organizations')
      .insert(orgToInsert)
      .select()
      .single();

    if (error) {
      console.warn('Supabase create failed, falling back to localStorage:', error);
      // Fallback to localStorage
      const allOrgs = await fetchOrganizations();
      const saved = localStorage.getItem('organizations');
      let nextId = 4;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          nextId = parsed.nextId || nextId;
        } catch {
          // ignore
        }
      }
      
      const typeInfo = ORGANIZATION_TYPES.find(t => t.value === org.type);
      const newOrg: Organization = {
        ...org,
        id: nextId,
        level: typeInfo?.level || 1,
        parent_id: org.parent_id || null,
        sort_order: org.sort_order || 0,
        path: null,
        created_at: new Date().toISOString(),
        updated_at: null
      };
      
      const updated = [...allOrgs, newOrg];
      localStorage.setItem('organizations', JSON.stringify({ organizations: updated, nextId: nextId + 1 }));
      return newOrg;
    }

    return data as Organization;
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    // Fallback to localStorage
    const allOrgs = await fetchOrganizations();
    const saved = localStorage.getItem('organizations');
    let nextId = 4;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    const ORGANIZATION_TYPES = [
      { value: 'bureau', label: '公安局机关', level: 1 },
      { value: 'department', label: '公安处机关', level: 2 },
      { value: 'team', label: '所队', level: 3 },
    ];
    
    const typeInfo = ORGANIZATION_TYPES.find(t => t.value === org.type);
    const newOrg: Organization = {
      ...org,
      id: nextId,
      level: typeInfo?.level || 1,
      parent_id: org.parent_id || null,
      sort_order: org.sort_order || 0,
      path: null,
      created_at: new Date().toISOString(),
      updated_at: null
    };
    
    const updated = [...allOrgs, newOrg];
    localStorage.setItem('organizations', JSON.stringify({ organizations: updated, nextId: nextId + 1 }));
    return newOrg;
  }
}

export async function updateOrganization(id: number, org: OrganizationFormData): Promise<Organization> {
  const hasSupabase = await isSupabaseAvailable();
  
  if (!hasSupabase) {
    // Fallback to localStorage
    const allOrgs = await fetchOrganizations();
    const ORGANIZATION_TYPES = [
      { value: 'bureau', label: '公安局机关', level: 1 },
      { value: 'department', label: '公安处机关', level: 2 },
      { value: 'team', label: '所队', level: 3 },
    ];
    
    const typeInfo = ORGANIZATION_TYPES.find(t => t.value === org.type);
    const updatedOrgs = allOrgs.map(o => 
      o.id === id ? { 
        ...o, 
        ...org,
        level: typeInfo?.level || o.level,
        parent_id: org.parent_id || null,
        sort_order: org.sort_order || o.sort_order,
        updated_at: new Date().toISOString()
      } : o
    );
    
    const saved = localStorage.getItem('organizations');
    let nextId = 4;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    localStorage.setItem('organizations', JSON.stringify({ organizations: updatedOrgs, nextId }));
    const updated = updatedOrgs.find(o => o.id === id);
    if (!updated) throw new Error('Organization not found');
    return updated;
  }

  try {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    const ORGANIZATION_TYPES = [
      { value: 'bureau', label: '公安局机关', level: 1 },
      { value: 'department', label: '公安处机关', level: 2 },
      { value: 'team', label: '所队', level: 3 },
    ];
    
    const typeInfo = ORGANIZATION_TYPES.find(t => t.value === org.type);
    const orgToUpdate = {
      ...org,
      level: typeInfo?.level,
      parent_id: org.parent_id || null,
      sort_order: org.sort_order,
      updated_at: now
    };

    const { data, error } = await client
      .from('organizations')
      .update(orgToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('Supabase update failed, falling back to localStorage:', error);
      // Fallback to localStorage
      const allOrgs = await fetchOrganizations();
      const typeInfo = ORGANIZATION_TYPES.find(t => t.value === org.type);
      const updatedOrgs = allOrgs.map(o => 
        o.id === id ? { 
          ...o, 
          ...org,
          level: typeInfo?.level || o.level,
          parent_id: org.parent_id || null,
          sort_order: org.sort_order || o.sort_order,
          updated_at: new Date().toISOString()
        } : o
      );
      
      const saved = localStorage.getItem('organizations');
      let nextId = 4;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          nextId = parsed.nextId || nextId;
        } catch {
          // ignore
        }
      }
      
      localStorage.setItem('organizations', JSON.stringify({ organizations: updatedOrgs, nextId }));
      const updated = updatedOrgs.find(o => o.id === id);
      if (!updated) throw new Error('Organization not found');
      return updated;
    }

    return data as Organization;
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    // Fallback to localStorage
    const allOrgs = await fetchOrganizations();
    const ORGANIZATION_TYPES = [
      { value: 'bureau', label: '公安局机关', level: 1 },
      { value: 'department', label: '公安处机关', level: 2 },
      { value: 'team', label: '所队', level: 3 },
    ];
    
    const typeInfo = ORGANIZATION_TYPES.find(t => t.value === org.type);
    const updatedOrgs = allOrgs.map(o => 
      o.id === id ? { 
        ...o, 
        ...org,
        level: typeInfo?.level || o.level,
        parent_id: org.parent_id || null,
        sort_order: org.sort_order || o.sort_order,
        updated_at: new Date().toISOString()
      } : o
    );
    
    const saved = localStorage.getItem('organizations');
    let nextId = 4;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    localStorage.setItem('organizations', JSON.stringify({ organizations: updatedOrgs, nextId }));
    const updated = updatedOrgs.find(o => o.id === id);
    if (!updated) throw new Error('Organization not found');
    return updated;
  }
}

export async function deleteOrganization(id: number): Promise<void> {
  const hasSupabase = await isSupabaseAvailable();
  
  if (!hasSupabase) {
    // Fallback to localStorage
    const allOrgs = await fetchOrganizations();
    const updated = allOrgs.filter(o => o.id !== id);
    
    const saved = localStorage.getItem('organizations');
    let nextId = 4;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    localStorage.setItem('organizations', JSON.stringify({ organizations: updated, nextId }));
    return;
  }

  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase delete failed, falling back to localStorage:', error);
      // Fallback to localStorage
      const allOrgs = await fetchOrganizations();
      const updated = allOrgs.filter(o => o.id !== id);
      
      const saved = localStorage.getItem('organizations');
      let nextId = 4;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          nextId = parsed.nextId || nextId;
        } catch {
          // ignore
        }
      }
      
      localStorage.setItem('organizations', JSON.stringify({ organizations: updated, nextId }));
      return;
    }
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    // Fallback to localStorage
    const allOrgs = await fetchOrganizations();
    const updated = allOrgs.filter(o => o.id !== id);
    
    const saved = localStorage.getItem('organizations');
    let nextId = 4;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    localStorage.setItem('organizations', JSON.stringify({ organizations: updated, nextId }));
  }
}
