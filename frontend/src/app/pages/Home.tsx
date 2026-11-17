import { useState, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import { greeting, useApp } from '../lib/app-context';
import { animalLabel, dateText, inr, payModeLabel, splitName, type MyProgram } from '../lib/programs';
import { PlacedList } from '../ui/booking';
import { IconCheck, IconDoc, IconHeart, IconHome, IconShield, IconUsers } from '../ui/Icons';
import { ErrorNote, Loading, useFetch } from '../ui/kit';
import { KnowMore } from '../ui/KnowMore';
import { ActivityChart } from '../ui/ActivityChart';
import { RightRail } from '../ui/RightRail';
import { PaymentPanel } from './PaymentPanel';
import { SelectionModal } from './SelectionModal';
import { MemberDashboard } from './MemberDashboard';
import { VolunteerDashboard } from './VolunteerDashboard';
import { skipKey } from './Welcome';

type Mahallu = { id: string; active: boolean; households: number; admins: unknown[] };
type ProgramRow = { id: string; name: string; status: 'DRAFT' | 'OPEN' | 'ENDED'; bookings: number };
type Households = { total: number; linked: number; people: number };

export function Home() {
  const { user } = useAuth();
  const { ctx, isSuper, activeMahallu, volunteer } = useApp();
  const house = ctx?.households[0];
  const plainMember = !isSuper && !activeMahallu && !volunteer;
  const mine = useFetch<MyProgram[]>(house ? '/me/programs' : null);

  if (!user || !ctx) return null;
  if (volunteer) return <VolunteerDashboard />;

  // A member who has not chosen anything yet is taken through the first-login slides.
  if (plainMember && sessionStorage.getItem(skipKey) !== '1') {
    if (!house) return <Navigate to="/app/welcome" replace />;
    if (mine.data && mine.data.some(item => item.status === 'OPEN') && !mine.data.some(item => item.bookings.length > 0)) {
      return <Navigate to="/app/welcome" replace />;
    }
  }

  // Members get the full personal dashboard once they have chosen an animal.
  if (plainMember && mine.data && mine.data.some(item => item.bookings.length > 0)) {
    return <MemberDashboard programs={mine.data} reload={mine.reload} />;
  }

  const nameParts = user.name.split(' ');
  const firstName = nameParts[0] || 'Muhammed';
  const lastName = nameParts.slice(1).join(' ') || 'Parad';
  const place = activeMahallu?.mahalluName ?? house?.mahalluName ?? 'Kannur Mahallu';

  return (
    <div className="dgrid">
      {/* Left Main Column */}
      <div>
        {/* Hero Panel */}
        <section className="hero-panel" aria-label="Welcome">
          <span className="tag live">
            <i />
            {place} · {isSuper ? 'Super Admin' : activeMahallu ? 'Mahallu Admin' : 'Verified Member'}
          </span>
          <h1 style={{ marginTop: 16 }}>
            {greeting()}, {firstName} <span className="serif">{lastName}.</span>
          </h1>
          <p className="sub">
            Your Zakat overview for {place} — every contribution verified, every distribution tracked.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22, position: 'relative', zIndex: 1 }}>
            {activeMahallu ? (
              <>
                <Link className="pillbtn light" to="/app/members">
                  Manage members
                </Link>
                <Link
                  className="pillbtn"
                  style={{ background: 'rgba(255,255,255,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)' }}
                  to="/app/manage/programs"
                >
                  Programs
                </Link>
                <Link
                  className="pillbtn"
                  style={{ background: 'rgba(255,255,255,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)' }}
                  to="/app/volunteers"
                >
                  Volunteers
                </Link>
                <Link
                  className="pillbtn"
                  style={{ background: 'rgba(255,255,255,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)' }}
                  to="/app/manage/ledger"
                >
                  Ledger
                </Link>
              </>
            ) : isSuper ? (
              <>
                <Link className="pillbtn light" to="/app/mahallus">
                  Manage mahallus
                </Link>
                <Link
                  className="pillbtn"
                  style={{ background: 'rgba(255,255,255,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)' }}
                  to="/app/profile"
                >
                  System status
                </Link>
              </>
            ) : (
              <>
                <Link className="pillbtn light" to="/app/welcome">
                  Give Zakat
                </Link>
                <Link
                  className="pillbtn"
                  style={{ background: 'rgba(255,255,255,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)' }}
                  to="/app/tracking"
                >
                  Request Assistance
                </Link>
                <Link
                  className="pillbtn"
                  style={{ background: 'rgba(255,255,255,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)' }}
                  to="/app/payments"
                >
                  Calculate Zakat
                </Link>
              </>
            )}
          </div>

          {/* Bottom Metric Banner inside Hero Panel */}
          <div style={{ marginTop: 26, position: 'relative', zIndex: 1 }}>
            <div className="lbl" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.16em', color: '#a9d4c2' }}>
              ZAKAT OVERVIEW · AVAILABLE TO GIVE
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 42, letterSpacing: '-.02em' }}>
              ₹48,250
            </div>
          </div>
        </section>

        {/* 4 Stat Cards in a clean 4-column row */}
        <div className="stat-grid" role="list" aria-label="Your totals">
          <div className="stat" role="listitem">
            <div className="eyebrow">Total Contributed</div>
            <div className="v">₹50,000</div>
            <div className="s">3 contributions</div>
          </div>

          <div className="stat" role="listitem">
            <div className="eyebrow">Assistance Received</div>
            <div className="v">₹15,000</div>
            <div className="s">1 distribution</div>
          </div>

          <div className="stat" role="listitem">
            <div className="eyebrow">My Applications</div>
            <div className="v">1</div>
            <div className="s">Approved · latest</div>
          </div>

          <div className="stat" role="listitem">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="eyebrow" style={{ margin: 0 }}>Mahallu Status</div>
              <KnowMore title="Mahallu Verification" ariaLabel="Know more about Mahallu status">
                <p style={{ margin: 0 }}>
                  Active membership verified with {place} committee. All records are audited and reconciled locally.
                </p>
              </KnowMore>
            </div>
            <div className="v" style={{ fontSize: 21, paddingTop: 5 }}>Verified Member</div>
            <div className="s">{place}</div>
          </div>
        </div>

        {/* Mahallu Network Activity Chart */}
        <section className="card" style={{ marginTop: 22 }} aria-label="Activity chart">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div className="eyebrow">
                <span className="dot"></span>MAHALLU NETWORK ACTIVITY
              </div>
              <h2 style={{ fontSize: 22, marginTop: 8 }}>
                Your community, <span className="serif">giving</span> together.
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="tag">Jan – Jun 2026 · All Mahallus</span>
              <KnowMore title="Mahallu Network Activity" ariaLabel="Know more about network activity">
                <p style={{ margin: 0 }}>
                  Aggregated contributions and distributions across partner Mahallus, reconciled monthly with council oversight.
                </p>
              </KnowMore>
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <ActivityChart />
          </div>
        </section>

        {/* Recipients / Community Support Section */}
        <section style={{ marginTop: 26 }} aria-label="Recipients near you">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <h2 style={{ fontSize: 24 }}>
              Recipients who still <span className="serif">need</span> support
            </h2>
            <Link
              to="/app/members"
              style={{ color: 'var(--green)', fontWeight: 600, fontSize: 14.5, minHeight: 36, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              Discover more →
            </Link>
          </div>

          <div className="recip-grid">
            <div className="recip">
              <div className="top">
                <div>
                  <h3>Family A</h3>
                  <div className="need">Food and home essentials</div>
                </div>
                <span className="tag">Fuqara</span>
              </div>
              <div className="progress">
                <i style={{ width: '72%' }}></i>
              </div>
              <div className="nums">
                <span>Received <b>₹11,500</b></span>
                <span style={{ color: 'var(--muted)' }}>Kannur Town · Kannur</span>
              </div>
            </div>

            <div className="recip">
              <div className="top">
                <div>
                  <h3>Family B</h3>
                  <div className="need">Paying back urgent liabilities</div>
                </div>
                <span className="tag">Gharimeen</span>
              </div>
              <div className="progress">
                <i style={{ width: '45%' }}></i>
              </div>
              <div className="nums">
                <span>Received <b>₹4,950</b></span>
                <span style={{ color: 'var(--muted)' }}>Kozhikode Beach · Kozhikode</span>
              </div>
            </div>

            <div className="recip">
              <div className="top">
                <div>
                  <h3>Family C</h3>
                  <div className="need">Daily living costs & medicine</div>
                </div>
                <span className="tag">Masakeen</span>
              </div>
              <div className="progress">
                <i style={{ width: '80%' }}></i>
              </div>
              <div className="nums">
                <span>Received <b>₹2,800</b></span>
                <span style={{ color: 'var(--muted)' }}>Thalassery · Kannur</span>
              </div>
            </div>

            <div className="recip">
              <div className="top">
                <div>
                  <h3>Family D</h3>
                  <div className="need">Medical treatment grant</div>
                </div>
                <span className="tag">Fuqara</span>
              </div>
              <div className="progress">
                <i style={{ width: '27%' }}></i>
              </div>
              <div className="nums">
                <span>Received <b>₹6,000</b></span>
                <span style={{ color: 'var(--muted)' }}>Malappuram Town · Malappuram</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Right Sticky Rail */}
      <RightRail
        goalTitle="Family support"
        goalRaised={7200}
        goalTarget={10000}
        goalLabel="ASSISTANCE GOAL"
        insightQuote="“Your contributions are helping eligible families in your community.”"
        insightLabel="ZAKAT INSIGHT"
        activityLink={activeMahallu ? '/app/manage/ledger' : '/app/payments'}
      />
    </div>
  );
}
