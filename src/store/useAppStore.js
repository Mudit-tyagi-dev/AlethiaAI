import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAppStore = create(
  persist(
    (set) => ({
      // Persisted state
      plan: 'free',
      apiKey: '',
      theme: 'dark',

      // Session-only state
      currentView: 'chat',
      currentReportId: null,
      isPricingOpen: false,
      isSettingsOpen: false,
      isShareOpen: false,

      // Actions
      setPlan: (plan) => set({ plan }),
      setApiKey: (key) => set({ apiKey: key }),
      setTheme: (theme) => set({ theme }),
      setView: (view) => set({ currentView: view }),
      setCurrentReportId: (id) => set({ currentReportId: id }),
      openPricing: () => set({ isPricingOpen: true }),
      closePricing: () => set({ isPricingOpen: false }),
      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),
      openShare: () => set({ isShareOpen: true }),
      closeShare: () => set({ isShareOpen: false }),
    }),
    {
      name: 'factly-app-store',
      partialize: (state) => ({
        plan: state.plan,
        apiKey: state.apiKey,
        theme: state.theme,
      }),
    }
  )
);

export default useAppStore;
