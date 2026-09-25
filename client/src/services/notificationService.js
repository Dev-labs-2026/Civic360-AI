import { apiRequest } from './api';

export const notificationService = {
  getNotifications: async () => {
    return await apiRequest('/notifications');
  },

  markAsRead: async (id) => {
    return await apiRequest(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  markAllAsRead: async () => {
    return await apiRequest('/notifications/read-all', {
      method: 'PUT',
    });
  },
};

export default notificationService;
