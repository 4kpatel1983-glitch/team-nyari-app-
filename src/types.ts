export interface Donor {
  id: string;
  name: string;
  location: string;
  date: string;
  phone: string;
  amount: number;
  rank: number;
  avatar: string;
  isVerified?: boolean;
}

export interface DailyRecord {
  date: string;
  donors: Donor[];
}

export interface MonthlyRecord {
  month: string;
  daysCount: number;
}