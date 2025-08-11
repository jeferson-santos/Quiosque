import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// URL base da API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Instância do Axios configurada
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
});

// Interceptor para adicionar token JWT automaticamente
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log da requisição
    console.log('🌐 === INTERCEPTOR REQUEST ===');
    console.log('   - Method:', config.method?.toUpperCase());
    console.log('   - URL:', (config.baseURL || '') + (config.url || ''));
    console.log('   - Params:', config.params);
    console.log('   - Headers:', config.headers);
    console.log('   - Token presente:', !!token);
    
    return config;
  },
  (error) => {
    console.error('❌ === INTERCEPTOR REQUEST ERROR ===');
    console.error('   - Erro:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log da resposta bem-sucedida
    console.log('✅ === INTERCEPTOR RESPONSE ===');
    console.log('   - Status:', response.status);
    console.log('   - Status Text:', response.statusText);
    console.log('   - URL:', response.config.url);
    console.log('   - Method:', response.config.method?.toUpperCase());
    console.log('   - Data:', response.data);
    
    return response;
  },
  (error) => {
    // Log da resposta com erro
    console.error('❌ === INTERCEPTOR RESPONSE ERROR ===');
    console.error('   - Status:', error.response?.status);
    console.error('   - Status Text:', error.response?.statusText);
    console.error('   - URL:', error.config?.url);
    console.error('   - Method:', error.config?.method?.toUpperCase());
    console.error('   - Error Data:', error.response?.data);
    
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      console.log('🔒 Interceptor: Token inválido/expirado, limpando dados locais');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Só redirecionar se não estiver na página de login
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && !currentPath.includes('/login')) {
        console.log('🔄 Interceptor: Redirecionando para /login');
        window.location.href = '/login';
      } else {
        console.log('🔒 Interceptor: Já está na página de login, não redirecionando');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Função para login usando o endpoint da API
export async function loginApi(username: string, password: string) {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);
  params.append('grant_type', 'password');

  const response = await axios.post(
    API_BASE_URL + '/login/',
    params,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  return response.data; // { access_token, token_type }
}

// Função para buscar dados do usuário autenticado
export async function getUserByUsername(username: string) {
  const response = await api.get(`/users/${username}`);
  return response.data; // { username, role, id }
}

// Função para buscar todos os usuários
export async function getUsers() {
  const response = await api.get('/users/');
  return response.data;
}

// Função para criar usuário
export async function createUser(userData: {
  username: string;
  password: string;
  role: 'waiter' | 'administrator';
}) {
  const response = await api.post('/users/', userData);
  return response.data;
}

// Função para atualizar senha do usuário
export async function updateUserPassword(username: string, password: string) {
  const response = await api.put(`/users/${username}/password`, {
    password: password
  });
  return response.data;
}

// Função para atualizar role do usuário
export async function updateUserRole(username: string, role: 'waiter' | 'administrator') {
  const response = await api.put(`/users/${username}/role`, {
    role: role
  });
  return response.data;
}

// Função para excluir usuário
export async function deleteUser(username: string) {
  const response = await api.delete(`/users/${username}`);
  return response.data;
}

// Função para buscar produtos
export async function getProducts() {
  const response = await api.get('/products/');
  return response.data;
}

// Função para buscar quartos
export async function getRooms() {
  const response = await api.get('/rooms/');
  return response.data;
}

// Função para criar quarto
export async function createRoom(roomData: {
  number: string;
  guest_name?: string;
}) {
  const response = await api.post('/rooms/', roomData);
  return response.data;
}

// Função para atualizar quarto
export async function updateRoom(roomId: number, roomData: {
  number: string;
  guest_name?: string;
}) {
  const response = await api.put(`/rooms/${roomId}`, roomData);
  return response.data;
}

// Função para excluir quarto
export async function deleteRoom(roomId: number) {
  const response = await api.delete(`/rooms/${roomId}`);
  return response.data;
}

// Função para obter relatório de consumo do quarto
export async function getRoomConsumptionReport(roomId: number, date: string, includeAllTables: boolean = false) {
  console.log('🔧 === API: getRoomConsumptionReport ===');
  console.log('   - roomId:', roomId);
  console.log('   - date:', date);
  console.log('   - includeAllTables:', includeAllTables);
  console.log('   - URL completa:', `/rooms/${roomId}/consumption-report`);
  console.log('   - Parâmetros:', { date, include_all_tables: includeAllTables });
  
  try {
    const response = await api.get(`/rooms/${roomId}/consumption-report`, {
      params: {
        date: date,
        include_all_tables: includeAllTables
      }
    });
    
    console.log('✅ === API: Resposta recebida ===');
    console.log('   - Status:', response.status);
    console.log('   - Status Text:', response.statusText);
    console.log('   - Headers:', response.headers);
    console.log('   - Data:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('❌ === API: Erro na requisição ===');
    console.error('   - Erro:', error);
    if (error.response) {
      console.error('   - Status:', error.response.status);
      console.error('   - Data:', error.response.data);
      console.error('   - Headers:', error.response.headers);
    }
    throw error;
  }
}

// Função para buscar mesas de um quarto
export async function getRoomTables(roomId: number) {
  console.log('🔧 === API: getRoomTables ===');
  console.log('   - roomId:', roomId);
  console.log('   - URL completa:', `/rooms/${roomId}/tables`);
  
  try {
    const response = await api.get(`/rooms/${roomId}/tables`);
    
    console.log('✅ === API: Resposta recebida ===');
    console.log('   - Status:', response.status);
    console.log('   - Status Text:', response.statusText);
    console.log('   - Data:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('❌ === API: Erro na requisição ===');
    console.error('   - Erro:', error);
    if (error.response) {
      console.error('   - Status:', error.response.status);
      console.error('   - Data:', error.response.data);
      console.error('   - Headers:', error.response.headers);
    }
    throw error;
  }
}

// Função para imprimir relatório de consumo do quarto
export async function printRoomConsumptionReport(roomId: number, date: string) {
  const response = await api.post(`/rooms/${roomId}/print-consumption-report`, {}, {
    params: {
      date: date
    }
  });
  return response.data;
}

// Função para buscar mesas
export async function getTables(is_closed: boolean) {
  const params = { is_closed };
  const response = await api.get('/tables/', { params });
  return response.data;
}

// Função para buscar pedidos de uma mesa
export async function getOrdersByTable(table_id: number) {
  const response = await api.get(`/tables/${table_id}/orders`);
  return response.data;
}

// Função para criar mesa
export async function createTable(name: string, room_id?: number) {
  console.log('🔧 === API: createTable ===');
  console.log('   - name:', name);
  console.log('   - room_id:', room_id);
  console.log('   - room_id type:', typeof room_id);
  console.log('   - URL completa:', '/tables/');
  console.log('   - Body:', { name, room_id });
  
  try {
    const response = await api.post('/tables/', { name, room_id });
    
    console.log('✅ === API: Resposta recebida ===');
    console.log('   - Status:', response.status);
    console.log('   - Status Text:', response.statusText);
    console.log('   - Data:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('❌ === API: Erro na requisição ===');
    console.error('   - Erro:', error);
    if (error.response) {
      console.error('   - Status:', error.response.status);
      console.error('   - Data:', error.response.data);
      console.error('   - Headers:', error.response.headers);
    }
    throw error;
  }
}

// Função para criar pedido em uma mesa
export async function createOrder(table_id: number, items: Array<{ product_id: number; quantity: number; unit_price: number; comment?: string }>, comment?: string) {
  const response = await api.post(`/tables/${table_id}/orders`, { items, comment });
  return response.data;
}

// Função para atualizar pedido
export async function updateOrder(table_id: number, order_id: number, items: Array<{ product_id: number; quantity: number; unit_price: number; comment?: string }>, comment?: string) {
  // Converter os itens para o formato esperado pela API
  const items_actions = items.map(item => ({
    action: 'add',
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    comment: item.comment
  }));

  const response = await api.put(`/tables/${table_id}/orders/${order_id}`, { 
    items_actions,
    comment 
  });
  return response.data;
}

// Função para fechar mesa
export async function closeTable(table_id: number, service_tax: boolean, generate_invoice?: boolean, payment_method?: string, payment_option?: string, amount_paid?: number, change?: number) {
  const body: any = { 
    service_tax,
    generate_invoice: generate_invoice ?? false,
    payment_option: payment_option || 'immediate',
    payment_method: payment_method || 'cash',
    amount_paid: amount_paid || 0,
    change: change || 0
  };
  
  const response = await api.put(`/tables/${table_id}/close`, body);
  return response.data;
}

// Função para atualizar status do pedido
export async function updateOrderStatus(table_id: number, order_id: number, status: string) {
  const response = await api.put(`/tables/${table_id}/orders/${order_id}/status`, { status });
  return response.data;
}

// Função para finalizar pedido
export async function finishOrder(table_id: number, order_id: number) {
  const response = await api.put(`/tables/${table_id}/orders/${order_id}/finish`);
  return response.data;
}

export async function cancelOrder(table_id: number, order_id: number) {
  // API correta para remover/cancelar definitivamente um pedido
  const response = await api.delete(`/tables/${table_id}/orders/${order_id}`);
  return response.data;
}

export async function updateOrderItem(table_id: number, order_id: number, item_id: number, itemData: {
  quantity?: number;
  unit_price?: number;
  comment?: string;
}) {
  const response = await api.put(`/tables/${table_id}/orders/${order_id}/items/${item_id}`, itemData);
  return response.data;
}

export async function deleteOrderItem(table_id: number, order_id: number, item_id: number) {
  const response = await api.delete(`/tables/${table_id}/orders/${order_id}/items/${item_id}`);
  return response.data;
}

export async function addOrderItem(table_id: number, order_id: number, itemData: {
  product_id: number;
  quantity: number;
  unit_price: number;
  comment?: string;
}) {
  const response = await api.post(`/tables/${table_id}/orders/${order_id}/items`, itemData);
  return response.data;
}

// Função para atualizar produto (incluindo imagem)
export async function updateProduct(productId: number, productData: {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  is_active?: boolean;
  image_url?: string;
  stock_quantity?: number;
  available_from?: string;
  available_until?: string;
}) {
  const response = await api.patch(`/products/${productId}`, productData);
  return response.data;
}

// Função para upload de imagem de produto
export async function uploadProductImage(productId: number, imageFile: File) {
  try {
    // Criar FormData para enviar arquivo binário
    const formData = new FormData();
    formData.append('file', imageFile);

    // Enviar arquivo binário para o endpoint de upload
    const response = await api.post(`/products/${productId}/upload_image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro no upload de imagem:', error);
    throw error;
  }
} 

// Função para buscar imagem de produto
export async function fetchProductImage(productId: number): Promise<string | null> {
  try {
    const response = await api.get(`/products/${productId}/image`, {
      responseType: 'blob',
    });
    if (response.data) {
      return URL.createObjectURL(response.data);
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar imagem do produto', productId, error);
    return null;
  }
} 

// Função para remover imagem de produto
export async function deleteProductImage(productId: number): Promise<void> {
  try {
    await api.delete(`/products/${productId}/image`);
  } catch (error) {
    console.error('Erro ao remover imagem do produto', productId, error);
    throw error;
  }
} 

// ===== FUNÇÕES DE CATEGORIAS =====

// Função para buscar todas as categorias
export async function getCategories(is_active?: boolean) {
  const params = is_active !== undefined ? { is_active } : {};
  const response = await api.get('/categories/', { params });
  return response.data;
}

// Função para buscar categoria específica
export async function getCategory(categoryId: number) {
  const response = await api.get(`/categories/${categoryId}`);
  return response.data;
}

// Função para criar categoria
export async function createCategory(categoryData: {
  name: string;
  description?: string;
  is_active?: boolean;
}) {
  const response = await api.post('/categories/', categoryData);
  return response.data;
}

// Função para atualizar categoria
export async function updateCategory(categoryId: number, categoryData: {
  name?: string;
  description?: string;
  is_active?: boolean;
}) {
  const response = await api.patch(`/categories/${categoryId}`, categoryData);
  return response.data;
}

// Função para excluir categoria
export async function deleteCategory(categoryId: number) {
  const response = await api.delete(`/categories/${categoryId}`);
  return response.data;
}

// Função para buscar categoria com produtos
export async function getCategoryWithProducts(categoryId: number) {
  const response = await api.get(`/categories/${categoryId}/with-products`);
  return response.data;
}

// ===== FUNÇÕES DE PRODUTOS ATUALIZADAS =====

// Função para criar produto
export async function createProduct(productData: {
  name: string;
  description?: string;
  price: number;
  category_id: number;
  is_active?: boolean;
  stock_quantity?: number;
  available_from?: string;
  available_until?: string;
}) {
  const response = await api.post('/products/', productData);
  return response.data;
}

// Função para excluir produto
export async function deleteProduct(productId: number) {
  const response = await api.delete(`/products/${productId}`);
  return response.data;
}

// Função para aumentar estoque do produto
export async function increaseProductStock(productId: number, quantity: number) {
  const response = await api.patch(`/products/${productId}/increase_stock`, { quantity });
  return response.data;
}

// Função para diminuir estoque do produto
export async function decreaseProductStock(productId: number, quantity: number) {
  const response = await api.patch(`/products/${productId}/decrease_stock`, { quantity });
  return response.data;
} 

// Função para obter o status do sistema
export async function getSystemStatus() {
  const response = await api.get('/system/status');
  return response.data; // { orders_enabled, reason, id, updated_by, updated_at }
}

// Função para atualizar o status do sistema
export async function updateSystemStatus(statusData: {
  orders_enabled: boolean;
  reason?: string;
}) {
  const response = await api.patch('/system/status', statusData);
  return response.data; // { orders_enabled, reason, id, updated_by, updated_at }
} 