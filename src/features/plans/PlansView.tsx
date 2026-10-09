import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Icon } from '../../components/icons/Icon';
import { PLANS, PLAN_FEATURES, planById } from '../../data/onboardingData';

export const PlansView: React.FC = () => {
  const { onboardingData, updateOnboardingData } = useAuth();
  const { route, go, toast } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(onboardingData.plan || 'plus');
  const [showDowngradeModal, setShowDowngradeModal] = useState<boolean>(false);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [selectedKeptCams, setSelectedKeptCams] = useState<string[]>([]);

  const isFromApp = route.query?.from === 'app';
  const currentPlan = planById(onboardingData.plan || 'plus');
  const totalCams = onboardingData.cams?.length || 4;

  const handleSelectPlan = (tierId: string) => {
    if (tierId === currentPlan.id) {
      toast(`You are already on the ${currentPlan.name} plan`);
      return;
    }

    const targetPlan = planById(tierId);
    if (totalCams > targetPlan.cams) {
      // Downgrade requires selecting which cameras to keep active
      setPendingPlanId(tierId);
      setSelectedKeptCams(onboardingData.cams?.slice(0, targetPlan.cams).map(c => c.name) || []);
      setShowDowngradeModal(true);
      return;
    }

    // Direct upgrade or valid switch
    updateOnboardingData({ plan: tierId });
    setSelectedPlanId(tierId);
    toast(`Subscription updated to ${targetPlan.name} (${billingCycle})`);
  };

  const confirmDowngrade = () => {
    if (!pendingPlanId) return;
    const targetPlan = planById(pendingPlanId);
    updateOnboardingData({ plan: pendingPlanId });
    setSelectedPlanId(pendingPlanId);
    setShowDowngradeModal(false);
    setPendingPlanId(null);
    toast(`Plan changed to ${targetPlan.name}. Kept ${selectedKeptCams.length} active cameras.`);
  };

  return (
    <div className="view-container plans-view">
      {/* From App Banner */}
      {isFromApp && (
        <div className="app-handoff-banner">
          <div className="handoff-info">
            <Icon name="device" size={16} />
            <span>Opened from ENDRA Mobile App</span>
          </div>
          <button
            type="button"
            className="btn xs secondary"
            onClick={() => go('home')}
          >
            ← Return to Web Dashboard
          </button>
        </div>
      )}

      <div className="view-header">
        <div className="view-title-wrap">
          <h1>Plans & Billing</h1>
          <p className="view-subtitle">Manage your ENDRA subscription, AI features, and cloud storage capacity</p>
        </div>

        {/* Billing Cycle Switcher */}
        <div className="billing-toggle-wrap">
          <button
            type="button"
            className={`toggle-tab ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            className={`toggle-tab ${billingCycle === 'annual' ? 'active' : ''}`}
            onClick={() => setBillingCycle('annual')}
          >
            Annual Billing
            <span className="save-badge">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Current Plan Overview Card */}
      <div className="current-plan-card">
        <div className="plan-meta-left">
          <span className="badge success">Active Plan</span>
          <h2>{currentPlan.name} Tier</h2>
          <p className="plan-renewal-note">
            {currentPlan.renew} ({billingCycle === 'annual' ? 'Billed annually' : 'Billed monthly'})
          </p>
        </div>
        <div className="plan-meters">
          <div className="meter-item">
            <div className="meter-label">
              <span>Camera Slots</span>
              <b>{totalCams} / {currentPlan.cams} Used</b>
            </div>
            <div className="meter-bar">
              <div
                className="meter-fill"
                style={{ width: `${Math.min(100, (totalCams / currentPlan.cams) * 100)}%` }}
              />
            </div>
          </div>

          <div className="meter-item">
            <div className="meter-label">
              <span>Cloud Storage & AI</span>
              <b>{currentPlan.has.includes('ops') ? '24/7 Monitoring' : 'Standard Retention'}</b>
            </div>
            <div className="meter-bar">
              <div className="meter-fill" style={{ width: currentPlan.has.includes('ops') ? '90%' : '50%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Plan Tiers Grid */}
      <div className="plans-grid">
        {PLANS.map(p => {
          const isCurrent = p.id === currentPlan.id;
          const isSelected = p.id === selectedPlanId;
          const priceDisplay = billingCycle === 'annual' && p.price !== '₦0'
            ? `₦${(parseInt(p.price.replace(/[^0-9]/g, ''), 10) * 10).toLocaleString()}/yr`
            : `${p.price}/mo`;

          return (
            <div
              key={p.id}
              className={`plan-card ${p.tag ? 'popular' : ''} ${isCurrent ? 'current' : ''}`}
            >
              {p.tag && <div className="popular-badge">{p.tag}</div>}
              {isCurrent && <div className="current-badge">Your Current Plan</div>}

              <div className="plan-card-header">
                <h3>{p.name}</h3>
                <p className="plan-card-desc">{p.blurb}</p>
                <div className="plan-price">
                  <span className="amount">{priceDisplay}</span>
                  <span className="period">{billingCycle === 'annual' ? 'billed annually (2 months free)' : 'per month'}</span>
                </div>
              </div>

              <ul className="plan-features">
                {PLAN_FEATURES.map(([featKey, featLabel]) => {
                  const isIncluded = p.has.includes(featKey);
                  return (
                    <li key={featKey} style={{ opacity: isIncluded ? 1 : 0.4 }}>
                      <Icon
                        name={isIncluded ? 'check' : 'x'}
                        size={15}
                        className={isIncluded ? 'feat-check' : 'text-muted'}
                      />
                      <span>{featLabel}</span>
                    </li>
                  );
                })}
              </ul>

              <div className="plan-action">
                <button
                  type="button"
                  className={`btn full-w ${isCurrent ? 'secondary disabled' : p.tag ? 'primary' : 'secondary'}`}
                  disabled={isCurrent}
                  onClick={() => handleSelectPlan(p.id)}
                >
                  {isCurrent ? 'Current Plan' : isSelected ? 'Selected' : 'Switch to ' + p.name}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Downgrade Excess Camera Modal */}
      {showDowngradeModal && pendingPlanId && (
        <div className="modal-backdrop">
          <div className="modal-dialog downgrade-dialog">
            <div className="modal-header">
              <div className="modal-title-group">
                <Icon name="alert" size={20} className="text-warning" />
                <h3>Adjust Camera Limit for {planById(pendingPlanId).name}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowDowngradeModal(false)}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p>
                The <b>{planById(pendingPlanId).name}</b> plan supports up to <b>{planById(pendingPlanId).cams} cameras</b>.
                You currently have <b>{totalCams} cameras</b> configured. Select which cameras to keep active:
              </p>

              <div className="cam-select-list">
                {onboardingData.cams?.map(c => {
                  const isChecked = selectedKeptCams.includes(c.name);
                  const maxAllowed = planById(pendingPlanId).cams;

                  return (
                    <label key={c.name} className={`cam-check-item ${isChecked ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={!isChecked && selectedKeptCams.length >= maxAllowed}
                        onChange={e => {
                          if (e.target.checked) {
                            if (selectedKeptCams.length < maxAllowed) {
                              setSelectedKeptCams([...selectedKeptCams, c.name]);
                            }
                          } else {
                            setSelectedKeptCams(selectedKeptCams.filter(n => n !== c.name));
                          }
                        }}
                      />
                      <span className="cam-name">{c.name} ({c.zone})</span>
                      <span className="cam-type-tag">{c.loc}</span>
                    </label>
                  );
                })}
              </div>

              <p className="note text-muted">
                Remaining cameras will be safely deactivated and can be reactivated when you upgrade your plan.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowDowngradeModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={selectedKeptCams.length === 0}
                onClick={confirmDowngrade}
              >
                Confirm Plan Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment & Invoices Section */}
      <div className="billing-details-grid">
        <div className="card payment-method-card">
          <div className="card-header">
            <h3>Payment Method</h3>
            <button type="button" className="btn xs secondary" onClick={() => toast('Edit card form opened')}>
              Update Card
            </button>
          </div>
          <div className="payment-card-display">
            <div className="card-chip-icon">
              <Icon name="card" size={24} />
            </div>
            <div className="card-details">
              <b>Mastercard ending in 4242</b>
              <span>Expires 12/28 · Default method</span>
            </div>
          </div>
        </div>

        <div className="card invoice-history-card">
          <div className="card-header">
            <h3>Billing History</h3>
            <span className="badge">3 Invoices</span>
          </div>
          <div className="invoice-list">
            <div className="invoice-row">
              <div>
                <b>₦8,500</b>
                <span className="inv-date">Oct 1, 2026 · Plus Monthly</span>
              </div>
              <button type="button" className="btn xs secondary" onClick={() => toast('Downloaded invoice PDF')}>
                <Icon name="download" size={14} /> PDF
              </button>
            </div>
            <div className="invoice-row">
              <div>
                <b>₦8,500</b>
                <span className="inv-date">Sep 1, 2026 · Plus Monthly</span>
              </div>
              <button type="button" className="btn xs secondary" onClick={() => toast('Downloaded invoice PDF')}>
                <Icon name="download" size={14} /> PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
