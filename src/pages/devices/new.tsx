import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api, { handleApiError } from '@/utils/api';

const deviceSchema = z.object({
  type: z.string().min(2, 'Type must be at least 2 characters').max(50),
  company_id: z.string().min(1, 'Company is required'),
  status: z.enum(['online', 'offline', 'maintenance']).default('offline'),
  location: z.string().min(2, 'Location must be at least 2 characters').max(255),
  physical_address: z.string().min(5, 'Physical address must be at least 5 characters').max(1000),
  payload_schema: z.record(z.unknown()).default({}),
  push_interval: z.number().int().positive().default(60),
  enabled: z.boolean().default(true),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

interface Company {
  id: string;
  name: string;
}

export default function NewDevice() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      status: 'offline',
      payload_schema: {},
      push_interval: 60,
      enabled: true,
    }
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get('/companies');
        setCompanies(response.data);
      } catch (error) {
        setError('Failed to fetch companies');
      }
    };

    fetchCompanies();
  }, []);

  const onSubmit = async (data: DeviceFormData) => {
    try {
      setLoading(true);
      await api.post('/devices', data);
      router.push('/devices');
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Add New Device
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            label="Device Type"
            {...register('type')}
            error={!!errors.type}
            helperText={errors.type?.message}
            margin="normal"
          />

          <TextField
            fullWidth
            select
            label="Company"
            {...register('company_id')}
            error={!!errors.company_id}
            helperText={errors.company_id?.message}
            margin="normal"
          >
            {companies.map((company) => (
              <MenuItem key={company.id} value={company.id}>
                {company.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            select
            label="Status"
            {...register('status')}
            error={!!errors.status}
            helperText={errors.status?.message}
            margin="normal"
            defaultValue="offline"
          >
            <MenuItem value="online">Online</MenuItem>
            <MenuItem value="offline">Offline</MenuItem>
            <MenuItem value="maintenance">Maintenance</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Location"
            {...register('location')}
            error={!!errors.location}
            helperText={errors.location?.message}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Physical Address"
            {...register('physical_address')}
            error={!!errors.physical_address}
            helperText={errors.physical_address?.message}
            margin="normal"
          />

          <TextField
            fullWidth
            type="number"
            label="Push Interval (seconds)"
            {...register('push_interval', { valueAsNumber: true })}
            error={!!errors.push_interval}
            helperText={errors.push_interval?.message}
            margin="normal"
          />

          <FormControlLabel
            control={
              <Switch
                {...register('enabled')}
                defaultChecked
              />
            }
            label="Enabled"
            sx={{ mt: 2 }}
          />

          <Box mt={3} display="flex" gap={2}>
            <Button
              variant="outlined"
              onClick={() => router.push('/devices')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Device'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
} 