import { create } from 'zustand';
import { supabase, getSupabaseAuthUid } from './supabaseClient';
import { logPaywallPurchased, logPaywallShown, logPaywallDismissed } from './analytics';

const IS_PAID_KEY = 'is_paid';

interface PaywallState {
  isPaid: boolean;
  loading: boolean;
  showPaywall: boolean;
  subCount: number;
  setIsPaid: (paid: boolean) => void;
  setSubCount: (count: number) => void;
  setShowPaywall: (show: boolean) => void;
  checkPaidStatus: () => Promise<void>;
  markAsPaid: () => Promise<void>;
}

export const usePaywallStore = create<PaywallState>((set) => ({
  isPaid: false,
  loading: true,
  showPaywall: false,
  subCount: 0,
  setIsPaid: (paid) => set({ isPaid: paid }),
  setSubCount: (count) => set({ subCount: count }),
  setShowPaywall: (show) => {
    set({ showPaywall: show });
    if (show) {
      logPaywallShown(0);
    } else {
      logPaywallDismissed();
    }
  },

  checkPaidStatus: async () => {
    const uid = getSupabaseAuthUid();
    if (!uid) {
      set({ isPaid: false, loading: false });
      return;
    }
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('user_id', uid)
      .eq('key', IS_PAID_KEY)
      .maybeSingle();
    set({ isPaid: data?.value === 'true', loading: false });
  },

  markAsPaid: async () => {
    const uid = getSupabaseAuthUid();
    if (!uid) return;
    await supabase
      .from('settings')
      .upsert({ user_id: uid, key: IS_PAID_KEY, value: 'true' });
    await logPaywallPurchased();
    set({ isPaid: true, showPaywall: false });
  },
}));
