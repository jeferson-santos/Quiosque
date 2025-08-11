import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ConfirmDialog from './ConfirmDialog';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import api from '../config/api';

interface PrintQueueItem {
  id: number;
  type: string;
  table_id: number;
  content: string;
  order_id?: number;
  printer?: string;
  fiscal: boolean;
  status: string;
  created_at: string;
  printed_at?: string;
  retry_count: number;
  error_message?: string;
}

const PrintQueuePanel = () => {
  const [printQueue, setPrintQueue] = useState<PrintQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PrintQueueItem | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    loadPrintQueue();
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadPrintQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPrintQueue = async () => {
    try {
      setLoading(true);
      const response = await api.get('/print-queue/all');
      setPrintQueue(response.data);
    } catch (error) {
      console.error('Erro ao carregar fila de impressão:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar fila de impressão',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPrinted = async (itemId: number) => {
    try {
      await api.put(`/print-queue/${itemId}/mark-printed`);
      setSnackbar({
        open: true,
        message: 'Item marcado como impresso',
        severity: 'success'
      });
      loadPrintQueue();
    } catch (error) {
      console.error('Erro ao marcar como impresso:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao marcar como impresso',
        severity: 'error'
      });
    }
  };

  const handleMarkAsError = async (itemId: number, errorMessage: string) => {
    try {
      await api.put(`/print-queue/${itemId}/mark-error`, null, {
        params: { error_message: errorMessage }
      });
      setSnackbar({
        open: true,
        message: 'Item marcado como erro',
        severity: 'success'
      });
      loadPrintQueue();
    } catch (error) {
      console.error('Erro ao marcar como erro:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao marcar como erro',
        severity: 'error'
      });
    }
  };

  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: number | null }>(
    { open: false, id: null }
  );
  const handleAskDeleteItem = (itemId: number) => setConfirmDelete({ open: true, id: itemId });
  const handleDeleteItem = async () => {
    if (!confirmDelete.id) return;
    try {
      await api.delete(`/print-queue/${confirmDelete.id}`);
      setSnackbar({ open: true, message: 'Item removido da fila', severity: 'success' });
      loadPrintQueue();
    } catch (error) {
      console.error('Erro ao remover item:', error);
      setSnackbar({ open: true, message: 'Erro ao remover item', severity: 'error' });
    } finally {
      setConfirmDelete({ open: false, id: null });
    }
  };

  const handleViewContent = (item: PrintQueueItem) => {
    setSelectedItem(item);
    setOpenDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'printed':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'printed':
        return 'Impresso';
      case 'error':
        return 'Erro';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'order':
        return 'Pedido';
      case 'receipt':
        return 'Comanda';
      case 'invoice':
        return 'Nota da Mesa';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Impressão
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={loadPrintQueue}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
            }
          }}
        >
          Atualizar
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Resumo da Fila
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                  {printQueue.filter(item => item.status === 'pending').length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Pendentes
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 600 }}>
                  {printQueue.filter(item => item.status === 'printed').length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Impressos
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#ef4444', fontWeight: 600 }}>
                  {printQueue.filter(item => item.status === 'error').length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Com Erro
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#8b5cf6', fontWeight: 600 }}>
                  {printQueue.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Mesa</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Criado em</TableCell>
              <TableCell>Tentativas</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {printQueue.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.id}</TableCell>
                <TableCell>
                  <Chip
                    label={getTypeLabel(item.type)}
                    size="small"
                    icon={<PrintIcon />}
                  />
                </TableCell>
                <TableCell>Mesa {item.table_id}</TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(item.status)}
                    color={getStatusColor(item.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(item.created_at)}</TableCell>
                <TableCell>
                  <Chip
                    label={item.retry_count}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Tooltip title="Ver conteúdo">
                      <IconButton
                        size="small"
                        onClick={() => handleViewContent(item)}
                        sx={{ color: '#8b5cf6' }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>

                    {item.status === 'pending' && (
                      <>
                        <Tooltip title="Marcar como impresso">
                          <IconButton
                            size="small"
                            onClick={() => handleMarkAsPrinted(item.id)}
                            sx={{ color: '#10b981' }}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Marcar como erro">
                          <IconButton
                            size="small"
                            onClick={() => handleMarkAsError(item.id, 'Erro manual')}
                            sx={{ color: '#ef4444' }}
                          >
                            <ErrorIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}

                    <Tooltip title="Excluir item">
                      <IconButton
                        size="small"
                        onClick={() => handleAskDeleteItem(item.id)}
                        sx={{ color: '#ef4444' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para visualizar conteúdo */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Conteúdo do Item de Impressão
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                <strong>ID:</strong> {selectedItem.id} | <strong>Tipo:</strong> {getTypeLabel(selectedItem.type)} | <strong>Mesa:</strong> {selectedItem.table_id}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={15}
                value={selectedItem.content}
                InputProps={{
                  readOnly: true,
                  style: { fontFamily: 'monospace', fontSize: '12px' }
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={handleDeleteItem}
        title="Excluir item"
        description={<>Remover este item da fila. A remoção é permanente.</>}
        confirmText="Excluir"
        variant="danger"
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

export default PrintQueuePanel; 