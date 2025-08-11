import { useState, useEffect } from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, AppBar, Toolbar, IconButton, Typography, Box, Divider } from '@mui/material';
import TableBarIcon from '@mui/icons-material/TableBar';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import HotelIcon from '@mui/icons-material/Hotel';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PrintIcon from '@mui/icons-material/Print';
import SettingsIcon from '@mui/icons-material/Settings';
import OrderList from './OrderList';
import ProductList from './ProductList';
import AdminTableList from './AdminTableList';
import RoomList from './RoomList';
import UserManagement from './UserManagement';
import ReportsPanel from './ReportsPanel';
import PrintQueuePanel from './PrintQueuePanel';
import SystemStatusIndicator from './SystemStatusIndicator';
import SystemStatusManager from './SystemStatusManager';

interface AdminPageProps {
  onLogout?: () => void;
}

interface User {
  username: string;
  role: string;
  [key: string]: any;
}

const drawerWidth = 240;

const menuItems = [
  { text: 'Mesas', icon: <TableBarIcon />, key: 'tables' },
  { text: 'Pedidos', icon: <RestaurantMenuIcon />, key: 'orders' },
  { text: 'Produtos', icon: <LocalMallIcon />, key: 'products' },
  { text: 'Sistema', icon: <SettingsIcon />, key: 'system' },
  // Quartos - condicional baseado na variável de ambiente
  ...(import.meta.env.VITE_ENABLE_ROOMS === 'true' ? [{ text: 'Quartos', icon: <HotelIcon />, key: 'rooms' }] : []),
  // Usuários - condicional baseado na variável de ambiente
  ...(import.meta.env.VITE_ENABLE_USER_MANAGEMENT === 'true' ? [{ text: 'Usuários', icon: <PeopleIcon />, key: 'users' }] : []),
  // Relatórios - condicional baseado na variável de ambiente
  ...(import.meta.env.VITE_ENABLE_REPORTS === 'true' ? [{ text: 'Relatórios', icon: <AssessmentIcon />, key: 'reports' }] : []),
  // Impressão - condicional baseado na variável de ambiente
  ...(import.meta.env.VITE_ENABLE_PRINT_QUEUE === 'true' ? [{ text: 'Impressão', icon: <PrintIcon />, key: 'print-queue' }] : []),
];

