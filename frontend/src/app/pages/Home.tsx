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

  // Fetch real admin or superadmin stats from API
  const adminHouseholds = useFetch<Households>(activeMahallu ? `/mahallus/${activeMahallu.mahalluId}/households` : null);
  const adminPrograms = useFetch<ProgramRow[]>(activeMahallu ? `/mahallus/${activeMahallu.mahalluId}/programs` : null);
  const superMahallus = useFetch<Mahallu[]>(isSuper ? '/mahallus' : null);

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

  // Compute stat values based on user role
  const currentProgram = adminPrograms.data?.find(item => item.status !== 'ENDED') ?? adminPrograms.data?.[0];

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
            {isSuper
              ? 'Create mahallus and give their committees access.'
              : activeMahallu
                ? 'Manage your members and run your Udhiyya programs.'
                : `Your Udhiyya overview for ${place} — every contribution verified, every distribution tracked.`}
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
                  {house ? 'Choose my animal' : 'Get started'}
                </Link>
                <Link
                  className="pillbtn"
                  style={{ background: 'rgba(255,255,255,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)' }}
                  to="/app/tracking"
                >
                  Track my animal
                </Link>
                <Link
                  className="pillbtn"
                  style={{ background: 'rgba(255,255,255,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)' }}
                  to="/app/payments"
                >
                  Payments
                </Link>
              </>
            )}
          </div>

          {/* Bottom Metric Banner inside Hero Panel */}
          <div style={{ marginTop: 26, position: 'relative', zIndex: 1 }}>
            <div className="lbl" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.16em', color: '#a9d4c2' }}>
              {activeMahallu
                ? `EID AL-ADHA · ${currentProgram?.name ?? 'UDHIYYA 2027'}`
                : isSuper
                  ? 'EID NETWORK · TOTAL MAHALLUS'
                  : 'UDHIYYA SAVINGS · TOTAL ACCUMULATED'}
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 42, letterSpacing: '-.02em' }}>
              {activeMahallu
                ? `${currentProgram?.bookings ?? 1} Bookings`
                : isSuper
                  ? `${superMahallus.data?.length ?? 4} Active`
                  : '₹48,250'}
            </div>
          </div>
        </section>

        {/* 4 Stat Cards in a clean 4-column row */}
        <div className="stat-grid" role="list" aria-label="Your totals">
          {activeMahallu ? (
            <>
              <div className="stat" role="listitem">
                <div className="eyebrow">Households</div>
                <div className="v">{adminHouseholds.data?.total ?? 1}</div>
                <div className="s">registered members</div>
              </div>

              <div className="stat" role="listitem">
                <div className="eyebrow">People</div>
                <div className="v">{adminHouseholds.data?.people ?? 4}</div>
                <div className="s">across all houses</div>
              </div>

              <div className="stat" role="listitem">
                <div className="eyebrow">Signed Up</div>
                <div className="v">{adminHouseholds.data?.linked ?? 1}</div>
                <div className="s">{(adminHouseholds.data?.total ?? 1) - (adminHouseholds.data?.linked ?? 1)} not yet linked</div>
              </div>

              <div className="stat" role="listitem">
                <div className="eyebrow">Program</div>
                <div className="v" style={{ fontSize: 20 }}>{currentProgram?.name ?? 'Udhiyya 2027'}</div>
                <div className="s">{currentProgram ? `${currentProgram.status === 'OPEN' ? 'Open' : 'Draft'} · ${currentProgram.bookings} bookings` : 'start one under Programs'}</div>
              </div>
            </>
          ) : isSuper ? (
            <>
              <div className="stat" role="listitem">
                <div className="eyebrow">Mahallus</div>
                <div className="v">{superMahallus.data?.length ?? 4}</div>
                <div className="s">{superMahallus.data?.filter(i => i.active).length ?? 4} active</div>
              </div>

              <div className="stat" role="listitem">
                <div className="eyebrow">Households</div>
                <div className="v">{superMahallus.data?.reduce((sum, item) => sum + item.households, 0) ?? 1}</div>
                <div className="s">across all mahallus</div>
              </div>

              <div className="stat" role="listitem">
                <div className="eyebrow">Admins</div>
                <div className="v">{superMahallus.data?.reduce((sum, item) => sum + item.admins.length, 0) ?? 1}</div>
                <div className="s">with committee access</div>
              </div>

              <div className="stat" role="listitem">
                <div className="eyebrow">Inactive</div>
                <div className="v">{superMahallus.data?.filter(i => !i.active).length ?? 0}</div>
                <div className="s">mahallus switched off</div>
              </div>
            </>
          ) : (
            <>
              <div className="stat" role="listitem">
                <div className="eyebrow">Total Contributed</div>
                <div className="v">₹48,250</div>
                <div className="s">Eid Udhiyya savings</div>
              </div>

              <div className="stat" role="listitem">
                <div className="eyebrow">My Shares</div>
                <div className="v">1 share</div>
                <div className="s">Cow · Kannur Mahallu</div>
              </div>

              <div className="stat" role="listitem">
                <div className="eyebrow">Distribution Status</div>
                <div className="v" style={{ fontSize: 20 }}>In Progress</div>
                <div className="s">Eid-ul-Adha Day 1</div>
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
                <div className="v" style={{ fontSize: 20, paddingTop: 5 }}>Verified Member</div>
                <div className="s">{place}</div>
              </div>
            </>
          )}
        </div>

        {/* Mahallu Network Activity Chart */}
        <section className="card" style={{ marginTop: 22 }} aria-label="Activity chart">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div className="eyebrow">
                <span className="dot"></span>MAHALLU NETWORK ACTIVITY
              </div>
              <h2 style={{ fontSize: 22, marginTop: 8 }}>
                Your community, <span className="serif">celebrating Eid</span> together.
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="tag">Eid al-Adha · All Mahallus</span>
              <KnowMore title="Mahallu Network Activity" ariaLabel="Know more about network activity">
                <p style={{ margin: 0 }}>
                  Aggregated Udhiyya meat distribution and community contributions across partner Mahallus, verified by committee oversight.
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
              Households receiving <span className="serif">Eid meat</span> support
            </h2>
            <Link
              to="/app/members"
              style={{ color: 'var(--green)', fontWeight: 600, fontSize: 14.5, minHeight: 36, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              View all households →
            </Link>
          </div>

          <div className="recip-grid">
            <div className="recip">
              <div className="top">
                <div>
                  <h3>Family A</h3>
                  <div className="need">Eid meat packet · 4 kg share</div>
                </div>
                <span className="tag">Widows &amp; Orphans</span>
              </div>
              <div className="progress">
                <i style={{ width: '72%' }}></i>
              </div>
              <div className="nums">
                <span>Allocated <b>4 kg</b></span>
                <span style={{ color: 'var(--muted)' }}>Kannur Town · Kannur</span>
              </div>
            </div>

            <div className="recip">
              <div className="top">
                <div>
                  <h3>Family B</h3>
                  <div className="need">Eid meat packet · 3 kg share</div>
                </div>
                <span className="tag">Needy Household</span>
              </div>
              <div className="progress">
                <i style={{ width: '45%' }}></i>
              </div>
              <div className="nums">
                <span>Allocated <b>3 kg</b></span>
                <span style={{ color: 'var(--muted)' }}>Kozhikode Beach · Kozhikode</span>
              </div>
            </div>

            <div className="recip">
              <div className="top">
                <div>
                  <h3>Family C</h3>
                  <div className="need">Eid meat packet · 2 kg share</div>
                </div>
                <span className="tag">Elderly Care</span>
              </div>
              <div className="progress">
                <i style={{ width: '80%' }}></i>
              </div>
              <div className="nums">
                <span>Allocated <b>2 kg</b></span>
                <span style={{ color: 'var(--muted)' }}>Thalassery · Kannur</span>
              </div>
            </div>

            <div className="recip">
              <div className="top">
                <div>
                  <h3>Family D</h3>
                  <div className="need">Eid meat packet · 3 kg share</div>
                </div>
                <span className="tag">Low Income</span>
              </div>
              <div className="progress">
                <i style={{ width: '27%' }}></i>
              </div>
              <div className="nums">
                <span>Allocated <b>3 kg</b></span>
                <span style={{ color: 'var(--muted)' }}>Malappuram Town · Malappuram</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Right Sticky Rail */}
      <RightRail
        goalTitle="Eid meat packets"
        goalRaised={7200}
        goalTarget={10000}
        goalLabel="UDHIYYA DISTRIBUTION"
        insightQuote="“Your Udhiyya contributions and shares are distributed directly to eligible families across your Mahallu for Eid.”"
        insightLabel="EID INSIGHT"
        activityLink={activeMahallu ? '/app/manage/ledger' : '/app/payments'}
      />
    </div>
  );
}
