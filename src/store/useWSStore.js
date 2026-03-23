import { create } from 'zustand';

const useWSStore = create((set, get) => ({
  isConnected: false,
  isProcessing: false,
  pipelineStage: null,
  pipelineProgress: 0,
  claims: {},
  claimOrder: [],
  queryClaims: {},
  messages: [],
  currentQuery: '',
  finalReport: null,
  error: null,
  errorMessage: null,

  setError: (err) => set({ error: err }),
  setErrorMessage: (msg) => set({ errorMessage: msg }),
  setConnected: (bool) => set({ isConnected: bool }),
  setProcessing: (bool) => set({ isProcessing: bool }),
  setPipeline: (stage, progress) => set({ 
    pipelineStage: stage, 
    pipelineProgress: progress 
  }),
  setCurrentQuery: (query) => set({ currentQuery: query }),
  setFinalReport: (report) => set({ finalReport: report }),
  markReportDeleted: () => set((state) => ({
    finalReport: state.finalReport 
      ? { ...state.finalReport, isDeleted: true }
      : null
  })),
  
  addClaim: (claim) => set((state) => ({
    claims: { 
      ...state.claims, 
      [claim.claim_id]: claim 
    },
    claimOrder: state.claimOrder.includes(claim.claim_id) ? state.claimOrder : [...state.claimOrder, claim.claim_id]
  })),
  
  updateClaim: (claim_id, data) => set((state) => {
    const updatedClaim = { 
      ...(state.claims[claim_id] || {}), 
      ...data 
    };
    
    const isNew = !state.claimOrder.includes(claim_id);
    
    return {
      claims: {
        ...state.claims,
        [claim_id]: updatedClaim
      },
      claimOrder: isNew ? [...state.claimOrder, claim_id] : state.claimOrder
    };
  }),

  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  resetClaims: () => set({ 
    claims: {}, 
    claimOrder: [],
    queryClaims: {},
    finalReport: null,
    pipelineStage: null,
    pipelineProgress: 0,
    error: null,
    errorMessage: null
  }),
}));

export default useWSStore;
