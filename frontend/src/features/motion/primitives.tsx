import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Wraps routed page content so navigation plays a gentle fade + upward glide
 * without flashing or shifting layout.
 */
export function PageTransition({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { pathname } = useLocation();
  return <div key={pathname} className={`am-page-enter ${className}`.trim()}>{children}</div>;
}

/**
 * Lightweight GPU-friendly numerical counter using easeOutQuart.
 * Renders the final value immediately when prefers-reduced-motion is active.
 */
export function AnimatedNumber({
  value,
  duration = 560,
  format,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
}) {
  const safeTarget = Number.isFinite(value) ? value : 0;
  const [display, setDisplay] = useState(() => (prefersReducedMotion() ? safeTarget : 0));
  const previousRef = useRef(prefersReducedMotion() ? safeTarget : 0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      previousRef.current = safeTarget;
      setDisplay(safeTarget);
      return;
    }

    const from = previousRef.current;
    const delta = safeTarget - from;
    if (delta === 0) {
      setDisplay(safeTarget);
      return;
    }

    let rafId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(from + delta * eased);
      setDisplay(current);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        previousRef.current = safeTarget;
        setDisplay(safeTarget);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      previousRef.current = safeTarget;
    };
  }, [safeTarget, duration]);

  return (
    <span className="am-tabular">
      {format ? format(display) : display.toLocaleString('en-IN')}
    </span>
  );
}

/**
 * Scroll-triggered reveal for dashboard and inner sections.
 * Content remains visible if JS fails or prefers-reduced-motion is active.
 */
export function useAppReveal(root: RefObject<HTMLElement | null>, key?: string | number | boolean) {
  useLayoutEffect(() => {
    const container = root.current;
    if (!container || prefersReducedMotion() || !('IntersectionObserver' in window)) return;

    container.querySelectorAll<HTMLElement>('[data-app-stagger]').forEach(group => {
      Array.from(group.children).forEach((child, index) => {
        const el = child as HTMLElement;
        el.setAttribute('data-app-reveal', '');
        el.style.setProperty('--reveal-d', `${Math.min(index, 7) * 55}ms`);
      });
    });

    const targets = Array.from(container.querySelectorAll<HTMLElement>('[data-app-reveal]'));
    if (!targets.length) return;

    container.classList.add('am-reveal-ready');

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('am-in');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -3% 0px' },
    );

    targets.forEach(target => observer.observe(target));

    return () => {
      observer.disconnect();
      container.classList.remove('am-reveal-ready');
      targets.forEach(target => target.classList.remove('am-in'));
    };
  }, [root, key]);
}

export function Spinner({ light = false }: { light?: boolean }) {
  return <span className={`am-spinner${light ? ' light' : ''}`} aria-hidden="true" />;
}
