import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../icons/Logo';
import { Icon } from '../icons/Icon';
import { UserMenu, PlaceMenu, BellMenu, MoreMenu } from './UserMenu';
import { initials } from '../../utils/formatters';

export const Sidebar: React.FC = () => {
  const { route, go, threads, user } = useApp();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<DOMRect | null>(null);
  const userCardRef = useRef<HTMLButtonElement>(null);

  const unreadCount = threads.reduce((s, t) => s + t.unread, 0);

  const handleUserClick = () => {
    if (userCardRef.current) {
      setUserMenuAnchor(userCardRef.current.getBoundingClientRect());
      setUserMenuOpen(true);
    }
  };

  const navItem = (name: any, label: string, icon: string, badge?: number | string) => {
    const isActive = route.name === name;
    return (
      <button
        type="button"
        className={`nav-i ${isActive ? 'on' : ''}`}
        onClick={() => go(name)}
      >
        <Icon name={icon} size={20} />
        <span>{label}</span>
        {badge ? <span className="nav-badge">{badge}</span> : null}
      </button>
    );
  };

  return (
    <aside className="side" id="side">
      <button
        type="button"
        className="brand"
        onClick={() => go('home')}
        aria-label="ENDRA home"
      >
        <Logo height={26} />
      </button>

      <nav aria-label="Primary">
        {navItem('home', 'Home', 'home')}
        {navItem('monitor', 'Monitor', 'cam')}
        {navItem('activity', 'Activity', 'health')}
        {navItem('messages', 'Messages', 'chat', unreadCount || undefined)}

        <button
          type="button"
          className={`nav-sos ${route.name === 'sos' ? 'on' : ''}`}
          onClick={() => go('sos')}
        >
          <Icon name="alert" size={20} strokeWidth={2} />
          <span>Emergency SOS</span>
        </button>

        <div className="nav-lbl">Manage</div>
        {navItem('properties', 'Properties', 'building')}
        {navItem('access', 'Shared access', 'users')}
        {navItem('settings', 'Settings', 'gear')}
      </nav>

      <button
        ref={userCardRef}
        type="button"
        className="usercard"
        onClick={handleUserClick}
        aria-haspopup="menu"
      >
        <div className="av">{initials(user.name)}</div>
        <div style={{ minWidth: 0 }}>
          <b>{user.name}</b>
          <span>{user.plan.toUpperCase()}</span>
        </div>
      </button>

      <UserMenu
        isOpen={userMenuOpen}
        onClose={() => setUserMenuOpen(false)}
        anchorRect={userMenuAnchor}
      />
    </aside>
  );
};

