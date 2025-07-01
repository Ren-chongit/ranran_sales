import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import SimpleAuth from './components/SimpleAuth';

// Chart.jsの登録
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin);

// 型定義を直接ここに記述
interface SalesRecord {
  date: string;
  booking_no: string;
  amount: number;
}

interface SalesData {
  generated_at: string;
  total_records: number;
  sales_data: SalesRecord[];
}

interface ProcessedData {
  date: string;
  sales: number;
  count: number;
}

interface YearlyData {
  [year: string]: ProcessedData[];
}

interface ComparisonData {
  daily: {
    [year: string]: { sales: number; count: number };
  };
  weekly: {
    [year: string]: { sales: number; count: number };
  };
  monthly: {
    [year: string]: { sales: number; count: number };
  };
}

// データ処理関数
const processSalesData = (salesData: SalesData): YearlyData => {
  console.log('データ処理開始:', salesData.sales_data.length, '件');
  
  const yearlyData: YearlyData = {};
  
  // 日付別に集計
  const dailyAggregation: { [key: string]: { sales: number; count: number } } = {};
  
  salesData.sales_data.forEach((record: SalesRecord) => {
    const dateKey = record.date;
    if (!dailyAggregation[dateKey]) {
      dailyAggregation[dateKey] = { sales: 0, count: 0 };
    }
    dailyAggregation[dateKey].sales += record.amount;
    dailyAggregation[dateKey].count += 1;
  });
  
  console.log('日付別集計完了:', Object.keys(dailyAggregation).length, '日分');
  
  // 年別に整理
  Object.entries(dailyAggregation).forEach(([date, data]) => {
    const year = date.substring(0, 4);
    if (!yearlyData[year]) {
      yearlyData[year] = [];
    }
    yearlyData[year].push({
      date,
      sales: data.sales,
      count: data.count
    });
  });
  
  // 日付順にソート
  Object.keys(yearlyData).forEach(year => {
    yearlyData[year].sort((a, b) => a.date.localeCompare(b.date));
  });
  
  console.log('年別整理完了:', {
    '2023': yearlyData['2023']?.length || 0,
    '2024': yearlyData['2024']?.length || 0,
    '2025': yearlyData['2025']?.length || 0
  });
  
  return yearlyData;
};

