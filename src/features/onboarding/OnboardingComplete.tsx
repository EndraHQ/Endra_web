import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Icon } from '../../components/icons/Icon';
import { TYPE_META, planById } from '../../data/onboardingData';
import { plural } from '../../utils/formatters';

export const OnboardingComplete: React.FC = () => {
  const { account, onboardingData, completeOnboarding } = useAuth();
  const { setUser, setPlace, toast } = useApp();
  const [os, setOs] = useState<'ios' | 'android'>('ios');
  const [opening, setOpening] = useState(false);

  const d = onboardingData;
  const m = TYPE_META[d.type] || TYPE_META.Residence;
  const cams = d.cams || [];
  const pl = planById(d.plan || 'plus');
  const I = account?.installer;
  const email = account?.email || 'adaeze@example.com';
  const phone = account?.phone || '+234 803 415 9920';

  const handleFinish = () => {
    setOpening(true);
    setUser(prev => ({
      ...prev,
      name: account?.name || prev.name,
      email: account?.email || prev.email,
      phone: account?.phone || prev.phone,
      faceEnrolled: Boolean(d.face?.enrolled),
      faceTemplate: d.face?.tmpl || null,
      faceQuality: d.face?.enrolled ? 98 : 0,
      plan: pl.name
    }));
    if (d.pname) {
      setPlace('p1');
    }
    setTimeout(() => {
      completeOnboarding();
    }, 700);
  };

  const appStoreName = os === 'ios' ? 'App Store' : 'Google Play';
  const appUrl = os === 'ios' ? 'https://apps.apple.com/app/endra' : 'https://play.google.com/store/apps/details?id=io.endra.app';

  return (
    <>
      <h1 id="gH" tabIndex={-1}>
        Your ENDRA account is ready.
      </h1>
      <p className="sub">
        You can use ENDRA on the web right now, and take it with you on your phone.
      </p>

      <div className="card rdy-prop">
        <div className="rp-hd">
          <span className="si">
            <Icon name={m.ig} size={20} strokeWidth={1.6} />
          </span>
          <div className="mn">
            <b>{d.pname || 'My Home'}</b>
            <span>
              {d.address || '14 Admiralty Way'}, {d.area || 'Lekki Phase 1'}
            </span>
          </div>
          <span className="rp-live">All systems active</span>
        </div>
        <div className="rp-stats">
          <div>
            <small>Plan</small>
            <b>{pl.name.replace('ENDRA ', '')}</b>
          </div>
          <div>
            <small>Cameras</small>
            <b>{cams.length}</b>
          </div>
          <div>
            <small>Contacts</small>
            <b>{(d.contacts || []).length}</b>
          </div>
        </div>
      </div>

      {I && (
        <p className="ref-line" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--g300)', margin: '12px 0 16px' }}>
          <Icon name="users" size={15} /> Referred by <b>{I.name}</b>
        </p>
      )}

      <section className="card takecard" aria-label="Take ENDRA with you" style={{ marginTop: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 14px' }}>Take ENDRA with you</h2>
        <div className="appguide">
          <p className="ag-lead" style={{ fontSize: '13.5px', color: 'var(--g300)', marginBottom: '16px' }}>
            Install the ENDRA mobile app to get instant alerts, view live feeds with two-way talk, and trigger emergency SOS from anywhere.
          </p>
          <ol className="ag-steps" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ display: 'flex', gap: '14px', marginBottom: '18px' }}>
              <span className="ag-n" style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--g800)', border: '1px solid var(--g700)', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 600, flexShrink: 0 }} aria-hidden="true">1</span>
              <div className="mn" style={{ flex: 1 }}>
                <b>Download the app</b>
                <p style={{ margin: '4px 0 12px', fontSize: '13px', color: 'var(--g300)' }}>
                  Scan this code with your phone's camera to open ENDRA in the {appStoreName}.
                </p>
                <div className="ag-dl" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <figure className="ag-qr" style={{ margin: 0, textAlign: 'center' }}>
                    <div className="ag-qrbox" style={{ width: '130px', height: '130px', background: '#fff', borderRadius: '12px', padding: '8px', display: 'grid', placeItems: 'center' }}>
                      <svg width="114" height="114" viewBox="0 0 114 114" fill="none">
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
                    <figcaption style={{ fontSize: '11px', color: 'var(--g400)', marginTop: '6px' }}>Point camera at code</figcaption>
                  </figure>
                  <div className="ag-opts" style={{ flex: 1, minWidth: '220px' }}>
                    <div className="tabs" role="tablist" aria-label="Your phone" style={{ marginBottom: '12px' }}>
                      <button type="button" role="tab" aria-selected={os === 'ios'} className={`tab ${os === 'ios' ? 'on' : ''}`} onClick={() => setOs('ios')}>iPhone</button>
                      <button type="button" role="tab" aria-selected={os === 'android'} className={`tab ${os === 'android' ? 'on' : ''}`} onClick={() => setOs('android')}>Android</button>
                    </div>
                    <a className="btn btn-w btn-sm ag-open" href={appUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginBottom: '10px' }}>
                      Open the {appStoreName}
                    </a>
                    <div className="ag-or" style={{ fontSize: '12px', color: 'var(--g400)', marginBottom: '8px' }}>Or send the link to yourself</div>
                    <div className="ag-send" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-g btn-sm" onClick={() => toast('SMS link sent')}>
                        <Icon name="phone" size={14} /> Text link
                      </button>
                      <button type="button" className="btn btn-g btn-sm" onClick={() => toast('Email link sent')}>
                        <Icon name="chat" size={14} /> Email link
                      </button>
                      <button type="button" className="btn btn-g btn-sm" onClick={() => { navigator.clipboard?.writeText(appUrl); toast('Link copied'); }}>
                        <Icon name="link" size={14} /> Copy link
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
            <li style={{ display: 'flex', gap: '14px', marginBottom: '18px' }}>
              <span className="ag-n" style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--g800)', border: '1px solid var(--g700)', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 600, flexShrink: 0 }} aria-hidden="true">2</span>
              <div className="mn" style={{ flex: 1 }}>
                <b>Log in with your ENDRA account</b>
                <p style={{ margin: '4px 0 8px', fontSize: '13px', color: 'var(--g300)' }}>Use the same email or phone number and password you use here.</p>
                <div className="ag-chips" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="ag-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: 'var(--g800)', border: '1px solid var(--g700)', fontSize: '12px' }}>
                    <Icon name="user" size={13} /> {email}
                  </span>
                  <span className="ag-chip mono" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: 'var(--g800)', border: '1px solid var(--g700)', fontSize: '12px' }}>
                    <Icon name="phone" size={13} /> {phone}
                  </span>
                </div>
              </div>
            </li>
            <li style={{ display: 'flex', gap: '14px' }}>
              <span className="ag-n" style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--g800)', border: '1px solid var(--g700)', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 600, flexShrink: 0 }} aria-hidden="true">3</span>
              <div className="mn" style={{ flex: 1 }}>
                <b>Everything is already there</b>
                <p style={{ margin: '4px 0 8px', fontSize: '13px', color: 'var(--g300)' }}>Your property and cameras load as soon as you log in.</p>
                <div className="ag-chips" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="ag-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: 'var(--g800)', border: '1px solid var(--g700)', fontSize: '12px' }}>
                    <Icon name={m.ig} size={13} /> {d.pname || 'My Home'}
                  </span>
                  <span className="ag-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: 'var(--g800)', border: '1px solid var(--g700)', fontSize: '12px' }}>
                    <Icon name="cam" size={13} /> {plural(cams.length, 'camera')}
                  </span>
                </div>
              </div>
            </li>
          </ol>
          <div className="note ag-note" style={{ marginTop: '16px' }}>
            <Icon name="check" size={16} strokeWidth={2.2} />
            <span><b>No second registration.</b> One ENDRA account works on the web and on your phone.</span>
          </div>
        </div>
      </section>

      <div className="onb-actions" style={{ marginTop: '20px' }}>
        <span className="sp" />
        <button
          type="button"
          className="btn btn-w btn-lg"
          id="gFinish"
          disabled={opening}
          onClick={handleFinish}
        >
          {opening ? (
            <>
              <span className="spinline" /> Opening your portal
            </>
          ) : (
            'Open my portal'
          )}
        </button>
      </div>
    </>
  );
};
