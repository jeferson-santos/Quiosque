export interface User {
  username: string;
  role: string;
  [key: string]: any;
}

export interface LoginProps {
  onLogin: (user: User) => void;
}

export interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface CategoryCreate {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface CategoryUpdate {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category_id: number;
  category?: Category;
  is_active?: boolean;
  stock_quantity?: number;
  available_from?: string;
  available_until?: string;
  image_url?: string;
}

export interface ProductCreate {
  name: string;
  description?: string;
  price: number;
  category_id: number;
  is_active?: boolean;
  stock_quantity?: number;
  available_from?: string;
  available_until?: string;
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  price?: number;
  category_id?: number;
  is_active?: boolean;
  stock_quantity?: number;
  available_from?: string;
  available_until?: string;
}

export interface SystemStatus {
  id: number;
  orders_enabled: boolean;
  reason?: string;
  updated_by?: string;
  updated_at: string;
}

export interface SystemStatusUpdate {
  orders_enabled: boolean;
  reason?: string;
} 