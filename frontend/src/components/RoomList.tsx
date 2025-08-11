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
  IconButton, 
  Chip, 
  Alert, 
  CircularProgress, 
  Snackbar,
  Avatar,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { getRooms, createRoom, updateRoom, deleteRoom, getRoomConsumptionReport, printRoomConsumptionReport, getRoomTables } from '../config/api';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HotelIcon from '@mui/icons-material/Hotel';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PrintIcon from '@mui/icons-material/Print';
import ConfirmDialog from './ConfirmDialog';

interface Room {
  id: number;
  number: string;
  status?: string;
  guest_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface ConsumptionReport {
  room_id: number;
  room_number: string;
  guest_name?: string;
  date: string;
  total_tables: number;
  total_orders: number;
  total_items: number;
  total_revenue: number;
  total_revenue_with_tax: number;
  total_service_tax: number;
  average_order_value: number;
  orders_by_status: {
    [key: string]: number;
  };
  payment_methods_summary: {
    [key: string]: number;
  };
  products_consumption: Array<{
    product_name: string;
    quantity: number;
    total_revenue: number;
  }>;
  tables_consumption: Array<{
    table_name: string;
    orders_count: number;
    total_revenue: number;
    orders: Array<{
      id: number;
      status: string;
      total_amount: number;
      created_at: string;
      items: Array<{
        product_name: string;
        quantity: number;
        unit_price: number;
      }>;
    }>;
  }>;
}

const RoomList = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    number: '',
    guest_name: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
  
