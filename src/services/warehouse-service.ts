import { getSupabaseClient, getSupabaseCredentials } from '@/storage/database/supabase-client';
import { getSupabase } from '@/lib/supabase-browser';

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  address: string | null;
  manager: string | null;
  phone: string | null;
  organization_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface WarehouseFormData {
  code: string;
  name: string;
  address?: string;
  manager?: string;
  phone?: string;
  organization_id?: number | null;
  is_active: boolean;
}

async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const { url } = getSupabaseCredentials();
    return url !== 'https://mock.supabase.co';
  } catch {
    return false;
  }
}

export async function fetchWarehouses(): Promise<Warehouse[]> {
  try {
    // Try PostgreSQL API first
    const response = await fetch('/api/warehouses');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('PostgreSQL API failed, trying Supabase:', error);
  }

  // Fallback to Supabase
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('code', { ascending: true });

    if (error) {
      console.error('获取仓库失败:', error.message);
      return [];
    }

    return (data as Warehouse[]) || [];
  } catch (error) {
    console.error('获取仓库异常:', error);
    return [];
  }
}

export async function createWarehouse(warehouse: WarehouseFormData): Promise<Warehouse> {
  try {
    // Try PostgreSQL API first
    const response = await fetch('/api/warehouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(warehouse),
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('PostgreSQL API failed, trying Supabase:', error);
  }

  // Fallback to Supabase
  const hasSupabase = await isSupabaseAvailable();
  
  if (hasSupabase) {
    try {
      const client = getSupabaseClient();
      const now = new Date().toISOString();
      const warehouseToInsert = {
        ...warehouse,
        address: warehouse.address || null,
        manager: warehouse.manager || null,
        phone: warehouse.phone || null,
        organization_id: warehouse.organization_id ?? null,
        created_at: now,
        updated_at: now
      };

      const { data, error } = await client
        .from('warehouses')
        .insert(warehouseToInsert)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Warehouse;
    } catch (error) {
      console.error('Supabase create failed:', error);
      throw error;
    }
  }

  throw new Error('No database available');
}

export async function updateWarehouse(id: number, warehouse: WarehouseFormData): Promise<Warehouse> {
  try {
    // Try PostgreSQL API first
    const response = await fetch(`/api/warehouses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(warehouse),
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('PostgreSQL API failed, trying Supabase:', error);
  }

  // Fallback to Supabase
  const hasSupabase = await isSupabaseAvailable();
  
  if (hasSupabase) {
    try {
      const client = getSupabaseClient();
      const now = new Date().toISOString();
      const warehouseToUpdate = {
        ...warehouse,
        address: warehouse.address || null,
        manager: warehouse.manager || null,
        phone: warehouse.phone || null,
        updated_at: now
      };

      const { data, error } = await client
        .from('warehouses')
        .update(warehouseToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Warehouse;
    } catch (error) {
      console.error('Supabase update failed:', error);
      throw error;
    }
  }

  throw new Error('No database available');
}

export async function deleteWarehouse(id: number): Promise<void> {
  try {
    // Try PostgreSQL API first
    const response = await fetch(`/api/warehouses/${id}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      return;
    }
  } catch (error) {
    console.warn('PostgreSQL API failed, trying Supabase:', error);
  }

  // Fallback to Supabase
  const hasSupabase = await isSupabaseAvailable();
  
  if (hasSupabase) {
    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from('warehouses')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Supabase delete failed:', error);
      throw error;
    }
  }

  throw new Error('No database available');
}
