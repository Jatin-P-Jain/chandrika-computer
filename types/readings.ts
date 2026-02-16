export type Denomination = 50 | 100 | 500 | 1000;

export type PhotocopyReadingDoc = {
  date: string; // YYYY-MM-DD (also docId)
  todayReading: number;
  prevReading: number; // yesterday's todayReading
  difference: number;
  rate: number; // 1.5
  amount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type StampPartDoc = {
  todayReading: number;
  prevReading: number; // yesterday's todayReading for that denom
  difference: number;
  amount: number;
};

export type StampReadingDoc = {
  date: string; // YYYY-MM-DD (also docId)
  parts: Record<Denomination, StampPartDoc>;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
};
