import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChatWidget } from '../features/chat/widget';
import { useAuth } from '../contexts/auth';
import { greeting, initials, useApp } from './lib/app-context';
import { roleLabel, type Group } from './Sidebar';
import { IconBell, IconCard, IconChart, IconClock, IconDoc, IconHand, IconHome, IconMenu, IconShield, IconUsers, IconX } from './ui/Icons';
import { IconAnimal } from './ui/more-icons';
import { TogglableSidebar } from './ui/TogglableSidebar';
import './app.css';
import './app-extra.css';
import './app-layout.css';
import './app-pages.css';
import './app-pages2.css';
import './app-volunteer.css';
import './app-sidebar.css';

function useWide() {
  const query = '(min-width: 1024px)';
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const change = () => setWide(list.matches);
    list.addEventListener('change', change);
    return () => list.removeEventListener('change', change);
  }, []);
  return wide;
}

/** What each kind of user sees in the sidebar. The phone's bottom bar uses the same list. */
function useGroups(): Group[] {
  const { isSuper, adminOf, ctx, volunteer } = useApp();
  const member = (ctx?.households.length ?? 0) > 0;
  const groups: Group[] = [{ items: [{ to: '/app', label: 'Dashboard', icon: <IconHome />, end: true }] }];
  if (isSuper) groups.push({ label: 'Super admin', items: [{ to: '/app/mahallus', label: 'Mahallus', icon: <IconShield /> }] });
  if (adminOf.length) groups.push({ label: 'My mahallu', items: [
    { to: '/app/members', label: 'Members', icon: <IconUsers /> }, { to: '/app/manage/programs', label: 'Programs', icon: <IconDoc /> },
    { to: '/app/volunteers', label: 'Volunteers', icon: <IconHand /> }, { to: '/app/manage/ledger', label: 'Ledger', icon: <IconChart /> }] });
  if (volunteer) groups.push({ label: 'My tasks', items: [
    ...(volunteer.canStatus ? [{ to: '/app/volunteer/animals', label: 'Animal management', icon: <IconAnimal /> }] : []),
    ...(volunteer.canDistribute ? [{ to: '/app/volunteer/distribute', label: 'Distribute meat', icon: <IconHand /> }] : []),
    { to: '/app/volunteer/activity', label: 'My activity', icon: <IconClock /> }] });
  if (member && !adminOf.length && !volunteer) groups.push({ label: 'My Udhiyya', items: [
    { to: '/app/tracking', label: 'Animal status', icon: <IconAnimal /> }, { to: '/app/payments', label: 'Payments', icon: <IconCard /> }] });
  return groups;
}

/** The avatar button: Profile and Sign out live here. */
function UserMenu({ align = 'right' }: { align?: 'left' | 'right' }) {
  const { user, signOut } = useAuth();
  const { isSuper, adminOf, volunteer } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  if (!user) return null;
  const leave = async () => {
    sessionStorage.removeItem('udhiyya-onboarding-skipped');
    await signOut();
    navigate('/login');
  };
  return <div className="am-usermenu" ref={root}>
    <button type="button" className="avatar sm" aria-haspopup="menu" aria-expanded={open} aria-label="Account menu" onClick={() => setOpen(value => !value)}>{initials(user.name)}</button>
    {open && <div className={'am-menu ' + align} role="menu">
      <div className="am-menu-head"><b>{user.name}</b><span>{roleLabel(isSuper, adminOf.length > 0, !!volunteer)}</span></div>
      <Link role="menuitem" to="/app/profile" onClick={() => setOpen(false)}>Profile</Link>
      <button type="button" role="menuitem" onClick={() => void leave()}>Sign out</button>
    </div>}
  </div>;
}

