import React, { useEffect, useState } from 'react';
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
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  IconButton, 
  Chip, 
  Alert, 
  Switch, 
  FormControlLabel, 
  RadioGroup, 
  Radio, 
  FormLabel, 
  Divider, 
  CircularProgress, 
  useMediaQuery,
  List,
  Collapse
} from '@mui/material';
import { getTables, getOrdersByTable, getProducts, getRooms, createTable, closeTable, finishOrder } from '../config/api';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import OrderCreator from './OrderCreator';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import TableBarIcon from '@mui/icons-material/TableBar';


interface Table {
  id: number;
  name: string;
  is_closed: boolean;
  room_id?: number;
  created_by?: string;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category?: string;
}

interface Room {
  id: number;
  number: string;
  floor?: number;
}

// Adicionar o campo created_by na interface do pedido
interface Order {
  id: number;
  table_id: number;
  status: string;
  created_at: string;
  created_by: string;
  items: any[];
  total_amount: number;
  total_items: number;
  comment?: string;
}

const TableList = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [orders, setOrders] = useState<Record<number, Order[]>>({});
  const [loadingOrders, setLoadingOrders] = useState<number | null>(null);
  // const [orderCreated, setOrderCreated] = useState<Record<number, any>>({});
  const [newOrderDialogOpen, setNewOrderDialogOpen] = useState(false);
  const [selectedTableForNewOrder, setSelectedTableForNewOrder] = useState<Table | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  
  // Estados para criar nova mesa
  const [newTableDialogOpen, setNewTableDialogOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [isRoomTable, setIsRoomTable] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [creatingTable, setCreatingTable] = useState(false);
  const [createTableError, setCreateTableError] = useState('');
  const [cancelConfirmDialogOpen, setCancelConfirmDialogOpen] = useState(false);
  const [orderCreatedSuccessfully, setOrderCreatedSuccessfully] = useState(false);
  const [hasItemsInOrder, setHasItemsInOrder] = useState(false);
  
  // Estados para fechar mesa
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [selectedTableToClose, setSelectedTableToClose] = useState<Table | null>(null);
  const [closeTableLoading, setCloseTableLoading] = useState(false);
  const [closeTableError, setCloseTableError] = useState('');
  const [includeTip, setIncludeTip] = useState(false);
  const [requestInvoice, setRequestInvoice] = useState(false);
  const [closeTotal, setCloseTotal] = useState(0);
  const [closeBaseTotal, setCloseBaseTotal] = useState(0);
  const [tipValue, setTipValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  // Remover o estado do popup de confirmação
  // const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [closeSuccessOpen, setCloseSuccessOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  // Estados para verificação de quarto
  const [tableForRoomCheck, setTableForRoomCheck] = useState<Table | null>(null);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  // const [checkingRoom, setCheckingRoom] = useState(false);

  const [search, setSearch] = useState(''); // usado apenas para o Select - valor vazio = "Todas as Mesas"

  const [selectOrderDialogOpen, setSelectOrderDialogOpen] = useState(false);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<Table | null>(null);
  // const [orderTableInput, setOrderTableInput] = useState('');

  const [selectCloseDialogOpen, setSelectCloseDialogOpen] = useState(false);
  const [selectedTableForClose, setSelectedTableForClose] = useState<Table | null>(null);
  // const [closeTableInput, setCloseTableInput] = useState('');

  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Adicionar estado para expandir itens do pedido no mobile
  const [expandedOrderIds, setExpandedOrderIds] = useState<number[]>([]);

  // Estado para controlar se mesa vinculada vai para conta do quarto
  const [addToRoomAccount, setAddToRoomAccount] = useState(true);

  const [newOrderFlowDialogOpen, setNewOrderFlowDialogOpen] = useState(false);

  // Estados para finalizar pedido
  const [finishOrderDialogOpen, setFinishOrderDialogOpen] = useState(false);
  const [selectedOrderToFinish, setSelectedOrderToFinish] = useState<Order | null>(null);
  const [finishOrderLoading, setFinishOrderLoading] = useState(false);
  const [finishOrderError, setFinishOrderError] = useState('');

  const toggleOrderExpand = (orderId: number) => {
    setExpandedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  useEffect(() => {
    setLoading(true);
    getTables(false)
      .then((data) => {
        // Ordenar mesas alfabeticamente por nome
        const sortedTables = data.sort((a: Table, b: Table) => 
          a.name.localeCompare(b.name, 'pt-BR', { numeric: true })
        );
        setTables(sortedTables);
        setLoading(false);
      })
      .catch((err) => {
        setError('Erro ao buscar mesas');
        setLoading(false);
      });
  }, []);

  // Atualização automática a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      getTables(false)
        .then((data) => {
          // Ordenar mesas alfabeticamente por nome
          const sortedTables = data.sort((a: Table, b: Table) => 
            a.name.localeCompare(b.name, 'pt-BR', { numeric: true })
          );
          setTables(sortedTables);
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Carregar produtos - só se necessário
  useEffect(() => {
    // getProducts().then(setProducts);
  }, []);

  // Controlar scroll do body quando qualquer dialog estiver aberto
  useEffect(() => {
                    const isAnyDialogOpen = newOrderDialogOpen || cancelConfirmDialogOpen || newTableDialogOpen ||
                                       selectOrderDialogOpen || selectCloseDialogOpen || closeDialogOpen ||
                                       closeConfirmOpen || closeSuccessOpen || newOrderFlowDialogOpen ||
                                       finishOrderDialogOpen;
    
    if (isAnyDialogOpen) {
      // Bloquear scroll do body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      // Restaurar scroll do body
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      // Cleanup: restaurar scroll quando componente for desmontado
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
                  }, [newOrderDialogOpen, cancelConfirmDialogOpen, newTableDialogOpen,
                    selectOrderDialogOpen, selectCloseDialogOpen, closeDialogOpen,
                    closeConfirmOpen, closeSuccessOpen, newOrderFlowDialogOpen, finishOrderDialogOpen]);

  // Carregar quartos - só se habilitado
  useEffect(() => {
    if (import.meta.env.VITE_ENABLE_ROOMS === 'true') {
      getRooms().then(setRooms);
    }
  }, []);

  // Carregar pedidos de todas as mesas automaticamente
  useEffect(() => {
    if (tables.length > 0) {
      const tablesWithoutOrders = tables.filter(table => !orders[table.id]);
      
      if (tablesWithoutOrders.length > 0) {
        // Carregar pedidos em paralelo
        const orderPromises = tablesWithoutOrders.map(async (table) => {
          try {
            setLoadingOrders(table.id);
            const data = await getOrdersByTable(table.id);
            return { tableId: table.id, orders: data };
          } catch (error) {
            console.error(`Erro ao carregar pedidos da mesa ${table.id}:`, error);
            return { tableId: table.id, orders: [] };
          } finally {
            setLoadingOrders(null);
          }
        });

        Promise.all(orderPromises).then(results => {
          const newOrders = results.reduce((acc, { tableId, orders }) => {
            acc[tableId] = orders;
            return acc;
          }, {} as Record<number, Order[]>);
          
          setOrders(prev => ({ ...prev, ...newOrders }));
        });
      }
    }
  }, [tables]);

  const handleExpand = (tableId: number) => {
    if (expanded === tableId) {
      setExpanded(null);
    } else {
      setExpanded(tableId);
    }
  };

  const handleNewOrderClick = (table: Table) => {
    setSelectedTableForNewOrder(table);
    setNewOrderDialogOpen(true);
    setOrderCreatedSuccessfully(false);
    setHasItemsInOrder(false);
  };

  const handleNewOrderDialogClose = () => {
    if (orderCreatedSuccessfully) {
      setNewOrderDialogOpen(false);
      setOrderCreatedSuccessfully(false);
      setSelectedTableForNewOrder(null);
    } else if (hasItemsInOrder) {
      setCancelConfirmDialogOpen(true);
      // NÃO fecha o modal aqui!
    } else {
      setNewOrderDialogOpen(false);
      setSelectedTableForNewOrder(null);
    }
  };

  const handleConfirmCancel = () => {
    setCancelConfirmDialogOpen(false);
    setNewOrderDialogOpen(false);
    setSelectedTableForNewOrder(null);
    setOrderCreatedSuccessfully(false);
  };

  const handleCancelCancel = () => {
    setCancelConfirmDialogOpen(false);
    setOrderCreatedSuccessfully(false);
    setHasItemsInOrder(false);
  };

  const handleOrderCloseRequest = (hasItems: boolean) => {
    setHasItemsInOrder(hasItems);
  };

  const handleOrderCreated = (tableId: number, order: any) => {
    // setOrderCreated((prev) => ({ ...prev, [tableId]: order }));
    setOrderCreatedSuccessfully(true);
    setNewOrderDialogOpen(false); // Fechar modal imediatamente
    setSelectedTableForNewOrder(null);
    // Atualiza lista de pedidos da mesa
    getOrdersByTable(tableId).then((data) => {
      setOrders((prev) => ({ ...prev, [tableId]: data }));
    });
  };

  // Funções para criar nova mesa
  const handleNewTableClick = () => {
    setNewTableDialogOpen(true);
  };

  const handleNewTableDialogClose = () => {
    setNewTableDialogOpen(false);
    setNewTableName('');
    setIsRoomTable(false);
    setSelectedRoom('');
    setCreateTableError('');
  };

  const handleCreateTable = async () => {
    if (!newTableName.trim()) {
      setCreateTableError('Nome da mesa é obrigatório');
      return;
    }

    // Verificação de nome duplicado (case-insensitive)
    const exists = tables.some(
      t => t.name.trim().toLowerCase() === newTableName.trim().toLowerCase() && !t.is_closed
    );
    if (exists) {
      setCreateTableError('Já existe uma mesa aberta com esse nome. Escolha outro nome.');
      return;
    }

    // Validação se deve aceitar apenas números
    const numbersOnly = import.meta.env.VITE_TABLE_NAME_NUMBERS_ONLY === 'true';
    if (numbersOnly) {
      const isNumber = /^\d+$/.test(newTableName.trim());
      if (!isNumber) {
        setCreateTableError('O nome da mesa deve ser apenas números (ex: 1, 2, 3, 10, 100)');
        return;
      }
    }

    if (isRoomTable && !selectedRoom) {
      setCreateTableError('Selecione um quarto');
      return;
    }

    setCreatingTable(true);
    setCreateTableError('');

    try {
      const roomId = isRoomTable && selectedRoom ? Number(selectedRoom) : undefined;
      
      console.log('🔧 === TableList: handleCreateTable ===');
      console.log('   - newTableName:', newTableName.trim());
      console.log('   - isRoomTable:', isRoomTable);
      console.log('   - selectedRoom:', selectedRoom);
      console.log('   - roomId calculado:', roomId);
      console.log('   - roomId type:', typeof roomId);
      console.log('   - numbersOnly:', numbersOnly);
      
      const newTable = await createTable(newTableName.trim(), roomId);
      
      // Adiciona a nova mesa à lista
      setTables(prev => [...prev, newTable]);
      
      // Fecha o dialog de criar mesa
      handleNewTableDialogClose();
      
      // Vai direto para o modal de pedido com a nova mesa
      setSelectedTableForNewOrder(newTable);
      setNewOrderDialogOpen(true);
      setOrderCreatedSuccessfully(false);
      setHasItemsInOrder(false);
      
    } catch (error: any) {
      setCreateTableError('Erro ao criar mesa. Tente novamente.');
      console.error('Erro ao criar mesa:', error);
    } finally {
      setCreatingTable(false);
    }
  };

  // Função para obter o nome do produto pelo ID
  const getProductName = (productId: number): string => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : `Produto #${productId}`;
  };

  // Função para renderizar resumo dos pedidos (compacto)
  const renderOrderSummary = (tableOrders: Order[]) => {
    if (!tableOrders || tableOrders.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ 
          fontStyle: 'italic',
          backgroundColor: 'rgba(0,0,0,0.03)',
          px: 2,
          py: 1,
          borderRadius: 2,
          display: 'inline-block'
        }}>
          Nenhum pedido
        </Typography>
      );
    }

    const pendingOrders = tableOrders.filter((order: Order) => order.status === 'pending');
    const completedOrders = tableOrders.filter((order: Order) => order.status === 'completed');

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {completedOrders.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={`${completedOrders.length} finalizado${completedOrders.length > 1 ? 's' : ''}`} 
              size="small" 
              color="success" 
              variant="outlined"
              sx={{
                borderColor: '#10b981',
                color: '#059669',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(16, 185, 129, 0.1)'
                }
              }}
            />
          </Box>
        )}

      </Box>
    );
  };

  // Função para renderizar itens de um pedido (detalhado)
  const renderOrderItems = (order: Order) => {
    if (!order.items || order.items.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ 
          fontStyle: 'italic',
          backgroundColor: 'rgba(0,0,0,0.03)',
          px: 2,
          py: 1,
          borderRadius: 2,
          display: 'inline-block'
        }}>
          Nenhum item no pedido
        </Typography>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {order.items.map((item: any, itemIndex: number) => (
          <Box key={itemIndex} sx={{ 
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 2,
            py: 1.5,
            px: 2,
            background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 2,
            fontSize: '0.875rem',
            '&:hover': {
              backgroundColor: 'rgba(102, 126, 234, 0.05)',
              borderColor: 'rgba(102, 126, 234, 0.2)',
              transition: 'all 0.2s ease'
            },
            transition: 'all 0.2s ease'
          }}>
            {/* Coluna do produto e observação */}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ 
                fontWeight: 600,
                color: '#1e293b',
                mb: 0.5,
                wordBreak: 'break-word',
                lineHeight: 1.4
              }}>
                {getProductName(item.product_id)}
              </Typography>
              {item.comment && (
                <Typography variant="caption" color="text.secondary" sx={{ 
                  fontStyle: 'italic',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  display: 'inline-block',
                  wordBreak: 'break-word'
                }}>
                  Obs: {item.comment}
                </Typography>
              )}
            </Box>
            
            {/* Coluna da quantidade e valor - sempre alinhada à direita */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              justifySelf: 'end'
            }}>
              <Typography variant="body2" sx={{ 
                fontWeight: 700,
                color: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                whiteSpace: 'nowrap'
              }}>
                {item.quantity}x
              </Typography>
              <Typography variant="body2" sx={{ 
                fontWeight: 600,
                color: '#10b981',
                whiteSpace: 'nowrap'
              }}>
                R$ {(item.unit_price * item.quantity).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  // Função para abrir modal de fechar mesa
  const handleOpenCloseDialog = async (table: Table) => {
    try {
      const tableOrders = orders[table.id] || [];
      const baseTotal = tableOrders.filter((order: Order) => order.status !== 'cancelled').reduce((acc: number, order: Order) => acc + order.total_amount, 0);
      
      // Configurar valores padrão
      setCloseBaseTotal(baseTotal);
                      setRequestInvoice(false); // nota da mesa desativada
      setPaymentMethod('cash'); // dinheiro
      setSelectedTableToClose(table);
      setCloseTableError('');
      
      // Se a mesa está vinculada a um quarto
      if (table.room_id) {
        // Buscar informações do quarto
        const room = rooms.find(r => r.id === table.room_id);
        if (room) {
          setRoomInfo({ room_number: room.number, room_id: room.id });
          setTableForRoomCheck(table);
          // Para mesas vinculadas: vincular ao quarto como true, taxa de serviço opcional
          setIncludeTip(false); // Inicia desabilitada, mas pode ser habilitada
          setCloseTotal(baseTotal);
          setTipValue(0);
          setAddToRoomAccount(true); // Inicia como TRUE para mesas vinculadas
        } else {
          // Quarto não encontrado, tratar como mesa não vinculada
          setIncludeTip(true);
          setCloseTotal(baseTotal * 1.1);
          setTipValue(+(baseTotal * 0.1).toFixed(2));
          setRoomInfo(null);
          setTableForRoomCheck(null);
          setAddToRoomAccount(false);
        }
      } else {
        // Para mesas não vinculadas: taxa de serviço inicia como true
        setIncludeTip(true);
        setCloseTotal(baseTotal * 1.1);
        setTipValue(+(baseTotal * 0.1).toFixed(2));
        setRoomInfo(null);
        setTableForRoomCheck(null);
        setAddToRoomAccount(false); // Inicia como FALSE para mesas não vinculadas
      }
      
      setCloseDialogOpen(true);
    } catch (error) {
      console.error('Erro ao verificar informações do quarto:', error);
      // Em caso de erro, prosseguir com configuração padrão (sem quarto)
      const tableOrders = orders[table.id] || [];
      const baseTotal = tableOrders.filter((order: Order) => order.status !== 'cancelled').reduce((acc: number, order: Order) => acc + order.total_amount, 0);
      setCloseBaseTotal(baseTotal);
      setCloseTotal(baseTotal * 1.1);
      setTipValue(+(baseTotal * 0.1).toFixed(2));
      setIncludeTip(true);
      setRequestInvoice(false);
      setPaymentMethod('cash');
      setSelectedTableToClose(table);
      setCloseDialogOpen(true);
      setCloseTableError('');
      setRoomInfo(null);
      setTableForRoomCheck(null);
      setAddToRoomAccount(false); // Em caso de erro, assume mesa não vinculada
    }
  };

  // Função para fechar modal
  const handleCloseCloseDialog = () => {
    setCloseDialogOpen(false);
    setSelectedTableToClose(null);
    setCloseTableError('');
  };

  // Atualiza valor total ao marcar/desmarcar taxa
  useEffect(() => {
    if (includeTip) {
      const tip = +(closeBaseTotal * 0.1).toFixed(2);
      setTipValue(tip);
      setCloseTotal(+(closeBaseTotal + tip).toFixed(2));
    } else {
      setTipValue(0);
      setCloseTotal(closeBaseTotal);
    }
  }, [includeTip, closeBaseTotal]);



  // Função para confirmar fechamento
  const handleConfirmCloseTable = async () => {
    if (!selectedTableToClose) return;
    setCloseTableLoading(true);
    setCloseTableError('');
    try {
      // Se a mesa está vinculada a um quarto e deve ir para conta do quarto
      if (roomInfo && tableForRoomCheck && addToRoomAccount) {
        await closeTable(
          selectedTableToClose.id, 
          includeTip, // Respeita a escolha do garçom sobre taxa de serviço
                          false, // generate_invoice = false (sem nota da mesa)
          'added_to_room', // payment_method = "added_to_room"
          'room_account' // payment_option = "room_account"
        );
      } else {
        // Pagamento imediato
        await closeTable(
          selectedTableToClose.id, 
          includeTip, 
          requestInvoice, 
          paymentMethod || 'cash', // payment_method (garantir que não seja undefined)
          'immediate', // payment_option = "immediate"
          Number(closeTotal), // amount_paid = valor total (convertido para number)
          0 // change = 0 (sem troco)
        );
      }
      // Atualiza lista de mesas
      const data = await getTables(false);
      setTables(data);
      setCloseDialogOpen(false);
      setSelectedTableToClose(null);
      setRoomInfo(null);
      setTableForRoomCheck(null);
      setAddToRoomAccount(true); // Reset para próximo uso
      setCloseSuccessOpen(true);
    } catch (error: any) {
      setCloseTableError('Erro ao fechar mesa. Tente novamente.');
    } finally {
      setCloseTableLoading(false);
    }
  };

  // Funções para finalizar pedido
  const handleFinishOrderClick = (order: Order) => {
    setSelectedOrderToFinish(order);
    setFinishOrderError('');
    setFinishOrderDialogOpen(true);
  };

  const handleFinishOrderDialogClose = () => {
    setFinishOrderDialogOpen(false);
    setSelectedOrderToFinish(null);
    setFinishOrderError('');
  };

  const handleConfirmFinishOrder = async () => {
    if (!selectedOrderToFinish) return;

    setFinishOrderLoading(true);
    setFinishOrderError('');

    try {
      await finishOrder(selectedOrderToFinish.table_id, selectedOrderToFinish.id);
      
      // Atualizar a lista de pedidos da mesa
      const updatedOrders = await getOrdersByTable(selectedOrderToFinish.table_id);
      setOrders(prev => ({
        ...prev,
        [selectedOrderToFinish.table_id]: updatedOrders
      }));

      setFinishOrderDialogOpen(false);
      setSelectedOrderToFinish(null);
    } catch (error: any) {
      console.error('Erro ao finalizar pedido:', error);
      setFinishOrderError(error.response?.data?.detail || 'Erro ao finalizar pedido');
    } finally {
      setFinishOrderLoading(false);
    }
  };

  // Função para obter resumo dos produtos consumidos na mesa
  const getProductSummary = (tableOrders: Order[], products: Product[]) => {
    const summary: Record<number, { name: string, quantity: number, total: number }> = {};
    tableOrders.forEach(order => {
      order.items.forEach((item: any) => {
        if (!summary[item.product_id]) {
          const product = products.find(p => p.id === item.product_id);
          summary[item.product_id] = {
            name: product ? product.name : `Produto #${item.product_id}`,
            quantity: 0,
            total: 0
          };
        }
        summary[item.product_id].quantity += item.quantity;
        summary[item.product_id].total += item.unit_price * item.quantity;
      });
    });
    return Object.values(summary);
  };



  return (
    <Box sx={{ pb: isMobile ? 8 : 2, px: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header - igual ProductList/OrderList */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pt: 1,
        pb: 3,
        mb: 2
      }}>
        <Box>
          <Typography variant="h4" sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5
          }}>
            Mesas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie mesas e pedidos
          </Typography>
        </Box>
        <Box /> {/* Espaço reservado para futuros botões, igual ProductList/OrderList */}
      </Box>

      {/* Loading state com skeleton */}
      {loading && (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column', gap: 2 }}>
            <CircularProgress size={60} sx={{ color: '#667eea' }} />
            <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
              Carregando mesas...
            </Typography>
          </Box>
        </Box>
      )}

      {/* Error state */}
      {error && (
        <Box sx={{ mb: 3 }}>
          <Alert 
            severity="error" 
            onClose={() => setError('')}
            sx={{ 
              borderRadius: 2,
              '& .MuiAlert-icon': { color: '#ef4444' }
            }}
          >
            {error}
          </Alert>
        </Box>
      )}

      {/* Conteúdo principal - só mostra se não estiver carregando */}
      {!loading && !error && (
        <>
          {/* Botão Principal: Novo Pedido */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            mb: 4,
          }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setNewOrderFlowDialogOpen(true);
              }}
              size="large"
              aria-label="Criar novo pedido"
              title="Criar um novo pedido para uma mesa"
                          sx={{
              minWidth: { xs: '100%', sm: 200 },
              width: { xs: '100%', sm: 'auto' },
              height: { xs: 44, sm: 52 },
              fontWeight: 700,
              fontSize: { xs: '1rem', sm: '1.1rem' },
              borderRadius: 3,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 6px 24px rgba(16, 185, 129, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textTransform: 'uppercase',
              letterSpacing: 1,
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.22)',
                transform: 'translateY(-2px) scale(1.03)'
              },
              '&:active': {
                transform: 'translateY(0px) scale(0.97)'
              }
            }}
            >
              NOVO PEDIDO
            </Button>
          </Box>

          {/* Filtro de seleção de mesa (dropdown) */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 3,
            maxWidth: 340,
            justifyContent: 'flex-start',
          }}>
            <FormControl fullWidth size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="select-table-filter-label">Selecionar mesa</InputLabel>
              <Select
                labelId="select-table-filter-label"
                value={search}
                label="Selecionar mesa"
                onChange={e => setSearch(e.target.value)}
                displayEmpty
                renderValue={(value) => value === '' ? '' : value}
                aria-label="Filtrar por mesa"
                title="Selecione uma mesa para filtrar os resultados"
                MenuProps={{
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left'
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left'
                  },
                  slotProps: {
                    paper: {
                      sx: {
                        maxHeight: 300,
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        border: '1px solid rgba(0,0,0,0.08)',
                        '& .MuiMenuItem-root': {
                          py: 1.5,
                          px: 2,
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          '&:hover': {
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            color: '#667eea'
                          },
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(102, 126, 234, 0.15)',
                            color: '#667eea',
                            fontWeight: 600,
                            '&:hover': {
                              backgroundColor: 'rgba(102, 126, 234, 0.2)'
                            }
                          }
                        }
                      }
                    }
                  }
                }}
                sx={{ 
                  borderRadius: 2, 
                  background: 'white', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.12)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0,0,0,0.12)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0,0,0,0.2)'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#667eea'
                  },
                  '& .MuiSelect-icon': {
                    color: '#667eea'
                  }
                }}
              >
                <MenuItem value="" sx={{ 
                  fontWeight: 600,
                  color: '#667eea',
                  backgroundColor: 'rgba(102, 126, 234, 0.05)',
                  borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
                }}>
                  Todas as Mesas
                </MenuItem>
                {tables
                  .filter(t => !t.is_closed)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(table => {
                    const tableOrders = orders[table.id] || [];
                    const hasPendingOrders = tableOrders.some((order: Order) => order.status === 'pending');
                    const room = rooms.find(r => r.id === table.room_id);
                    
                    return (
                      <MenuItem key={table.id} value={table.name} sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: hasPendingOrders ? '#f59e0b' : '#10b981',
                          flexShrink: 0
                        }} />
                        {table.name}
                        {room && (
                          <Typography variant="caption" sx={{ 
                            color: '#667eea',
                            fontWeight: 600,
                            ml: 'auto'
                          }}>
                            Quarto {room.number}
                          </Typography>
                        )}
                      </MenuItem>
                    );
                  })}
              </Select>
            </FormControl>
          </Box>

          {tables.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Nenhuma mesa encontrada.
              </Typography>
            </Box>
          ) : (
            <List sx={{ px: 0 }}>
              {tables
                .filter(table =>
                  !search || table.name === search
                )
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Ordena por ID decrescente (mais recentes primeiro)
                .map((table) => (
                <Card key={table.id} sx={{ 
                  mb: 3, 
                  mx: 0,
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
                  transition: 'all 0.3s ease'
                }}>
                  <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                    {/* Cabeçalho da mesa - sempre visível */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      justifyContent: 'space-between', 
                      flexWrap: 'wrap',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 2, sm: 0 }
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        flex: 1, 
                        gap: 2,
                        width: { xs: '100%', sm: 'auto' }
                      }}>
                        <IconButton 
                          onClick={() => handleExpand(table.id)}
                          size="medium"
                          sx={{ 
                            mr: 2,
                            mt: 0.5,
                            backgroundColor: 'rgba(102, 126, 234, 0.12)',
                            color: '#667eea',
                            '&:hover': {
                              backgroundColor: 'rgba(102, 126, 234, 0.22)',
                              transform: 'scale(1.08)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {expanded === table.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="h5" component="div" sx={{ 
                            fontWeight: 700,
                            color: '#3730a3',
                            mb: 0.5,
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          }}>
                            {table.name}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                            {/* Para mesas com quarto e pedidos pendentes: pendente à esquerda, quarto à direita */}
                            {table.room_id && (orders[table.id] || []).filter((order: Order) => order.status === 'pending').length > 0 ? (
                              <>
                                {(orders[table.id] || []).filter((order: Order) => order.status === 'pending').length > 0 && (
                                  <Chip 
                                    label={`${(orders[table.id] || []).filter((order: Order) => order.status === 'pending').length} pendente${(orders[table.id] || []).filter((order: Order) => order.status === 'pending').length !== 1 ? 's' : ''}`}
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(245, 158, 11, 0.10)',
                                      color: '#f59e0b',
                                      fontWeight: 600
                                    }}
                                  />
                                )}
                                <Chip 
                                  label={`Quarto ${table.room_id}`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{
                                    borderColor: '#667eea',
                                    color: '#667eea',
                                    fontWeight: 500
                                  }}
                                />
                              </>
                            ) : (
                              <>
                                {/* Para mesas sem quarto ou sem pedidos pendentes: ordem normal */}
                                {table.room_id && (
                                  <Chip 
                                    label={`Quarto ${table.room_id}`} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{
                                      borderColor: '#667eea',
                                      color: '#667eea',
                                      fontWeight: 500
                                    }}
                                  />
                                )}
                                {(orders[table.id] || []).filter((order: Order) => order.status === 'pending').length > 0 && (
                                  <Chip 
                                    label={`${(orders[table.id] || []).filter((order: Order) => order.status === 'pending').length} pendente${(orders[table.id] || []).filter((order: Order) => order.status === 'pending').length !== 1 ? 's' : ''}`}
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(245, 158, 11, 0.10)',
                                      color: '#f59e0b',
                                      fontWeight: 600
                                    }}
                                  />
                                )}
                              </>
                            )}
                            {table.is_closed && (
                              <Chip 
                                label={'Fechada'}
                                size="small"
                                color="default"
                                sx={{ fontWeight: 600 }}
                              />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 0.5 }}>
                            {table.created_by && (
                              <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TableBarIcon sx={{ fontSize: 18, color: '#6366f1' }} />
                                Aberta por: {table.created_by}
                              </Typography>
                            )}
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                              {new Date(table.created_at).toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      

                    </Box>

                    {/* Resumo dos pedidos - sempre visível */}
                    <Box sx={{ mt: { xs: 2, sm: 1 }, pl: 0 }}>
                      {loadingOrders === table.id && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                          <CircularProgress size={20} sx={{ color: '#667eea' }} />
                        </Box>
                      )}
                      {orders[table.id] && !loadingOrders && (
                        renderOrderSummary(orders[table.id])
                      )}
                    </Box>

                    {/* Detalhes expandidos dos pedidos */}
                    <Collapse in={expanded === table.id} timeout="auto" unmountOnExit>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, color: '#3730a3', textAlign: 'left', mb: 1 }}>
                          Pedidos desta mesa:
                        </Typography>
                        {orders[table.id] && orders[table.id].length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                            Nenhum pedido encontrado para esta mesa.
                          </Typography>
                        )}
                        {orders[table.id] && orders[table.id].length > 0 && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {orders[table.id]
                              .sort((a, b) => {
                                // Pedidos pendentes primeiro
                                if (a.status === 'pending' && b.status !== 'pending') return -1;
                                if (a.status !== 'pending' && b.status === 'pending') return 1;
                                // Se ambos têm o mesmo status, ordenar por data de criação (mais recentes primeiro)
                                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                              })
                              .map((order) => (
                              <Card key={order.id} variant="outlined" sx={{ 
                                p: isMobile ? 1.2 : 2,
                                background: order.status === 'cancelled' ? 'rgba(239, 68, 68, 0.05)' : 
                                          order.status === 'pending' ? 'rgba(251, 146, 60, 0.05)' : 'white',
                                border: order.status === 'cancelled' ? '2px solid rgba(239, 68, 68, 0.2)' :
                                        order.status === 'pending' ? '2px solid rgba(251, 146, 60, 0.2)' : '2px solid rgba(0,0,0,0.08)',
                                borderRadius: isMobile ? 2 : 3,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                mb: isMobile ? 1 : 0,
                                opacity: order.status === 'cancelled' ? 0.7 : 1,
                                '&:hover': {
                                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                  backgroundColor: order.status === 'cancelled' ? 'rgba(239, 68, 68, 0.08)' : 
                                                  order.status === 'pending' ? 'rgba(251, 146, 60, 0.08)' : 'rgba(59, 130, 246, 0.02)',
                                  border: order.status === 'cancelled' ? '2px solid rgba(239, 68, 68, 0.3)' :
                                          order.status === 'pending' ? '2px solid rgba(251, 146, 60, 0.3)' : '2px solid rgba(59, 130, 246, 0.2)',
                                  transform: isMobile ? 'none' : 'translateY(-1px)',
                                  transition: 'all 0.2s ease'
                                },
                                transition: 'all 0.2s ease',
                                // Estilo especial para pedidos cancelados - igual ao Admin
                                ...(order.status === 'cancelled' && {
                                  textDecoration: 'line-through',
                                  '& .MuiTypography-root': {
                                    textDecoration: 'line-through'
                                  },
                                  '& .MuiChip-root': {
                                    textDecoration: 'none'
                                  },
                                  '& .MuiButton-root': {
                                    textDecoration: 'none'
                                  }
                                })
                              }}>
                                {/* Layout mobile melhorado */}
                                {isMobile ? (
                                  <Box sx={{ width: '100%' }}>
                                    {/* Primeira linha: informações do pedido */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: '100%', mb: 1 }}>
                                                                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: order.status === 'cancelled' ? '#ef4444' : '#3730a3', minWidth: 0 }}>
                                          #{order.id}
                                        </Typography>

                                      {order.status === 'cancelled' && (
                                        <Chip 
                                          label="Cancelado"
                                          size="small"
                                          sx={{
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            fontWeight: 600,
                                            fontSize: '0.7rem'
                                          }}
                                        />
                                      )}

                                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#10b981' }}>
                                        R$ {order.total_amount.toFixed(2)}
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                                        {order.total_items} itens
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                        {order.created_by ? `${order.created_by} - ` : ''}{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </Typography>
                                    </Box>
                                    
                                    {/* Segunda linha: botões */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                      <Button
                                        onClick={() => toggleOrderExpand(order.id)}
                                        size="small"
                                        sx={{ 
                                          minWidth: 0, 
                                          px: 1, 
                                          fontSize: '0.75rem', 
                                          color: '#667eea', 
                                          textTransform: 'none',
                                          flex: 1,
                                          mr: 1
                                        }}
                                      >
                                        {expandedOrderIds.includes(order.id) ? 'Ocultar itens' : 'Ver itens'}
                                      </Button>
                                      
                                      {order.status === 'pending' && (
                                        <Button
                                          onClick={() => handleFinishOrderClick(order)}
                                          variant="contained"
                                          size="small"
                                          sx={{
                                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                            color: '#10b981',
                                            border: '1px solid rgba(16, 185, 129, 0.2)',
                                            fontWeight: 600,
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontSize: '0.75rem',
                                            px: 1,
                                            '&:hover': {
                                              backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                              borderColor: 'rgba(16, 185, 129, 0.4)',
                                              transform: 'translateY(-1px)',
                                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                                            },
                                            transition: 'all 0.2s ease'
                                          }}
                                        >
                                          Finalizar Pedido
                                        </Button>
                                      )}
                                    </Box>
                                  </Box>
                                ) : (
                                  // Desktop: layout antigo
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <Typography variant="h6" component="div" sx={{ 
                                          fontWeight: 700,
                                          color: order.status === 'cancelled' ? '#ef4444' : '#3730a3',
                                          textOverflow: 'ellipsis',
                                          overflow: 'hidden',
                                          whiteSpace: 'nowrap'
                                        }}>
                                          Pedido #{order.id}
                                        </Typography>
                                        {order.status === 'cancelled' && (
                                          <Chip 
                                            label="Cancelado"
                                            size="small"
                                            sx={{
                                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                              color: '#ef4444',
                                              fontWeight: 600,
                                              fontSize: '0.75rem'
                                            }}
                                          />
                                        )}
                                      </Box>
                                      <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ 
                                          fontWeight: 600,
                                          color: '#667eea',
                                          backgroundColor: 'rgba(102, 126, 234, 0.10)',
                                          px: 2,
                                          py: 0.5,
                                          borderRadius: 1
                                        }}>
                                          Total: R$ {order.total_amount.toFixed(2)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ 
                                          fontWeight: 600,
                                          color: '#10b981',
                                          backgroundColor: 'rgba(16, 185, 129, 0.10)',
                                          px: 2,
                                          py: 0.5,
                                          borderRadius: 1
                                        }}>
                                          Itens: {order.total_items}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                                            {order.created_by ? `${order.created_by} - ` : ''}{new Date(order.created_at).toLocaleString()}
                                          </Typography>
                                        </Box>
                                      </Box>

                                    </Box>
                                  </Box>
                                )}
                                
                                {/* Itens do pedido - mobile: só mostra se expandido; desktop: sempre mostra */}
                                {(!isMobile || expandedOrderIds.includes(order.id)) && (
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
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
                    </Collapse>

                    {/* Total e Botões de ação da mesa */}
                    <Box sx={{ 
                      mt: { xs: 3, sm: 2 }, 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: 2
                    }}>
                      {/* Total */}
                      {orders[table.id] && orders[table.id].length > 0 && (
                        <Box sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          p: 2,
                          backgroundColor: 'rgba(102, 126, 234, 0.05)',
                          borderRadius: 2,
                          border: '1px solid rgba(102, 126, 234, 0.1)'
                        }}>
                          <Typography variant="body1" sx={{
                            fontWeight: 700,
                            color: '#1e293b',
                            textAlign: 'center'
                          }}>
                            Total: R$ {orders[table.id].filter((order: Order) => order.status !== 'cancelled').reduce((acc: number, order: Order) => acc + order.total_amount, 0).toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                      
                      {/* Botões de ação da mesa */}
                      <Box sx={{ 
                        display: 'flex', 
                        gap: { xs: 2, sm: 1 }, 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        width: '100%'
                      }}>
                        {/* Botão Novo Pedido */}
                        <Button
                          onClick={() => handleNewOrderClick(table)}
                          disabled={table.is_closed}
                          variant="contained"
                          size={isMobile ? "medium" : "small"}
                          startIcon={<AddIcon />}
                          sx={{
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            flex: { xs: 1, sm: 'none' },
                            minWidth: { xs: 'auto', sm: 'auto' },
                            height: { xs: 48, sm: 36 },
                            fontSize: { xs: '0.875rem', sm: '0.75rem' },
                            fontWeight: 600,
                            borderRadius: 2,
                            textTransform: 'none',
                            '&:hover': {
                              backgroundColor: 'rgba(16, 185, 129, 0.2)',
                              borderColor: 'rgba(16, 185, 129, 0.4)',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                            },
                            '&:disabled': {
                              backgroundColor: 'rgba(0,0,0,0.05)',
                              color: '#9ca3af',
                              borderColor: 'rgba(0,0,0,0.1)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                          title="Novo Pedido"
                        >
                          {isMobile ? 'Novo Pedido' : ''}
                        </Button>
                        
                        {/* Botão Fechar Mesa */}
                        <Button
                          onClick={() => handleOpenCloseDialog(table)}
                          disabled={table.is_closed || !orders[table.id] || (orders[table.id] || []).filter((order: Order) => order.status === 'pending').length > 0}
                          variant="contained"
                          size={isMobile ? "medium" : "small"}
                          startIcon={<CloseIcon />}
                          sx={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            flex: { xs: 1, sm: 'none' },
                            minWidth: { xs: 'auto', sm: 'auto' },
                            height: { xs: 48, sm: 36 },
                            fontSize: { xs: '0.875rem', sm: '0.75rem' },
                            fontWeight: 600,
                            borderRadius: 2,
                            textTransform: 'none',
                            '&:hover': {
                              backgroundColor: 'rgba(239, 68, 68, 0.2)',
                              borderColor: 'rgba(239, 68, 68, 0.4)',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                            },
                            '&:disabled': {
                              backgroundColor: 'rgba(0,0,0,0.05)',
                              color: '#9ca3af',
                              borderColor: 'rgba(0,0,0,0.1)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                          title={table.is_closed ? 'Mesa já fechada' : 
                                !orders[table.id] ? 'Carregando pedidos...' :
                                (orders[table.id] || []).filter((order: Order) => order.status === 'pending').length > 0 ? 
                                'Finalize os pedidos pendentes primeiro' : 'Fechar mesa'}
                        >
                          {isMobile ? 'Fechar Mesa' : ''}
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          )}

          {/* Dialog para criar nova mesa */}
          <Dialog 
            open={newTableDialogOpen} 
            onClose={(event, reason) => {
              // Only allow closing via escape key or explicit close button
              if (reason === 'backdropClick') {
                return; // Prevent closing on backdrop click
              }
              handleNewTableDialogClose();
            }}
            maxWidth="sm"
            fullWidth
            disableScrollLock={false}
            keepMounted={false}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }
              },
              backdrop: {
                sx: {
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(4px)'
                }
              }
            }}
          >
            <DialogTitle sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '12px 12px 0 0',
              pb: 2
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Criar Mesa
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label={import.meta.env.VITE_TABLE_NAME_NUMBERS_ONLY === 'true' ? 'Número da Mesa' : 'Nome da Mesa'}
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  fullWidth
                  required
                  placeholder={import.meta.env.VITE_TABLE_NAME_NUMBERS_ONLY === 'true' ? 'Ex: 1, 2, 3, 10, 100' : 'Ex: Mesa 1, Mesa VIP, etc.'}
                  inputProps={{
                    pattern: import.meta.env.VITE_TABLE_NAME_NUMBERS_ONLY === 'true' ? '[0-9]*' : undefined
                  }}
                  sx={{
                    mt: 2,
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
                />
                
                {rooms.length > 0 && (
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: 'rgba(102, 126, 234, 0.05)', 
                    borderRadius: 2,
                    border: '1px solid rgba(102, 126, 234, 0.1)'
                  }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isRoomTable}
                          onChange={(e) => {
                            setIsRoomTable(e.target.checked);
                            if (!e.target.checked) {
                              setSelectedRoom('');
                            }
                          }}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#667eea',
                              '&:hover': {
                                backgroundColor: 'rgba(102, 126, 234, 0.08)'
                              }
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#667eea'
                            }
                          }}
                        />
                      }
                      label={<Typography sx={{ fontWeight: 500, color: '#1e293b' }}>Esta mesa é de um quarto?</Typography>}
                    />
                  </Box>
                )}
                
                {isRoomTable && (
                  <FormControl fullWidth>
                    <InputLabel>Selecione o Quarto</InputLabel>
                    <Select
                      value={selectedRoom}
                      onChange={(e) => setSelectedRoom(e.target.value)}
                      label="Selecione o Quarto"
                      required
                      MenuProps={{
                        anchorOrigin: {
                          vertical: 'bottom',
                          horizontal: 'left'
                        },
                        transformOrigin: {
                          vertical: 'top',
                          horizontal: 'left'
                        },
                        PaperProps: {
                          sx: {
                            maxHeight: 300,
                            '& .MuiMenuItem-root': {
                              py: 1.5,
                              px: 2,
                              '&:hover': {
                                backgroundColor: 'rgba(102, 126, 234, 0.1)'
                              }
                            }
                          }
                        }
                      }}
                      sx={{
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#667eea'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#667eea'
                        }
                      }}
                    >
                      {rooms.map((room) => (
                        <MenuItem key={room.id} value={room.id.toString()}>
                          Quarto {room.number}
                          {room.floor && ` - ${room.floor}º andar`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                
                {createTableError && (
                  <Alert severity="error" sx={{ 
                    mt: 1,
                    borderRadius: 2,
                    '& .MuiAlert-icon': {
                      color: '#ef4444'
                    }
                  }}>
                    {createTableError}
                  </Alert>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button 
                onClick={handleNewTableDialogClose} 
                disabled={creatingTable}
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
                onClick={handleCreateTable} 
                variant="contained" 
                disabled={creatingTable || !newTableName.trim() || (isRoomTable && !selectedRoom)}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 14px rgba(102, 126, 234, 0.3)',
                  color: 'white',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    background: '#e5e7eb',
                    color: '#9ca3af'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                {creatingTable ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Criar Mesa'}
              </Button>
            </DialogActions>
          </Dialog>



          {/* Modal para selecionar mesa ao criar novo pedido */}
          <Dialog
            open={selectOrderDialogOpen}
            onClose={(event, reason) => {
              // Only allow closing via escape key or explicit close button
              if (reason === 'backdropClick') {
                return; // Prevent closing on backdrop click
              }
              setSelectOrderDialogOpen(false);
              setSelectedTableForOrder(null); // Limpa seleção ao fechar
            }}
            maxWidth="sm"
            fullWidth
            disableScrollLock={false}
            keepMounted={false}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }
              },
              backdrop: {
                sx: {
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(4px)'
                }
              }
            }}
          >
            <DialogTitle sx={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              borderRadius: '12px 12px 0 0',
              pb: 2
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Criar Pedido
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                <FormControl fullWidth>
                  <InputLabel id="select-table-label">Mesa</InputLabel>
                  <Select
                    labelId="select-table-label"
                    value={selectedTableForOrder ? selectedTableForOrder.id : ''}
                    label="Mesa"
                    onChange={e => {
                      const table = tables.find(t => t.id === Number(e.target.value));
                      setSelectedTableForOrder(table || null);
                    }}
                    MenuProps={{
                                        slotProps: {
                    paper: {
                      sx: {
                        maxHeight: 300,
                        borderRadius: 2,
                        '& .MuiMenuItem-root': {
                          py: 1.5,
                          px: 2,
                          '&:hover': {
                            backgroundColor: 'rgba(102, 126, 234, 0.1)'
                          }
                        }
                      }
                    }
                  }
                    }}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#667eea'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#667eea'
                      }
                    }}
                  >
                    {tables
                      .filter(t => !t.is_closed)
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map(table => (
                        <MenuItem key={table.id} value={table.id}>
                          {table.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button onClick={() => setSelectOrderDialogOpen(false)} sx={{ borderRadius: 2, px: 3, color: '#64748b', '&:hover': { backgroundColor: 'rgba(100, 116, 139, 0.1)' } }}>Cancelar</Button>
              <Button
                onClick={() => {
                  if (selectedTableForOrder) {
                    setSelectedTableForNewOrder(selectedTableForOrder);
                    setNewOrderDialogOpen(true);
                    setSelectOrderDialogOpen(false);
                  }
                }}
                variant="contained"
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.2,
                  fontWeight: 700,
                  fontSize: '1rem',
                  background: selectedTableForOrder 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: selectedTableForOrder
                    ? '0 4px 14px rgba(16, 185, 129, 0.15)'
                    : '0 4px 14px rgba(16, 185, 129, 0.18)',
                  '&:hover': {
                    background: selectedTableForOrder
                      ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                      : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    boxShadow: selectedTableForOrder
                      ? '0 6px 20px rgba(16, 185, 129, 0.18)'
                      : '0 6px 20px rgba(16, 185, 129, 0.22)',
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    background: '#e5e7eb',
                    color: '#9ca3af'
                  },
                  transition: 'all 0.2s ease'
                }}
                disabled={!selectedTableForOrder}
              >
                Avançar
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog para criar novo pedido */}
          {selectedTableForNewOrder && (
                        <Dialog
              open={newOrderDialogOpen}
              onClose={(event, reason) => {
                // Only allow closing via escape key or explicit close button
                if (reason === 'backdropClick') {
                  return; // Prevent closing on backdrop click
                }
                handleNewOrderDialogClose();
              }}
              maxWidth="xl"
              fullWidth
              disableScrollLock={false}
              keepMounted={false}
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    width: { xs: '100%', sm: '90vw' },
                    height: { xs: '100%', sm: '90vh' },
                    maxWidth: { xs: '100%', sm: '1200px' },
                    margin: { xs: '0', sm: 'auto' }
                  }
                },
                backdrop: {
                  sx: {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)'
                  }
                }
              }}
            >
              <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                borderRadius: isMobile ? 0 : '12px 12px 0 0',
                pb: 2,
                pt: isMobile ? 4 : 3, // Padding superior extra para mobile
                px: isMobile ? 3 : 3   // Padding horizontal para mobile
              }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.2rem' }}>
                    Novo Pedido - {selectedTableForNewOrder?.name}
                  </Typography>
                </Box>
                <IconButton
                  onClick={handleNewOrderDialogClose}
                  size="medium"
                  sx={{ 
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent sx={{ 
                p: isMobile ? 2 : 3,
                pt: isMobile ? 4 : 3, // Padding superior extra para mobile
                pb: isMobile ? 4 : 3   // Padding inferior extra para mobile
              }}>
                {selectedTableForNewOrder && (
                  <OrderCreator 
                    tableId={selectedTableForNewOrder.id}
                    tableName={selectedTableForNewOrder.name}
                    onOrderCreated={(order) => handleOrderCreated(selectedTableForNewOrder.id, order)}
                    onCloseRequest={handleOrderCloseRequest}
                  />
                )}
              </DialogContent>
            </Dialog>
          )}

          {/* Dialog de confirmação para cancelar pedido */}
          <Dialog
            open={cancelConfirmDialogOpen}
            onClose={(event, reason) => {
              // Only allow closing via escape key or explicit close button
              if (reason === 'backdropClick') {
                return; // Prevent closing on backdrop click
              }
              handleCancelCancel();
            }}
            maxWidth="sm"
            fullWidth
            disableScrollLock={false}
            keepMounted={false}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }
              },
              backdrop: {
                sx: {
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(4px)'
                }
              }
            }}
          >
            <DialogTitle sx={{ 
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              borderRadius: '12px 12px 0 0',
              pb: 2
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Cancelar Pedido
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                
                <Typography variant="body1" sx={{ fontWeight: 500, color: '#1e293b', mt: 2 }}>
                  Tem certeza que deseja cancelar este pedido?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  ⚠️ Todos os itens adicionados serão perdidos.
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button 
                onClick={handleCancelCancel}
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
                Continuar Editando
              </Button>
              <Button 
                onClick={handleConfirmCancel} 
                variant="contained" 
                color="error"
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
                Cancelar Pedido
              </Button>
            </DialogActions>
          </Dialog>

          {/* Modal para selecionar mesa ao fechar mesa */}
          <Dialog
            open={selectCloseDialogOpen}
            onClose={(event, reason) => {
              // Only allow closing via escape key or explicit close button
              if (reason === 'backdropClick') {
                return; // Prevent closing on backdrop click
              }
              setSelectCloseDialogOpen(false);
              setSelectedTableForClose(null); // Limpa seleção ao fechar
            }}
            maxWidth="sm"
            fullWidth
            disableScrollLock={false}
            keepMounted={false}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }
              },
              backdrop: {
                sx: {
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(4px)'
                }
              }
            }}
          >
            <DialogTitle sx={{ 
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              borderRadius: '12px 12px 0 0',
              pb: 2
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Fechar Mesa
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                <FormControl fullWidth>
                  <InputLabel id="select-close-table-label">Mesa</InputLabel>
                  <Select
                    labelId="select-close-table-label"
                    value={selectedTableForClose ? selectedTableForClose.id : ''}
                    label="Mesa"
                    onChange={e => {
                      const table = tables.find(t => t.id === Number(e.target.value));
                      setSelectedTableForClose(table || null);
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                          borderRadius: 2,
                          '& .MuiMenuItem-root': {
                            py: 1.5,
                            px: 2,
                            '&:hover': {
                              backgroundColor: 'rgba(239, 68, 68, 0.1)'
                            }
                          }
                        }
                      }
                    }}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#ef4444'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#ef4444'
                      }
                    }}
                  >
                    {tables
                      .filter(t => !t.is_closed)
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map(table => (
                        <MenuItem key={table.id} value={table.id}>
                          {table.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                
                {/* Mensagem de aviso quando há pedidos pendentes */}
                {selectedTableForClose && (orders[selectedTableForClose.id] || []).filter((order: Order) => order.status === 'pending').length > 0 && (
                  <Alert 
                    severity="warning" 
                    sx={{ 
                      borderRadius: 2,
                      '& .MuiAlert-icon': { color: '#f59e0b' }
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#92400e' }}>
                      Mesa possui pedidos pendentes. Finalize-os antes de fechar.
                    </Typography>
                  </Alert>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button onClick={() => setSelectCloseDialogOpen(false)} sx={{ borderRadius: 2, px: 3, color: '#64748b', '&:hover': { backgroundColor: 'rgba(100, 116, 139, 0.1)' } }}>Cancelar</Button>
              <Button
                onClick={async () => {
                  if (selectedTableForClose) {
                    // Verificar se há pedidos pendentes antes de prosseguir
                    const pendingOrders = (orders[selectedTableForClose.id] || []).filter((order: Order) => order.status === 'pending');
                    
                    if (pendingOrders.length > 0) {
                      // Não prosseguir se há pedidos pendentes
                      return;
                    }
                    
                    // Prosseguir direto para o modal de pagamento
                    handleOpenCloseDialog(selectedTableForClose);
                    setSelectCloseDialogOpen(false);
                  }
                }}
                variant="contained"
                disabled={!selectedTableForClose || (selectedTableForClose && (orders[selectedTableForClose.id] || []).filter((order: Order) => order.status === 'pending').length > 0)}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.2,
                  fontWeight: 700,
                  fontSize: '1rem',
                  background: selectedTableForClose && (orders[selectedTableForClose.id] || []).filter((order: Order) => order.status === 'pending').length === 0
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: selectedTableForClose && (orders[selectedTableForClose.id] || []).filter((order: Order) => order.status === 'pending').length === 0
                    ? '0 4px 14px rgba(239, 68, 68, 0.15)'
                    : '0 4px 14px rgba(16, 185, 129, 0.18)',
                  '&:hover': {
                    background: selectedTableForClose && (orders[selectedTableForClose.id] || []).filter((order: Order) => order.status === 'pending').length === 0
                      ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                      : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    boxShadow: selectedTableForClose && (orders[selectedTableForClose.id] || []).filter((order: Order) => order.status === 'pending').length === 0
                      ? '0 6px 20px rgba(239, 68, 68, 0.18)'
                      : '0 6px 20px rgba(16, 185, 129, 0.22)',
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    background: '#e5e7eb',
                    color: '#9ca3af'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Avançar
              </Button>
            </DialogActions>
          </Dialog>

          {/* Modal de confirmação de fechamento de mesa */}
          <Dialog
            open={closeDialogOpen}
            onClose={(event, reason) => {
              // Only allow closing via escape key or explicit close button
              if (reason === 'backdropClick') {
                return; // Prevent closing on backdrop click
              }
              handleCloseCloseDialog();
            }}
            maxWidth="xs"
            fullWidth
            disableScrollLock={false}
            keepMounted={false}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }
              },
              backdrop: {
                sx: {
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(4px)'
                }
              }
            }}
          >
            <DialogTitle sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '12px 12px 0 0',
              pb: 2
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Fechar Mesa {selectedTableToClose?.name ? `- ${selectedTableToClose.name}` : ''}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3, mt: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Resumo dos produtos consumidos */}
                {selectedTableToClose && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Produtos consumidos:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {getProductSummary(orders[selectedTableToClose.id] || [], products).length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', px: 1 }}>
                          Nenhum produto consumido.
                        </Typography>
                      ) : (
                        getProductSummary(orders[selectedTableToClose.id] || [], products).map((item, idx) => (
                          <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', px: 1 }}>
                            <span style={{ fontWeight: 500 }}>{item.quantity}x {item.name}</span>
                            <span style={{ fontWeight: 600 }}>R$ {item.total.toFixed(2)}</span>
                          </Box>
                        ))
                      )}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                  </Box>
                )}
                
                {/* Opção para vincular ao quarto (apenas se a mesa estiver vinculada) */}
                {roomInfo && tableForRoomCheck && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={addToRoomAccount}
                        onChange={e => {
                          setAddToRoomAccount(e.target.checked);
                        }}
                        color="primary"
                      />
                    }
                    label={<span>Vincular no quarto {roomInfo.room_number}?<br /><span style={{ display: 'block', marginTop: 4, fontWeight: 600, color: '#667eea' }}>{addToRoomAccount ? 'Será adicionado à conta do quarto' : 'Pagamento imediato'}</span></span>}
                  />
                )}
                
                {/* Opção de taxa de serviço (sempre visível) */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={includeTip}
                      onChange={e => setIncludeTip(e.target.checked)}
                      color="success"
                    />
                  }
                  label={<span>Adicionar 10% de taxa de garçom<br /><span style={{ display: 'block', marginTop: 4, fontWeight: 600 }}>{tipValue > 0 ? `+ R$ ${tipValue.toFixed(2)}` : ''}</span></span>}
                />
                
                {/* Opções de pagamento (apenas se não for para conta do quarto) */}
                {(!roomInfo || !addToRoomAccount) && (
                  <>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={requestInvoice}
                          onChange={e => setRequestInvoice(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={<span>Imprimir Nota da Mesa</span>}
                    />
                    <FormControl component="fieldset">
                      <FormLabel component="legend" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                        Forma de pagamento
                      </FormLabel>
                      <RadioGroup
                        row
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        name="payment-method"
                      >
                        <FormControlLabel value="cash" control={<Radio color="success" />} label="Dinheiro" />
                        <FormControlLabel value="card" control={<Radio color="primary" />} label="Cartão" />
                        <FormControlLabel value="pix" control={<Radio color="secondary" />} label="Pix" />
                      </RadioGroup>
                    </FormControl>
                  </>
                )}
                <Divider sx={{ my: 0 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#059669' }}>
                  Total a pagar: R$ {closeTotal.toFixed(2)}
                </Typography>
                {closeTableError && (
                  <Alert severity="error">{closeTableError}</Alert>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button
                onClick={handleCloseCloseDialog}
                disabled={closeTableLoading}
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
                onClick={() => setCloseConfirmOpen(true)}
                variant="contained"
                color="success"
                disabled={closeTableLoading}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
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
                {closeTableLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Confirmar'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog de confirmação para fechar mesa */}
          <Dialog
            open={closeConfirmOpen}
            onClose={() => setCloseConfirmOpen(false)}
            maxWidth="xs"
            fullWidth
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }
              }
            }}
          >
            <DialogTitle sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '12px 12px 0 0',
              pb: 2,
              textAlign: 'center',
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Fechar Mesa{selectedTableToClose?.name ? ` - ${selectedTableToClose.name}` : ''}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 500, color: '#1e293b', textAlign: 'center' }}>
                <br />
                Tem certeza que deseja fechar esta mesa?
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button
                onClick={() => setCloseConfirmOpen(false)}
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
                onClick={() => { setCloseConfirmOpen(false); handleConfirmCloseTable(); }}
                variant="contained"
                color="success"
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 14px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    background: '#e5e7eb',
                    color: '#9ca3af'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Confirmar
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog de confirmação para finalizar pedido */}
          <Dialog
            open={finishOrderDialogOpen}
            onClose={(event, reason) => {
              if (reason === 'backdropClick') {
                return; // Prevent closing on backdrop click
              }
              handleFinishOrderDialogClose();
            }}
            maxWidth="xs"
            fullWidth
            disableScrollLock={false}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }
              },
              backdrop: {
                sx: {
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(4px)'
                }
              }
            }}
          >
            <DialogTitle sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              borderRadius: '12px 12px 0 0',
              pb: 2,
              textAlign: 'center',
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Finalizar Pedido #{selectedOrderToFinish?.id}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              {finishOrderError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {finishOrderError}
                </Alert>
              )}
              <Typography variant="body1" sx={{ fontWeight: 500, color: '#1e293b', textAlign: 'center' }}>
                <br />
                Tem certeza que deseja finalizar este pedido?
                <br />
                <br />
                <Typography variant="body2" color="text.secondary">
                  Esta ação marcará o pedido como entregue e finalizado.
                </Typography>
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button
                onClick={handleFinishOrderDialogClose}
                disabled={finishOrderLoading}
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
                onClick={handleConfirmFinishOrder}
                disabled={finishOrderLoading}
                variant="contained"
                color="success"
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
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
                {finishOrderLoading ? (
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                ) : (
                  'Finalizar'
                )}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog de confirmação para git */}
          <Dialog
            open={closeSuccessOpen}
            onClose={() => setCloseSuccessOpen(false)}
            maxWidth="sm"
            fullWidth
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }
              }
            }}
          >
            <DialogTitle sx={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              borderRadius: '12px 12px 0 0',
              pb: 2,
              textAlign: 'center',
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Mesa {selectedTableToClose?.name ? `${selectedTableToClose.name} ` : ''}fechada com sucesso!
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  ✅ Operação concluída
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                <Box sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid rgba(102, 126, 234, 0.12)',
                  textAlign: 'center',
                  width: '100%',
                  background: 'transparent'
                }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                    {selectedTableToClose?.name || ''}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Valor total: R$ {closeTotal.toFixed(2)}
                  </Typography>
                  
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button
                onClick={() => setCloseSuccessOpen(false)}
                variant="contained"
                color="success"
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 14px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    background: '#e5e7eb',
                    color: '#9ca3af'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                OK
              </Button>
            </DialogActions>
          </Dialog>

          {/* Modal de fluxo de novo pedido */}
          <Dialog
            open={newOrderFlowDialogOpen}
            onClose={() => setNewOrderFlowDialogOpen(false)}
            maxWidth="sm"
            fullWidth
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }
              }
            }}
          >
            <DialogTitle sx={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              borderRadius: '12px 12px 0 0',
              pb: 2,
              textAlign: 'center'
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Novo Pedido
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Escolha como prosseguir
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                
                {/* Opção 1: Nova Mesa */}
                <Card
                  onClick={() => {
                    setNewOrderFlowDialogOpen(false);
                    setNewTableDialogOpen(true);
                  }}
                  sx={{
                    cursor: 'pointer',
                    border: '2px solid rgba(102, 126, 234, 0.1)',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      border: '2px solid rgba(102, 126, 234, 0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <AddIcon sx={{ fontSize: 28 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                          Nova Mesa
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Criar uma nova mesa e fazer o pedido
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Opção 2: Selecionar Mesa Existente */}
                <Card
                  onClick={() => {
                    setNewOrderFlowDialogOpen(false);
                    setSelectedTableForOrder(null);
                    setSelectOrderDialogOpen(true);
                  }}
                  sx={{
                    cursor: 'pointer',
                    border: '2px solid rgba(16, 185, 129, 0.1)',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      border: '2px solid rgba(16, 185, 129, 0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(16, 185, 129, 0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <TableBarIcon sx={{ fontSize: 28 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                          Mesa Existente
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Selecionar uma mesa já aberta
                        </Typography>
                        {tables.filter(t => !t.is_closed).length > 0 && (
                          <Typography variant="caption" sx={{ 
                            color: '#10b981', 
                            fontWeight: 600,
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            display: 'inline-block',
                            mt: 1
                          }}>
                            {tables.filter(t => !t.is_closed).length} mesa{tables.filter(t => !t.is_closed).length !== 1 ? 's' : ''} disponível{tables.filter(t => !t.is_closed).length !== 1 ? 'is' : ''}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'center' }}>
              <Button
                onClick={() => setNewOrderFlowDialogOpen(false)}
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
            </DialogActions>
          </Dialog>


        </>
      )}
    </Box>
  );
};

export default TableList; 