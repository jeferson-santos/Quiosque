import React from 'react';
import { Box, Typography } from '@mui/material';
import { Info } from '@mui/icons-material';
import { useSystemStatus } from './SystemStatusProvider';

const SystemStatusReason: React.FC = () => {
  const { systemStatus, loading } = useSystemStatus();

  // Não mostrar nada se está carregando ou se não há status
  if (loading || !systemStatus) {
    return null;
  }

  // Só mostrar se os pedidos estão bloqueados E há um motivo
  if (systemStatus.orders_enabled || !systemStatus.reason) {
    return null;
  }

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1,
      p: 1.5,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      borderRadius: 2,
      mt: 1
    }}>
      <Info sx={{ 
        color: '#ef4444', 
        fontSize: '1rem',
        mt: 0.1,
        flexShrink: 0
      }} />
      <Typography variant="caption" sx={{
        color: '#ef4444',
        fontWeight: 500,
        lineHeight: 1.4,
        wordBreak: 'break-word',
        overflowWrap: 'break-word'
      }}>
        {systemStatus.reason}
      </Typography>
    </Box>
  );
};

export default SystemStatusReason; 