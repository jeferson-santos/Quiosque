import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Skeleton,
  Divider
} from '@mui/material';
import ConfirmDialog from './ConfirmDialog';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { api, updateOrder } from '../config/api';

interface Product {
  id: number;
  name: string;
  price: number;
  category_id: number;
  out_of_stock?: boolean;
  stock_quantity?: number;
}

interface Category {
  id: number;
  name: string;
  display_order: number;
  is_active?: boolean;
  products?: Product[];
}

interface OrderItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  comment?: string;
  name?: string;
}

interface OrderCreatorProps {
  tableId: number;
  tableName?: string;
  onOrderCreated?: (order: any) => void;
  orderId?: number;
  initialItems?: OrderItem[];
  onOrderUpdated?: (order: any) => void;
  onCloseRequest?: (hasItems: boolean) => void;
  onCancelOrder?: () => void;
}

const QuantitySelector = ({
  value,
  onChange,
  disabled = false,
  size = 'medium'
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: 'small' | 'medium';
}) => {
  const handleIncrement = () => {
    if (!disabled) onChange(value + 1);
  };

  const handleDecrement = () => {
    if (!disabled && value > 1) onChange(value - 1);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      border: '1px solid #e2e8f0',
      borderRadius: 2,
      p: size === 'small' ? 0.5 : 1,
      backgroundColor: 'white'
    }}>
      <IconButton
        size={size}
        onClick={handleDecrement}
        disabled={disabled || value <= 1}
        sx={{
          color: '#64748b',
          '&:hover': { backgroundColor: 'rgba(100, 116, 139, 0.1)' },
          '&:disabled': { color: '#cbd5e1' }
        }}
      >
        <RemoveIcon fontSize={size === 'small' ? 'small' : 'medium'} />
      </IconButton>
      
      <Typography 
        variant={size === 'small' ? 'body2' : 'body1'} 
        sx={{ 
          fontWeight: 600, 
          minWidth: size === 'small' ? 20 : 30,
          textAlign: 'center',
          color: '#1e293b'
        }}
      >
        {value}
      </Typography>
      
      <IconButton
        size={size}
        onClick={handleIncrement}
        disabled={disabled}
        sx={{
          color: '#64748b',
          '&:hover': { backgroundColor: 'rgba(100, 116, 139, 0.1)' },
          '&:disabled': { color: '#cbd5e1' }
        }}
      >
        <AddIcon fontSize={size === 'small' ? 'small' : 'medium'} />
      </IconButton>
    </Box>
  );
};

