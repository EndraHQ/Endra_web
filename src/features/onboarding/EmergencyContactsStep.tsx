import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Icon } from '../../components/icons/Icon';
import { REL_OPTS, MAX_CONTACTS, EmergencyContactItem } from '../../data/onboardingData';
import { normPhone, phoneOk, fmtPhone } from '../../utils/authHelpers';
import { initials } from '../../utils/formatters';
import { OnboardingActions } from './OnboardingActions';

export const EmergencyContactsStep: React.FC = () => {
  const {
    account,
    onboardingData,
    updateOnboardingData,
    markStepComplete,
    setObStep
  } = useAuth();
  const { toast } = useApp();

  const contacts = onboardingData.contacts || [];
  const [showAddForm, setShowAddForm] = useState(contacts.length === 0);
  const [name, setName] = useState('');
  const [rel, setRel] = useState('');
  const [otherRel, setOtherRel] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddContact = () => {
    const newErrors: Record<string, string> = {};
    const cleanName = name.trim().replace(/\s+/g, ' ');
    const cleanPhone = normPhone(phone);

    if (cleanName.length < 2) {
      newErrors.name = 'Enter their name.';
    }
    if (!phoneOk(cleanPhone)) {
      newErrors.phone = 'Enter a valid Nigerian mobile number.';
    } else if (contacts.some(c => c.phone === cleanPhone)) {
      newErrors.phone = 'You’ve already added this number.';
    } else if (account && cleanPhone === account.phone) {
      newErrors.phone = 'Use someone else’s number. Yours is already on your account.';
    }

    if (!rel) {
      newErrors.rel = 'Choose how you know them.';
    } else if (rel === 'Other' && otherRel.trim().length < 2) {
      newErrors.other = 'Write how you know them, for example “Landlord”.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const resolvedRel = rel === 'Other' ? otherRel.trim() : rel;
    const nextContacts: EmergencyContactItem[] = [
      ...contacts,
      { name: cleanName, phone: cleanPhone, rel: resolvedRel }
    ];

    updateOnboardingData({ contacts: nextContacts });
    setName('');
    setPhone('');
    setRel('');
    setOtherRel('');
    setErrors({});
    setShowAddForm(false);
    toast(`${cleanName} added`);
  };

  const handleRemoveContact = (idx: number) => {
    const c = contacts[idx];
    const nextContacts = contacts.filter((_, i) => i !== idx);
    updateOnboardingData({ contacts: nextContacts });
    if (c) toast(`${c.name} removed`);
  };

  const handleContinue = () => {
    markStepComplete('contacts', contacts.length ? 'done' : 'skipped');
    setObStep('alerts');
  };

  const handleSkip = () => {
    markStepComplete('contacts', 'skipped');
    setObStep('alerts');
  };

  return (
    <>
      <header className="onb-hd">
        <span className="onb-ic" aria-hidden="true">
          <Icon name="users" size={24} strokeWidth={1.6} />
        </span>
        <div>
          <h1 id="gH" tabIndex={-1}>
            Who can we contact in an emergency?
          </h1>
          <p className="sub">
            When you press SOS, ENDRA alerts these people along with the operators.
          </p>
        </div>
      </header>

      <div className="onb-fm">
        {/* Saved Contacts List */}
        {contacts.length > 0 && (
          <div>
            <div className="card flush" aria-label="Saved contacts">
              {contacts.map((c, i) => (
                <div key={i} className="ccard">
                  <span className="av">{initials(c.name)}</span>
                  <div className="mn">
                    <b>{c.name}</b>
                    <span className="s">
                      {c.rel} · {fmtPhone(c.phone)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="ibtn"
                    style={{ width: '36px', height: '36px' }}
                    onClick={() => handleRemoveContact(i)}
                    aria-label={`Remove ${c.name}`}
                  >
                    <Icon name="trash" size={17} />
                  </button>
                </div>
              ))}
            </div>
            <p className="g-hint" style={{ marginTop: '12px' }}>
              One contact is enough to continue. You can add or change contacts later in Settings.
            </p>
          </div>
        )}

        {/* Add Contact Form Section */}
        {contacts.length >= MAX_CONTACTS ? (
          <div className="note" style={{ marginTop: '14px' }}>
            You’ve added the maximum of {MAX_CONTACTS} contacts.
          </div>
        ) : !showAddForm ? (
          <div className="fld" style={{ marginTop: '16px' }}>
            <label className="vh" htmlFor="cNameExpand">
              Add another contact (optional)
            </label>
            <input
              className="in"
              id="cNameExpand"
              placeholder="Add another contact (optional)"
              autoComplete="off"
              onFocus={() => setShowAddForm(true)}
            />
          </div>
        ) : (
          <div className="card" style={{ marginTop: contacts.length ? '16px' : '0px' }}>
            <div className="cardhd">
              {contacts.length ? 'Add another contact' : 'Add a contact'}
            </div>

            {/* Name */}
            <div className="fld">
              <label htmlFor="cName">Full name</label>
              <input
                className={`in ${errors.name ? 'bad' : ''}`}
                id="cName"
                placeholder="e.g. Chidi Okonkwo"
                value={name}
                autoComplete="off"
                onChange={e => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddContact();
                  }
                }}
              />
              {errors.name && (
                <div className="g-err" role="alert">
                  <Icon name="alert" size={14} />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="fld">
              <label htmlFor="cPhone">Phone number</label>
              <div className={`pfx ${errors.phone ? 'bad' : ''}`}>
                <span>+234</span>
                <input
                  id="cPhone"
                  type="tel"
                  inputMode="tel"
                  placeholder="803 415 9920"
                  value={phone}
                  autoComplete="off"
                  onChange={e => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddContact();
                    }
                  }}
                />
              </div>
              {errors.phone && (
                <div className="g-err" role="alert">
                  <Icon name="alert" size={14} />
                  <span>{errors.phone}</span>
                </div>
              )}
            </div>

            {/* Relationship */}
            <div className="fld" role="radiogroup" aria-labelledby="lCR">
              <span className="lbl" id="lCR">
                Relationship
              </span>
              <div className="rcs">
                {REL_OPTS.map((r: string) => (
                  <label key={r} className="rc rcp">
                    <input
                      type="radio"
                      name="crel"
                      value={r}
                      checked={rel === r}
                      onChange={() => {
                        setRel(r);
                        if (errors.rel) setErrors(prev => ({ ...prev, rel: '' }));
                      }}
                    />
                    <span className="rc-in">{r}</span>
                  </label>
                ))}
              </div>
              {errors.rel && (
                <div className="g-err" role="alert">
                  <Icon name="alert" size={14} />
                  <span>{errors.rel}</span>
                </div>
              )}
            </div>

            {rel === 'Other' && (
              <div className="fld">
                <label htmlFor="cRelOther">How do you know them?</label>
                <input
                  className={`in ${errors.other ? 'bad' : ''}`}
                  id="cRelOther"
                  autoComplete="off"
                  placeholder="e.g. Landlord, colleague"
                  value={otherRel}
                  onChange={e => {
                    setOtherRel(e.target.value);
                    if (errors.other) setErrors(prev => ({ ...prev, other: '' }));
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddContact();
                    }
                  }}
                />
                {errors.other && (
                  <div className="g-err" role="alert">
                    <Icon name="alert" size={14} />
                    <span>{errors.other}</span>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-g"
                onClick={handleAddContact}
              >
                <Icon name="plus" size={16} /> Add contact
              </button>
              {contacts.length > 0 && (
                <button
                  type="button"
                  className="linkb mut"
                  onClick={() => {
                    setShowAddForm(false);
                    setErrors({});
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action bar */}
        <OnboardingActions
          showBack={true}
          onBack={() => setObStep('cameras')}
          showSkip={contacts.length === 0}
          skipLabel="Skip for now"
          onSkip={handleSkip}
          continueLabel="Continue"
          onContinue={handleContinue}
          continueType="button"
        />
      </div>
    </>
  );
};
