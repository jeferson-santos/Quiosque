import React from 'react';
import { Box, Chip, Tooltip, CircularProgress } from '@mui/material';
import { CheckCircle, Cancel, Warning } from '@mui/icons-material';
import { useSystemStatus } from './SystemStatusProvider';

const SystemStatusIndicator: React.FC = () => {
  const { systemStatus, loading } = useSystemStatus();

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={16} />
        <span style={{ fontSize: '0.875rem' }}>Carregando...</span>
      </Box>
    );
  }

  if (!systemStatus) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Warning color="warning" fontSize="small" />
        <span style={{ fontSize: '0.875rem' }}>Status desconhecido</span>
      </Box>
    );
  }

  const isEnabled = systemStatus.orders_enabled;
  const statusText = isEnabled ? 'Aceitando Pedidos' : 'Pedidos Bloqueados';
  const statusColor = isEnabled ? 'success' : 'error' as const;
  const statusIcon = isEnabled ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />;

  return (
    <Tooltip 
      title={
        systemStatus.reason 
          ? `Motivo: ${systemStatus.reason}` 
          : isEnabled 
            ? 'Sistema aceitando novos pedidos' 
            : 'Sistema não aceita novos pedidos'
      }
      arrow
    >
      <Chip
        icon={statusIcon}
        label={statusText}
        color={statusColor}
        size="small"
        variant="filled"
        sx={{ 
          fontSize: '0.8rem',
          height: '28px',
          fontWeight: 600,
          boxShadow: isEnabled 
            ? '0 2px 8px rgba(76, 175, 80, 0.4)' 
            : '0 2px 8px rgba(244, 67, 54, 0.4)',
          '& .MuiChip-label': {
            fontSize: '0.8rem',
            fontWeight: 600,
            px: 1.5,
            color: 'white'
          },
          '& .MuiChip-icon': {
            color: 'white',
            fontSize: '1rem'
          },
          background: isEnabled 
            ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)'
            : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          border: isEnabled 
            ? '2px solid #2e7d32'
            : '2px solid #c62828',
          '&:hover': {
            background: isEnabled 
              ? 'linear-gradient(135deg, #45a049 0%, #388e3c 100%)'
              : 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
            transform: 'scale(1.05)',
            transition: 'all 0.2s ease'
          },
          transition: 'all 0.2s ease'
        }}
      />
    </Tooltip>
  );
};

export default SystemStatusIndicator; 