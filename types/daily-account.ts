import { UserData } from "./user";

export type DailyAccount = {
  id: string;
  fixed: {
    sd: number;
    sc: number;
    fs: number;
    flexnCard: number;
    otherFixedExpenses: {
      label: string;
      amount: number;
      tags?: string[];
    }[];
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
  allTags: string[];
  totalEarnings: number;
  totalSpends: number;
  totalCashCollected: number;
  createdBy: UserData;
  updatedBy: UserData;
  created: string;
  updated?: string;
};
