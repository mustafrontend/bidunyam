import axios from 'axios';

function getApiUrl() {
  if (typeof window !== 'undefined') {
    return '/api';
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  return 'http://gateway:8080';
}

export const apiClient = axios.create({
  baseURL: getApiUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject Authorization Bearer token and X-Device-Id if present
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      try {
        // Ensure a persistent, unique device ID exists for session binding
        let deviceId = localStorage.getItem('bidunyam_device_id');
        if (!deviceId) {
          deviceId = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          localStorage.setItem('bidunyam_device_id', deviceId);
        }
        
        // Inject the device fingerprint header
        config.headers['x-device-id'] = deviceId;

        const storage = localStorage.getItem('trendyol-auth-storage');
        if (storage) {
          const parsed = JSON.parse(storage);
          const token = parsed?.state?.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (err) {
        console.error('Failed to inject auth token or device id:', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Automatically handle unauthorized session resets
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        import('@/stores/authStore').then((mod) => {
          mod.useAuthStore.getState().logout();
        });
        import('@/stores/favoriteStore').then((mod) => {
          mod.useFavoriteStore.getState().clearFavorites();
        });
      }
    }
    return Promise.reject(error);
  }
);
