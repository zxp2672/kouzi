import { getSupabaseClient, getSupabaseCredentials } from '@/storage/database/supabase-client';

// ===== 商品类别 =====
export interface ProductCategory {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ProductCategoryFormData {
  name: string;
  sort_order?: number;
  is_active: boolean;
}

// ===== 计量单位 =====
export interface ProductUnit {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ProductUnitFormData {
  name: string;
  sort_order?: number;
  is_active: boolean;
}

// ===== 默认数据 =====
const DEFAULT_CATEGORIES: ProductCategory[] = [
  { id: 1, name: '通讯设备', sort_order: 1, is_active: true, created_at: new Date().toISOString(), updated_at: null },
  { id: 2, name: '防暴器材', sort_order: 2, is_active: true, created_at: new Date().toISOString(), updated_at: null },
  { id: 3, name: '防护装备', sort_order: 3, is_active: true, created_at: new Date().toISOString(), updated_at: null },
  { id: 4, name: '办公用品', sort_order: 4, is_active: true, created_at: new Date().toISOString(), updated_at: null },
];

const DEFAULT_UNITS: ProductUnit[] = [
  { id: 1, name: '台', sort_order: 1, is_active: true, created_at: new Date().toISOString(), updated_at: null },
  { id: 2, name: '个', sort_order: 2, is_active: true, created_at: new Date().toISOString(), updated_at: null },
  { id: 3, name: '件', sort_order: 3, is_active: true, created_at: new Date().toISOString(), updated_at: null },
  { id: 4, name: '根', sort_order: 4, is_active: true, created_at: new Date().toISOString(), updated_at: null },
  { id: 5, name: '套', sort_order: 5, is_active: true, created_at: new Date().toISOString(), updated_at: null },
  { id: 6, name: '箱', sort_order: 6, is_active: true, created_at: new Date().toISOString(), updated_at: null },
  { id: 7, name: '把', sort_order: 7, is_active: true, created_at: new Date().toISOString(), updated_at: null },
  { id: 8, name: '双', sort_order: 8, is_active: true, created_at: new Date().toISOString(), updated_at: null },
];

async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const { url } = getSupabaseCredentials();
    return url !== 'https://mock.supabase.co';
  } catch {
    return false;
  }
}

// ===== 类别 CRUD =====
export async function fetchCategories(): Promise<ProductCategory[]> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    try {
      const saved = localStorage.getItem('product_categories');
      if (saved) return JSON.parse(saved);
      localStorage.setItem('product_categories', JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('product_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Supabase fetch categories failed:', error);
      try {
        const saved = localStorage.getItem('product_categories');
        if (saved) return JSON.parse(saved);
        localStorage.setItem('product_categories', JSON.stringify(DEFAULT_CATEGORIES));
        return DEFAULT_CATEGORIES;
      } catch {
        return DEFAULT_CATEGORIES;
      }
    }

    return (data as ProductCategory[]) || [];
  } catch (error) {
    console.warn('Supabase not available for categories:', error);
    try {
      const saved = localStorage.getItem('product_categories');
      if (saved) return JSON.parse(saved);
      localStorage.setItem('product_categories', JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  }
}

export async function createCategory(cat: ProductCategoryFormData): Promise<ProductCategory> {
  const hasSupabase = await isSupabaseAvailable();
  const now = new Date().toISOString();

  if (!hasSupabase) {
    const all = await fetchCategories();
    const newItem: ProductCategory = {
      ...cat,
      id: Date.now(),
      sort_order: cat.sort_order ?? all.length + 1,
      created_at: now,
      updated_at: null,
    };
    localStorage.setItem('product_categories', JSON.stringify([...all, newItem]));
    return newItem;
  }

  try {
    const client = getSupabaseClient();
    const all = await fetchCategories();
    const { data, error } = await client
      .from('product_categories')
      .insert({ ...cat, sort_order: cat.sort_order ?? all.length + 1, created_at: now, updated_at: now })
      .select()
      .single();

    if (error) {
      console.warn('Supabase create category failed:', error);
      const allLocal = await fetchCategories();
      const newItem: ProductCategory = { ...cat, id: Date.now(), sort_order: cat.sort_order ?? allLocal.length + 1, created_at: now, updated_at: null };
      localStorage.setItem('product_categories', JSON.stringify([...allLocal, newItem]));
      return newItem;
    }
    return data as ProductCategory;
  } catch (error) {
    console.warn('Supabase not available:', error);
    const all = await fetchCategories();
    const newItem: ProductCategory = { ...cat, id: Date.now(), sort_order: cat.sort_order ?? all.length + 1, created_at: now, updated_at: null };
    localStorage.setItem('product_categories', JSON.stringify([...all, newItem]));
    return newItem;
  }
}

export async function updateCategory(id: number, cat: ProductCategoryFormData): Promise<ProductCategory> {
  const hasSupabase = await isSupabaseAvailable();
  const now = new Date().toISOString();

  if (!hasSupabase) {
    const all = await fetchCategories();
    const updated = all.map(c => c.id === id ? { ...c, ...cat, sort_order: cat.sort_order ?? c.sort_order, updated_at: now } : c);
    localStorage.setItem('product_categories', JSON.stringify(updated));
    const found = updated.find(c => c.id === id);
    if (!found) throw new Error('Category not found');
    return found;
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('product_categories')
      .update({ ...cat, updated_at: now })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('Supabase update category failed:', error);
      const all = await fetchCategories();
      const updated = all.map(c => c.id === id ? { ...c, ...cat, sort_order: cat.sort_order ?? c.sort_order, updated_at: now } : c);
      localStorage.setItem('product_categories', JSON.stringify(updated));
      return updated.find(c => c.id === id)!;
    }
    return data as ProductCategory;
  } catch (error) {
    console.warn('Supabase not available:', error);
    const all = await fetchCategories();
    const updated = all.map(c => c.id === id ? { ...c, ...cat, sort_order: cat.sort_order ?? c.sort_order, updated_at: now } : c);
    localStorage.setItem('product_categories', JSON.stringify(updated));
    return updated.find(c => c.id === id)!;
  }
}

