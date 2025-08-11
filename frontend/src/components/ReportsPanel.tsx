import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Chip,
  Stack,
  Divider,
} from '@mui/material';

import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import TableBarIcon from '@mui/icons-material/TableBar';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DownloadIcon from '@mui/icons-material/Download';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import api, { getCategories, getProducts, getUsers } from '../config/api';
import type { Category, Product, User } from '../types';
import React from 'react';

interface ReportData {
  [key: string]: any;
}

type ReportKey =
  | 'daily-sales'
  | 'top-products'
  | 'waiter-commission'
  | 'payment-methods'
  | 'table-performance'
  | 'hourly-sales';

const ReportsPanel = () => {
  const [selectedReport, setSelectedReport] = useState<ReportKey>('daily-sales');

  // Period controls
  const [preset, setPreset] = useState<'today' | '7d' | '30d' | 'custom'>('today');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [days, setDays] = useState(30);

  // Filters
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [selectedWaiters, setSelectedWaiters] = useState<string[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const reportTypes: { key: ReportKey; label: string; icon: React.ReactNode }[] = [
    { key: 'daily-sales', label: 'Vendas Diárias', icon: <AssessmentIcon /> },
    { key: 'top-products', label: 'Produtos Mais Vendidos', icon: <TrendingUpIcon /> },
    { key: 'waiter-commission', label: 'Comissão de Garçons', icon: <PeopleIcon /> },
    { key: 'payment-methods', label: 'Métodos de Pagamento', icon: <PaymentIcon /> },
    { key: 'table-performance', label: 'Performance das Mesas', icon: <TableBarIcon /> },
    { key: 'hourly-sales', label: 'Vendas por Hora', icon: <ScheduleIcon /> }
  ];

  // Load filter data
  useEffect(() => {
    const load = async () => {
      try {
        const [cats, prods, usrs] = await Promise.all([
          getCategories(true).catch(() => []),
          getProducts().catch(() => []),
          getUsers().catch(() => []),
        ]);
        setCategories(cats || []);
        setProducts(prods || []);
        setUsers(usrs || []);
      } catch (e) {
        // silencioso
      }
    };
    load();
  }, []);

  // Adjust period controls when preset changes
  useEffect(() => {
    if (preset === 'today') {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setStartDate(today);
      setEndDate(today);
      setDays(1);
    } else if (preset === '7d') {
      setDays(7);
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - 6);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === '30d') {
      setDays(30);
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - 29);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  }, [preset]);

  const activeFilters = useMemo(() => {
    const chips: { label: string; onDelete: () => void }[] = [];
    if (selectedCategoryIds.length) {
      chips.push({
        label: `${selectedCategoryIds.length} categoria(s)`,
        onDelete: () => setSelectedCategoryIds([]),
      });
    }
    if (selectedProductIds.length) {
      chips.push({
        label: `${selectedProductIds.length} produto(s)`,
        onDelete: () => setSelectedProductIds([]),
      });
    }
    if (selectedWaiters.length) {
      chips.push({
        label: `${selectedWaiters.length} garçom(ns)`,
        onDelete: () => setSelectedWaiters([]),
      });
    }
    if (selectedPaymentMethods.length) {
      chips.push({
        label: `${selectedPaymentMethods.length} pagamento(s)`,
        onDelete: () => setSelectedPaymentMethods([]),
      });
    }
    return chips;
  }, [selectedCategoryIds, selectedProductIds, selectedWaiters, selectedPaymentMethods]);

  const buildParams = () => {
    const params: Record<string, any> = {};
    // Period
    if (selectedReport === 'daily-sales' || selectedReport === 'hourly-sales') {
      params.date = date;
    } else if (selectedReport === 'waiter-commission') {
      params.start_date = startDate;
      params.end_date = endDate;
    } else {
      params.days = days;
    }

    // Filters (backend pode ignorar se não suportar)
    if (selectedCategoryIds.length) params.category_ids = selectedCategoryIds.join(',');
    if (selectedProductIds.length) params.product_ids = selectedProductIds.join(',');
    if (selectedWaiters.length) params.waiters = selectedWaiters.join(',');
    if (selectedPaymentMethods.length) params.payment_methods = selectedPaymentMethods.join(',');

    return params;
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      let response;
      const params = buildParams();

      switch (selectedReport) {
        case 'daily-sales':
          response = await api.get(`/reports/daily-sales/${params.date}`, { params });
          break;
        case 'top-products':
          response = await api.get('/reports/top-products', { params });
          break;
        case 'waiter-commission':
          response = await api.get('/reports/waiter-commission', { params });
          break;
        case 'payment-methods':
          response = await api.get('/reports/payment-methods', { params });
          break;
        case 'table-performance':
          response = await api.get('/reports/table-performance', { params });
          break;
        case 'hourly-sales':
          response = await api.get(`/reports/hourly-sales/${params.date}`, { params });
          break;
        default:
          throw new Error('Relatório não encontrado');
      }

      setReportData(response.data);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setSnackbar({ open: true, message: 'Erro ao gerar relatório', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedReport) generateReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReport, date, startDate, endDate, days]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleExportCsv = () => {
    if (!reportData) return;

    let rows: string[] = [];

    const push = (arr: (string | number)[]) => rows.push(arr.map((v) => `${String(v).replaceAll('"', '""')}`).join(','));

    switch (selectedReport) {
      case 'daily-sales': {
        push(['Métrica', 'Valor']);
        push(['Total de Pedidos', reportData.total_orders]);
        push(['Receita Total', reportData.total_revenue]);
        push(['Receita com Taxa', reportData.total_revenue_with_tax]);
        push(['Ticket Médio', reportData.average_order_value]);
        if (Array.isArray(reportData.top_products)) {
          rows.push('');
          push(['Produtos Mais Vendidos']);
          push(['Produto', 'Quantidade', 'Receita']);
          reportData.top_products.forEach((p: any) => push([p.name, p.quantity, p.revenue]));
        }
        break;
      }
      case 'top-products': {
        push(['Produto', 'Quantidade', 'Receita']);
        (reportData.products || []).forEach((p: any) => push([p.name, p.quantity_sold, p.revenue]));
        break;
      }
      case 'waiter-commission': {
        push(['Garçom', 'Pedidos', 'Receita', 'Comissão']);
        (reportData.waiters || []).forEach((w: any) => push([w.username, w.orders_count, w.revenue, w.commission]));
        break;
      }
      case 'payment-methods': {
        // Expecting structure like { methods: [{method, count, revenue}] }
        const items: any[] = reportData.methods || reportData.items || [];
        push(['Método', 'Pedidos', 'Receita']);
        items.forEach((m: any) => push([m.method || m.name, m.count, m.revenue]));
        break;
      }
      case 'table-performance': {
        const tables: any[] = reportData.tables || reportData.items || [];
        push(['Mesa', 'Pedidos', 'Receita', 'Ticket Médio']);
        tables.forEach((t: any) => push([t.name, t.orders_count, t.revenue, t.average_order_value]));
        break;
      }
      case 'hourly-sales': {
        const hours: any[] = reportData.hours || reportData.items || [];
        push(['Hora', 'Pedidos', 'Receita']);
        hours.forEach((h: any) => push([h.hour || h.label, h.orders || h.orders_count, h.revenue]));
        break;
      }
    }

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedReport}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderHeaderActions = () => (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
      <FormControl sx={{ minWidth: 220 }}>
        <InputLabel>Tipo de Relatório</InputLabel>
        <Select value={selectedReport} label="Tipo de Relatório" onChange={(e) => setSelectedReport(e.target.value as ReportKey)}>
          {reportTypes.map((type) => (
            <MenuItem key={type.key} value={type.key}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{type.icon}{type.label}</Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
        <Chip label="Hoje" color={preset === 'today' ? 'primary' : 'default'} onClick={() => setPreset('today')} variant={preset === 'today' ? 'filled' : 'outlined'} />
        <Chip label="7 dias" color={preset === '7d' ? 'primary' : 'default'} onClick={() => setPreset('7d')} variant={preset === '7d' ? 'filled' : 'outlined'} />
        <Chip label="30 dias" color={preset === '30d' ? 'primary' : 'default'} onClick={() => setPreset('30d')} variant={preset === '30d' ? 'filled' : 'outlined'} />
        <Chip label="Personalizado" color={preset === 'custom' ? 'primary' : 'default'} onClick={() => setPreset('custom')} variant={preset === 'custom' ? 'filled' : 'outlined'} />
      </Stack>

      {/* Date controls */}
      {selectedReport === 'daily-sales' || selectedReport === 'hourly-sales' ? (
        <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 180 }} />
      ) : selectedReport === 'waiter-commission' ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField label="Início" type="date" value={startDate} onChange={(e) => { setPreset('custom'); setStartDate(e.target.value); }} InputLabelProps={{ shrink: true }} />
          <TextField label="Fim" type="date" value={endDate} onChange={(e) => { setPreset('custom'); setEndDate(e.target.value); }} InputLabelProps={{ shrink: true }} />
        </Stack>
      ) : (
        <TextField label="Período (dias)" type="number" value={days} onChange={(e) => { setPreset('custom'); setDays(parseInt(e.target.value || '0', 10)); }} sx={{ minWidth: 160 }} />
      )}

      <Button onClick={generateReport} variant="contained" disabled={loading} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        {loading ? <CircularProgress size={20} color="inherit" /> : 'Gerar'}
      </Button>
      <Button onClick={handleExportCsv} variant="outlined" startIcon={<DownloadIcon />} disabled={!reportData}>
        Exportar CSV
      </Button>
    </Stack>
  );

  const renderFilters = () => (
    <Card sx={{ mb: 3, border: '1px solid rgba(0,0,0,0.05)' }}>
      <CardContent>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
            <FilterAltIcon sx={{ color: '#667eea' }} /> Filtros
          </Typography>

          {/* Categoria */}
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel>Categorias</InputLabel>
            <Select
              multiple
              value={selectedCategoryIds}
              label="Categorias"
              onChange={(e) => setSelectedCategoryIds(e.target.value as number[])}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {(selected as number[]).slice(0, 3).map((id) => (
                    <Chip key={id} label={categories.find((c) => c.id === id)?.name || id} size="small" />
                  ))}
                  {(selected as number[]).length > 3 && <Chip label={`+${(selected as number[]).length - 3}`} size="small" />}
                </Box>
              )}
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Produto */}
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel>Produtos</InputLabel>
            <Select
              multiple
              value={selectedProductIds}
              label="Produtos"
              onChange={(e) => setSelectedProductIds(e.target.value as number[])}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {(selected as number[]).slice(0, 3).map((id) => (
                    <Chip key={id} label={products.find((p) => p.id === id)?.name || id} size="small" />
                  ))}
                  {(selected as number[]).length > 3 && <Chip label={`+${(selected as number[]).length - 3}`} size="small" />}
                </Box>
              )}
            >
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Garçom */}
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel>Garçons</InputLabel>
            <Select
              multiple
              value={selectedWaiters}
              label="Garçons"
              onChange={(e) => setSelectedWaiters(e.target.value as string[])}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {(selected as string[]).slice(0, 3).map((username) => (
                    <Chip key={username} label={username} size="small" />
                  ))}
                  {(selected as string[]).length > 3 && <Chip label={`+${(selected as string[]).length - 3}`} size="small" />}
                </Box>
              )}
            >
              {users
                .filter((u) => (u.role || '').toLowerCase().includes('wait'))
                .map((u) => (
                  <MenuItem key={u.username} value={u.username}>{u.username}</MenuItem>
                ))}
            </Select>
          </FormControl>

          {/* Métodos de pagamento */}
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel>Métodos de Pagamento</InputLabel>
            <Select
              multiple
              value={selectedPaymentMethods}
              label="Métodos de Pagamento"
              onChange={(e) => setSelectedPaymentMethods(e.target.value as string[])}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {(selected as string[]).slice(0, 4).map((m) => (
                    <Chip key={m} label={m} size="small" />
                  ))}
                  {(selected as string[]).length > 4 && <Chip label={`+${(selected as string[]).length - 4}`} size="small" />}
                </Box>
              )}
            >
              {['cash', 'debit', 'credit', 'pix', 'other'].map((m) => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1 }} />

          {activeFilters.length > 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              {activeFilters.map((f, idx) => (
                <Chip key={idx} label={f.label} onDelete={f.onDelete} color="primary" variant="outlined" />
              ))}
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              <Button onClick={() => { setSelectedCategoryIds([]); setSelectedProductIds([]); setSelectedWaiters([]); setSelectedPaymentMethods([]); }}>
                Limpar filtros
              </Button>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  const renderDailySales = () => (
    <Box>
      <Box sx={{
        mb: 3,
        display: 'grid',
        gap: 3,
        gridTemplateColumns: {
          xs: '1fr',
          sm: '1fr 1fr',
          md: 'repeat(4, 1fr)'
        }
      }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total de Pedidos
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#8b5cf6' }}>
              {reportData?.total_orders ?? '-'}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Receita Total
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#10b981' }}>
              {reportData ? formatCurrency(reportData.total_revenue || 0) : '-'}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Receita com Taxa
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#f59e0b' }}>
              {reportData ? formatCurrency(reportData.total_revenue_with_tax || 0) : '-'}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Ticket Médio
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#ef4444' }}>
              {reportData ? formatCurrency(reportData.average_order_value || 0) : '-'}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Produtos Mais Vendidos
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Produto</TableCell>
                  <TableCell align="right">Quantidade</TableCell>
                  <TableCell align="right">Receita</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData?.top_products?.map((product: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell align="right">{product.quantity}</TableCell>
                    <TableCell align="right">{formatCurrency(product.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderTopProducts = () => (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Resumo do Período
          </Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
            <Typography variant="body2" color="textSecondary">
              Período: {reportData?.period}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Vendido: {reportData?.total_quantity_sold} unidades
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Receita Total: {reportData ? formatCurrency(reportData.total_revenue_from_products || 0) : '-'}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Produtos Mais Vendidos
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Produto</TableCell>
                  <TableCell align="right">Quantidade Vendida</TableCell>
                  <TableCell align="right">Receita</TableCell>
                  <TableCell align="right">% do Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData?.products?.map((product: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell align="right">{product.quantity_sold}</TableCell>
                    <TableCell align="right">{formatCurrency(product.revenue)}</TableCell>
                    <TableCell align="right">
                      {reportData?.total_revenue_from_products ? ((product.revenue / reportData.total_revenue_from_products) * 100).toFixed(1) : '0.0'}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderWaiterCommission = () => (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Resumo de Comissões
          </Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
            <Typography variant="body2" color="textSecondary">
              Período: {reportData?.period}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total de Pedidos: {reportData?.total_orders}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Receita Total: {reportData ? formatCurrency(reportData.total_revenue || 0) : '-'}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Comissões por Garçom
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Garçom</TableCell>
                  <TableCell align="right">Pedidos</TableCell>
                  <TableCell align="right">Receita</TableCell>
                  <TableCell align="right">Comissão</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData?.waiters?.map((waiter: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{waiter.username}</TableCell>
                    <TableCell align="right">{waiter.orders_count}</TableCell>
                    <TableCell align="right">{formatCurrency(waiter.revenue)}</TableCell>
                    <TableCell align="right">{formatCurrency(waiter.commission)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderFallback = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Dados do Relatório
        </Typography>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
          {JSON.stringify(reportData, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (selectedReport) {
      case 'daily-sales':
        return renderDailySales();
      case 'top-products':
        return renderTopProducts();
      case 'waiter-commission':
        return renderWaiterCommission();
      default:
        return renderFallback();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Relatórios
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box>{renderHeaderActions()}</Box>
        </CardContent>
      </Card>

      {renderFilters()}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      ) : reportData ? (
        renderReportContent()
      ) : (
        <Card>
          <CardContent>
            <Typography color="textSecondary">Selecione opções e clique em "Gerar" para visualizar o relatório.</Typography>
          </CardContent>
        </Card>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportsPanel; 