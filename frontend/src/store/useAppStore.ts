import { create } from 'zustand';
import api from '../utils/api';

interface Admin {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'super_admin';
}

interface Game {
  _id: string;
  name: string;
  code: string;
  display_name: string;
  schedule_time: string;
  timezone: string;
  is_active: boolean;
  sort_order: number;
  is_featured?: boolean;
}

interface Result {
  game_id: string;
  name: string;
  code: string;
  display_name: string;
  schedule_time: string;
  result_number: string | null;
  status: 'announced' | 'pending';
  source: 'api' | 'manual';
  updated_at: string | null;
}

interface AppState {
  adminToken: string | null;
  admin: Admin | null;
  theme: 'light' | 'dark';
  games: Game[];
  results: Result[];
  starredGames: string[];
  pushEnabled: boolean;
  loadingGames: boolean;
  loadingResults: boolean;
  
  // Actions
  adminLogin: (token: string, admin: Admin) => void;
  logout: () => void;
  toggleTheme: () => void;
  fetchGames: () => Promise<void>;
  fetchResults: (dateStr: string) => Promise<void>;
  toggleFavorite: (gameId: string) => Promise<void>;
  setPushEnabled: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  adminToken: localStorage.getItem('admin_token'),
  admin: localStorage.getItem('admin') ? JSON.parse(localStorage.getItem('admin')!) : null,
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  games: [],
  results: [],
  starredGames: localStorage.getItem('starred_games') ? JSON.parse(localStorage.getItem('starred_games')!) : [],
  pushEnabled: localStorage.getItem('push_enabled') === 'true',
  loadingGames: false,
  loadingResults: false,

  adminLogin: (token, admin) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin', JSON.stringify(admin));
    set({ adminToken: token, admin });
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin');
    set({ adminToken: null, admin: null });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme: nextTheme });
  },

  fetchGames: async () => {
    set({ loadingGames: true });
    try {
      const response = await api.get('/games');
      set({ games: response.data });
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      set({ loadingGames: false });
    }
  },

  fetchResults: async (dateStr) => {
    set({ loadingResults: true });
    try {
      const response = await api.get(`/results/date/${dateStr}`);
      set({ results: response.data });
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      set({ loadingResults: false });
    }
  },

  toggleFavorite: async (gameId) => {
    const starred = get().starredGames;
    const nextStarred = starred.includes(gameId)
      ? starred.filter(id => id !== gameId)
      : [...starred, gameId];
    
    localStorage.setItem('starred_games', JSON.stringify(nextStarred));
    set({ starredGames: nextStarred });

    // Silent background sync if push is enabled
    if (get().pushEnabled && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await api.post('/notifications/subscribe', {
            subscription,
            favorites: nextStarred
          });
        }
      } catch (e) {
        console.warn('Silent subscription update failed:', e);
      }
    }
  },

  setPushEnabled: (enabled) => {
    localStorage.setItem('push_enabled', enabled ? 'true' : 'false');
    set({ pushEnabled: enabled });
  }
}));

// Initialize theme on load
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}
