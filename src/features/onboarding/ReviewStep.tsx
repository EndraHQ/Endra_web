import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/icons/Icon';
import { planById, ONB_ICON } from '../../data/onboardingData';

export const ReviewStep: React.FC = () => {
  const { onboardingData, setObStep, markStepComplete, completeOnboarding } = useAuth();

  const handleFinish = () => {
    markStepComplete('review', 'done');
    completeOnboarding();
  };

  const selectedPlan = onboardingData.plan ? planById(onboardingData.plan) : planById('plus');
  const camsCount = onboardingData.cams?.length || 0;
  const contactsCount = onboardingData.contacts?.length || 0;

  return (
    <div className="onb-pane" id="p-review">
      <div className="onb-hd">
        <span className="onb-pill">
          <Icon name={ONB_ICON.review || 'check'} size={14} />
          Step 10 · Review & Confirm
        </span>
        <h1>Review your setup</h1>
        <p>Confirm your configuration details below. You can update any of these settings at any time from your portal.</p>
      </div>

      <div className="onb-summary-list">
        {/* 1. Property Details */}
        <div className="onb-summary-card">
          <div className="onb-summary-hd">
            <div className="onb-summary-title">
              <Icon name="home" size={18} />
              <b>Property Details</b>
            </div>
            <button
              type="button"
              className="onb-edit-btn"
              onClick={() => setObStep('property')}
            >
              Edit
            </button>
          </div>
          <div className="onb-summary-body">
            <div className="onb-kv">
              <span>Name</span>
              <b>{onboardingData.pname || 'Main Residence'}</b>
            </div>
            <div className="onb-kv">
              <span>Type & Role</span>
              <b>{onboardingData.type || 'Residential'} · {onboardingData.role || 'Owner'}</b>
            </div>
            <div className="onb-kv">
              <span>Address</span>
              <b>{onboardingData.address ? `${onboardingData.address}, ${onboardingData.area || ''}, ${onboardingData.state || 'Lagos'}` : 'Lagos, Nigeria'}</b>
            </div>
          </div>
        </div>

        {/* 2. Security PINs */}
        <div className="onb-summary-card">
          <div className="onb-summary-hd">
            <div className="onb-summary-title">
              <Icon name="key" size={18} />
              <b>Security & Duress PINs</b>
            </div>
            <button
              type="button"
              className="onb-edit-btn"
              onClick={() => setObStep('pins')}
            >
              Edit
            </button>
          </div>
          <div className="onb-summary-body">
            <div className="onb-kv">
              <span>Access PIN</span>
              <b className="mono">••••</b>
            </div>
            <div className="onb-kv">
              <span>Duress Silent PIN</span>
              <b className="mono">{onboardingData.pins?.duress ? '•••• (Configured)' : 'Not set'}</b>
            </div>
          </div>
        </div>

        {/* 3. Face ID Enrolment */}
        <div className="onb-summary-card">
          <div className="onb-summary-hd">
            <div className="onb-summary-title">
              <Icon name="user" size={18} />
              <b>Face Recognition</b>
            </div>
            <button
              type="button"
              className="onb-edit-btn"
              onClick={() => setObStep('face')}
            >
              Edit
            </button>
          </div>
          <div className="onb-summary-body">
            <div className="onb-kv">
              <span>Primary Face Profile</span>
              <b>{onboardingData.face?.enrolled ? 'Enrolled & Verified' : 'Skipped (Set up later)'}</b>
            </div>
          </div>
        </div>

        {/* 4. Cameras */}
        <div className="onb-summary-card">
          <div className="onb-summary-hd">
            <div className="onb-summary-title">
              <Icon name="camera" size={18} />
              <b>Connected Cameras</b>
            </div>
            <button
              type="button"
              className="onb-edit-btn"
              onClick={() => setObStep('cameras')}
            >
              Edit
            </button>
          </div>
          <div className="onb-summary-body">
            <div className="onb-kv">
              <span>Linked Devices</span>
              <b>{camsCount > 0 ? `${camsCount} camera${camsCount === 1 ? '' : 's'} ready` : 'No cameras added yet'}</b>
            </div>
            {camsCount > 0 && (
              <div className="onb-cam-pills">
                {onboardingData.cams?.map((c, i) => (
                  <span key={i} className="onb-cam-pill">
                    <Icon name="camera" size={12} />
                    {c.name} ({c.zone})
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 5. Emergency Contacts */}
        <div className="onb-summary-card">
          <div className="onb-summary-hd">
            <div className="onb-summary-title">
              <Icon name="phone" size={18} />
              <b>Emergency Contacts</b>
            </div>
            <button
              type="button"
              className="onb-edit-btn"
              onClick={() => setObStep('contacts')}
            >
              Edit
            </button>
          </div>
          <div className="onb-summary-body">
            <div className="onb-kv">
              <span>Dispatch Contacts</span>
              <b>{contactsCount > 0 ? `${contactsCount} contact${contactsCount === 1 ? '' : 's'} registered` : 'None registered'}</b>
            </div>
            {contactsCount > 0 && (
              <div className="onb-contact-pills">
                {onboardingData.contacts?.map((ct, idx) => (
                  <span key={idx} className="onb-contact-pill">
                    <b>{ct.name}</b> ({ct.rel || 'Family'}) · {ct.phone}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 6. Alert Preferences & Guard Locations */}
        <div className="onb-summary-card">
          <div className="onb-summary-hd">
            <div className="onb-summary-title">
              <Icon name="bell" size={18} />
              <b>Alert Preferences & Locations</b>
            </div>
            <button
              type="button"
              className="onb-edit-btn"
              onClick={() => setObStep('alerts')}
            >
              Edit
            </button>
          </div>
          <div className="onb-summary-body">
            <div className="onb-kv">
              <span>Push Notifications</span>
              <b>{onboardingData.alerts?.notifPush !== false ? 'Enabled' : 'Disabled'}</b>
            </div>
            <div className="onb-kv">
              <span>Incident Alerts</span>
              <b>{onboardingData.alerts?.notifIncident !== false ? 'Enabled' : 'Disabled'}</b>
            </div>
            <div className="onb-kv">
              <span>System Updates</span>
              <b>{onboardingData.alerts?.notifSystem !== false ? 'Enabled' : 'Disabled'}</b>
            </div>
          </div>
        </div>

        {/* 7. Selected Plan */}
        <div className="onb-summary-card plan-highlight">
          <div className="onb-summary-hd">
            <div className="onb-summary-title">
              <Icon name="shield" size={18} />
              <b>Subscription Plan</b>
            </div>
            <button
              type="button"
              className="onb-edit-btn"
              onClick={() => setObStep('plans')}
            >
              Change
            </button>
          </div>
          <div className="onb-summary-body">
            <div className="onb-kv">
              <span>Selected Tier</span>
              <b className="plan-name-tag">{selectedPlan.name}</b>
            </div>
            <div className="onb-kv">
              <span>Pricing</span>
              <b>{selectedPlan.price} / month</b>
            </div>
            <div className="onb-kv">
              <span>Camera Capacity</span>
              <b>Up to {selectedPlan.cams} cameras included</b>
            </div>
          </div>
        </div>
      </div>

      <div className="onb-act" style={{ marginTop: '32px' }}>
        <button
          type="button"
          className="btn primary lg full-w"
          onClick={handleFinish}
        >
          <Icon name="check" size={18} />
          Complete Setup & Launch ENDRA
        </button>
      </div>
    </div>
  );
};
