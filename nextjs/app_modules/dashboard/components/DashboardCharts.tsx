import { Box, Paper, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { DashboardAnalytics } from '@/lib/users';
import { formatDate, STATUS_COLORS } from '../constants';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

interface DashboardChartsProps {
  analytics: DashboardAnalytics;
}

export function DashboardCharts({ analytics }: DashboardChartsProps) {
  const statusCounts = (analytics.recent_orders || []).reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusLabels = Object.keys(statusCounts);
  const statusData = Object.values(statusCounts);
  const dailyStats = analytics.daily_stats || [];

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Daily Orders (Last 30 Days)
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={{
                    labels: dailyStats.map((stat) => formatDate(stat.date)),
                    datasets: [
                      {
                        label: 'Orders',
                        data: dailyStats.map((stat) => stat.orders),
                        backgroundColor: '#38b2ac',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      x: {
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45,
                        },
                      },
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </motion.div>
        </Box>
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Daily Transaction Volume (Last 30 Days)
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line
                  data={{
                    labels: dailyStats.map((stat) => formatDate(stat.date)),
                    datasets: [
                      {
                        label: 'Transaction Volume',
                        data: dailyStats.map((stat) => stat.earnings),
                        borderColor: '#38b2ac',
                        backgroundColor: 'rgba(56, 178, 172, 0.1)',
                        fill: true,
                        tension: 0.4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      x: {
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45,
                        },
                      },
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return '₱' + value.toLocaleString();
                          },
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </motion.div>
        </Box>
      </Box>

      {statusLabels.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Order Status Distribution
                </Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Doughnut
                    data={{
                      labels: statusLabels.map(s => s.replace('_', ' ').toUpperCase()),
                      datasets: [
                        {
                          data: statusData,
                          backgroundColor: statusLabels.map(s => STATUS_COLORS[s as keyof typeof STATUS_COLORS] || '#9e9e9e'),
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                      },
                    }}
                  />
                </Box>
              </Paper>
            </motion.div>
          </Box>
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Order Status Summary
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {statusLabels.map((status) => (
                    <Box key={status} sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            bgcolor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#9e9e9e',
                          }}
                        />
                        <Typography variant="body1">
                          {status.replace('_', ' ').toUpperCase()}
                        </Typography>
                      </Box>
                      <Typography variant="h6">
                        {statusCounts[status]}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </motion.div>
          </Box>
        </Box>
      )}
    </>
  );
}