const AdminPage = ({ onLogout }: AdminPageProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selected, setSelected] = useState('tables');
  const [user, setUser] = useState<User | null>(null);

  // Verificar se a página selecionada está habilitada, senão redirecionar para a primeira disponível
  useEffect(() => {
    const availablePages = ['tables', 'orders', 'products', 'system'];
    
    if (import.meta.env.VITE_ENABLE_ROOMS === 'true') {
      availablePages.push('rooms');
    }
    if (import.meta.env.VITE_ENABLE_USER_MANAGEMENT === 'true') {
      availablePages.push('users');
    }
    if (import.meta.env.VITE_ENABLE_REPORTS === 'true') {
      availablePages.push('reports');
    }
    if (import.meta.env.VITE_ENABLE_PRINT_QUEUE === 'true') {
      availablePages.push('print-queue');
    }

    if (!availablePages.includes(selected)) {
      setSelected(availablePages[0]);
    }
  }, [selected]);

  useEffect(() => {
    // Carregar dados do usuário do localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      }
    }
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (key: string) => {
    setSelected(key);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onLogout) onLogout();
  };

  const drawer = (
    <Box sx={{ 
      height: '100%',
      background: 'linear-gradient(180deg, #1e293b 0%, #334155 100%)',
      color: 'white',
      overflow: 'hidden', // Previne overflow no drawer
      width: '100%' // Garante que não ultrapasse a largura
    }}>
      <Box sx={{ 
        p: 3, 
        background: 'rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Box sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            overflow: 'hidden'
          }}>
            {import.meta.env.VITE_RESTAURANT_LOGO ? (
              <img 
                src={import.meta.env.VITE_RESTAURANT_LOGO} 
                alt="Logo do restaurante"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  // Fallback para o ícone se a imagem não carregar
                  e.currentTarget.style.display = 'none';
                  const nextSibling = e.currentTarget.nextSibling as HTMLElement;
                  if (nextSibling) {
                    nextSibling.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <SettingsIcon 
              sx={{ 
                color: 'white', 
                fontSize: 32,
                display: import.meta.env.VITE_RgitURANT_LOGO ? 'none' : 'flex'
              }} 
            />
          </Box>
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            color: 'white', 
            textAlign: 'center',
            wordWrap: 'break-word', // Quebra palavras longas
            overflowWrap: 'break-word', // Fallback para navegadores mais antigos
            maxWidth: '100%' // Garante que não ultrapasse a largura
          }}>
            {import.meta.env.VITE_RESTAURANT_NAME || 'Restaurante'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
            Painel Administrativo
          </Typography>
        </Box>
      </Box>
      
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.key} disablePadding sx={{ mb: 1, mx: 1 }}>
            <ListItemButton 
              selected={selected === item.key} 
              onClick={() => handleMenuClick(item.key)}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.2)'
                  }
                },
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  transform: 'translateX(4px)',
                  transition: 'all 0.2s ease'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <ListItemIcon sx={{ color: selected === item.key ? 'white' : 'rgba(255,255,255,0.7)' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  '& .MuiListItemText-primary': {
                    fontWeight: selected === item.key ? 600 : 400
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
        
        {/* Informações do usuário */}
        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.2)' }} />
        <ListItem disablePadding sx={{ mx: 1, mb: 1 }}>
          <ListItemButton 
            disabled
            sx={{
              borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.05)',
              '&.Mui-disabled': {
                opacity: 1,
                color: 'rgba(255,255,255,0.8)'
              }
            }}
          >
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)' }}>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText 
              primary={user?.username || 'Administrador'} 
              secondary="Administrador"
              sx={{
                '& .MuiListItemText-secondary': {
                  color: 'rgba(255,255,255,0.5)'
                }
              }}
            />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding sx={{ mx: 1 }}>
          <ListItemButton 
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              color: '#ef4444',
              '&:hover': {
                backgroundColor: 'rgba(239,68,68,0.1)',
                transform: 'translateX(4px)',
                transition: 'all 0.2s ease'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon sx={{ color: '#ef4444' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Sair" />
          </ListItemButton>
        </ListItem>
      </List>
      
      {/* Copyright */}
      <Box sx={{ 
        mt: 'auto', 
        p: 2, 
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden' // Previne overflow no copyright
      }}>
        <Typography variant="caption" sx={{ 
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.7rem',
          wordWrap: 'break-word', // Quebra palavras longas
          overflowWrap: 'break-word' // Fallback para navegadores mais antigos
        }}>
          © Desenvolvido por Jeferson Serpa
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh', 
      bgcolor: '#f8fafc',
      overflow: 'hidden' // Previne overflow horizontal
    }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: 1201,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div"
            onClick={() => window.location.reload()}
            sx={{ 
              cursor: 'pointer',
              fontWeight: 600,
              letterSpacing: '0.5px',
              '&:hover': {
                textDecoration: 'underline',
                opacity: 0.9,
                transform: 'scale(1.02)',
                transition: 'all 0.2s ease'
              }
            }}
          >
            {import.meta.env.VITE_APP_TITLE || 'Sistema de Pedidos'} - Admin
          </Typography>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SystemStatusIndicator />
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ 
          width: { sm: drawerWidth }, 
          flexShrink: { sm: 0 },
          overflow: 'hidden' // Previne overflow no nav
        }}
        aria-label="menu lateral"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            zIndex: 1202,
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
              zIndex: 1202,
              top: '64px',
              height: 'calc(100% - 64px)',
              overflow: 'hidden' // Previne overflow no drawer mobile
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            zIndex: 1202,
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
              zIndex: 1202,
              top: '64px',
              height: 'calc(100% - 64px)',
              overflow: 'hidden' // Previne overflow no drawer desktop
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        data-testid="main-content"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, sm: 3 }, 
          width: { sm: `calc(100% - ${drawerWidth}px)` }, 
          mt: 8,
          background: '#ffffff',
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto' // Permite scroll vertical no conteúdo principal
        }}
      >
        {/* Renderização condicional dos componentes de cada menu */}
        {selected === 'tables' && <AdminTableList />}
        {selected === 'orders' && <OrderList />}
        {selected === 'products' && <ProductList />}
        {selected === 'system' && <SystemStatusManager />}
        {selected === 'rooms' && import.meta.env.VITE_ENABLE_ROOMS === 'true' && <RoomList />}
        {selected === 'users' && import.meta.env.VITE_ENABLE_USER_MANAGEMENT === 'true' && <UserManagement />}
        {selected === 'reports' && import.meta.env.VITE_ENABLE_REPORTS === 'true' && <ReportsPanel />}
        {selected === 'print-queue' && import.meta.env.VITE_ENABLE_PRINT_QUEUE === 'true' && <PrintQueuePanel />}
      </Box>
    </Box>
  );
};

export default AdminPage; 