const calculateComparisons = (yearlyData: YearlyData, baseDate: Date): ComparisonData => {
  console.log('比較計算開始:', baseDate);
  
  const result: ComparisonData = {
    daily: {},
    weekly: {},
    monthly: {}
  };
  
  const years = ['2023', '2024', '2025'];
  
  years.forEach(year => {
    const yearData = yearlyData[year] || [];
    console.log(`${year}年のデータ件数:`, yearData.length);
    
    // 基準日の月日を取得
    const baseMonth = baseDate.getMonth() + 1; // 1-12
    const baseDay = baseDate.getDate();
    
    // 対象年の同じ月日を作成
    const targetDateStr = `${year}-${baseMonth.toString().padStart(2, '0')}-${baseDay.toString().padStart(2, '0')}`;
    console.log(`${year}年の対象日 ${targetDateStr} のデータ検索中...`);
    
    // デバッグ：その年の6月のデータを確認
    const juneData = yearData.filter(d => d.date.startsWith(`${year}-06`));
    console.log(`${year}年6月のデータ:`, juneData.length, '件');
    if (juneData.length > 0) {
      console.log(`${year}年6月の日付範囲:`, juneData[0].date, '～', juneData[juneData.length - 1].date);
    }
    
    // 当日比較
    const dailyData = yearData.find(d => d.date === targetDateStr);
    console.log(`${year}年 ${targetDateStr}:`, dailyData || 'データなし');
    result.daily[year] = dailyData ? { sales: dailyData.sales, count: dailyData.count } : { sales: 0, count: 0 };
    
    // 週間計算（基準日を含む過去7日間、同月内のみ）
    const weeklyTotal = { sales: 0, count: 0 };
    for (let i = 6; i >= 0; i--) {
      const date = new Date(parseInt(year), baseMonth - 1, baseDay - i);
      if (date.getMonth() === baseMonth - 1) { // 同じ月内のみ
        const dateStr = `${year}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        const dayData = yearData.find(d => d.date === dateStr);
        if (dayData) {
          weeklyTotal.sales += dayData.sales;
          weeklyTotal.count += dayData.count;
        }
      }
    }
    result.weekly[year] = weeklyTotal;
    
    // 月間計算（月初から基準日まで）
    const monthlyTotal = { sales: 0, count: 0 };
    for (let day = 1; day <= baseDay; day++) {
      const dateStr = `${year}-${baseMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayData = yearData.find(d => d.date === dateStr);
      if (dayData) {
        monthlyTotal.sales += dayData.sales;
        monthlyTotal.count += dayData.count;
      }
    }
    result.monthly[year] = monthlyTotal;
    
    console.log(`${year}年計算結果:`, {
      daily: result.daily[year],
      weekly: result.weekly[year], 
      monthly: result.monthly[year]
    });
    
    // デバッグ: 6月1日の場合の詳細ログ
    if (baseMonth === 6 && baseDay === 1) {
      console.log(`${year}年6月1日デバッグ:`);
      console.log('週間対象日: 6/1のみ（同月内制限）');
      console.log('月間対象日: 6/1のみ');
    }
  });
  
  console.log('比較計算完了:', result);
  return result;
};

// 比較チャートコンポーネント
const ComparisonChart: React.FC<{
  data: ComparisonData;
  type: 'daily' | 'weekly' | 'monthly';
  metric: 'sales' | 'count';
}> = ({ data, type, metric }) => {
  const [isWideScreen, setIsWideScreen] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsWideScreen(window.innerWidth >= 640);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  const years = ['2023', '2024', '2025'];
  const colors = ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 101, 101, 0.8)'];
  const borderColors = ['rgba(59, 130, 246, 1)', 'rgba(16, 185, 129, 1)', 'rgba(245, 101, 101, 1)'];

  const chartData = {
    labels: years,
    datasets: [
      {
        label: metric === 'sales' ? '売上金額' : '件数',
        data: years.map(year => data[type][year]?.[metric] || 0),
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `${type === 'daily' ? '当日' : type === 'weekly' ? '週間' : '月間'}比較 - ${metric === 'sales' ? '売上金額' : '件数'}`,
      },
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
        },
      },
    },
  };

  return (
    <div>
      <div style={{ height: '300px', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <Bar data={chartData} options={options} />
      </div>
      <div className="mt-4">
        {!isWideScreen ? (
          /* スマホ表示（縦並び） */
          <div className="space-y-2 text-sm">
            {years.map((year) => {
              const yearData = data[type][year];
              return (
                <div key={year} className="flex justify-between">
                  <span className="text-gray-600">{year}年:</span>
                  <span className="font-medium">
                    {metric === 'sales' 
                      ? `¥${yearData.sales.toLocaleString()}` 
                      : `${yearData.count}件`
                    }
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* PC表示（横一列） */
          <div className="text-center text-sm">
            <span>
              {years.map((year, index) => {
                const yearData = data[type][year];
                const value = metric === 'sales' 
                  ? `¥${yearData.sales.toLocaleString()}` 
                  : `${yearData.count}件`;
                
                return (
                  <span key={year}>
                    <span className="text-gray-600">{year}年:</span>
                    <span className="font-medium">{value}</span>
                    {index < years.length - 1 && <span className="mx-3 text-gray-400"> / </span>}
                  </span>
                );
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// 月別比較チャートコンポーネント
const MonthlyComparisonChart: React.FC<{
  data: YearlyData;
  metric: 'sales' | 'count';
  month: number;
}> = ({ data, metric, month }) => {
  const years = ['2023', '2024', '2025'];
  const colors = ['rgba(59, 130, 246, 1)', 'rgba(16, 185, 129, 1)', 'rgba(245, 101, 101, 1)'];

  // 指定月のデータのみ抽出
  const monthlyData = years.map((year, index) => {
    const yearData = data[year] || [];
    const monthData = yearData.filter(d => {
      const date = new Date(d.date);
      return date.getMonth() + 1 === month;
    }).sort((a, b) => a.date.localeCompare(b.date));

    return {
      label: `${year}年`,
      data: monthData.map(d => ({ x: new Date(d.date).getDate(), y: d[metric] })),
      borderColor: colors[index],
      backgroundColor: colors[index],
      tension: 0.1,
      pointRadius: 3,
      pointHoverRadius: 6,
    };
  });

  const chartData = {
    datasets: monthlyData,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: `${month}月 年別比較 - ${metric === 'sales' ? '売上金額' : '件数'}`,
        padding: {
          bottom: 20,
        },
      },
    },
    scales: {
      x: {
        type: 'linear' as const,
        display: true,
        title: {
          display: true,
          text: '日',
        },
        min: 1,
        max: 31,
        ticks: {
          stepSize: 1,
          callback: function(value: any) {
            return `${value}日`;
          },
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: metric === 'sales' ? '売上金額' : '件数',
        },
        ticks: {
          callback: function(value: any) {
            if (metric === 'sales') {
              return `¥${value.toLocaleString()}`;
            } else {
              return `${value}件`;
            }
          },
        },
      },
    },
  };

  // 月合計値を計算
  const monthlyTotals = years.map(year => {
    const yearData = data[year] || [];
    const monthData = yearData.filter(d => {
      const date = new Date(d.date);
      return date.getMonth() + 1 === month;
    });
    return {
      year,
      total: monthData.reduce((sum, d) => sum + d[metric], 0)
    };
  });

  return (
    <div>
      <div style={{ height: '400px', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <Line data={chartData} options={options} />
      </div>
      <div className="text-center text-sm mt-4">
        <span>
          {monthlyTotals.map((yearTotal, index) => {
            const value = metric === 'sales' 
              ? `¥${yearTotal.total.toLocaleString()}` 
              : `${yearTotal.total}件`;
            
            return (
              <span key={yearTotal.year}>
                <span className="text-gray-600">{yearTotal.year}年:</span>
                <span className="font-medium">{value}</span>
                {index < monthlyTotals.length - 1 && <span className="mx-3 text-gray-400"> / </span>}
              </span>
            );
          })}
        </span>
      </div>
    </div>
  );
};

// 年別推移チャートコンポーネント
const YearlySalesChart: React.FC<{
  data: YearlyData;
  metric: 'sales' | 'count';
}> = ({ data, metric }) => {
  const chartRef = useRef<any>(null);
  const [dateRange, setDateRange] = useState({
    start: '2023-01-01',
    end: new Date().toISOString().substring(0, 10)
  });
  const [filteredData, setFilteredData] = useState<YearlyData>({});
  
  const years = ['2023', '2024', '2025'];
  const colors = ['rgba(59, 130, 246, 1)', 'rgba(16, 185, 129, 1)', 'rgba(245, 101, 101, 1)'];

  // データフィルタリング
  useEffect(() => {
    const filtered: YearlyData = {};
    years.forEach(year => {
      if (data[year]) {
        filtered[year] = data[year].filter(d => 
          d.date >= dateRange.start && d.date <= dateRange.end
        );
      }
    });
    setFilteredData(filtered);
  }, [data, dateRange]);

  // フィルタリングされたデータから日付を取得してソート
  const allDates = new Set<string>();
  years.forEach(year => {
    if (filteredData[year]) {
      filteredData[year].forEach(d => allDates.add(d.date));
    }
  });
  const sortedDates = Array.from(allDates).sort();

  const datasets = years.map((year, index) => {
    const yearData = filteredData[year] || [];
    const dataMap = new Map(yearData.map(d => [d.date, d[metric]]));
    
    return {
      label: `${year}年`,
      data: sortedDates.map(date => dataMap.get(date) || 0),
      borderColor: colors[index],
      backgroundColor: colors[index],
      tension: 0.1,
      pointRadius: 1,
    };
  });

  const chartData = {
    labels: sortedDates.map(date => {
      const d = new Date(date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }),
    datasets,
  };

  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  const setPresetRange = (months: number) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    setDateRange({
      start: start.toISOString().substring(0, 10),
      end: end.toISOString().substring(0, 10)
    });
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: `年別推移 - ${metric === 'sales' ? '売上金額' : '件数'}`,
        padding: {
          bottom: 10,
        },
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x' as const,
        },
        pan: {
          enabled: true,
          mode: 'x' as const,
        },
      },
    },
    scales: {
      x: {
        display: true,
        ticks: {
          maxTicksLimit: 20,
        },
      },
      y: {
        display: true,
        ticks: {
          callback: function(value: any) {
            if (metric === 'sales') {
              return `¥${value.toLocaleString()}`;
            } else {
              return `${value}件`;
            }
          },
        },
      },
    },
  } as const;

  return (
    <div>
      {/* 期間指定コントロール */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPresetRange(1)}
            className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
          >
            1ヶ月
          </button>
          <button
            onClick={() => setPresetRange(3)}
            className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
          >
            3ヶ月
          </button>
          <button
            onClick={() => setPresetRange(6)}
            className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
          >
            6ヶ月
          </button>
          <button
            onClick={() => setDateRange({ start: '2023-01-01', end: new Date().toISOString().substring(0, 10) })}
            className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
          >
            全期間
          </button>
          <button
            onClick={resetZoom}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            ズームリセット
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">開始日:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1 min-w-0"
              min="2023-01-01"
              max={dateRange.end}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">終了日:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1 min-w-0"
              min={dateRange.start}
              max={new Date().toISOString().substring(0, 10)}
            />
          </div>
        </div>
        
        <p className="text-xs text-gray-500">
          💡 ヒント: マウスホイールで拡大、ドラッグで移動、プリセットボタンで期間選択
        </p>
      </div>
      
      {/* グラフ */}
      <div style={{ height: '400px', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
};

function App() {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [yearlyData, setYearlyData] = useState<YearlyData>({});
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'sales' | 'count'>('sales');
  const [baseDate, setBaseDate] = useState<Date>(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    console.log('初期基準日設定:', yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0'));
    return yesterday;
  });
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  // const [availableDates, setAvailableDates] = useState<string[]>([]);

  const loadDataForDate = async (targetDate: Date) => {
    try {
      setLoading(true);
      setError(null);
      console.log('基準日変更:', targetDate);
      
      // 基準日に対応するJSONファイルを使用（ローカル時刻で計算）
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const latestDateStr = `${year}-${month}-${day}`;
      const filename = `${latestDateStr}.json`;
      
      console.log(`使用するデータファイル: ${filename}, 基準日: ${latestDateStr}`);
      
      // 既にデータが読み込まれている場合は再利用
      if (salesData && yearlyData && Object.keys(yearlyData).length > 0) {
        console.log('既存データを使用して比較計算のみ実行');
        const comparison = calculateComparisons(yearlyData, targetDate);
        setComparisonData(comparison);
        setLoading(false);
        return;
      }
      
      // 初回読み込みのみJSONファイルを取得
      const response = await fetch(`${import.meta.env.BASE_URL}data/${filename}`);
      
      if (!response.ok) {
        throw new Error(`データファイルが見つかりません: ${filename}`);
      }
      
      const data = await response.json();
      console.log('JSONデータ読み込み完了:', filename);
      setSalesData(data);
      
      // データ処理
      const processed = processSalesData(data);
      setYearlyData(processed);
      
      // 比較計算
      const comparison = calculateComparisons(processed, targetDate);
      setComparisonData(comparison);
      
    } catch (err) {
      console.error('エラー:', err);
      setError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataForDate(baseDate);
  }, [baseDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">データを読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto p-6">
          <div className="text-xl font-bold text-red-600 mb-4">エラーが発生しました</div>
          <p className="text-red-500 whitespace-pre-line mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              setBaseDate(yesterday);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            昨日のデータに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <SimpleAuth>
      <div className="min-h-screen bg-blue-50 pb-16">
        <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-6">管理ダッシュボード</h1>
        
        {salesData && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">データ概要</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                表示モード:
              </label>
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => {
                    setViewMode('daily');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'daily'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border'
                  }`}
                >
                  日別比較
                </button>
                <button
                  onClick={() => {
                    setViewMode('monthly');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'monthly'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border'
                  }`}
                >
                  月別比較
                </button>
              </div>

              {viewMode === 'daily' ? (
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    基準日を選択:
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      onClick={() => {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        setBaseDate(yesterday);
                      }}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      昨日
                    </button>
                    <button
                      onClick={() => {
                        const oneWeekAgo = new Date();
                        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                        setBaseDate(oneWeekAgo);
                      }}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      1週間前
                    </button>
                    <button
                      onClick={() => {
                        const oneMonthAgo = new Date();
                        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                        setBaseDate(oneMonthAgo);
                      }}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      1ヶ月前
                    </button>
                  </div>
                  <input
                    type="date"
                    value={`${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      setBaseDate(newDate);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="2023-01-01"
                    max={(() => {
                      const today = new Date();
                      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    })()}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    月を選択:
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>
                        {month}月
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <p className="text-gray-600">選択中の基準日: {`${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`}</p>
            <p className="text-gray-600">使用データファイル: {salesData.generated_at}</p>
            <p className="text-gray-500 text-sm mt-2">※ 売上データがない日は0として表示されます</p>
            <p className="text-gray-600">総レコード数: {salesData.total_records.toLocaleString()}件</p>
            <p className="text-green-600 font-bold mt-4">✅ データ読み込み成功!</p>
          </div>
        )}

        {/* メトリック選択 */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setSelectedMetric('sales')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedMetric === 'sales'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border'
              }`}
            >
              売上金額
            </button>
            <button
              onClick={() => setSelectedMetric('count')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedMetric === 'count'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border'
              }`}
            >
              件数
            </button>
          </div>
        </div>

        {viewMode === 'daily' ? (
          <>
            {/* 比較チャート */}
            {comparisonData && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <ComparisonChart data={comparisonData} type="daily" metric={selectedMetric} />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <ComparisonChart data={comparisonData} type="weekly" metric={selectedMetric} />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <ComparisonChart data={comparisonData} type="monthly" metric={selectedMetric} />
                </div>
              </div>
            )}

            {/* 年別推移チャート */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <YearlySalesChart data={yearlyData} metric={selectedMetric} />
            </div>

            {/* 数値サマリー */}
            {comparisonData && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">数値サマリー</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['daily', 'weekly', 'monthly'].map((period) => (
                    <div key={period} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">
                        {period === 'daily' ? '当日比較' : period === 'weekly' ? '週間比較' : '月間比較'}
                      </h3>
                      <div className="space-y-2">
                        {['2023', '2024', '2025'].map((year) => {
                          const data = comparisonData[period as keyof ComparisonData][year];
                          return (
                            <div key={year} className="flex justify-between">
                              <span className="text-gray-600">{year}年:</span>
                              <span className="font-medium">
                                {selectedMetric === 'sales' 
                                  ? `¥${data.sales.toLocaleString()}` 
                                  : `${data.count}件`
                                }
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* 月別比較モード */
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <MonthlyComparisonChart data={yearlyData} metric={selectedMetric} month={selectedMonth} />
          </div>
        )}
        
        {/* フッター */}
        <footer className="mt-16 py-8 border-t border-gray-200 bg-white">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-500 text-sm">
              © 2025 Claude Code OK. All rights reserved.
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Powered by Claude Code & React
            </p>
          </div>
        </footer>
        </div>
      </div>
    </SimpleAuth>
  );
}

export default App;