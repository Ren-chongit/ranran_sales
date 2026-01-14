import type { SalesData, SalesRecord, YearlyData, ComparisonData, ArchiveData } from '../types/SalesData';
import { startOfWeek, startOfMonth, format, isWithinInterval, parseISO } from 'date-fns';

const getComparisonYears = (baseDate: Date, yearlyData?: YearlyData): string[] => {
  const baseYear = baseDate.getFullYear();
  const fallback = Array.from({ length: 3 }, (_, i) => String(baseYear - 2 + i));
  if (!yearlyData || Object.keys(yearlyData).length === 0) {
    return fallback;
  }
  const availableYears = Object.keys(yearlyData).sort();
  if (availableYears.length === 0) {
    return fallback;
  }
  const availableSet = new Set(availableYears);
  if (fallback.every(year => availableSet.has(year))) {
    return fallback;
  }
  return availableYears.slice(-3);
};

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

/**
 * アーカイブデータと最新データを結合して読み込む
 * @param latestFilename 最新データのファイル名（例: "2025-10-22.json"）
 * @returns 結合されたSalesData
 */
export const loadCombinedSalesData = async (latestFilename: string): Promise<SalesData | null> => {
  try {
    const currentYear = new Date().getFullYear();
    const archiveYears: number[] = [];

    // 2023年から前々年までのアーカイブを取得
    for (let year = 2023; year < currentYear - 1; year++) {
      archiveYears.push(year);
    }

    console.log('読み込み対象アーカイブ:', archiveYears);
    console.log('最新データファイル:', latestFilename);

    // アーカイブデータの読み込み（並列実行）
    const archivePromises = archiveYears.map(async (year) => {
      try {
        const response = await fetch(`/data/archive/${year}.json`);
        if (!response.ok) {
          console.warn(`アーカイブデータが見つかりません: ${year}.json`);
          return null;
        }
        const data: ArchiveData = await response.json();
        console.log(`✅ ${year}年のアーカイブデータ読み込み成功:`, data.total_records, '件');
        return data.sales_data;
      } catch (error) {
        console.warn(`アーカイブデータ読み込みエラー (${year}年):`, error);
        return null;
      }
    });

    // 最新データの読み込み
    const latestResponse = await fetch(`/data/${latestFilename}`);
    if (!latestResponse.ok) {
      throw new Error(`最新データファイルが見つかりません: ${latestFilename}`);
    }
    const latestData: SalesData = await latestResponse.json();
    console.log('✅ 最新データ読み込み成功:', latestData.total_records, '件');

    // 全データを結合
    const archiveResults = await Promise.all(archivePromises);
    const allSalesData: SalesRecord[] = [];

    // アーカイブデータを結合
    archiveResults.forEach((archiveData) => {
      if (archiveData) {
        allSalesData.push(...archiveData);
      }
    });

    // 最新データを結合
    allSalesData.push(...latestData.sales_data);

    console.log('📊 データ結合完了:', {
      アーカイブ件数: allSalesData.length - latestData.sales_data.length,
      最新データ件数: latestData.sales_data.length,
      合計: allSalesData.length
    });

    // 結合されたデータを返す
    return {
      generated_at: latestData.generated_at,
      total_records: allSalesData.length,
      sales_data: allSalesData
    };

  } catch (error) {
    console.error('データ結合エラー:', error);
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
  
  const years = getComparisonYears(baseDate, yearlyData);
  
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
