import React from 'react';
import { Icon } from '../icons/Icon';

export interface TimelineStep {
  status: 'done' | 'act' | 'pend';
  title: string;
  description: string;
  time?: string;
}

export const Timeline: React.FC<{ steps: TimelineStep[] }> = ({ steps }) => (
  <div className="trk">
    {steps.map((step, idx) => (
      <div key={idx} className={`trk-s ${step.status}`}>
        <div className={`trk-d ${step.status}`}>
          {step.status === 'done' && <Icon name="check" size={14} strokeWidth={2.4} />}
        </div>
        <div style={{ flex: 1 }}>
          <b>{step.title}</b>
          <span>{step.description}</span>
          {step.time && <em>{step.time}</em>}
        </div>
      </div>
    ))}
  </div>
);
