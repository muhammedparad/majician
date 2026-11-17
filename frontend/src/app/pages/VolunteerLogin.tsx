import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { AsyncForm, value } from '../../components/forms';
import { useAuth } from '../../contexts/auth';
import { AuthField, AuthSplitView } from '../../features/auth/AuthChrome';

export function VolunteerLogin() {
  const { accept } = useAuth();
  const navigate = useNavigate();

  return <AuthSplitView
    side="right"
    title="Volunteer Sign In"
    subtitle="Use the username and password your mahallu admin gave you."
    asideTitle="Member or Admin?"
    asideText={<>Sign in with your email address to access<br />your personal udhiyya account.</>}
    asideCtaLabel="Sign In"
    asideCtaTo="/login"
  >
    <div className="am-auth-form">
      <AsyncForm submit="Sign In" action={async form => {
        const result = await api<{ accessToken: string }>('/auth/volunteer-login', 'POST', {
          username: value(form, 'username'),
          password: value(form, 'password'),
        });
        await accept(result.accessToken);
        navigate('/app', { replace: true });
      }}>
        <AuthField
          label="Username"
          icon="user"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          maxLength={60}
          desktopPlaceholder="Username"
          mobilePlaceholder="Enter your username"
        />
        <AuthField
          label="Password"
          icon="lock"
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={100}
          desktopPlaceholder="Password"
          mobilePlaceholder="Enter your password"
        />
      </AsyncForm>
    </div>
    <div className="am-auth-footer">
      <p className="am-auth-meta">
        Member or admin? <Link to="/login">Sign in with email</Link>
      </p>
    </div>
  </AuthSplitView>;
}
