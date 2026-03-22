import React, { useState, useEffect } from 'react';

const AnimatedCounter = ({ end, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(ease * end));
      if (progress < 1) requestAnimationFrame(animate);
      else setCount(end);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count}</span>;
};

const KpiCounters = ({ kpis }) => {
  return (
    <div className="kpi-row">
      <div className="kpi-card total">
        <div className="kpi-value"><AnimatedCounter end={kpis.total || 0} /></div>
        <div className="kpi-label">Total Claims</div>
      </div>
      <div className="kpi-card true">
        <div className="kpi-value"><AnimatedCounter end={kpis.true || 0} /></div>
        <div className="kpi-label">True</div>
      </div>
      <div className="kpi-card partial">
        <div className="kpi-value"><AnimatedCounter end={kpis.partial || 0} /></div>
        <div className="kpi-label">Partial</div>
      </div>
      <div className="kpi-card false">
        <div className="kpi-value"><AnimatedCounter end={kpis.false || 0} /></div>
        <div className="kpi-label">False</div>
      </div>
      <div className="kpi-card unverifiable">
        <div className="kpi-value"><AnimatedCounter end={kpis.unverifiable || 0} /></div>
        <div className="kpi-label">Unverifiable</div>
      </div>
    </div>
  );
};

export default KpiCounters;
