import React from 'react';

const LandingScreen = ({ onTryDemo, onPasteClick }) => {
  return (
    <div className="landing-screen">
      <div className="landing-content">
        <div className="landing-logo">
          <span>◈</span>
        </div>

        <h1 className="landing-heading">
          Uncover What's Hidden
        </h1>
        <p className="landing-accent-line">
          Verify any claim instantly
        </p>
        <p className="landing-subtitle">
          Paste any text or news URL to fact-check with AI
        </p>

        <div className="landing-actions">
          <button className="landing-btn primary" onClick={onTryDemo}>
            ▶ Try Demo
          </button>
          <button className="landing-btn outline" onClick={onPasteClick}>
            Paste a Claim
          </button>
        </div>

        <div className="landing-chips">
          <span className="chip">✓ Multi-source verification</span>
          <span className="chip">✓ Conflict detection</span>
          <span className="chip">✓ Powered by AI</span>
        </div>
      </div>
    </div>
  );
};

export default LandingScreen;
