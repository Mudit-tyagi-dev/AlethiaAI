import React, { useEffect } from 'react';
import { X, Check, Zap } from 'lucide-react';
import '../styles/pricing.css';

const FEATURES = [
  { label: 'Queries per day', free: 'Unlimited', pro: 'Unlimited', ent: 'Unlimited' },
  { label: 'Concurrent queries', free: '1', pro: '3', ent: '10' },
  { label: 'Max claims per query', free: '5', pro: '10', ent: '15+' },
  { label: 'Sources per claim', free: '3', pro: '10', ent: '20' },
  { label: 'Verdict + confidence', free: true, pro: true, ent: true },
  { label: 'Source citations', free: true, pro: true, ent: true },
  { label: 'AI text detection', free: true, pro: true, ent: true },
  { label: 'Conflict detection', free: true, pro: true, ent: true },
  { label: 'Report history', free: 'Public', pro: 'Private · 30 days', ent: 'Private · Unlimited' },
  { label: 'Shareable report link', free: true, pro: true, ent: true },
];

const CheckVal = ({ val }) => {
  if (val === true) return <span className="pm-yes"><Check size={14} /> Yes</span>;
  return <span className="pm-text">{val}</span>;
};

const PricingModal = ({ onClose }) => {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="pm-backdrop" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pm-header">
          <div>
            <h2 className="pm-title">Choose Your Plan</h2>
            <p className="pm-subtitle">Start free, upgrade when you're ready</p>
          </div>
          <button className="pm-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Cards */}
        <div className="pm-cards">
          {/* FREE */}
          <div className="pm-card pm-card-free">
            <div className="pm-plan-name">Free</div>
            <div className="pm-price">$0<span>/month</span></div>
            <p className="pm-tagline">For individuals trying out the tool</p>
            <div className="pm-features">
              {FEATURES.map((f) => (
                <div className="pm-feature-row" key={f.label}>
                  <span className="pm-feature-label">{f.label}</span>
                  <CheckVal val={f.free} />
                </div>
              ))}
            </div>
            <button className="pm-btn pm-btn-disabled" disabled>Current Plan</button>
          </div>

          {/* PRO */}
          <div className="pm-card pm-card-pro">
            <div className="pm-badge">Most Popular</div>
            <div className="pm-plan-name">Pro</div>
            <div className="pm-price">$12<span>/month</span></div>
            <p className="pm-tagline">For journalists, researchers, and power users</p>
            <div className="pm-features">
              {FEATURES.map((f) => (
                <div className="pm-feature-row" key={f.label}>
                  <span className="pm-feature-label">{f.label}</span>
                  <CheckVal val={f.pro} />
                </div>
              ))}
            </div>
            <button className="pm-btn pm-btn-pro">
              <Zap size={15} /> Upgrade to Pro
            </button>
          </div>

          {/* ENTERPRISE */}
          <div className="pm-card pm-card-ent">
            <div className="pm-plan-name">Enterprise</div>
            <div className="pm-price">$49<span>/month</span></div>
            <p className="pm-tagline">For teams, newsrooms, and compliance</p>
            <div className="pm-features">
              {FEATURES.map((f) => (
                <div className="pm-feature-row" key={f.label}>
                  <span className="pm-feature-label">{f.label}</span>
                  <CheckVal val={f.ent} />
                </div>
              ))}
            </div>
            <button className="pm-btn pm-btn-ent">Contact Sales</button>
          </div>
        </div>

        {/* Footer */}
        <div className="pm-footer">
          <p>🚀 Pro &amp; Enterprise plans coming soon. Stay tuned for updates!</p>
          <button className="pm-later" onClick={onClose}>Maybe Later</button>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
