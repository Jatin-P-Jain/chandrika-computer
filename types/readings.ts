export type Denomination = 50 | 100 | 500 | 1000;

export type PhotocopyReadingDoc = {
  date: string; // YYYY-MM-DD (also docId)
  todayReading: number;
  prevReading: number; // yesterday's todayReading
  stockAdded?: number;
  difference: number;
  rate: number; // currently 2
  amount: number; // amount used in the daily account, may be rounded
  actualAmount: number; // raw calculated amount before round-off
  roundedAmount: number | null;
  isRounded: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type StampPartDoc = {
  todayReading: number;
  prevReading: number; // yesterday's todayReading for that denom
  stockAdded: number; // stamps added to stock today
  difference: number; // prevReading - (todayReading - stockAdded)
  amount: number; // difference × denomination
};

export type StampReadingDoc = {
  date: string; // YYYY-MM-DD (also docId)
  parts: Record<Denomination, StampPartDoc>;
  totalAmount: number;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type StampReadingRow = {
  date: string;
  parts: Record<50 | 100 | 500 | 1000, StampPartDoc>;
  totalAmount: number;
};
export type PhotocopyReadingRow = {
  date: string; // YYYY-MM-DD (also docId)
  todayReading: number;
  prevReading: number; // yesterday's todayReading
  stockAdded?: number;
  difference: number;
  rate: number;
  amount: number;
  actualAmount: number;
  roundedAmount: number | null;
  isRounded: boolean;
};
