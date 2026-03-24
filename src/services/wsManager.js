import useWSStore from '../store/useWSStore';
import useReportStore from '../store/useReportStore';

const WS_URL = 'wss://factify-backend-tcup.onrender.com/ws/verify';
let ws = null;

export const ensureConnected = () => {
  return new Promise((resolve, reject) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      resolve(ws);
      return;
    }
    ws = new WebSocket(WS_URL);
    ws.onopen = () => {
      useWSStore.getState().setConnected(true);
      resolve(ws);
    };
    ws.onerror = (e) => reject(e);
    ws.onclose = () => {
      useWSStore.getState().setConnected(false);
      ws = null;
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (e) {}
    };
  });
};

export const sendMessage = async (payload) => {
  const socket = await ensureConnected();
  socket.send(JSON.stringify(payload));
};

const handleMessage = (data) => {
  const store = useWSStore.getState();

  if (data.event === 'stage') {
    store.setPipeline(data.stage, data.progress * 100);
  }

  if (data.event === 'error') {
    const msg = data.message || '';
    const isExhausted = /RESOURCE_EXHAUSTED|429|quota/i.test(msg);
    if (isExhausted) {
      store.setProcessing(false);
      store.setErrorMessage({
        type: 'api_exhausted',
        message: 'API key quota exceeded. Please update your API key.'
      });
    }
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
    console.log(`[WS] claim_verified received:`, data);
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
    
    // Check if no claims were found
    if (data.total_claims === 0 || (!data.claims || data.claims.length === 0)) {
      store.setErrorMessage({
        type: 'no_claims',
        message: "We couldn't find any verifiable factual claims in this text. Try submitting a statement with clear facts."
      });
      return;
    }

    // Comprehensive debug logging
    console.log('[report_done] Full Data:', data);
    console.log('[report_done] first claim:', data.claims?.[0]);

    // Backend might use True/False or true/false for keys
    const trueCount = data.true_count ?? data['True'] ?? data['true'] ?? 0;
    const falseCount = data.false_count ?? data['False'] ?? data['false'] ?? 0;
    const partialCount = data.partial_count ?? data['Partial'] ?? data['partial'] ?? 0;
    const unverifiableCount = data.unverifiable_count ?? data['Unverifiable'] ?? data['unverifiable'] ?? 0;
    
    const title = store.currentQuery?.substring(0, 40) || 'Report';
    const finalClaims = {};
    const finalOrder = [];
    const existingClaims = store.claims;

    if (data.claims) {
      data.claims.forEach(c => {
        const claimId = c.claim_id || c.id;
        const existing = existingClaims[claimId] || {};
        
        finalClaims[claimId] = { 
          ...existing,
          ...c, 
          claim_id: claimId,
          // Ensure fields expected by UI are present and prefer report data if it exists
          claim_text: c.claim_text || c.text || existing.claim_text || existing.text || '',
          verdict: c.verdict || existing.verdict || 'Unverifiable',
          status: 'verified' 
        };
        finalOrder.push(claimId);
      });
    }

    const reportObj = {
      report_id: data.report_id,
      overall_score: data.overall_score,
      ai_text_probability: data.ai_text_probability,
      total_claims: data.total_claims,
      true_count: trueCount,
      false_count: falseCount,
      partial_count: partialCount,
      unverifiable_count: unverifiableCount,
      claims: (data.claims || []).map(c => {
        const claimId = c.claim_id || c.id;
        const existing = existingClaims[claimId] || {};
        return {
          ...existing,
          ...c,
          claim_id: claimId,
          claim_text: c.claim_text || c.text || existing.claim_text || existing.text || '',
          verdict: c.verdict || existing.verdict || 'Unverifiable'
        };
      }),
      date: new Date().toISOString(),
      title: title,
      query: store.currentQuery || ''
    };

    useWSStore.setState({
      claims:finalClaims,
      claimOrder: finalOrder,
      finalReport: reportObj,
      isProcessing: false
    });

    useReportStore.getState().addReport(reportObj);
  }
};
