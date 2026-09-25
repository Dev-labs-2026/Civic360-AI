const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Universal API fetch wrapper with token injection and error handling
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('civic360_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // If sending FormData (file upload), let browser set Content-Type with boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Auto logout on 401 unauthorized
      if (response.status === 401 && !url.includes('/auth/login')) {
        localStorage.removeItem('civic360_token');
        localStorage.removeItem('civic360_user');
        window.dispatchEvent(new Event('civic360:unauthorized'));
      }

      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);
    throw error;
  }
};

export default apiRequest;
