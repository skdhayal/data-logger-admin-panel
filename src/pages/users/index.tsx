import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api, { handleApiError } from '@/utils/api';

const userSchema = z.object({
  email: z.string().email('Invalid email'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['admin', 'manager', 'viewer']),
  status: z.enum(['active', 'inactive']),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  companyId: z.string().uuid('Invalid company ID'),
});

type UserFormData = z.infer<typeof userSchema>;

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'viewer';
  status: 'active' | 'inactive';
  companyId: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: 'viewer',
      status: 'active',
      companyId: '',
    }
  });

  // Watch the values to ensure they are properly updated
  const selectedRole = watch('role');
  const selectedStatus = watch('status');
  const selectedCompanyId = watch('companyId');

  const columns: GridColDef[] = [
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'firstName', headerName: 'First Name', flex: 1 },
    { field: 'lastName', headerName: 'Last Name', flex: 1 },
    { field: 'role', headerName: 'Role', flex: 1 },
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
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <IconButton onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      console.log('API Response:', response.data); // Debug log
      
      if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error('Invalid response format: expected success and data array');
      }

      // Map snake_case to camelCase and ensure each user has an id field
      const usersWithIds = response.data.data.map((user: any) => {
        console.log('Processing user:', user); // Debug log
        return {
          id: user.id || user._id,
          email: user.email,
          firstName: user.first_name || user.firstName,
          lastName: user.last_name || user.lastName,
          role: user.role,
          status: user.status,
          companyId: user.company_id || user.companyId,
          createdAt: user.created_at || user.createdAt,
          updatedAt: user.updated_at || user.updatedAt
        };
      });
      console.log('Processed users:', usersWithIds); // Debug log
      setUsers(usersWithIds);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err); // Debug log
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      setUsers([]); // Clear users on error
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      console.log('Companies API Response:', response.data); // Debug log
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid companies response format');
      }

      // Map the companies data to the expected format
      const formattedCompanies = response.data.map((company: any) => ({
        id: company.id,
        name: company.name
      }));
      
      console.log('Formatted companies:', formattedCompanies); // Debug log
      setCompanies(formattedCompanies);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(handleApiError(err));
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, []);

  const handleEdit = (user: User) => {
    console.log('Editing user:', user); // Debug log
    setSelectedUser(user);
    
    // Set form values individually to ensure they are properly updated
    setValue('email', user.email);
    setValue('firstName', user.firstName);
    setValue('lastName', user.lastName);
    setValue('role', user.role);
    setValue('status', user.status);
    setValue('companyId', user.companyId);
    
    console.log('Form values after setting:', {
      role: user.role,
      status: user.status,
      companyId: user.companyId
    }); // Debug log
    
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (err) {
        setError(handleApiError(err));
      }
    }
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      if (selectedUser) {
        // For updates, don't send password if it's not provided
        const updateData = { ...data };
        if (!updateData.password) {
          delete updateData.password;
        }
        await api.put(`/users/${selectedUser.id}`, updateData);
      } else {
        // For new users, password is required
        if (!data.password) {
          setError('Password is required for new users');
          return;
        }
        await api.post('/users', data);
      }
      setOpenDialog(false);
      reset();
      fetchUsers();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    reset({
      email: '',
      firstName: '',
      lastName: '',
      role: 'viewer',
      status: 'active',
      companyId: '',
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Users</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setSelectedUser(null);
            reset({});
            setOpenDialog(true);
          }}
        >
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 5, page: 0 },
            },
          }}
          pageSizeOptions={[5]}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{selectedUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              margin="normal"
            />
            <TextField
              fullWidth
              label="First Name"
              {...register('firstName')}
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Last Name"
              {...register('lastName')}
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
              margin="normal"
            />
            <TextField
              fullWidth
              select
              label="Role"
              value={selectedRole || ''}
              {...register('role')}
              error={!!errors.role}
              helperText={errors.role?.message}
              margin="normal"
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="viewer">Viewer</MenuItem>
            </TextField>
            <TextField
              fullWidth
              select
              label="Status"
              value={selectedStatus || ''}
              {...register('status')}
              error={!!errors.status}
              helperText={errors.status?.message}
              margin="normal"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
            {!selectedUser && (
              <TextField
                fullWidth
                type="password"
                label="Password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                margin="normal"
              />
            )}
            <TextField
              fullWidth
              select
              label="Company"
              value={selectedCompanyId || ''}
              {...register('companyId')}
              error={!!errors.companyId}
              helperText={errors.companyId?.message}
              margin="normal"
            >
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </TextField>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                {selectedUser ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
} 