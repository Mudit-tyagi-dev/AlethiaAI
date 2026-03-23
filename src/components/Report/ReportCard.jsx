import React from 'react';
import TruthMeter from './TruthMeter';
import KpiCounters from './KpiCounters';
import ClaimCard from './ClaimCard';
import '../../styles/report.css';

const ReportCard = ({ claim, total = 1, index = 0 }) => {
  // Build mini KPI for a single claim
  const kpis = {
    total: 1,
    true: claim.verdict === 'True' ? 1 : 0,
    false: claim.verdict === 'False' ? 1 : 0,
    partial: claim.verdict === 'Partial' ? 1 : 0,
  };

  const verdictToScore = { True: 95, Partial: 60, False: 15, Unverifiable: 40 };
  const truthScore = verdictToScore[claim.verdict] ?? 50;

  return (
    <div className="report-card">
      <div className="report-header">
        <div className="report-title">Verification Report</div>
        <div className="report-timestamp">{new Date().toLocaleString()}</div>
      </div>

      <div className="report-dashboard">
        <TruthMeter score={truthScore} />
        <KpiCounters kpis={kpis} />
      </div>

      <div className="report-divider" />

      <div className="claims-section">
        <div className="claims-list">
          <ClaimCard claim={claim} index={0} claimNum={1} totalClaims={1} />
        </div>
      </div>

      <div className="report-footer">
        Verified by Factly AI Language Model
      </div>
    </div>
  );
};

export default ReportCard;
