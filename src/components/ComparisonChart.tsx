import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { ComparisonData } from '../types/SalesData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ComparisonChartProps {
  data: ComparisonData;
  type: 'daily' | 'weekly' | 'monthly';
  metric: 'sales' | 'count';
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ data, type, metric }) => {
  const years = ['2023', '2024', '2025'];
  const colors = {
    '2023': 'rgba(59, 130, 246, 0.8)',   // blue-500
    '2024': 'rgba(16, 185, 129, 0.8)',   // emerald-500
    '2025': 'rgba(245, 101, 101, 0.8)',  // red-400
  };
  
  const borderColors = {
    '2023': 'rgba(59, 130, 246, 1)',
    '2024': 'rgba(16, 185, 129, 1)',
    '2025': 'rgba(245, 101, 101, 1)',
  };

  const chartData = {
    labels: years,
    datasets: [
      {
        label: metric === 'sales' ? '売上金額' : '件数',
        data: years.map(year => data[type][year]?.[metric] || 0),
        backgroundColor: years.map(year => colors[year as keyof typeof colors]),
        borderColor: years.map(year => borderColors[year as keyof typeof borderColors]),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'Noto Sans JP',
          },
        },
      },
      title: {
        display: true,
        text: `${type === 'daily' ? '当日' : type === 'weekly' ? '週間' : '月間'}比較 - ${metric === 'sales' ? '売上金額' : '件数'}`,
        font: {
          family: 'Noto Sans JP',
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            if (metric === 'sales') {
              return `${context.dataset.label}: ¥${value.toLocaleString()}`;
            } else {
              return `${context.dataset.label}: ${value}件`;
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            if (metric === 'sales') {
              return `¥${value.toLocaleString()}`;
            } else {
              return `${value}件`;
            }
          },
          font: {
            family: 'Noto Sans JP',
          },
        },
      },
      x: {
        ticks: {
          font: {
            family: 'Noto Sans JP',
          },
        },
      },
    },
  };

  return (
    <div className="h-80 w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default ComparisonChart;