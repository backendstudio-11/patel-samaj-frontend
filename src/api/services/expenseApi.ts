import apiClient from '../client';
import { Expense, PageResponse, PaginationDTO, DailyExpenseSummary } from '../../types';

export const expenseApi = {
  getExpenses: async (params: PaginationDTO): Promise<PageResponse<Expense>> => {
    const payload: PaginationDTO = {
      search: params.search || '',
      page: params.page ?? 0,
      size: params.size ?? 5,
    };
    const res = await apiClient.post<PageResponse<Expense>>('/expenses/list', payload);
    return res.data;
  },

  getExpenseById: async (id: string): Promise<Expense> => {
    const res = await apiClient.get<Expense>(`/expenses/${id}`);
    return res.data;
  },

  createExpense: async (payload: Partial<Expense>): Promise<Expense> => {
    const res = await apiClient.post<Expense>('/expenses', payload);
    return res.data;
  },

  getDailySummary: async (): Promise<DailyExpenseSummary[]> => {
    const res = await apiClient.get<DailyExpenseSummary[]>('/expenses/daily-summary');
    return res.data;
  },

  deleteExpense: async (id: string | number): Promise<any> => {
    const res = await apiClient.delete(`/expenses/${id}`);
    return res.data;
  },
};
