import { useEffect, useState } from 'react';
import { Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import { getTables, getRooms, createTable } from '../config/api';

interface Table {
  id: number;
  name: string;
}
interface Room {
  id: number;
  number: string;
}

interface TableSelectorProps {
  onTableSelected: (table: Table) => void;
}

const TableSelector = ({ onTableSelected }: TableSelectorProps) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | ''>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getTables(false).then((data) => {
      // Ordena por created_at decrescente (mais recente primeiro)
      const sorted = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTables(sorted);
    });
    getRooms().then(setRooms);
  }, []);

  const handleSelectTable = () => {
    const table = tables.find(t => t.id === selectedTable);
    if (table) onTableSelected(table);
  };

  const handleCreateTable = async () => {
    setLoading(true);
    setError('');
    try {
      const table = await createTable(newTableName, selectedRoom ? Number(selectedRoom) : undefined);
      setTables(prev => [...prev, table]);
      setOpenDialog(false);
      setNewTableName('');
      setSelectedRoom('');
      onTableSelected(table);
    } catch (e) {
      setError('Erro ao criar mesa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Selecione uma mesa</Typography>
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="select-table-label">Mesa</InputLabel>
        <Select
          labelId="select-table-label"
          value={selectedTable}
          label="Mesa"
          onChange={(e) => setSelectedTable(e.target.value as number)}
        >
          {tables.map((table) => (
            <MenuItem key={table.id} value={table.id}>{table.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={handleSelectTable} disabled={!selectedTable}>Selecionar</Button>
        <Button variant="outlined" onClick={() => setOpenDialog(true)}>Criar nova mesa</Button>
      </Box>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Criar nova mesa</DialogTitle>
        <DialogContent>
          <TextField
            label="Nome da mesa"
            value={newTableName}
            onChange={e => setNewTableName(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth size="small">
            <InputLabel id="select-room-label">Quarto (opcional)</InputLabel>
            <Select
              labelId="select-room-label"
              value={selectedRoom}
              label="Quarto (opcional)"
              onChange={e => setSelectedRoom(e.target.value as number)}
            >
              <MenuItem value="">Nenhum</MenuItem>
              {rooms.map(room => (
                <MenuItem key={room.id} value={room.id}>Quarto {room.number}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreateTable} variant="contained" disabled={loading || !newTableName}>Criar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableSelector; 