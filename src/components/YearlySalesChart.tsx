import React from 'react';
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
import { YearlyData } from '../types/SalesData';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface YearlySalesChartProps {
  data: YearlyData;
  metric: 'sales' | 'count';
}

const YearlySalesChart: React.FC<YearlySalesChartProps> = ({ data, metric }) => {
  const years = ['2023', '2024', '2025'];
  const colors = {
    '2023': 'rgba(59, 130, 246, 1)',   // blue-500
    '2024': 'rgba(16, 185, 129, 1)',   // emerald-500
    '2025': 'rgba(245, 101, 101, 1)',  // red-400
  };

  // 全ての日付を取得してソート
  const allDates = new Set<string>();
  years.forEach(year => {
    if (data[year]) {
      data[year].forEach(d => allDates.add(d.date));
    }
  });
  const sortedDates = Array.from(allDates).sort();

  // 月単位でラベルを作成（表示用）
  const monthlyLabels = sortedDates.filter((date, index) => {
    const currentDate = parseISO(date);
    if (index === 0) return true;
    const prevDate = parseISO(sortedDates[index - 1]);
    return currentDate.getMonth() !== prevDate.getMonth();
  }).map(date => format(parseISO(date), 'yyyy/MM'));

  const datasets = years.map(year => {
    const yearData = data[year] || [];
    const dataMap = new Map(yearData.map(d => [d.date, d[metric]]));
    
    return {
      label: `${year}年`,
      data: sortedDates.map(date => dataMap.get(date) || 0),
      borderColor: colors[year as keyof typeof colors],
      backgroundColor: colors[year as keyof typeof colors],
      tension: 0.1,
      pointRadius: 1,
      pointHoverRadius: 5,
    };
  });

  const chartData = {
    labels: sortedDates.map(date => format(parseISO(date), 'MM/dd')),
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
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
        text: `年別推移 - ${metric === 'sales' ? '売上金額' : '件数'}`,
        font: {
          family: 'Noto Sans JP',
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            const index = context[0].dataIndex;
            return format(parseISO(sortedDates[index]), 'yyyy/MM/dd');
          },
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
      x: {
        display: true,
        title: {
          display: true,
          text: '日付',
          font: {
            family: 'Noto Sans JP',
          },
        },
        ticks: {
          maxTicksLimit: 12,
          font: {
            family: 'Noto Sans JP',
          },
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: metric === 'sales' ? '売上金額' : '件数',
          font: {
            family: 'Noto Sans JP',
          },
        },
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
    },
  };

  return (
    <div className="h-96 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default YearlySalesChart;