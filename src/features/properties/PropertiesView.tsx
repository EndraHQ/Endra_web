import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useModals } from '../../context/ModalContext';
import { Icon } from '../../components/icons/Icon';
import { roleTone, plural } from '../../utils/formatters';
import { api } from '../../services/api';

export const PropertiesView: React.FC = () => {
  const {
    places,
    setPlaces,
    currentPlaceId,
    setPlace,
    openConfirm,
    go,
    toast
  } = useApp();

  const { account } = useAuth();
  const { openModal } = useModals();

  const [activePlaceMenu, setActivePlaceMenu] = useState<{ id: string; rect: DOMRect } | null>(null);

  const handlePlaceMenuClick = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    setActivePlaceMenu({ id, rect: e.currentTarget.getBoundingClientRect() });
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
      async () => {
        const uid = Number(account?.userId || account?.id);
        if (id.startsWith('prop-') && uid) {
          const numId = Number(id.replace('prop-', ''));
          try {
            await api.deleteProperty(numId, uid);
          } catch (err: any) {
            console.warn('Failed to delete property on backend:', err);
          }
        }
        setPlaces(prev => prev.filter(x => x.id !== id));
        if (currentPlaceId === id) {
          const next = places.find(x => x.id !== id);
          if (next) setPlace(next.id);
        }
        toast('Property removed');
      }
    );
  };

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>Properties</h1>
          <p className="sub">
            Your registered residential and commercial properties. Switch the active property from the header or select one below.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-w"
          onClick={() => openModal({ type: 'connectProperty' })}
        >
          <Icon name="plus" size={17} /> Add property
        </button>
      </div>

      <div className="sec-hd">
        <h2>Your properties</h2>
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
          <div className="empty">No properties registered on your account yet.</div>
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
    </div>
  );
};
