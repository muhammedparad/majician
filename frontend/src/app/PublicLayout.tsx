import { Link, NavLink, Outlet } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../contexts/auth';
import { PageTransition } from '../features/motion/primitives';
import './app.css';
import './app-extra.css';
import './auth.css';
import './motion.css';
import './transparency.css';

/** Pages anyone can open without signing in, such as the public ledger. */
export function PublicLayout() {
  const { user } = useAuth();
  return <div className="am am-public">
    <header className="am-auth-nav pl-nav">
      <Link className="logo" to="/" aria-label="Udhiyya home">
        <BrandLogo className="am-brand-logo" decorative />
      </Link>
      <nav className="am-public-links" aria-label="Public">
        <NavLink to="/transparency" end className={({ isActive }) => isActive ? 'on' : ''}>Live ledger</NavLink>
        <NavLink to="/transparency/all" className={({ isActive }) => isActive ? 'on' : ''}>All programmes</NavLink>
        <Link className="pillbtn sm" to={user ? '/app' : '/login'}>{user ? 'Open app' : 'Sign in'}</Link>
      </nav>
    </header>
    <main className="am-public-main pl-main"><PageTransition><Outlet /></PageTransition></main>
    <footer className="foot pl-foot">
      <div className="divider" />
      <div className="foot-brand">
        <BrandLogo className="am-brand-logo-foot" decorative />
      </div>
      <p>Open books &amp; live overall programme updates. No personal or household details are ever shown on public pages.</p>
    </footer>
  </div>;
}
