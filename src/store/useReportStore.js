import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useReportStore = create(
  persist(
    (set, get) => ({
      reports: [],
      currentReport: null,

      addReport: (report) =>
        set((state) => ({
          reports: [report, ...state.reports],
        })),
      setCurrentReport: (report) => set({ currentReport: report }),
      getReportById: (id) => get().reports.find((r) => r.report_id === id) || null,
    }),
    {
      name: 'alethia-reports',
      partialize: (state) => ({ reports: state.reports }),
    }
  )
);

export default useReportStore;
