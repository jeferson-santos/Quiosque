import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { getSystemStatus, updateSystemStatus } from '../config/api';
import type { SystemStatus } from '../types';

interface SystemStatusContextType {
  systemStatus: SystemStatus | null;
  loading: boolean;
  error: string | null;
  refreshStatus: () => Promise<void>;
  updateStatus: (ordersEnabled: boolean, reason?: string) => Promise<void>;
}

const SystemStatusContext = createContext<SystemStatusContextType | undefined>(undefined);

interface SystemStatusProviderProps {
  children: ReactNode;
}

export const SystemStatusProvider: React.FC<SystemStatusProviderProps> = ({ children }) => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    // Verificar se há token antes de fazer a requisição
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('🔒 SystemStatusProvider: Usuário não logado, pulando requisição de status');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔧 SystemStatusProvider: Buscando status do sistema...');
      const status = await getSystemStatus();
      console.log('✅ SystemStatusProvider: Status recebido:', status);
      setSystemStatus(status);
    } catch (err: any) {
      console.error('❌ SystemStatusProvider: Erro ao buscar status do sistema:', err);
      
      // Se for erro 401 (não autorizado), não mostrar erro pois pode ser normal
      if (err.response?.status === 401) {
        console.log('🔒 SystemStatusProvider: Usuário não autorizado, limpando status');
        setSystemStatus(null);
        setError(null);
      } else {
        setError('Erro ao carregar status do sistema');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    await fetchStatus();
  };

  const updateStatus = async (ordersEnabled: boolean, reason?: string) => {
    try {
      setLoading(true);
      setError(null);
      const updatedStatus = await updateSystemStatus({
        orders_enabled: ordersEnabled,
        reason: reason || undefined
      });
      setSystemStatus(updatedStatus);
    } catch (err) {
      console.error('Erro ao atualizar status do sistema:', err);
      setError('Erro ao atualizar status do sistema');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Só buscar status se houver token
    const token = localStorage.getItem('token');
    if (token) {
      fetchStatus();
    } else {
      console.log('🔒 SystemStatusProvider: Sem token, não buscando status inicial');
      setLoading(false);
    }
  }, []);

  const value: SystemStatusContextType = useMemo(() => ({
    systemStatus,
    loading,
    error,
    refreshStatus,
    updateStatus
  }), [systemStatus, loading, error]);

  return (
    <SystemStatusContext.Provider value={value}>
      {children}
    </SystemStatusContext.Provider>
  );
};

export const useSystemStatus = (): SystemStatusContextType => {
  const context = useContext(SystemStatusContext);
  if (context === undefined) {
    throw new Error('useSystemStatus deve ser usado dentro de um SystemStatusProvider');
  }
  return context;
}; 