const OrderCreator = ({ tableId, onOrderCreated, orderId, initialItems, onOrderUpdated, onCloseRequest, onCancelOrder }: OrderCreatorProps) => {
  const [items, setItems] = useState<OrderItem[]>(initialItems || []);
  const [selectedProduct, setSelectedProduct] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [stockWarning, setStockWarning] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [localStock, setLocalStock] = useState<{[key: number]: number}>({});
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState<boolean>(false);
  const [itemToRemove, setItemToRemove] = useState<number>(-1);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState<boolean>(false);
  const [systemBlockedDialogOpen, setSystemBlockedDialogOpen] = useState<boolean>(false);

  // Carregar todas as categorias com produtos
  useEffect(() => {
    const loadAllCategoriesWithProducts = async () => {
      try {
        setLoading(true);
        
        // Buscar todas as categorias ativas
        const categoriesResponse = await api.get('/categories', {
          params: { is_active: true }
        });
        
        const sortedCategories = categoriesResponse.data.sort((a: Category, b: Category) => a.display_order - b.display_order);
        
        // Buscar produtos para todas as categorias usando o endpoint de produtos com filtro
        const categoriesWithProducts = await Promise.all(
          sortedCategories.map(async (category: any) => {
            try {
              // Usar o endpoint de produtos com filtro por categoria
              const productsResponse = await api.get('/products', {
                params: { 
                  category_id: category.id,
                  is_active: true 
                }
              });
              
              return {
                ...category,
                products: productsResponse.data || []
              };
            } catch (error) {
              console.error(`Erro ao carregar produtos da categoria ${category.id}:`, error);
              return {
                ...category,
                products: []
              };
            }
          })
        );
        
        setCategories(categoriesWithProducts);
        
        // Selecionar a primeira categoria automaticamente
        if (categoriesWithProducts.length > 0) {
          setSelectedCategory(categoriesWithProducts[0].id);
        }
        
        // Inicializar estoque local
        const stockData: {[key: number]: number} = {};
        categoriesWithProducts.forEach(category => {
          if (category.products) {
            category.products.forEach((product: Product) => {
              stockData[product.id] = product.stock_quantity || 0;
            });
          }
        });
        setLocalStock(stockData);
        
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        setError('Erro ao carregar categorias');
      } finally {
        setLoading(false);
      }
    };

    loadAllCategoriesWithProducts();
  }, []);

  // Carregar status do sistema
  useEffect(() => {
    const loadSystemStatus = async () => {
      try {
        const response = await api.get('/system/status');
        setSystemStatus(response.data);
      } catch (error) {
        console.error('Erro ao carregar status do sistema:', error);
      }
    };

    loadSystemStatus();
  }, []);

  // Resetar quantidade para 1 quando produto mudar
  useEffect(() => {
    setQuantity(1);
  }, [selectedProduct]);

  // Limpar comentário quando produto mudar
  useEffect(() => {
    setComment('');
  }, [selectedProduct]);

  // Verificar estoque quando quantidade ou produto mudar
  useEffect(() => {
    if (!selectedProduct || typeof selectedProduct === 'string' || quantity <= 0) {
      setStockWarning('');
      return;
    }

    const realAvailableStock = getAvailableStock(selectedProduct);
    
    if (quantity > realAvailableStock) {
      setStockWarning(`⚠️ Quantidade excede estoque disponível (${realAvailableStock} unidades restantes)`);
    } else {
      setStockWarning('');
    }
  }, [quantity, selectedProduct, items]);

  const currentCategory = categories.find(cat => cat.id === selectedCategory);
  const currentProducts = currentCategory?.products || [];

  // Função para calcular estoque disponível considerando itens no carrinho
  const getAvailableStock = (productId: number) => {
    const totalStock = localStock[productId] || 0;
    const existingItem = items.find(item => item.product_id === productId);
    const quantityInCart = existingItem ? existingItem.quantity : 0;
    return totalStock - quantityInCart;
  };

  const categoryContainerRef = useRef<HTMLDivElement>(null);

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId);
    setSelectedProduct('');
    setComment('');
    setError('');
    setStockWarning('');

    // Auto-scroll to center the selected category
    if (categoryContainerRef.current) {
      const container = categoryContainerRef.current;
      const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
      
      if (categoryIndex !== -1) {
        const categoryButtons = container.querySelectorAll('button');
        const selectedButton = categoryButtons[categoryIndex] as HTMLElement;
        
        if (selectedButton) {
          const containerRect = container.getBoundingClientRect();
          const buttonRect = selectedButton.getBoundingClientRect();
          const containerCenter = containerRect.left + containerRect.width / 2;
          const buttonCenter = buttonRect.left + buttonRect.width / 2;
          const scrollOffset = buttonCenter - containerCenter;
          
          container.scrollBy({
            left: scrollOffset,
            behavior: 'smooth'
          });
        }
      }
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct || typeof selectedProduct === 'string' || quantity < 1) return;

    const product = currentProducts.find(p => p.id === selectedProduct);
    if (!product) return;

    // Verificar estoque considerando itens já no carrinho
    const realAvailableStock = getAvailableStock(selectedProduct);
    
    if (quantity > realAvailableStock) {
      setError(`Quantidade excede estoque disponível (${realAvailableStock} unidades restantes)`);
      return;
    }

    const currentComment = comment.trim() || undefined;
    const existingItemIndex = items.findIndex(item => 
      item.product_id === selectedProduct && 
      item.comment === currentComment
    );

    if (existingItemIndex >= 0) {
      // Atualizar item existente
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += quantity;
      setItems(updatedItems);
    } else {
      // Adicionar novo item
      const newItem: OrderItem = {
        product_id: selectedProduct,
        quantity: quantity,
        unit_price: product.price,
        comment: currentComment,
        name: product.name
      };
      setItems([...items, newItem]);
    }

    // Resetar formulário
    setSelectedProduct('');
    setComment('');
    setError('');
    setStockWarning('');
  };

  const handleAskRemoveItem = (index: number) => {
    setItemToRemove(index);
    setRemoveDialogOpen(true);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    setRemoveDialogOpen(false);
    setItemToRemove(-1);
  };

  const handleCancelRemove = () => {
    setRemoveDialogOpen(false);
    setItemToRemove(-1);
  };

  const handleSave = async () => {
    // Não permitir salvar se não há itens
    if (items.length === 0) return;

    if (!orderId && systemStatus?.orders_enabled === false) {
      setSystemBlockedDialogOpen(true);
      return;
    }

    setConfirmDialogOpen(true);
  };

  const saveOrder = async () => {
    try {
      setLoading(true);
      setError('');

      const orderData = {
        table_id: tableId,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          comment: item.comment
        }))
      };



      let response;
      if (orderId) {
        response = await updateOrder(tableId, orderId, orderData.items);
        onOrderUpdated?.(response);
      } else {
        response = await api.post(`/tables/${tableId}/orders`, orderData);
        onOrderCreated?.(response.data);
      }

      setSuccessDialogOpen(true);
      setConfirmDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar pedido:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Erro ao salvar pedido');
      }
      setConfirmDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSave = () => {
    saveOrder();
  };

  const handleCancelSave = () => {
    setConfirmDialogOpen(false);
  };

  const handleSuccessDialogClose = () => {
    setSuccessDialogOpen(false);
    if (onCloseRequest) {
      onCloseRequest(items.length > 0);
    }
  };

  // Removed problematic useEffect that was causing state resets

  const categoriesLoading = loading && categories.length === 0;

  // Se o sistema estiver bloqueado para novos pedidos, mostrar apenas a mensagem
  if (!orderId && systemStatus?.orders_enabled === false) {
    return (
          <Box sx={{ 
      pb: 2,
      pt: { xs: 2, sm: 0 }, // Padding superior para mobile
      px: { xs: 1, sm: 0 }  // Padding horizontal para mobile
    }}>
      <Card sx={{
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: 3
      }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 700,
              color: '#dc2626',
              mb: 2
            }}>
              ⚠️ Sistema Bloqueado
            </Typography>
            <Typography variant="body1" sx={{ 
              color: '#1e293b',
              mb: 2
            }}>
              O sistema está temporariamente bloqueado para novos pedidos.
            </Typography>
            {systemStatus?.reason && (
              <Box sx={{
                mt: 2,
                p: 2,
                bgcolor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 2,
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Motivo:</strong> {systemStatus.reason}
                </Typography>
              </Box>
            )}
            <Typography variant="body2" sx={{ 
              color: '#64748b',
              mt: 2,
              fontStyle: 'italic'
            }}>
              Tente novamente mais tarde ou entre em contato com o administrador.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      pb: 2,
      pt: { xs: 2, sm: 0 }, // Padding superior para mobile
      px: { xs: 0, sm: 0 }  // Sem padding horizontal no mobile para ocupar toda a largura
    }}>
      {/* Menu de Categorias - Barra Superior */}
      <Card sx={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(102, 126, 234, 0.1)',
        borderRadius: { xs: 0, sm: 3 }, // Sem border radius no mobile
        mt: { xs: 0, sm: 2 }, // Sem margin no mobile
        mb: 1
      }}>
        {categoriesLoading ? (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
              {[...Array(6)].map((_, index) => (
                <Skeleton key={index} variant="rectangular" width={120} height={48} sx={{ borderRadius: 2, flexShrink: 0 }} />
              ))}
            </Box>
          </Box>
        ) : (
          <Box 
            ref={categoryContainerRef}
            sx={{ 
              display: 'flex', 
              gap: 1, 
              p: 2,
              overflowX: 'auto',
              '&::-webkit-scrollbar': {
                height: 6
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0,0,0,0.05)',
                borderRadius: 3
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(102, 126, 234, 0.3)',
                borderRadius: 3,
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.5)'
                }
              }
            }}
          >
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'contained' : 'outlined'}
                onClick={() => handleCategorySelect(category.id)}
                disabled={categoriesLoading}
                sx={{
                  minWidth: 'fit-content',
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: selectedCategory === category.id ? 600 : 500,
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  ...(selectedCategory === category.id ? {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 14px rgba(102, 126, 234, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                      transform: 'translateY(-1px)'
                    }
                  } : {
                    borderColor: 'rgba(102, 126, 234, 0.3)',
                    color: '#64748b',
                    '&:hover': {
                      borderColor: '#667eea',
                      color: '#667eea',
                      backgroundColor: 'rgba(102, 126, 234, 0.05)'
                    }
                  }),
                  transition: 'all 0.2s ease'
                }}
              >
                {category.name}
              </Button>
            ))}
          </Box>
        )}
      </Card>

      {/* Área de Produtos e Pedido */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Seleção de Produto */}
        {selectedCategory && (
          <Card sx={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: { xs: 0, sm: 3 }
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: 2
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  alignItems: { xs: 'stretch', sm: 'flex-end' }
                }}>
                  <Box sx={{ flex: { xs: 'none', sm: 1 } }}>
                    <TextField
                      select
                      label="Produto"
                      value={selectedProduct}
                      onChange={e => setSelectedProduct(Number(e.target.value))}
                      fullWidth
                      required
                      disabled={categoriesLoading}
                      SelectProps={{
                        MenuProps: {
                          PaperProps: {
                            sx: {
                              maxHeight: 300,
                              '&::-webkit-scrollbar': {
                                width: 8
                              },
                              '&::-webkit-scrollbar-track': {
                                backgroundColor: 'rgba(0,0,0,0.05)',
                                borderRadius: 4
                              },
                              '&::-webkit-scrollbar-thumb': {
                                backgroundColor: 'rgba(102, 126, 234, 0.3)',
                                borderRadius: 4,
                                '&:hover': {
                                  backgroundColor: 'rgba(102, 126, 234, 0.5)'
                                }
                              }
                            }
                          }
                        }
                      }}
                      sx={{
                        borderRadius: 2,
                        background: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      }}
                    >
                      {currentProducts
                        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                        .map(product => {
                        const availableStock = getAvailableStock(product.id);
                        const isOut = availableStock <= 0;
                        return (
                          <MenuItem
                            key={product.id}
                            value={product.id}
                            disabled={isOut}
                            sx={isOut ? {
                              color: '#9ca3af',
                              textDecoration: 'line-through',
                              fontStyle: 'italic',
                              backgroundColor: 'rgba(239,68,68,0.04)'
                            } : {}}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                              <span>{product.name}</span>
                              <Typography variant="body2" sx={{
                                color: '#059669',
                                fontWeight: 600
                              }}>
                                R$ {product.price.toFixed(2)}
                              </Typography>
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </TextField>
                  </Box>

                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'row', sm: 'column' },
                    alignItems: { xs: 'center', sm: 'center' },
                    gap: { xs: 2, sm: 1 },
                    justifyContent: { xs: 'space-between', sm: 'flex-start' }
                  }}>
                    <Typography variant="body2" sx={{ 
                      mb: { xs: 0, sm: 1 },
                      fontWeight: 500,
                      color: '#1e293b'
                    }}>
                      Quantidade
                    </Typography>
                    <QuantitySelector
                      value={quantity}
                      onChange={setQuantity}
                      disabled={loading || !selectedProduct}
                      size="medium"
                    />
                  </Box>

                  <Box sx={{ flex: { xs: 'none', sm: 1 } }}>
                    <TextField
                      label="Comentário"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      fullWidth
                      disabled={!selectedProduct || typeof selectedProduct === 'string'}
                      placeholder={!selectedProduct || typeof selectedProduct === 'string' ? 'Selecione um produto primeiro' : 'Adicione um comentário...'}
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea'
                          }
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && selectedProduct && quantity > 0) {
                          handleAddItem();
                        }
                      }}
                    />
                  </Box>

                  <Button
                    variant="contained"
                    onClick={handleAddItem}
                    disabled={!selectedProduct || quantity < 1 || loading || stockWarning !== ''}
                    sx={{
                      height: { xs: 48, sm: 56 },
                      minWidth: { xs: '100%', sm: 56 },
                      background: stockWarning ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: stockWarning ? '0 4px 14px rgba(245, 158, 11, 0.3)' : '0 4px 14px rgba(16, 185, 129, 0.3)',
                      '&:hover': {
                        background: stockWarning ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        boxShadow: stockWarning ? '0 6px 20px rgba(245, 158, 11, 0.4)' : '0 6px 20px rgba(16, 185, 129, 0.4)',
                        transform: 'translateY(-1px)'
                      },
                      '&:disabled': {
                        background: '#e5e7eb',
                        color: '#9ca3af'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                
                {/* Warning de estoque - linha nova */}
                {stockWarning && (
                  <Box sx={{ 
                    width: '100%',
                    mt: 1
                  }}>
                    <Typography variant="caption" sx={{ 
                      color: '#f59e0b',
                      fontWeight: 500
                    }}>
                      {stockWarning}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Mensagem de Erro - Posicionada após o formulário */}
        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Lista de Itens do Pedido */}
        {items.length > 0 && (
          <Card sx={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: { xs: 0, sm: 3 }
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600,
                  color: '#1e293b'
                }}>
                  Itens do pedido
                </Typography>
                <Chip 
                  label={`${items.length} item${items.length > 1 ? 's' : ''}`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    color: '#667eea',
                    fontWeight: 600
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {items.map((item, idx) => (
                  <React.Fragment key={item.product_id}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      py: 1,
                      px: 2,
                      gap: 2,
                      background: idx % 2 === 0 ? '#f1f5f9' : '#fff',
                      borderRadius: 2,
                      transition: 'background 0.2s',
                      '&:hover': { background: '#e0e7ef' }
                    }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ 
                          fontWeight: 700, 
                          color: '#3b82f6', 
                          mb: 0.5
                        }}>
                          {item.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 600, 
                            color: '#2563eb'
                          }}>
                            Qtd: {item.quantity}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 600, 
                            color: '#059669'
                          }}>
                            Un: R$ {item.unit_price.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 600, 
                            color: '#059669'
                          }}>
                            Tot: R$ {(item.unit_price * item.quantity).toFixed(2)}
                          </Typography>
                          {item.comment && (
                            <Typography variant="body2" sx={{ 
                              color: '#64748b', 
                              fontStyle: 'italic'
                            }}>
                              {item.comment}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <IconButton 
                        onClick={() => handleAskRemoveItem(idx)} 
                        color="error" 
                        size="medium"
                        sx={{ 
                          backgroundColor: 'rgba(239,68,68,0.08)', 
                          '&:hover': { backgroundColor: 'rgba(239,68,68,0.18)' } 
                        }}
                      >
                        <RemoveIcon />
                      </IconButton>
                    </Box>
                    <Divider />
                  </React.Fragment>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Mensagem quando não há itens durante edição */}
        {orderId && items.length === 0 && (
          <Card sx={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: { xs: 0, sm: 3 },
            mt: 2
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600,
                color: '#92400e',
                mb: 1
              }}>
                ⚠️ Nenhum item no pedido
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#a16207',
                fontStyle: 'italic',
                mb: 3
              }}>
                Para remover todos os itens, use o botão "CANCELAR PEDIDO" abaixo
              </Typography>
              
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  // Se há uma função específica de cancelamento, use-a
                  if (onCancelOrder) {
                    onCancelOrder();
                  } else {
                    // Caso contrário, apenas feche o modal
                    if (onCloseRequest) {
                      onCloseRequest(false); // false indica que não há itens
                    }
                  }
                }}
                sx={{ 
                  minWidth: 140,
                  px: 3,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                CANCELAR PEDIDO
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Total e Botão - Visível apenas quando há itens OU quando não está editando */}
        {(items.length > 0 || !orderId) && (
          <Card sx={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: { xs: 0, sm: 3 },
            mt: 2
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: 2,
                p: 3,
                backgroundColor: 'rgba(102, 126, 234, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(102, 126, 234, 0.1)'
              }}>
                <Typography variant="h5" sx={{ 
                  fontWeight: 700,
                  color: '#1e293b',
                  textAlign: 'center'
                }}>
                  Total: R$ {items.reduce((acc: number, item: OrderItem) => acc + item.unit_price * item.quantity, 0).toFixed(2)}
                </Typography>

                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSave}
                  disabled={loading || items.length === 0 || (!orderId && systemStatus?.orders_enabled === false)}
                  sx={{ 
                    minWidth: 140,
                    px: 3,
                    py: 1.5,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                      transform: 'translateY(-1px)'
                    },
                    '&:disabled': {
                      background: '#e5e7eb',
                      color: '#9ca3af'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  {loading ? (
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                  ) : (
                    orderId ? 'ATUALIZAR PEDIDO' : 'Fechar pedido'
                  )}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      <ConfirmDialog
        open={removeDialogOpen}
        onClose={handleCancelRemove}
        onConfirm={() => handleRemoveItem(itemToRemove)}
        title="Remover Item"
        description={<>Remover este item do pedido. A remoção é permanente.</>}
        confirmText="Remover"
        variant="danger"
      />

      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={handleCancelSave}
        onConfirm={handleConfirmSave}
        title="Confirmação"
        description={<>Confirmar fechamento do pedido.</>}
        confirmText="Confirmar"
        variant="success"
      >
        <Box sx={{ 
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          p: 2,
          borderRadius: 2,
          border: '1px solid rgba(16, 185, 129, 0.2)',
          mt: 2
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 700,
            color: '#10b981',
            textAlign: 'center'
          }}>
            Total: R$ {items.reduce((acc: number, item: OrderItem) => acc + item.unit_price * item.quantity, 0).toFixed(2)}
          </Typography>
        </Box>
      </ConfirmDialog>

      {/* Dialog de sucesso */}
      <Dialog
        open={successDialogOpen}
        onClose={handleSuccessDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.05)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0',
          pb: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            ✅ Sucesso
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Pedido processado com sucesso
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
            <Box sx={{ 
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              p: 3,
              borderRadius: 3,
              border: '1px solid rgba(16, 185, 129, 0.2)',
              textAlign: 'center',
              width: '100%'
            }}>
              <Typography variant="h5" sx={{ 
                fontWeight: 700,
                color: '#10b981',
                mb: 1
              }}>
                Pedido Salvo!
              </Typography>
              <Typography variant="body1" sx={{ 
                fontWeight: 600,
                color: '#1e293b',
                mb: 2
              }}>
                O pedido foi processado e salvo com sucesso.
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#64748b',
                fontStyle: 'italic'
              }}>
                O pedido está pronto para ser atendido.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleSuccessDialogClose} 
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de sistema bloqueado */}
      <Dialog
        open={systemBlockedDialogOpen} 
        onClose={() => setSystemBlockedDialogOpen(false)}
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.05)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0',
          pb: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            ⚠️ Sistema Bloqueado
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Pedidos temporariamente suspensos
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
            <Box sx={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              p: 3,
              borderRadius: 3,
              border: '1px solid rgba(239, 68, 68, 0.2)',
              textAlign: 'center',
              width: '100%'
            }}>
              <Typography variant="h5" sx={{ 
                fontWeight: 700,
                color: '#dc2626',
                mb: 1
              }}>
                Sistema Não Aceita Pedidos
              </Typography>
              <Typography variant="body1" sx={{ 
                fontWeight: 600,
                color: '#1e293b',
                mb: 2
              }}>
                O sistema está temporariamente bloqueado para novos pedidos.
              </Typography>
              {systemStatus?.reason && (
                <Box sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 2,
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Motivo:</strong> {systemStatus.reason}
                  </Typography>
                </Box>
              )}
              <Typography variant="body2" sx={{ 
                color: '#64748b',
                mt: 2,
                fontStyle: 'italic'
              }}>
                Tente novamente mais tarde ou entre em contato com o administrador.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setSystemBlockedDialogOpen(false)} 
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1,
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Entendi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderCreator; 