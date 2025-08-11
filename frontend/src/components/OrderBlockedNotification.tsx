import React from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';
import { Block } from '@mui/icons-material';
import { useSystemStatus } from './SystemStatusProvider';

interface OrderBlockedNotificationProps {
  show: boolean;
}

const OrderBlockedNotification: React.FC<OrderBlockedNotificationProps> = ({ show }) => {
  const { systemStatus } = useSystemStatus();

  if (!show || !systemStatus || systemStatus.orders_enabled) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Alert 
        severity="error" 
        icon={<Block />}
        sx={{ 
          borderRadius: 2,
          background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
          border: '2px solid #f44336',
          boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
          '& .MuiAlert-icon': {
            color: '#d32f2f',
            fontSize: '1.5rem'
          },
          '& .MuiAlertTitle-root': {
            color: '#b71c1c',
            fontWeight: 700,
            fontSize: '1.1rem'
          },
          '& .MuiAlert-message': {
            color: '#c62828',
            fontWeight: 500,
            fontSize: '1rem',
            width: '100%'
          }
        }}
      >
        <AlertTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
          ⚠️ PEDIDOS BLOQUEADOS
        </AlertTitle>
        <Box sx={{ 
          color: '#c62828', 
          fontWeight: 500, 
          fontSize: '1rem',
          mt: 1
        }}>
          O sistema não está aceitando novos pedidos no momento.
          {systemStatus.reason && (
            <Box sx={{ 
              mt: 1, 
              p: 1.5, 
              bgcolor: 'rgba(244, 67, 54, 0.1)', 
              borderRadius: 1,
              border: '1px solid rgba(244, 67, 54, 0.3)'
            }}>
              <strong>Motivo:</strong> {systemStatus.reason}
            </Box>
          )}
        </Box>
      </Alert>
    </Box>
  );
};

export default OrderBlockedNotification; 