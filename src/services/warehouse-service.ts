import { api } from '@/lib/api-client';

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

export async function fetchWarehouses(): Promise<Warehouse[]> {
  try {
    return await api.get<Warehouse[]>('/warehouses');
  } catch (error) {
    console.error('获取仓库失败:', error);
    return [];
  }
}

export async function createWarehouse(warehouse: WarehouseFormData): Promise<Warehouse> {
  return await api.post<Warehouse>('/warehouses', warehouse);
}

export async function updateWarehouse(id: number, warehouse: WarehouseFormData): Promise<Warehouse> {
  return await api.put<Warehouse>(`/warehouses/${id}`, warehouse);
}

export async function deleteWarehouse(id: number): Promise<void> {
  await api.delete(`/warehouses/${id}`);
}
