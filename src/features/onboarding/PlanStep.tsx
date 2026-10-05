import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useModals } from '../../context/ModalContext';
import { Icon } from '../../components/icons/Icon';
import { PLANS, PLAN_FEATURES, planById } from '../../data/onboardingData';
import { OnboardingActions } from './OnboardingActions';

export const PlanStep: React.FC = () => {
  const {
    onboardingData,
    updateOnboardingData,
    markStepComplete,
    setObStep
  } = useAuth();
  const { openModal } = useModals();

  const cameraCount = (onboardingData.cams || []).length;

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    if (onboardingData.plan) {
      const p = planById(onboardingData.plan);
      if (p.cams >= cameraCount) return onboardingData.plan;
    }
    // Default to a suitable plan that accommodates the connected cameras
    const matched = PLANS.find(p => p.cams >= cameraCount) || PLANS[PLANS.length - 1];
    return matched.id;
  });

  const handleSelectPlan = (id: string) => {
    setSelectedPlanId(id);
    updateOnboardingData({ plan: id, planOk: true });
  };

  const handleContinue = () => {
    if (!selectedPlanId) return;
    updateOnboardingData({ plan: selectedPlanId, planOk: true });
    markStepComplete('plans', 'done');
    setObStep('ready');
  };

  const currentPlan = selectedPlanId ? planById(selectedPlanId) : null;

  return (
    <>
      <header className="onb-hd">
        <span className="onb-ic" aria-hidden="true">
          <Icon name="card" size={24} strokeWidth={1.6} />
        </span>
        <div>
          <h1 id="gH" tabIndex={-1}>
            Choose your plan
          </h1>
          <p className="sub">
            Compare what each plan can do and pick the one that fits. You can upgrade or downgrade any time from Plans.
          </p>
        </div>
      </header>

      <div className="onb-fm">
        <form onSubmit={e => { e.preventDefault(); handleContinue(); }} noValidate>
          <div role="radiogroup" aria-label="Subscription plan">
            <div className="plans-grid">
              {PLANS.map(p => {
                const isSelected = selectedPlanId === p.id;
                const isOff = cameraCount > p.cams;
                return (
                  <label
                    key={p.id}
                    className={`rc pc ${isOff ? 'off' : ''}`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={p.id}
                      checked={isSelected}
                      disabled={isOff}
                      onChange={() => handleSelectPlan(p.id)}
                    />
                    <span className="rc-in">
                      <span className="pc-hd">
                        <span className="pc-name">{p.name}</span>
                        {p.tag && <span className="pc-tag">{p.tag}</span>}
                        <span className="pc-ck" aria-hidden="true">
                          <Icon name="check" size={14} strokeWidth={2.6} />
                        </span>
                      </span>

                      <span className="pc-price">
                        {p.price}
                        <small> per month</small>
                      </span>

                      <span className="pc-blurb">{p.blurb}</span>

                      <span className="pc-cams">Up to {p.cams} cameras</span>

                      <span className="pc-list" role="list">
                        {PLAN_FEATURES.map(([k, label]) => {
                          const has = p.has.includes(k);
                          return (
                            <span
                              key={k}
                              className={`pc-li ${has ? 'yes' : 'no'}`}
                              role="listitem"
                            >
                              <Icon
                                name={has ? 'check' : 'minus'}
                                size={15}
                                strokeWidth={has ? 2.2 : 1.8}
                              />
                              <span>
                                {label}
                                {!has && <span className="vh"> (not included)</span>}
                              </span>
                            </span>
                          );
                        })}
                      </span>

                      {isOff && (
                        <span className="pc-warn">
                          You’ve added {cameraCount} cameras. This plan supports up to {p.cams}.
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Command Center Card */}
          <div className="cc-card" style={{ marginTop: '16px' }}>
            <span className="ico">
              <Icon name="building" size={19} />
            </span>
            <div className="mn">
              <b>Need more than {PLANS[PLANS.length - 1].cams} cameras?</b>
              <span className="s">
                {PLANS[PLANS.length - 1].name} is our highest plan, with up to{' '}
                {PLANS[PLANS.length - 1].cams} cameras. For larger sites, consider ENDRA Command Center.
              </span>
            </div>
            <button
              type="button"
              className="btn btn-g btn-sm"
              onClick={() => openModal({ type: 'commandCenter' })}
            >
              Learn about Command Center
            </button>
          </div>

          <div className="note" style={{ marginTop: '14px', fontSize: '13px' }}>
            Billing isn’t set up in this preview, so nothing is charged.
          </div>

          {/* Action bar */}
          <OnboardingActions
            showBack={true}
            onBack={() => setObStep('alerts')}
            continueLabel={currentPlan ? `Continue with ${currentPlan.name}` : 'Choose a plan'}
            continueDisabled={!selectedPlanId}
            continueType="submit"
          />
        </form>
      </div>
    </>
  );
};
