import React from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { useModals } from '../../context/ModalContext';
import { Icon } from '../icons/Icon';
import { initials, actTone } from '../../utils/formatters';

export const UserMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
}> = ({ isOpen, onClose, anchorRect }) => {
  const { user, go, setSignedOut } = useApp();

  if (!isOpen || !anchorRect) return null;

  const style: React.CSSProperties = {
    left: `${Math.max(10, Math.min(anchorRect.left, window.innerWidth - 250))}px`,
    top: `${Math.max(10, anchorRect.top - 200)}px`
  };

  return createPortal(
    <>
      <div className="menu-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 410 }} onClick={onClose} />
      <div className="menu" style={style}>
        <div className="mh">{user.name}</div>
        <button
          onClick={() => {
            onClose();
            go('settings/account');
          }}
        >
          <Icon name="user" size={18} /> My account
        </button>
        <button
          onClick={() => {
            onClose();
            go('settings/notifications');
          }}
        >
          <Icon name="bell" size={18} /> Notifications
        </button>
        <button
          onClick={() => {
            onClose();
            go('settings/contacts');
          }}
        >
          <Icon name="phone" size={18} /> Emergency contacts
        </button>
        <button
          onClick={() => {
            onClose();
            go('settings/app');
          }}
        >
          <Icon name="mobile" size={18} /> Get the mobile app
        </button>
        <button
          onClick={() => {
            onClose();
            go('plans');
          }}
        >
          <Icon name="card" size={18} /> Plans
        </button>
        <button
          onClick={() => {
            onClose();
            go('settings/preferences');
          }}
        >
          <Icon name="gear" size={18} /> Preferences
        </button>
        <button
          onClick={() => {
            onClose();
            go('settings/help');
          }}
        >
          <Icon name="help" size={18} /> Help
        </button>
        <hr />
        <button
          style={{ color: 'var(--red)' }}
          onClick={() => {
            onClose();
            setSignedOut(true);
          }}
        >
          <Icon name="logout" size={18} /> Log out
        </button>
      </div>
    </>,
    document.body
  );
};

export const PlaceMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
}> = ({ isOpen, onClose, anchorRect }) => {
  const { places, currentPlaceId, setPlace, go } = useApp();

  if (!isOpen || !anchorRect) return null;

  const style: React.CSSProperties = {
    left: `${Math.max(10, Math.min(anchorRect.left, window.innerWidth - 270))}px`,
    top: `${anchorRect.bottom + 8}px`
  };

  return createPortal(
    <>
      <div className="menu-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 410 }} onClick={onClose} />
      <div className="menu" style={style}>
        <div className="mh">Switch property</div>
        {places.map(p => (
          <button
            key={p.id}
            onClick={() => {
              setPlace(p.id);
              onClose();
            }}
          >
            <span className="ico" style={{ width: '34px', height: '34px', borderRadius: '10px' }}>
              <Icon name={p.ig} size={17} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <b style={{ display: 'block', fontWeight: 600 }}>{p.name}</b>
              <span className="sb">
                {p.type} · {p.loc}
              </span>
            </span>
            {p.id === currentPlaceId && (
              <span className="ck">
                <Icon name="check" size={17} />
              </span>
            )}
          </button>
        ))}
        <hr />
        <button
          onClick={() => {
            onClose();
            go('properties');
          }}
        >
          <Icon name="gear" size={18} /> Manage properties
        </button>
      </div>
    </>,
    document.body
  );
};

export const BellMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
}> = ({ isOpen, onClose, anchorRect }) => {
  const { events, go } = useApp();

  if (!isOpen || !anchorRect) return null;

  const recent = events
    .map((e, idx) => ({ e, idx }))
    .filter(({ e }) => e.type !== 'system')
    .slice(0, 4);

  const style: React.CSSProperties = {
    left: `${Math.max(10, anchorRect.right - 260)}px`,
    top: `${anchorRect.bottom + 8}px`
  };

  return createPortal(
    <>
      <div className="menu-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 410 }} onClick={onClose} />
      <div className="menu" style={style}>
        <div className="mh">Recent alerts</div>
        {recent.map(({ e, idx }) => {
          const t = actTone(e.type);
          return (
            <button
              key={idx}
              onClick={() => {
                onClose();
                go(`activity/${idx}`);
              }}
            >
              <span className="act-ic" style={{ background: t[1], color: t[0] }}>
                <Icon name={t[2]} size={16} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b style={{ display: 'block', fontWeight: 600, fontSize: '13px' }}>
                  {e.title || e.t}
                </b>
                <span className="sb">
                  {e.cam || ''} · {e.day} {e.time}
                </span>
              </span>
            </button>
          );
        })}
        <hr />
        <button
          onClick={() => {
            onClose();
            go('activity');
          }}
        >
          <Icon name="health" size={18} /> View all activity
        </button>
      </div>
    </>,
    document.body
  );
};

export const MoreMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
}> = ({ isOpen, onClose, anchorRect }) => {
  const { user, threads, go, effectiveTheme, toggleTheme } = useApp();

  if (!isOpen || !anchorRect) return null;

  const unreadCount = threads.reduce((s, t) => s + t.unread, 0);

  const style: React.CSSProperties = {
    left: `${Math.max(10, anchorRect.right - 240)}px`,
    top: `${Math.max(10, anchorRect.top - 260)}px`
  };

  return createPortal(
    <>
      <div className="menu-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 410 }} onClick={onClose} />
      <div className="menu" style={style}>
        <button
          onClick={() => {
            onClose();
            go('messages');
          }}
        >
          <Icon name="chat" size={18} /> Messages
          {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
        </button>
        <button
          onClick={() => {
            onClose();
            go('properties');
          }}
        >
          <Icon name="building" size={18} /> Properties
        </button>
        <button
          onClick={() => {
            onClose();
            go('access');
          }}
        >
          <Icon name="users" size={18} /> Shared access
        </button>
        <button
          onClick={() => {
            onClose();
            go('plans');
          }}
        >
          <Icon name="card" size={18} /> Plans
        </button>
        <button
          onClick={() => {
            onClose();
            go('settings');
          }}
        >
          <Icon name="gear" size={18} /> Settings
        </button>
        <button
          onClick={() => {
            onClose();
            toggleTheme();
          }}
        >
          <Icon name={effectiveTheme === 'light' ? 'moon' : 'sun'} size={18} /> Switch to {effectiveTheme === 'light' ? 'dark' : 'light'} theme
        </button>
        <hr />
        <button
          onClick={() => {
            onClose();
            go('settings/account');
          }}
        >
          <Icon name="user" size={18} /> {user.name}
        </button>
      </div>
    </>,
    document.body
  );
};
