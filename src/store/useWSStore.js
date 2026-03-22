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
    
  resetClaims: () => set({ 
    claims: {}, 
    claimOrder: [], 
    finalReport: null, 
    pipelineStage: null, 
    pipelineProgress: 0 
  }),
}));

export default useWSStore;
