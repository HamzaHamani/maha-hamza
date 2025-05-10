import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useTheme } from 'next-themes'


ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PositiveAndNegativeBarChart = ({ data }) => {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

  
  if (!data) return null;
  

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: isDark ? '#ffffff' : '#000000' // Legend text
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: isDark ? '#ffffff' : '#000000' // X-axis text
        },
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' // X grid lines
        }
      },
      y: {
        ticks: {
          color: isDark ? '#ffffff' : '#000000' // Y-axis text
        },
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' // Y grid lines
        }
      }
    }
  }

  return (
    <div>
      <Bar data={data} options={chartOptions} />
    </div>
  );
};

export default PositiveAndNegativeBarChart;
