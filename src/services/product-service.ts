
const API_BASE = '/api';

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
  min_stock: number;
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
  purchase_price?: string;
  selling_price?: string;
  min_stock?: number;
  max_stock?: number;
  is_active: boolean;
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 1,
    code: 'PRD001',
    name: '防暴盾牌',
    category: '防护装备',
    unit: '个',
    specification: '100*50cm',
    barcode: '6901234567890',
    purchase_price: '150.00',
    selling_price: '200.00',
    min_stock: 10,
    max_stock: 100,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: 2,
    code: 'PRD002',
    name: '防刺服',
    category: '防护装备',
    unit: '件',
    specification: 'L号',
    barcode: '6901234567891',
    purchase_price: '300.00',
    selling_price: '400.00',
    min_stock: 5,
    max_stock: 50,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: 3,
    code: 'PRD003',
    name: '防割手套',
    category: '防护装备',
    unit: '双',
    specification: '均码',
    barcode: '6901234567892',
    purchase_price: '50.00',
    selling_price: '80.00',
    min_stock: 20,
    max_stock: 200,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: 4,
    code: 'PRD004',
    name: '警用强光手电',
    category: '装备器材',
    unit: '把',
    specification: '2000流明',
    barcode: '6901234567893',
    purchase_price: '120.00',
    selling_price: '180.00',
    min_stock: 15,
    max_stock: 100,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: 5,
    code: 'PRD005',
    name: '警戒带',
    category: '警示器材',
    unit: '卷',
    specification: '100米/卷',
    barcode: '6901234567894',
    purchase_price: '30.00',
    selling_price: '50.00',
    min_stock: 30,
    max_stock: 300,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
];

async function isApiAvailable(): Promise&lt;boolean&gt; {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchProducts(): Promise&lt;Product[]&gt; {
  const hasApi = await isApiAvailable();
  
  if (!hasApi) {
    try {
      const saved = localStorage.getItem('products');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.products || DEFAULT_PRODUCTS;
      }
      localStorage.setItem('products', JSON.stringify({ products: DEFAULT_PRODUCTS, nextId: 6 }));
      return DEFAULT_PRODUCTS;
    } catch {
      return DEFAULT_PRODUCTS;
    }
  }

  try {
    const response = await fetch(`${API_BASE}/products`);
    if (!response.ok) {
      throw new Error('API request failed');
    }
    return await response.json();
  } catch (error) {
    console.warn('API not available, using localStorage:', error);
    try {
      const saved = localStorage.getItem('products');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.products || DEFAULT_PRODUCTS;
      }
      localStorage.setItem('products', JSON.stringify({ products: DEFAULT_PRODUCTS, nextId: 6 }));
      return DEFAULT_PRODUCTS;
    } catch {
      return DEFAULT_PRODUCTS;
    }
  }
}

export async function createProduct(product: ProductFormData): Promise&lt;Product&gt; {
  const hasApi = await isApiAvailable();
  
  if (!hasApi) {
    const allProducts = await fetchProducts();
    const saved = localStorage.getItem('products');
    let nextId = 6;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    const newProduct: Product = {
      ...product,
      id: nextId,
      category: product.category || null,
      specification: product.specification || null,
      barcode: product.barcode || null,
      purchase_price: product.purchase_price || null,
      selling_price: product.selling_price || null,
      min_stock: product.min_stock || 0,
      max_stock: product.max_stock || null,
      created_at: new Date().toISOString(),
      updated_at: null
    };
    
    const updated = [...allProducts, newProduct];
    localStorage.setItem('products', JSON.stringify({ products: updated, nextId: nextId + 1 }));
    return newProduct;
  }

  try {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API not available, using localStorage:', error);
    const allProducts = await fetchProducts();
    const saved = localStorage.getItem('products');
    let nextId = 6;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    const newProduct: Product = {
      ...product,
      id: nextId,
      category: product.category || null,
      specification: product.specification || null,
      barcode: product.barcode || null,
      purchase_price: product.purchase_price || null,
      selling_price: product.selling_price || null,
      min_stock: product.min_stock || 0,
      max_stock: product.max_stock || null,
      created_at: new Date().toISOString(),
      updated_at: null
    };
    
    const updated = [...allProducts, newProduct];
    localStorage.setItem('products', JSON.stringify({ products: updated, nextId: nextId + 1 }));
    return newProduct;
  }
}

