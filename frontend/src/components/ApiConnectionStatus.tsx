import React, { useState, useEffect } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import SignalCellular4BarIcon from '@mui/icons-material/SignalCellular4Bar';
import SignalCellularConnectedNoInternet4BarIcon from '@mui/icons-material/SignalCellularConnectedNoInternet4Bar';
import SignalCellular0BarIcon from '@mui/icons-material/SignalCellular0Bar';
import { api } from '../config/api';

const ApiConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkConnection = async () => {
    try {
      setIsLoading(true);
      // Tentar fazer uma requisição para o endpoint de health
      await api.get('/health');
      setIsConnected(true);
    } catch (error) {
      console.log('❌ API Connection Status: Erro na conexão com a API:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Verificar conexão imediatamente
    checkConnection();

    // Configurar intervalo de 5 segundos
    const interval = setInterval(checkConnection, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const getStatusIcon = () => {
    if (isConnected === null) {
      return <SignalCellular0BarIcon sx={{ color: '#9ca3af' }} />;
    }

    if (isConnected) {
      return <SignalCellular4BarIcon sx={{ color: '#10b981' }} />;
    }

    return <SignalCellularConnectedNoInternet4BarIcon sx={{ color: '#ef4444' }} />;
  };

  const getStatusText = () => {
    if (isConnected === null) {
      return 'Status desconhecido';
    }

    if (isConnected) {
      return 'API Conectada';
    }

    return 'Sem conexão com a API';
  };

  return (
    <Tooltip title={getStatusText()} arrow>
      <IconButton
        color="inherit"
        sx={{
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.1)'
          }
        }}
      >
        {getStatusIcon()}
      </IconButton>
    </Tooltip>
  );
};

export default ApiConnectionStatus; 