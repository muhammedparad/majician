import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { ChatWidget } from '../features/chat/widget';
import { useAuth } from '../contexts/auth';
import { greeting, initials, shortMahallu, useApp, useWide } from './lib/app-context';
import { roleLabel, type Group } from './Sidebar';
import {
  IconBack,
  IconBell,
  IconCard,
  IconChart,
  IconChevronRight,
  IconClock,
  IconDoc,
  IconGrid,
  IconHand,
  IconHome,
  IconMenu,
  IconShield,
  IconUsers,
} from './ui/Icons';
import { IconAnimal } from './ui/more-icons';
import { TogglableSidebar } from './ui/TogglableSidebar';
import { PageTransition, Spinner } from '../features/motion/primitives';
import './app.css';
import './app-extra.css';
import './app-layout.css';
import './app-pages.css';
import './app-pages2.css';
import './app-volunteer.css';
import './app-sidebar.css';
import './motion.css';

/** What each kind of user sees in navigation. */
function useGroups(): Group[] {
  const { isSuper, adminOf, ctx, volunteer } = useApp();
  const member = (ctx?.households.length ?? 0) > 0;
  const groups: Group[] = [{ items: [{ to: '/app', label: 'Home', icon: <IconHome />, end: true }] }];
  if (isSuper) groups.push({ label: 'Super admin', items: [{ to: '/app/mahallus', label: 'Mahallus', icon: <IconShield /> }] });
  if (adminOf.length) groups.push({ label: 'My mahallu', items: [
    { to: '/app/members', label: 'Members', icon: <IconUsers /> }, { to: '/app/manage/programs', label: 'Programs', icon: <IconDoc /> },
    { to: '/app/volunteers', label: 'Volunteers', icon: <IconHand /> }, { to: '/app/manage/ledger', label: 'Ledger', icon: <IconChart /> }] });
  if (volunteer) groups.push({ label: 'My tasks', items: [
    ...(volunteer.canStatus ? [{ to: '/app/volunteer/animals', label: 'Animals', icon: <IconAnimal /> }] : []),
    ...(volunteer.canDistribute ? [{ to: '/app/volunteer/distribute', label: 'Distribute', icon: <IconHand /> }] : []),
    { to: '/app/volunteer/activity', label: 'Activity', icon: <IconClock /> }] });
  if (member && !adminOf.length && !volunteer) groups.push({ label: 'My Udhiyya', items: [
    { to: '/app/tracking', label: 'Animal', icon: <IconAnimal /> }, { to: '/app/payments', label: 'Payments', icon: <IconCard /> }] });
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
    <button type="button" className="avatar" aria-haspopup="menu" aria-expanded={open} aria-label="Account menu" onClick={() => setOpen(value => !value)}>{initials(user.name)}</button>
    {open && <div className={'am-menu ' + align} role="menu">
      <div className="am-menu-head"><b>{user.name}</b><span>{roleLabel(isSuper, adminOf.length > 0, !!volunteer)}</span></div>
      <Link role="menuitem" to="/app/profile" onClick={() => setOpen(false)}>Profile &amp; Mahallu</Link>
      <button type="button" role="menuitem" onClick={() => void leave()}>Sign out</button>
    </div>}
  </div>;
}

