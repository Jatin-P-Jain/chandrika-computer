export type DailyAccount = {
  fixed: {
    sd: number;
    sc: number;
    fs: number;
  };
  earnings: {
    netIncome: number;
    otherIncomes: {
      label: string;
      amount: number;
      tags?: string[];
    }[];
  };
  businessExpenses: {
    label: string;
    amount: number;
    tags?: string[];
  }[];
  dailySpends: {
    label: string;
    amount: number;
    tags?: string[];
  }[];
  totalCashCollected: number;
  createdAt: string;
  updatedAt?: string;
};
