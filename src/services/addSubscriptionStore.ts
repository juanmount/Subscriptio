import { create } from 'zustand';
import type { ProviderWithCategory } from '@/data/repositories/providers';
import type { PlanRow } from '@/data/repositories/providers';

interface AddSubscriptionState {
  selectedProvider: ProviderWithCategory | null;
  selectedPlan: PlanRow | null;
  setProvider: (provider: ProviderWithCategory | null) => void;
  setPlan: (plan: PlanRow | null) => void;
  reset: () => void;
}

export const useAddSubscriptionStore = create<AddSubscriptionState>((set) => ({
  selectedProvider: null,
  selectedPlan: null,
  setProvider: (provider) => set({ selectedProvider: provider, selectedPlan: null }),
  setPlan: (plan) => set({ selectedPlan: plan }),
  reset: () => set({ selectedProvider: null, selectedPlan: null }),
}));
