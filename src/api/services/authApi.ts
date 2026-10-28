import apiClient from '../client';

export const authApi = {
  login: async (credentials: { mobileNumber: string; password: string }): Promise<any> => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },

  forgotPassword: async (email: string): Promise<any> => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  logout: async (): Promise<any> => {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  },
};
