import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useModals } from '../../context/ModalContext';
import { Icon } from '../../components/icons/Icon';
import { roleTone, plural } from '../../utils/formatters';

export const PropertiesView: React.FC = () => {
  const {
    places,
    setPlaces,
    connected,
    setConnected,
    currentPlaceId,
    setPlace,
    openConfirm,
    go,
    toast
  } = useApp();

  const { openModal } = useModals();

  const [activePlaceMenu, setActivePlaceMenu] = useState<{ id: string; rect: DOMRect } | null>(null);
  const [activeConnMenu, setActiveConnMenu] = useState<{ id: string; rect: DOMRect } | null>(null);

  const handlePlaceMenuClick = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    setActivePlaceMenu({ id, rect: e.currentTarget.getBoundingClientRect() });
  };

  const handleConnMenuClick = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    setActiveConnMenu({ id, rect: e.currentTarget.getBoundingClientRect() });
  };

  const handleLeavePlace = (id: string) => {
    const p = places.find(x => x.id === id);
    if (places.length < 2) {
      toast('You need at least one property on your account');
      return;
    }
    openConfirm(
      `Remove ${p?.name}?`,
      'The property and its devices will be removed from your account.',
      'Remove property',
      () => {
        setPlaces(prev => prev.filter(x => x.id !== id));
        if (currentPlaceId === id) {
          const next = places.find(x => x.id !== id);
          if (next) setPlace(next.id);
        }
        toast('Property removed');
      }
    );
  };

  const handleLeaveConn = (id: string) => {
    const c = connected.find(x => x.id === id);
    openConfirm(
      `Leave ${c?.name}?`,
      'You will lose the access that comes with your role at this property.',
      'Leave property',
      () => {
        setConnected(prev => prev.filter(x => x.id !== id));
        toast(`Left ${c?.name}`);
      }
    );
  };

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>Properties</h1>
          <p className="sub">
            Switch properties from the header. Here you manage them — add, connect, rename, share or leave.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-w"
          onClick={() => openModal({ type: 'connectProperty' })}
        >
          <Icon name="plus" size={17} /> Connect to a property
        </button>
      </div>

      <div className="sec-hd">
        <h2>Properties you own or manage</h2>
      </div>

      <div className="card flush list">
        {places.length > 0 ? (
          places.map(p => {
            const isCurrent = p.id === currentPlaceId;
            return (
              <div key={p.id} className="li">
                <div className="ico">
                  <Icon name={p.ig} size={20} />
                </div>
                <div className="mn">
                  <div className="t">
                    {p.name}
                    {isCurrent && <span className="cur">• Current</span>}
                  </div>
                  <div className="s">
                    {p.type} · {p.loc} · {plural(p.cams, 'camera')}
                  </div>
                </div>
                <span className={`rb ${roleTone(p.role)}`}>{p.role}</span>
                {!isCurrent && (
                  <button
                    type="button"
                    className="btn btn-g btn-sm"
                    onClick={() => setPlace(p.id)}
                  >
                    Switch
                  </button>
                )}
                <button
                  type="button"
                  className="ibtn"
                  style={{ width: '36px', height: '36px' }}
                  onClick={e => handlePlaceMenuClick(e, p.id)}
                  aria-label={`Manage ${p.name}`}
                >
                  <Icon name="more" size={18} />
                </button>
              </div>
            );
          })
        ) : (
          <div className="empty">No properties yet.</div>
        )}
      </div>

      <div className="sec-hd" style={{ marginTop: '34px' }}>
        <div>
          <h2>Connected properties</h2>
          <p className="sub" style={{ marginTop: '3px' }}>
            One ENDRA account, many communities. Each property gives you a role — owner, tenant, visitor, employee — without a separate account.
          </p>
        </div>
      </div>

      <div className="card flush list">
        {connected.length > 0 ? (
          connected.map(c => (
            <div key={c.id} className="li">
              <div className="ico">
                <Icon name={c.ig} size={20} />
              </div>
              <div className="mn">
                <div className="t">{c.name}</div>
                <div className="s">
                  {c.property ? `${c.property} · ` : ''}
                  {c.loc}
                </div>
              </div>
              {c.status === 'pending' && <span className="rb pend">Pending</span>}
              <span className={`rb ${roleTone(c.role)}`}>{c.role}</span>
              <button
                type="button"
                className="ibtn"
                style={{ width: '36px', height: '36px' }}
                onClick={e => handleConnMenuClick(e, c.id)}
                aria-label={`Manage ${c.name}`}
              >
                <Icon name="more" size={18} />
              </button>
            </div>
          ))
        ) : (
          <div className="empty">Not connected to any properties yet.</div>
        )}
      </div>

      {/* Place Context Menu */}
      {activePlaceMenu && (
        <>
          <div
            className="menu-backdrop"
            style={{ position: 'fixed', inset: 0, zIndex: 410 }}
            onClick={() => setActivePlaceMenu(null)}
          />
          <div
            className="menu"
            style={{
              left: `${Math.max(10, activePlaceMenu.rect.right - 220)}px`,
              top: `${activePlaceMenu.rect.bottom + 8}px`
            }}
          >
            <button
              onClick={() => {
                setPlace(activePlaceMenu.id);
                setActivePlaceMenu(null);
              }}
            >
              <Icon name="pin" size={18} /> Switch to this property
            </button>
            <button
              onClick={() => {
                const id = activePlaceMenu.id;
                setActivePlaceMenu(null);
                openModal({ type: 'renameProperty', placeId: id });
              }}
            >
              <Icon name="edit" size={18} /> Rename
            </button>
            <button
              onClick={() => {
                setActivePlaceMenu(null);
                go('access');
              }}
            >
              <Icon name="users" size={18} /> Shared access
            </button>
            <hr />
            <button
              style={{ color: 'var(--red)' }}
              onClick={() => {
                const id = activePlaceMenu.id;
                setActivePlaceMenu(null);
                handleLeavePlace(id);
              }}
            >
              <Icon name="logout" size={18} /> Leave / remove property
            </button>
          </div>
        </>
      )}

      {/* Connected Place Context Menu */}
      {activeConnMenu && (
        <>
          <div
            className="menu-backdrop"
            style={{ position: 'fixed', inset: 0, zIndex: 410 }}
            onClick={() => setActiveConnMenu(null)}
          />
          <div
            className="menu"
            style={{
              left: `${Math.max(10, activeConnMenu.rect.right - 220)}px`,
              top: `${activeConnMenu.rect.bottom + 8}px`
            }}
          >
            {(() => {
              const c = connected.find(x => x.id === activeConnMenu.id);
              if (!c) return null;
              return (
                <>
                  <div className="mh">
                    {c.name} · {c.role}
                  </div>
                  <button
                    onClick={() => {
                      const id = activeConnMenu.id;
                      setActiveConnMenu(null);
                      openModal({ type: 'accessPass', connectedId: id });
                    }}
                  >
                    <Icon name="ticket" size={18} />
                    <span>
                      Access pass
                      <br />
                      <span className="sb">
                        {c.status === 'pending' ? 'Awaiting approval' : 'Active'}
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveConnMenu(null);
                      go('access');
                    }}
                  >
                    <Icon name="users" size={18} /> Household &amp; guests
                  </button>
                  <hr />
                  <button
                    style={{ color: 'var(--red)' }}
                    onClick={() => {
                      const id = activeConnMenu.id;
                      setActiveConnMenu(null);
                      handleLeaveConn(id);
                    }}
                  >
                    <Icon name="logout" size={18} /> Leave property
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
};
