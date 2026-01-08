import { UserData } from "./user";

export type DailyAccount = {
  id: string;
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
  createdBy: UserData;
  updatedBy: UserData;
  created: string;
  updated?: string;
};
