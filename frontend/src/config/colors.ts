// Configuração de cores centralizada
// Todas as cores do sistema são definidas aqui e podem ser configuradas via .env

export const colors = {
  // Cores principais (gradientes)
  primary: {
    start: import.meta.env.VITE_PRIMARY_COLOR_START || '#8b5cf6',
    end: import.meta.env.VITE_PRIMARY_COLOR_END || '#7c3aed',
    gradient: `linear-gradient(135deg, ${import.meta.env.VITE_PRIMARY_COLOR_START || '#8b5cf6'} 0%, ${import.meta.env.VITE_PRIMARY_COLOR_END || '#7c3aed'} 100%)`
  },
  
  secondary: {
    start: import.meta.env.VITE_SECONDARY_COLOR_START || '#10b981',
    end: import.meta.env.VITE_SECONDARY_COLOR_END || '#059669',
    gradient: `linear-gradient(135deg, ${import.meta.env.VITE_SECONDARY_COLOR_START || '#10b981'} 0%, ${import.meta.env.VITE_SECONDARY_COLOR_END || '#059669'} 100%)`
  },
  
  success: {
    start: import.meta.env.VITE_SUCCESS_COLOR_START || '#10b981',
    end: import.meta.env.VITE_SUCCESS_COLOR_END || '#059669',
    gradient: `linear-gradient(135deg, ${import.meta.env.VITE_SUCCESS_COLOR_START || '#10b981'} 0%, ${import.meta.env.VITE_SUCCESS_COLOR_END || '#059669'} 100%)`
  },
  
  warning: {
    start: import.meta.env.VITE_WARNING_COLOR_START || '#f59e0b',
    end: import.meta.env.VITE_WARNING_COLOR_END || '#d97706',
    gradient: `linear-gradient(135deg, ${import.meta.env.VITE_WARNING_COLOR_START || '#f59e0b'} 0%, ${import.meta.env.VITE_WARNING_COLOR_END || '#d97706'} 100%)`
  },
  
  error: {
    start: import.meta.env.VITE_ERROR_COLOR_START || '#ef4444',
    end: import.meta.env.VITE_ERROR_COLOR_END || '#dc2626',
    gradient: `linear-gradient(135deg, ${import.meta.env.VITE_ERROR_COLOR_START || '#ef4444'} 0%, ${import.meta.env.VITE_ERROR_COLOR_END || '#dc2626'} 100%)`
  },
  
  info: {
    start: import.meta.env.VITE_INFO_COLOR_START || '#3b82f6',
    end: import.meta.env.VITE_INFO_COLOR_END || '#2563eb',
    gradient: `linear-gradient(135deg, ${import.meta.env.VITE_INFO_COLOR_START || '#3b82f6'} 0%, ${import.meta.env.VITE_INFO_COLOR_END || '#2563eb'} 100%)`
  },

  // Cores específicas por funcionalidade
  newTable: {
    start: import.meta.env.VITE_NEW_TABLE_COLOR_START || '#667eea',
    end: import.meta.env.VITE_NEW_TABLE_COLOR_END || '#764ba2',
    gradient: `linear-gradient(135deg, ${import.meta.env.VITE_NEW_TABLE_COLOR_START || '#667eea'} 0%, ${import.meta.env.VITE_NEW_TABLE_COLOR_END || '#764ba2'} 100%)`
  },
  
  newOrder: {
    start: import.meta.env.VITE_NEW_ORDER_COLOR_START || '#10b981',
    end: import.meta.env.VITE_NEW_ORDER_COLOR_END || '#059669',
    gradient: `linear-gradient(135deg, ${import.meta.env.VITE_NEW_ORDER_COLOR_START || '#10b981'} 0%, ${import.meta.env.VITE_NEW_ORDER_COLOR_END || '#059669'} 100%)`
  },
  
  closeTable: {
    start: import.meta.env.VITE_CLOSE_TABLE_COLOR_START || '#f59e0b',
    end: import.meta.env.VITE_CLOSE_TABLE_COLOR_END || '#d97706',
    gradient: `linear-gradient(135deg, ${import.meta.env.VITE_CLOSE_TABLE_COLOR_START || '#f59e0b'} 0%, ${import.meta.env.VITE_CLOSE_TABLE_COLOR_END || '#d97706'} 100%)`
  },
  
  delete: {
    start: import.meta.env.VITE_DELETE_COLOR_START || '#ef4444',
    end: import.meta.env.VITE_DELETE_COLOR_END || '#dc2626',
    gradient: `linear-gradient(135deg, ${import.meta.env.VITE_DELETE_COLOR_START || '#ef4444'} 0%, ${import.meta.env.VITE_DELETE_COLOR_END || '#dc2626'} 100%)`
  },
  
  edit: {
    start: import.meta.env.VITE_EDIT_COLOR_START || '#3b82f6',
    end: import.meta.env.VITE_EDIT_COLOR_END || '#2563eb',
    gradient: `linear-gradient(135deg, ${import.meta.env.VITE_EDIT_COLOR_START || '#3b82f6'} 0%, ${import.meta.env.VITE_EDIT_COLOR_END || '#2563eb'} 100%)`
  },

  // Cores de fundo e texto
  background: {
    primary: import.meta.env.VITE_BACKGROUND_PRIMARY || '#ffffff',
    secondary: import.meta.env.VITE_BACKGROUND_SECONDARY || '#f8fafc'
  },
  
  text: {
    primary: import.meta.env.VITE_TEXT_PRIMARY || '#1e293b',
    secondary: import.meta.env.VITE_TEXT_SECONDARY || '#64748b'
  },
  
  border: import.meta.env.VITE_BORDER_COLOR || 'rgba(0,0,0,0.05)'
};

// Funções utilitárias para criar estilos consistentes
export const createButtonStyle = (colorType: keyof typeof colors, hover = true) => ({
  background: colors[colorType].gradient,
  color: 'white',
  fontWeight: 600,
  borderRadius: '8px',
  padding: '12px 24px',
  boxShadow: `0 4px 14px ${colors[colorType].start}40`,
  transition: 'all 0.2s ease',
  '&:hover': hover ? {
    background: `linear-gradient(135deg, ${colors[colorType].end} 0%, ${colors[colorType].start} 100%)`,
    boxShadow: `0 6px 20px ${colors[colorType].start}60`,
    transform: 'translateY(-1px)'
  } : {},
  '&:disabled': {
    background: '#e5e7eb',
    color: '#9ca3af',
    boxShadow: 'none',
    transform: 'none'
  }
});

export const createDialogStyle = (colorType: keyof typeof colors) => ({
  background: colors[colorType].gradient,
  color: 'white',
  borderRadius: '12px 12px 0 0',
  padding: '16px 24px'
});

export const createCardStyle = () => ({
  background: `linear-gradient(135deg, ${colors.background.primary} 0%, ${colors.background.secondary} 100%)`,
  border: `1px solid ${colors.border}`,
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    border: `1px solid ${colors.primary.start}30`
  }
}); 