function Desktop() {
  const { user } = useAuth();
  const { unread, isSuper, adminOf, activeMahallu, ctx, volunteer } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const place = shortMahallu(activeMahallu?.mahalluName ?? volunteer?.mahalluName ?? ctx?.households[0]?.mahalluName);

  const siteNavLinks = [
    { to: '/app', label: 'Dashboard' },
    ...(adminOf.length > 0 ? [
      { to: '/app/members', label: 'Members' },
      { to: '/app/manage/programs', label: 'Programs' },
      { to: '/app/volunteers', label: 'Volunteers' },
      { to: '/app/manage/ledger', label: 'Ledger' }
    ] : []),
    ...(isSuper && !adminOf.length ? [
      { to: '/app/mahallus', label: 'Mahallus' }
    ] : []),
    ...(volunteer ? [
      ...(volunteer.canStatus ? [{ to: '/app/volunteer/animals', label: 'Animals' }] : []),
      ...(volunteer.canDistribute ? [{ to: '/app/volunteer/distribute', label: 'Distribute' }] : []),
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
          {'SAVE · PAY · SHARE · DISTRIBUTE · '.repeat(8)}
        </span>
      </div>

      {/* Floating Pill Navbar — matches base design without unnecessary Get Started button */}
      <header className="dnav">
        <button
          type="button"
          className="iconbtn"
          id="d-menu-btn"
          aria-label="Open dashboard menu"
          aria-expanded={sidebarOpen}
          aria-controls="d-side"
          onClick={() => setSidebarOpen(true)}
        >
          <IconMenu />
        </button>

        <Link className="logo" to="/app" aria-label="Udhiyya dashboard home">
          <BrandLogo className="am-brand-logo" decorative />
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

        {/* Account Avatar Menu */}
        <UserMenu />
      </header>

      {/* Main Content Wrap */}
      <div className="dwrap">
        <main id="d-main" tabIndex={-1} aria-label="Dashboard content">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      {/* Footer */}
      <footer className="foot">
        <div className="divider"></div>
        <div className="foot-brand">
          <BrandLogo className="am-brand-logo-foot" decorative />
        </div>
        <p>
          Udhiyya, Made{' '}
          <span className="serif" style={{ fontSize: 15 }}>Clearer</span> by Design. Verified Udhiyya management for {user.name} · {place}, Kerala.
        </p>
      </footer>

      {/* Slide-out Sidebar Drawer */}
      <TogglableSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
}

function Mobile({ groups }: { groups: Group[] }) {
  const { user, signOut } = useAuth();
  const { unread, isSuper, adminOf, volunteer } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => setMoreOpen(false), [pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMoreOpen(false); };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [moreOpen]);

  if (!user) return null;

  const items = groups.flatMap(group => group.items);
  const primaryTabs = items.slice(0, 4);

  const moreRows: { to?: string; onClick?: () => void; icon: React.ReactNode; title: string; desc: string }[] = [
    ...(isSuper ? [{ to: '/app/mahallus', icon: <IconShield />, title: 'Mahallus', desc: 'Manage registered Mahallus and committee access' }] : []),
    ...(adminOf.length > 0 ? [
      { to: '/app/members', icon: <IconUsers />, title: 'Members', desc: 'Household directory, CSV import and verification' },
      { to: '/app/manage/programs', icon: <IconDoc />, title: 'Programs', desc: 'Configure Udhiyya seasons, shares and draw slots' },
      { to: '/app/volunteers', icon: <IconHand />, title: 'Volunteers', desc: 'Field team accounts and distribution permissions' },
      { to: '/app/manage/ledger', icon: <IconChart />, title: 'Transactions & Ledger', desc: 'Collections, expenses and transparency records' },
    ] : []),
    ...(volunteer ? [
      ...(volunteer.canStatus ? [{ to: '/app/volunteer/animals', icon: <IconAnimal />, title: 'Animal management', desc: 'Update slaughter, processing and packing steps' }] : []),
      ...(volunteer.canDistribute ? [{ to: '/app/volunteer/distribute', icon: <IconHand />, title: 'Distribute meat', desc: 'Record packet handovers to households' }] : []),
      { to: '/app/volunteer/activity', icon: <IconClock />, title: 'My activity', desc: 'Recent updates you have recorded' },
    ] : []),
    ...(!adminOf.length && !volunteer && !isSuper ? [
      { to: '/app/tracking', icon: <IconAnimal />, title: 'Track animal', desc: 'Live slaughter, processing and packet status' },
      { to: '/app/payments', icon: <IconCard />, title: 'Payments', desc: 'Monthly installments, history and receipts' },
    ] : []),
    { to: '/app/notifications', icon: <IconBell />, title: 'Notifications', desc: unread > 0 ? `${unread} unread` : 'Approvals, transfers and reminders' },
    { to: '/app/profile', icon: <IconShield />, title: 'Profile & Mahallu', desc: 'Membership, household details and settings' },
    { to: '/transparency', icon: <IconChart />, title: 'Public Ledgers', desc: 'Open community distribution books' },
  ];

  const handleSignOut = async () => {
    setMoreOpen(false);
    sessionStorage.removeItem('udhiyya-onboarding-skipped');
    await signOut();
    navigate('/login');
  };

  return (
    <div className="shell-mobile" id="shell-mobile">
      {/* Top Mobile Header: crisp white brand bar + deep-green greeting band */}
      <header className="mhead">
        <div className="mhead-brandbar">
          <Link className="mhead-logo" to="/app" aria-label="Udhiyya dashboard home">
            <BrandLogo className="am-brand-logo-mobile" decorative />
          </Link>
          <div className="mhead-actions">
            <button
              type="button"
              className="iconbtn mhead-bell"
              onClick={() => navigate('/app/notifications')}
              aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
              id="m-bell"
            >
              <IconBell />
              {unread > 0 && <span className="badge">{unread}</span>}
            </button>
            <UserMenu align="right" />
          </div>
        </div>
        <div className="mhead-greetbar">
          <div className="greet">{greeting()}</div>
          <div className="name">{user.name}</div>
        </div>
      </header>

      {/* Main Screen Content */}
      <main id="m-main" tabIndex={-1} aria-label="Udhiyya app content">
        <div className="mwrap">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>

      {/* Floating Bottom Navigation Dock */}
      <nav className="mtabs" aria-label="App" id="m-tabs">
        {primaryTabs.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (!moreOpen && isActive ? 'on' : '')}
            onClick={() => setMoreOpen(false)}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={moreOpen ? 'on' : ''}
          onClick={() => setMoreOpen(true)}
          aria-expanded={moreOpen}
        >
          <IconGrid />
          <span>More</span>
        </button>
      </nav>

      {/* Slide-Up More Sheet — exact match with base design MobileShell More sheet */}
      {moreOpen && (
        <div className="msheet" role="dialog" aria-modal="true" aria-label="More options">
          <div className="msheet-head">
            <button
              type="button"
              className="iconbtn"
              style={{ background: '#fff' }}
              onClick={() => setMoreOpen(false)}
              aria-label="Close"
            >
              <IconBack />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2><span className="serif">More</span></h2>
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Everything else in Udhiyya</div>
            </div>
            <BrandLogo variant="mark" className="am-brand-mark-sm" decorative />
          </div>
          <div className="msheet-body">
            {moreRows.map((row) => (
              <Link
                key={row.title}
                to={row.to!}
                className="mlist-row"
                onClick={() => setMoreOpen(false)}
              >
                <span className="ic">{row.icon}</span>
                <div className="grow">
                  <div className="t">{row.title}</div>
                  <div className="d">{row.desc}</div>
                </div>
                <IconChevronRight className="chev" />
              </Link>
            ))}
            <button
              type="button"
              className="pillbtn ghost block"
              style={{ marginTop: 14 }}
              onClick={() => void handleSignOut()}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AppShell() {
  const wide = useWide();
  const groups = useGroups();
  const { loading, error, reload } = useApp();
  return <div className="am">
    <a className="skip" href={wide ? '#d-main' : '#m-main'}>Skip to main content</a>
    {loading ? <p role="status" className="am-loading"><Spinner /><span>Loading your workspace…</span></p> : error ?
      <div className="am-loading"><p>We could not load your workspace.</p><button className="pillbtn sm" onClick={() => void reload()}>Try again</button></div> :
      <>{wide ? <Desktop /> : <Mobile groups={groups} />}<ChatWidget /></>}
  </div>;
}
