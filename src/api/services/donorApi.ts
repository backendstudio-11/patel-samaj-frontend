import apiClient from '../client';
import { Donor, PageResponse, PaginationDTO } from '../../types';

export const donorApi = {
  getDonors: async (params: PaginationDTO): Promise<PageResponse<Donor>> => {
    const payload: PaginationDTO = {
      search: params.search || '',
      page: params.page ?? 0,
      size: params.size ?? 5,
    };
    const res = await apiClient.post<PageResponse<Donor>>('/donors/list', payload);
    return res.data;
  },

  getDonorById: async (id: string): Promise<Donor> => {
    const res = await apiClient.get<Donor>(`/donors/${id}`);
    return res.data;
  },

  createDonor: async (payload: Partial<Donor>): Promise<Donor> => {
    const res = await apiClient.post<Donor>('/donors', payload);
    return res.data;
  },

  deleteDonor: async (id: string | number): Promise<any> => {
    const res = await apiClient.delete(`/donors/${id}`);
    return res.data;
  },
};
