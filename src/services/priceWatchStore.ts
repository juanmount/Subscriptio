import { create } from 'zustand';
import type { PriceAlert } from '@/domain/price-watch';
import {
  listPriceWatchLogs,
  markAllPriceWatchLogsAsRead,
  markPriceWatchLogAsRead,
  deletePriceWatchLog,
  clearAllPriceWatchLogs,
  toPriceAlert,
} from '@/data/repositories/price-watch';

type PriceWatchState = {
  alerts: PriceAlert[];
  unreadCount: number;
  isLoading: boolean;
  loadAlerts: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
};

export const usePriceWatchStore = create<PriceWatchState>((set, get) => ({
  alerts: [],
  unreadCount: 0,
  isLoading: false,

  loadAlerts: async () => {
    set({ isLoading: true });
    const logs = await listPriceWatchLogs();
    const alerts = logs.map(toPriceAlert);
    set({
      alerts,
      unreadCount: alerts.filter((a) => !a.isRead).length,
      isLoading: false,
    });
  },

  markAsRead: async (id: number) => {
    await markPriceWatchLogAsRead(id);
    const alerts = get().alerts.map((a) =>
      a.id === id ? { ...a, isRead: true } : a,
    );
    set({
      alerts,
      unreadCount: alerts.filter((a) => !a.isRead).length,
    });
  },

  markAllAsRead: async () => {
    await markAllPriceWatchLogsAsRead();
    const alerts = get().alerts.map((a) => ({ ...a, isRead: true }));
    set({
      alerts,
      unreadCount: 0,
    });
  },

  dismiss: async (id: number) => {
    await deletePriceWatchLog(id);
    const alerts = get().alerts.filter((a) => a.id !== id);
    set({
      alerts,
      unreadCount: alerts.filter((a) => !a.isRead).length,
    });
  },

  clearAll: async () => {
    await clearAllPriceWatchLogs();
    set({ alerts: [], unreadCount: 0 });
  },
}));
