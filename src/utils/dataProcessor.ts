import { SalesData, SalesRecord, YearlyData, ProcessedData, ComparisonData } from '../types/SalesData';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, isWithinInterval, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

export const loadSalesData = async (filename: string): Promise<SalesData | null> => {
  try {
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading sales data:', error);
    return null;
  }
};

export const processSalesData = (salesData: SalesData): YearlyData => {
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
  
  return yearlyData;
};

export const calculateComparisons = (yearlyData: YearlyData, baseDate: Date): ComparisonData => {
  const result: ComparisonData = {
    daily: {},
    weekly: {},
    monthly: {}
  };
  
  const years = ['2023', '2024', '2025'];
  
  years.forEach(year => {
    const targetDate = new Date(baseDate);
    targetDate.setFullYear(parseInt(year));
    
    const yearData = yearlyData[year] || [];
    
    // 当日比較
    const dailyData = yearData.find(d => d.date === format(targetDate, 'yyyy-MM-dd'));
    result.daily[year] = dailyData ? { sales: dailyData.sales, count: dailyData.count } : { sales: 0, count: 0 };
    
    // 週間比較（前日までの1週間）
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // 月曜始まり
    const weekEnd = targetDate;
    const weeklyData = yearData.filter(d => {
      const date = parseISO(d.date);
      return isWithinInterval(date, { start: weekStart, end: weekEnd });
    });
    result.weekly[year] = weeklyData.reduce(
      (acc, d) => ({ sales: acc.sales + d.sales, count: acc.count + d.count }),
      { sales: 0, count: 0 }
    );
    
    // 月間比較
    const monthStart = startOfMonth(targetDate);
    const monthEnd = targetDate;
    const monthlyData = yearData.filter(d => {
      const date = parseISO(d.date);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    });
    result.monthly[year] = monthlyData.reduce(
      (acc, d) => ({ sales: acc.sales + d.sales, count: acc.count + d.count }),
      { sales: 0, count: 0 }
    );
  });
  
  return result;
};