import { useEffect, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../../components/BrandLogo';

export function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 859px)').matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 859px)');
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return mobile;
}

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
};

export function AuthIcon({ name }: { name: 'mail' | 'lock' | 'user' | 'key' }) {
  switch (name) {
    case 'mail':
      return <svg {...iconProps}>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="M3.5 7l8.5 6 8.5-6" />
      </svg>;
    case 'lock':
      return <svg {...iconProps}>
        <rect x="5" y="11" width="14" height="10" rx="2.5" />
        <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
        <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
      </svg>;
    case 'user':
      return <svg {...iconProps}>
        <circle cx="12" cy="8" r="3.75" />
        <path d="M5 19.5c1.2-3.4 3.7-5 7-5s5.8 1.6 7 5" />
      </svg>;
    case 'key':
      return <svg {...iconProps}>
        <circle cx="8.5" cy="12" r="3.5" />
        <path d="M12 12h9M18 12v3M21 12v2.5" />
      </svg>;
  }
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible
    ? <svg {...iconProps}>
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5" />
        <path d="M9.4 5.3A10.2 10.2 0 0 1 12 5c5.2 0 9.1 3.8 10 7-.4 1.3-1.2 2.7-2.4 3.8" />
        <path d="M6.3 6.8C4.1 8.1 2.6 10.1 2 12c.9 3.2 4.8 7 10 7 1.6 0 3-.4 4.3-1" />
      </svg>
    : <svg {...iconProps}>
        <path d="M2 12c1.1-3.7 5-7 10-7s8.9 3.3 10 7c-1.1 3.7-5 7-10 7s-8.9-3.3-10-7z" />
        <circle cx="12" cy="12" r="2.8" />
      </svg>;
}

export function GoogleMark() {
  return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.6z" />
    <path fill="#34A853" d="M12 22c2.8 0 5.1-.9 6.8-2.5l-3.3-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.8v2.7A10 10 0 0 0 12 22z" />
    <path fill="#FBBC05" d="M6.2 13.6a6 6 0 0 1 0-3.8V7.1H2.8a10 10 0 0 0 0 9.2l3.4-2.7z" />
    <path fill="#EA4335" d="M12 5.9c1.5 0 2.9.5 3.9 1.5l2.9-2.9A10 10 0 0 0 2.8 7.1l3.4 2.7C7 7.7 9.3 5.9 12 5.9z" />
  </svg>;
}

export function AuthField({
  label,
  icon,
  desktopPlaceholder,
  mobilePlaceholder,
  type = 'text',
  required = true,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: 'mail' | 'lock' | 'user' | 'key';
  desktopPlaceholder?: string;
  mobilePlaceholder?: string;
}) {
  const isMobile = useIsMobile();
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const placeholder = isMobile ? (mobilePlaceholder ?? label) : (desktopPlaceholder ?? label);

  return <label className="am-auth-field">
    <span className="am-auth-label">{label}</span>
    <span className="am-auth-input-wrap">
      <span className="am-auth-icon-left"><AuthIcon name={icon} /></span>
      <input
        {...rest}
        type={inputType}
        required={required}
        placeholder={placeholder}
      />
      {isPassword && <button
        type="button"
        className="am-auth-eye"
        onClick={() => setShowPassword(current => !current)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        <EyeIcon visible={showPassword} />
      </button>}
    </span>
  </label>;
}

function MobileWaveHeader() {
  return <header className="am-auth-mobile-header">
    <svg
      className="am-auth-wave"
      viewBox="0 0 390 260"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <clipPath id="am-auth-wave-clip">
          <path d="M0,0 L390,0 L390,206 C368,224 338,242 296,246 C226,252 178,186 112,176 C72,170 35,176 0,192 Z" />
        </clipPath>
      </defs>
      <path
        fill="#085038"
        d="M0,0 L390,0 L390,206 C368,224 338,242 296,246 C226,252 178,186 112,176 C72,170 35,176 0,192 Z"
      />
      <g className="am-auth-contours" clipPath="url(#am-auth-wave-clip)" fill="none" stroke="rgba(255,255,255,0.055)" strokeWidth="1.25">
        <path d="M-20,58 C42,32 104,78 168,54 C232,30 286,-10 364,26" />
        <path d="M-15,112 C48,74 114,132 184,104 C252,78 308,42 405,74" />
        <path d="M-10,164 C66,118 134,166 210,148 C278,132 332,96 410,130" />
        <path d="M40,214 C118,176 196,222 276,204 C332,191 364,168 410,180" />
        <ellipse cx="94" cy="78" rx="68" ry="44" />
        <ellipse cx="305" cy="145" rx="84" ry="56" />
      </g>
    </svg>
  </header>;
}

export function AuthSplitView({
  side = 'right',
  title,
  subtitle,
  asideTitle,
  asideText,
  asideCtaLabel,
  asideCtaTo,
  children,
}: {
  side?: 'right' | 'left';
  title: string;
  subtitle?: string;
  asideTitle: string;
  asideText: ReactNode;
  asideCtaLabel: string;
  asideCtaTo: string;
  children: ReactNode;
}) {
  return <div className={`am-auth-split am-auth-aside-${side}`}>
    <Link className="am-auth-home-link" to="/" aria-label="Back to home page">
      <svg {...iconProps} width="16" height="16">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span>Home</span>
    </Link>

    <MobileWaveHeader />

    <section className="am-auth-form-col">
      <div className="am-auth-form-inner">
        <Link className="am-auth-brand" to="/" aria-label="Udhiyya home">
          <BrandLogo className="am-auth-logo" decorative />
        </Link>
        <h1 className="am-auth-title">{title}</h1>
        {subtitle && <p className="am-auth-subtitle">{subtitle}</p>}
        {children}
      </div>
    </section>

    <aside className="am-auth-aside" aria-label={asideTitle}>
      <div className="am-auth-aside-inner">
        <h2>{asideTitle}</h2>
        <p>{asideText}</p>
        <Link className="am-auth-aside-btn" to={asideCtaTo}>
          {asideCtaLabel}
        </Link>
      </div>
    </aside>
  </div>;
}
