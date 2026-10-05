import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/feedback/Modal';
import { Icon } from '../components/icons/Icon';
import { PLANS, PLAN_FEATURES } from '../data/onboardingData';

export const PlansModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { user, setUser, toast } = useApp();
  const { updateOnboardingData } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    user.plan === 'ENDRA Free' ? 'free' : user.plan === 'ENDRA Standard' ? 'standard' : 'plus'
  );

  const handleSelectPlan = (id: string, name: string) => {
    setSelectedPlanId(id);
    setUser(prev => ({ ...prev, plan: name }));
    updateOnboardingData({ plan: id });
    toast(`Plan changed to ${name}`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upgrade or change plan"
      wide={true}
    >
      <p className="muted" style={{ fontSize: '13px', marginBottom: '20px' }}>
        Select the protection level that fits your property. Changes take effect immediately.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          marginBottom: '16px'
        }}
      >
        {PLANS.map(p => {
          const isCurrent = user.plan === p.name;
          const isSelected = selectedPlanId === p.id;
          return (
            <div
              key={p.id}
              className="card"
              style={{
                border: isSelected ? '2px solid var(--blue)' : '1px solid var(--g800)',
                background: isSelected
                  ? 'color-mix(in srgb,var(--blue) 5%,var(--g900))'
                  : 'var(--g900)',
                display: 'flex',
                flexDirection: 'column',
                padding: '18px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ fontSize: '15px' }}>{p.name}</b>
                {isCurrent && <span className="pill green">Current</span>}
              </div>

              <div style={{ fontSize: '22px', fontWeight: 700, margin: '10px 0 4px' }}>
                {p.price}
                <small style={{ fontSize: '12px', color: 'var(--g500)' }}>
                  {p.id === 'free' ? '' : '/mo'}
                </small>
              </div>

              <p className="muted" style={{ fontSize: '11.5px', marginBottom: '14px' }}>
                {p.blurb}
              </p>

              <div style={{ borderTop: '1px solid var(--g800)', paddingTop: '10px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {PLAN_FEATURES.filter(([fid]) => p.has.includes(fid)).slice(0, 4).map(([fid, label]) => (
                  <div
                    key={fid}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11.5px',
                      color: 'var(--g300)'
                    }}
                  >
                    <Icon name="check" size={12} strokeWidth={2.4} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={`btn ${isCurrent ? 'btn-g' : 'btn-w'} btn-sm`}
                style={{ marginTop: '16px', width: '100%' }}
                disabled={isCurrent}
                onClick={() => handleSelectPlan(p.id, p.name)}
              >
                {isCurrent ? 'Current plan' : 'Select plan'}
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
