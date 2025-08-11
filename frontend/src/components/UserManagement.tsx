import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  IconButton,
  Chip,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { getUsers, createUser, updateUserPassword, updateUserRole, deleteUser } from '../config/api';
import ConfirmDialog from './ConfirmDialog';

interface User {
  id: number;
  username: string;
  role: 'waiter' | 'administrator';
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingUser, setCreatingUser] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'waiter' as 'waiter' | 'administrator'
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = () => {
    // Buscar dados do usuário logado do localStorage
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decodificar o token JWT para obter informações do usuário
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser({
          username: payload.sub || payload.username,
          role: payload.role || 'waiter'
        });
      } catch (error) {
        console.error('Erro ao decodificar token:', error);
      }
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar usuários',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        role: 'waiter'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      role: 'waiter'
    });
  };

  const handleSubmit = async () => {
    if (!formData.username.trim()) {
      setSnackbar({
        open: true,
        message: 'Nome de usuário é obrigatório',
        severity: 'error'
      });
      return;
    }

    // Validação de username: mínimo 4 caracteres
    if (formData.username.trim().length < 4) {
      setSnackbar({
        open: true,
        message: 'Nome de usuário deve ter pelo menos 4 caracteres',
        severity: 'error'
      });
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      setSnackbar({
        open: true,
        message: 'Senha é obrigatória para novos usuários',
        severity: 'error'
      });
      return;
    }

    // Validação de senha: mínimo 8 caracteres (apenas para novos usuários ou quando senha for informada)
    if ((!editingUser || formData.password.trim()) && formData.password.trim().length < 8) {
      setSnackbar({
        open: true,
        message: 'Senha deve ter pelo menos 8 caracteres',
        severity: 'error'
      });
      return;
    }

    // Verificação de username duplicado (case-insensitive)
    const exists = users.some(
      u => u.username.trim().toLowerCase() === formData.username.trim().toLowerCase() && 
           (!editingUser || u.id !== editingUser.id)
    );
    if (exists) {
      setSnackbar({
        open: true,
        message: 'Já existe um usuário com esse nome. Escolha outro nome.',
        severity: 'error'
      });
      return;
    }

    // Proteção: Impedir que o usuário admin atual altere seu próprio perfil para waiter
    if (editingUser && currentUser && 
        editingUser.username === currentUser.username && 
        currentUser.role === 'administrator' && 
        formData.role === 'waiter') {
      setSnackbar({
        open: true,
        message: 'Você não pode alterar seu próprio perfil de administrador para garçom. Isso faria você perder os privilégios de administrador.',
        severity: 'error'
      });
      return;
    }

    setCreatingUser(true);
    try {
      if (editingUser) {
        // Atualizar usuário existente
        
        // Atualizar senha se informada
        if (formData.password.trim()) {
          await updateUserPassword(editingUser.username, formData.password);
        }
        
        // Atualizar role
        await updateUserRole(editingUser.username, formData.role);

        setSnackbar({
          open: true,
          message: 'Usuário atualizado com sucesso',
          severity: 'success'
        });
      } else {
        // Criar novo usuário
        await createUser({
          username: formData.username.trim(),
          password: formData.password,
          role: formData.role
        });

        setSnackbar({
          open: true,
          message: 'Usuário criado com sucesso',
          severity: 'success'
        });
      }

      handleCloseDialog();
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      const message = error.response?.data?.detail || 'Erro ao salvar usuário';
      setSnackbar({
        open: true,
        message,
        severity: 'error'
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleOpenDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete.username);
      setSnackbar({
        open: true,
        message: 'Usuário excluído com sucesso',
        severity: 'success'
      });
      loadUsers();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao excluir usuário',
        severity: 'error'
      });
    } finally {
      handleCloseDeleteDialog();
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'administrator' ? <AdminPanelSettingsIcon /> : <PersonIcon />;
  };

  const getRoleColor = (role: string) => {
    return role === 'administrator' ? 'primary' : 'default';
  };

  const getRoleLabel = (role: string) => {
    return role === 'administrator' ? 'Administrador' : 'Garçom';
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
            WebkitTextFillColor: 'transparent'
          }}>
            Gestão de Usuários
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="body1" color="text.secondary">
            Gerencie os usuários do sistema
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
              }
            }}
          >
            Novo Usuário
          </Button>
        </Box>
      </Box>

      {/* Lista de usuários */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(300px, 1fr))' }, gap: 2 }}>
        {users.map((user) => (
          <Card key={user.id} sx={{ 
            p: 3, 
            background: 'white',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: 2,
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              transform: 'translateY(-2px)',
              transition: 'all 0.2s ease-in-out'
            }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getRoleIcon(user.role)}
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {user.username}
                  </Typography>
                  <Chip 
                    label={getRoleLabel(user.role)}
                    color={getRoleColor(user.role)}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={() => handleOpenDialog(user)}
                  size="small"
                  sx={{ 
                    color: '#667eea',
                    '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' }
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => handleOpenDeleteDialog(user)}
                  size="small"
                  sx={{ 
                    color: '#ef4444',
                    '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          </Card>
        ))}
      </Box>

      {/* Dialog para criar/editar usuário */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Nome de Usuário"
            fullWidth
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            disabled={!!editingUser}
            helperText={editingUser ? undefined : "Mínimo 4 caracteres"}
            error={!editingUser && formData.username.trim().length > 0 && formData.username.trim().length < 4}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label={editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
            type="password"
            fullWidth
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            helperText={
              editingUser 
                ? (formData.password.trim() ? "Mínimo 8 caracteres" : "Deixe em branco para manter a senha atual")
                : "Mínimo 8 caracteres"
            }
            error={!!((!editingUser || formData.password.trim()) && formData.password.trim().length > 0 && formData.password.trim().length < 8)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Função</InputLabel>
            <Select
              value={formData.role}
              label="Função"
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'waiter' | 'administrator' })}
            >
              <MenuItem 
                value="waiter"
                disabled={
                  !!(editingUser && 
                  currentUser && 
                  editingUser.username === currentUser.username && 
                  currentUser.role === 'administrator')
                }
              >
                Garçom
                {editingUser && 
                 currentUser && 
                 editingUser.username === currentUser.username && 
                 currentUser.role === 'administrator' && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    (não permitido para seu próprio perfil)
                  </Typography>
                )}
              </MenuItem>
              <MenuItem value="administrator">Administrador</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={creatingUser}
            startIcon={creatingUser ? <CircularProgress size={20} /> : undefined}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
              }
            }}
          >
            {creatingUser ? 'Salvando...' : (editingUser ? 'Atualizar' : 'Criar')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Excluir Usuário"
        description={<>Excluir "{userToDelete?.username}". Esta ação é permanente.</>}
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

export default UserManagement; 