import React from 'react';
import '../../styles/pipeline.css';

const PipelineSteps = ({ steps, activeStep }) => {
  return (
    <div className="pipeline-container">
      {steps.map((step, index) => {
        let statusClass = 'pending';
        if (step.status === 'active') statusClass = 'active';
        if (step.status === 'done') statusClass = 'done';
        
        return (
          <div key={index} className={`pipeline-step ${statusClass}`}>
            <div className="step-icon">
              {statusClass === 'pending' && '○'}
              {statusClass === 'active' && <span className="spinner">⏳</span>}
              {statusClass === 'done' && <span className="check">✅</span>}
            </div>
            <span className="step-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default PipelineSteps;
