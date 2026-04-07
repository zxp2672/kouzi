import { getSupabaseClient, getSupabaseCredentials } from '@/storage/database/supabase-client';

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  address: string | null;
  manager: string | null;
  phone: string | null;
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
  is_active: boolean;
}

const mockWarehouses: Warehouse[] = [
  {
    id: 1,
    code: 'WH001',
    name: '中心仓库',
    address: '北京市朝阳区建国路88号',
    manager: '张三',
    phone: '13800138001',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: null
  },
  {
    id: 2,
    code: 'WH002',
    name: '城东分库',
    address: '北京市海淀区中关村大街1号',
    manager: '李四',
    phone: '13800138002',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: null
  }
];

async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const { url } = getSupabaseCredentials();
    return url !== 'https://mock.supabase.co';
  } catch {
    return false;
  }
}

export async function fetchWarehouses(): Promise<Warehouse[]> {
  const hasSupabase = await isSupabaseAvailable();
  
  if (!hasSupabase) {
    // Fallback to localStorage
    try {
      const saved = localStorage.getItem('warehouses');
      if (saved) {
        return JSON.parse(saved);
      }
      localStorage.setItem('warehouses', JSON.stringify(mockWarehouses));
      return mockWarehouses;
    } catch {
      return mockWarehouses;
    }
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('warehouses')
      .select('*')
      .order('code', { ascending: true });

    if (error) {
      console.warn('Supabase fetch failed, falling back to localStorage:', error);
      // Fallback to localStorage
      try {
        const saved = localStorage.getItem('warehouses');
        if (saved) {
          return JSON.parse(saved);
        }
        localStorage.setItem('warehouses', JSON.stringify(mockWarehouses));
        return mockWarehouses;
      } catch {
        return mockWarehouses;
      }
    }

    return (data as Warehouse[]) || [];
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    // Fallback to localStorage
    try {
      const saved = localStorage.getItem('warehouses');
      if (saved) {
        return JSON.parse(saved);
      }
      localStorage.setItem('warehouses', JSON.stringify(mockWarehouses));
      return mockWarehouses;
    } catch {
      return mockWarehouses;
    }
  }
}

export async function createWarehouse(warehouse: WarehouseFormData): Promise<Warehouse> {
  const hasSupabase = await isSupabaseAvailable();
  
  if (!hasSupabase) {
    // Fallback to localStorage
    const allWarehouses = await fetchWarehouses();
    const newWarehouse: Warehouse = {
      ...warehouse,
      id: Date.now(),
      address: warehouse.address || null,
      manager: warehouse.manager || null,
      phone: warehouse.phone || null,
      created_at: new Date().toISOString(),
      updated_at: null
    };
    const updated = [...allWarehouses, newWarehouse];
    localStorage.setItem('warehouses', JSON.stringify(updated));
    return newWarehouse;
  }

  try {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    const warehouseToInsert = {
      ...warehouse,
      address: warehouse.address || null,
      manager: warehouse.manager || null,
      phone: warehouse.phone || null,
      created_at: now,
      updated_at: now
    };

    const { data, error } = await client
      .from('warehouses')
      .insert(warehouseToInsert)
      .select()
      .single();

    if (error) {
      console.warn('Supabase create failed, falling back to localStorage:', error);
      // Fallback to localStorage
      const allWarehouses = await fetchWarehouses();
      const newWarehouse: Warehouse = {
        ...warehouse,
        id: Date.now(),
        address: warehouse.address || null,
        manager: warehouse.manager || null,
        phone: warehouse.phone || null,
        created_at: new Date().toISOString(),
        updated_at: null
      };
      const updated = [...allWarehouses, newWarehouse];
      localStorage.setItem('warehouses', JSON.stringify(updated));
      return newWarehouse;
    }

    return data as Warehouse;
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    // Fallback to localStorage
    const allWarehouses = await fetchWarehouses();
    const newWarehouse: Warehouse = {
      ...warehouse,
      id: Date.now(),
      address: warehouse.address || null,
      manager: warehouse.manager || null,
      phone: warehouse.phone || null,
      created_at: new Date().toISOString(),
      updated_at: null
    };
    const updated = [...allWarehouses, newWarehouse];
    localStorage.setItem('warehouses', JSON.stringify(updated));
    return newWarehouse;
  }
}

export async function updateWarehouse(id: number, warehouse: WarehouseFormData): Promise<Warehouse> {
  const hasSupabase = await isSupabaseAvailable();
  
  if (!hasSupabase) {
    // Fallback to localStorage
    const allWarehouses = await fetchWarehouses();
    const updatedWarehouses = allWarehouses.map(w => 
      w.id === id ? { 
        ...w, 
        ...warehouse, 
        address: warehouse.address || null,
        manager: warehouse.manager || null,
        phone: warehouse.phone || null,
        updated_at: new Date().toISOString()
      } : w
    );
    localStorage.setItem('warehouses', JSON.stringify(updatedWarehouses));
    const updated = updatedWarehouses.find(w => w.id === id);
    if (!updated) throw new Error('Warehouse not found');
    return updated;
  }

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
      console.warn('Supabase update failed, falling back to localStorage:', error);
      // Fallback to localStorage
      const allWarehouses = await fetchWarehouses();
      const updatedWarehouses = allWarehouses.map(w => 
        w.id === id ? { 
          ...w, 
          ...warehouse, 
          address: warehouse.address || null,
          manager: warehouse.manager || null,
          phone: warehouse.phone || null,
          updated_at: new Date().toISOString()
        } : w
      );
      localStorage.setItem('warehouses', JSON.stringify(updatedWarehouses));
      const updated = updatedWarehouses.find(w => w.id === id);
      if (!updated) throw new Error('Warehouse not found');
      return updated;
    }

    return data as Warehouse;
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    // Fallback to localStorage
    const allWarehouses = await fetchWarehouses();
    const updatedWarehouses = allWarehouses.map(w => 
      w.id === id ? { 
        ...w, 
        ...warehouse, 
        address: warehouse.address || null,
        manager: warehouse.manager || null,
        phone: warehouse.phone || null,
        updated_at: new Date().toISOString()
      } : w
    );
    localStorage.setItem('warehouses', JSON.stringify(updatedWarehouses));
    const updated = updatedWarehouses.find(w => w.id === id);
    if (!updated) throw new Error('Warehouse not found');
    return updated;
  }
}

export async function deleteWarehouse(id: number): Promise<void> {
  const hasSupabase = await isSupabaseAvailable();
  
  if (!hasSupabase) {
    // Fallback to localStorage
    const allWarehouses = await fetchWarehouses();
    const updated = allWarehouses.filter(w => w.id !== id);
    localStorage.setItem('warehouses', JSON.stringify(updated));
    return;
  }

  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('warehouses')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase delete failed, falling back to localStorage:', error);
      // Fallback to localStorage
      const allWarehouses = await fetchWarehouses();
      const updated = allWarehouses.filter(w => w.id !== id);
      localStorage.setItem('warehouses', JSON.stringify(updated));
      return;
    }
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    // Fallback to localStorage
    const allWarehouses = await fetchWarehouses();
    const updated = allWarehouses.filter(w => w.id !== id);
    localStorage.setItem('warehouses', JSON.stringify(updated));
  }
}
