import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/icons/Icon';
import { TYPE_META, NG_STATES } from '../../data/onboardingData';
import { OnboardingActions } from './OnboardingActions';

const OPTS = {
  entries: ['1', '2', '3', '4', '5+'],
  floors: ['1', '2', '3', '4+'],
  people: ['Just me', '2–5', '6–20', '21–100', '100+'],
  guard: ['Yes', 'No', 'Sometimes'],
  roles: ['Owner', 'Tenant', 'Manager']
};

export const PropertyStep: React.FC = () => {
  const {
    onboardingData,
    updateOnboardingData,
    markStepComplete,
    setObStep
  } = useAuth();

  const [subPhase, setSubPhase] = useState<'main' | 'details'>('main');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDetails = subPhase === 'details';
  const currentType = onboardingData.type || 'Residence';

  const handleNextMain = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!onboardingData.pname?.trim() || onboardingData.pname.trim().length < 2) {
      newErrors.pname = 'Give your property a name, for example “My Home”.';
    }
    if (!onboardingData.address?.trim() || onboardingData.address.trim().length < 4) {
      newErrors.address = 'Enter the street address, for example “14 Admiralty Way”.';
    }
    if (!onboardingData.area?.trim() || onboardingData.area.trim().length < 2) {
      newErrors.area = 'Enter the area or neighbourhood, for example “Lekki Phase 1”.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubPhase('details');
  };

  const handleNextDetails = (e: React.FormEvent) => {
    e.preventDefault();
    markStepComplete('property', 'done');
    setObStep('pins');
  };

  return (
    <>
      <header className="onb-hd">
        <span className="onb-ic" aria-hidden="true">
          <Icon name="building" size={24} strokeWidth={1.6} />
        </span>
        <div>
          <h1 id="gH" tabIndex={-1}>
            {isDetails ? 'A few basic details' : 'Tell us about your property'}
          </h1>
          <p className="sub">
            {isDetails
              ? `These help ENDRA suggest the right cameras and zones for ${onboardingData.pname || 'your property'}. Pick the closest answer.`
              : 'This is the first site ENDRA will watch over. Next, a few quick details about it.'}
          </p>
        </div>
      </header>

      <div className="onb-fm">
        {/* Two-part indicator */}
        <ol className="phases" aria-label="Your property, in two parts">
          <li
            className={isDetails ? 'ok' : 'on'}
            {...(!isDetails ? { 'aria-current': 'step' } : {})}
          >
            {isDetails && <Icon name="check" size={13} strokeWidth={2.6} />}
            Property and location
          </li>
          <li
            className={isDetails ? 'on' : ''}
            {...(isDetails ? { 'aria-current': 'step' } : {})}
          >
            Basic details
          </li>
        </ol>

        {!isDetails ? (
          <form onSubmit={handleNextMain} noValidate>
            {/* Property Type Radio Cards */}
            <div className="fld" role="radiogroup" aria-labelledby="lT">
              <span className="lbl" id="lT">
                Property type
              </span>
              <div className="opt-grid">
                {Object.entries(TYPE_META).map(([k, m]) => (
                  <label key={k} className="rc">
                    <input
                      type="radio"
                      name="ptype"
                      value={k}
                      checked={currentType === k}
                      onChange={() => {
                        updateOnboardingData({ type: k });
                      }}
                    />
                    <span className="rc-in">
                      <span className="rc-ic">
                        <Icon name={m.ig} size={20} />
                      </span>
                      <span>
                        <b>{m.lbl}</b>
                        <small>{m.sub}</small>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Property Name */}
            <div className="fld">
              <label htmlFor="pName">Property name</label>
              <input
                className={`in ${errors.pname ? 'bad' : ''}`}
                id="pName"
                type="text"
                placeholder={TYPE_META[currentType]?.ph || 'My Home'}
                value={onboardingData.pname}
                onChange={e => {
                  updateOnboardingData({ pname: e.target.value });
                  if (errors.pname) setErrors(prev => ({ ...prev, pname: '' }));
                }}
              />
              {errors.pname && (
                <div className="g-err" role="alert">
                  <Icon name="alert" size={14} />
                  <span>{errors.pname}</span>
                </div>
              )}
            </div>

            {/* Street Address */}
            <div className="fld">
              <label htmlFor="pAddr">Street address</label>
              <input
                className={`in ${errors.address ? 'bad' : ''}`}
                id="pAddr"
                type="text"
                placeholder="e.g. 14 Admiralty Way"
                value={onboardingData.address}
                onChange={e => {
                  updateOnboardingData({ address: e.target.value });
                  if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                }}
              />
              {errors.address && (
                <div className="g-err" role="alert">
                  <Icon name="alert" size={14} />
                  <span>{errors.address}</span>
                </div>
              )}
            </div>

            {/* State and Area */}
            <div className="frow">
              <div className="fld">
                <label htmlFor="pState">State</label>
                <select
                  className="in"
                  id="pState"
                  value={onboardingData.state || 'Lagos'}
                  onChange={e => updateOnboardingData({ state: e.target.value })}
                >
                  {NG_STATES.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fld">
                <label htmlFor="pArea">Area or LGA</label>
                <input
                  className={`in ${errors.area ? 'bad' : ''}`}
                  id="pArea"
                  type="text"
                  placeholder="e.g. Lekki Phase 1"
                  value={onboardingData.area}
                  onChange={e => {
                    updateOnboardingData({ area: e.target.value });
                    if (errors.area) setErrors(prev => ({ ...prev, area: '' }));
                  }}
                />
                {errors.area && (
                  <div className="g-err" role="alert">
                    <Icon name="alert" size={14} />
                    <span>{errors.area}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Your Role */}
            <div className="fld" role="radiogroup" aria-labelledby="lR">
              <span className="lbl" id="lR">
                Your role here
              </span>
              <div className="rcs">
                {OPTS.roles.map(r => (
                  <label key={r} className="rc rcp">
                    <input
                      type="radio"
                      name="prole"
                      value={r}
                      checked={(onboardingData.role || 'Owner') === r}
                      onChange={() => updateOnboardingData({ role: r })}
                    />
                    <span className="rc-in">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action bar */}
            <OnboardingActions
              showBack={false}
              continueLabel="Continue to basic details"
              continueType="submit"
            />
          </form>
        ) : (
          <form onSubmit={handleNextDetails} noValidate>
            {/* Entries and Floors */}
            <div className="frow">
              <div className="fld">
                <label htmlFor="pEntries">Gates and entry doors</label>
                <select
                  className="in"
                  id="pEntries"
                  value={onboardingData.entries || '1'}
                  onChange={e => updateOnboardingData({ entries: e.target.value })}
                >
                  {OPTS.entries.map(o => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fld">
                <label htmlFor="pFloors">Floors</label>
                <select
                  className="in"
                  id="pFloors"
                  value={onboardingData.floors || '1'}
                  onChange={e => updateOnboardingData({ floors: e.target.value })}
                >
                  {OPTS.floors.map(o => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* People on site */}
            <div className="fld">
              <label htmlFor="pPeople">People on site on a normal day</label>
              <select
                className="in"
                id="pPeople"
                value={onboardingData.people || '2–5'}
                onChange={e => updateOnboardingData({ people: e.target.value })}
              >
                {OPTS.people.map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Security Guard */}
            <div className="fld" role="radiogroup" aria-labelledby="lG">
              <span className="lbl" id="lG">
                Security guard on site
              </span>
              <div className="rcs">
                {OPTS.guard.map(r => (
                  <label key={r} className="rc rcp">
                    <input
                      type="radio"
                      name="pguard"
                      value={r}
                      checked={(onboardingData.guard || 'No') === r}
                      onChange={() => updateOnboardingData({ guard: r })}
                    />
                    <span className="rc-in">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action bar */}
            <OnboardingActions
              showBack={true}
              onBack={() => setSubPhase('main')}
              continueLabel="Continue"
              continueType="submit"
            />
          </form>
        )}
      </div>
    </>
  );
};
