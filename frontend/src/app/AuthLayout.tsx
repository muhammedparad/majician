import { Outlet, useLocation } from 'react-router-dom';
import './app.css';
import './app-extra.css';
import './auth.css';
import './motion.css';

export function AuthLayout() {
  const { pathname } = useLocation();
  return <div className="am am-auth-shell">
    <main className="am-auth-main">
      <div key={pathname} className="am-auth-route">
        <Outlet />
      </div>
    </main>
  </div>;
}
