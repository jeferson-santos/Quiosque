import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, CircularProgress, Zoom } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';

type ConfirmVariant = 'danger' | 'success' | 'warning' | 'info';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  variant?: ConfirmVariant;
  loading?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<ConfirmVariant, { headerGradient: string; icon: React.ReactNode; confirmGradient: string }> = {
  danger: {
    headerGradient: 'linear-gradient(135deg, #fda4af 0%, #ef4444 40%, #b91c1c 100%)',
    icon: <WarningAmberRoundedIcon sx={{ fontSize: 24 }} />,
    confirmGradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
  },
  success: {
    headerGradient: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
    icon: <CheckCircleRoundedIcon sx={{ fontSize: 24 }} />,
    confirmGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  warning: {
    headerGradient: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)',
    icon: <WarningAmberRoundedIcon sx={{ fontSize: 24 }} />,
    confirmGradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)'
  },
  info: {
    headerGradient: 'linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%)',
    icon: <InfoRoundedIcon sx={{ fontSize: 24 }} />,
    confirmGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
  }
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onClose,
  onConfirm,
  variant = 'danger',
  loading = false,
  children
}: ConfirmDialogProps) {
  const styles = variantStyles[variant];

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
          border: '1px solid rgba(0,0,0,0.05)'
        }
      }}
    >
      <DialogTitle
        sx={{
          background: styles.headerGradient,
          color: 'white',
          borderRadius: '12px 12px 0 0',
          pb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {styles.icon}
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
              {title}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Zoom in timeout={200}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {description && (
              <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.5, mt: 0.5 }}>
                {description}
              </Typography>
            )}
            {children}
          </Box>
        </Zoom>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            color: '#64748b',
            backgroundColor: 'rgba(100, 116, 139, 0.08)',
            '&:hover': { backgroundColor: 'rgba(100, 116, 139, 0.15)' }
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={loading}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            background: styles.confirmGradient,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            '&:hover': { filter: 'brightness(0.95)', transform: 'translateY(-1px)' }
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


