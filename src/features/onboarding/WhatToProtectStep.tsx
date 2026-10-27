import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/icons/Icon';
import { USE_ROWS } from '../../data/onboardingData';
import { OnboardingActions } from './OnboardingActions';

export const WhatToProtectStep: React.FC = () => {
  const {
    onboardingData,
    updateOnboardingData,
    markStepComplete,
    setObStep
  } = useAuth();

  const selectedUses = onboardingData.use || [];
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (key: string, checked: boolean) => {
    setError(null);
    let next: string[];
    if (checked) {
      next = [...selectedUses.filter(k => k !== key), key];
    } else {
      next = selectedUses.filter(k => k !== key);
    }
    updateOnboardingData({ use: next });
  };

  const handleContinue = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUses.length) {
      setError('Pick at least one.');
      return;
    }
    markStepComplete('use', 'done');
    setObStep('activate');
  };

  const handleBack = () => {
    setObStep('contacts');
  };

  return (
    <>
      <header className="onb-hd">
        <span className="onb-ic" aria-hidden="true">
          <Icon name="shield" size={24} strokeWidth={1.6} />
        </span>
        <div>
          <h1 id="gH" tabIndex={-1}>
            What do you want ENDRA to help protect?
          </h1>
          <p className="sub">
            Pick everything that applies. You don’t need any cameras to use ENDRA.
          </p>
        </div>
      </header>

      <div className="onb-fm">
        <form noValidate onSubmit={handleContinue}>
          <div className="card flush" role="group" aria-label="What ENDRA protects">
            {USE_ROWS.map(([id, title, desc]) => (
              <label key={id} className="chk2 zrow" htmlFor={`use_${id}`}>
                <input
                  type="checkbox"
                  id={`use_${id}`}
                  checked={selectedUses.includes(id)}
                  onChange={e => handleToggle(id, e.target.checked)}
                />
                <span className="mn">
                  <b>{title}</b>
                  <span className="s">{desc}</span>
                </span>
              </label>
            ))}
          </div>

          {error && (
            <div style={{ marginTop: '10px' }}>
              <div className="g-err" id="eUse" role="alert">
                <Icon name="alert" size={14} />
                <span>{error}</span>
              </div>
            </div>
          )}

          <p className="g-hint" style={{ marginTop: '12px' }}>
            This helps ENDRA suggest what to set up next. You can change it anytime.
          </p>

          <OnboardingActions
            showBack={true}
            onBack={handleBack}
            continueLabel="Continue"
            continueDisabled={selectedUses.length === 0}
          />
        </form>
      </div>
    </>
  );
};
