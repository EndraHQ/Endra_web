import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useModals } from '../../context/ModalContext';
import { Icon } from '../../components/icons/Icon';
import { Toggle } from '../../components/common/Toggle';
import { FAQS } from '../../data/faqs';
import { MAX_CONTACTS, REL_OPTS } from '../../data/onboardingData';
import { initials } from '../../utils/formatters';
import { normPhone, phoneOk, fmtPhone } from '../../utils/authHelpers';
import { api, EmergencyContactResponseSchema } from '../../services/api';

const SET_SECS = [
  { id: 'account', label: 'Account', icon: 'user' },
  { id: 'security', label: 'Security', icon: 'lock' },
  { id: 'contacts', label: 'Emergency contacts', icon: 'phone' },
  { id: 'faces', label: 'Face registry', icon: 'scan' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'preferences', label: 'Preferences', icon: 'gear' },
  { id: 'subscription', label: 'Subscription', icon: 'card' },
  { id: 'app', label: 'Mobile app', icon: 'device' },
  { id: 'help', label: 'Help & support', icon: 'help' }
];

export const SettingsView: React.FC = () => {
  const {
    route,
    go,
    user,
    settings,
    setSettings,
    faceReg,
    setFaceReg,
    currentPlace,
    setSignedOut,
    openConfirm,
    setAppearance,
    toast
  } = useApp();

  const { account, onboardingData, updateOnboardingData, logout } = useAuth();
  const { openModal } = useModals();

  const activeSec = SET_SECS.some(s => s.id === route.a) ? (route.a as string) : 'account';
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Contacts state
  const [backendContacts, setBackendContacts] = useState<EmergencyContactResponseSchema[]>([]);
  const [contactsLoading, setContactsLoading] = useState<boolean>(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [isSavingContact, setIsSavingContact] = useState<boolean>(false);

  const [showAddContact, setShowAddContact] = useState(false);
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cRel, setCRel] = useState('Spouse');
  const [cOther, setCOther] = useState('');
  const [cErr, setCErr] = useState<Record<string, string>>({});

  const userId = Number(account?.userId || account?.id);

  const fetchContacts = useCallback(async () => {
    if (!userId || isNaN(userId)) return;
    setContactsLoading(true);
    setContactsError(null);
    try {
      const res = await api.getEmergencyContacts(userId);
      setBackendContacts(Array.isArray(res) ? res : []);
    } catch (err: any) {
      console.warn('Failed to load emergency contacts from backend:', err);
      setContactsError(err?.message || 'Could not load contacts from server');
    } finally {
      setContactsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (activeSec === 'contacts' && userId) {
      fetchContacts();
    }
  }, [activeSec, userId, fetchContacts]);

  interface NormalizedContact {
    id: number | string;
    backendId?: number;
    name: string;
    phone: string;
    rel: string;
  }

  const displayedContacts: NormalizedContact[] = useMemo(() => {
    if (userId && backendContacts.length > 0) {
      return backendContacts.map(c => ({
        id: c.id,
        backendId: c.id,
        name: c.full_name,
        phone: c.phone_number,
        rel: c.relation
      }));
    }
    return (onboardingData.contacts || []).map((c, i) => ({
      id: `local-${i}`,
      name: c.name,
      phone: c.phone,
      rel: c.rel
    }));
  }, [userId, backendContacts, onboardingData.contacts]);

  // App guide state
  const [appOs, setAppOs] = useState<'ios' | 'android'>('ios');

  const toggleSetting = (k: keyof typeof settings) => {
    setSettings(prev => {
      const next = !prev[k];
      toast(next ? 'Enabled' : 'Disabled');
      return { ...prev, [k]: next };
    });
  };

  const deleteFace = (idx: number) => {
    const f = faceReg[idx];
    if (!f) return;
    openConfirm(
      f.me ? 'Remove your face?' : `Remove ${f.name}?`,
      f.me
        ? 'Your biometric template will be deleted. Gates at your connected properties will no longer recognise you, and you will need a PIN or escort for entry.'
        : `${f.name}’s face will be removed from the registry. Cameras will no longer recognise them as a resident.`,
      'Remove face',
      () => {
        setFaceReg(prev => prev.filter((_, i) => i !== idx));
        if (f.me) {
          useApp().setUser(prev => ({
            ...prev,
            faceEnrolled: false,
            faceTemplate: null,
            faceQuality: 0
          }));
        }
        toast(`${f.me ? 'Your face' : f.name} removed from registry`);
      }
    );
  };

  const handleSaveContact = async () => {
    const err: Record<string, string> = {};
    const cleanName = cName.trim().replace(/\s+/g, ' ');
    const cleanPhone = normPhone(cPhone);

    if (cleanName.length < 2) err.name = 'Enter their name.';
    if (!phoneOk(cleanPhone)) err.phone = 'Enter a valid Nigerian mobile number.';
    else if (displayedContacts.some(c => c.phone === cleanPhone)) err.phone = 'You’ve already added this number.';

    if (Object.keys(err).length > 0) {
      setCErr(err);
      return;
    }

    const relValue = cRel === 'Other' ? cOther.trim() || 'Other' : cRel;

    if (userId) {
      setIsSavingContact(true);
      try {
        const created = await api.addEmergencyContact({
          full_name: cleanName,
          phone_number: cleanPhone,
          relation: relValue
        }, userId);
        setBackendContacts(prev => [...prev, created]);
        toast(`${cleanName} added to emergency contacts`);
        setCName('');
        setCPhone('');
        setCRel('Spouse');
        setCOther('');
        setCErr({});
        setShowAddContact(false);
      } catch (saveErr: any) {
        setCErr({ name: saveErr?.message || 'Failed to save contact on server.' });
      } finally {
        setIsSavingContact(false);
      }
    } else {
      const nextContacts = [
        ...(onboardingData.contacts || []),
        {
          name: cleanName,
          phone: cleanPhone,
          rel: relValue
        }
      ];
      updateOnboardingData({ contacts: nextContacts });
      setCName('');
      setCPhone('');
      setCRel('Spouse');
      setCOther('');
      setCErr({});
      setShowAddContact(false);
      toast(`${cleanName} added to emergency contacts`);
    }
  };

  const handleDeleteContact = (contact: NormalizedContact) => {
    openConfirm(
      `Remove ${contact.name}?`,
      'This contact will no longer be alerted when you press SOS.',
      'Remove contact',
      async () => {
        if (userId && contact.backendId) {
          try {
            await api.deleteEmergencyContact(contact.backendId, userId);
            setBackendContacts(prev => prev.filter(c => c.id !== contact.backendId));
            toast(`${contact.name} removed`);
          } catch (delErr: any) {
            toast(delErr?.message || 'Failed to remove contact');
          }
        } else {
          const next = (onboardingData.contacts || []).filter(c => c.phone !== contact.phone);
          updateOnboardingData({ contacts: next });
          toast(`${contact.name} removed`);
        }
      },
      true
    );
  };

  const setRow = (
    ico: React.ReactNode,
    title: string,
    subtitle: string,
    onClick: () => void,
    rightElement?: React.ReactNode
  ) => (
    <div
      className="li click"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => {
        if (e.key === 'Enter') onClick();
      }}
    >
      <div className="ico">{ico}</div>
      <div className="mn">
        <div className="t">{title}</div>
        <div className="s">{subtitle}</div>
      </div>
      {rightElement || <Icon name="chevr" size={16} />}
    </div>
  );

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>Settings</h1>
          <p className="sub">Your account, security and preferences.</p>
        </div>
      </div>

      <div className="setgrid">
        <nav className="snav" aria-label="Settings sections">
          {SET_SECS.map(s => (
            <button
              key={s.id}
              type="button"
              className={`nav-i ${s.id === activeSec ? 'on' : ''}`}
              onClick={() => go(`settings/${s.id}`)}
            >
              <Icon name={s.icon} size={19} />
              <span>{s.label}</span>
            </button>
          ))}
          <hr
            style={{
              border: 0,
              height: '1px',
              background: 'var(--g800)',
              margin: '8px 0'
            }}
          />
          <button
            type="button"
            className="nav-i"
            style={{ color: 'var(--red)' }}
            onClick={() => logout()}
          >
            <Icon name="logout" size={19} />
            <span>Log out</span>
          </button>
        </nav>

        <div className="setpane">
          {/* Account Section */}
          {activeSec === 'account' && (
            <section>
              <div className="card row" style={{ gap: '18px', marginBottom: '20px' }}>
                <div className="av" style={{ width: '64px', height: '64px', fontSize: '22px' }}>
                  {initials(user.name)}
                </div>
                <div>
                  <h2 style={{ fontSize: '20px' }}>{user.name}</h2>
                  <div className="muted" style={{ marginTop: '2px' }}>
                    {user.faceEnrolled ? 'Face ID enrolled' : 'Face ID not set up'}
                  </div>
                </div>
              </div>

              <div className="card flush list">
                {setRow(
                  <Icon name="user" size={19} />,
                  'Full name',
                  user.name,
                  () => openModal({ type: 'editField', field: 'name' })
                )}
                {setRow(
                  <Icon name="phone" size={19} />,
                  'Phone',
                  user.phone,
                  () => openModal({ type: 'editField', field: 'phone' })
                )}
                {setRow(
                  <Icon name="doc" size={19} />,
                  'Email',
                  user.email,
                  () => openModal({ type: 'editField', field: 'email' })
                )}
                {setRow(
                  <Icon name="scan" size={19} />,
                  'Face ID',
                  user.faceEnrolled
                    ? `Enrolled · ${user.faceTemplate} · quality ${user.faceQuality}%`
                    : 'Not enrolled · set it up',
                  () => openModal({ type: 'faceEnrol' })
                )}
                {setRow(
                  '🆔',
                  'Government ID',
                  user.govIdPending
                    ? 'Pending review'
                    : user.govIdVerified
                    ? `Verified · ${user.govIdType}`
                    : 'Not verified',
                  () => openModal({ type: 'govId' })
                )}
              </div>
            </section>
          )}

          {/* Security Section */}
          {activeSec === 'security' && (
            <section>
              <div className="card flush list">
                {setRow(
                  <Icon name="key" size={19} />,
                  'Access PIN',
                  'Arm, disarm and confirm actions',
                  () => openModal({ type: 'pinKeypad', tab: 'access' })
                )}
                {setRow(
                  <Icon name="shield" size={19} />,
                  'Duress PIN',
                  'Silently alerts operators under threat',
                  () => openModal({ type: 'pinKeypad', tab: 'duress' })
                )}

                <div className="li">
                  <div className="ico">
                    <Icon name="lock" size={19} />
                  </div>
                  <div className="mn">
                    <div className="t">Two-factor authentication</div>
                    <div className="s">Extra code required at sign-in</div>
                  </div>
                  <Toggle
                    checked={settings.twoFA}
                    onChange={() => {
                      setSettings(prev => ({ ...prev, twoFA: !prev.twoFA }));
                      toast(
                        !settings.twoFA
                          ? 'Two-factor authentication enabled'
                          : 'Two-factor authentication disabled'
                      );
                    }}
                  />
                </div>

                {setRow(
                  <Icon name="scan" size={19} />,
                  'Face data',
                  user.faceEnrolled ? 'Enrolled · manage or remove' : 'Not enrolled',
                  () => go('settings/faces')
                )}

                <div className="li">
                  <div className="ico">
                    <Icon name="device" size={19} />
                  </div>
                  <div className="mn">
                    <div className="t">Active sessions</div>
                    <div className="s">This browser · 2 others signed in</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-g btn-sm"
                    onClick={() => toast('Signed out of 2 other sessions')}
                  >
                    Sign out others
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Emergency Contacts Section */}
          {activeSec === 'contacts' && (
            <section>
              <div className="sec-hd">
                <div>
                  <h2>Emergency contacts · {displayedContacts.length}</h2>
                  <p className="sub" style={{ marginTop: '3px' }}>
                    When you press SOS, ENDRA alerts these people along with the operators.
                  </p>
                </div>
                {displayedContacts.length < MAX_CONTACTS && !showAddContact && (
                  <button
                    type="button"
                    className="btn btn-w btn-sm"
                    onClick={() => setShowAddContact(true)}
                  >
                    <Icon name="plus" size={16} /> Add contact
                  </button>
                )}
              </div>

              {contactsError && (
                <div
                  className="alert alert-err"
                  style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--red)',
                    color: 'var(--red)',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>{contactsError}</span>
                  <button type="button" className="btn btn-sm btn-g" onClick={() => fetchContacts()}>
                    Retry
                  </button>
                </div>
              )}

              {showAddContact && (
                <div className="card" style={{ marginBottom: '16px' }}>
                  <div className="cardhd">Add emergency contact</div>
                  <div className="fld">
                    <label htmlFor="scName">Full name</label>
                    <input
                      className={`in ${cErr.name ? 'bad' : ''}`}
                      id="scName"
                      value={cName}
                      placeholder="e.g. Chidi Okonkwo"
                      onChange={e => setCName(e.target.value)}
                    />
                    {cErr.name && <span className="fld-err">{cErr.name}</span>}
                  </div>
                  <div className="fld">
                    <label htmlFor="scPhone">Phone number</label>
                    <div className={`pfx ${cErr.phone ? 'bad' : ''}`}>
                      <span>+234</span>
                      <input
                        id="scPhone"
                        type="tel"
                        placeholder="803 415 9920"
                        value={cPhone}
                        onChange={e => setCPhone(e.target.value)}
                      />
                    </div>
                    {cErr.phone && <span className="fld-err">{cErr.phone}</span>}
                  </div>
                  <div className="fld">
                    <span className="lbl">Relationship</span>
                    <div className="rcs">
                      {REL_OPTS.map(r => (
                        <label key={r} className="rc rcp">
                          <input
                            type="radio"
                            name="scRel"
                            value={r}
                            checked={cRel === r}
                            onChange={() => setCRel(r)}
                          />
                          <span className="rc-in">{r}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <button
                      type="button"
                      className="btn btn-w"
                      disabled={isSavingContact}
                      onClick={handleSaveContact}
                    >
                      {isSavingContact ? 'Saving…' : 'Save contact'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-g"
                      disabled={isSavingContact}
                      onClick={() => setShowAddContact(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="card flush list">
                {contactsLoading ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--g400)', fontSize: '13px' }}>
                    Loading contacts…
                  </div>
                ) : displayedContacts.length > 0 ? (
                  displayedContacts.map((c) => (
                    <div key={c.id} className="li">
                      <div className="av">{initials(c.name)}</div>
                      <div className="mn">
                        <div className="t">{c.name}</div>
                        <div className="s">{c.rel} · {fmtPhone(c.phone)}</div>
                      </div>
                      <button
                        type="button"
                        className="ibtn"
                        style={{ width: '36px', height: '36px' }}
                        onClick={() => handleDeleteContact(c)}
                        aria-label={`Remove ${c.name}`}
                      >
                        <Icon name="trash" size={17} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty">
                    <h3>No emergency contacts yet</h3>
                    <p>Add someone ENDRA can contact when you press SOS.</p>
                  </div>
                )}
              </div>
              <p className="note" style={{ marginTop: '14px' }}>
                You can add up to {MAX_CONTACTS} contacts.
              </p>
            </section>
          )}

          {/* Face Registry Section */}
          {activeSec === 'faces' && (
            <section>
              <div className="sec-hd">
                <div>
                  <h2>Residents · {faceReg.length}</h2>
                  <p className="sub" style={{ marginTop: '3px' }}>
                    Faces enrolled as residents of {currentPlace.name}. Cameras open gates for them automatically, with no alert raised.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-w btn-sm"
                  onClick={() => openModal({ type: 'faceEnrol' })}
                >
                  <Icon name="plus" size={16} /> Enrol a face
                </button>
              </div>

              <div className="card flush list">
                {faceReg.length > 0 ? (
                  faceReg.map((f, i) => (
                    <div key={i} className="li">
                      <i className="sd g" />
                      <div className="mn">
                        <div className="t">
                          {f.name}
                          {f.me && <span className="cur">• You</span>}
                        </div>
                        <div className="s">{f.sub}</div>
                      </div>
                      <button
                        type="button"
                        className="ibtn"
                        style={{ width: '36px', height: '36px' }}
                        onClick={() => deleteFace(i)}
                        aria-label={`Remove ${f.name}`}
                      >
                        <Icon name="trash" size={17} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty">No faces enrolled.</div>
                )}
              </div>

              <p className="note" style={{ marginTop: '14px' }}>
                Faces are matched as an encrypted template. ENDRA does not store photographs of residents.
              </p>
            </section>
          )}

          {/* Notifications Section */}
          {activeSec === 'notifications' && (
            <section>
              <div className="card flush list">
                {[
                  ['notifPush', 'Push alerts', 'General app notifications'],
                  ['notifIncident', 'Incident alerts', 'Threats, alarms, SOS activity'],
                  ['notifSystem', 'System updates', 'Device & connectivity status'],
                  ['notifMarketing', 'News & offers', 'Product updates and promotions']
                ].map(([key, label, desc]) => (
                  <div key={key} className="li">
                    <div className="mn">
                      <div className="t">{label}</div>
                      <div className="s">{desc}</div>
                    </div>
                    <Toggle
                      checked={settings[key as keyof typeof settings] as boolean}
                      onChange={() => toggleSetting(key as keyof typeof settings)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Preferences Section */}
          {activeSec === 'preferences' && (
            <section>
              <div className="card">
                <div className="sec-hd">
                  <div>
                    <h2>Appearance</h2>
                    <p className="sub" style={{ marginTop: '3px' }}>
                      Light is the default. You can also switch from the sun/moon button in the top bar.
                    </p>
                  </div>
                </div>
                <div className="chips">
                  {(['Dark', 'Light', 'System'] as const).map(a => (
                    <button
                      key={a}
                      type="button"
                      className={`chip ${settings.appearance === a ? 'on' : ''}`}
                      onClick={() => {
                        setSettings(prev => ({ ...prev, appearance: a }));
                        setAppearance(a);
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card" style={{ marginTop: '20px' }}>
                <div className="fld" style={{ margin: 0 }}>
                  <label htmlFor="lang">Language</label>
                  <select
                    className="in"
                    id="lang"
                    value={settings.language}
                    onChange={e => {
                      const l = e.target.value;
                      setSettings(prev => ({ ...prev, language: l }));
                      toast(
                        l === 'English'
                          ? 'Language set to English'
                          : `Language set to ${l} · interface text stays in English for this preview`
                      );
                    }}
                  >
                    {[
                      'English',
                      'Yoruba',
                      'Igbo',
                      'Hausa',
                      'Nigerian Pidgin'
                    ].map(l => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <span className="muted" style={{ fontSize: '12.5px' }}>
                    Interface text stays in English in this preview.
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Subscription Section */}
          {activeSec === 'subscription' && (
            <section>
              <div className="plan">
                <span className="pill green">Current plan</span>
                <h2 style={{ fontSize: '22px', marginTop: '12px' }}>{user.plan}</h2>
                <div className="pr">
                  ₦8,500<small>/month</small>
                </div>
                <p className="muted" style={{ marginTop: '8px' }}>
                  Renews on the 14th · up to 10 cameras · GPS tracking
                </p>
                <div className="actions">
                  <button
                    type="button"
                    className="btn btn-w"
                    onClick={() => go('plans')}
                  >
                    View plans & billing
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Mobile App Section */}
          {activeSec === 'app' && (
            <section>
              <div className="card">
                <div className="sec-hd">
                  <div>
                    <h2>Take ENDRA with you</h2>
                    <p className="sub" style={{ marginTop: '3px' }}>
                      Install the ENDRA mobile app to monitor your property from anywhere.
                    </p>
                  </div>
                </div>

                <div className="ag-dl" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '140px', height: '140px', background: '#fff', borderRadius: '12px', padding: '10px', display: 'grid', placeItems: 'center' }}>
                      <svg width="120" height="120" viewBox="0 0 114 114" fill="none">
                        <rect width="114" height="114" fill="#fff" />
                        <rect x="8" y="8" width="32" height="32" rx="4" fill="#000" />
                        <rect x="14" y="14" width="20" height="20" fill="#fff" />
                        <rect x="18" y="18" width="12" height="12" fill="#000" />
                        <rect x="74" y="8" width="32" height="32" rx="4" fill="#000" />
                        <rect x="80" y="14" width="20" height="20" fill="#fff" />
                        <rect x="84" y="18" width="12" height="12" fill="#000" />
                        <rect x="8" y="74" width="32" height="32" rx="4" fill="#000" />
                        <rect x="14" y="80" width="20" height="20" fill="#fff" />
                        <rect x="18" y="84" width="12" height="12" fill="#000" />
                        <circle cx="57" cy="57" r="10" fill="#000" />
                        <rect x="48" y="12" width="6" height="16" fill="#000" />
                        <rect x="60" y="86" width="16" height="6" fill="#000" />
                        <rect x="86" y="56" width="14" height="6" fill="#000" />
                      </svg>
                    </div>
                    <small className="muted" style={{ display: 'block', marginTop: '6px' }}>Scan with camera</small>
                  </div>

                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div className="tabs" role="tablist" aria-label="Your phone" style={{ marginBottom: '14px' }}>
                      <button type="button" role="tab" aria-selected={appOs === 'ios'} className={`tab ${appOs === 'ios' ? 'on' : ''}`} onClick={() => setAppOs('ios')}>iPhone</button>
                      <button type="button" role="tab" aria-selected={appOs === 'android'} className={`tab ${appOs === 'android' ? 'on' : ''}`} onClick={() => setAppOs('android')}>Android</button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-g btn-sm" onClick={() => toast('SMS link sent to ' + user.phone)}>
                        <Icon name="phone" size={14} /> Text link
                      </button>
                      <button type="button" className="btn btn-g btn-sm" onClick={() => toast('Email link sent to ' + user.email)}>
                        <Icon name="chat" size={14} /> Email link
                      </button>
                      <button type="button" className="btn btn-g btn-sm" onClick={() => { navigator.clipboard?.writeText('https://apps.apple.com/app/endra'); toast('Link copied'); }}>
                        <Icon name="link" size={14} /> Copy link
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Help Section */}
          {activeSec === 'help' && (
            <>
              <section>
                <div className="card flush list">
                  {setRow(
                    <Icon name="chat" size={19} />,
                    'Chat with support',
                    'Typically replies in minutes',
                    () => go('messages/0')
                  )}
                  <a className="li click" href="tel:112">
                    <div className="ico">
                      <Icon name="phone" size={19} />
                    </div>
                    <div className="mn">
                      <div className="t">Emergency hotline</div>
                      <div className="s">Call 112</div>
                    </div>
                    <Icon name="chevr" size={16} />
                  </a>
                </div>
              </section>

              <section style={{ marginTop: '24px' }}>
                <div className="sec-hd">
                  <h2>Help center</h2>
                </div>
                <div className="card flush">
                  {FAQS.map((f, i) => {
                    const isOpen = openFaq === i;
                    return (
                      <div
                        key={i}
                        className={`faq ${isOpen ? 'open' : ''}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') setOpenFaq(isOpen ? null : i);
                        }}
                      >
                        <b>
                          {f[0]}
                          <Icon name="chev" size={16} />
                        </b>
                        <p>{f[1]}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
