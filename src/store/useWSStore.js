import { create } from 'zustand';

// No persist — fresh every session
const useWSStore = create((set) => ({
  isConnected: false,
  isProcessing: false,
  pipelineStage: null,
  pipelineProgress: 0,
  claims: {},
  claimOrder: [],
  messages: [],
  currentQuery: '',
  finalReport: null,
  error: null,

  setError: (err) => set({ error: err }),
  setConnected: (bool) => set({ isConnected: bool }),
  setProcessing: (bool) => set({ isProcessing: bool }),
  setPipeline: (stage, progress) => set({ pipelineStage: stage, pipelineProgress: progress }),
  
  setCurrentQuery: (query) => set({ currentQuery: query }),
  setFinalReport: (report) => set({ finalReport: report }),

  addClaim: (claim) =>
    set((state) => ({
      claims: { ...state.claims, [claim.claim_id]: claim },
      claimOrder: state.claimOrder.includes(claim.claim_id) ? state.claimOrder : [...state.claimOrder, claim.claim_id]
    })),
  
  updateClaim: (claim_id, data) =>
    set((state) => ({
      claims: {
        ...state.claims,
        [claim_id]: { ...(state.claims[claim_id] || {}), ...data },
      },
    })),
    
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
    
  markReportDeleted: (report_id) => set((state) => {
    const newMessages = state.messages.map(msg => {
      if (msg.reportData && msg.reportData.report_id === report_id) {
        return { 
          ...msg, 
          type: 'report_deleted', 
          originalQuery: msg.reportData.query || msg.reportData.title || msg.content || 'this claim' 
        };
      }
      return msg;
    });

    let newFinalReport = state.finalReport;
    if (state.finalReport && state.finalReport.report_id === report_id) {
      newFinalReport = { ...state.finalReport, isDeleted: true };
    }

    return { messages: newMessages, finalReport: newFinalReport };
  }),
    
  resetClaims: () => set({ 
    claims: {}, 
    claimOrder: [], 
    finalReport: null, 
    pipelineStage: null, 
    pipelineProgress: 0,
    error: null
  }),
}));

export default useWSStore;
