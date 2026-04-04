import { getSupabaseClient } from '@/storage/database/supabase-client';

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

const mockProducts: Product[] = [
  { 
    id: 1, 
    code: 'PRD001', 
    name: '对讲机', 
    category: '通讯设备', 
    unit: '台', 
    specification: '数字对讲机', 
    barcode: '6901234567890', 
    purchase_price: '200.00', 
    selling_price: '300.00', 
    min_stock: 10, 
    max_stock: 200, 
    is_active: true, 
    created_at: new Date().toISOString(),
    updated_at: null
  },
  { 
    id: 2, 
    code: 'PRD002', 
    name: '警棍', 
    category: '防暴器材', 
    unit: '根', 
    specification: '伸缩警棍', 
    barcode: '6901234567891', 
    purchase_price: '30.00', 
    selling_price: '50.00', 
    min_stock: 50, 
    max_stock: 500, 
    is_active: true, 
    created_at: new Date().toISOString(),
    updated_at: null
  },
  { 
    id: 3, 
    code: 'PRD003', 
    name: '防刺服', 
    category: '防护装备', 
    unit: '件', 
    specification: '三级防刺', 
    barcode: '6901234567892', 
    purchase_price: '150.00', 
    selling_price: '200.00', 
    min_stock: 20, 
    max_stock: 100, 
    is_active: true, 
    created_at: new Date().toISOString(),
    updated_at: null
  },
];

async function isSupabaseAvailable(): Promise<boolean> {
  try {
    getSupabaseClient();
    return true;
  } catch {
    return false;
  }
}

export async function fetchProducts(): Promise<Product[]> {
  const hasSupabase = await isSupabaseAvailable();
  
  if (!hasSupabase) {
    // Fallback to localStorage
    try {
      const saved = localStorage.getItem('products');
      if (saved) {
        return JSON.parse(saved);
      }
      localStorage.setItem('products', JSON.stringify(mockProducts));
      return mockProducts;
    } catch {
      return mockProducts;
    }
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('code', { ascending: true });

    if (error) {
      console.warn('Supabase fetch failed, falling back to localStorage:', error);
      // Fallback to localStorage
      try {
        const saved = localStorage.getItem('products');
        if (saved) {
          return JSON.parse(saved);
        }
        localStorage.setItem('products', JSON.stringify(mockProducts));
        return mockProducts;
      } catch {
        return mockProducts;
      }
    }

    return (data as Product[]) || [];
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    // Fallback to localStorage
    try {
      const saved = localStorage.getItem('products');
      if (saved) {
        return JSON.parse(saved);
      }
      localStorage.setItem('products', JSON.stringify(mockProducts));
      return mockProducts;
    } catch {
      return mockProducts;
    }
  }
}

export async function createProduct(product: ProductFormData): Promise<Product> {
  const hasSupabase = await isSupabaseAvailable();
  
  if (!hasSupabase) {
    // Fallback to localStorage
    const allProducts = await fetchProducts();
    const newProduct: Product = {
      ...product,
      id: Date.now(),
      purchase_price: product.purchase_price?.toString() || null,
      selling_price: product.selling_price?.toString() || null,
      min_stock: product.min_stock || null,
      max_stock: product.max_stock || null,
      category: product.category || null,
      specification: product.specification || null,
      barcode: product.barcode || null,
      created_at: new Date().toISOString(),
      updated_at: null
    };
    const updated = [...allProducts, newProduct];
    localStorage.setItem('products', JSON.stringify(updated));
    return newProduct;
  }

  try {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    const productToInsert = {
      ...product,
      purchase_price: product.purchase_price?.toString(),
      selling_price: product.selling_price?.toString(),
      category: product.category || null,
      specification: product.specification || null,
      barcode: product.barcode || null,
      created_at: now,
      updated_at: now
    };

    const { data, error } = await client
      .from('products')
      .insert(productToInsert)
      .select()
      .single();

    if (error) {
      console.warn('Supabase create failed, falling back to localStorage:', error);
      // Fallback to localStorage
      const allProducts = await fetchProducts();
      const newProduct: Product = {
        ...product,
        id: Date.now(),
        purchase_price: product.purchase_price?.toString() || null,
        selling_price: product.selling_price?.toString() || null,
        min_stock: product.min_stock || null,
        max_stock: product.max_stock || null,
        category: product.category || null,
        specification: product.specification || null,
        barcode: product.barcode || null,
        created_at: new Date().toISOString(),
        updated_at: null
      };
      const updated = [...allProducts, newProduct];
      localStorage.setItem('products', JSON.stringify(updated));
      return newProduct;
    }

    return data as Product;
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    // Fallback to localStorage
    const allProducts = await fetchProducts();
    const newProduct: Product = {
      ...product,
      id: Date.now(),
      purchase_price: product.purchase_price?.toString() || null,
      selling_price: product.selling_price?.toString() || null,
      min_stock: product.min_stock || null,
      max_stock: product.max_stock || null,
      category: product.category || null,
      specification: product.specification || null,
      barcode: product.barcode || null,
      created_at: new Date().toISOString(),
      updated_at: null
    };
    const updated = [...allProducts, newProduct];
    localStorage.setItem('products', JSON.stringify(updated));
    return newProduct;
  }
}