export async function updateProduct(id: number, product: ProductFormData): Promise&lt;Product&gt; {
  const hasApi = await isApiAvailable();
  
  if (!hasApi) {
    const allProducts = await fetchProducts();
    const updatedProducts = allProducts.map(p =&gt; 
      p.id === id ? { 
        ...p, 
        ...product,
        category: product.category !== undefined ? product.category : p.category,
        specification: product.specification !== undefined ? product.specification : p.specification,
        barcode: product.barcode !== undefined ? product.barcode : p.barcode,
        purchase_price: product.purchase_price !== undefined ? product.purchase_price : p.purchase_price,
        selling_price: product.selling_price !== undefined ? product.selling_price : p.selling_price,
        min_stock: product.min_stock !== undefined ? product.min_stock : p.min_stock,
        max_stock: product.max_stock !== undefined ? product.max_stock : p.max_stock,
        is_active: product.is_active !== undefined ? product.is_active : p.is_active,
        updated_at: new Date().toISOString()
      } : p
    );
    
    const saved = localStorage.getItem('products');
    let nextId = 6;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    localStorage.setItem('products', JSON.stringify({ products: updatedProducts, nextId }));
    const updated = updatedProducts.find(p =&gt; p.id === id);
    if (!updated) throw new Error('Product not found');
    return updated;
  }

  try {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API not available, using localStorage:', error);
    const allProducts = await fetchProducts();
    const updatedProducts = allProducts.map(p =&gt; 
      p.id === id ? { 
        ...p, 
        ...product,
        category: product.category !== undefined ? product.category : p.category,
        specification: product.specification !== undefined ? product.specification : p.specification,
        barcode: product.barcode !== undefined ? product.barcode : p.barcode,
        purchase_price: product.purchase_price !== undefined ? product.purchase_price : p.purchase_price,
        selling_price: product.selling_price !== undefined ? product.selling_price : p.selling_price,
        min_stock: product.min_stock !== undefined ? product.min_stock : p.min_stock,
        max_stock: product.max_stock !== undefined ? product.max_stock : p.max_stock,
        is_active: product.is_active !== undefined ? product.is_active : p.is_active,
        updated_at: new Date().toISOString()
      } : p
    );
    
    const saved = localStorage.getItem('products');
    let nextId = 6;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    localStorage.setItem('products', JSON.stringify({ products: updatedProducts, nextId }));
    const updated = updatedProducts.find(p =&gt; p.id === id);
    if (!updated) throw new Error('Product not found');
    return updated;
  }
}

export async function deleteProduct(id: number): Promise&lt;void&gt; {
  const hasApi = await isApiAvailable();
  
  if (!hasApi) {
    const allProducts = await fetchProducts();
    const updated = allProducts.filter(p =&gt; p.id !== id);
    
    const saved = localStorage.getItem('products');
    let nextId = 6;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    localStorage.setItem('products', JSON.stringify({ products: updated, nextId }));
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
  } catch (error) {
    console.warn('API not available, using localStorage:', error);
    const allProducts = await fetchProducts();
    const updated = allProducts.filter(p =&gt; p.id !== id);
    
    const saved = localStorage.getItem('products');
    let nextId = 6;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        nextId = parsed.nextId || nextId;
      } catch {
        // ignore
      }
    }
    
    localStorage.setItem('products', JSON.stringify({ products: updated, nextId }));
  }
}
