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
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import ConfirmDialog from './ConfirmDialog';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  uploadProductImage,
  fetchProductImage,
  deleteProductImage
} from '../config/api';
import type { Product, ProductCreate, Category } from '../types';

interface ProductManagerProps {
  onProductChange?: () => void;
}

const ProductManager = ({ onProductChange }: ProductManagerProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductCreate>({
    name: '',
    description: '',
    price: 0,
    category_id: 0,
    is_active: true,
    stock_quantity: 0,
    available_from: '', // Vazio = 24h
    available_until: '' // Vazio = 24h
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [expanded, setExpanded] = useState<string | false>(false);
  const [hasExpandedAvailability, setHasExpandedAvailability] = useState(false);
  // Imagens
  const [imageUrls, setImageUrls] = useState<Record<number, string | null>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadingProductId, setUploadingProductId] = useState<number | null>(null);
  const [removingProductId, setRemovingProductId] = useState<number | null>(null);
  const [dragActiveId, setDragActiveId] = useState<number | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ open: boolean; productId: number | null; productName: string }>(
    { open: false, productId: null, productName: '' }
  );
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });

  useEffect(() => {
    loadData();
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setIsAdmin(parsed?.role === 'administrator');
      }
    } catch {}
  }, []);

  // Cleanup de object URLs ao desmontar
  useEffect(() => {
    return () => {
      try {
        Object.values(imageUrls).forEach((url) => {
          if (url) URL.revokeObjectURL(url);
        });
      } catch {}
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getCategories(true) // Apenas categorias ativas
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setError('');
      await loadImages(productsData);
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async (prods: Product[]) => {
    try {
      const pairs = await Promise.all(
        prods.map(async (p) => {
          try {
            const url = await fetchProductImage(p.id);
            return [p.id, url] as [number, string | null];
          } catch {
            return [p.id, null] as [number, string | null];
          }
        })
      );
      const map: Record<number, string | null> = {};
      pairs.forEach(([id, url]) => {
        map[id] = url;
      });
      setImageUrls((prev) => {
        // Revogar URLs antigos que serão substituídos
        Object.entries(prev).forEach(([idStr, oldUrl]) => {
          const id = Number(idStr);
          const newUrl = map[id];
          if (oldUrl && newUrl && oldUrl !== newUrl) {
            URL.revokeObjectURL(oldUrl);
          }
        });
        return map;
      });
    } catch (e) {
      console.error('Erro ao carregar imagens dos produtos', e);
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        category_id: product.category_id,
        is_active: product.is_active ?? true,
        stock_quantity: product.stock_quantity || 0,
        available_from: product.available_from || '',
        available_until: product.available_until || ''
      });
      // Expandir seção se já tem horários configurados
      if (product.available_from || product.available_until) {
        setExpanded('availability');
        setHasExpandedAvailability(true);
      } else {
        setExpanded(false);
        setHasExpandedAvailability(false);
      }
      // Não gerenciamos mais imagem no editor
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        category_id: categories.length > 0 ? categories[0].id : 0,
        is_active: true,
        stock_quantity: 0,
        available_from: '', // Vazio = 24h
        available_until: '' // Vazio = 24h
      });
      setExpanded(false);
      setHasExpandedAvailability(false);
      // nada específico de imagem aqui
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setExpanded(false);
    setHasExpandedAvailability(false);
    setFormData({
      name: '',
      description: '',
      price: 0,
      category_id: 0,
      is_active: true,
      stock_quantity: 0,
      available_from: '', // Vazio = 24h
      available_until: '' // Vazio = 24h
    });
    setDragActiveId(null);
    setUploadingProductId(null);
    setRemovingProductId(null);
  };

  const handleAvailabilityExpand = (isExpanded: boolean) => {
    if (isExpanded && !hasExpandedAvailability) {
      // Primeira vez expandindo - preencher com 24h
      setFormData({
        ...formData,
        available_from: '00:00',
        available_until: '23:59'
      });
      setHasExpandedAvailability(true);
    }
    setExpanded(isExpanded ? 'availability' : false);
  };

  const handleImageUploadForProduct = async (productId: number, file: File) => {
    try {
      setUploadingProductId(productId);
      await uploadProductImage(productId, file);
      const fresh = await fetchProductImage(productId);
      setImageUrls((m) => ({ ...m, [productId]: fresh }));
    } catch (e) {
      console.error('Erro ao fazer upload da imagem', e);
      setError('Erro ao enviar imagem');
    } finally {
      setUploadingProductId(null);
      setDragActiveId(null);
    }
  };

  const handleListFileInputChange = (productId: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleImageUploadForProduct(productId, file);
      e.currentTarget.value = '';
    }
  };

  const handleDragOverList = (productId: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActiveId(productId);
  };

  const handleDragLeaveList = (_productId: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActiveId(null);
  };

  const handleDropList = (productId: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActiveId(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleImageUploadForProduct(productId, file);
    }
  };

  const handleRemoveImageFromList = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    setConfirmRemove({ open: true, productId, productName: product?.name ?? String(productId) });
  };

  const confirmRemoval = async () => {
    if (!confirmRemove.productId) return;
    try {
      setRemovingProductId(confirmRemove.productId);
      await deleteProductImage(confirmRemove.productId);
      setImageUrls((m) => ({ ...m, [confirmRemove.productId as number]: null }));
    } catch (e) {
      console.error('Erro ao remover imagem', e);
      setError('Erro ao remover imagem');
    } finally {
      setRemovingProductId(null);
      setConfirmRemove({ open: false, productId: null, productName: '' });
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Nome do produto é obrigatório');
      return;
    }
    if (formData.price <= 0) {
      setError('Preço deve ser maior que zero');
      return;
    }
    if (formData.category_id === 0) {
      setError('Selecione uma categoria');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await createProduct(formData);
      }

      await loadData();
      handleCloseDialog();
      if (onProductChange) {
        onProductChange();
      }
    } catch (err) {
      setError('Erro ao salvar produto');
      console.error('Erro ao salvar produto:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAskDeleteProduct = (product: Product) => {
    setConfirmDeleteProduct({ open: true, product });
  };

  const confirmDeleteProductNow = async () => {
    if (!confirmDeleteProduct.product) return;
    try {
      await deleteProduct(confirmDeleteProduct.product.id);
      await loadData();
      if (onProductChange) {
        onProductChange();
      }
    } catch (err) {
      setError('Erro ao excluir produto');
      console.error('Erro ao excluir produto:', err);
    } finally {
      setConfirmDeleteProduct({ open: false, product: null });
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesName = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter ? product.category_id === categoryFilter : true;
    return matchesName && matchesCategory;
  });

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
            Produtos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie os produtos
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={categories.length === 0}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            background: categories.length > 0
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : '#e5e7eb',
            boxShadow: categories.length > 0
              ? '0 4px 14px rgba(16, 185, 129, 0.3)'
              : 'none',
            fontWeight: 600,
            color: categories.length > 0 ? 'white' : '#9ca3af',
            '&:hover': {
              background: categories.length > 0
                ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                : '#e5e7eb',
              boxShadow: categories.length > 0
                ? '0 6px 20px rgba(16, 185, 129, 0.4)'
                : 'none',
              transform: categories.length > 0 ? 'translateY(-1px)' : 'none'
            }
          }}
        >
          Novo Produto
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

      {/* Filters */}
      <Box sx={{
        display: 'flex',
        gap: 2,
        mb: 3,
        flexWrap: 'wrap'
      }}>
        <TextField
          label="Pesquisar produtos"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 250 }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Categoria</InputLabel>
          <Select
            value={categoryFilter}
            label="Categoria"
            onChange={(e) => setCategoryFilter(e.target.value as number | '')}
          >
            <MenuItem value="">Todas</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={40} sx={{ color: '#667eea' }} />
        </Box>
      )}

      {/* Products List */}
      {!loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredProducts.length === 0 ? (
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f0f4ff 0%, #f8fafc 100%)',
              boxShadow: '0 6px 24px rgba(102, 126, 234, 0.10)',
              border: '2px solid #e0e7ff',
              borderRadius: 4,
              p: 4,
              textAlign: 'center'
            }}>
              <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 500 }}>
                Nenhum produto encontrado
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
                {categories.length === 0 
                  ? 'Crie uma categoria primeiro para adicionar produtos'
                  : 'Crie seu primeiro produto para começar'
                }
              </Typography>
            </Card>
          ) : (
            filteredProducts.map((product) => {
              const category = categories.find(c => c.id === product.category_id);
              return (
                <Card key={product.id} sx={{
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
                      <Box sx={{
                        width: 140,
                        height: 140,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px dashed',
                        borderColor: dragActiveId === product.id ? '#a5b4fc' : 'rgba(0,0,0,0.08)',
                        mr: 2,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f8fafc',
                        position: 'relative',
                        cursor: isAdmin ? 'pointer' : 'default'
                      }}
                      onClick={() => {
                        if (!isAdmin) return;
                        const input = document.getElementById(`product-image-input-${product.id}`) as HTMLInputElement | null;
                        input?.click();
                      }}
                      onDragOver={handleDragOverList(product.id)}
                      onDragLeave={handleDragLeaveList(product.id)}
                      onDrop={handleDropList(product.id)}
                    >
                        {imageUrls[product.id] ? (
                          <img src={imageUrls[product.id] as string} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <ImageIcon sx={{ color: '#cbd5e1', fontSize: 70 }} />
                        )}
                        {isAdmin && (
                          <>
                            <input id={`product-image-input-${product.id}`} type="file" accept="image/*" hidden onChange={handleListFileInputChange(product.id)} />
                            {!imageUrls[product.id] && (
                              <Box sx={{
                                position: 'absolute',
                                bottom: 8,
                                left: 8,
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                backgroundColor: 'rgba(255,255,255,0.85)',
                                color: '#64748b',
                                fontSize: 12,
                                letterSpacing: 0.2
                              }}>
                                selecionar imagem
                              </Box>
                            )}
                            {imageUrls[product.id] && (
                              <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); void handleRemoveImageFromList(product.id); }}
                                disabled={removingProductId === product.id}
                                sx={{
                                  position: 'absolute',
                                  top: 6,
                                  right: 6,
                                  backgroundColor: 'rgba(255,255,255,0.9)',
                                  '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                                }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            )}
                            {uploadingProductId === product.id && (
                              <Box sx={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(255,255,255,0.6)'
                              }}>
                                <CircularProgress size={28} sx={{ color: '#667eea' }} />
                              </Box>
                            )}
                          </>
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Typography variant="h6" sx={{
                            fontWeight: 700,
                            color: '#1e293b',
                            textDecoration: !product.is_active ? 'line-through' : 'none'
                          }}>
                            {product.name}
                          </Typography>
                          {!product.is_active && (
                            <Chip
                              label="Inativo"
                              size="small"
                              sx={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                fontWeight: 600
                              }}
                            />
                          )}
                        </Box>
                        {product.description && (
                          <Typography variant="body2" sx={{
                            color: '#64748b',
                            lineHeight: 1.4,
                            mb: 1
                          }}>
                            {product.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          {category && (
                            <Chip
                              label={category.name}
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                color: '#667eea',
                                fontWeight: 600,
                                border: '1px solid rgba(102, 126, 234, 0.2)'
                              }}
                            />
                          )}
                          <Typography variant="h6" sx={{
                            fontWeight: 700,
                            color: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.10)',
                            px: 1.5,
                            py: 0.25,
                            borderRadius: 1
                          }}>
                            R$ {product.price.toFixed(2)}
                          </Typography>
                          {product.stock_quantity !== undefined && (
                            <Chip
                              label={`Estoque: ${product.stock_quantity}`}
                              size="small"
                              sx={{
                                backgroundColor: product.stock_quantity > 0 
                                  ? 'rgba(16, 185, 129, 0.1)' 
                                  : 'rgba(239, 68, 68, 0.1)',
                                color: product.stock_quantity > 0 ? '#10b981' : '#ef4444',
                                fontWeight: 600
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Editar produto">
                          <IconButton
                            onClick={() => handleOpenDialog(product)}
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
                        <Tooltip title="Excluir produto">
                          <IconButton
                            onClick={() => handleAskDeleteProduct(product)}
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
              );
            })
          )}
        </Box>
      )}

      <ConfirmDialog
        open={confirmRemove.open}
        onClose={() => setConfirmRemove({ open: false, productId: null, productName: '' })}
        onConfirm={confirmRemoval}
        title="Remover imagem"
        description={<>
          Remover a imagem de "{confirmRemove.productName}". Esta ação é permanente.
        </>}
        confirmText="Remover"
        variant="danger"
        loading={removingProductId !== null}
      />

      <ConfirmDialog
        open={confirmDeleteProduct.open}
        onClose={() => setConfirmDeleteProduct({ open: false, product: null })}
        onConfirm={confirmDeleteProductNow}
        title="Excluir Produto"
        description={<>
          Excluir "{confirmDeleteProduct.product?.name}". Esta ação é permanente.
        </>}
        confirmText="Excluir"
        variant="danger"
      />
      {/* Dialog para criar/editar produto */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
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
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
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
            {/* Upload removido do editor: alteração de imagem agora é feita direto na lista, apenas para admin */}
            <TextField
              label="Nome do Produto"
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
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Preço"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                fullWidth
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Categoria *</InputLabel>
                <Select
                  value={formData.category_id}
                  label="Categoria *"
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value as number })}
                  sx={{
                    borderRadius: 2
                  }}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              label="Quantidade em Estoque"
              type="number"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <Accordion 
              expanded={expanded === 'availability'} 
              onChange={() => handleAvailabilityExpand(expanded !== 'availability')}
              sx={{
                '& .MuiAccordionSummary-root': {
                  backgroundColor: 'rgba(102, 126, 234, 0.05)',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(102, 126, 234, 0.1)'
                  }
                },
                '& .MuiAccordionDetails-root': {
                  backgroundColor: 'rgba(248, 250, 252, 0.8)',
                  borderRadius: 2,
                  mt: 1
                }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="availability-content" id="availability-header">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon sx={{ color: '#667eea' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Configuração de Disponibilidade
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                    Por padrão, o produto estará disponível 24 horas por dia. Configure horários específicos se necessário.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Disponível a partir de"
                    type="time"
                    value={formData.available_from}
                    onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                    fullWidth
                    placeholder="Deixe vazio para 24h"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                  <TextField
                    label="Disponível até"
                    type="time"
                    value={formData.available_until}
                    onChange={(e) => setFormData({ ...formData, available_until: e.target.value })}
                    fullWidth
                    placeholder="Deixe vazio para 24h"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Box>
              </AccordionDetails>
            </Accordion>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  color="primary"
                />
              }
              label="Produto ativo"
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
            disabled={saving || !formData.name.trim() || formData.price <= 0 || formData.category_id === 0}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              background: (formData.name.trim() && formData.price > 0 && formData.category_id > 0)
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : '#e5e7eb',
              boxShadow: (formData.name.trim() && formData.price > 0 && formData.category_id > 0)
                ? '0 4px 14px rgba(16, 185, 129, 0.3)'
                : 'none',
              color: (formData.name.trim() && formData.price > 0 && formData.category_id > 0) ? 'white' : '#9ca3af',
              fontWeight: 600,
              '&:hover': {
                background: (formData.name.trim() && formData.price > 0 && formData.category_id > 0)
                  ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                  : '#e5e7eb',
                boxShadow: (formData.name.trim() && formData.price > 0 && formData.category_id > 0)
                  ? '0 6px 20px rgba(16, 185, 129, 0.4)'
                  : 'none',
                transform: (formData.name.trim() && formData.price > 0 && formData.category_id > 0) ? 'translateY(-1px)' : 'none'
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
    </Box>
  );
};

export default ProductManager; 