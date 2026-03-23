import useWSStore from '../store/useWSStore';
import useReportStore from '../store/useReportStore';

const WS_URL = 'wss://factify-backend-tcup.onrender.com/ws/verify';
let ws = null;
let connectionPromise = null;

export const ensureConnected = () => {
  // If we already have an open connection, return it immediately
  if (ws && ws.readyState === WebSocket.OPEN) {
    return Promise.resolve(ws);
  }
  
  // If we are already in the process of connecting, wait for that promise to resolve
  if (connectionPromise) {
    return connectionPromise;
  }

  // Otherwise, start a new connection
  connectionPromise = new Promise((resolve, reject) => {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      useWSStore.getState().setConnected(true);
      resolve(ws);
      connectionPromise = null;
    };
    
    ws.onerror = (e) => {
      reject(e);
      connectionPromise = null;
    };
    
    ws.onclose = () => {
      useWSStore.getState().setConnected(false);
      ws = null;
      connectionPromise = null;
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (e) {
        // Ignore parse errors
      }
    };
  });
  
  return connectionPromise;
};

export const sendMessage = async (payload) => {
  const socket = await ensureConnected();
  socket.send(JSON.stringify(payload));
};

const handleMessage = (data) => {
  const store = useWSStore.getState();
  
  if (data.event === 'error') {
    store.setError(data.message);
    store.setProcessing(false);
    
    const claims = store.claims;
    Object.keys(claims).forEach(id => {
      const claim = claims[id];
      if (claim.status === 'searching' || claim.status === 'verifying') {
        store.updateClaim(id, { status: 'error' });
      }
    });
  }

  if (data.event === 'stage') {
    store.setPipeline(data.stage, data.progress * 100);
  }
  
  if (data.event === 'claim_found') {
    store.addClaim({
      claim_id: data.claim_id,
      text: data.text,
      status: 'searching'
    });
  }
  
  if (data.event === 'search_done') {
    store.updateClaim(data.claim_id, {
      sources: data.sources || [],
      sources_found: data.sources_found,
      search_query: data.search_query,
      status: 'verifying'
    });
  }
  
  if (data.event === 'claim_verified') {
    store.updateClaim(data.claim_id, {
      verdict: data.verdict,
      confidence: data.confidence,
      reasoning: data.reasoning,
      conflicting: data.conflicting,
      sources: data.sources,
      status: 'verified'
    });
  }
  
  if (data.event === 'report_done') {
    store.setProcessing(false);
    
    const trueCount = data['true'] ?? 0;
    const falseCount = data['false'] ?? 0;
    const partialCount = data['partial'] ?? 0;
    const unverifiableCount = data['unverifiable'] ?? 0;
    
    const title = store.currentQuery?.substring(0, 40) || 'Report';
    const reportObj = {
      report_id: data.report_id,
      overall_score: data.overall_score,
      ai_text_probability: data.ai_text_probability,
      total_claims: data.total_claims,
      true_count: trueCount,
      false_count: falseCount,
      partial_count: partialCount,
      unverifiable_count: unverifiableCount,
      claims: data.claims || [],
      date: new Date().toISOString(),
      title: title,
      query: store.currentQuery || ''
    };

    useReportStore.getState().addReport(reportObj);
    store.setFinalReport(reportObj);
  }
};