export async function deleteCategory(id: number): Promise<void> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const all = await fetchCategories();
    localStorage.setItem('product_categories', JSON.stringify(all.filter(c => c.id !== id)));
    return;
  }

  try {
    const client = getSupabaseClient();
    const { error } = await client.from('product_categories').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete category failed:', error);
      const all = await fetchCategories();
      localStorage.setItem('product_categories', JSON.stringify(all.filter(c => c.id !== id)));
    }
  } catch (error) {
    console.warn('Supabase not available:', error);
    const all = await fetchCategories();
    localStorage.setItem('product_categories', JSON.stringify(all.filter(c => c.id !== id)));
  }
}

// ===== 单位 CRUD =====
export async function fetchUnits(): Promise<ProductUnit[]> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    try {
      const saved = localStorage.getItem('product_units');
      if (saved) return JSON.parse(saved);
      localStorage.setItem('product_units', JSON.stringify(DEFAULT_UNITS));
      return DEFAULT_UNITS;
    } catch {
      return DEFAULT_UNITS;
    }
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('product_units')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Supabase fetch units failed:', error);
      try {
        const saved = localStorage.getItem('product_units');
        if (saved) return JSON.parse(saved);
        localStorage.setItem('product_units', JSON.stringify(DEFAULT_UNITS));
        return DEFAULT_UNITS;
      } catch {
        return DEFAULT_UNITS;
      }
    }

    return (data as ProductUnit[]) || [];
  } catch (error) {
    console.warn('Supabase not available for units:', error);
    try {
      const saved = localStorage.getItem('product_units');
      if (saved) return JSON.parse(saved);
      localStorage.setItem('product_units', JSON.stringify(DEFAULT_UNITS));
      return DEFAULT_UNITS;
    } catch {
      return DEFAULT_UNITS;
    }
  }
}

export async function createUnit(unit: ProductUnitFormData): Promise<ProductUnit> {
  const hasSupabase = await isSupabaseAvailable();
  const now = new Date().toISOString();

  if (!hasSupabase) {
    const all = await fetchUnits();
    const newItem: ProductUnit = {
      ...unit,
      id: Date.now(),
      sort_order: unit.sort_order ?? all.length + 1,
      created_at: now,
      updated_at: null,
    };
    localStorage.setItem('product_units', JSON.stringify([...all, newItem]));
    return newItem;
  }

  try {
    const client = getSupabaseClient();
    const all = await fetchUnits();
    const { data, error } = await client
      .from('product_units')
      .insert({ ...unit, sort_order: unit.sort_order ?? all.length + 1, created_at: now, updated_at: now })
      .select()
      .single();

    if (error) {
      console.warn('Supabase create unit failed:', error);
      const allLocal = await fetchUnits();
      const newItem: ProductUnit = { ...unit, id: Date.now(), sort_order: unit.sort_order ?? allLocal.length + 1, created_at: now, updated_at: null };
      localStorage.setItem('product_units', JSON.stringify([...allLocal, newItem]));
      return newItem;
    }
    return data as ProductUnit;
  } catch (error) {
    console.warn('Supabase not available:', error);
    const all = await fetchUnits();
    const newItem: ProductUnit = { ...unit, id: Date.now(), sort_order: unit.sort_order ?? all.length + 1, created_at: now, updated_at: null };
    localStorage.setItem('product_units', JSON.stringify([...all, newItem]));
    return newItem;
  }
}

export async function updateUnit(id: number, unit: ProductUnitFormData): Promise<ProductUnit> {
  const hasSupabase = await isSupabaseAvailable();
  const now = new Date().toISOString();

  if (!hasSupabase) {
    const all = await fetchUnits();
    const updated = all.map(u => u.id === id ? { ...u, ...unit, sort_order: unit.sort_order ?? u.sort_order, updated_at: now } : u);
    localStorage.setItem('product_units', JSON.stringify(updated));
    const found = updated.find(u => u.id === id);
    if (!found) throw new Error('Unit not found');
    return found;
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('product_units')
      .update({ ...unit, updated_at: now })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('Supabase update unit failed:', error);
      const all = await fetchUnits();
      const updated = all.map(u => u.id === id ? { ...u, ...unit, sort_order: unit.sort_order ?? u.sort_order, updated_at: now } : u);
      localStorage.setItem('product_units', JSON.stringify(updated));
      return updated.find(u => u.id === id)!;
    }
    return data as ProductUnit;
  } catch (error) {
    console.warn('Supabase not available:', error);
    const all = await fetchUnits();
    const updated = all.map(u => u.id === id ? { ...u, ...unit, sort_order: unit.sort_order ?? u.sort_order, updated_at: now } : u);
    localStorage.setItem('product_units', JSON.stringify(updated));
    return updated.find(u => u.id === id)!;
  }
}

export async function deleteUnit(id: number): Promise<void> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const all = await fetchUnits();
    localStorage.setItem('product_units', JSON.stringify(all.filter(u => u.id !== id)));
    return;
  }

  try {
    const client = getSupabaseClient();
    const { error } = await client.from('product_units').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete unit failed:', error);
      const all = await fetchUnits();
      localStorage.setItem('product_units', JSON.stringify(all.filter(u => u.id !== id)));
    }
  } catch (error) {
    console.warn('Supabase not available:', error);
    const all = await fetchUnits();
    localStorage.setItem('product_units', JSON.stringify(all.filter(u => u.id !== id)));
  }
}
