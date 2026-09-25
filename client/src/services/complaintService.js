import { apiRequest } from './api';

export const complaintService = {
  // Complaints list with query params
  getComplaints: async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    return await apiRequest(`/complaints${queryString ? `?${queryString}` : ''}`);
  },

  // Single complaint
  getComplaintById: async (id) => {
    return await apiRequest(`/complaints/${id}`);
  },

  // Create complaint
  createComplaint: async (data) => {
    return await apiRequest('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update complaint (status, notes, officer assignment, etc.)
  updateComplaint: async (id, data) => {
    return await apiRequest(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete complaint
  deleteComplaint: async (id) => {
    return await apiRequest(`/complaints/${id}`, {
      method: 'DELETE',
    });
  },

  // AI draft analysis
  analyzeDraft: async (data) => {
    return await apiRequest('/complaints/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // File Upload
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return await apiRequest('/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // Officer Dashboard
  getOfficerDashboard: async () => {
    return await apiRequest('/officer/dashboard');
  },

  // Admin Dashboard
  getAdminDashboard: async () => {
    return await apiRequest('/admin/dashboard');
  },

  // Admin User Management
  getAdminUsers: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return await apiRequest(`/admin/users?${searchParams.toString()}`);
  },

  updateAdminUser: async (id, data) => {
    return await apiRequest(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

export default complaintService;
