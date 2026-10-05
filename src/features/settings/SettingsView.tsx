import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useModals } from '../../context/ModalContext';
import { Icon } from '../../components/icons/Icon';
import { Toggle } from '../../components/common/Toggle';
import { FAQS } from '../../data/faqs';
import { initials } from '../../utils/formatters';

const SET_SECS = [
  { id: 'account', label: 'Account', icon: 'user' },
  { id: 'security', label: 'Security', icon: 'lock' },
  { id: 'faces', label: 'Face registry', icon: 'scan' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'preferences', label: 'Preferences', icon: 'gear' },
  { id: 'subscription', label: 'Subscription', icon: 'card' },
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

  const { openModal } = useModals();

  const activeSec = SET_SECS.some(s => s.id === route.a) ? (route.a as string) : 'account';
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
            onClick={() => setSignedOut(true)}
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
                    onClick={() => openModal({ type: 'plans' })}
                  >
                    Upgrade plan
                  </button>
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
