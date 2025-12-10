'use client';

import { Box, Typography } from '@mui/material';
import { Line, Bar } from 'react-chartjs-2';
import { User, UserAnalytics } from '@/lib/users';

interface UserAnalyticsChartsProps {
  user: User;
  analytics: UserAnalytics;
}

export function UserAnalyticsCharts({ user, analytics }: UserAnalyticsChartsProps) {
  const chartData = analytics.recent_orders
    .slice()
    .reverse()
    .map((order) => ({
      date: new Date(order.created_at).toLocaleDateString(),
      amount: order.total_amount,
    }));

  const productData = analytics.products_bought
    .slice(0, 10)
    .map((p) => ({
      name: p.product_name,
      value: user.role === 'supplier' ? (p.stock || 0) : (p.total_spent || 0),
      label: user.role === 'supplier' ? 'Stock' : 'Spent',
    }));

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <Typography variant="h6" gutterBottom>
            {user.role === 'supplier' ? 'Earnings Over Time' : 'Spend Over Time'}
          </Typography>
          <Box sx={{ height: 300 }}>
            <Line
              data={{
                labels: chartData.map((d) => d.date),
                datasets: [
                  {
                    label: user.role === 'supplier' ? 'Earnings' : 'Spend',
                    data: chartData.map((d) => d.amount),
                    borderColor: '#8884d8',
                    backgroundColor: 'rgba(136, 132, 216, 0.1)',
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                  },
                },
              }}
            />
          </Box>
        </Box>
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <Typography variant="h6" gutterBottom>
            {user.role === 'supplier' ? 'Product Stock Levels' : 'Top Products'}
          </Typography>
          <Box sx={{ height: 300 }}>
            <Bar
              data={{
                labels: productData.map((d) => d.name),
                datasets: [
                  {
                    label: user.role === 'supplier' ? 'Stock' : 'Spent',
                    data: productData.map((d) => d.value),
                    backgroundColor: '#82ca9d',
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                  },
                },
                scales: {
                  x: {
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45,
                    },
                  },
                },
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

