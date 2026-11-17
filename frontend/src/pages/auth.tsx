import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { AsyncForm, value } from '../components/forms';
import { useAuth } from '../contexts/auth';
import { AuthField, AuthSplitView, GoogleMark } from '../features/auth/AuthChrome';

const REMEMBER_KEY = 'udhiyya_remembered_email';

function readRememberedEmail() {
  try {
    return window.localStorage.getItem(REMEMBER_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeRememberedEmail(email: string) {
  try {
    if (email) window.localStorage.setItem(REMEMBER_KEY, email);
    else window.localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // Ignore storage quota or privacy-mode errors.
  }
}

type Mode = 'login' | 'register' | 'verify' | 'forgot' | 'reset';

const copy: Record<Mode, {
  side: 'right' | 'left';
  title: string;
  subtitle: string;
  submit: string;
  asideTitle: string;
  asideText: ReactNode;
  asideCtaLabel: string;
  asideCtaTo: string;
}> = {
  login: {
    side: 'right',
    title: 'Sign In',
    subtitle: 'Access your account to manage udhiyya, volunteers, and contributions.',
    submit: 'Sign In',
    asideTitle: 'Hello, Friend!',
    asideText: <>Register with your personal details to use<br />all of site features.</>,
    asideCtaLabel: 'Sign Up',
    asideCtaTo: '/register',
  },
  register: {
    side: 'left',
    title: 'Sign Up',
    subtitle: 'Create your account to save for udhiyya, manage shares, and track contributions.',
    submit: 'Sign Up',
    asideTitle: 'Welcome Back!',
    asideText: <>Enter your personal details to use<br />all of site features.</>,
    asideCtaLabel: 'Sign In',
    asideCtaTo: '/login',
  },
  verify: {
    side: 'left',
    title: 'Verify Email',
    subtitle: 'Enter the six-digit code sent to your inbox and confirm your password.',
    submit: 'Verify Email',
    asideTitle: 'Already Verified?',
    asideText: <>Sign in with your personal details to use<br />all of site features.</>,
    asideCtaLabel: 'Sign In',
    asideCtaTo: '/login',
  },
  forgot: {
    side: 'right',
    title: 'Forgot Password',
    subtitle: 'Enter your email address and we will send a six-digit reset code.',
    submit: 'Send Reset Code',
    asideTitle: 'Remembered It?',
    asideText: <>Return to sign in and continue managing<br />your udhiyya account.</>,
    asideCtaLabel: 'Sign In',
    asideCtaTo: '/login',
  },
  reset: {
    side: 'left',
    title: 'Reset Password',
    subtitle: 'If this address can be reset, a six-digit code will arrive by email.',
    submit: 'Reset Password',
    asideTitle: 'Back to Sign In',
    asideText: <>Once your password is updated, sign in<br />with your new credentials.</>,
    asideCtaLabel: 'Sign In',
    asideCtaTo: '/login',
  },
};

export function AuthPage({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { accept, features } = useAuth();
  const [loginStep, setLoginStep] = useState<{ email: string; password: string }>();
  const [resendBusy, setResendBusy] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const initialRemembered = mode === 'login' && !params.get('email') ? readRememberedEmail() : '';
  const [address, setAddress] = useState(params.get('email') ?? initialRemembered);
  const [remember, setRemember] = useState(Boolean(initialRemembered));
  const go = (route: string, email: string) => navigate(route + '?email=' + encodeURIComponent(email));

  async function submit(form: FormData) {
    const email = address;
    const password = value(form, 'password');
    const code = value(form, 'code');
    switch (mode) {
      case 'register':
        await api('/auth/register', 'POST', { email, password, name: value(form, 'name') });
        return go('/verify-email', email);
      case 'verify':
        await api('/auth/verify-email', 'POST', { email, code, password });
        return navigate('/login?verified=1');
      case 'forgot':
        await api('/auth/forgot-password', 'POST', { email });
        return go('/reset-password', email);
      case 'reset':
        await api('/auth/reset-password', 'POST', { email, code, password });
        return navigate('/login?reset=1');
      case 'login': {
        writeRememberedEmail(remember ? email.trim() : '');
        try {
          const result = loginStep
            ? await api<{ accessToken: string }>('/auth/login/verify', 'POST', { ...loginStep, code })
            : await api<{ accessToken: string } | { otpRequired: true }>('/auth/login', 'POST', { email, password });
          if ('otpRequired' in result) {
            setLoginStep({ email, password });
            return 'Check your inbox for your sign-in code.';
          }
          await accept(result.accessToken);
          navigate('/app', { replace: true });
        } catch (error) {
          if (error instanceof ApiError && error.code === 'EMAIL_UNVERIFIED') return go('/verify-email', email);
          throw error;
        }
      }
    }
  }

  async function resend() {
    setResendBusy(true);
    try {
      await api('/auth/resend-verification', 'POST', { email: address });
      setResendStatus('If verification is pending, check your inbox after the one-minute resend cooldown.');
    } catch (error) {
      setResendStatus(error instanceof Error ? error.message : 'Could not request a code.');
    } finally {
      setResendBusy(false);
    }
  }

  const newPassword = mode === 'register' || mode === 'reset' || mode === 'verify';
  const cfg = copy[mode];

  return <AuthSplitView
    side={cfg.side}
    title={loginStep ? 'Enter Sign-In Code' : cfg.title}
    subtitle={loginStep ? 'Check your inbox for the six-digit code to finish signing in.' : cfg.subtitle}
    asideTitle={cfg.asideTitle}
    asideText={cfg.asideText}
    asideCtaLabel={cfg.asideCtaLabel}
    asideCtaTo={cfg.asideCtaTo}
  >
    {params.has('verified') && <p className="am-auth-notice" role="status">Email verified. You can now sign in.</p>}
    {params.has('reset') && <p className="am-auth-notice" role="status">Password updated. Sign in with your new password.</p>}
    {params.has('google') && <p className="am-auth-notice error" role="alert">{params.get('google') === 'account-exists'
      ? 'An account already uses this email. Sign in with your existing method.' : 'Google sign-in failed. Try again.'}</p>}
    {features && !features.email && mode !== 'login' && <p className="am-auth-notice error">Email delivery is unavailable.</p>}

    <div className="am-auth-form">
      <AsyncForm action={submit} submit={loginStep ? 'Verify and Sign In' : cfg.submit}>
        {mode === 'register' && <AuthField
          label="Full name"
          icon="user"
          name="name"
          autoComplete="name"
          maxLength={100}
          desktopPlaceholder="Full name"
          mobilePlaceholder="Enter your full name"
        />}
        {!loginStep && <AuthField
          label="Email address"
          icon="mail"
          type="email"
          name="email"
          value={address}
          onChange={event => setAddress(event.target.value)}
          autoComplete="email"
          maxLength={254}
          desktopPlaceholder="Email address"
          mobilePlaceholder="Enter your email"
        />}
        {(loginStep || mode === 'verify' || mode === 'reset') && <AuthField
          label="Six-digit code"
          icon="key"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          desktopPlaceholder="Six-digit code"
          mobilePlaceholder="Enter 6-digit code"
        />}
        {(newPassword || (mode === 'login' && !loginStep)) && <AuthField
          label={mode === 'verify' ? 'Set your password' : mode === 'reset' ? 'New password' : 'Password'}
          icon="lock"
          name="password"
          type="password"
          autoComplete={newPassword ? 'new-password' : 'current-password'}
          minLength={newPassword ? 12 : undefined}
          maxLength={128}
          desktopPlaceholder={newPassword ? 'Password (at least 12 characters)' : 'Password'}
          mobilePlaceholder={newPassword ? 'At least 12 characters' : 'Enter your password'}
        />}

        {mode === 'login' && !loginStep && <>
          <div className="am-auth-forgot-desktop">
            <Link to="/forgot-password">Forgot your password?</Link>
          </div>
          <div className="am-auth-row-mobile">
            <label className="am-auth-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={event => {
                  const checked = event.target.checked;
                  setRemember(checked);
                  if (!checked) writeRememberedEmail('');
                }}
              />
              <span>Remember me</span>
            </label>
            <Link className="am-auth-forgot-mobile" to="/forgot-password">Forgot password?</Link>
          </div>
        </>}
      </AsyncForm>
    </div>

    <div className="am-auth-footer">
      {mode === 'verify' && <button
        type="button"
        className="am-auth-secondary-btn"
        disabled={!address || resendBusy}
        onClick={() => void resend()}
      >{resendBusy ? 'Requesting…' : 'Request another code'}</button>}
      {resendStatus && <p className="am-auth-notice" role="status">{resendStatus}</p>}

      {features?.google && (mode === 'register' || (mode === 'login' && !loginStep)) && (
        <a className="am-auth-google-btn" href="/api/v1/auth/google">
          <GoogleMark />
          <span>Continue with Google</span>
        </a>
      )}

      {mode === 'login' && !loginStep && <>
        <p className="am-auth-meta">
          Don&apos;t have an account? <Link to="/register">Create an account</Link>
        </p>
        <p className="am-auth-meta am-auth-meta-volunteer">
          Volunteer? <Link to="/volunteer-login">Sign in with a username</Link>
        </p>
      </>}

      {mode === 'register' && (
        <p className="am-auth-meta">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      )}

      {loginStep && (
        <button type="button" className="am-auth-secondary-btn" onClick={() => setLoginStep(undefined)}>
          Back to password
        </button>
      )}

      {(mode === 'forgot' || mode === 'reset' || mode === 'verify') && (
        <p className="am-auth-meta">
          Back to <Link to="/login">Sign In</Link>
        </p>
      )}
    </div>
  </AuthSplitView>;
}
