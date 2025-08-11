import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  TextField,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Snackbar
} from '@mui/material';
import ConfirmDialog from './ConfirmDialog';
import { getTables, getOrdersByTable, getProducts, finishOrder, cancelOrder, updateOrderItem, deleteOrderItem, addOrderItem } from '../config/api';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CancelIcon from '@mui/icons-material/Cancel';
import CommentIcon from '@mui/icons-material/Comment';

interface Table {
  id: number;
  name: string;
  is_closed: boolean;
  room_id?: number;
  created_by?: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category?: string;
}

interface Order {
  id: number;
  table_id: number;
  status: string;
  total_amount: number;
  total_items: number;
  created_at: string;
  created_by?: string;
  room_id?: number;
  table_name?: string;
  items: Array<{
    product_id: number;
    quantity: number;
    unit_price: number;
    comment?: string;
  }>;
  finished_by?: string; // Adicionado para armazenar o usuário que finalizou
}

const OrderList = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [orderToComplete, setOrderToComplete] = useState<Order | null>(null);
  // const theme = useMuiTheme();
  const isMobile = false; // Temporariamente desabilitado

  // Usuário autenticado
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [expandedOrderIds, setExpandedOrderIds] = useState<number[]>([]);

  // Estados para gerenciamento de pedidos
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [orderToAddItem, setOrderToAddItem] = useState<Order | null>(null);
  const [newItemData, setNewItemData] = useState({
    product_id: '',
    quantity: 1,
    unit_price: 0,
    comment: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  const toggleOrderExpand = (orderId: number) => {
    setExpandedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    }
  }, []);

  // Carregar mesas e produtos
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getTables(false),
      getProducts()
    ])
      .then(([tablesData, productsData]) => {
        setTables(tablesData);
        setProducts(productsData);
        setLoading(false);
      })
      .catch(() => {
        setError('Erro ao carregar dados');
        setLoading(false);
      });
  }, []);

  // Carregar todos os pedidos de todas as mesas
  useEffect(() => {
    if (tables.length > 0) {
      const loadAllOrders = async () => {
        try {
          const ordersPromises = tables.map(table => 
            getOrdersByTable(table.id)
              .then(orders => orders.map((order: any) => ({
                ...order,
                table_id: table.id,
                table_name: table.name,
                room_id: table.room_id
              })))
              .catch(() => []) // Se falhar, retorna array vazio
          );

          const allOrdersArrays = await Promise.all(ordersPromises);
          const flatOrders = allOrdersArrays.flat();
          
          // Ordenar pedidos: pending primeiro, depois por data (mais recente primeiro)
          const sortedOrders = flatOrders.sort((a, b) => {
            // Primeiro critério: status (pending tem prioridade)
            const aIsPending = a.status === 'pending';
            const bIsPending = b.status === 'pending';
            
            if (aIsPending && !bIsPending) return -1;
            if (!aIsPending && bIsPending) return 1;
            
            // Segundo critério: data (mais recente primeiro)
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });

          setAllOrders(sortedOrders);
        } catch (error) {
          console.error('Erro ao carregar pedidos:', error);
        }
      };

      loadAllOrders();
    }
  }, [tables]);

  // Função para obter o nome do produto pelo ID
  const getProductName = (productId: number): string => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : `Produto #${productId}`;
  };

  // Função para obter o nome da mesa pelo ID
  const getTableName = (tableId: number): string => {
    const table = tables.find(t => t.id === tableId);
    return table ? table.name : `Mesa #${tableId}`;
  };

  // Função para renderizar itens de um pedido
  const renderOrderItems = (order: Order) => {
    if (!order.items || order.items.length === 0) {
      return (
        <Typography variant="body2" sx={{ 
          color: '#94a3b8',
          fontStyle: 'italic',
          textAlign: 'center',
          py: 1
        }}>
          Nenhum item no pedido
        </Typography>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {order.items.map((item, itemIndex) => (
          <Box key={itemIndex} sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
            px: 2,
            py: 1,
            border: '2px solid rgba(0,0,0,0.08)',
            borderRadius: 2,
            color: '#334155',
            background: 'rgba(102,126,234,0.03)',
            minHeight: 36,
            '&:hover': {
              border: '2px solid rgba(0,0,0,0.15)',
              background: 'rgba(102,126,234,0.08)',
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            },
            transition: 'all 0.2s ease'
          }}>
            <Box sx={{ flex: 1, minWidth: 0, fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {getProductName(item.product_id)}
              {item.comment && (
                <Typography variant="caption" sx={{ 
                  display: 'block', 
                  color: '#8b5cf6', 
                  fontStyle: 'italic',
                  mt: 0.5
                }}>
                  "{item.comment}"
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                minWidth: 36,
                height: 20,
                backgroundColor: '#667eea',
                color: 'white',
                borderRadius: 1,
                fontWeight: 700,
                fontSize: '0.8em'
              }}>
                {item.quantity}x
              </Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                minWidth: 70,
                height: 20,
                backgroundColor: '#10b981',
                color: 'white',
                borderRadius: 1,
                fontWeight: 700,
                fontSize: '0.8em'
              }}>
                R$ {(item.unit_price * item.quantity).toFixed(2)}
              </Box>
              {order.status === 'pending' && (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Editar item">
                    <IconButton
                      size="small"
                      onClick={() => handleEditItem(order, item)}
                      sx={{
                        color: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(139, 92, 246, 0.2)',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remover item">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteItem(order, item)}
                      sx={{
                        color: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  // Função para abrir dialog de confirmação
  const handleMarkAsCompletedClick = (order: Order) => {
    setOrderToComplete(order);
    setConfirmDialogOpen(true);
  };

  // Função para marcar pedido como concluído
  const handleMarkAsCompleted = async () => {
    if (!orderToComplete) return;
    
    if (orderToComplete.status === 'completed' || orderToComplete.status === 'finished') {
      return; // Já está concluído
    }

    setUpdatingOrderId(orderToComplete.id);
    setError('');
    setSuccessMessage('');
    setConfirmDialogOpen(false);
    
    try {
      await finishOrder(orderToComplete.table_id, orderToComplete.id);
      
      // Atualizar o pedido na lista local
      setAllOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === orderToComplete.id 
            ? { ...o, status: 'finished', finished_by: user?.username }
            : o
        )
      );
      
      setSuccessMessage(`Pedido #${orderToComplete.id} marcado como concluído com sucesso!`);
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      setError('Erro ao marcar pedido como concluído');
    } finally {
      setUpdatingOrderId(null);
      setOrderToComplete(null);
    }
  };

  // Função para cancelar confirmação
  const handleCancelConfirmation = () => {
    setConfirmDialogOpen(false);
    setOrderToComplete(null);
  };

  // Funções para gerenciamento de pedidos
  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setEditDialogOpen(true);
  };

  const handleCancelOrder = (order: Order) => {
    setOrderToCancel(order);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return;
    
    try {
      await cancelOrder(orderToCancel.table_id, orderToCancel.id);
      setSnackbar({
        open: true,
        message: 'Pedido cancelado com sucesso!',
        severity: 'success'
      });
      // Recarregar pedidos
      const ordersData = await Promise.all(
        tables.map(async (table) => {
          try {
            const tableOrders = await getOrdersByTable(table.id);
            return tableOrders.map((order: any) => ({
              ...order,
              table_name: table.name,
              room_id: table.room_id
            }));
          } catch (error) {
            console.error(`Erro ao carregar pedidos da mesa ${table.id}:`, error);
            return [];
          }
        })
      );
      setAllOrders(ordersData.flat());
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao cancelar pedido',
        severity: 'error'
      });
    } finally {
      setCancelDialogOpen(false);
      setOrderToCancel(null);
    }
  };

  const handleEditItem = (order: Order, item: any) => {
    setEditingOrder(order);
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const handleDeleteItem = async (order: Order, item: any) => {
    try {
      await deleteOrderItem(order.table_id, order.id, item.id);
      setSnackbar({
        open: true,
        message: 'Item removido com sucesso!',
        severity: 'success'
      });
      // Recarregar pedidos
      const ordersData = await Promise.all(
        tables.map(async (table) => {
          try {
            const tableOrders = await getOrdersByTable(table.id);
            return tableOrders.map((order: any) => ({
              ...order,
              table_name: table.name,
              room_id: table.room_id
            }));
          } catch (error) {
            console.error(`Erro ao carregar pedidos da mesa ${table.id}:`, error);
            return [];
          }
        })
      );
      setAllOrders(ordersData.flat());
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao remover item',
        severity: 'error'
      });
    }
  };

  const handleAddItem = (order: Order) => {
    setOrderToAddItem(order);
    setNewItemData({
      product_id: '',
      quantity: 1,
      unit_price: 0,
      comment: ''
    });
    setAddItemDialogOpen(true);
  };

  const handleConfirmAddItem = async () => {
    if (!orderToAddItem || !newItemData.product_id) return;

    const product = products.find(p => p.id === Number(newItemData.product_id));
    if (!product) return;

    try {
      await addOrderItem(orderToAddItem.table_id, orderToAddItem.id, {
        product_id: Number(newItemData.product_id),
        quantity: newItemData.quantity,
        unit_price: product.price,
        comment: newItemData.comment
      });
      setSnackbar({
        open: true,
        message: 'Item adicionado com sucesso!',
        severity: 'success'
      });
      // Recarregar pedidos
      const ordersData = await Promise.all(
        tables.map(async (table) => {
          try {
            const tableOrders = await getOrdersByTable(table.id);
            return tableOrders.map((order: any) => ({
              ...order,
              table_name: table.name,
              room_id: table.room_id
            }));
          } catch (error) {
            console.error(`Erro ao carregar pedidos da mesa ${table.id}:`, error);
            return [];
          }
        })
      );
      setAllOrders(ordersData.flat());
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao adicionar item',
        severity: 'error'
      });
    } finally {
      setAddItemDialogOpen(false);
      setOrderToAddItem(null);
    }
  };

  const handleUpdateItem = async (itemData: any) => {
    if (!editingOrder || !editingItem) return;

    try {
      await updateOrderItem(editingOrder.table_id, editingOrder.id, editingItem.id, itemData);
      setSnackbar({
        open: true,
        message: 'Item atualizado com sucesso!',
        severity: 'success'
      });
      // Recarregar pedidos
      const ordersData = await Promise.all(
        tables.map(async (table) => {
          try {
            const tableOrders = await getOrdersByTable(table.id);
            return tableOrders.map((order: any) => ({
              ...order,
              table_name: table.name,
              room_id: table.room_id
            }));
          } catch (error) {
            console.error(`Erro ao carregar pedidos da mesa ${table.id}:`, error);
            return [];
          }
        })
      );
      setAllOrders(ordersData.flat());
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao atualizar item',
        severity: 'error'
      });
    } finally {
      setEditDialogOpen(false);
      setEditingOrder(null);
      setEditingItem(null);
    }
  };

  return (
    <Box sx={{ 
      pb: isMobile ? 8 : 2, 
      minHeight: '100vh',
      position: 'relative',
      width: '100%',
      px: { xs: 2, sm: 3, md: 4 }
    }}>
      {/* Header - igual ProductList/TableList */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5
          }}>
            Pedidos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Acompanhe e gerencie todos os pedidos do estabelecimento
          </Typography>
        </Box>
      </Box>

      {/* Loading state com skeleton */}
      {loading && (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column', gap: 2 }}>
            <CircularProgress size={60} sx={{ color: '#667eea' }} />
            <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
              Carregando pedidos...
            </Typography>
          </Box>
        </Box>
      )}

      {/* Conteúdo principal - só mostra se não estiver carregando */}
      {!loading && (
        <>
          {/* Mensagens de erro e sucesso */}
          {error && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
            </Box>
          )}
          {successMessage && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="success" onClose={() => setSuccessMessage('')}>{successMessage}</Alert>
            </Box>
          )}

          {/* Lógica de filtro */}
          {(() => {
            // Mostrar todos os pedidos (garçons podem finalizar pedidos uns dos outros)
            const filteredOrders = allOrders;
            
            // Filtro por status
            const filteredByStatus = filteredOrders.filter(order => {
              if (statusFilter === 'pending') return order.status === 'pending';
              if (statusFilter === 'completed') return order.status === 'completed' || order.status === 'finished';
              return true;
            });

            // Ordenação: pendentes primeiro, depois por data (mais recente primeiro)
            const sortedOrders = filteredByStatus.sort((a, b) => {
              const aIsPending = a.status === 'pending';
              const bIsPending = b.status === 'pending';
              
              if (aIsPending && !bIsPending) return -1;
              if (!aIsPending && bIsPending) return 1;
              
              // Para pedidos do mesmo status, ordenar por data (mais recente primeiro)
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            return (
              <>


                {/* Filtro de Status */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>
                    Filtrar por Status
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant={statusFilter === 'pending' ? 'contained' : 'outlined'}
                      onClick={() => setStatusFilter('pending')}
                      sx={{
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        background: statusFilter === 'pending' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                        color: statusFilter === 'pending' ? 'white' : '#f59e0b',
                        border: statusFilter === 'pending' ? 'none' : '2px solid #f59e0b',
                        '&:hover': {
                          background: statusFilter === 'pending' ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'rgba(245, 158, 11, 0.1)',
                          transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Pendentes
                    </Button>
                    <Button
                      variant={statusFilter === 'completed' ? 'contained' : 'outlined'}
                      onClick={() => setStatusFilter('completed')}
                      sx={{
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        background: statusFilter === 'completed' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                        color: statusFilter === 'completed' ? 'white' : '#10b981',
                        border: statusFilter === 'completed' ? 'none' : '2px solid #10b981',
                        '&:hover': {
                          background: statusFilter === 'completed' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'rgba(16, 185, 129, 0.1)',
                          transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Concluídos
                    </Button>
                  </Box>
                </Box>
                
                {/* Conteúdo principal */}
                <Box>
                  {filteredByStatus.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 8,
                      backgroundColor: 'rgba(139, 92, 246, 0.05)',
                      borderRadius: 3,
                      border: '2px dashed rgba(139, 92, 246, 0.3)'
                    }}>
                      <Typography variant="h6" sx={{ color: '#8b5cf6', mb: 2 }}>
                        {statusFilter === 'pending' ? 'Nenhum pedido pendente' : 'Nenhum pedido concluído'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {statusFilter === 'pending' ? 'Todos os pedidos foram concluídos' : 'Nenhum pedido foi concluído ainda'}
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {sortedOrders.map((order) => (
                        <Card key={order.id} sx={{ 
                          background: 'white',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                          border: '2px solid rgba(0,0,0,0.08)',
                          borderRadius: 4,
                          '&:hover': {
                            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                            border: '2px solid rgba(0,0,0,0.12)',
                            transform: 'translateY(-2px)',
                            transition: 'all 0.3s ease'
                          },
                          transition: 'all 0.3s ease',
                          p: isMobile ? 1 : 1.5
                        }}>
                          {/* Primeira linha: Número e Mesa */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                            <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontWeight: 700, color: '#3730a3', minWidth: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              #{order.id}
                            </Typography>
                            <Chip 
                              label={getTableName(order.table_id)}
                              size="medium"
                              sx={{
                                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                color: '#667eea',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                height: '32px',
                                border: '1px solid rgba(102, 126, 234, 0.2)',
                                '& .MuiChip-label': {
                                  fontSize: '0.95rem',
                                  fontWeight: 600
                                }
                              }}
                            />
                            {order.room_id && (
                              <Chip 
                                label={`Quarto ${order.room_id}`}
                                size="medium"
                                variant="outlined"
                                sx={{
                                  borderColor: '#667eea',
                                  color: '#667eea',
                                  fontWeight: 500,
                                  fontSize: '0.9rem',
                                  height: '32px',
                                  '& .MuiChip-label': {
                                    fontSize: '0.9rem',
                                    fontWeight: 500
                                  }
                                }}
                              />
                            )}
                          </Box>

                          {/* Segunda linha: Total, Itens e Data */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                            <Typography variant="body1" sx={{ 
                              fontWeight: 700, 
                              color: '#667eea', 
                              backgroundColor: 'rgba(102, 126, 234, 0.10)', 
                              px: 2, 
                              py: 0.5, 
                              borderRadius: 1, 
                              fontSize: '1rem' 
                            }}>
                              R$ {order.total_amount.toFixed(2)}
                            </Typography>
                            <Typography variant="body1" sx={{ 
                              fontWeight: 600, 
                              color: '#10b981', 
                              backgroundColor: 'rgba(16, 185, 129, 0.10)', 
                              px: 2, 
                              py: 0.5, 
                              borderRadius: 1, 
                              fontSize: '0.95rem' 
                            }}>
                              {order.total_items} itens
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.9rem' }}>
                              {new Date(order.created_at).toLocaleString()}
                            </Typography>
                          </Box>

                          {/* Terceira linha: Botões de Ação */}
                          {order.status === 'pending' && (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={updatingOrderId === order.id ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                                onClick={() => handleMarkAsCompletedClick(order)}
                                disabled={updatingOrderId === order.id}
                                sx={{
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.18)',
                                  color: 'white',
                                  fontWeight: 600,
                                  fontSize: '0.9rem',
                                  borderRadius: 3,
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.22)',
                                    transform: 'translateY(-1px)'
                                  },
                                  '&:disabled': {
                                    background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                                    boxShadow: 'none',
                                    transform: 'none'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                {updatingOrderId === order.id ? 'Atualizando...' : 'Finalizar'}
                              </Button>
                              
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => handleAddItem(order)}
                                sx={{
                                  color: '#8b5cf6',
                                  borderColor: '#8b5cf6',
                                  background: 'white',
                                  fontWeight: 600,
                                  borderRadius: 3,
                                  '&:hover': {
                                    background: 'rgba(139, 92, 246, 0.08)',
                                    borderColor: '#7c3aed'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                Adicionar Item
                              </Button>
                              
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CancelIcon />}
                                onClick={() => handleCancelOrder(order)}
                                sx={{
                                  color: '#ef4444',
                                  borderColor: '#ef4444',
                                  background: 'white',
                                  fontWeight: 600,
                                  borderRadius: 3,
                                  '&:hover': {
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    borderColor: '#dc2626'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                Cancelar Pedido
                              </Button>
                            </Box>
                          )}
                            
                            {/* Informações de responsabilidade */}
                            <Box sx={{ 
                              mt: 1.5,
                              pt: 1.5,
                              borderTop: '1px solid rgba(0,0,0,0.06)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.5
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" sx={{ 
                                  color: '#6b7280', 
                                  fontWeight: 500,
                                  fontSize: '0.75rem'
                                }}>
                                  Criado por:
                                </Typography>
                                <Typography variant="caption" sx={{ 
                                  color: '#374151', 
                                  fontWeight: 600,
                                  fontSize: '0.75rem'
                                }}>
                                  {order.created_by || 'Sistema'}
                                </Typography>
                              </Box>
                              {order.status === 'finished' && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="caption" sx={{ 
                                    color: '#6b7280', 
                                    fontWeight: 500,
                                    fontSize: '0.75rem'
                                  }}>
                                    Finalizado por:
                                  </Typography>
                                  <Typography variant="caption" sx={{ 
                                    color: '#10b981', 
                                    fontWeight: 600,
                                    fontSize: '0.75rem'
                                  }}>
                                    {order.finished_by || user?.username || 'Usuário atual'}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                            
                            {/* Botão Ver itens - separado para melhor responsividade */}
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'flex-start', 
                              mt: 1.5,
                              pt: 1.5,
                              borderTop: '1px solid rgba(0,0,0,0.08)'
                            }}>
                              <Button
                                onClick={() => toggleOrderExpand(order.id)}
                                variant="outlined"
                                size="small"
                                startIcon={expandedOrderIds.includes(order.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                sx={{
                                  color: '#667eea',
                                  borderColor: '#667eea',
                                  background: 'white',
                                  fontWeight: 600,
                                  borderRadius: 3,
                                  '&:hover': {
                                    background: 'rgba(102, 126, 234, 0.08)',
                                    borderColor: '#5a67d8'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                {expandedOrderIds.includes(order.id) ? 'Ocultar itens' : 'Ver itens'}
                              </Button>
                            </Box>
                            {/* Itens do pedido (expande ao clicar) */}
                            {expandedOrderIds.includes(order.id) && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#3730a3', mb: 1, textAlign: 'left' }}>
                                  Itens do pedido:
                                </Typography>
                                {renderOrderItems(order)}
                              </Box>
                            )}
                          </Card>
                      ))}
                    </Box>
                  )}
                </Box>
              </>
            );
          })()}
        </>
      )}

      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={handleCancelConfirmation}
        onConfirm={handleMarkAsCompleted}
        title="Confirmar Conclusão"
        description={<>Marcar como concluído.</>}
        confirmText="Confirmar"
        variant="success"
      >
        {orderToComplete && (
          <Box sx={{ 
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            p: 2,
            borderRadius: 2,
            border: '1px solid rgba(16, 185, 129, 0.2)',
            mt: 2
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#10b981', mb: 1 }}>
              Detalhes do Pedido:
            </Typography>
            <Typography variant="body2" sx={{ color: '#1e293b' }}>
              Mesa: {orderToComplete.table_name || getTableName(orderToComplete.table_id)}
            </Typography>
            <Typography variant="body2" sx={{ color: '#1e293b' }}>
              Total: R$ {orderToComplete.total_amount.toFixed(2)}
            </Typography>
            <Typography variant="body2" sx={{ color: '#1e293b' }}>
              Itens: {orderToComplete.total_items}
            </Typography>
          </Box>
        )}
      </ConfirmDialog>

      {/* Dialog de Cancelamento de Pedido */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
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
          pb: 2,
          textAlign: 'center'
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Cancelar Pedido
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Esta ação não pode ser desfeita
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Tem certeza que deseja cancelar o pedido #{orderToCancel?.id}?
          </Typography>
          {orderToCancel && (
            <Box sx={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              p: 2,
              borderRadius: 2,
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 600,
                color: '#ef4444',
                mb: 1
              }}>
                Detalhes do Pedido:
              </Typography>
              <Typography variant="body2" sx={{ color: '#1e293b' }}>
                Mesa: {orderToCancel.table_name || getTableName(orderToCancel.table_id)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#1e293b' }}>
                Total: R$ {orderToCancel.total_amount.toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#1e293b' }}>
                Itens: {orderToCancel.total_items}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setCancelDialogOpen(false)}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              color: '#64748b',
              '&:hover': {
                backgroundColor: 'rgba(100, 116, 139, 0.1)'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmCancelOrder} 
            variant="contained" 
            sx={{
              borderRadius: 2,
              px: 3,
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
            Confirmar Cancelamento
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Edição de Item */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
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
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0',
          pb: 2,
          textAlign: 'center'
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Editar Item
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {editingItem && getProductName(editingItem.product_id)}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {editingItem && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Quantidade"
                type="number"
                value={editingItem.quantity}
                onChange={(e) => setEditingItem({
                  ...editingItem,
                  quantity: parseInt(e.target.value) || 1
                })}
                inputProps={{ min: 1 }}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <TextField
                label="Comentário (opcional)"
                value={editingItem.comment || ''}
                onChange={(e) => setEditingItem({
                  ...editingItem,
                  comment: e.target.value
                })}
                fullWidth
                multiline
                rows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              color: '#64748b',
              '&:hover': {
                backgroundColor: 'rgba(100, 116, 139, 0.1)'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => handleUpdateItem({
              quantity: editingItem?.quantity,
              comment: editingItem?.comment
            })} 
            variant="contained" 
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Salvar Alterações
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Adição de Item */}
      <Dialog
        open={addItemDialogOpen}
        onClose={() => setAddItemDialogOpen(false)}
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
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0',
          pb: 2,
          textAlign: 'center'
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Adicionar Item
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Adicionar novo item ao pedido
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <TextField
                select
                label="Produto"
                value={newItemData.product_id}
                onChange={(e) => setNewItemData({
                  ...newItemData,
                  product_id: e.target.value
                })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              >
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name} - R$ {product.price.toFixed(2)}
                  </MenuItem>
                ))}
              </TextField>
            </FormControl>
            <TextField
              label="Quantidade"
              type="number"
              value={newItemData.quantity}
              onChange={(e) => setNewItemData({
                ...newItemData,
                quantity: parseInt(e.target.value) || 1
              })}
              inputProps={{ min: 1 }}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField
              label="Comentário (opcional)"
              value={newItemData.comment}
              onChange={(e) => setNewItemData({
                ...newItemData,
                comment: e.target.value
              })}
              fullWidth
              multiline
              rows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setAddItemDialogOpen(false)}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              color: '#64748b',
              '&:hover': {
                backgroundColor: 'rgba(100, 116, 139, 0.1)'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmAddItem} 
            variant="contained" 
            disabled={!newItemData.product_id}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)',
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                boxShadow: 'none',
                transform: 'none'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Adicionar Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default OrderList; 