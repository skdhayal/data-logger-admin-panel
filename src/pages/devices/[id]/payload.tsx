import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';

const payloadSchema = z.object({
  schema: z.string().refine(
    (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid JSON schema' }
  ),
});

type PayloadFormData = z.infer<typeof payloadSchema>;

interface Device {
  id: string;
  name: string;
  payloadSchema: any;
}

export default function DevicePayload() {
  const router = useRouter();
  const { id } = router.query;
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PayloadFormData>({
    resolver: zodResolver(payloadSchema),
  });

  useEffect(() => {
    if (id) {
      fetchDevice();
    }
  }, [id]);

  const fetchDevice = async () => {
    try {
      const response = await axios.get(`/api/devices/${id}`);
      setDevice(response.data);
      reset({
        schema: JSON.stringify(response.data.payloadSchema, null, 2),
      });
    } catch (error) {
      setError('Failed to fetch device details');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PayloadFormData) => {
    try {
      const schema = JSON.parse(data.schema);
      await axios.patch(`/api/devices/${id}/payload-schema`, { schema });
      setSuccess('Payload schema updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to update payload schema');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!device) {
    return (
      <Box p={3}>
        <Alert severity="error">Device not found</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Payload Schema - {device.name}</Typography>
        <Button variant="outlined" onClick={() => router.back()}>
          Back to Device
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Typography variant="h6" gutterBottom>
            JSON Schema
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Define the expected payload structure for this device. Use JSON Schema format.
          </Typography>

          <TextField
            {...register('schema')}
            multiline
            rows={20}
            fullWidth
            error={!!errors.schema}
            helperText={errors.schema?.message}
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: 'monospace',
              },
            }}
          />

          <Box mt={2}>
            <Button type="submit" variant="contained" color="primary">
              Update Schema
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
} 