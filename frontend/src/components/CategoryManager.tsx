import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../config/api';
import type { Category, CategoryCreate } from '../types';
import CloseIcon from '@mui/icons-material/Close';
import ConfirmDialog from './ConfirmDialog';

interface CategoryManagerProps {
  onCategoryChange?: () => void;
}

const CategoryManager = ({ onCategoryChange }: CategoryManagerProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryCreate>({
    name: '',
    description: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
      setError('');
    } catch (err) {
      setError('Erro ao carregar categorias');
      console.error('Erro ao carregar categorias:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        is_active: category.is_active
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      is_active: true
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Nome da categoria é obrigatório');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await createCategory(formData);
      }

      await loadCategories();
      handleCloseDialog();
      if (onCategoryChange) {
        onCategoryChange();
      }
    } catch (err) {
      setError('Erro ao salvar categoria');
      console.error('Erro ao salvar categoria:', err);
    } finally {
      setSaving(false);
    }
  };

  const [confirmDelete, setConfirmDelete] = useState<{open: boolean; id: number | null; name: string}>({open: false, id: null, name: ''});

  const handleDelete = (category: Category) => {
    setConfirmDelete({ open: true, id: category.id, name: category.name });
  };

  const confirmDeleteCategory = async () => {
    if (!confirmDelete.id) return;
    try {
      await deleteCategory(confirmDelete.id);
      await loadCategories();
      if (onCategoryChange) {
        onCategoryChange();
      }
    } catch (err) {
      setError('Erro ao excluir categoria');
      console.error('Erro ao excluir categoria:', err);
    } finally {
      setConfirmDelete({ open: false, id: null, name: '' });
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}>
        <Box>
          <Typography variant="h5" sx={{
            fontWeight: 700,
            color: '#1e293b',
            mb: 0.5
          }}>
            Categorias
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie as categorias dos produtos
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
              transform: 'translateY(-1px)'
            }
          }}
        >
          Nova Categoria
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError('')}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={40} sx={{ color: '#667eea' }} />
        </Box>
      )}

      {/* Categories List */}
      {!loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {categories.length === 0 ? (
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f0f4ff 0%, #f8fafc 100%)',
              boxShadow: '0 6px 24px rgba(102, 126, 234, 0.10)',
              border: '2px solid #e0e7ff',
              borderRadius: 4,
              p: 4,
              textAlign: 'center'
            }}>
              <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 500 }}>
                Nenhuma categoria encontrada
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
                Crie sua primeira categoria para começar
              </Typography>
            </Card>
          ) : (
            categories.map((category) => (
              <Card key={category.id} sx={{
                transition: 'all 0.3s ease',
                borderRadius: 2.5,
                background: 'white',
                border: '2px solid rgba(0,0,0,0.08)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                  border: '2px solid rgba(0,0,0,0.12)'
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="h6" sx={{
                          fontWeight: 700,
                          color: '#1e293b',
                          textDecoration: !category.is_active ? 'line-through' : 'none'
                        }}>
                          {category.name}
                        </Typography>
                        {!category.is_active && (
                          <Chip
                            label="Inativa"
                            size="small"
                            sx={{
                              backgroundColor: '#ef4444',
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                        )}
                      </Box>
                      {category.description && (
                        <Typography variant="body2" sx={{
                          color: '#64748b',
                          lineHeight: 1.4
                        }}>
                          {category.description}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Editar categoria">
                          <IconButton
                            onClick={() => handleOpenDialog(category)}
                            sx={{
                              color: '#667eea',
                              '&:hover': {
                                backgroundColor: 'rgba(102, 126, 234, 0.1)'
                              }
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir categoria">
                          <IconButton
                            onClick={() => handleDelete(category)}
                            sx={{
                              color: '#ef4444',
                              '&:hover': {
                                backgroundColor: 'rgba(239, 68, 68, 0.1)'
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}

      {/* Dialog para criar/editar categoria */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.05)'
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </Typography>
            <IconButton
              onClick={handleCloseDialog}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, m:1 }}>
            <TextField
              label="Nome da Categoria"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField
              label="Descrição (opcional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  color="primary"
                />
              }
              label="Categoria ativa"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleCloseDialog}
            disabled={saving}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              color: '#64748b',
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
            disabled={saving || !formData.name.trim()}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              background: formData.name.trim()
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : '#e5e7eb',
              boxShadow: formData.name.trim()
                ? '0 4px 14px rgba(16, 185, 129, 0.3)'
                : 'none',
              color: formData.name.trim() ? 'white' : '#9ca3af',
              fontWeight: 600,
              '&:hover': {
                background: formData.name.trim()
                  ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                  : '#e5e7eb',
                boxShadow: formData.name.trim()
                  ? '0 6px 20px rgba(16, 185, 129, 0.4)'
                  : 'none',
                transform: formData.name.trim() ? 'translateY(-1px)' : 'none'
              },
              '&:disabled': {
                background: '#e5e7eb',
                color: '#9ca3af'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null, name: '' })}
        onConfirm={confirmDeleteCategory}
        title="Excluir Categoria"
        description={<>Excluir "{confirmDelete.name}". Esta ação é permanente.</>}
        confirmText="Excluir"
        variant="danger"
      />
    </Box>
  );
};

export default CategoryManager; 