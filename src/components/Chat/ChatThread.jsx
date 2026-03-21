import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';
import LandingScreen from '../LandingScreen';
import mockData from '../../data/mockData';
import '../../styles/chatbox.css';
import '../../styles/landing.css';

const getTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function matchClaim(text) {
  const lower = text.toLowerCase();
  for (const entry of mockData.keywordMap) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return mockData.claims[entry.index];
    }
  }
  return mockData.claims[0]; // default
}

const ChatThread = () => {
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [replyRequest, setReplyRequest] = useState(null);
  const [inputFocusRequest, setInputFocusRequest] = useState(null);
  const [verifiedClaimIds, setVerifiedClaimIds] = useState(new Set());
  const bottomRef = useRef(null);

  const isLanding = messages.length === 0;

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  }, [messages]);

  const handleReplyRequest = (text) => setReplyRequest({ id: Date.now(), text });

  const runPipeline = (userText, claimOverride) => {
    const claim = claimOverride || matchClaim(userText);

    // Deduplicate
    if (verifiedClaimIds.has(claim.id)) {
      const msgId = Date.now();
      setMessages(prev => [
        ...prev,
        { id: msgId, type: 'user', content: userText, timestamp: getTime() },
        {
          id: msgId + 1, type: 'ai', timestamp: getTime(),
          content: "I already verified this claim above ↑ — scroll up to view the full report. Would you like me to explain it further?",
          isStreaming: true
        }
      ]);
      return;
    }

    setIsProcessing(true);
    const msgId = Date.now();

    setMessages(prev => [
      ...prev,
      { id: msgId, type: 'user', content: userText, timestamp: getTime() },
      {
        id: msgId + 1, type: 'pipeline',
        steps: [
          { label: 'Extracting Claims...', status: 'pending' },
          { label: 'Searching Sources...', status: 'pending' },
          { label: 'Verifying Evidence...', status: 'pending' },
          { label: 'Generating Report...', status: 'pending' },
        ],
        activeStep: 0
      }
    ]);

    let step = 0;
    const interval = setInterval(() => {
      setMessages(prev => prev.map(msg => {
        if (msg.type !== 'pipeline') return msg;
        const s = [...msg.steps];
        if (step > 0 && step <= 4) s[step - 1].status = 'done';
        if (step < 4) s[step].status = 'active';
        return { ...msg, steps: s, activeStep: step };
      }));
      step++;
      if (step > 4) {
        clearInterval(interval);
        setVerifiedClaimIds(prev => new Set([...prev, claim.id]));
        setMessages(prev => [
          ...prev.filter(m => m.type !== 'pipeline'),
          { id: Date.now(), type: 'report', claimData: claim, timestamp: getTime() }
        ]);
        setIsProcessing(false);
      }
    }, 1000);
  };

  const handleFollowUp = (userText) => {
    // Try to route to a new claim if not already verified
    const claim = matchClaim(userText);
    if (!verifiedClaimIds.has(claim.id)) {
      runPipeline(userText, claim);
      return;
    }

    setIsProcessing(true);
    const msgId = Date.now();
    setMessages(prev => [
      ...prev,
      { id: msgId, type: 'user', content: userText, timestamp: getTime() },
      { id: msgId + 1, type: 'typing' }
    ]);
    setTimeout(() => {
      let resp = "Based on the verified reports in our conversation, would you like me to elaborate on any specific claim or verify a new one?";
      if (userText.toLowerCase().includes("claim 3") || userText.toLowerCase().includes("immunity"))
        resp = mockData.dummyResponses.claim3;
      setMessages(prev => [
        ...prev.filter(m => m.type !== 'typing'),
        { id: Date.now(), type: 'ai', content: resp, timestamp: getTime(), isStreaming: true }
      ]);
      setIsProcessing(false);
    }, 1500);
  };

  const handleSend = (text) => {
    const hasAnyReport = messages.some(m => m.type === 'report');
    if (!hasAnyReport) runPipeline(text);
    else {
      const claim = matchClaim(text);
      if (!verifiedClaimIds.has(claim.id)) runPipeline(text, claim);
      else handleFollowUp(text);
    }
  };

  const handleTryDemo = () => {
    const claim = mockData.claims[8]; // brain 10% claim — interesting default
    runPipeline("Humans only use 10% of their brain", claim);
  };

  return (
    <div className="chat-container">
      {isLanding ? (
        <LandingScreen
          onTryDemo={handleTryDemo}
          onPasteClick={() => setInputFocusRequest(Date.now())}
        />
      ) : (
        <div className="chat-feed">
          <div className="chat-messages-wrapper">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} onReply={handleReplyRequest} />
            ))}
            <div ref={bottomRef} className="chat-bottom-spacer" />
          </div>
        </div>
      )}
      <div className="chat-input-area">
        <InputBar
          onSend={handleSend}
          isProcessing={isProcessing}
          replyRequest={replyRequest}
          focusRequest={inputFocusRequest}
        />
      </div>
    </div>
  );
};

export default ChatThread;
