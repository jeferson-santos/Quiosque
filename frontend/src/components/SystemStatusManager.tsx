import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import { Settings, PowerSettingsNew, Info } from '@mui/icons-material';
import { useSystemStatus } from './SystemStatusProvider';

const SystemStatusManager: React.FC = () => {
  const { systemStatus, loading, updateStatus } = useSystemStatus();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<{
    ordersEnabled: boolean;
    reason: string;
  }>({
    ordersEnabled: true,
    reason: ''
  });
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    if (systemStatus) {
      setPendingStatus({
        ordersEnabled: systemStatus.orders_enabled,
        reason: systemStatus.reason || ''
      });
    }
    setError(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const handleConfirm = () => {
    setConfirmOpen(true);
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
  };

  const handleSave = async () => {
    try {
      setUpdating(true);
      setError(null);
      await updateStatus(pendingStatus.ordersEnabled, pendingStatus.reason || undefined);
      setConfirmOpen(false);
      setOpen(false);
    } catch (err) {
      setError('Erro ao atualizar status do sistema');
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !systemStatus) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  const currentStatus = systemStatus.orders_enabled ? 'Aceitando Pedidos' : 'Pedidos Bloqueados';
  const newStatus = pendingStatus.ordersEnabled ? 'Aceitando Pedidos' : 'Pedidos Bloqueados';
  const isStatusChanging = systemStatus.orders_enabled !== pendingStatus.ordersEnabled;
  
  // Verifica se está desligando o sistema (mudando de true para false)
  const isDisabling = systemStatus.orders_enabled && !pendingStatus.ordersEnabled;
  
  // Verifica se o motivo é obrigatório (apenas quando está desligando)
  const isReasonRequired = isDisabling;
  
  // Verifica se pode salvar (motivo obrigatório apenas quando desligando)
  const canSave = isStatusChanging ? (isDisabling ? pendingStatus.reason.trim() !== '' : true) : pendingStatus.reason.trim() !== '';

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header da página */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 700, 
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 1
        }}>
          <Settings sx={{ fontSize: 32, color: '#2196f3' }} />
          Configuração do Sistema
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gerencie o status de aceitação de pedidos e configurações do sistema
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        {/* Status atual */}
        <Box>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Info sx={{ color: '#2196f3', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Status Atual
                </Typography>
              </Box>
              
              <Box sx={{ 
                p: 3, 
                bgcolor: systemStatus.orders_enabled ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                borderRadius: 2,
                border: `2px solid ${systemStatus.orders_enabled ? '#4caf50' : '#f44336'}`,
                textAlign: 'center'
              }}>
                <Typography variant="h5" sx={{ 
                  fontWeight: 700,
                  color: systemStatus.orders_enabled ? '#4caf50' : '#f44336',
                  mb: 1
                }}>
                  {currentStatus}
                </Typography>
                {systemStatus.reason && (
                  <Typography variant="body2" color="text.secondary">
                    Motivo: {systemStatus.reason}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Controles */}
        <Box>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PowerSettingsNew sx={{ color: '#2196f3', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Controles do Sistema
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={systemStatus.orders_enabled}
                      onChange={() => handleOpen()}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#4caf50',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: 'rgba(76, 175, 80, 0.5)'
                        }
                      }}
                    />
                  }
                  label={systemStatus.orders_enabled ? 'Aceitando pedidos' : 'Pedidos bloqueados'}
                />
              </Box>

              <TextField
                label="Motivo (opcional)"
                value={pendingStatus.reason}
                onChange={(e) => setPendingStatus(prev => ({ ...prev, reason: e.target.value }))}
                fullWidth
                multiline
                rows={3}
                placeholder="Ex: Manutenção no sistema, fechamento temporário, etc."
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => handleOpen()}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
                    }
                  }}
                >
                  Atualizar Status
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Dialog de configuração */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0',
          pb: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            ⚙️ Configuração do Sistema
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Gerencie o status de aceitação de pedidos
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 2 }}>
              Status atual: <strong style={{ color: systemStatus.orders_enabled ? '#4caf50' : '#f44336' }}>
                {currentStatus}
              </strong>
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={pendingStatus.ordersEnabled}
                  onChange={(e) => setPendingStatus(prev => ({
                    ...prev,
                    ordersEnabled: e.target.checked
                  }))}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#4caf50',
                      '&:hover': {
                        backgroundColor: 'rgba(76, 175, 80, 0.08)'
                      }
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#4caf50'
                    }
                  }}
                />
              }
              label={
                <Typography sx={{ fontWeight: 600, color: '#333' }}>
                  Aceitar novos pedidos
                </Typography>
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label={isReasonRequired ? "Motivo (obrigatório)" : "Motivo (opcional)"}
              value={pendingStatus.reason}
              onChange={(e) => setPendingStatus(prev => ({
                ...prev,
                reason: e.target.value
              }))}
              placeholder={isReasonRequired ? "Ex: Manutenção programada, Fim de expediente..." : "Ex: Manutenção programada, Fim de expediente..."}
              multiline
              rows={3}
              required={isReasonRequired}
              error={isReasonRequired && pendingStatus.reason.trim() === ''}
              helperText={
                isReasonRequired 
                  ? "Motivo obrigatório para desligar o sistema" 
                  : "Informe um motivo para a mudança de status (recomendado)"
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2196f3'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2196f3',
                    borderWidth: 2
                  },
                  '&.Mui-error .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#f44336'
                  }
                }
              }}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleClose}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              color: '#64748b',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: 'rgba(100, 116, 139, 0.1)'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            variant="contained"
            disabled={!canSave}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(33, 150, 243, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)'
              },
              '&:disabled': {
                background: '#e5e7eb',
                color: '#9ca3af',
                boxShadow: 'none'
              }
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação */}
      <Dialog open={confirmOpen} onClose={handleConfirmClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          background: isStatusChanging 
            ? (pendingStatus.ordersEnabled 
                ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)'
                : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)')
            : 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0',
          pb: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {isStatusChanging ? '⚠️ Confirmar Mudança de Status' : '📝 Atualizar Motivo'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {isStatusChanging 
              ? 'Confirme a alteração do status do sistema'
              : 'Atualize apenas o motivo do status atual'
            }
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, mt: 2 }}>
            {isStatusChanging 
              ? 'Você está prestes a alterar o status do sistema de:'
              : 'Você está atualizando o motivo do status atual:'
            }
          </Typography>
          
          {isStatusChanging && (
            <Typography variant="h6" color="primary" sx={{ mb: 1, fontWeight: 700 }}>
              {currentStatus} → {newStatus}
            </Typography>
          )}
          
          {pendingStatus.reason && (
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: 'rgba(33, 150, 243, 0.1)', 
              borderRadius: 2,
              border: '1px solid rgba(33, 150, 243, 0.3)'
            }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Motivo:</strong> {pendingStatus.reason}
              </Typography>
            </Box>
          )}

          <Alert severity="warning" sx={{ mt: 2 }}>
            {isStatusChanging 
              ? (pendingStatus.ordersEnabled 
                  ? 'O sistema voltará a aceitar novos pedidos.'
                  : 'O sistema não aceitará novos pedidos até ser reativado. Motivo obrigatório para desligar.')
              : 'Apenas o motivo será atualizado, o status permanecerá o mesmo.'
            }
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleConfirmClose} 
            disabled={updating}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              color: '#64748b',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: 'rgba(100, 116, 139, 0.1)'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            variant="contained"
            disabled={updating}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 600,
              background: isStatusChanging 
                ? (pendingStatus.ordersEnabled 
                    ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)'
                    : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)')
                : 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
              boxShadow: isStatusChanging 
                ? (pendingStatus.ordersEnabled 
                    ? '0 4px 14px rgba(76, 175, 80, 0.4)'
                    : '0 4px 14px rgba(244, 67, 54, 0.4)')
                : '0 4px 14px rgba(33, 150, 243, 0.4)',
              '&:hover': {
                background: isStatusChanging 
                  ? (pendingStatus.ordersEnabled 
                      ? 'linear-gradient(135deg, #45a049 0%, #388e3c 100%)'
                      : 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)')
                  : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                boxShadow: isStatusChanging 
                  ? (pendingStatus.ordersEnabled 
                      ? '0 6px 20px rgba(76, 175, 80, 0.5)'
                      : '0 6px 20px rgba(244, 67, 54, 0.5)')
                  : '0 6px 20px rgba(33, 150, 243, 0.5)'
              }
            }}
          >
            {updating ? <CircularProgress size={16} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemStatusManager; 