import { useState, useEffect } from 'react';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api, { handleApiError } from '@/utils/api';

const roleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  permissions: z.object({
    devices: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }),
    companies: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }),
    users: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }),
  }),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: {
    devices: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
    };
    companies: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
    };
    users: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
    };
  };
}

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      permissions: {
        devices: { view: false, create: false, edit: false, delete: false },
        companies: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
      },
    },
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/roles');
      console.log('Roles API Response:', response.data); // Debug log
      
      if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error('Invalid response format: expected success and data array');
      }

      setRoles(response.data.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching roles:', error); // Debug log
      setError(handleApiError(error));
      setRoles([]); // Clear roles on error
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (role?: Role) => {
    if (role) {
      console.log('Editing role:', role); // Debug log
      setEditingRole(role);
      reset({
        name: role.name,
        description: role.description,
        permissions: role.permissions
      });
    } else {
      setEditingRole(null);
      reset({
        name: '',
        description: '',
        permissions: {
          devices: { view: false, create: false, edit: false, delete: false },
          companies: { view: false, create: false, edit: false, delete: false },
          users: { view: false, create: false, edit: false, delete: false },
        },
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingRole(null);
    reset();
  };

  const onSubmit = async (data: RoleFormData) => {
    try {
      console.log('Submitting role data:', data); // Debug log
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, data);
      } else {
        await api.post('/roles', data);
      }
      handleClose();
      fetchRoles();
    } catch (error) {
      console.error('Error submitting role:', error); // Debug log
      setError(handleApiError(error));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await api.delete(`/roles/${id}`);
        fetchRoles();
      } catch (error) {
        setError(handleApiError(error));
      }
    }
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
        <Typography variant="h4">Roles</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpen()}>
          Add Role
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(role)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(role.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingRole ? 'Edit Role' : 'Add Role'}
          </DialogTitle>
          <DialogContent>
            <TextField
              {...register('name')}
              label="Name"
              fullWidth
              margin="normal"
              error={!!errors.name}
              helperText={errors.name?.message}
              defaultValue={editingRole?.name}
            />

            <TextField
              {...register('description')}
              label="Description"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              error={!!errors.description}
              helperText={errors.description?.message}
              defaultValue={editingRole?.description}
            />

            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Permissions
            </Typography>

            {/* Devices Permissions */}
            <Typography variant="subtitle1" sx={{ mt: 2 }}>Devices</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    {...register('permissions.devices.view')}
                    defaultChecked={editingRole?.permissions.devices.view}
                  />
                }
                label="View"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    {...register('permissions.devices.create')}
                    defaultChecked={editingRole?.permissions.devices.create}
                  />
                }
                label="Create"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    {...register('permissions.devices.edit')}
                    defaultChecked={editingRole?.permissions.devices.edit}
                  />
                }
                label="Edit"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    {...register('permissions.devices.delete')}
                    defaultChecked={editingRole?.permissions.devices.delete}
                  />
                }
                label="Delete"
              />
            </Box>

            {/* Companies Permissions */}
            <Typography variant="subtitle1" sx={{ mt: 2 }}>Companies</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    {...register('permissions.companies.view')}
                    defaultChecked={editingRole?.permissions.companies.view}
                  />
                }
                label="View"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    {...register('permissions.companies.create')}
                    defaultChecked={editingRole?.permissions.companies.create}
                  />
                }
                label="Create"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    {...register('permissions.companies.edit')}
                    defaultChecked={editingRole?.permissions.companies.edit}
                  />
                }
                label="Edit"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    {...register('permissions.companies.delete')}
                    defaultChecked={editingRole?.permissions.companies.delete}
                  />
                }
                label="Delete"
              />
            </Box>

            {/* Users Permissions */}
            <Typography variant="subtitle1" sx={{ mt: 2 }}>Users</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    {...register('permissions.users.view')}
                    defaultChecked={editingRole?.permissions.users.view}
                  />
                }
                label="View"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    {...register('permissions.users.create')}
                    defaultChecked={editingRole?.permissions.users.create}
                  />
                }
                label="Create"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    {...register('permissions.users.edit')}
                    defaultChecked={editingRole?.permissions.users.edit}
                  />
                }
                label="Edit"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    {...register('permissions.users.delete')}
                    defaultChecked={editingRole?.permissions.users.delete}
                  />
                }
                label="Delete"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingRole ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
} 