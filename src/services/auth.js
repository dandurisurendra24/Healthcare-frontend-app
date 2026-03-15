import { apiService } from './api';
import { STORAGE_KEYS } from '../utils/constants';

export const authService = {
  login: (email, password) => apiService.login({ email, password }),
  logout: async () => {
    try {
      await apiService.logout();
    } finally {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  },
  getMe: () => apiService.getMe(),
  getToken: () => localStorage.getItem(STORAGE_KEYS.TOKEN),
  setToken: (token) => localStorage.setItem(STORAGE_KEYS.TOKEN, token),
  clearToken: () => localStorage.removeItem(STORAGE_KEYS.TOKEN),
};
