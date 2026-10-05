import React from 'react';
import { useApp } from '../../context/AppContext';
import { useModals } from '../../context/ModalContext';
import { Icon } from '../../components/icons/Icon';
import { initials } from '../../utils/formatters';

export const AccessView: React.FC = () => {
  const {
    currentPlace,
    household,
    setHousehold,
    guests,
    setGuests,
    openConfirm,
    toast
  } = useApp();

  const { openModal } = useModals();

  const handleRemoveMember = (idx: number) => {
    const m = household[idx];
    openConfirm(
      `Remove ${m.name}?`,
      `They will lose access to ${currentPlace.name}.`,
      'Remove',
      () => {
        setHousehold(prev => prev.filter((_, i) => i !== idx));
        toast(`${m.name} removed`);
      }
    );
  };

  const handleRemoveGuest = (idx: number) => {
    const g = guests[idx];
    setGuests(prev => prev.filter((_, i) => i !== idx));
    toast(`${g.name} access revoked`);
  };

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>Shared access</h1>
          <p className="sub">
            Choose who can enter {currentPlace.name}. Guest access expires on its own.
          </p>
        </div>
        <div className="row">
          <button
            type="button"
            className="btn btn-g"
            onClick={() => openModal({ type: 'inviteGuest' })}
          >
            <Icon name="ticket" size={17} /> Invite guest
          </button>
          <button
            type="button"
            className="btn btn-w"
            onClick={() => openModal({ type: 'addMember' })}
          >
            <Icon name="plus" size={17} /> Add member
          </button>
        </div>
      </div>

      <div className="grid">
        {/* My Household */}
        <section className="s7">
          <div className="sec-hd">
            <h2>My household</h2>
          </div>
          <div className="card flush list">
            {household.length > 0 ? (
              household.map((m, i) => (
                <div key={i} className="li">
                  <div className="av">{initials(m.name)}</div>
                  <div className="mn">
                    <div className="t">{m.name}</div>
                    <div className="s">{m.rel}</div>
                  </div>
                  <span className="rb">
                    {m.type === 'child'
                      ? `Age ${m.age}`
                      : m.type === 'staff'
                      ? 'Staff'
                      : 'Adult'}
                  </span>
                  <button
                    type="button"
                    className="ibtn"
                    style={{ width: '36px', height: '36px' }}
                    onClick={() => handleRemoveMember(i)}
                    aria-label={`Remove ${m.name}`}
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="empty">No members yet.</div>
            )}
          </div>
        </section>

        {/* Guests */}
        <section className="s5">
          <div className="sec-hd">
            <h2>Guests</h2>
          </div>
          <div className="card flush list">
            {guests.length > 0 ? (
              guests.map((g, i) => (
                <div key={i} className="li">
                  <div className="ico">🎟️</div>
                  <div className="mn">
                    <div className="t">{g.name}</div>
                    <div className="s">
                      {g.to ? `Expires ${g.to}` : 'Temporary access'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-g btn-sm"
                    onClick={() => handleRemoveGuest(i)}
                  >
                    Revoke
                  </button>
                </div>
              ))
            ) : (
              <div className="empty">No active guests.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