function Desktop({ groups }: { groups: Group[] }) {
  const { user } = useAuth();
  const { unread, isSuper, adminOf, volunteer } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const siteNavLinks = [
    { to: '/app', label: 'Dashboard' },
    ...(adminOf.length > 0 ? [
      { to: '/app/members', label: 'Members' },
      { to: '/app/manage/programs', label: 'Programs' },
      { to: '/app/volunteers', label: 'Volunteers' },
      { to: '/app/manage/ledger', label: 'Ledger' }
    ] : []),
    ...(isSuper ? [
      { to: '/app/mahallus', label: 'Mahallus' }
    ] : []),
    ...(volunteer ? [
      { to: '/app/volunteer/animals', label: 'Animals' },
      { to: '/app/volunteer/distribute', label: 'Distribute' },
      { to: '/app/volunteer/activity', label: 'Activity' }
    ] : []),
    ...(!adminOf.length && !volunteer && !isSuper ? [
      { to: '/app/tracking', label: 'Track Animal' },
      { to: '/app/payments', label: 'Payments' }
    ] : []),
    { to: '/app/profile', label: 'Profile' },
    { to: '/transparency', label: 'Network' }
  ];

  return (
    <div className="shell-desktop" id="shell-desktop">
      {/* Top Subtle Marquee */}
      <div className="marquee" aria-hidden="true">
        <span className="track">
          {'DISTRIBUTE · SAVE · PAY · SHARE · DISTRIBUTE · SAVE · PAY · SHARE · '.repeat(8)}
        </span>
      </div>

      {/* Floating Header */}
      <header className="dnav">
        <button
          type="button"
          className="iconbtn"
          id="d-menu-btn"
          aria-label="Open menu"
          onClick={() => setSidebarOpen(true)}
        >
          <IconMenu />
        </button>

        <Link className="logo" to="/app" aria-label="Udhiyya Saver dashboard">
          <span className="mark">U</span>
          UDHIYYA SAVER
        </Link>

        {/* Site Nav */}
        <nav aria-label="Site" id="d-nav">
          {siteNavLinks.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.to || (item.to !== '/app' && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={isActive ? 'on' : ''}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Notifications Bell */}
        <button
          type="button"
          className="iconbtn"
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          id="d-bell"
          onClick={() => navigate('/app/notifications')}
        >
          <IconBell />
          {unread > 0 && <span className="badge">{unread}</span>}
        </button>

        {/* User Button / Log in */}
        <UserMenu />

        {/* Action Button */}
        <button
          type="button"
          className="pillbtn sm"
          style={{ minHeight: 44 }}
          onClick={() => navigate(adminOf.length ? '/app/members' : '/app')}
        >
          Get Started
        </button>
      </header>

      {/* Main Content Wrap */}
      <div className="dwrap">
        <main id="d-main" tabIndex={-1} aria-label="Dashboard content">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer className="foot" style={{ maxWidth: 1360, margin: '0 auto', padding: '0 20px 40px', color: 'var(--muted)', fontSize: 13.5 }}>
        <div className="divider" style={{ marginBottom: 18 }}></div>
        <p>
          <strong style={{ color: 'var(--ink2)' }}>UDHIYYA SAVER</strong> — Verified Eid al-Adha &amp; Udhiyya Management by Design. Community sacrifice, savings and meat distribution for {user.name} · Kannur Mahallu, Kerala.
        </p>
      </footer>

      {/* Slide-out Sidebar Drawer */}
      <TogglableSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
}

function Mobile({ groups }: { groups: Group[] }) {
  const { user } = useAuth();
  const { unread } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    if (!drawer) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setDrawer(false); };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [drawer]);
  if (!user) return null;
  const items = groups.flatMap(group => group.items);
  const tabs = items.length > 4 ? items.slice(0, 4) : items;
  return <div className="shell-mobile" id="shell-mobile">
    <header className="mhead"><div className="row">
      <button type="button" className="iconbtn" aria-label="Open menu" aria-expanded={drawer} onClick={() => setDrawer(true)}><IconMenu /></button>
      <div style={{ flex: 1, minWidth: 0 }}><div className="greet">{greeting()}</div><div className="name">{user.name}</div></div>
      <button type="button" className="iconbtn" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        onClick={() => navigate('/app/notifications')}><IconBell />{unread > 0 && <span className="badge">{unread}</span>}</button>
      <UserMenu />
    </div></header>
    <main id="m-main" tabIndex={-1} aria-label="Content"><div className="mwrap"><Outlet /></div></main>
    <nav className="mtabs" aria-label="App">
      {tabs.map(item => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'on' : '')}>{item.icon}<span>{item.label}</span></NavLink>)}
      {items.length > 4 && <button type="button" onClick={() => setDrawer(true)}><IconMenu /><span>More</span></button>}
    </nav>
    <TogglableSidebar isOpen={drawer} onClose={() => setDrawer(false)} />
  </div>;
}

export function AppShell() {
  const wide = useWide();
  const groups = useGroups();
  const { loading, error, reload } = useApp();
  return <div className="am">
    <a className="skip" href={wide ? '#d-main' : '#m-main'}>Skip to main content</a>
    {loading ? <p role="status" className="am-loading">Loading your workspace…</p> : error ?
      <div className="am-loading"><p>We could not load your workspace.</p><button className="pillbtn sm" onClick={() => void reload()}>Try again</button></div> :
      <>{wide ? <Desktop groups={groups} /> : <Mobile groups={groups} />}<ChatWidget /></>}
  </div>;
}