  // Estados para relatório de consumo
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedRoomForReport, setSelectedRoomForReport] = useState<Room | null>(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [consumptionReport, setConsumptionReport] = useState<ConsumptionReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [printingReport, setPrintingReport] = useState(false);
  const [printButtonDisabled, setPrintButtonDisabled] = useState(false);
  const [roomTables, setRoomTables] = useState<any[]>([]);
  const [dateChangeLoading, setDateChangeLoading] = useState(false);
  const [confirmPrintOpen, setConfirmPrintOpen] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  // Detectar mudanças na data e recarregar relatório
  useEffect(() => {
    if (selectedRoomForReport && reportDate) {
      setDateChangeLoading(true);
      const timer = setTimeout(() => {
        handleGenerateReport(selectedRoomForReport, reportDate);
      }, 300); // Pequeno delay para evitar muitas chamadas
      
      return () => clearTimeout(timer);
    }
  }, [reportDate]);

  const loadRooms = async () => {
    try {
    setLoading(true);
      const roomsData = await getRooms();
      setRooms(roomsData);
    } catch (error) {
      console.error('Erro ao carregar quartos:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar quartos',
        severity: 'error'
      });
    } finally {
        setLoading(false);
    }
  };

  const handleOpenDialog = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        number: room.number,
        guest_name: room.guest_name || ''
      });
    } else {
      setEditingRoom(null);
      setFormData({
        number: '',
        guest_name: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRoom(null);
    setFormData({
      number: '',
      guest_name: ''
    });
  };

  const handleSubmit = async () => {
    if (!formData.number.trim()) {
      setSnackbar({
        open: true,
        message: 'Número do quarto é obrigatório',
        severity: 'error'
      });
      return;
    }

    // Verificação de número duplicado (case-insensitive)
    const exists = rooms.some(
      r => r.number.trim().toLowerCase() === formData.number.trim().toLowerCase() && 
           (!editingRoom || r.id !== editingRoom.id)
    );
    if (exists) {
      setSnackbar({
        open: true,
        message: 'Já existe um quarto com esse número. Escolha outro número.',
        severity: 'error'
      });
      return;
    }

    setCreatingRoom(true);
    try {
      const roomData = {
        number: formData.number.trim(),
        guest_name: formData.guest_name.trim() || undefined
      };

      if (editingRoom) {
        // Atualizar quarto existente
        await updateRoom(editingRoom.id, roomData);
        setSnackbar({
          open: true,
          message: 'Quarto atualizado com sucesso',
          severity: 'success'
        });
      } else {
        // Criar novo quarto
        const newRoom = await createRoom(roomData);
        setRooms(prev => [...prev, newRoom]);
        setSnackbar({
          open: true,
          message: `Quarto "${newRoom.number}" criado com sucesso!`,
          severity: 'success'
        });
      }

      handleCloseDialog();
      loadRooms();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: editingRoom ? 'Erro ao atualizar quarto' : 'Erro ao criar quarto',
        severity: 'error'
      });
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    try {
      await deleteRoom(roomId);
      setSnackbar({
        open: true,
        message: 'Quarto excluído com sucesso',
        severity: 'success'
      });
      loadRooms();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao excluir quarto',
        severity: 'error'
      });
    }
  };

  const handleOpenDeleteDialog = (room: Room) => {
    setRoomToDelete(room);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteConfirmOpen(false);
    setRoomToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (roomToDelete) {
      await handleDeleteRoom(roomToDelete.id);
      handleCloseDeleteDialog();
    }
  };

  // Funções para relatório de consumo
  const handleOpenReportDialog = (room: Room) => {
    // Primeiro definir todos os estados
    setSelectedRoomForReport(room);
    setReportDate(new Date().toISOString().split('T')[0]);
    setConsumptionReport(null);
    setLoadingReport(true);
    setReportDialogOpen(true);
    
    // Carregar relatório do dia atual automaticamente
    setTimeout(() => {
      handleGenerateReport(room, new Date().toISOString().split('T')[0]);
    }, 500);
  };

  const handleCloseReportDialog = () => {
    setReportDialogOpen(false);
    setSelectedRoomForReport(null);
    setConsumptionReport(null);
  };

  const handleGenerateReport = async (room?: Room, date?: string) => {
    // Usar parâmetros passados ou estados atuais
    const targetRoom = room || selectedRoomForReport;
    const targetDate = date || reportDate;
    
    if (!targetRoom) {
      return;
    }
    
    // Verificar se o usuário está logado
    const token = localStorage.getItem('token');
    if (!token) {
      setSnackbar({
        open: true,
        message: 'Usuário não está logado',
        severity: 'error'
      });
      return;
    }
    
    // Buscar mesas do quarto para verificar se há mesas abertas
    try {
      const tables = await getRoomTables(targetRoom.id);
      setRoomTables(tables);
      console.log('📋 === MESAS DO QUARTO ===');
      console.log('   - Mesas encontradas:', tables.length);
      console.log('   - Mesas abertas:', tables.filter((table: any) => !table.is_closed).length);
      console.log('   - Mesas fechadas:', tables.filter((table: any) => table.is_closed).length);
      console.log('   - Detalhes das mesas:');
      tables.forEach((table: any, index: number) => {
        console.log(`     Mesa ${index + 1}: ID=${table.id}, Nome=${table.name}, Fechada=${table.is_closed}, Criada=${table.created_at}`);
      });
    } catch (error) {
      console.error('❌ Erro ao buscar mesas do quarto:', error);
      setRoomTables([]);
    }
    
    console.log('🚀 === INICIANDO GERAÇÃO DE RELATÓRIO ===');
    console.log('📋 Parâmetros da requisição:');
    console.log('   - Room ID:', targetRoom.id);
    console.log('   - Room Number:', targetRoom.number);
    console.log('   - Date:', targetDate);
    console.log('   - Token presente:', !!token);
    console.log('   - Token (primeiros 20 chars):', token ? token.substring(0, 20) + '...' : 'N/A');
    
    // Só ativar loadingReport se não estiver em mudança de data
    if (!dateChangeLoading) {
      setLoadingReport(true);
    }
    setDateChangeLoading(true);
    
    try {
      console.log('📡 === FAZENDO CHAMADA PARA API ===');
      console.log('   - URL: GET /rooms/' + targetRoom.id + '/consumption-report');
      console.log('   - Query params: { date: "' + targetDate + '", include_all_tables: true }');
      
      const report = await getRoomConsumptionReport(
        targetRoom.id, 
        targetDate,
        true // Incluir todas as mesas, mesmo sem pedidos
      );
      
      console.log('✅ === RESPOSTA DA API RECEBIDA ===');
      console.log('   - Status: Sucesso');
      console.log('   - Tipo de resposta:', typeof report);
      console.log('   - É objeto:', typeof report === 'object');
      console.log('   - Resposta completa:', JSON.stringify(report, null, 2));
      
      // Verificar se a resposta tem a estrutura esperada
      if (!report || typeof report !== 'object') {
        console.error('❌ Resposta inválida da API - não é objeto');
        throw new Error('Resposta inválida da API');
      }
      
      // Verificar se tem os campos obrigatórios
      if (!report.room_id || !report.date) {
        console.error('❌ Estrutura do relatório inválida - campos obrigatórios ausentes');
        console.log('   - room_id presente:', !!report.room_id);
        console.log('   - date presente:', !!report.date);
        console.log('   - Campos disponíveis:', Object.keys(report));
        throw new Error('Estrutura do relatório inválida');
      }
      
      console.log('✅ === VALIDAÇÃO PASSOU ===');
      console.log('   - room_id:', report.room_id);
      console.log('   - room_number:', report.room_number);
      console.log('   - date:', report.date);
      console.log('   - total_orders:', report.total_orders);
      console.log('   - total_tables:', report.total_tables);
      console.log('   - total_revenue_with_tax:', report.total_revenue_with_tax);
      
      // Comparar dados do relatório com mesas do quarto
      console.log('🔍 === COMPARAÇÃO DE DADOS ===');
      console.log('   - Mesas no quarto (via /tables):', roomTables.length);
      console.log('   - Mesas no relatório (via /consumption-report):', report.total_tables);
      console.log('   - Diferença:', roomTables.length - report.total_tables);
      
      if (report.tables_consumption && report.tables_consumption.length > 0) {
        console.log('   - Mesas no relatório:');
        report.tables_consumption.forEach((table: any, index: number) => {
          console.log(`     Mesa ${index + 1}: ${table.table_name}, Pedidos=${table.orders_count}, Receita=${table.total_revenue}`);
        });
      } else {
        console.log('   - Nenhuma mesa encontrada no relatório');
      }
      
      setConsumptionReport(report);
      console.log('✅ === RELATÓRIO DEFINIDO NO ESTADO ===');
      
    } catch (error) {
      console.error('❌ === ERRO NA GERAÇÃO DO RELATÓRIO ===');
      console.error('   - Tipo de erro:', typeof error);
      console.error('   - Mensagem:', error instanceof Error ? error.message : 'Erro desconhecido');
      console.error('   - Erro completo:', error);
      
      let errorMessage = 'Erro desconhecido';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // @ts-ignore
        errorMessage = error.response?.data?.detail || error.message || 'Erro na API';
      }
      
      setSnackbar({
        open: true,
        message: `Erro ao gerar relatório de consumo: ${errorMessage}`,
        severity: 'error'
      });
    } finally {
      // Desativar loadings
      setLoadingReport(false);
      setDateChangeLoading(false);
      console.log('🏁 === GERAÇÃO DE RELATÓRIO FINALIZADA ===');
    }
  };

  const doActualPrint = async () => {
    if (!selectedRoomForReport || !consumptionReport) return;
    setPrintingReport(true);
    try {
      await printRoomConsumptionReport(
        selectedRoomForReport.id, 
        reportDate
      );
      setSnackbar({
        open: true,
        message: 'Relatório enviado para impressão',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao imprimir relatório',
        severity: 'error'
      });
    } finally {
      setPrintingReport(false);
      // Reabilitar botão após 3 segundos
      setTimeout(() => {
        setPrintButtonDisabled(false);
      }, 3000);
    }
  };

  const handlePrintReport = async () => {
    if (!selectedRoomForReport || !consumptionReport) return;
    
        // Desabilitar botão imediatamente para evitar duplo clique
    setPrintButtonDisabled(true);
    
    // Verificar se há mesas em aberto
    const activeTables = roomTables.filter((table: any) => !table.is_closed);
    if (activeTables.length > 0) {
      setConfirmPrintOpen(true);
      return;
    }
    await doActualPrint();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'occupied': return 'error';
      case 'maintenance': return 'warning';
      case 'reserved': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'occupied': return 'Ocupado';
      case 'maintenance': return 'Manutenção';
      case 'reserved': return 'Reservado';
      default: return status;
    }
  };



  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} sx={{ color: '#667eea' }} />
      </Box>
    );
  }

  return (
    <Box>
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
            Quartos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie todos os quartos do estabelecimento
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 3,
              px: 4,
              py: 1.5,
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Novo Quarto
          </Button>
        </Box>
      </Box>

      {/* Error state */}
      {error && (
        <Box sx={{ px: { xs: 1, sm: 2 }, mb: 3 }}>
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

      {/* Conteúdo principal */}
      {!loading && (
        <>
          {rooms.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 8,
              backgroundColor: 'rgba(139, 92, 246, 0.05)',
              borderRadius: 3,
              border: '2px dashed rgba(139, 92, 246, 0.3)'
            }}>
              <Typography variant="h6" sx={{ color: '#8b5cf6', mb: 2 }}>
                Nenhum quarto cadastrado
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comece criando o primeiro quarto
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
          {rooms.map((room) => (
                <Box key={room.id}>
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
                              bgcolor: room.status === 'available' ? '#10b981' : 
                                       room.status === 'occupied' ? '#ef4444' : 
                                       room.status === 'maintenance' ? '#f59e0b' : '#667eea',
                              width: 40,
                              height: 40
                            }}
                          >
                            <HotelIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                              Quarto {room.number}
                            </Typography>
                            <Chip
                              label={getStatusLabel(room.status || 'available')}
                              color={getStatusColor(room.status || 'available') as any}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        {room.guest_name && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <PersonIcon sx={{ fontSize: 16, color: '#64748b' }} />
                            <Typography variant="body2" color="text.secondary">
                              {room.guest_name}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Box sx={{ 
                        display: 'flex', 
                        gap: 2, 
                        mt: 'auto', 
                        justifyContent: 'center',
                        pt: 2,
                        borderTop: '1px solid rgba(0,0,0,0.08)'
                      }}>
                        <Tooltip title="Relatório de Consumo">
                          <IconButton
                            size="medium"
                            onClick={() => handleOpenReportDialog(room)}
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
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <AssessmentIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Editar quarto">
                          <IconButton
                            size="medium"
                            onClick={() => handleOpenDialog(room)}
                            sx={{ 
                              color: '#667eea',
                              border: '2px solid rgba(102, 126, 234, 0.2)',
                              backgroundColor: 'rgba(102, 126, 234, 0.05)',
                              width: 48,
                              height: 48,
                              '&:hover': { 
                                backgroundColor: 'rgba(102, 126, 234, 0.15)',
                                border: '2px solid rgba(102, 126, 234, 0.4)',
                                transform: 'scale(1.05)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <EditIcon sx={{ fontSize: 20, m: 1 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Excluir quarto">
                          <IconButton
                            size="medium"
                            onClick={() => handleOpenDeleteDialog(room)}
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
              ))}
            </Box>
          )}
        </>
      )}

      {/* Dialog para criar/editar quarto */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          {editingRoom ? 'Editar Quarto' : 'Novo Quarto'}
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label="Número do Quarto"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              fullWidth
              required
              placeholder="Ex: 101, 202, etc."
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



            <TextField
              label="Nome do Hóspede (opcional)"
              value={formData.guest_name}
              onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
              fullWidth
              placeholder="Nome do hóspede atual"
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
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleCloseDialog} 
            disabled={creatingRoom}
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
            onClick={handleSubmit} 
            variant="contained" 
            disabled={creatingRoom || !formData.number.trim()}
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
            {editingRoom ? 'Atualizar' : creatingRoom ? 'Criando...' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação para excluir quarto */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteDialog}
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
              Excluir Quarto
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 500, color: '#1e293b', mt: 2 }}>
              Tem certeza que deseja excluir o quarto "{roomToDelete?.number}"?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              p: 2,
              borderRadius: 2,
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              ⚠️ Esta ação não pode ser desfeita. Todos os dados do quarto serão perdidos permanentemente.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleCloseDeleteDialog}
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
            onClick={handleConfirmDelete} 
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
            Excluir Quarto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para relatório de consumo */}
      <Dialog
        open={reportDialogOpen}
        onClose={handleCloseReportDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.05)',
            maxHeight: '90vh'
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
              Extrato da Conta do Quarto - Quarto {selectedRoomForReport?.number}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
              {selectedRoomForReport?.guest_name && `Hóspede: ${selectedRoomForReport.guest_name}`}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Filtros */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2, mt: 2}}>
              {/* Filtro de data */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="Data do Relatório"
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  sx={{
                    minWidth: 200,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#f59e0b'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#f59e0b'
                      }
                    }
                  }}
                />
                
                {/* Indicador de loading para mudança de data */}
                {dateChangeLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} sx={{ color: '#f59e0b' }} />
                    <Typography variant="caption" color="text.secondary">
                      Atualizando...
                    </Typography>
                  </Box>
                )}
              </Box>
              


              {loadingReport && !dateChangeLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} sx={{ color: '#f59e0b' }} />
                  <Typography variant="body2" color="text.secondary">
                    Carregando...
                  </Typography>
                </Box>
              )}
              {!loadingReport && !dateChangeLoading && !consumptionReport && (
                <Button
                  variant="outlined"
                  onClick={() => handleGenerateReport()}
                  sx={{
                    borderColor: '#f59e0b',
                    color: '#f59e0b',
                    '&:hover': {
                      borderColor: '#d97706',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)'
                    }
                  }}
                >
                  Tentar Novamente
                </Button>
              )}
            </Box>

            {/* Conteúdo do relatório */}
            {consumptionReport && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Resumo geral */}
                <Card sx={{ p: 3, background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#d97706', mb: 2 }}>
                    Extrato da Conta do Quarto - Quarto {consumptionReport.room_number}
                  </Typography>
                  
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Relatório de pedidos pagos com "conta do quarto" de mesas fechadas
                  </Typography>
                  
                  {/* Aviso sobre mesas em aberto */}
                  {roomTables.length > 0 && roomTables.filter((table: any) => !table.is_closed).length > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          ⚠️ <strong>Atenção:</strong> Existem {roomTables.filter((table: any) => !table.is_closed).length} mesa(s) ainda em aberto vinculadas ao quarto. 
                          É possível que novos pedidos sejam adicionados antes do fechamento, alterando o extrato.
                        </Typography>
                        
                        {/* Lista das mesas abertas */}
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Mesas abertas:
                          </Typography>
                          {roomTables.filter((table: any) => !table.is_closed).map((table: any) => (
                            <Box key={table.id} sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1,
                              p: 0.5,
                              background: 'rgba(245, 158, 11, 0.1)',
                              borderRadius: 1,
                              mb: 0.5
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#d97706' }}>
                                Mesa {table.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                (Aberta em {new Date(table.created_at).toLocaleString('pt-BR')})
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </Alert>
                  )}
                  
                  
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                    <Box sx={{ textAlign: 'center', p: 2, background: 'white', borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                        {consumptionReport.total_orders}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total de Pedidos
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', p: 2, background: 'white', borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                        {consumptionReport.total_items}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Itens Consumidos
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', p: 2, background: 'white', borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>
                        {formatCurrency(consumptionReport.total_revenue_with_tax)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Valor Total
                      </Typography>
                    </Box>
                  </Box>
                </Card>

                {/* Lista de Todos os Pedidos */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Todos os Pedidos
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {consumptionReport.tables_consumption && consumptionReport.tables_consumption.map((table, tableIndex) => (
                      table.orders && table.orders.map((order, orderIndex) => (
                        <Box key={`${tableIndex}-${orderIndex}`} sx={{ 
                          p: 2,
                          border: '1px solid rgba(0,0,0,0.1)',
                          borderRadius: 2,
                          background: 'white'
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                Mesa {table.table_name} - Pedido #{order.id}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(order.created_at).toLocaleString('pt-BR')}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>

                              <Typography variant="body1" sx={{ fontWeight: 700, color: '#10b981' }}>
                                {formatCurrency(order.total_amount)}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {/* Itens do pedido */}
                          {order.items && order.items.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Itens:
                              </Typography>
                              {order.items.map((item, itemIndex) => (
                                <Box key={itemIndex} sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  py: 0.5,
                                  px: 1,
                                  background: 'rgba(0,0,0,0.02)',
                                  borderRadius: 1,
                                  mb: 0.5
                                }}>
                                  <Typography variant="body2">
                                    {item.quantity}x {item.product_name}
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {formatCurrency(item.unit_price * item.quantity)}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Box>
                      ))
                    ))}
                  </Box>
                </Card>

                {/* Resumo Final */}
                <Card sx={{ p: 3, background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#059669' }}>
                    Resumo Final
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Total de Pedidos: {consumptionReport.total_orders}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Data: {new Date(consumptionReport.date).toLocaleDateString('pt-BR')}
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#059669' }}>
                      {formatCurrency(consumptionReport.total_revenue_with_tax)}
                    </Typography>
                  </Box>
                </Card>
              </Box>
            )}

            {/* Estado vazio ou loading */}
            {!consumptionReport && (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                borderRadius: 3,
                border: '2px dashed rgba(245, 158, 11, 0.3)'
              }}>
                              {loadingReport ? (
                <>
                  <CircularProgress size={60} sx={{ color: '#f59e0b', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#d97706', mb: 2 }}>
                    Carregando relatório...
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Buscando dados de consumo do dia atual
                  </Typography>
                </>
              ) : (
                <>
                  <AssessmentIcon sx={{ fontSize: 60, color: '#f59e0b', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#d97706', mb: 2 }}>
                    Nenhum consumo encontrado
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Não há dados de consumo para esta data
                  </Typography>
                </>
              )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleCloseReportDialog}
            disabled={loadingReport || printingReport}
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
          {consumptionReport && (
            <Button 
              onClick={handlePrintReport} 
              variant="contained" 
              disabled={printingReport || printButtonDisabled}
              startIcon={printingReport ? <CircularProgress size={20} /> : <PrintIcon />}
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
                '&:disabled': {
                  background: '#e5e7eb',
                  color: '#9ca3af'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {printingReport ? 'Imprimindo...' : printButtonDisabled ? 'Aguarde...' : 'Imprimir Extrato'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmPrintOpen}
        onClose={() => { setConfirmPrintOpen(false); setPrintButtonDisabled(false); }}
        onConfirm={async () => { setConfirmPrintOpen(false); await doActualPrint(); }}
        title="Imprimir relatório com mesas abertas?"
        description={<>
          Existem {roomTables.filter((t: any) => !t.is_closed).length} mesa(s) abertas. O extrato pode mudar. Deseja imprimir mesmo assim?
        </>}
        confirmText="Imprimir mesmo assim"
        variant="warning"
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
    </Box>
  );
};

export default RoomList; 