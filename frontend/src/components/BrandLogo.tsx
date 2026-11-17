import udhiyyaLogo from '../assets/udhiyya-logo.png';
import udhiyyaMark from '../assets/udhiyya-mark.png';

type BrandLogoProps = {
  /** 'full' renders the complete official Udhiyya logo; 'mark' renders the official symbol-only mark for compact spaces. */
  variant?: 'full' | 'mark';
  className?: string;
  alt?: string;
  /** Set true when wrapped in a link/element that already provides an accessible label. */
  decorative?: boolean;
};

/**
 * Official Udhiyya brand logo rendered strictly from the supplied source asset.
 * Preserves original aspect ratio via object-fit: contain without altering colors or shape.
 */
export function BrandLogo({
  variant = 'full',
  className = '',
  alt = 'Udhiyya',
  decorative = false,
}: BrandLogoProps) {
  const isMark = variant === 'mark';
  return (
    <img
      src={isMark ? udhiyyaMark : udhiyyaLogo}
      alt={decorative ? '' : alt}
      aria-hidden={decorative ? true : undefined}
      width={isMark ? 183 : 694}
      height={isMark ? 253 : 254}
      loading="eager"
      decoding="async"
      draggable={false}
      className={className ? `brand-logo-img ${className}` : 'brand-logo-img'}
    />
  );
}
