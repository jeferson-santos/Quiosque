import { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography
} from '@mui/material';
import CategoryManager from './CategoryManager';
import ProductManager from './ProductManager';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`cardapio-tabpanel-${index}`}
      aria-labelledby={`cardapio-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `cardapio-tab-${index}`,
    'aria-controls': `cardapio-tabpanel-${index}`,
  };
}

const ProductList = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ pb: 2 }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: { xs: 2, sm: 3, md: 4 },
        pt: 1,
        pb: 3,
        mb: 2
      }}>
        <Box>
          <Typography variant="h4" sx={{
            fontWeight: 700,
            color: '#1e293b',
            mb: 1
          }}>
            Produtos
          </Typography>
          <Typography variant="body1" sx={{
            color: '#64748b',
            mb: 3
          }}>
            Gerencie categorias e produtos
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="cardapio tabs"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                minHeight: 48,
                color: '#64748b',
                '&.Mui-selected': {
                  color: '#667eea'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#667eea',
                height: 3
              }
            }}
          >
            <Tab label="Produtos" {...a11yProps(0)} />
            <Tab label="Categorias" {...a11yProps(1)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <ProductManager onProductChange={() => {
            // Recarregar categorias quando produto mudar
            if (tabValue === 1) {
              // Forçar re-render do CategoryManager
              setTabValue(1);
            }
          }} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <CategoryManager onCategoryChange={() => {
            // Recarregar produtos quando categoria mudar
            if (tabValue === 0) {
              // Forçar re-render do ProductManager
              setTabValue(0);
            }
          }} />
        </TabPanel>
      </Box>
    </Box>
  );
};

export default ProductList; 