export const Header: React.FC = () => {
  const {
    currentPlace,
    armed,
    toggleArm,
    effectiveTheme,
    toggleTheme,
    events,
    askRun,
    go
  } = useApp();

  const [placeMenuOpen, setPlaceMenuOpen] = useState(false);
  const [placeAnchor, setPlaceAnchor] = useState<DOMRect | null>(null);
  const placeBtnRef = useRef<HTMLButtonElement>(null);

  const [bellMenuOpen, setBellMenuOpen] = useState(false);
  const [bellAnchor, setBellAnchor] = useState<DOMRect | null>(null);
  const bellBtnRef = useRef<HTMLButtonElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const unreviewedCount = events.filter(
    e => !e.reviewed && e.type !== 'system' && e.day === 'Today'
  ).length;

  const handlePlaceClick = () => {
    if (placeBtnRef.current) {
      setPlaceAnchor(placeBtnRef.current.getBoundingClientRect());
      setPlaceMenuOpen(true);
    }
  };

  const handleBellClick = () => {
    if (bellBtnRef.current) {
      setBellAnchor(bellBtnRef.current.getBoundingClientRect());
      setBellMenuOpen(true);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      askRun(searchQuery);
      setSearchQuery('');
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
    }
  };

  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !/INPUT|TEXTAREA|SELECT/.test((document.activeElement?.tagName || ''))
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <header className="top" id="top">
      <button
        type="button"
        className="top-logo"
        onClick={() => go('home')}
        aria-label="ENDRA home"
      >
        <Logo height={22} />
      </button>

      <button
        ref={placeBtnRef}
        type="button"
        className="prop-btn"
        onClick={handlePlaceClick}
        aria-haspopup="menu"
      >
        <span className="pi">
          <Icon name={currentPlace.ig} size={16} />
        </span>
        <span className="tx">
          <b>{currentPlace.name}</b>
          <span>{currentPlace.loc}</span>
        </span>
        <Icon name="chev" size={14} />
      </button>

      <label className="ask">
        <Icon name="sparkle" size={17} />
        <input
          ref={searchInputRef}
          id="askIn"
          placeholder="Ask ENDRA — try “offline cameras”"
          autoComplete="off"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          aria-label="Ask ENDRA"
        />
        <span className="kbd">/</span>
      </label>

      <div className="top-r">
        <button
          type="button"
          className={`arm-chip ${armed ? '' : 'off'}`}
          onClick={toggleArm}
          aria-pressed={armed}
        >
          <Icon name={armed ? 'check' : 'shield'} size={16} />
          <span className="tx">{armed ? 'Armed' : 'Disarmed'}</span>
        </button>

        <button
          type="button"
          className="ibtn theme-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} theme`}
          title={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} theme`}
        >
          <Icon name={effectiveTheme === 'light' ? 'moon' : 'sun'} size={19} />
        </button>

        <button
          ref={bellBtnRef}
          type="button"
          className="ibtn"
          onClick={handleBellClick}
          aria-label="Notifications"
          aria-haspopup="menu"
        >
          <Icon name="bell" size={19} />
          {unreviewedCount > 0 && <i className="dot" />}
        </button>
      </div>

      <PlaceMenu
        isOpen={placeMenuOpen}
        onClose={() => setPlaceMenuOpen(false)}
        anchorRect={placeAnchor}
      />

      <BellMenu
        isOpen={bellMenuOpen}
        onClose={() => setBellMenuOpen(false)}
        anchorRect={bellAnchor}
      />
    </header>
  );
};

export const BottomNav: React.FC = () => {
  const { route, go, threads } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreAnchor, setMoreAnchor] = useState<DOMRect | null>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);

  const unreadCount = threads.reduce((s, t) => s + t.unread, 0);
  const isMoreActive = ['properties', 'access', 'settings', 'messages'].includes(route.name);

  const handleMoreClick = () => {
    if (moreBtnRef.current) {
      setMoreAnchor(moreBtnRef.current.getBoundingClientRect());
      setMoreOpen(true);
    }
  };

  return (
    <nav className="bnav" id="bnav" aria-label="Primary">
      <button
        type="button"
        className={route.name === 'home' ? 'on' : ''}
        onClick={() => go('home')}
      >
        <Icon name="home" size={22} />
        <span>Home</span>
      </button>

      <button
        type="button"
        className={route.name === 'monitor' ? 'on' : ''}
        onClick={() => go('monitor')}
      >
        <Icon name="cam" size={22} />
        <span>Monitor</span>
      </button>

      <button
        type="button"
        className="bsos"
        onClick={() => go('sos')}
        aria-label="Emergency SOS"
      >
        <Icon name="alert" size={24} strokeWidth={2} />
      </button>

      <button
        type="button"
        className={route.name === 'activity' ? 'on' : ''}
        onClick={() => go('activity')}
      >
        <Icon name="health" size={22} />
        <span>Activity</span>
      </button>

      <button
        ref={moreBtnRef}
        type="button"
        className={isMoreActive ? 'on' : ''}
        onClick={handleMoreClick}
      >
        <Icon name="more" size={22} />
        <span>More</span>
        {unreadCount > 0 && <i className="bb">{unreadCount}</i>}
      </button>

      <MoreMenu
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        anchorRect={moreAnchor}
      />
    </nav>
  );
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sosState, route, go } = useApp();
  const [sosClockTime, setSosClockTime] = useState<string>('');

  React.useEffect(() => {
    if (!sosState) return;
    const interval = setInterval(() => {
      const s = Math.floor((Date.now() - sosState.start) / 1000) + 3;
      setSosClockTime(
        'Responders en route · ' +
          String(Math.floor(s / 60)).padStart(2, '0') +
          ':' +
          String(s % 60).padStart(2, '0')
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [sosState]);

  return (
    <div className="app" id="app">
      <Sidebar />
      <div className="main">
        <Header />
        <main id="view" tabIndex={-1}>
          {sosState && route.name !== 'sos' && (
            <div className="sosbar" role="alert">
              <span className="pulse" />
              <div>
                <b>SOS is active</b> · responders have your live location ·{' '}
                <span className="mono">{sosClockTime || 'Connecting…'}</span>
              </div>
              <button
                type="button"
                className="btn btn-r btn-sm"
                onClick={() => go('sos')}
              >
                View
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
};
