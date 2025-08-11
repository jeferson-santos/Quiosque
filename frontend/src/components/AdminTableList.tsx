import { useState, useEffect } from 'react';
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
  Avatar,
  Chip,
  Tooltip,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
  FormLabel,
  RadioGroup,
  Radio,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PaymentIcon from '@mui/icons-material/Payment';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api, { getTables, createTable, closeTable, getOrdersByTable, cancelOrder, finishOrder } from '../config/api';
import OrderCreator from './OrderCreator';
import { colors, createButtonStyle, createDialogStyle, createCardStyle } from '../config/colors';
import ConfirmDialog from './ConfirmDialog';

interface Table {
  id: number;
  name: string;
  is_closed: boolean;
  created_by: string;
  created_at: string;
  closed_at?: string;
  room_id?: number;
}

interface Room {
  id: number;
  number: string;
  status?: string;
  guest_name?: string;
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
  created_at: string;
  created_by: string;
  items: any[];
  total_amount: number;
  total_items: number;
  comment?: string;
}

const AdminTableList = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [orders, setOrders] = useState<{ [key: number]: Order[] }>({});
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    room_id: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  // Estados para fechamento de mesa
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [selectedTableToClose, setSelectedTableToClose] = useState<Table | null>(null);
  const [closeTableLoading, setCloseTableLoading] = useState(false);
  const [closeTableError, setCloseTableError] = useState('');
  const [includeTip, setIncludeTip] = useState(true);
  const [requestInvoice, setRequestInvoice] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [closeTotal, setCloseTotal] = useState(0);
  const [closeBaseTotal, setCloseBaseTotal] = useState(0);
  const [tipValue, setTipValue] = useState(0);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [closeSuccessOpen, setCloseSuccessOpen] = useState(false);

  // Estados para novo pedido
  const [newOrderFlowDialogOpen, setNewOrderFlowDialogOpen] = useState(false);
  const [selectedTableForNewOrder, setSelectedTableForNewOrder] = useState<Table | null>(null);
  const [newOrderDialogOpen, setNewOrderDialogOpen] = useState(false);
  const [orderCreatedSuccessfully, setOrderCreatedSuccessfully] = useState(false);
  const [hasItemsInOrder, setHasItemsInOrder] = useState(false);
  const [cancelConfirmDialogOpen, setCancelConfirmDialogOpen] = useState(false);

  // Estados para seleção de mesa
  const [selectTableDialogOpen, setSelectTableDialogOpen] = useState(false);
  const [selectedTableForSelection, setSelectedTableForSelection] = useState<Table | null>(null);

  // Estados para criação de mesa
  const [statusFilter, setStatusFilter] = useState<'open' | 'closed'>('open');
  const [newTableName, setNewTableName] = useState('');
  const [isRoomTable, setIsRoomTable] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [creatingTable, setCreatingTable] = useState(false);
  const [createTableError, setCreateTableError] = useState('');

  // Estados para exclusão de mesa
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);
  const [deletingTable, setDeletingTable] = useState(false);

  // Estados para visualização de pedidos
  const [viewOrdersDialogOpen, setViewOrdersDialogOpen] = useState(false);
  const [selectedTableForOrders, setSelectedTableForOrders] = useState<Table | null>(null);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Estados para edição de pedidos
  const [editOrderDialogOpen, setEditOrderDialogOpen] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null);

  // Estados para cancelamento de pedidos
  const [cancelOrderDialogOpen, setCancelOrderDialogOpen] = useState(false);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null);
  const [cancelingOrder, setCancelingOrder] = useState(false);
  const [cancelOrderSuccessDialogOpen, setCancelOrderSuccessDialogOpen] = useState(false);
  const [canceledOrderInfo, setCanceledOrderInfo] = useState<{order: Order, tableName: string} | null>(null);

  // Estados para finalizar pedidos
  const [finishOrderDialogOpen, setFinishOrderDialogOpen] = useState(false);
  const [selectedOrderForFinish, setSelectedOrderForFinish] = useState<Order | null>(null);
  const [finishingOrder, setFinishingOrder] = useState(false);

  // Estados para quartos
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [addToRoomAccount, setAddToRoomAccount] = useState(false);

  // Estado para filtro de pesquisa
  const [search, setSearch] = useState('');
  
  // Estado para popup de confirmação de fechamento
  const [closeConfirmDialogOpen, setCloseConfirmDialogOpen] = useState(false);

  useEffect(() => {
    loadTables();
    // Só carregar quartos se estiver habilitado
    if (import.meta.env.VITE_ENABLE_ROOMS === 'true') {
      loadRooms();
    }
    // Remover carregamento de produtos - não é usado na página de ADMIN
  }, []);

  useEffect(() => {
    loadTables();
  }, [statusFilter]);





  const loadTables = async () => {
    try {
      setLoading(true);
      const tablesData = await getTables(statusFilter === 'open' ? false : true);
      // Ordenar mesas alfabeticamente por nome
      const sortedTables = tablesData.sort((a: Table, b: Table) => 
        a.name.localeCompare(b.name, 'pt-BR', { numeric: true })
      );
      setTables(sortedTables);
      
      // Carregar pedidos para todas as mesas em paralelo
      const orderPromises = tablesData.map(async (table: Table) => {
        try {
          const tableOrders = await getOrdersByTable(table.id);
          return { tableId: table.id, orders: tableOrders };
        } catch (error) {
          console.error(`Erro ao carregar pedidos da mesa ${table.id}:`, error);
          return { tableId: table.id, orders: [] };
        }
      });

      const orderResults = await Promise.all(orderPromises);
      
      // Atualizar todos os pedidos de uma vez
      const newOrders = orderResults.reduce((acc, { tableId, orders }) => {
        acc[tableId] = orders;
        return acc;
      }, {} as Record<number, Order[]>);
      
      setOrders(newOrders);
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar mesas',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await api.get('/rooms/');
      setRooms(response.data);
    } catch (error) {
      console.error('Erro ao carregar quartos:', error);
    }
  };



  const handleOpenDialog = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        name: table.name,
        room_id: table.room_id?.toString() || ''
      });
    } else {
      setEditingTable(null);
      setFormData({
        name: '',
        room_id: ''
      });
    }
    setOpenDialog(true);
  };

  const handleNewTableClick = () => {
    setNewTableName('');
    setIsRoomTable(false);
    setSelectedRoom('');
    setCreateTableError('');
    setOpenDialog(true);
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
      
      console.log('🔧 === AdminTableList: handleCreateTable ===');
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
      setOpenDialog(false);
      setNewTableName('');
      setIsRoomTable(false);
      setSelectedRoom('');
      
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





  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTable(null);
    setFormData({
      name: '',
      room_id: ''
    });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        setSnackbar({
          open: true,
          message: 'Nome da mesa é obrigatório',
          severity: 'error'
        });
        return;
      }

      if (editingTable) {
        // Atualizar mesa existente
        await api.put(`/tables/${editingTable.id}`, {
          name: formData.name,
          room_id: formData.room_id ? parseInt(formData.room_id) : null
        });
        setSnackbar({
          open: true,
          message: 'Mesa atualizada com sucesso',
          severity: 'success'
        });
      } else {
        // Criar nova mesa
        await createTable(formData.name, formData.room_id ? parseInt(formData.room_id) : undefined);
        setSnackbar({
          open: true,
          message: 'Mesa criada com sucesso',
          severity: 'success'
        });
      }

      handleCloseDialog();
      loadTables();
    } catch (error) {
      console.error('Erro ao salvar mesa:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao salvar mesa',
        severity: 'error'
      });
    }
  };

  const handleDeleteTable = async (tableId: number) => {
    try {
      await api.delete(`/tables/${tableId}`);
      setSnackbar({
        open: true,
        message: 'Mesa excluída com sucesso',
        severity: 'success'
      });
      loadTables();
    } catch (error) {
      console.error('Erro ao excluir mesa:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao excluir mesa',
        severity: 'error'
      });
    }
  };

  const handleOpenDeleteDialog = (table: Table) => {
    setTableToDelete(table);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTableToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (tableToDelete) {
      await handleDeleteTable(tableToDelete.id);
      handleCloseDeleteDialog();
    }
  };

  // Funções para novo pedido
  const handleCloseNewOrderDialog = () => {
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

  // Funções para seleção de mesa
  const handleCloseSelectTableDialog = () => {
    setSelectTableDialogOpen(false);
    setSelectedTableForSelection(null);
  };

  const handleConfirmTableSelection = () => {
    if (selectedTableForSelection) {
      setSelectedTableForNewOrder(selectedTableForSelection);
      setNewOrderDialogOpen(true);
      setSelectTableDialogOpen(false);
      setSelectedTableForSelection(null);
      setOrderCreatedSuccessfully(false);
      setHasItemsInOrder(false);
    }
  };

  const handleOrderCreated = (_order: any) => {
    // Recarregar pedidos da mesa
    if (selectedTableForNewOrder) {
      loadOrdersForTable(selectedTableForNewOrder.id);
    }
    setOrderCreatedSuccessfully(true);
    setNewOrderDialogOpen(false);
    setSelectedTableForNewOrder(null);
    setSnackbar({
      open: true,
      message: 'Pedido criado com sucesso!',
      severity: 'success'
    });
  };

  const loadOrdersForTable = async (tableId: number) => {
    try {
      const tableOrders = await getOrdersByTable(tableId);
      setOrders(prev => ({ ...prev, [tableId]: tableOrders }));
    } catch (error) {
      console.error(`Erro ao carregar pedidos da mesa ${tableId}:`, error);
    }
  };

  // Função para abrir modal de fechamento
  const handleOpenCloseDialog = async (table: Table) => {
    try {
      const tableOrders = orders[table.id] || [];
      const baseTotal = tableOrders.filter((order: Order) => order.status !== 'cancelled').reduce((acc: number, order: Order) => acc + order.total_amount, 0);
      
      // Configurar valores padrão
      setCloseBaseTotal(baseTotal);
      setRequestInvoice(false);
      setPaymentMethod('cash');
      setSelectedTableToClose(table);
      setCloseTableError('');
      
      // Se a mesa está vinculada a um quarto
      if (table.room_id) {
        const room = rooms.find(r => r.id === table.room_id);
        if (room) {
          setRoomInfo({ room_number: room.number, room_id: room.id });
          setIncludeTip(false);
          setCloseTotal(baseTotal);
          setTipValue(0);
          setAddToRoomAccount(true);
        } else {
          setIncludeTip(true);
          setCloseTotal(baseTotal * 1.1);
          setTipValue(+(baseTotal * 0.1).toFixed(2));
          setRoomInfo(null);
          setAddToRoomAccount(false);
        }
      } else {
        setIncludeTip(true);
        setCloseTotal(baseTotal * 1.1);
        setTipValue(+(baseTotal * 0.1).toFixed(2));
        setRoomInfo(null);
        setAddToRoomAccount(false);
      }
      
      setCloseDialogOpen(true);
    } catch (error) {
      console.error('Erro ao verificar informações do quarto:', error);
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
      setAddToRoomAccount(false);
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

  // Função para abrir popup de confirmação
  const handleConfirmCloseTable = () => {
    setCloseConfirmDialogOpen(true);
  };

  // Função para executar o fechamento da mesa
  const handleExecuteCloseTable = async () => {
    if (!selectedTableToClose) return;
    setCloseTableLoading(true);
    setCloseTableError('');
    setCloseConfirmDialogOpen(false);
    try {
      // Se a mesa está vinculada a um quarto e deve ir para conta do quarto
      if (roomInfo && addToRoomAccount) {
        await closeTable(
          selectedTableToClose.id, 
          includeTip,
          false,
          'added_to_room',
          'room_account'
        );
      } else {
        // Pagamento imediato
        await closeTable(
          selectedTableToClose.id, 
          includeTip, 
          requestInvoice, 
          paymentMethod || 'cash',
          'immediate',
          Number(closeTotal),
          0
        );
      }
      
      setCloseDialogOpen(false);
      setSelectedTableToClose(null);
      setRoomInfo(null);
      setAddToRoomAccount(true);
      setSnackbar({
        open: true,
        message: 'Mesa fechada com sucesso',
        severity: 'success'
      });
      loadTables();
    } catch (error: any) {
      setCloseTableError('Erro ao fechar mesa. Tente novamente.');
    } finally {
      setCloseTableLoading(false);
    }
  };

  const getProductSummary = (tableOrders: Order[]) => {
    const productMap = new Map();
    
    tableOrders.forEach(order => {
      order.items.forEach(item => {
        const key = item.product_id;
        if (productMap.has(key)) {
          productMap.get(key).quantity += item.quantity;
          productMap.get(key).total += item.quantity * item.unit_price;
        } else {
          productMap.set(key, {
            name: item.name || `Produto ${item.product_id}`,
            quantity: item.quantity,
            total: item.quantity * item.unit_price
          });
        }
      });
    });
    
    return Array.from(productMap.values());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getRoomName = (roomId?: number) => {
    if (!roomId) return 'Sem quarto';
    const room = rooms.find(r => r.id === roomId);
    return room ? `Quarto ${room.number}` : 'Quarto não encontrado';
  };

  const getTableStatus = (table: Table) => {
    const tableOrders = orders[table.id] || [];
    const pendingOrders = tableOrders.filter(order => order.status === 'pending');
    const finishedOrders = tableOrders.filter(order => order.status === 'finished');
    
    if (table.is_closed) return { status: 'closed', label: 'Fechada', color: 'error' };
    if (pendingOrders.length > 0) return { status: 'pending', label: 'Pedidos Pendentes', color: 'warning' };
    if (finishedOrders.length > 0) return { status: 'finished', label: 'Pronta', color: 'success' };
    return { status: 'empty', label: 'Vazia', color: 'default' };
  };

  const getTableOrdersCount = (tableId: number) => {
    const tableOrders = orders[tableId] || [];
    return tableOrders.filter((order: Order) => order.status !== 'cancelled').length;
  };

  const getTableTotalAmount = (tableId: number) => {
    const tableOrders = orders[tableId] || [];
    return tableOrders.filter((order: Order) => order.status !== 'cancelled').reduce((acc, order) => acc + order.total_amount, 0);
  };

  // Funções para gerenciar pedidos
  const handleViewOrders = async (table: Table) => {
    setSelectedTableForOrders(table);
    setLoadingOrders(true);
    setViewOrdersDialogOpen(true);
    
    try {
      const tableOrdersData = await getOrdersByTable(table.id);
      setTableOrders(tableOrdersData);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar pedidos da mesa',
        severity: 'error'
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCloseViewOrders = () => {
    setViewOrdersDialogOpen(false);
    setSelectedTableForOrders(null);
    setTableOrders([]);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrderForEdit(order);
    
    // Encontrar a mesa correspondente ao pedido
    const table = tables.find(t => t.id === order.table_id);
    
    if (table) {
      setSelectedTableForOrders(table);
    }
    
    setEditOrderDialogOpen(true);
  };

  const handleCloseEditOrder = () => {
    setEditOrderDialogOpen(false);
    setSelectedOrderForEdit(null);
    setSelectedTableForOrders(null);
  };

  const handleCancelOrder = (order: Order) => {
    setSelectedOrderForCancel(order);
    setCancelOrderDialogOpen(true);
  };

  const handleCloseCancelOrder = () => {
    setCancelOrderDialogOpen(false);
    setSelectedOrderForCancel(null);
  };

  const handleCloseCancelOrderSuccess = () => {
    setCancelOrderSuccessDialogOpen(false);
    setCanceledOrderInfo(null);
  };

  const handleConfirmCancelOrder = async () => {
    if (!selectedOrderForCancel) return;

    try {
      setCancelingOrder(true);
      await cancelOrder(selectedOrderForCancel.table_id, selectedOrderForCancel.id);
      
      // Atualizar a lista de pedidos - marcar como cancelado em vez de remover
      const updatedOrders = tableOrders.map(order => 
        order.id === selectedOrderForCancel.id 
          ? { ...order, status: 'cancelled' }
          : order
      );
      setTableOrders(updatedOrders);
      
      // Atualizar o estado global de pedidos
      setOrders(prev => ({
        ...prev,
        [selectedOrderForCancel.table_id]: updatedOrders
      }));

      // Recarregar pedidos da mesa para garantir dados atualizados
      await loadOrdersForTable(selectedOrderForCancel.table_id);

      // Salvar informações do pedido cancelado para o popup
      const tableName = selectedTableForOrders?.name || `Mesa ${selectedOrderForCancel.table_id}`;
      setCanceledOrderInfo({
        order: selectedOrderForCancel,
        tableName: tableName
      });
      
      // Fechar dialog de confirmação e abrir popup de sucesso
      handleCloseCancelOrder();
      setCancelOrderSuccessDialogOpen(true);
    } catch (error: any) {
      console.error('Erro ao cancelar pedido:', error);
      
      // Verificar se é um erro específico do backend
      let errorMessage = 'Erro ao cancelar pedido';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 400) {
        errorMessage = 'Não é possível cancelar este pedido';
      } else if (error.response?.status === 404) {
        errorMessage = 'Pedido não encontrado';
      } else if (error.response?.status === 403) {
        errorMessage = 'Sem permissão para cancelar pedidos';
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setCancelingOrder(false);
    }
  };

  const handleOrderUpdated = (updatedOrder: any) => {
    // Atualizar a lista de pedidos
    const updatedOrders = tableOrders.map(order => 
      order.id === updatedOrder.id ? updatedOrder : order
    );
    setTableOrders(updatedOrders);
    
    // Atualizar o estado global de pedidos
    setOrders(prev => ({
      ...prev,
      [updatedOrder.table_id]: updatedOrders
    }));

    setSnackbar({
      open: true,
      message: 'Pedido atualizado com sucesso',
      severity: 'success'
    });
    
    handleCloseEditOrder();
  };

  // Funções para finalizar pedido
  const handleFinishOrder = (order: Order) => {
    setSelectedOrderForFinish(order);
    setFinishOrderDialogOpen(true);
  };

  const handleCloseFinishOrder = () => {
    setFinishOrderDialogOpen(false);
    setSelectedOrderForFinish(null);
  };

  const handleConfirmFinishOrder = async () => {
    if (!selectedOrderForFinish) return;

    try {
      setFinishingOrder(true);
      await finishOrder(selectedOrderForFinish.table_id, selectedOrderForFinish.id);
      
      // Atualizar o pedido na lista local
      const updatedOrders = tableOrders.map(order => 
        order.id === selectedOrderForFinish.id 
          ? { ...order, status: 'finished' }
          : order
      );
      setTableOrders(updatedOrders);
      
      // Atualizar o estado global de pedidos
      setOrders(prev => ({
        ...prev,
        [selectedOrderForFinish.table_id]: updatedOrders
      }));

      setSnackbar({
        open: true,
        message: `Pedido #${selectedOrderForFinish.id} concluído com sucesso`,
        severity: 'success'
      });
      
      handleCloseFinishOrder();
    } catch (error: any) {
      console.error('Erro ao finalizar pedido:', error);
      
      let errorMessage = 'Erro ao finalizar pedido';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 400) {
        errorMessage = 'Não é possível finalizar este pedido';
      } else if (error.response?.status === 404) {
        errorMessage = 'Pedido não encontrado';
      } else if (error.response?.status === 403) {
        errorMessage = 'Sem permissão para finalizar pedidos';
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setFinishingOrder(false);
    }
  };

  // Debug useEffect removed - problem was in OrderCreator component

  // Não precisamos mais filtrar localmente, pois a API já retorna as mesas filtradas
  const filteredTables = tables;

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        px: { xs: 2, sm: 3, md: 4 }
      }}>
        <CircularProgress size={60} sx={{ color: '#8b5cf6' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
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
            Mesas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie todas as mesas do estabelecimento
          </Typography>
        </Box>
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
      </Box>

      {/* Filtro de Status */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>
          Filtrar por Status
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          <Button
            variant={statusFilter === 'open' ? 'contained' : 'outlined'}
            onClick={() => setStatusFilter('open')}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              background: statusFilter === 'open' ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'transparent',
              color: statusFilter === 'open' ? 'white' : '#8b5cf6',
              border: statusFilter === 'open' ? 'none' : '2px solid #8b5cf6',
              '&:hover': {
                background: statusFilter === 'open' ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'rgba(139, 92, 246, 0.1)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Abertas
          </Button>
          <Button
            variant={statusFilter === 'closed' ? 'contained' : 'outlined'}
            onClick={() => setStatusFilter('closed')}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              background: statusFilter === 'closed' ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' : 'transparent',
              color: statusFilter === 'closed' ? 'white' : '#6b7280',
              border: statusFilter === 'closed' ? 'none' : '2px solid #6b7280',
              '&:hover': {
                background: statusFilter === 'closed' ? 'linear-gradient(135deg, #4b5563 0%, #374151 100%)' : 'rgba(107, 114, 128, 0.1)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Fechadas
          </Button>
        </Box>
      </Box>

      {/* Filtro de pesquisa */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        mb: 3,
        maxWidth: 340,
        justifyContent: 'flex-start',
      }}>
        <FormControl fullWidth size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="select-table-filter-label">Pesquisar mesa</InputLabel>
          <Select
            labelId="select-table-filter-label"
            value={search}
            label="Pesquisar mesa"
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
              PaperProps: {
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
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      color: '#8b5cf6'
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(139, 92, 246, 0.15)',
                      color: '#8b5cf6',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: 'rgba(139, 92, 246, 0.2)'
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
                borderColor: '#8b5cf6'
              },
              '& .MuiSelect-icon': {
                color: '#8b5cf6'
              }
            }}
          >
            <MenuItem value="" sx={{ 
              fontWeight: 600,
              color: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.05)',
              borderBottom: '1px solid rgba(139, 92, 246, 0.1)'
            }}>
              Todas as Mesas
            </MenuItem>
            {tables
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
                      backgroundColor: table.is_closed ? '#ef4444' : (hasPendingOrders ? '#f59e0b' : '#10b981'),
                      flexShrink: 0
                    }} />
                    {table.name}
                    {room && (
                      <Typography variant="caption" sx={{ 
                        color: '#8b5cf6',
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

      {filteredTables.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8,
          backgroundColor: 'rgba(139, 92, 246, 0.05)',
          borderRadius: 3,
          border: '2px dashed rgba(139, 92, 246, 0.3)'
        }}>
          <Typography variant="h6" sx={{ color: '#8b5cf6', mb: 2 }}>
            {statusFilter === 'open' ? 'Nenhuma mesa aberta' : 'Nenhuma mesa fechada'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {statusFilter === 'open' ? 'Todas as mesas estão fechadas' : 'Nenhuma mesa foi fechada ainda'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3, justifyContent: 'flex-start' }}>
          {filteredTables
            .filter(table =>
              !search || table.name === search
            )
            .map((table) => {
            const tableStatus = getTableStatus(table);
            const ordersCount = getTableOrdersCount(table.id);
            const totalAmount = getTableTotalAmount(table.id);
            
            return (
              <Box key={table.id} sx={{ mx: 0 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  borderRadius: 3,
                  background: 'white',
                  border: '2px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    border: '2px solid rgba(0,0,0,0.12)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        sx={{
                          bgcolor: tableStatus.color === 'success' ? '#10b981' : 
                                   tableStatus.color === 'warning' ? '#f59e0b' : 
                                   tableStatus.color === 'error' ? '#ef4444' : '#6b7280',
                          width: 40,
                          height: 40
                        }}
                      >
                        <RestaurantIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {table.name}
                        </Typography>
                        <Chip
                          label={tableStatus.label}
                          color={tableStatus.color as any}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {getRoomName(table.room_id)}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Chip
                        icon={<ShoppingCartIcon />}
                        label={`${ordersCount} pedidos`}
                        size="small"
                        variant="outlined"
                      />
                      {totalAmount > 0 && (
                        <Chip
                          icon={<PaymentIcon />}
                          label={`R$ ${totalAmount.toFixed(2)}`}
                          size="small"
                          variant="outlined"
                          color="success"
                        />
                      )}
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Criada por: {table.created_by}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {formatDate(table.created_at)}
                    </Typography>
                  </Box>

                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    mt: 'auto', 
                    justifyContent: 'center',
                    pt: 2,
                    borderTop: '1px solid rgba(0,0,0,0.08)'
                  }}>
                    {/* Botão Ver Pedidos */}
                    <Tooltip title="Ver Pedidos">
                      <IconButton
                        size="medium"
                        onClick={() => handleViewOrders(table)}
                        sx={{ 
                          color: '#3b82f6',
                          border: '2px solid rgba(59, 130, 246, 0.2)',
                          backgroundColor: 'rgba(59, 130, 246, 0.05)',
                          width: 48,
                          height: 48,
                          '&:hover': { 
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            border: '2px solid rgba(59, 130, 246, 0.4)',
                            transform: 'scale(1.05)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <VisibilityIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Tooltip>

                    {/* Botão Novo Pedido */}
                    <Tooltip title="Novo Pedido">
                      <IconButton
                        size="medium"
                        onClick={() => {
                          setSelectedTableForNewOrder(table);
                          setNewOrderDialogOpen(true);
                        }}
                        disabled={table.is_closed}
                        sx={{ 
                          color: '#10b981',
                          border: '2px solid rgba(16, 185, 129, 0.2)',
                          backgroundColor: 'rgba(16, 185, 129, 0.05)',
                          width: 48,
                          height: 48,
                          '&:hover': { 
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            border: '2px solid rgba(16, 185, 129, 0.4)',
                            transform: 'scale(1.05)'
                          },
                          '&:disabled': {
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            color: '#9ca3af',
                            border: '2px solid rgba(0,0,0,0.1)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <AddIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Editar mesa">
                      <IconButton
                        size="medium"
                        onClick={() => handleOpenDialog(table)}
                        sx={{ 
                          color: '#8b5cf6',
                          border: '2px solid rgba(139, 92, 246, 0.2)',
                          backgroundColor: 'rgba(139, 92, 246, 0.05)',
                          width: 48,
                          height: 48,
                          '&:hover': { 
                            backgroundColor: 'rgba(139, 92, 246, 0.15)',
                            border: '2px solid rgba(139, 92, 246, 0.4)',
                            transform: 'scale(1.05)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <EditIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Tooltip>

                    {!table.is_closed && (
                      <Tooltip title={
                        !orders[table.id] ? 'Carregando pedidos...' :
                        (orders[table.id] || []).filter((order: Order) => order.status === 'pending').length > 0 ? 
                        'Finalize os pedidos pendentes primeiro' : 'Fechar mesa'
                      }>
                        <IconButton
                          size="medium"
                          onClick={() => handleOpenCloseDialog(table)}
                          disabled={!orders[table.id] || (orders[table.id] || []).filter((order: Order) => order.status === 'pending').length > 0}
                                                      sx={{ 
                              color: '#f59e0b',
                              border: '2px solid rgba(245, 158, 11, 0.2)',
                              backgroundColor: 'rgba(245, 158, 11, 0.05)',
                              width: 48,
                              height: 48,
                              '&:hover': { 
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                border: '2px solid rgba(245, 158, 11, 0.4)',
                                transform: 'scale(1.05)'
                              },
                              '&:disabled': {
                                backgroundColor: 'rgba(0,0,0,0.05)',
                                color: '#9ca3af',
                                borderColor: 'rgba(0,0,0,0.1)',
                                cursor: 'not-allowed'
                              },
                              transition: 'all 0.2s ease'
                            }}
                        >
                          <CloseIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>
                    )}

                    <Tooltip title="Excluir mesa">
                      <IconButton
                        size="medium"
                        onClick={() => handleOpenDeleteDialog(table)}
                        sx={{ 
                          color: '#ef4444',
                          border: '2px solid rgba(239, 68, 68, 0.2)',
                          backgroundColor: 'rgba(239, 68, 68, 0.05)',
                          width: 48,
                          height: 48,
                          '&:hover': { 
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            border: '2px solid rgba(239, 68, 68, 0.4)',
                            transform: 'scale(1.05)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          );
        })}
        </Box>
      )}

      

      {/* Dialog para criar/editar mesa */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          {editingTable ? 'Editar Mesa' : 'Nova Mesa'}
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              label={import.meta.env.VITE_TABLE_NAME_NUMBERS_ONLY === 'true' ? 'Número da Mesa' : 'Nome da Mesa'}
              value={editingTable ? formData.name : newTableName}
              onChange={(e) => editingTable 
                ? setFormData({ ...formData, name: e.target.value })
                : setNewTableName(e.target.value)
              }
              fullWidth
              required
              placeholder={import.meta.env.VITE_TABLE_NAME_NUMBERS_ONLY === 'true' ? 'Ex: 1, 2, 3, 10, 100' : 'Ex: Mesa 1, Mesa VIP, etc.'}
              inputProps={{
                pattern: import.meta.env.VITE_TABLE_NAME_NUMBERS_ONLY === 'true' ? '[0-9]*' : undefined
              }}
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
            />
            
            {rooms.length > 0 && !editingTable && (
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
            
            {editingTable ? (
              <FormControl fullWidth>
                <InputLabel>Quarto (opcional)</InputLabel>
                <Select
                  value={formData.room_id}
                  label="Quarto (opcional)"
                  onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                >
                  <MenuItem value="">
                    <em>Sem quarto</em>
                  </MenuItem>
                  {rooms.map((room) => (
                    <MenuItem key={room.id} value={room.id.toString()}>
                      Quarto {room.number}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : isRoomTable && (
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
                     </MenuItem>
                   ))}
                </Select>
              </FormControl>
            )}
            
            {createTableError && !editingTable && (
              <Alert severity="error" sx={{ 
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
            onClick={handleCloseDialog} 
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
            onClick={editingTable ? handleSubmit : handleCreateTable} 
            variant="contained" 
            disabled={creatingTable || 
              (editingTable ? !formData.name.trim() : (!newTableName.trim() || (isRoomTable && !selectedRoom)))}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
              color: 'white',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)',
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                background: '#e5e7eb',
                color: '#9ca3af'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {editingTable ? 'Atualizar' : creatingTable ? 'Criando...' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para fechar mesa */}
      <Dialog
        open={closeDialogOpen}
        onClose={handleCloseCloseDialog}
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
                  {getProductSummary(orders[selectedTableToClose.id] || []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', px: 1 }}>
                      Nenhum produto consumido.
                    </Typography>
                  ) : (
                    getProductSummary(orders[selectedTableToClose.id] || []).map((item, idx) => (
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
            {roomInfo && (
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
                label={<span>Vincular no quarto {roomInfo.room_number}?<br /><span style={{ display: 'block', marginTop: 4, fontWeight: 600, color: '#8b5cf6' }}>{addToRoomAccount ? 'Será adicionado à conta do quarto' : 'Pagamento imediato'}</span></span>}
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
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#8b5cf6' }}>
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
            onClick={handleConfirmCloseTable}
            variant="contained"
            disabled={closeTableLoading}
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

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Excluir Mesa"
        description={<>
          Tem certeza que deseja excluir a mesa "{tableToDelete?.name}"?
          <br />
          ⚠️ Esta ação não pode ser desfeita. Todos os dados da mesa e pedidos vinculados serão perdidos permanentemente.
        </>}
        confirmText="Excluir Mesa"
        variant="danger"
      />

      {/* Dialog para seleção de mesa */}
      <Dialog
        open={selectTableDialogOpen}
        onClose={handleCloseSelectTableDialog}
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
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Selecionar Mesa
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="select-table-label">Mesa</InputLabel>
              <Select
                labelId="select-table-label"
                value={selectedTableForSelection ? selectedTableForSelection.id : ''}
                label="Mesa"
                onChange={e => {
                  const table = tables.find(t => t.id === Number(e.target.value));
                  setSelectedTableForSelection(table || null);
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
                          backgroundColor: 'rgba(16, 185, 129, 0.1)'
                        }
                      }
                    }
                  }
                }}
                sx={{
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#10b981'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#10b981'
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
          <Button 
            onClick={handleCloseSelectTableDialog} 
            sx={{ 
              borderRadius: 2, 
              px: 3, 
              color: '#64748b', 
              '&:hover': { 
                backgroundColor: 'rgba(100, 116, 139, 0.1)' 
              } 
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmTableSelection}
            variant="contained"
            disabled={!selectedTableForSelection}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.2,
              fontWeight: 700,
              fontSize: '1rem',
              background: selectedTableForSelection 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : '#e5e7eb',
              boxShadow: selectedTableForSelection
                ? '0 4px 14px rgba(16, 185, 129, 0.3)'
                : 'none',
              '&:hover': {
                background: selectedTableForSelection
                  ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                  : '#e5e7eb',
                boxShadow: selectedTableForSelection
                  ? '0 6px 20px rgba(16, 185, 129, 0.4)'
                  : 'none',
                transform: selectedTableForSelection ? 'translateY(-1px)' : 'none'
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

      {/* Dialog para novo pedido */}
      <Dialog
        open={newOrderDialogOpen}
        onClose={handleCloseNewOrderDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.05)',
            height: { xs: '100vh', sm: '90vh' },
            width: { xs: '100%', sm: '90vw' },
            maxWidth: { xs: '100%', sm: '1200px' },
            margin: { xs: '0', sm: 'auto' }
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0',
          pb: 2
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Novo Pedido - Mesa {selectedTableForNewOrder?.name}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Adicione produtos ao pedido
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseNewOrderDialog}
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
        <DialogContent sx={{ p: 0, height: '100%' }}>
          {selectedTableForNewOrder && (
            <OrderCreator
              tableId={selectedTableForNewOrder.id}
              tableName={selectedTableForNewOrder.name}
              onOrderCreated={handleOrderCreated}
              onCloseRequest={handleOrderCloseRequest}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para cancelar pedido */}
      <Dialog
        open={cancelConfirmDialogOpen}
        onClose={handleCancelCancel}
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

      {/* Dialog de confirmação para fechar mesa */}
      <Dialog
        open={closeConfirmDialogOpen}
        onClose={() => setCloseConfirmDialogOpen(false)}
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
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0',
          pb: 2
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Confirmar Fechamento
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 500, color: '#1e293b', mt: 2 }}>
              Tem certeza que deseja fechar a mesa "{selectedTableToClose?.name}"?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ 
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              p: 2,
              borderRadius: 2,
              border: '1px solid rgba(245, 158, 11, 0.2)'
            }}>
              💰 Total a pagar: R$ {closeTotal.toFixed(2)}
              {requestInvoice && (
                <Box sx={{ mt: 1, fontWeight: 600, color: '#d97706' }}>
                  📄 Nota da mesa será impressa
                </Box>
              )}
              {roomInfo && addToRoomAccount && (
                <Box sx={{ mt: 1, fontWeight: 600, color: '#d97706' }}>
                  🏨 Será adicionado à conta do quarto {roomInfo.room_number}
                </Box>
              )}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setCloseConfirmDialogOpen(false)}
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
            onClick={handleExecuteCloseTable} 
            variant="contained" 
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Confirmar Fechamento
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para concluir pedido (visualizar pedidos) */}
      <ConfirmDialog
        open={finishOrderDialogOpen}
        onClose={handleCloseFinishOrder}
        onConfirm={handleConfirmFinishOrder}
        title="Concluir Pedido"
        description={<>
          {selectedOrderForFinish ? (
            <>Marcar o pedido #{selectedOrderForFinish.id} como concluído?</>
          ) : (
            <>Marcar pedido como concluído.</>
          )}
        </>}
        confirmText="Concluir"
        variant="success"
        loading={finishingOrder}
      />

      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Modal de fluxo de novo pedido */}
      <Dialog
        open={newOrderFlowDialogOpen}
        onClose={() => setNewOrderFlowDialogOpen(false)}
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
                setOpenDialog(true);
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
                setSelectedTableForSelection(null);
                setSelectTableDialogOpen(true);
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
                    <RestaurantIcon sx={{ fontSize: 28 }} />
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

      {/* Dialog para visualizar pedidos da mesa */}
      <Dialog
        open={viewOrdersDialogOpen}
        onClose={handleCloseViewOrders}
        maxWidth="md"
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
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <VisibilityIcon sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Pedidos da Mesa {selectedTableForOrders?.name}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Gerencie todos os pedidos desta mesa
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {loadingOrders ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={40} />
            </Box>
          ) : tableOrders.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              backgroundColor: 'rgba(59, 130, 246, 0.05)',
              borderRadius: 3,
              border: '2px dashed rgba(59, 130, 246, 0.3)'
            }}>
              <Typography variant="h6" sx={{ color: '#3b82f6', mb: 2 }}>
                Nenhum pedido encontrado
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Esta mesa ainda não possui pedidos
              </Typography>
            </Box>
          ) : (
            <List sx={{ width: '100%' }}>
              {tableOrders
                .sort((a, b) => {
                  // Pedidos pendentes primeiro
                  if (a.status === 'pending' && b.status !== 'pending') return -1;
                  if (a.status !== 'pending' && b.status === 'pending') return 1;
                  // Se ambos têm o mesmo status, ordenar por data de criação (mais recentes primeiro)
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                })
                .map((order) => (
                <ListItem
                  key={order.id}
                  sx={{
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 2,
                    mb: 2,
                    backgroundColor: order.status === 'cancelled' ? 'rgba(239, 68, 68, 0.05)' : 'white',
                    opacity: order.status === 'cancelled' ? 0.7 : 1,
                    '&:hover': {
                      backgroundColor: order.status === 'cancelled' 
                        ? 'rgba(239, 68, 68, 0.08)' 
                        : 'rgba(59, 130, 246, 0.02)',
                      borderColor: order.status === 'cancelled' 
                        ? 'rgba(239, 68, 68, 0.3)' 
                        : 'rgba(59, 130, 246, 0.2)'
                    },
                    transition: 'all 0.2s ease',
                    ...(order.status === 'cancelled' && {
                      textDecoration: 'line-through',
                      '& .MuiListItemText-primary': {
                        textDecoration: 'line-through'
                      },
                      '& .MuiListItemText-secondary': {
                        textDecoration: 'line-through'
                      }
                    })
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600, 
                          color: order.status === 'cancelled' ? '#ef4444' : '#1e293b'
                        }}>
                          Pedido #{order.id}
                        </Typography>
                        <Chip
                          label={
                            order.status === 'pending' ? 'Pendente' : 
                            order.status === 'finished' ? 'Concluído' :
                            order.status === 'cancelled' ? 'Cancelado' : 'Concluído'
                          }
                          color={
                            order.status === 'pending' ? 'warning' : 
                            order.status === 'finished' ? 'success' :
                            order.status === 'cancelled' ? 'error' : 'success'
                          }
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Itens:</strong> {order.total_items} | <strong>Total:</strong> R$ {order.total_amount.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Criado por:</strong> {order.created_by} | <strong>Data:</strong> {formatDate(order.created_at)}
                        </Typography>
                        {order.comment && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            <strong>Observação:</strong> {order.comment}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {order.status === 'pending' && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleFinishOrder(order)}
                          startIcon={<CheckCircleIcon />}
                          sx={{ 
                            backgroundColor: '#10b981',
                            color: 'white',
                            px: 2,
                            py: 0.5,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: 1.5,
                            '&:hover': { 
                              backgroundColor: '#059669',
                              transform: 'scale(1.02)'
                            },
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                          }}
                        >
                          Concluir Pedido
                        </Button>
                      )}
                      {order.status !== 'cancelled' && (
                        <Tooltip title="Editar Pedido">
                          <IconButton
                            size="medium"
                            onClick={() => handleEditOrder(order)}
                            sx={{ 
                              color: '#8b5cf6',
                              width: 40,
                              height: 40,
                              '&:hover': { 
                                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                transform: 'scale(1.05)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <EditIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {order.status !== 'cancelled' && (
                        <Tooltip title="Cancelar Pedido">
                          <IconButton
                            size="medium"
                            onClick={() => handleCancelOrder(order)}
                            sx={{ 
                              color: '#ef4444',
                              width: 40,
                              height: 40,
                              '&:hover': { 
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                transform: 'scale(1.05)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <CancelIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleCloseViewOrders}
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
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar pedido */}
      <Dialog
        open={editOrderDialogOpen}
        onClose={handleCloseEditOrder}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.05)',
            height: { xs: '100vh', sm: '90vh' },
            width: { xs: '100%', sm: '90vw' },
            maxWidth: { xs: '100%', sm: '1200px' },
            margin: { xs: '0', sm: 'auto' },
            zIndex: 9999
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EditIcon sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Editar Pedido #{selectedOrderForEdit?.id}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Mesa {selectedTableForOrders?.name}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflow: 'auto' }}>
          {selectedOrderForEdit && selectedTableForOrders && (
            <OrderCreator
              tableId={selectedTableForOrders.id}
              tableName={selectedTableForOrders.name}
              orderId={selectedOrderForEdit.id}
              initialItems={selectedOrderForEdit.items}
              onOrderUpdated={handleOrderUpdated}
              onCloseRequest={() => handleCloseEditOrder()}
              onCancelOrder={() => {
                // Cancelar o pedido e fechar o modal
                if (selectedOrderForEdit) {
                  handleCancelOrder(selectedOrderForEdit);
                }
                handleCloseEditOrder();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar cancelamento de pedido */}
      <Dialog
        open={cancelOrderDialogOpen}
        onClose={handleCloseCancelOrder}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CancelIcon sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Cancelar Pedido
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, mt: 2 }}>
            Tem certeza que deseja cancelar o pedido #{selectedOrderForCancel?.id}?
          </Typography>
          
          {selectedOrderForCancel && (
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: 'rgba(239, 68, 68, 0.1)', 
              borderRadius: 2,
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Itens:</strong> {selectedOrderForCancel.total_items} | <strong>Total:</strong> R$ {selectedOrderForCancel.total_amount.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Criado por:</strong> {selectedOrderForCancel.created_by} | <strong>Data:</strong> {formatDate(selectedOrderForCancel.created_at)}
              </Typography>
            </Box>
          )}

          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta ação não pode ser desfeita.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleCloseCancelOrder}
            disabled={cancelingOrder}
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
            disabled={cancelingOrder}
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
              '&:disabled': {
                background: '#e5e7eb',
                color: '#9ca3af',
                boxShadow: 'none'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {cancelingOrder ? <CircularProgress size={16} /> : 'Confirmar Cancelamento'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de sucesso do cancelamento */}
      <Dialog
        open={cancelOrderSuccessDialogOpen}
        onClose={handleCloseCancelOrderSuccess}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircleIcon sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Pedido Cancelado com Sucesso!
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {canceledOrderInfo && (
            <>
              <Typography variant="h5" sx={{ 
                fontWeight: 700, 
                color: '#059669',
                textAlign: 'center',
                mb: 2,
                mt: 2,
                whiteSpace: 'nowrap'
              }}>
                ✅ Pedido #{canceledOrderInfo.order.id} da {canceledOrderInfo.tableName}
              </Typography>
              
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: 'rgba(16, 185, 129, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Itens cancelados:</strong> {canceledOrderInfo.order.total_items}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>Valor total:</strong> R$ {canceledOrderInfo.order.total_amount.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>Criado por:</strong> {canceledOrderInfo.order.created_by}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>Data de criação:</strong> {formatDate(canceledOrderInfo.order.created_at)}
                </Typography>
              </Box>

              <Alert severity="success" sx={{ mt: 2 }}>
                O pedido foi cancelado com sucesso.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleCloseCancelOrderSuccess}
            variant="contained"
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
              transition: 'all 0.2s ease'
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminTableList; 