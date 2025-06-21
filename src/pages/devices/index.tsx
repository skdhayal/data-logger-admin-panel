import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  TablePagination,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { NextPage } from 'next';
import type { ChangeEvent } from 'react';
import api, { handleApiError } from '@/utils/api';

interface Device {
  id: string;
  type: string;
  status: 'online' | 'offline' | 'maintenance';
  location: string;
  physical_address: string;
  company_id: string;
  push_interval: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: string;
  name: string;
}

const Devices: NextPage = function Devices() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    companyId: '',
    status: '',
  });

  const fetchDevices = async () => {
    try {
      const response = await api.get('/devices');
      setDevices(response.data);
      setError(null);
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data);
    } catch (error) {
      setError('Failed to fetch companies');
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchCompanies();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;

    try {
      await api.delete(`/devices/${id}`);
      setDevices(devices.filter(device => device.id !== id));
      setError(null);
    } catch (error) {
      setError(handleApiError(error));
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredDevices = devices.filter(device =>
    device.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.physical_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedDevices = filteredDevices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Devices</Typography>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            size="small"
            label="Search devices"
            variant="outlined"
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            sx={{ width: '200px' }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push('/devices/new')}
          >
            Add Device
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell 
                  width="20%" 
                  sx={{ 
                    py: 1,
                    backgroundColor: 'background.paper',
                    fontWeight: 'bold'
                  }}
                >
                  Type
                </TableCell>
                <TableCell 
                  width="25%" 
                  sx={{ 
                    py: 1,
                    backgroundColor: 'background.paper',
                    fontWeight: 'bold'
                  }}
                >
                  Location
                </TableCell>
                <TableCell 
                  width="15%" 
                  sx={{ 
                    py: 1,
                    backgroundColor: 'background.paper',
                    fontWeight: 'bold'
                  }}
                >
                  Status
                </TableCell>
                <TableCell 
                  width="20%" 
                  sx={{ 
                    py: 1,
                    backgroundColor: 'background.paper',
                    fontWeight: 'bold'
                  }}
                >
                  Last Seen
                </TableCell>
                <TableCell 
                  width="20%" 
                  align="right"
                  sx={{ 
                    py: 1,
                    backgroundColor: 'background.paper',
                    fontWeight: 'bold'
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedDevices.map((device) => (
                <TableRow key={device.id} hover>
                  <TableCell sx={{ py: 1 }}>{device.type}</TableCell>
                  <TableCell sx={{ py: 1 }}>{device.location}</TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Chip
                      label={device.status}
                      color={
                        device.status === 'online'
                          ? 'success'
                          : device.status === 'maintenance'
                          ? 'warning'
                          : 'error'
                      }
                      size="small"
                      sx={{ height: 24 }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>{new Date(device.updated_at).toLocaleString()}</TableCell>
                  <TableCell align="right" sx={{ py: 1 }}>
                    <IconButton
                      color="primary"
                      onClick={() => router.push(`/devices/${device.id}`)}
                      size="small"
                      sx={{ p: 0.5 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(device.id)}
                      size="small"
                      sx={{ p: 0.5 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredDevices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ py: 1 }}
        />
      </Paper>
    </Box>
  );
};

export default Devices; 