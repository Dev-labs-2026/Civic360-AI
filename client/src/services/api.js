const rawBase = import.meta.env.VITE_API_URL || '/api';
export const BASE_URL = rawBase.replace(/\/+$/, '');

/**
 * Universal helper to resolve image URLs (handles local uploads, external URLs, and base64)
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('data:')
  ) {
    return imagePath;
  }
  const backendOrigin = BASE_URL.replace(/\/api\/?$/, '');
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${backendOrigin}${cleanPath}`;
};

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

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

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
    // Check if network error (e.g. backend offline)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const netError = new Error('Backend server is currently unavailable. Please verify the server is running on port 5000.');
      netError.isNetworkError = true;
      console.error(`Network Error on [${options.method || 'GET'}] ${endpoint}:`, netError);
      throw netError;
    }
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);
    throw error;
  }
};

export default apiRequest;
