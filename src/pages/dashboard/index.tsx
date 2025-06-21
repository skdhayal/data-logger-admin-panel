import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '@/utils/api';
import Cookies from 'js-cookie';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  totalCompanies: number;
  totalDevices: number;
  activeDevices: number;
  totalUsers: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    totalDevices: 0,
    activeDevices: 0,
    totalUsers: 0,
  });

  const [deviceData, setDeviceData] = useState<any>({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    // Check if user is authenticated
    const token = Cookies.get('accessToken');
    if (!token) {
      router.replace('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await api.get('/companies/stats');
        setStats(response.data);
      } catch (error: any) {
        console.error('Failed to fetch dashboard stats:', error);
        if (error.response?.status === 401) {
          router.replace('/login');
        }
      }
    };

    const fetchDeviceData = async () => {
      try {
        const response = await api.get('/devices/stats');
        setDeviceData(response.data);
      } catch (error: any) {
        console.error('Failed to fetch device data:', error);
        if (error.response?.status === 401) {
          router.replace('/login');
        }
      }
    };

    fetchStats();
    fetchDeviceData();

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchStats();
      fetchDeviceData();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [router]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Companies
              </Typography>
              <Typography variant="h5">{stats.totalCompanies}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Devices
              </Typography>
              <Typography variant="h5">{stats.totalDevices}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Devices
              </Typography>
              <Typography variant="h5">{stats.activeDevices}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h5">{stats.totalUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Device Data Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Device Data Overview
            </Typography>
            <Box sx={{ height: 400 }}>
              <Line
                data={deviceData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 