export async function updateProduct(id: number, product: ProductFormData): Promise<Product> {
  const hasSupabase = await isSupabaseAvailable();
  
  if (!hasSupabase) {
    // Fallback to localStorage
    const allProducts = await fetchProducts();
    const updatedProducts = allProducts.map(p => 
      p.id === id ? { 
        ...p, 
        ...product, 
        purchase_price: product.purchase_price?.toString() || null,
        selling_price: product.selling_price?.toString() || null,
        min_stock: product.min_stock || null,
        max_stock: product.max_stock || null,
        category: product.category || null,
        specification: product.specification || null,
        barcode: product.barcode || null,
        updated_at: new Date().toISOString()
      } : p
    );
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    const updated = updatedProducts.find(p => p.id === id);
    if (!updated) throw new Error('Product not found');
    return updated;
  }

  try {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    const productToUpdate = {
      ...product,
      purchase_price: product.purchase_price?.toString(),
      selling_price: product.selling_price?.toString(),
      category: product.category || null,
      specification: product.specification || null,
      barcode: product.barcode || null,
      updated_at: now
    };

    const { data, error } = await client
      .from('products')
      .update(productToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('Supabase update failed, falling back to localStorage:', error);
      // Fallback to localStorage
      const allProducts = await fetchProducts();
      const updatedProducts = allProducts.map(p => 
        p.id === id ? { 
          ...p, 
          ...product, 
          purchase_price: product.purchase_price?.toString() || null,
          selling_price: product.selling_price?.toString() || null,
          min_stock: product.min_stock || null,
          max_stock: product.max_stock || null,
          category: product.category || null,
          specification: product.specification || null,
          barcode: product.barcode || null,
          updated_at: new Date().toISOString()
        } : p
      );
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      const updated = updatedProducts.find(p => p.id === id);
      if (!updated) throw new Error('Product not found');
      return updated;
    }

    return data as Product;
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    // Fallback to localStorage
    const allProducts = await fetchProducts();
    const updatedProducts = allProducts.map(p => 
      p.id === id ? { 
        ...p, 
        ...product, 
        purchase_price: product.purchase_price?.toString() || null,
        selling_price: product.selling_price?.toString() || null,
        min_stock: product.min_stock || null,
        max_stock: product.max_stock || null,
        category: product.category || null,
        specification: product.specification || null,
        barcode: product.barcode || null,
        updated_at: new Date().toISOString()
      } : p
    );
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    const updated = updatedProducts.find(p => p.id === id);
    if (!updated) throw new Error('Product not found');
    return updated;
  }
}

export async function deleteProduct(id: number): Promise<void> {
  const hasSupabase = await isSupabaseAvailable();
  
  if (!hasSupabase) {
    // Fallback to localStorage
    const allProducts = await fetchProducts();
    const updated = allProducts.filter(p => p.id !== id);
    localStorage.setItem('products', JSON.stringify(updated));
    return;
  }

  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase delete failed, falling back to localStorage:', error);
      // Fallback to localStorage
      const allProducts = await fetchProducts();
      const updated = allProducts.filter(p => p.id !== id);
      localStorage.setItem('products', JSON.stringify(updated));
      return;
    }
  } catch (error) {
    console.warn('Supabase not available, using localStorage:', error);
    // Fallback to localStorage
    const allProducts = await fetchProducts();
    const updated = allProducts.filter(p => p.id !== id);
    localStorage.setItem('products', JSON.stringify(updated));
  }
}
