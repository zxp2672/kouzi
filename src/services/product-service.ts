import { api } from '@/lib/api-client';

export interface Product {
  id: number;
  code: string;
  name: string;
  category: string | null;
  unit: string;
  specification: string | null;
  barcode: string | null;
  purchase_price: string | null;
  selling_price: string | null;
  min_stock: number | null;
  max_stock: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ProductFormData {
  code: string;
  name: string;
  category?: string;
  unit: string;
  specification?: string;
  barcode?: string;
  purchase_price?: number;
  selling_price?: number;
  min_stock?: number;
  max_stock?: number;
  is_active: boolean;
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    return await api.get<Product[]>('/products');
  } catch (error) {
    console.error('获取商品失败:', error);
    return [];
  }
}

export async function createProduct(product: ProductFormData): Promise<Product> {
  return await api.post<Product>('/products', product);
}

export async function updateProduct(id: number, product: ProductFormData): Promise<Product> {
  return await api.put<Product>(`/products/${id}`, product);
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}
