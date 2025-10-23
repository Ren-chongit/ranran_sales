export interface SalesRecord {
  date: string;
  booking_no: string;
  amount: number;
}

export interface SalesData {
  generated_at: string;
  total_records: number;
  sales_data: SalesRecord[];
}

export interface ArchiveData {
  year: number;
  archived_at: string;
  total_records: number;
  sales_data: SalesRecord[];
}

export interface ProcessedData {
  date: string;
  sales: number;
  count: number;
}

export interface YearlyData {
  [year: string]: ProcessedData[];
}

export interface ComparisonData {
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