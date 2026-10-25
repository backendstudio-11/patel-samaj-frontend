import apiClient from '../client';
import { UserDTO, PageResponse, PaginationDTO, UserProfileDTO, ChangePasswordDTO } from '../../types';

export const userApi = {
  getAllUsers: async (params: PaginationDTO): Promise<UserDTO[] | PageResponse<UserDTO>> => {
    const payload: PaginationDTO = {
      search: params.search || '',
      page: params.page ?? 0,
      size: params.size ?? 5,
    };
    const res = await apiClient.post<UserDTO[] | PageResponse<UserDTO>>('/user/list', payload);
    return res.data;
  },

  getUserProfile: async (): Promise<UserProfileDTO> => {
    const res = await apiClient.get<UserProfileDTO>('/user');
    return res.data;
  },

  toggleUserStatus: async (userId: number): Promise<any> => {
    let resData: any;
    try {
      resData = (await apiClient.put(`/user/toggle/${userId}`)).data;
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        resData = (await apiClient.post(`/user/toggle/${userId}`)).data;
      } else {
        throw err;
      }
    }
    return resData;
  },

  inviteAdmin: async (payload: any): Promise<any> => {
    const res = await apiClient.post('/user/inviteAdmin', payload);
    return res.data;
  },

  changePassword: async (payload: ChangePasswordDTO): Promise<any> => {
    const res = await apiClient.post('/user/change-password', payload);
    return res.data;
  },

  updateProfile: async (payload: Partial<UserProfileDTO>): Promise<any> => {
    let resData: any;
    try {
      resData = (await apiClient.put('/user/profile', payload)).data;
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        resData = (await apiClient.post('/profile', payload)).data;
      } else {
        throw err;
      }
    }
    return resData;
  },
};
