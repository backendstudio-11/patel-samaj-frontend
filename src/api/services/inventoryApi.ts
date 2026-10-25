import apiClient from '../client';
import { Item } from '../../types';

export const inventoryApi = {
  getItems: async (): Promise<Item[]> => {
    const res = await apiClient.get<Item[]>('/items');
    return res.data || [];
  },

  getItemById: async (id: string): Promise<Item> => {
    const res = await apiClient.get<Item>(`/items/${id}`);
    return res.data;
  },

  createItem: async (payload: Partial<Item>): Promise<Item> => {
    const res = await apiClient.post<Item>('/items', payload);
    return res.data;
  },

  deleteItem: async (id: string): Promise<any> => {
    const res = await apiClient.delete(`/items/${id}`);
    return res.data;
  },
};
