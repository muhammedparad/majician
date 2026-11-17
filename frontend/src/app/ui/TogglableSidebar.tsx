import React, { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BrandLogo } from '../../components/BrandLogo';
import { useAuth } from '../../contexts/auth';
import { initials, shortMahallu, useApp } from '../lib/app-context';
import { 
  IconX, 
  IconHome, 
  IconHeart, 
  IconHand, 
  IconDoc, 
  IconChart, 
  IconBell, 
  IconShield,
  IconUsers,
  IconCard
} from './Icons';
import { roleLabel } from '../Sidebar';

interface TogglableSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TogglableSidebar: React.FC<TogglableSidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { isSuper, adminOf, activeMahallu, volunteer, ctx, unread } = useApp();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!user) return null;

  const place = shortMahallu(activeMahallu?.mahalluName ?? volunteer?.mahalluName ?? ctx?.households[0]?.mahalluName);

  const navItems = [
    { to: '/app', label: 'Dashboard', icon: <IconHome />, end: true },
    ...(adminOf.length > 0 ? [
      { to: '/app/members', label: 'Members', icon: <IconUsers /> },
      { to: '/app/manage/programs', label: 'Programs', icon: <IconDoc /> },
      { to: '/app/volunteers', label: 'Volunteers', icon: <IconHand /> },
      { to: '/app/manage/ledger', label: 'Transactions & Ledger', icon: <IconChart /> }
    ] : []),
    ...(isSuper ? [
      { to: '/app/mahallus', label: 'Mahallus', icon: <IconShield /> }
    ] : []),
    ...(volunteer ? [
      ...(volunteer.canStatus ? [{ to: '/app/volunteer/animals', label: 'Animal management', icon: <IconDoc /> }] : []),
      ...(volunteer.canDistribute ? [{ to: '/app/volunteer/distribute', label: 'Distribute meat', icon: <IconHand /> }] : []),
      { to: '/app/volunteer/activity', label: 'My activity', icon: <IconChart /> }
    ] : []),
    ...(!adminOf.length && !volunteer && !isSuper ? [
      { to: '/app/tracking', label: 'Animal status', icon: <IconHeart /> },
      { to: '/app/payments', label: 'Payments', icon: <IconCard /> }
    ] : []),
    { to: '/app/notifications', label: 'Notifications', icon: <IconBell />, badge: unread > 0 ? unread : undefined },
    { to: '/app/profile', label: 'Profile / Mahallu', icon: <IconShield /> }
  ];

  return (
    <>
      <div
        className={`dside-overlay ${isOpen ? 'open' : ''}`}
        id="d-side-overlay"
        onClick={onClose}
        aria-hidden={!isOpen}
      />
      <aside
        className={`dside ${isOpen ? 'open' : ''}`}
        id="d-side"
        aria-label="Dashboard menu"
        aria-hidden={!isOpen}
      >
        <div className="dside-body" id="d-side-body">
          {/* Drawer Header */}
          <div className="dside-head">
            <Link className="logo" to="/app" onClick={onClose} aria-label="Udhiyya dashboard home">
              <BrandLogo className="am-brand-logo" decorative />
            </Link>
            <button
              type="button"
              className="iconbtn"
              id="d-side-close"
              onClick={onClose}
              aria-label="Close dashboard menu"
            >
              <IconX />
            </button>
          </div>

          {/* User Card */}
          <div className="dside-user">
            <span className="avatar" aria-hidden="true">
              {initials(user.name)}
            </span>
            <div className="grow">
              <div className="n">{user.name}</div>
              <div className="m">{roleLabel(isSuper, adminOf.length > 0, !!volunteer)} • {place}</div>
            </div>
            <span className="tag">Verified</span>
          </div>

          {/* Navigation Items */}
          <nav className="dside-nav" aria-label="Dashboard sections">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'on' : '')}
                onClick={onClose}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="cnt">{item.badge}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};
