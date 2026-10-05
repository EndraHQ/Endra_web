import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/feedback/Modal';
import { fmtPhone } from '../utils/authHelpers';

export const CommandCenterModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { toast } = useApp();
  const { account, updateOnboardingData } = useAuth();
  const [cams, setCams] = useState('11 to 25');
  const [note, setNote] = useState('');

  const phone = account?.phone ? fmtPhone(account.phone) : '0803 415 9920';

  const handleSend = () => {
    updateOnboardingData({
      // Save CC request into onboarding state
    });
    onClose();
    toast('Request sent. The ENDRA team will be in touch.');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ENDRA Command Center"
      subtitle="For sites with more than 10 cameras, such as estates, campuses and large facilities."
      wide={false}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
          <button type="button" className="btn btn-g" onClick={onClose}>
            Not now
          </button>
          <button type="button" className="btn btn-w" onClick={handleSend}>
            Request a call
          </button>
        </div>
      }
    >
      <p className="sub" style={{ margin: '0 0 16px', fontSize: '13.5px', color: 'var(--g400)' }}>
        Tell us about your site and the ENDRA team will get in touch.
      </p>

      <div className="fld">
        <label htmlFor="ccCams">How many cameras do you need?</label>
        <select
          className="in"
          id="ccCams"
          value={cams}
          onChange={e => setCams(e.target.value)}
        >
          {['11 to 25', '26 to 50', '51 to 100', 'More than 100'].map(o => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <div className="fld">
        <label htmlFor="ccNote">Anything we should know? (optional)</label>
        <textarea
          className="in"
          id="ccNote"
          style={{ minHeight: '84px', width: '100%', resize: 'vertical' }}
          placeholder="e.g. A gated estate with 3 entrances"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>

      <div className="note" style={{ marginTop: '14px', fontSize: '13px' }}>
        We’ll call you on <b>{phone}</b>.
      </div>
    </Modal>
  );
};
