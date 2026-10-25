import apiClient from '../client';
import { Event, PageResponse, PaginationDTO, EventStatus } from '../../types';

export const eventApi = {
  getEventsByStatusId: async (statusId: EventStatus | number, params: PaginationDTO): Promise<PageResponse<Event>> => {
    const payload: PaginationDTO = {
      search: params.search || '',
      page: params.page ?? 0,
      size: params.size ?? 5,
    };
    const res = await apiClient.post<PageResponse<Event>>(`/events/list?statusId=${statusId}`, payload);
    return res.data;
  },

  getInProgressEvents: async (params?: PaginationDTO): Promise<PageResponse<Event> | Event[]> => {
    const payload: PaginationDTO = {
      search: params?.search || '',
      page: params?.page ?? 0,
      size: params?.size ?? 5,
    };
    const res = await apiClient.post<PageResponse<Event> | Event[]>(`/events/list?statusId=${EventStatus.IN_PROGRESS}`, payload);
    return res.data;
  },

  getEventById: async (id: string): Promise<Event> => {
    const res = await apiClient.get<Event>(`/events/${id}`);
    return res.data;
  },

  createEvent: async (payload: any): Promise<Event> => {
    const res = await apiClient.post<Event>('/events', payload);
    return res.data;
  },

  updateEvent: async (payload: any): Promise<Event> => {
    const res = await apiClient.put<Event>('/events', payload);
    return res.data;
  },

  closeEvent: async (id: string): Promise<any> => {
    const res = await apiClient.put(`/events/close/${id}`);
    return res.data;
  },
};
