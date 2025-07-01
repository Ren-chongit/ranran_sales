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
  baseDate: Date;
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ data, type, metric, baseDate }) => {
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

  // 期間文字列を生成
  const getPeriodString = () => {
    const formatDate = (date: Date) => {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}/${day}`;
    };

    if (type === 'daily') {
      return `（${formatDate(baseDate)}）`;
    } else if (type === 'weekly') {
      // 週間：基準日を含む過去7日間（同月内のみ）
      const startDate = new Date(baseDate);
      const baseMonth = baseDate.getMonth();
      
      // 最大7日前から開始するが、同月内のみ
      for (let i = 6; i >= 0; i--) {
        const checkDate = new Date(baseDate);
        checkDate.setDate(checkDate.getDate() - i);
        if (checkDate.getMonth() === baseMonth) {
          startDate.setDate(checkDate.getDate());
          break;
        }
      }
      
      return `（${formatDate(startDate)} to ${formatDate(baseDate)}）`;
    } else {
      // 月間：月初から基準日まで
      const startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
      return `（${formatDate(startDate)} to ${formatDate(baseDate)}）`;
    }
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
        text: `${type === 'daily' ? '当日' : type === 'weekly' ? '週間' : '月間'}比較 - ${metric === 'sales' ? '売上金額' : '件数'}${getPeriodString()}`,
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