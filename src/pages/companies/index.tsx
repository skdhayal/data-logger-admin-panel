import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api, { handleApiError } from '@/utils/api';

const companySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  status: z.enum(['active', 'inactive']),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface Company {
  id: string;
  name: string;
  parentId?: string;
  status: 'active' | 'inactive';
  address: string;
  contactPerson: string;
  createdAt: string;
  updatedAt: string;
}

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      status: 'active',
    },
  });

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'address', headerName: 'Address', flex: 1 },
    { field: 'contactPerson', headerName: 'Contact Person', flex: 1 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      renderCell: (params) => (
        <Typography
          color={params.value === 'active' ? 'success.main' : 'error.main'}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      flex: 1,
      valueFormatter: (params: any) => {
        if (!params?.value) return '-';
        try {
          const date = new Date(params.value);
          return isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
        } catch (error) {
          return '-';
        }
      },
    },
  ];

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const onSubmit = async (data: CompanyFormData) => {
    try {
      await api.post('/companies', data);
      handleClose();
      fetchCompanies();
    } catch (error) {
      console.error('Failed to create company:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Companies</Typography>
        <Button variant="contained" onClick={handleOpen}>
          Add Company
        </Button>
      </Box>

      <DataGrid
        rows={companies}
        columns={columns}
        loading={loading}
        autoHeight
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10 },
          },
        }}
        pageSizeOptions={[10]}
        disableRowSelectionOnClick
      />

      <Dialog open={open} onClose={handleClose}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>Add New Company</DialogTitle>
          <DialogContent>
            <TextField
              {...register('name')}
              label="Name"
              fullWidth
              margin="normal"
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              {...register('address')}
              label="Address"
              fullWidth
              margin="normal"
              error={!!errors.address}
              helperText={errors.address?.message}
            />
            <TextField
              {...register('contactPerson')}
              label="Contact Person"
              fullWidth
              margin="normal"
              error={!!errors.contactPerson}
              helperText={errors.contactPerson?.message}
            />
            <TextField
              {...register('status')}
              select
              label="Status"
              fullWidth
              margin="normal"
              error={!!errors.status}
              helperText={errors.status?.message}
              SelectProps={{
                native: true,
              }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
} 